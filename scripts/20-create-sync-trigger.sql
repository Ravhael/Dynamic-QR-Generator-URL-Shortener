-- Function untuk sinkronisasi otomatis auth.users dan public.users
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS TRIGGER AS 
$sync_user$
BEGIN
  -- Jika INSERT di auth.users, buat record di public.users
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.users (auth_user_id, email, name, role, is_active, created_at)
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), 
      CASE 
        WHEN NEW.is_super_admin = true THEN 'admin'
        ELSE 'viewer'
      END,
      true,
      NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
      auth_user_id = NEW.id,
      name = COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      role = CASE 
        WHEN NEW.is_super_admin = true THEN 'admin'
        ELSE public.users.role
      END,
      updated_at = NOW();
    RETURN NEW;
  END IF;
  
  -- Jika UPDATE di auth.users, update public.users
  IF TG_OP = 'UPDATE' THEN
    UPDATE public.users 
    SET 
      email = NEW.email,
      name = COALESCE(NEW.raw_user_meta_data->>'name', name),
      role = CASE 
        WHEN NEW.is_super_admin = true THEN 'admin'
        ELSE role
      END,
      updated_at = NOW()
    WHERE auth_user_id = NEW.id;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$sync_user$
LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger untuk sync otomatis setelah INSERT/UPDATE di auth.users
CREATE OR REPLACE TRIGGER sync_user_profile_trigger
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile();

-- Grant permissions yang diperlukan
GRANT USAGE ON SCHEMA auth TO postgres;
GRANT SELECT ON auth.users TO postgres;
