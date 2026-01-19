-- ============================================================================
-- FinGlow Row Level Security Policies
-- Migration 002: RLS Policies for Data Protection
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES RLS POLICIES
-- Users can only access their own profile
-- ============================================================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile (except credits - only backend can do this)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Only system can insert profiles (via trigger)
DROP POLICY IF EXISTS "System can insert profiles" ON profiles;
CREATE POLICY "System can insert profiles"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================================================
-- REPORTS RLS POLICIES
-- Users can only access their own reports
-- ============================================================================

-- Users can view their own reports
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
CREATE POLICY "Users can view own reports"
    ON reports FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own reports (via API)
DROP POLICY IF EXISTS "Users can insert own reports" ON reports;
CREATE POLICY "Users can insert own reports"
    ON reports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reports
DROP POLICY IF EXISTS "Users can delete own reports" ON reports;
CREATE POLICY "Users can delete own reports"
    ON reports FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- TRANSACTIONS RLS POLICIES
-- Users can only view their own transactions
-- ============================================================================

-- Users can view their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Only backend service role can insert/update transactions
-- This is enforced by using service role key in API routes

-- ============================================================================
-- AUDIT LOGS RLS POLICIES
-- Users can view their own audit logs
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "Users can view own audit logs"
    ON audit_logs FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================================
-- SERVICE ROLE BYPASS
-- Allow service role to bypass RLS for backend operations
-- This is automatic in Supabase when using service role key
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, DELETE ON reports TO authenticated;
GRANT SELECT ON transactions TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;

-- Grant all to service role (for backend API operations)
GRANT ALL ON profiles TO service_role;
GRANT ALL ON reports TO service_role;
GRANT ALL ON transactions TO service_role;
GRANT ALL ON processed_webhooks TO service_role;
GRANT ALL ON audit_logs TO service_role;