-- ============================================================================
-- FinGlow Auto Profile Creation
-- Migration 003: Trigger for automatic profile creation on signup
-- ============================================================================

-- Function to create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, credits)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        1  -- 1 free credit for new users
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Log the new user creation
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (
        NEW.id,
        'user_created',
        'profile',
        NEW.id,
        jsonb_build_object(
            'email', NEW.email,
            'provider', NEW.raw_app_meta_data->>'provider',
            'initial_credits', 1
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Function to log credit changes for auditing
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_credit_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.credits IS DISTINCT FROM NEW.credits THEN
        INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
        VALUES (
            NEW.id,
            CASE 
                WHEN NEW.credits > OLD.credits THEN 'credits_added'
                ELSE 'credits_deducted'
            END,
            'profile',
            NEW.id,
            jsonb_build_object(
                'old_credits', OLD.credits,
                'new_credits', NEW.credits,
                'change', NEW.credits - OLD.credits
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_credit_change ON profiles;
CREATE TRIGGER on_credit_change
    AFTER UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.log_credit_change();