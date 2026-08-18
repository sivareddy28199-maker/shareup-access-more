# Share Up Rentals

Build a production-quality, mobile-first rental marketplace web app called SHAREUP with tagline “OWN LESS, ACCESS MORE”. Create a simple distinctive icon logo for SHAREUP. This is the competition MVP, but make it fully functional and real using Supabase for authentication, database, and storage. The user has already connected Supabase in Lovable; use the connected Supabase backend rather than mock-only state or localStorage for persistent data.

SCOPE: Rental only for now. Do NOT implement selling, swapping, or borrowing in this version.

TARGET: Start with SJGC students, but architect it so the marketplace can expand to other colleges later.

CORE FLOW: Browse → View Item → Request Rental → Owner Approves → Demo Payment/Deposit → Collect → Return → Review. Payment is DEMO ONLY for the competition; clearly label it as demo and do not integrate real payment processing.

AUTH/VERIFICATION: Real signup/login. Users must upload a student ID card for verification. Do not provide alternative verification methods. Store the ID securely in Supabase Storage and verification metadata in Supabase. Include verification status and an admin/manual verification path appropriate for an MVP. Never expose uploaded ID files publicly. Include profile fields for name, college, department, year, phone as appropriate. Keep private user data protected with Supabase RLS.

USER FEATURES: Browse rental listings; search; category filters; sort; item detail pages; availability; owner-set rental price; rental duration; request rental; owner approval/rejection; demo deposit/payment step; active/upcoming/completed rentals; return workflow; reviews after completed rentals; owner dashboard with listed items, rental requests, active rentals and earnings; renter dashboard; profile; student verification status; plus (+) action prominently available so a user can add/list an item at any time. Include create/edit/delete listing functionality with image upload to Supabase Storage.

CATEGORIES: Books, Calculators, Bags, Cameras, Electronics, Sports Equipment, Chargers & Accessories, Formal/Interview Items, Tools, Event Equipment.

DESIGN: Clean, premium Indian e-commerce marketplace inspired by the usability and polish of Flipkart and Myntra, but do not copy their branding, proprietary assets, or exact layouts. Light theme. Mobile-first and fully responsive desktop. White surfaces, deep navy/blue primary, subtle green for success states, rounded cards, excellent spacing, strong typography, large product imagery, sticky mobile bottom navigation where appropriate, polished hover/press states, tasteful micro-animations, skeleton loading, empty states, validation, toast feedback. Keep it clean rather than overdesigned. Use accessible components.

PAGES/IA: Home with search, categories, featured/nearby rentals and clear “List an Item” CTA; Explore Rentals with filters and sorting; Item Details; List Your Item; Edit Listing; My Rentals with current/upcoming/completed tabs; Owner Dashboard; Profile; Login; Signup; Student ID Verification; Rental Request/Checkout Demo; Rental Details/Return; Reviews. Add appropriate protected routes.

HOME HERO: Communicate the value proposition: “Why buy what you only need temporarily?” and “OWN LESS, ACCESS MORE”. Prominent search and Browse Rentals / List an Item actions.

DEMO DATA: Seed realistic demo listings relevant to SJGC/college students: Casio scientific calculator, R.S. Aggarwal Quantitative Aptitude, B.Com textbooks, DSLR camera, projector, cricket kit, formal blazer, power bank, chargers, sports equipment, event equipment, bags. Use realistic INR/day prices and deposits. Make the app visibly populated on first load. Clearly distinguish seeded demo listings from real user listings if needed.

IMPORTANT BACKEND REQUIREMENTS: Use Supabase Auth, Postgres tables, Storage, and RLS. Design normalized tables for profiles, student_verifications, categories, listings, listing_images, rental_requests, rentals, demo_payments, reviews, and any supporting availability/status tables needed. Owners can CRUD only their own listings. Users can create/view their own rental requests and rentals, while owners can view requests for their own listings. Reviews only after completed rentals and only by the renter/owner involved as appropriate. Protect student ID documents. Prevent obvious double-booking with server-side/database validation or safe transaction logic. Store all important timestamps/status transitions. Never hard-code credentials or secrets. Include proper error handling.

BUSINESS LOGIC: Owners set their own rental price and security deposit. Show price per day and estimated total. Support rental start/end dates. Owner must approve before the demo payment step. Demo payment records a successful simulated payment only; make it obvious it is not a real charge. Rental progresses through requested → approved/rejected → demo_paid → active/collected → returned → completed/cancelled as appropriate. Include overdue state if useful. After return, allow review and rating.

QUALITY BAR: This should feel like a real startup MVP, not a static prototype. Use real Supabase persistence, real auth, real image uploads, real CRUD, real rental state transitions, and RLS. Avoid placeholder buttons that do nothing. If an advanced feature cannot be safely implemented, provide a sensible working fallback and explain it. Build with maintainable TypeScript/React/Tailwind/shadcn conventions. Seed the demo catalog in a way that does not compromise RLS or user-owned data.

Do not add AI features, chat, payments, selling, swapping, or unrelated functionality in this version. Focus on making the rental marketplace exceptionally polished and functional.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://shareup-access-more.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/db2c5652-de26-4271-8d8d-b4a657bf33cf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
