-- ============================================================
-- Fix: Auto-create organization on signup + add missing RLS policies
-- ============================================================

-- 1. Add missing schools INSERT/UPDATE policies
CREATE POLICY "schools_insert" ON schools
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = current_user_org_id()
    AND current_user_role() IN ('sim_admin', 'sim_counselor', 'sim_threat_team', 'platform_admin')
  );

CREATE POLICY "schools_update" ON schools
  FOR UPDATE TO authenticated
  USING (
    organization_id = current_user_org_id()
    AND current_user_role() IN ('sim_admin', 'sim_counselor', 'sim_threat_team', 'platform_admin')
  )
  WITH CHECK (
    organization_id = current_user_org_id()
    AND current_user_role() IN ('sim_admin', 'sim_counselor', 'sim_threat_team', 'platform_admin')
  );

-- 2. Allow users to update their own profile (for org assignment)
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 3. Allow authenticated users to insert organizations (for auto-create)
CREATE POLICY "org_insert" ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (TRUE);

-- 4. Update handle_new_user to auto-create an org and assign it
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  -- Create a default organization for the new user
  INSERT INTO organizations (name, org_type)
  VALUES (
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email) || '''s Organization',
    'independent'
  )
  RETURNING id INTO new_org_id;

  -- Create the profile with the org attached
  INSERT INTO profiles (id, email, full_name, role, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'sim_admin'),
    new_org_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fix existing users: create org and assign for any profile with NULL organization_id
DO $$
DECLARE
  rec RECORD;
  new_org_id UUID;
BEGIN
  FOR rec IN SELECT id, full_name, email FROM profiles WHERE organization_id IS NULL
  LOOP
    INSERT INTO organizations (name, org_type)
    VALUES (rec.full_name || '''s Organization', 'independent')
    RETURNING id INTO new_org_id;

    UPDATE profiles SET organization_id = new_org_id, role = 'sim_admin' WHERE id = rec.id;
  END LOOP;
END $$;
