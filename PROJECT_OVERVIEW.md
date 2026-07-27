# Borrowed — Project Overview

> **Borrowed** is a trusted peer‑to‑peer (P2P) lending & borrowing marketplace, positioned as *"Bangladesh's First Trusted Peer‑to‑Peer Platform."* People lend out items they own but don't always use, and borrow what they need from neighbours — instead of buying. The platform's whole reason to exist is **trust between strangers**, so a large part of the system is dedicated to identity verification, condition tracking, AI damage detection, reviews, disputes, and moderation.

This document explains *what the project is*, *how it's built*, *every data entity*, and *every end‑to‑end flow*, so a new reader can understand the whole system without reading the code first.

---

## 1. What the product does (in plain words)

A user can play several roles at once:

- **Lender** — lists an item they own ("Lent Item") and rents it out per day.
- **Borrower** — browses items, adds them to a cart, and requests to borrow them; or posts a "want ad" ("Borrow Request") describing what they need and lets lenders come to them.
- **Mentor** — an expert who offers paid 1‑on‑1 sessions (video or in‑person) in a category.
- **Admin** — staff who moderate users, resolve disputes over deposits, handle reports, and manage listings.

Around those roles the platform layers:

- **Identity & trust** — email, phone, ID‑document + selfie face match, address, and meetup verification, all rolled into a **Trust Score** out of 100.
- **Condition safety** — a "before" photo at handoff and an "after" photo at return, compared by **AI (Google Gemini)** to flag possible damage.
- **Social proof** — a public **Item Trail** (a feed of how an item has been used by past borrowers, with reactions and auto‑earned badges) and a two‑way **review** system.
- **Dispute resolution** — if a lender claims damage, a structured dispute is opened and an admin decides how the deposit is split.
- **Real‑time messaging** — Socket.io chat between borrower and lender, including item‑sharing and dispute context.
- **Emergency / SOS borrow** — geo‑radius broadcast to nearby lenders when someone urgently needs something.
- **Mentorship** — book sessions with category experts.

---

## ✨ Features (capability checklist)

A complete list of what the platform can do today, grouped by area.

**Accounts & authentication**
- Email/username + password sign‑up with bcrypt‑hashed passwords and validation (username ≥ 3, password ≥ 6).
- Social login via **Google** and **Facebook**.
- JWT sessions that carry derived role flags (`isMentor`, `isAdmin`) for instant authorization.

**Identity & trust**
- Six‑factor trust model: email, contact/phone, ID document, identity (face), address, and meet‑up verification.
- **AI face match** between the uploaded ID photo and a selfie (face‑api.js + TensorFlow); auto‑verifies the user at a similarity score **≥ 70**.
- **Trust Score out of 100** with a transparent per‑factor breakdown (verification factors + review history).
- Reporting & moderation hooks so untrustworthy users surface to admins.

**Items & listings**
- Reusable **Product** records across **16 categories** (with subcategories) — Tools, Photography, Music, Tech, Gaming, Outdoor, Sports, Art, Kitchen, Events, Baby, Garden, Automotive, Education, Home, Fashion.
- Multi‑image uploads per item, per‑day pricing, deposit, compensation notes, and features/drawbacks lists.
- **Relisting**: an item can be lent again after it's returned (only one active listing at a time).
- Listing lifecycle: `active` → `borrowed` → back to `active`.

**Two‑sided borrowing marketplace**
- **Supply side (Side A)**: browse → add to **cart** (choose number of days) → checkout (creates a borrow request per item).
- **Demand side (Side B)**: post a **Borrow Request** "want‑ad" → lenders send **offers** → borrower accepts one (others auto‑rejected, request marked fulfilled).
- **Private/targeted** borrow requests aimed at a specific user.
- A single unified **BorrowCheckout** record regardless of which side it originated from.

**Discovery & search**
- Category/subcategory browsing.
- **AI natural‑language search** — Gemini expands queries like *"something to film a wedding"* into keywords + categories, with a graceful keyword‑only fallback.
- Location‑aware discovery via maps.

**Condition safety & AI damage detection**
- Mandatory **"before" photo** captured by the lender at handoff.
- Mandatory **"after" photo** captured by the borrower at return.
- **AI damage detection (Gemini)** compares the two, deliberately ignoring lighting/angle/background, and returns a verdict + confidence + notes.
- Damage warnings are surfaced in the lender's notification and auto‑attached to any dispute.
- Fully **degrades gracefully** — borrowing works even with no AI key configured.

**Social proof & reputation**
- Public **Item Trail** feed per product (how past borrowers used it).
- **Auto‑earned badges**: Wedding Veteran, Adventure Gear, Creator's Favourite, Well‑Travelled (≥ 3 places), Popular Item (≥ 5 borrows).
- **Reactions** on trail entries, and an **anonymous** posting option.
- **Two‑way reviews**: lenders rate borrowers (1–5 + comment); borrower ratings are aggregated.

**Disputes & deposit resolution**
- Lenders can open a **dispute** on a returned item.
- Disputes auto‑inherit the before/after photos, the AI verdict, and the **copied chat history** between the two parties.
- Admin resolution with three outcomes — **release to lender / return to borrower / split** — plus a required written justification.
- Append‑only **dispute event timeline**.

**Real‑time messaging**
- **Live 1‑to‑1 chat** over Socket.io (no polling), JWT‑authenticated.
- **Item sharing** inside chat and dispute‑context conversations.
- Content validation (≤ 1000 chars) and **rate limiting** (8 messages / 10s).
- Unread message counts.

**Emergency / SOS borrow**
- One‑tap broadcast that finds nearby lenders within a chosen **1–50 km radius** (Haversine distance) who have a matching active item, and notifies them with a deep link into chat.

**Mentorship**
- Mentor profiles (category, specialty, bio, tags, pricing, availability, response time).
- Book **video or in‑person** sessions with a schedule and goals.

**Notifications**
- In‑app notifications for every key event (new request, accepted, returned, dispute, emergency, mentor booking, etc.).
- Notification bell, mark‑read / mark‑all‑read, and a dashboard "recent activity" feed.

**Location & maps**
- Leaflet‑based **map location picker**, geocoding, and distance‑aware features.

**Dashboards**
- Personal dashboard with live counts (listings, active borrows, unread messages, cart) and a **due‑date tracker** (due today / due soon / safe).
- Dedicated views for my items, my borrows, requests, cart, messages, and profile.

**Admin & moderation**
- User management, including viewing a user's stored **ID images**.
- **Dispute console**, **reports console** (user‑to‑user reports), and **listing/product moderation**.
- Ability to remove abusive trail entries.

**Platform engineering features**
- Images stored in‑DB as blobs and streamed through dedicated routes.
- **Transactional integrity** on every multi‑row state change.
- Per‑route authorization and ownership checks.
- Single Node process serving **both** Next.js and the WebSocket server.

---

## 2. Technology stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16.2.4** (App Router) + **React 19** — *note: this repo uses a modified Next.js; see `AGENTS.md`* |
| Language | TypeScript |
| Custom server | `server.mjs` — a Node `http` server that wraps Next.js **and** runs a Socket.io server on the same port (path `/api/socket`) |
| Database | **MySQL** via **Prisma 5** (client generated to `lib/generated/prisma`) |
| Auth | **NextAuth v5 (beta)** with Prisma adapter, JWT sessions; Credentials + Google + Facebook providers |
| Real‑time | **Socket.io** (server + client) for live chat and notifications |
| AI — damage & search | **Google Gemini** (`gemini-2.5-flash`) via `@google/generative-ai` |
| AI — face match | **face-api.js** + **TensorFlow.js** + **node-canvas** for ID‑selfie face verification (runs server‑side) |
| Maps | **Leaflet** + **react-leaflet** for location picking and display |
| Styling | **Tailwind CSS v4** |
| UI bits | **lucide-react** icons, **react-hot-toast** notifications |
| Passwords | **bcrypt** |
| Tests | **Vitest** |

**Scripts** (`package.json`): `dev`/`start` run `node server.mjs`; `build` runs `next build`; `db:seed` seeds the DB; `download:face-models` fetches the face‑api model weights; `test` runs Vitest.

---

## 3. High‑level architecture

```
                         server.mjs (Node http)
                ┌──────────────────────────────────────────┐
   Browser ───► │  Next.js request handler (App Router)      │
                │    • Server Components / pages             │
                │    • /app/api/** Route Handlers (REST)     │
                │                                            │
   Socket  ───► │  Socket.io server (path /api/socket)       │
                │    • JWT‑authenticated                     │
                │    • rooms: user:<id>, conversation:<id>   │
                └──────────────────────────────────────────┘
                                 │
                                 ▼
                        Prisma  ──►  MySQL
                                 │
                 ┌───────────────┴────────────────┐
                 ▼                                 ▼
         Google Gemini API                 face-api.js / TF.js
       (damage + search AI)              (ID ↔ selfie face match)
```

**Why a custom server?** A normal Next.js app can't easily host a long‑lived WebSocket server. `server.mjs` creates the HTTP server itself, hands all non‑`/api/socket` requests to Next.js, and attaches Socket.io for everything under `/api/socket`. The Socket.io instance is stashed on `globalThis.__borrowedSocketIo` so REST route handlers can emit real‑time events too (see `lib/socket.ts`).

### Socket.io behaviour (`server.mjs`)
- **Auth middleware**: every socket connection must carry a valid NextAuth JWT (`getToken`). Unauthenticated sockets are rejected.
- On connect, the user auto‑joins a personal room `user:<userId>` and a room for **every conversation they participate in** (`conversation:<id>`).
- `conversation:join` — lets a client join a conversation room on demand, but only after re‑checking participation in the DB (authorization).
- `message:send` — relays a message to the rest of a conversation room, but only if the sender is actually in that room.

---

## 4. Authentication & sessions

Defined in `auth.ts` (NextAuth v5):

- **Providers**: `Credentials` (email *or* username + password, verified with bcrypt), `Google`, and `Facebook`.
- **Session strategy**: **JWT**. The JWT callback enriches the token with `userId`, `userEmail`, `userName`, `userLocation`, plus two derived flags fetched from the DB: `isMentor` (does a `Mentor` row exist for this user?) and `isAdmin`.
- **Session callback** exposes those fields on `session.user`, so any server component or route handler can call `auth()` and immediately know who the user is, whether they're a mentor, and whether they're an admin.
- **Registration** (`/api/register`): validates fields (username ≥ 3 chars, password ≥ 6), checks for duplicate email/username, hashes the password, and creates the `User`.
- **Sign‑in page** is `/login`. There are dedicated `/login/google`, `/login/facebook`, `/register/google`, `/register/facebook` redirect pages for the social flows.

**Access control pattern**: almost every API route starts with `const session = await auth()` and returns `401` if there's no `session.user.id`. Admin routes additionally require `session.user.isAdmin` (else `403`). The `/admin` layout redirects non‑admins to `/unauthorized`.

---

## 5. Data model (Prisma schema)

The schema (`prisma/schema.prisma`, MySQL) is the backbone. Here are the entities grouped by purpose.

### Identity & trust
- **User** — the central account. Holds profile fields (name, username, email, image, phone, lat/long location) and a set of trust booleans: `emailVerified`, `contactVerified`, `idVerified`, `identityVerified`, `addressVerified`, `meetupVerified`, plus `isAdmin`. Connected to nearly everything else.
- **IdVerification** — one per user. Stores the **front ID image**, **back ID image**, and **selfie** (as `LongBlob` bytes), the computed `faceMatchScore`, and a `status` (`pending`/`verified`/`rejected`).
- **Account / Session / VerificationToken / Authenticator** — standard NextAuth tables.

### Items (the two‑sided core)
The model deliberately separates the *item's information* from the *act of offering or wanting it*:

- **Product** — the **central, reusable item record**: name, slug, category/subcategory, location, `pricePerDay`, `deposit`, description, `features`/`drawbacks` (JSON), `compensation` notes, and a `lenderNote`. Created either when a lender lists an item, or when a lender answers a borrow request. **One Product can back many listings over time.**
- **ProductImage** — multiple images per product, stored as `LongBlob` bytes + mime type + order. Served via `/api/products/images/[id]`.
- **LentItem** (*"Side A"* — a supply listing) — a lender makes a Product available. `status` is `active` | `borrowed` | `inactive`. A Product can be **relisted** after return (only one active/borrowed listing at a time).
- **BorrowRequest** (*"Side B"* — a demand want‑ad) — a borrower posts "I need X" with date range, budget, and optional privacy/targeting. `status`: `open` | `fulfilled` | `closed`.
- **BorrowRequestOffer** — a lender's response to a BorrowRequest (picks an existing Product or creates a new one). `status`: `pending` | `accepted` | `rejected`.

### The transaction
- **BorrowCheckout** — the **unified agreement** between borrower and lender, created from *either* side:
  - Side A: a cart checkout of a `LentItem` → `lentItemId` set, `originType = "lent_item"`.
  - Side B: borrower accepts an offer → `borrowRequestOfferId` set, `originType = "borrow_request"`.
  - Tracks dates, `totalPrice`, `deposit`, `notes`, `returnedAt`, `cancelledBy`, and `status`: `pending` → `accepted` → (`active`) → `returned`, or `rejected`/`cancelled`.
  - Carries the **AI damage result** fields: `aiDamageVerdict`, `aiDamageConfidence`, `aiDamageNotes`, `aiDamageCheckedAt`.
- **ConditionPhoto** — before/after photos tied to a checkout (`role = "before" | "after"`), stored as bytes.
- **CartItem** — borrower's cart, one row per `LentItem` (with `days`); unique per (user, item). Cart is for **lent items only**.

### Social, reviews, reputation
- **ItemTrailEntry** — a public "story" a borrower leaves about a product after returning it: what they used it `useFor`, location, tags, an `itemRating` (1–5), optional `photoUrls`, and `anonymous`/`isPublic` flags. This powers both the public Item Trail feed *and* the review portion of the Trust Score.
- **TrailReaction** — reactions (e.g. "heart") on a trail entry, unique per (entry, user).
- **BorrowerReview** — after a return, the **lender rates the borrower** (1–5 + comment), one per checkout.
- **UserReport** — a user reports another user (reason + description, `status`, `readByAdmin`). Feeds the admin Reports console.

### Disputes
- **Dispute** — opened by a lender on a `returned` checkout claiming damage. Holds title/description, `depositAmount`, before/after photo URLs, the **auto‑copied AI verdict**, and a `DisputeStatus` (`OPEN`/`UNDER_REVIEW`/`ESCALATED`/`RESOLVED`/`CLOSED`).
- **DisputeResolution** — the admin's decision: `DecisionType` (`RELEASE_TO_LENDER`/`RETURN_TO_BORROWER`/`SPLIT`), the split amounts, and a written justification.
- **DisputeEvent** — an append‑only timeline (raised, messages copied from chat, resolved, etc.) shown to the admin.

### Mentorship
- **Mentor** — a profile (optionally linked to a User): handle, avatar, specialty, category/subcategories, bio, tags, rating, session count, `pricePerSession`, availability, response time.
- **MentorBooking** — a user books a mentor; `sessionFormat` is `VIDEO` or `IN_PERSON`, with `scheduledAt`, `goals`, and a `status`.

### Messaging & notifications
- **Conversation / ConversationParticipant / Message** — 1‑to‑1 chat. Messages have a `type` (`text` and special types like item‑share) and optional `metadata` JSON. `readAt` drives unread counts.
- **Notification** — per‑user in‑app notifications (`type`, `title`, `body`, `read`, optional `link`). Created throughout the flows (new request, accepted, returned, dispute, emergency, mentor, etc.).

---

## 6. Navigation & page structure

**Public**
- `/` — marketing landing page ("Borrow What You Need. Share What You Don't.").
- `/login`, `/register` (+ social sub‑routes).
- `/products/[slug]` — public product detail page (the landing page even links a demo product).
- `/unauthorized` — shown to non‑admins hitting admin pages.

**Dashboard** (authenticated user app, sidebar nav in `components/dashboard/navigation.ts`)
- `/dashboard` — overview: counts (items, borrows, unread messages, cart), active borrows with due dates, recent activity (from notifications).
- `/dashboard/browse` — browse/search available lent items.
- `/dashboard/mentors` — browse & book mentors; `/dashboard/mentor` — manage your own mentor profile/bookings.
- `/dashboard/my-items` — your listings (with an **Add Item** modal); `/dashboard/items/[id]` — manage one listing.
- `/dashboard/my-borrows` — items you're borrowing (accept→return lifecycle UI).
- `/dashboard/borrow-requests` (+ `/[id]`) and `/dashboard/my-requests` — the want‑ad side.
- `/dashboard/cart` — cart and checkout.
- `/dashboard/messages` — real‑time chat.
- `/dashboard/profile`, `/dashboard/settings` — profile, location, verification, trust score.

**Admin** (`/admin`, gated by `isAdmin`)
- `/admin/users` — user management + view ID images.
- `/admin/disputes` — the **Dispute Console** to review and resolve.
- `/admin/reports` — the **Reports Console** for user reports.
- `/admin/products` — listing moderation.

---

## 7. End‑to‑end flows

### 7.1 Onboarding & trust building
1. **Register** (`/api/register`) → log in via Credentials/Google/Facebook.
2. **Set location** (`/api/user/location`) — stores lat/long (needed for emergency SOS & distance). Location picking uses Leaflet (`LocationPicker`, `MapWithPin`) + geocoding (`/api/geocode`).
3. **ID verification**:
   - Upload **front ID** and **selfie** images (`POST /api/id-verification`, stored as bytes on `IdVerification`).
   - Trigger **face match** (`/api/id-verification/face-match/[userId]`). Server‑side, `face-api.js` (SSD MobileNet + 68‑landmarks + recognition net, loaded from `src/models/face-api-models`) computes a 128‑d descriptor for each face, measures Euclidean distance, and converts it to a **0–100 score**. Score **≥ 70 ⇒ "verified"**. On success it sets the user's `idVerified` + `identityVerified` and stamps `verifiedAt`.
4. **Trust Score** (`/api/user/trust-score`) — weighted out of 100:
   - email **16**, contact **16**, ID **16**, identity **16**, address **16**, and **reviews up to 20** (based on number of public trail entries and their average rating). The result is returned as a score + per‑factor breakdown.

### 7.2 Listing an item (Side A — supply)
1. Lender opens **Add Item** (`AddItemModal`) → `POST /api/lent-items` (multipart form).
2. If a new product: a **Product** is created (with generated unique slug) and any uploaded images are saved as `ProductImage` rows.
   - If reusing an existing product (relist), the route blocks it if there's already an `active`/`borrowed` listing for that product.
3. A **LentItem** with `status = "active"` is created. It now appears in Browse.

### 7.3 Borrowing via cart (Side A)
1. Borrower finds an item in **Browse** (`/api/browse`, `/dashboard/browse`) — search supports **AI query expansion** (`lib/ai-search.ts`: Gemini turns "I need something to film a wedding" into keywords + categories; falls back to keyword stripping if no API key).
2. Add to **cart** (`/api/cart`), set days.
3. **Checkout** (`POST /api/cart/lent-checkout`): in one transaction it creates a **BorrowCheckout** (`status = "pending"`, `originType = "lent_item"`) for **each** cart item, clears the cart, and notifies each lender + the borrower.

### 7.4 Borrowing via want‑ad (Side B — demand)
1. Borrower posts a **BorrowRequest** (`/api/borrow-requests`, via `PostRequestModal`) — title, category, date range, budget, optional private/targeted.
2. Lenders see it and submit a **BorrowRequestOffer** (`/api/borrow-requests/[id]/offers`), choosing an existing product or filling the listing form.
3. Borrower **accepts one offer** (`/api/borrow-requests/[id]/offers/[offerId]/accept`): in a transaction it creates a **BorrowCheckout** (`originType = "borrow_request"`), marks that offer `accepted`, auto‑**rejects all other pending offers**, marks the request `fulfilled`, and notifies the lender.

### 7.5 The handoff → return lifecycle (the safety core)
This is where condition tracking and AI come together. A `BorrowCheckout` moves through states:

1. **pending** — created by either flow above. The lender can **reject** (`/api/borrow-orders/[id]/reject`) or the borrower can **cancel** (`/api/borrow-orders/[id]/cancel`).
2. **Lender accepts** (`PATCH /api/borrow-orders/[id]/accept`): the lender **must upload a "before" photo** of the item at handoff. The route saves it as a `ConditionPhoto(role="before")`, sets checkout `status = "accepted"`, flips the `LentItem` to `borrowed`, and notifies the borrower. (Only the lender, only while pending.)
3. **Borrower returns** (`POST /api/borrow-orders/[id]/return`): the borrower uploads an **"after" photo** *and* fills out a trail entry (use‑for, location, tags, rating, anonymity). The route:
   - Saves the after photo **first** (so it's never lost even if AI is slow).
   - Runs **AI damage detection** (`lib/ai/damage-detection.ts`): Gemini is given the before + after images and a strict prompt that explicitly tells it to **ignore lighting/angle/background** and only flag real physical damage. It returns `{verdict: "damaged"|"no_damage"|"unclear", confidence 0–100, notes}`. The call **degrades gracefully** — if there's no API key or it errors, it returns an "unclear" fallback and never throws.
   - In one transaction: creates the public **ItemTrailEntry**, sets checkout `status = "returned"` + `returnedAt` + the AI verdict fields, and flips the `LentItem` back to `active` (available again).
   - Notifies the lender — and if AI flagged damage, the notification includes a "⚠️ AI detected possible damage" warning.

### 7.6 Reviews & reputation
- **Borrower review** (`/api/borrow-orders/[id]/review-borrower`): after return, the lender rates the borrower (1–5 + comment) → `BorrowerReview`. Aggregated at `/api/user/[id]/borrower-rating`.
- **Item Trail** (`/api/products/[slug]/trail`): the public feed for a product. It shapes each entry (anonymous → "Anonymous Borrower"), aggregates reactions, and **auto‑computes badges** from the collected tags/locations/count, e.g. *Wedding Veteran*, *Adventure Gear*, *Creator's Favourite*, *Well‑Travelled* (≥3 distinct places), *Popular Item* (≥5 borrows). Users can **react** to entries (`/trail/[entryId]/react`).

### 7.7 Disputes (deposit resolution)
1. A lender who believes the returned item is damaged opens a **Dispute** (`POST /api/disputes`) — only allowed on a `returned` checkout, one per checkout. The dispute **auto‑inherits** the before/after photo URLs and the AI verdict/confidence/notes already on the checkout, and **copies the relevant chat messages** (those after `returnedAt`) into `DisputeEvent` rows so the admin sees the real conversation, not a placeholder. The borrower is notified.
2. Admin reviews in the **Dispute Console** (`/admin/disputes`) — sees the photos, AI analysis, and message timeline.
3. **Admin resolves** (`POST /api/admin/disputes/[id]/resolve`): requires a `decisionType` (`RELEASE_TO_LENDER` / `RETURN_TO_BORROWER` / `SPLIT`) and a justification (≥ 20 chars). In a transaction it creates a `DisputeResolution`, marks the dispute `RESOLVED`, writes the decision into the checkout's `damageReport`, appends a `resolved` `DisputeEvent`, and notifies **both** parties.

### 7.8 Messaging (real‑time)
- Start/continue a conversation (`/api/conversations`, `/api/conversations/[id]/messages`). The first message lazily creates the `Conversation` + participants if one doesn't already exist between the two users.
- Security (`lib/messaging/security.ts`): session required, content validated (non‑empty, ≤ 1000 chars), and a **rate limit** of 8 messages / 10 seconds per user.
- **Live delivery**: REST handlers call `lib/socket.ts` to emit over Socket.io (`emitConversationMessage`, `emitNewConversationNotification`, `joinUserToConversation`). The recipient sees the message instantly without polling.
- Special message types support **item sharing** (`ItemShareModal`) inside chat, and there's a **dispute‑context** endpoint (`/api/conversations/[id]/dispute-context`).

### 7.9 Emergency / SOS borrow
`POST /api/emergency`: the user names an item and (optionally) when it's needed and a radius (1–50 km, default 5). The server uses the **Haversine formula** to find all users who (a) have a saved location and (b) have at least one `active` LentItem within the radius, sorts them by distance, and sends each a `emergency_request` notification deep‑linking into a chat pre‑filled with the requester + item. Returns the count and the nearest few recipients. Requires the requester to have set their location.

### 7.10 Mentorship
- Anyone can list as a mentor (their JWT gains `isMentor`); manage profile/bookings via `/api/mentors/me` and `/dashboard/mentor`.
- A user books a mentor (`POST /api/mentors/[id]/book`) choosing video or in‑person, a time, and goals → `MentorBooking(status="pending")` + a confirmation notification. Mentors manage incoming bookings under `/api/mentors/me/bookings`.

### 7.11 Notifications
- `/api/notifications` lists them; `/api/notifications/[id]` and `/api/notifications/read-all` mark read. Surfaced via the `NotificationBell` component and the dashboard "recent activity" feed. Nearly every state transition in every flow above creates one.

### 7.12 Admin & moderation
- **Users** (`/api/admin/users`, `/admin/users`): list/search users, update them (`/[id]/update`), and **view their stored ID images** (`/[id]/id-image`).
- **Reports** (`/api/admin/reports`, `/admin/reports`): triage `UserReport`s (users report each other via `/api/users/[id]/report`).
- **Disputes** — see 7.7.
- **Products** (`/api/admin/products`, `/admin/products`): moderate listings; admins can also remove abusive **trail entries** (`/api/admin/trail/[entryId]`).

---

## 8. AI features summary

| Feature | Model / library | Where | Behaviour |
|---|---|---|---|
| **Damage detection** | Gemini `gemini-2.5-flash` | `lib/ai/damage-detection.ts`, called from the return flow | Compares before/after photos, ignores lighting/angle, returns verdict + confidence + notes; falls back to "unclear" if unavailable. |
| **Search query expansion** | Gemini `gemini-2.5-flash` | `lib/ai-search.ts`, used by browse/search | Turns natural‑language queries into keywords + categories; keyword‑strip fallback. |
| **Face match (ID verification)** | face-api.js + TensorFlow.js + node-canvas | `src/lib/face-verification.ts` | Computes face descriptors for ID vs selfie, Euclidean distance → 0–100 score, ≥70 verifies the user. Model weights live under `src/models/face-api-models` (fetched via `npm run download:face-models`). |

Gemini features key off `GEMINI_API_KEY`; both degrade gracefully when it's absent.

---

## 9. Notable implementation details / conventions

- **Images are stored in the database** as `LongBlob` bytes (product images, condition photos, ID/selfie images) and streamed back through dedicated routes (`/api/products/images/[id]`, `/api/condition-photos/[id]`, admin ID‑image route) rather than living on a file host/CDN.
- **Transactions** (`prisma.$transaction`) guard every multi‑row state change (checkout creation, accept, return, offer acceptance, dispute resolution) so the data can't end up half‑updated.
- **Product vs LentItem split** is intentional: the Product is the durable, reusable item record; LentItems/Offers/Checkouts are the time‑bound events around it. This is what lets an item accumulate a single shared **Item Trail** and badge history across many borrows.
- **Graceful AI degradation**: AI is always additive — the core flows (return, search) work fully even when the AI calls fail or no key is set.
- **Authorization is per‑route**: each handler re‑checks `auth()` and ownership (e.g., only the lender can accept, only the borrower can return, only the requester can accept an offer, only admins can resolve disputes).
- **Real‑time via global Socket.io handle**: REST routes reach the live socket server through `globalThis.__borrowedSocketIo` (wired in `server.mjs`, wrapped by `lib/socket.ts`).

---

## 10. Running the project

1. Set environment variables: `DATABASE_URL` (MySQL), `AUTH_SECRET`/`NEXTAUTH_SECRET`, Google/Facebook OAuth creds, and `GEMINI_API_KEY` (optional, enables AI).
2. `npm run download:face-models` — fetch face‑api model weights.
3. Apply the Prisma schema / generate the client, then `npm run db:seed` to seed data.
4. `npm run dev` — starts `server.mjs` (Next.js + Socket.io) on `http://localhost:3000`.

> ⚠️ Per `AGENTS.md`, this repository pins a **modified build of Next.js** whose APIs/conventions may differ from the public release — consult `node_modules/next/dist/docs/` before changing framework‑level code.
