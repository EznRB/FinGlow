-- ============================================================================
-- FinGlow Security Hardening
-- Migration 004: Prevent manual credit tampering via RLS
-- ============================================================================

-- Function to protect credits from direct user updates
CREATE OR REPLACE FUNCTION public.protect_user_credits()
RETURNS TRIGGER AS $$
BEGIN
    -- If the role is 'authenticated' (direct client request),
    -- prevent changing the credits column.
    -- service_role (backend) and triggers can still change it.
    
    IF (current_setting('role') = 'authenticated') AND (OLD.credits IS DISTINCT FROM NEW.credits) THEN
        -- Allow the update BUT KEEP THE OLD CREDIT VALUE
        -- This is safer than throwing an error which might break other profile updates
        NEW.credits := OLD.credits;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the protection trigger
DROP TRIGGER IF EXISTS on_before_profile_update ON public.profiles;
CREATE TRIGGER on_before_profile_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.protect_user_credits();

-- Audit Log Security: Users should NOT be able to DELETE or UPDATE logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only view their own logs" ON public.audit_logs;
CREATE POLICY "Users can only view their own logs"
    ON public.audit_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Explicitly deny UPDATE/DELETE for authenticated users on audit_logs
DROP POLICY IF EXISTS "No log tampering" ON public.audit_logs;
CREATE POLICY "No log tampering"
    ON public.audit_logs FOR UPDATE OR DELETE
    USING (false);

-- Processed Webhooks Security: Only service_role can even see these
ALTER TABLE public.processed_webhooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only" ON public.processed_webhooks;
CREATE POLICY "Service role only"
    ON public.processed_webhooks FOR ALL
    USING (false); -- Returns nothing for everyone except service_role bypass
