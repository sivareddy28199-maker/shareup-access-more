-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
CREATE TYPE public.verification_status AS ENUM ('unverified','pending','verified','rejected');
CREATE TYPE public.request_status AS ENUM ('requested','approved','rejected','cancelled','paid');
CREATE TYPE public.rental_status AS ENUM ('paid','active','overdue','returned','completed','cancelled');

-- UPDATED AT helper
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- PROFILES (no FK to auth.users so seeded demo owners can exist)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text NOT NULL DEFAULT '',
  college text NOT NULL DEFAULT 'St. Joseph''s Girls College (SJGC)',
  department text,
  year int,
  phone text,
  avatar_url text,
  is_demo boolean NOT NULL DEFAULT false,
  verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT (id, full_name, college, avatar_url, is_demo, verification_status, created_at) ON public.profiles TO anon, authenticated;
GRANT INSERT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, college, department, year, phone, avatar_url, updated_at) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Full private profile for the signed-in user
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (id uuid, full_name text, college text, department text, year int, phone text, avatar_url text, verification_status public.verification_status, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.full_name, p.college, p.department, p.year, p.phone, p.avatar_url, p.verification_status, p.created_at
  FROM public.profiles p WHERE p.id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles read own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- STUDENT VERIFICATIONS
CREATE TABLE public.student_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  id_card_path text NOT NULL,
  student_id_number text,
  status public.verification_status NOT NULL DEFAULT 'pending',
  reviewer_notes text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
GRANT SELECT, INSERT ON public.student_verifications TO authenticated;
GRANT UPDATE ON public.student_verifications TO authenticated;
GRANT ALL ON public.student_verifications TO service_role;
ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verif read own or admin" ON public.student_verifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "verif insert own" ON public.student_verifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "verif update admin" ON public.student_verifications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- keep profile status in sync with latest verification row
CREATE OR REPLACE FUNCTION public.sync_verification_status() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET verification_status = NEW.status, updated_at = now() WHERE id = NEW.user_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER verif_sync AFTER INSERT OR UPDATE ON public.student_verifications
FOR EACH ROW EXECUTE FUNCTION public.sync_verification_status();

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'package',
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);

-- LISTINGS
CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_per_day numeric(10,2) NOT NULL CHECK (price_per_day >= 0),
  deposit numeric(10,2) NOT NULL DEFAULT 0 CHECK (deposit >= 0),
  item_condition text NOT NULL DEFAULT 'Good',
  location text NOT NULL DEFAULT 'SJGC Campus',
  college text NOT NULL DEFAULT 'St. Joseph''s Girls College (SJGC)',
  min_days int NOT NULL DEFAULT 1 CHECK (min_days >= 1),
  max_days int NOT NULL DEFAULT 30 CHECK (max_days >= 1),
  is_available boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX listings_category_idx ON public.listings(category_id);
CREATE INDEX listings_owner_idx ON public.listings(owner_id);
GRANT SELECT ON public.listings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings public read" ON public.listings FOR SELECT USING (true);
CREATE POLICY "listings insert own" ON public.listings FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND is_demo = false);
CREATE POLICY "listings update own" ON public.listings FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "listings delete own" ON public.listings FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE TRIGGER listings_touch BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- LISTING IMAGES
CREATE TABLE public.listing_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  url text NOT NULL,
  storage_path text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX listing_images_listing_idx ON public.listing_images(listing_id);
GRANT SELECT ON public.listing_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.listing_images TO authenticated;
GRANT ALL ON public.listing_images TO service_role;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "images public read" ON public.listing_images FOR SELECT USING (true);
CREATE POLICY "images write own listing" ON public.listing_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.owner_id = auth.uid()));

-- RENTAL REQUESTS
CREATE TABLE public.rental_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  renter_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days int NOT NULL,
  price_per_day numeric(10,2) NOT NULL,
  deposit numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL,
  message text,
  status public.request_status NOT NULL DEFAULT 'requested',
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rr_listing_idx ON public.rental_requests(listing_id);
CREATE INDEX rr_renter_idx ON public.rental_requests(renter_id);
CREATE INDEX rr_owner_idx ON public.rental_requests(owner_id);
GRANT SELECT, INSERT, UPDATE ON public.rental_requests TO authenticated;
GRANT ALL ON public.rental_requests TO service_role;
ALTER TABLE public.rental_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "requests read involved" ON public.rental_requests FOR SELECT TO authenticated
  USING (renter_id = auth.uid() OR owner_id = auth.uid());
CREATE POLICY "requests insert own" ON public.rental_requests FOR INSERT TO authenticated WITH CHECK (renter_id = auth.uid());
CREATE POLICY "requests update involved" ON public.rental_requests FOR UPDATE TO authenticated
  USING (renter_id = auth.uid() OR owner_id = auth.uid())
  WITH CHECK (renter_id = auth.uid() OR owner_id = auth.uid());
CREATE TRIGGER rr_touch BEFORE UPDATE ON public.rental_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- server-side validation of request pricing/dates + demo auto-approval
CREATE OR REPLACE FUNCTION public.prepare_rental_request() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE l public.listings;
BEGIN
  SELECT * INTO l FROM public.listings WHERE id = NEW.listing_id;
  IF l IS NULL THEN RAISE EXCEPTION 'Listing not found'; END IF;
  IF NOT l.is_available THEN RAISE EXCEPTION 'This item is not available right now'; END IF;
  IF l.owner_id = NEW.renter_id THEN RAISE EXCEPTION 'You cannot rent your own item'; END IF;
  IF NEW.end_date < NEW.start_date THEN RAISE EXCEPTION 'End date must be on or after start date'; END IF;

  NEW.owner_id := l.owner_id;
  NEW.days := (NEW.end_date - NEW.start_date) + 1;
  IF NEW.days < l.min_days THEN RAISE EXCEPTION 'Minimum rental is % day(s)', l.min_days; END IF;
  IF NEW.days > l.max_days THEN RAISE EXCEPTION 'Maximum rental is % day(s)', l.max_days; END IF;
  NEW.price_per_day := l.price_per_day;
  NEW.deposit := l.deposit;
  NEW.total_amount := (l.price_per_day * NEW.days) + l.deposit;

  IF EXISTS (
    SELECT 1 FROM public.rentals r
    WHERE r.listing_id = NEW.listing_id
      AND r.status IN ('paid','active','overdue')
      AND daterange(r.start_date, r.end_date, '[]') && daterange(NEW.start_date, NEW.end_date, '[]')
  ) THEN RAISE EXCEPTION 'Those dates are already booked for this item'; END IF;

  IF l.is_demo THEN
    NEW.status := 'approved';
    NEW.responded_at := now();
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER rr_prepare BEFORE INSERT ON public.rental_requests FOR EACH ROW EXECUTE FUNCTION public.prepare_rental_request();

-- RENTALS
CREATE TABLE public.rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE REFERENCES public.rental_requests(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  renter_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  rent_amount numeric(10,2) NOT NULL DEFAULT 0,
  deposit numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  status public.rental_status NOT NULL DEFAULT 'paid',
  paid_at timestamptz,
  collected_at timestamptz,
  returned_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rentals_renter_idx ON public.rentals(renter_id);
CREATE INDEX rentals_owner_idx ON public.rentals(owner_id);
GRANT SELECT, INSERT, UPDATE ON public.rentals TO authenticated;
GRANT ALL ON public.rentals TO service_role;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rentals read involved" ON public.rentals FOR SELECT TO authenticated
  USING (renter_id = auth.uid() OR owner_id = auth.uid());
CREATE POLICY "rentals insert renter" ON public.rentals FOR INSERT TO authenticated WITH CHECK (renter_id = auth.uid());
CREATE POLICY "rentals update involved" ON public.rentals FOR UPDATE TO authenticated
  USING (renter_id = auth.uid() OR owner_id = auth.uid())
  WITH CHECK (renter_id = auth.uid() OR owner_id = auth.uid());
CREATE TRIGGER rentals_touch BEFORE UPDATE ON public.rentals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- rental creation validation: request must be approved + no double booking
CREATE OR REPLACE FUNCTION public.prepare_rental() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE req public.rental_requests;
BEGIN
  SELECT * INTO req FROM public.rental_requests WHERE id = NEW.request_id FOR UPDATE;
  IF req IS NULL THEN RAISE EXCEPTION 'Rental request not found'; END IF;
  IF req.renter_id <> NEW.renter_id THEN RAISE EXCEPTION 'Not your rental request'; END IF;
  IF req.status <> 'approved' THEN RAISE EXCEPTION 'Owner approval is required before payment'; END IF;

  NEW.listing_id := req.listing_id;
  NEW.owner_id := req.owner_id;
  NEW.start_date := req.start_date;
  NEW.end_date := req.end_date;
  NEW.rent_amount := req.price_per_day * req.days;
  NEW.deposit := req.deposit;
  NEW.total_amount := req.total_amount;
  NEW.status := 'paid';
  NEW.paid_at := now();

  IF EXISTS (
    SELECT 1 FROM public.rentals r
    WHERE r.listing_id = NEW.listing_id
      AND r.status IN ('paid','active','overdue')
      AND daterange(r.start_date, r.end_date, '[]') && daterange(NEW.start_date, NEW.end_date, '[]')
  ) THEN RAISE EXCEPTION 'Those dates are already booked for this item'; END IF;

  UPDATE public.rental_requests SET status = 'paid', updated_at = now() WHERE id = NEW.request_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER rentals_prepare BEFORE INSERT ON public.rentals FOR EACH ROW EXECUTE FUNCTION public.prepare_rental();

-- DEMO PAYMENTS (clearly simulated)
CREATE TABLE public.demo_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid REFERENCES public.rentals(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.rental_requests(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL,
  rent_amount numeric(10,2) NOT NULL DEFAULT 0,
  deposit_amount numeric(10,2) NOT NULL DEFAULT 0,
  amount numeric(10,2) NOT NULL,
  method text NOT NULL DEFAULT 'demo_upi',
  status text NOT NULL DEFAULT 'succeeded',
  is_demo boolean NOT NULL DEFAULT true,
  reference text NOT NULL DEFAULT ('DEMO-' || upper(substr(md5(random()::text),1,10))),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.demo_payments TO authenticated;
GRANT ALL ON public.demo_payments TO service_role;
ALTER TABLE public.demo_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments read involved" ON public.demo_payments FOR SELECT TO authenticated
  USING (payer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.rentals r WHERE r.id = rental_id AND r.owner_id = auth.uid()));
CREATE POLICY "payments insert own" ON public.demo_payments FOR INSERT TO authenticated WITH CHECK (payer_id = auth.uid() AND is_demo = true);

-- REVIEWS
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  reviewee_id uuid NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rental_id, reviewer_id)
);
CREATE INDEX reviews_listing_idx ON public.reviews(listing_id);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews insert involved" ON public.reviews FOR INSERT TO authenticated WITH CHECK (reviewer_id = auth.uid());

CREATE OR REPLACE FUNCTION public.prepare_review() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.rentals;
BEGIN
  SELECT * INTO r FROM public.rentals WHERE id = NEW.rental_id;
  IF r IS NULL THEN RAISE EXCEPTION 'Rental not found'; END IF;
  IF r.status <> 'completed' THEN RAISE EXCEPTION 'You can review only after the rental is completed'; END IF;
  IF NEW.reviewer_id NOT IN (r.renter_id, r.owner_id) THEN RAISE EXCEPTION 'Only the renter or owner can review this rental'; END IF;
  NEW.listing_id := r.listing_id;
  NEW.reviewee_id := CASE WHEN NEW.reviewer_id = r.renter_id THEN r.owner_id ELSE r.renter_id END;
  RETURN NEW;
END; $$;
CREATE TRIGGER reviews_prepare BEFORE INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.prepare_review();

-- CATEGORY SEED
INSERT INTO public.categories (slug, name, icon, sort_order) VALUES
  ('books','Books','book-open',1),
  ('calculators','Calculators','calculator',2),
  ('bags','Bags','backpack',3),
  ('cameras','Cameras','camera',4),
  ('electronics','Electronics','laptop',5),
  ('sports','Sports Equipment','dumbbell',6),
  ('chargers','Chargers & Accessories','plug-zap',7),
  ('formal','Formal/Interview Items','shirt',8),
  ('tools','Tools','wrench',9),
  ('events','Event Equipment','speaker',10);
