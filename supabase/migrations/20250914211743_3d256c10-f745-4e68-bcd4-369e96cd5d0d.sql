-- Drop the overly permissive policy
DROP POLICY "Authenticated users can view physicians" ON public.physicians;

-- Create a secure policy that only allows admin and staff to view physician data
CREATE POLICY "Only admin and staff can view physicians" ON public.physicians
FOR SELECT TO authenticated 
USING (public.can_access_sensitive_data());