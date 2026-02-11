-- Enable Row-Level Security on notifications table
-- Security fix: Supabase advisory 2026-02-11
-- Ensures users can only access their own notifications

-- Enable RLS (prevents all access by default until policies are created)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if any (idempotent)
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;

-- SELECT policy: Users can only read their own notifications
CREATE POLICY "notifications_select_own" 
ON public.notifications 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- INSERT policy: Users can only create notifications for themselves
-- (typically notifications are created server-side, but allowing user insert for flexibility)
CREATE POLICY "notifications_insert_own" 
ON public.notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- UPDATE policy: Users can only update their own notifications (e.g., mark as read)
CREATE POLICY "notifications_update_own" 
ON public.notifications 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE policy: Users can delete their own notifications
CREATE POLICY "notifications_delete_own" 
ON public.notifications 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Performance optimization: Index on user_id for policy lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
ON public.notifications(user_id);

-- Add index on created_at for efficient sorting/filtering
CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON public.notifications(created_at DESC);

-- Grant usage to authenticated users (policies will control row access)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

-- Comment for documentation
COMMENT ON TABLE public.notifications IS 'User notifications with RLS enabled. Each user can only access their own notifications via auth.uid() policies.';
