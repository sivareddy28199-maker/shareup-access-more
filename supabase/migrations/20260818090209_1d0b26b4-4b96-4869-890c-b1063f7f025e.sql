REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_verification_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prepare_rental_request() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prepare_rental() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prepare_review() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;