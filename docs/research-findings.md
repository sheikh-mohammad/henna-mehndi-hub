# Research Findings — Henna Design Hub

> Purpose: investigate the problem space before writing the spec. No design, no code.
> Date: 2026-10-11. Deep-dive revision after five parallel research streams.

## 1. What is being asked

A public website that:

1. Showcases **1,000+ henna/mehndi designs** in a browsable gallery.
2. Lets **registered users add their own design**, attributed to their name.
3. Lets everyone **see other people's designs**.
4. Keeps the public gallery trustworthy via **approval before publishing**.

### Confirmed decisions

| Decision      | Choice                                                               |
| ------------- | -------------------------------------------------------------------- |
| Contribution  | Full-stack app with a database                                        |
| Identity      | Real accounts (email + password)                                      |
| Moderation    | Approve before publishing                                             |
| Seed content  | Import 1,000+ designs from licensed sources                           |
| Browsing      | Search + category/tag filters, likes, comments, artist profiles       |
| MVP scope     | Gallery + auth + upload + admin moderation (likes/comments next)      |
| Frontend      | Next.js (App Router)                                                  |
| Backend       | Express.js on Node.js, **dedicated server**                           |
| Monorepo      | **Nx**                                                                |
| Database      | **Neon Postgres**                                                     |
| Images        | Cloudinary (signed direct uploads)                                    |

## 2. Contribution / content model

- **Curated gallery** — one team uploads; visitors browse. Lowest risk, no identity.
- **User-generated gallery with moderation** — accounts + upload + approval queue. Standard for community art sites. **Chosen.**
- **Fully open posting** — instant publish. High spam/abuse risk; rejected.

## 3. Identity, sessions & auth (deep)

**Topology is the load-bearing decision.** `app.vercel.app` and `api.onrender.com` are
*different registrable domains and both public-suffix roots* → browser requests are **cross-site**.
Cross-site auth cookies need `SameSite=None; Secure`, and **Safari (ITP) and Firefox (Total Cookie
Protection) block/partition third-party cookies by default**. Chrome reversed its 3P-cookie
phase-out (April 2025) and retired most Privacy Sandbox APIs (Oct 2025), but relying on cross-site
cookies still **silently breaks for Safari/Firefox users**.

**Recommendation: serve the API same-site under the frontend's site** via a Next.js rewrite proxy
(`app.example.com/api/*` → Express) or custom subdomains (`app.example.com` + `api.example.com`).
Then cookies are first-party and reliable. The dedicated Express server stays independently
deployable behind that proxy.

- **Session model:** opaque session id + **server-side store** (Neon Postgres; Redis later).
  Instant revocation, tiny cookie, XSS-resistant. JWT-as-session is discouraged (revocation
  reintroduces state anyway).
- **Cookie:** `HttpOnly; Secure; SameSite=Lax; Path=/; __Host-` prefix. Regenerate session id on login.
- **CSRF:** `SameSite=Lax` + **`Sec-Fetch-Site`/`Origin` check on unsafe methods** + double-submit
  token on auth routes. `csurf` is dead; use `csrf-csrf`/`csrf-sync`.
- **Password hashing:** **Argon2id** (`m=19 MiB, t=2, p=1`; tune to ~250–500 ms) — OWASP 2026 first
  choice. bcrypt (cost ≥ 12) is acceptable legacy fallback.
- **Rate limits:** express-rate-limit v8, shared store for multi-instance; login 5/15 min
  (`skipSuccessfulRequests`), register 3–5/hr, upload ~20/hr keyed by user id.
- **Email verification / password reset:** deferrable for MVP, but **design the hashed single-use
  token table now**. Verification gates uploads (anti-spam); reset tokens hash with SHA-256, expire
  15–60 min, consume atomically, revoke all sessions after reset.
- **CORS** (only if not proxied): exact allowlist, credentials true, `Vary: Origin`; never reflect Origin.

## 4. Image handling (deep)

- **Signed direct uploads** browser → Cloudinary; Express only issues the signature and stores the
  result. Keeps `api_secret` server-side and binaries off the API.
- **Validation (server-side, after upload):** resource type image, allowed formats
  `jpg/jpeg/png/webp`, ≤ 10 MB, dimension bounds (e.g., 400–6000 px). Reject + destroy otherwise.
  Scope the upload to the authenticated user; owner id from the session, never the request body.
- **Delivery:** `c_fill` + `f_auto,q_auto`; fixed 3–4 breakpoint `srcset` (avoid `w_auto`, which
  spawns 20+ derivatives). Keep parameter order identical; enable **Strict Transformations** to
  prevent transformation-spam; eager-generate only the grid variants.
- **Cost:** transformations counted per unique derived URL; ~10k transforms for 1k designs is well
  within a modest tier. Bandwidth dominates over time.
- **Placeholders:** tiny blurred LQIP above the fold only; dominant-color boxes below.
- **Performance budgets:** LCP < 2.5 s, CLS < 0.1, INP < 200 ms; grid thumb 30–80 KB; reserve space
  with width/height/aspect-ratio; prioritize exactly one LCP image.

## 5. Bulk import — the hard part (deep, and a red flag)

There are **two independent constraints**: the image *copyright license* and the *platform API ToS*.
The ToS is the real blocker for a competing gallery.

| Source | Self-host allowed? | Bulk-import allowed? | License | Henna volume |
| --- | --- | --- | --- | --- |
| **Wikimedia Commons** | **Yes** | Yes (no anti-bulk ToS) | per-file CC0/PD/CC-BY/**CC-BY-SA** | ~178 in Category:Mehndi; broad text hits ~18k but mostly irrelevant |
| **Pixabay** | Yes (must re-host; no hotlink) | "Systematic mass downloads not allowed" | Pixabay license (attribution not required) | likely 1k–5k, mixed quality |
| **Pexels** | — | **Prohibited** ("bulk/systematic copying") + **new keys paused** | Pexels license | ~12k (many AI/loose) |
| **Unsplash** | **No — hotlink-only** | **Prohibited** (anti-compilation) | Unsplash license | ~1.3k |
| Flickr (CC) | Yes | needs **paid Pro API key**; NC-heavy | CC variants | thousands |
| Flickr Commons | Yes | Yes | "no known copyright" | historical only, ~0 henna |
| Openverse | passes through | aggregator of Flickr+Commons | NC/ND heavy | no new volume |
| Smithsonian / Met / Europeana / LoC | Yes | Yes | CC0/PD | ~0 modern henna |

**Honest verdict:** a legally-clean, *commercial* pool of modern henna design photos across these
sources is realistically **~1,000–3,000**, but reaching 1,000 *high-quality design* photos is **not
comfortable** and requires per-image license/quality/personality-rights triage. **Unsplash must be
dropped** (re-host forbidden), **Pexels treated as blocked**.

**Personality/model rights:** henna photos show identifiable people/hands; Wikimedia and museums
give **no model releases**. Commercial use of recognizable faces is a separate risk even when
copyright is fine.

**Recommended import strategy:**

1. **Wikimedia Commons** as the legal backbone — filter to CC0/PD/CC-BY/CC-BY-SA via `extmetadata`
   (author, license, license URL), flag recognizable people, store full attribution.
2. **Pixabay** as a **curated, rate-limited, modest** supplement (not crawler-scale), re-hosted.
3. **Direct permission from henna artists** — the only clean way to close the quality gap to a
   true 1,000, and the strongest fit for "designs by named artists."
4. Do **not** use Unsplash or bulk Pexels.

The site should therefore **not promise exactly 1,000 imported designs**; it should combine
licensed imports, artist permissions, and user submissions, and the number grows over time.

## 6. Henna taxonomy (deep)

The word "style" conflates **three axes**; keep them separate to avoid messy filters:

- **Style** (regional tradition), **Motif** (element), **Aesthetic** (traditional/contemporary).

Recommended enums (see `plan.md` for the full lists):

- **Style:** Indian, Pakistani, Arabic, Indo-Arabic, Gulf/Khaleeji, Moroccan, African, Turkish,
  Persian, Modern/Fusion.
- **Placement:** palm, back of hand, fingers, wrist, forearm, upper arm, full arm, foot, toes,
  ankle, calf, back, shoulder, chest, neck, belly, scalp/crown, full body, multiple.
- **Occasion:** bridal, mehndi night, engagement, wedding guest, Eid, Ramadan, Diwali,
  Karva Chauth, Teej, Navratri, Raksha Bandhan, party, festival, baby shower, birthday, casual,
  graduation, corporate, henna crown, everyday.
- **Difficulty:** Easy / Medium / Hard, mapped to coverage, line thickness, shading, time.
- **Other metadata:** color/medium, coverage/length, era (traditional/contemporary/fusion),
  audience, motif.

**Terminology traps:**

- **"Black henna" is dangerous** (usually contains PPD; causes blistering/scarring and is
  restricted/illegal in the EU and by the FDA). It must **never** be a browsable/recommended
  category — only a **safety warning** and a search synonym that routes to that warning.
- **"White henna"/glitter/gold are body paint**, not henna — label accurately.
- **Spelling:** canonical **"mehndi"** with **"henna"** as co-equal; synonym list for
  `mehendi, mehandi, mendhi, mendi, mendy`; normalize plurals/case; disambiguate "henna" (color/hair dye).
- `kids` is an audience flag, not a style.

## 7. Search, pagination, indexing, caching (deep)

At 1k–100k rows, stay in Postgres; no external search engine.

- **Search:** `tsvector` (weighted title/artist/description) + GIN for prose; `pg_trgm` GIN for
  fuzzy/typo on title + artist name. Category filters are plain indexed equality — never trigrams.
  Use `websearch_to_tsquery` (safe on raw input).
- **Pagination:** **keyset/cursor** on `(created_at, id)` (mandatory tiebreaker) for the public feed;
  offset only for the bounded admin table. Opaque base64 cursor; `LIMIT n+1` for `has_more`.
- **Indexes:** **partial** composite `(created_at DESC, id DESC) WHERE status='approved' AND
  deleted_at IS NULL`; a filtered-listing composite `(style, created_at DESC, id DESC)` with the
  same partial predicate; artist index; pending-queue partial index. Index every FK (Postgres does
  not auto-index FKs).
- **Denormalize** `artist_name` (stable search vector, no join) and `like_count`/`comment_count`
  (avoid N+1 counts).
- **Caching:** ISR + `revalidateTag('designs')`/`revalidatePath` triggered by the Express approval
  flow. CDN-cache public GETs only; never cache authenticated responses. Individual design pages
  are what rank for SEO — render the first page server-side and sitemap each design.

## 8. Moderation & UGC safety (deep)

Right-sized for one admin:

- **Pre-moderate designs** (pending queue → human approve) — already chosen. **Post-moderate
  comments** with auto-filter + reports.
- **Triage buckets** Approve / Decline / Edit / Escalate; **fixed rejection reason codes**
  (`not_original, copyright, not_henna, low_quality, inappropriate_content, spam_or_advertising,
  personal_info, duplicate, other`); a **resubmit** path; **bulk actions**; an **append-only audit
  log** (actor, action, target, when, why, before/after snapshot, classifier labels).
- **Abuse funnel:** edge/WAF → rate limits (per IP, subnet, account, endpoint) → **Cloudflare
  Turnstile** on registration (free, invisible) → **email verification before upload** → content
  heuristics. Disposable-domain blocklist.
- **Duplicate/repost detection:** perceptual hash (pHash) on upload; Hamming distance ≤ 5 ≈
  near-duplicate; store the hash. Not rotation-invariant.
- **Image safety triage:** OpenAI `omni-moderation-latest` is **free** but images cover only
  sexual/violence/self-harm. **Big false-positive risk for henna-on-skin** (bridal back/shoulder
  shots trip "revealing clothes"/"bare back"). Use it only as a **triage score that routes to the
  human queue** — never auto-reject. Three tiers: auto-pass / review / auto-block, with auto-block
  only at very high confidence.
- **XSS:** comments are plain text (or Markdown parsed server-side + DOMPurify allowlist); sanitize
  server-side before storage; strict CSP. Never `dangerouslySetInnerHTML`.
- **Reporting:** a "Report" action per design/comment with a reason picklist (copyright, explicit,
  spam, harassment, personal info, danger, other), dedup by content id, rate-limited, reporter
  identity private, reporter-accuracy tracking, notify on outcome.
- **Copyright/DMCA:** ownership **attestation checkbox** (unchecked by default) on upload;
  ToS content-license grant (non-exclusive, to operate/promote, ends on delete); **register a DMCA
  agent** (renew every 3 years) + `/dmca` page + repeat-infringer policy; validate the six required
  notice elements; notify uploader; handle counter-notices (restore in 10–14 business days).
- **Legal basics:** 13+ age statement / neutral age gate; cookie consent for non-essential cookies;
  define and enforce data retention (do not hoard rejected media > ~30 days).

## 9. Failure modes & edge cases

- Duplicate email; weak passwords; credential enumeration.
- Non-image / oversized / corrupt uploads; huge images.
- Unauthenticated upload; users editing/deleting others' designs (server-side authz required).
- Rejected designs show a reason; deleted/hidden designs 404 for non-owners.
- Empty/special-character search; pagination past the end.
- Spam/abuse → rate limits, CAPTCHA, email verification.
- Duplicate/reposted images → pHash triage.
- Imported designs have no owner → nullable owner + attribution label.
- Licensing/attribution mistakes → store source + license per imported design.

## 10. Trade-offs recorded

- **Express + dedicated Node server (Nx):** clean separate deployable, requested by the user. Cost:
  two deployables, and the cross-site cookie problem — solved by same-site proxy/subdomains.
- **Nx monorepo:** strong tooling, task graph, shared libs; heavier than plain npm workspaces.
- **Proxy vs subdomains:** proxy = same-origin simplicity but routes API JSON through Next.js;
  subdomains = independent API but must get CORS+cookies exactly right. Choose proxy now, expose
  the subdomain later if needed.
- **Argon2id vs bcrypt:** Argon2id is the 2026 default; plan changes from bcrypt.
- **Enums vs tag tables:** MVP enums now; tag table later without changing user-visible behaviour.
- **DB sessions vs Redis:** DB-backed now (Neon already present); Redis only if multi-instance load demands.
- **Offset vs keyset pagination:** keyset for the public feed (approvals insert at the top).
- **Soft-delete:** preserves likes/comments/audit.

## 11. Open questions (to settle in spec/clarify)

- Will the site be **commercial** (ads/donations/paid)? This decides whether NC content is usable
  and how much legal work is needed.
- Are we willing to **commission/permission real henna artists** to reach a quality 1,000?
- Max upload size and formats (proposed 10 MB; jpeg/png/webp).
- Whether imported designs auto-approve (proposed: yes, pre-vetted).
- Email verification in MVP or deferred (proposed: gate uploads, but can defer send).
