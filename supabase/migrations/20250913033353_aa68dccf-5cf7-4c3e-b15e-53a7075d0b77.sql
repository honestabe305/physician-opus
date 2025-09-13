-- Drop the overly permissive policy
DROP POLICY "Authenticated users can view physicians" ON public.physicians;

-- Create a secure policy that only allows admin and staff to view physician data
CREATE POLICY "Only admin and staff can view physicians" ON public.physicians
FOR SELECT TO authenticated 
USING (public.get_current_user_role() IN ('admin', 'staff'));

-- Verify the security definer function exists and works properly
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;