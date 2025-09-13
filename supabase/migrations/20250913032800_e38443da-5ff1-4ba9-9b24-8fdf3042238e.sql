-- Drop existing types if they exist and recreate
DROP TYPE IF EXISTS public.gender_type CASCADE;
DROP TYPE IF EXISTS public.document_type CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Create enum types for better data consistency
CREATE TYPE public.gender_type AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE public.document_type AS ENUM (
  'drivers_license', 'social_security_card', 'dea_certificate', 'npi_confirmation',
  'w9_form', 'liability_insurance', 'medical_license', 'board_certification',
  'controlled_substance_registration', 'medical_diploma', 'residency_certificate',
  'fellowship_certificate', 'hospital_privilege_letter', 'employment_verification',
  'malpractice_insurance', 'npdb_report', 'cv', 'immunization_records', 'citizenship_proof'
);
CREATE TYPE public.user_role AS ENUM ('admin', 'staff', 'viewer');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create physicians table
CREATE TABLE public.physicians (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_legal_name TEXT NOT NULL,
  date_of_birth DATE,
  gender gender_type,
  ssn TEXT, -- encrypted sensitive data
  npi TEXT UNIQUE,
  tin TEXT, -- encrypted sensitive data
  dea_number TEXT,
  caqh_id TEXT,
  
  -- Contact Information
  home_address TEXT, -- encrypted sensitive data
  mailing_address TEXT,
  phone_numbers TEXT[], -- array for multiple phone numbers
  email_address TEXT,
  emergency_contact JSONB, -- {name, phone, relationship}
  
  -- Practice Information
  practice_name TEXT,
  primary_practice_address TEXT,
  secondary_practice_addresses TEXT[], -- array for multiple addresses
  office_phone TEXT,
  office_fax TEXT,
  office_contact_person TEXT,
  group_npi TEXT,
  group_tax_id TEXT, -- encrypted sensitive data
  
  -- Insurance & Liability
  malpractice_carrier TEXT,
  malpractice_policy_number TEXT,
  coverage_limits TEXT,
  malpractice_expiration_date DATE,
  
  -- Status and metadata
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create licensure table
CREATE TABLE public.physician_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  physician_id UUID NOT NULL REFERENCES public.physicians(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  license_number TEXT NOT NULL,
  expiration_date DATE NOT NULL,
  license_type TEXT DEFAULT 'medical',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(physician_id, state, license_number)
);

-- Create board certifications table
CREATE TABLE public.physician_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  physician_id UUID NOT NULL REFERENCES public.physicians(id) ON DELETE CASCADE,
  specialty TEXT NOT NULL,
  subspecialty TEXT,
  board_name TEXT NOT NULL,
  certification_date DATE,
  expiration_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create education table
CREATE TABLE public.physician_education (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  physician_id UUID NOT NULL REFERENCES public.physicians(id) ON DELETE CASCADE,
  education_type TEXT NOT NULL, -- 'medical_school', 'residency', 'fellowship'
  institution_name TEXT NOT NULL,
  specialty TEXT,
  location TEXT,
  start_date DATE,
  completion_date DATE,
  graduation_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create work history table
CREATE TABLE public.physician_work_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  physician_id UUID NOT NULL REFERENCES public.physicians(id) ON DELETE CASCADE,
  employer_name TEXT NOT NULL,
  position TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  address TEXT,
  supervisor_name TEXT,
  reason_for_leaving TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hospital affiliations table
CREATE TABLE public.physician_hospital_affiliations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  physician_id UUID NOT NULL REFERENCES public.physicians(id) ON DELETE CASCADE,
  hospital_name TEXT NOT NULL,
  privileges TEXT[],
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create compliance disclosures table
CREATE TABLE public.physician_compliance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  physician_id UUID NOT NULL REFERENCES public.physicians(id) ON DELETE CASCADE,
  license_revocations BOOLEAN DEFAULT FALSE,
  license_revocations_explanation TEXT,
  pending_investigations BOOLEAN DEFAULT FALSE,
  pending_investigations_explanation TEXT,
  malpractice_claims BOOLEAN DEFAULT FALSE,
  malpractice_claims_explanation TEXT,
  medicare_sanctions BOOLEAN DEFAULT FALSE,
  medicare_sanctions_explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table for file uploads
CREATE TABLE public.physician_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  physician_id UUID NOT NULL REFERENCES public.physicians(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  is_sensitive BOOLEAN DEFAULT TRUE,
  uploaded_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

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

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create security definer function to check if user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create security definer function to check if user can access sensitive data
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

-- RLS Policies for related tables
CREATE POLICY "Authenticated users can view licenses" ON public.physician_licenses
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff and admins can manage licenses" ON public.physician_licenses
FOR ALL TO authenticated 
USING (public.get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can view certifications" ON public.physician_certifications
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff and admins can manage certifications" ON public.physician_certifications
FOR ALL TO authenticated 
USING (public.get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can view education" ON public.physician_education
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff and admins can manage education" ON public.physician_education
FOR ALL TO authenticated 
USING (public.get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can view work history" ON public.physician_work_history
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff and admins can manage work history" ON public.physician_work_history
FOR ALL TO authenticated 
USING (public.get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Authenticated users can view affiliations" ON public.physician_hospital_affiliations
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff and admins can manage affiliations" ON public.physician_hospital_affiliations
FOR ALL TO authenticated 
USING (public.get_current_user_role() IN ('admin', 'staff'));

-- Sensitive data policies
CREATE POLICY "Only staff and admins can access compliance data" ON public.physician_compliance
FOR ALL TO authenticated 
USING (public.can_access_sensitive_data());

CREATE POLICY "Only staff and admins can access documents" ON public.physician_documents
FOR ALL TO authenticated 
USING (public.can_access_sensitive_data());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_physicians_updated_at
BEFORE UPDATE ON public.physicians
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    'staff'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for performance
CREATE INDEX idx_physicians_npi ON public.physicians(npi);
CREATE INDEX idx_physicians_status ON public.physicians(status);
CREATE INDEX idx_physician_licenses_physician_id ON public.physician_licenses(physician_id);
CREATE INDEX idx_physician_documents_physician_id ON public.physician_documents(physician_id);