REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_verification_status() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prepare_rental_request() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prepare_rental() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prepare_review() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated, service_role;