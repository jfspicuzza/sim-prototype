-- SIM 2.0 Schema Migration
-- Creates all tables, indexes, RLS policies, and helper functions

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. TABLES
-- ============================================================

-- Organizations (districts, charters, independent schools)
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  org_type    VARCHAR(20) NOT NULL CHECK (org_type IN ('district', 'charter', 'independent')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schools belonging to an organization
CREATE TABLE schools (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  city            VARCHAR(100),
  state           VARCHAR(2),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profiles (extends auth.users)
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           VARCHAR(255) NOT NULL,
  full_name       VARCHAR(255) NOT NULL,
  role            VARCHAR(30) NOT NULL CHECK (role IN (
                    'platform_admin', 'sim_admin', 'sim_counselor',
                    'sim_threat_team', 'sim_principal'
                  )),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  school_id       UUID REFERENCES schools(id) ON DELETE SET NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Students
CREATE TABLE students (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  school_id       UUID REFERENCES schools(id) ON DELETE SET NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  grade           VARCHAR(5),
  student_ext_id  VARCHAR(50),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Signals (individual data points feeding the indices)
CREATE TABLE signals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category      VARCHAR(50) NOT NULL,
  index_type    VARCHAR(4) NOT NULL CHECK (index_type IN ('SSI', 'TRCI')),
  base_score    NUMERIC(3,1) NOT NULL CHECK (base_score >= 0 AND base_score <= 5),
  source_type   VARCHAR(20) NOT NULL CHECK (source_type IN (
                  'teacher', 'admin', 'counselor', 'student', 'parent',
                  'anonymous', 'system', 'evidence', 'law_enforcement'
                )),
  evidence_flag BOOLEAN NOT NULL DEFAULT FALSE,
  free_text     TEXT,
  reported_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Snapshots (point-in-time index computations for a student)
CREATE TABLE snapshots (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ssi_value   NUMERIC(4,2) NOT NULL DEFAULT 0,
  ssi_state   VARCHAR(2) NOT NULL DEFAULT 'S0' CHECK (ssi_state IN ('S0', 'S1', 'S2', 'S3', 'S4')),
  trci_value  NUMERIC(4,2) NOT NULL DEFAULT 0,
  trci_state  VARCHAR(2) NOT NULL DEFAULT 'C0' CHECK (trci_state IN ('C0', 'C1', 'C2', 'C3', 'C4')),
  ssi_trend   VARCHAR(20) NOT NULL DEFAULT 'stable' CHECK (ssi_trend IN ('improving', 'stable', 'rising', 'rising_rapidly')),
  trci_trend  VARCHAR(20) NOT NULL DEFAULT 'stable' CHECK (trci_trend IN ('improving', 'stable', 'rising', 'rising_rapidly')),
  confidence  NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  is_current  BOOLEAN NOT NULL DEFAULT TRUE,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Category-level scores within a snapshot
CREATE TABLE category_scores (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  snapshot_id  UUID REFERENCES snapshots(id) ON DELETE CASCADE,
  category     VARCHAR(50) NOT NULL,
  index_type   VARCHAR(4) NOT NULL CHECK (index_type IN ('SSI', 'TRCI')),
  score        NUMERIC(4,2) NOT NULL,
  signal_count INTEGER NOT NULL DEFAULT 0,
  computed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Explanations (XAI narrative for a snapshot)
CREATE TABLE explanations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_id      UUID NOT NULL REFERENCES snapshots(id) ON DELETE CASCADE,
  top_drivers      JSONB NOT NULL DEFAULT '[]'::jsonb,
  threshold_events JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary_text     TEXT NOT NULL DEFAULT '',
  expanded_text    TEXT,
  computed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Immutable audit log
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id         UUID,
  user_email      VARCHAR(255) NOT NULL,
  user_role       VARCHAR(30) NOT NULL,
  organization_id UUID,
  entity_type     VARCHAR(50) NOT NULL,
  entity_id       UUID,
  action          VARCHAR(50) NOT NULL,
  old_value       TEXT,
  new_value       TEXT,
  metadata        JSONB
);

-- Make audit_log immutable
CREATE RULE no_delete_audit_log AS ON DELETE TO audit_log DO INSTEAD NOTHING;
CREATE RULE no_update_audit_log AS ON UPDATE TO audit_log DO INSTEAD NOTHING;

-- ============================================================
-- 3. HELPER FUNCTIONS (for RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION current_user_org_id() RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_platform_admin() RETURNS BOOLEAN AS $$
  SELECT current_user_role() = 'platform_admin';
$$ LANGUAGE sql STABLE;

-- ============================================================
-- 4. UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_schools_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 5. HANDLE NEW USER TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'sim_counselor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 6. INDEXES
-- ============================================================

CREATE INDEX idx_students_org ON students(organization_id);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_signals_student ON signals(student_id);
CREATE INDEX idx_signals_created ON signals(created_at DESC);
CREATE INDEX idx_signals_category ON signals(category);
CREATE INDEX idx_snapshots_student ON snapshots(student_id);
CREATE INDEX idx_snapshots_current ON snapshots(student_id, is_current) WHERE is_current = TRUE;
CREATE INDEX idx_snapshots_computed ON snapshots(computed_at DESC);
CREATE INDEX idx_category_scores_snapshot ON category_scores(snapshot_id);
CREATE INDEX idx_explanations_snapshot ON explanations(snapshot_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE organizations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools          ENABLE ROW LEVEL SECURITY;
ALTER TABLE students         ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots        ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_scores  ENABLE ROW LEVEL SECURITY;
ALTER TABLE explanations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log        ENABLE ROW LEVEL SECURITY;

-- ---------- organizations ----------
CREATE POLICY "org_select" ON organizations
  FOR SELECT TO authenticated
  USING (id = current_user_org_id() OR is_platform_admin());

-- ---------- profiles ----------
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_select_org" ON profiles
  FOR SELECT TO authenticated
  USING (organization_id = current_user_org_id() OR is_platform_admin());

-- ---------- schools ----------
CREATE POLICY "schools_select" ON schools
  FOR SELECT TO authenticated
  USING (organization_id = current_user_org_id() OR is_platform_admin());

-- ---------- students ----------
CREATE POLICY "students_select" ON students
  FOR SELECT TO authenticated
  USING (organization_id = current_user_org_id() OR is_platform_admin());

CREATE POLICY "students_insert" ON students
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = current_user_org_id()
    AND current_user_role() IN ('sim_admin', 'sim_counselor', 'sim_threat_team', 'platform_admin')
  );

CREATE POLICY "students_update" ON students
  FOR UPDATE TO authenticated
  USING (
    organization_id = current_user_org_id()
    AND current_user_role() IN ('sim_admin', 'sim_counselor', 'sim_threat_team', 'platform_admin')
  )
  WITH CHECK (
    organization_id = current_user_org_id()
    AND current_user_role() IN ('sim_admin', 'sim_counselor', 'sim_threat_team', 'platform_admin')
  );

-- ---------- signals ----------
CREATE POLICY "signals_select" ON signals
  FOR SELECT TO authenticated
  USING (organization_id = current_user_org_id() OR is_platform_admin());

CREATE POLICY "signals_insert" ON signals
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = current_user_org_id()
    AND current_user_role() IN ('sim_admin', 'sim_counselor', 'sim_threat_team', 'platform_admin')
  );

-- ---------- snapshots ----------
CREATE POLICY "snapshots_select" ON snapshots
  FOR SELECT TO authenticated
  USING (organization_id = current_user_org_id() OR is_platform_admin());

CREATE POLICY "snapshots_insert" ON snapshots
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = current_user_org_id()
    AND current_user_role() IN ('sim_admin', 'sim_counselor', 'sim_threat_team', 'platform_admin')
  );

-- ---------- category_scores ----------
CREATE POLICY "category_scores_select" ON category_scores
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM students WHERE organization_id = current_user_org_id()
    )
    OR is_platform_admin()
  );

CREATE POLICY "category_scores_insert" ON category_scores
  FOR INSERT TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE organization_id = current_user_org_id()
    )
    AND current_user_role() IN ('sim_admin', 'sim_counselor', 'sim_threat_team', 'platform_admin')
  );

-- ---------- explanations ----------
CREATE POLICY "explanations_select" ON explanations
  FOR SELECT TO authenticated
  USING (
    snapshot_id IN (
      SELECT id FROM snapshots WHERE organization_id = current_user_org_id()
    )
    OR is_platform_admin()
  );

CREATE POLICY "explanations_insert" ON explanations
  FOR INSERT TO authenticated
  WITH CHECK (
    snapshot_id IN (
      SELECT id FROM snapshots WHERE organization_id = current_user_org_id()
    )
    AND current_user_role() IN ('sim_admin', 'sim_counselor', 'sim_threat_team', 'platform_admin')
  );

-- ---------- audit_log ----------
CREATE POLICY "audit_log_select" ON audit_log
  FOR SELECT TO authenticated
  USING (
    current_user_role() IN ('sim_admin', 'platform_admin')
    AND (organization_id = current_user_org_id() OR is_platform_admin())
  );

CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT TO authenticated
  WITH CHECK (TRUE);
