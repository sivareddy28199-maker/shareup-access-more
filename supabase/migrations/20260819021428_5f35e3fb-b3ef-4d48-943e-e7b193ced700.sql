REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, college, avatar_url, is_demo, verification_status, created_at) ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;