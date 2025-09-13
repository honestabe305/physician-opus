-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.can_access_sensitive_data();

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physician_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physician_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physician_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physician_work_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physician_hospital_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physician_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physician_documents ENABLE ROW LEVEL SECURITY;

-- Create security definer functions
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_access_sensitive_data()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL USING (public.is_admin());

-- RLS Policies for physicians table
CREATE POLICY "Authenticated users can view physicians" ON public.physicians
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff and admins can create physicians" ON public.physicians
FOR INSERT TO authenticated 
WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Staff and admins can update physicians" ON public.physicians
FOR UPDATE TO authenticated 
USING (public.get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Only admins can delete physicians" ON public.physicians
FOR DELETE TO authenticated 
USING (public.is_admin());

-- RLS Policies for physician_licenses table
CREATE POLICY "Authenticated users can view licenses" ON public.physician_licenses
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff and admins can manage licenses" ON public.physician_licenses
FOR ALL TO authenticated 
USING (public.get_current_user_role() IN ('admin', 'staff'));

-- RLS Policies for physician_certifications table
CREATE POLICY "Authenticated users can view certifications" ON public.physician_certifications
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff and admins can manage certifications" ON public.physician_certifications
FOR ALL TO authenticated 
USING (public.get_current_user_role() IN ('admin', 'staff'));

-- RLS Policies for physician_education table
CREATE POLICY "Authenticated users can view education" ON public.physician_education
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff and admins can manage education" ON public.physician_education
FOR ALL TO authenticated 
USING (public.get_current_user_role() IN ('admin', 'staff'));

-- RLS Policies for physician_work_history table
CREATE POLICY "Authenticated users can view work history" ON public.physician_work_history
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff and admins can manage work history" ON public.physician_work_history
FOR ALL TO authenticated 
USING (public.get_current_user_role() IN ('admin', 'staff'));

-- RLS Policies for physician_hospital_affiliations table
CREATE POLICY "Authenticated users can view affiliations" ON public.physician_hospital_affiliations
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff and admins can manage affiliations" ON public.physician_hospital_affiliations
FOR ALL TO authenticated 
USING (public.get_current_user_role() IN ('admin', 'staff'));

-- RLS Policies for physician_compliance table (sensitive data)
CREATE POLICY "Only staff and admins can access compliance data" ON public.physician_compliance
FOR ALL TO authenticated 
USING (public.can_access_sensitive_data());

-- RLS Policies for physician_documents table (very sensitive)
CREATE POLICY "Only staff and admins can access documents" ON public.physician_documents
FOR ALL TO authenticated 
USING (public.can_access_sensitive_data());