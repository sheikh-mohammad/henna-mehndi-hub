# Spec — Henna Design Hub

> The spec is the source of truth. It describes **what** the product does, not **how**.
> No frameworks, databases, or file layouts belong here — see `plan.md`.

## 1. Goal

Give henna/mehndi artists and enthusiasts a single public place to showcase and discover a
collection of 1,000+ designs. Registered users can contribute their own designs, each attributed
to their name, while anyone can browse, search, and view the collection. Admins keep the public
gallery trustworthy by approving submissions before they appear.

## 2. User scenarios

**Visitor (not logged in)**

- When a visitor opens the site, they get a gallery of published designs with thumbnail, title, and artist name.
- When a visitor searches or selects filters, they get only matching designs, and the results are shareable/bookmarkable via URL.
- When a visitor opens a design, they get a large image plus its details and the artist's name.
- When a visitor opens an artist's name/profile, they get that artist's published designs.
- When a search has no matches, they get a clear "no designs found" message.

**Registered user**

- When a user signs up with email + password, they get an account and a display (artist) name.
- When a user uploads a design (image + details), the design becomes **pending** and is told it awaits review.
- When a user views "My designs", they see each design's status (pending / approved / rejected).
- When a design is rejected, the user sees the reason.
- When a user edits or deletes their own design, the change is applied; they cannot touch others' designs.

**Admin**

- When an admin opens the moderation queue, they see pending designs and can approve or reject with a reason.
- When an admin removes a published design, it disappears from the public gallery.
- When an admin runs the importer, 1,000+ licensed designs are loaded into the collection.

**Phase 2 (designed for, delivered later)**

- When a user likes/saves a design, it appears in their saved list and the count updates.
- When a user comments on a design, the comment appears for others and can be removed by an admin.

## 3. Functional requirements

### Accounts & access

- **FR-1** A user can register with an email and password. Email must be unique.
- **FR-2** A user can log in and log out. A session persists across page reloads.
- **FR-3** A user has a display (artist) name, shown on every design they own.
- **FR-4** There are three roles: visitor, user, admin. Admin is assigned, never self-selected.
- **FR-5** Protected actions (upload, edit, delete, moderate) require the appropriate role and are enforced by the server, not only the UI.

### Designs

- **FR-6** A design consists of: one image, a title, an owner (or attribution for imported work), an optional description, and category values (style, body part, occasion, difficulty). Optional extra categories: colour/medium, coverage, era.
- **FR-7** A logged-in user can submit a design through a form with an image upload.
- **FR-8** A new submission is **pending** and is NOT shown in the public gallery until approved.
- **FR-9** An owner can edit the metadata of, and delete, their own design.
- **FR-10** A rejected design shows the rejection reason to its owner.
- **FR-11** A design detail page shows: large image, title, artist name (linking to profile), categories, description, and date added.
- **FR-12** The upload form requires the user to confirm, with an unchecked-by-default checkbox, that they own the design or have permission to share it.
- **FR-13** The site does not offer "black henna" (PPD-based body art) as a style or filter; it is only ever a safety warning in upload guidance and a search synonym that routes to that warning.

### Gallery & discovery

- **FR-14** The gallery shows only approved designs, newest first, with pagination or progressive loading.
- **FR-15** Users can search by free text across title, description, artist name, and categories.
- **FR-16** Users can filter by style, body part, occasion, and difficulty; filters combine (AND across types).
- **FR-17** Search and filter state is reflected in the URL so a result view can be shared or bookmarked.
- **FR-18** When there are no matches, a clear empty state is shown.
- **FR-19** The gallery is usable on both mobile and desktop.

### Artist profiles

- **FR-20** Each user has a public profile showing their display name and their approved designs.

### Moderation

- **FR-21** An admin can view all pending designs in a queue.
- **FR-22** An admin can approve or reject a pending design; rejecting requires/accepts a reason.
- **FR-23** An admin can remove (unpublish) any published design at any time.
- **FR-24** Only admins can access moderation features.
- **FR-25** Any visitor can report a design (or, once comments exist, a comment) with a reason; reports go privately to admins, and a single design with many reports still produces one review item.
- **FR-26** There is a public takedown/reporting contact; content confirmed as infringing someone's rights is removed by an admin.

### Import

- **FR-27** An importer loads designs from explicitly licensed sources that permit self-hosted use and re-hosting, with a target of 1,000 designs.
- **FR-28** Every imported design records its source, author, license, and original URL for attribution.
- **FR-29** Imported designs without a registered owner display an attribution label instead of a profile link.

### Phase 2 — Likes & comments (schema and rules defined now)

- **FR-30** A logged-in user can like/unlike a design exactly once; a like count is shown.
- **FR-31** A logged-in user can comment on a design; comments display publicly and can be removed by an admin.

## 4. Edge cases & rules

- **Duplicate email** on registration → rejected with a clear error; no account created.
- **Wrong credentials** → generic error; never reveal which field was wrong.
- **Upload validation:** non-image files, corrupted files, and files above the maximum size are rejected with a clear message.
- **Large images** are resized/compressed so the gallery stays fast.
- **Missing required fields** → validation error; nothing is saved.
- **Unauthenticated or unauthorized actions** → blocked/redirected; the check is server-side.
- **Cross-user access:** editing/deleting another user's design is denied even if the request is crafted manually.
- **Deleted/unpublished designs** are not reachable by direct link for non-owners/admins.
- **Display name:** 2–50 characters, trimmed, not all whitespace; need not be unique.
- **Search input:** empty string returns all; special characters must not break the query.
- **Pagination beyond the last page** → sensible empty result, not an error.
- **Rate limiting** applies to registration and upload to limit spam.
- **Ownership attestation** (unchecked by default) is required before an upload is accepted; submissions without it are invalid.
- **"Black henna" search** routes to a safety warning, never to designs.
- **Reporting** is rate-limited; a user can report the same design at most once per day, and duplicate reports collapse into one review item.
- **Imported designs** come only from sources that permit self-hosting/re-hosting; source, author, license, and original URL are mandatory and stored.
- **Imported designs** may have `owner = none`; the UI must handle this without errors.
- **Deletion policy:** removing a design hides it (soft-delete) so likes/comments/audit survive.

## 5. Out of scope (MVP)

- Payments, subscriptions, or commissions.
- Direct messaging between users.
- Email verification and password reset emails (deferred; note as a follow-up).
- Social login (Google/GitHub) — email + password only for now.
- AI generation or auto-tagging of designs.
- Native mobile apps.
- Real-time notifications.
- Full multi-language / i18n.

## 6. Acceptance criteria

- [ ] Public gallery lists approved designs, newest first, responsive on mobile and desktop.
- [ ] Text search and combined filters return correct results and update the URL.
- [ ] Design detail and public artist profile pages work.
- [ ] Register, log in, log out, and persistent sessions work.
- [ ] A logged-in user can upload a design; it is pending and hidden from the public gallery.
- [ ] An owner sees statuses, can edit/delete their own designs, and cannot modify others' designs (verified server-side).
- [ ] An admin can approve/reject with a reason and remove published designs; rejection reason is visible to the owner.
- [ ] The importer loads designs (target ≥1,000) with attribution metadata, sourcing only from sources that permit re-hosting.
- [ ] Invalid uploads (wrong type or too large) show clear errors.
- [ ] The upload form requires the ownership attestation checkbox and "black henna" is not offered as a filter.
- [ ] Visitors can report a design with a reason and the report reaches the admin privately.
- [ ] Likes/favorites and comments remain out of MVP but their rules are defined for the next phase.
