## 1. Project Title
**Smart Campus Complaint & Support Management System**

## 2. Project Overview
A full-stack grievance portal where students/citizens register, track, and rate complaints while administrators triage, escalate, and resolve them. The React dashboard surfaces live complaint metrics, notifications, and SLA timers, and the Express/MongoDB backend handles authentication (password + Google OAuth), file-backed evidence uploads, auto-escalation logic, profile management, support tickets, and broadcast notifications.

## 3. Problem Statement
Large campuses and municipalities struggle to capture service issues, keep complainants informed, and coordinate admin responses. Manual or email-based workflows lack SLA tracking, unified history, and role-based visibility, leading to unresolved or delayed grievances.

## 4. Objectives
- Provide secure self-service onboarding plus admin seeding.
- Let users submit categorized complaints with attachments and view real-time status/SLA information.
- Offer admins consolidated complaint, notification, and support ticket consoles with filtering and bulk actions.
- Persist communication history (complaint timelines, feedback, notifications) for auditability.
- Support multi-channel authentication (email/password + Google OAuth) and profile management.
- Deliver responsive UI with dark/light theming and localized notification badges.

## 5. System Workflow
1. **Access & Auth** – Users register or log in (email/password or Google). Admins are seeded or registered via secret.
2. **Profile Setup** – Users update contact info, avatar (upload or generated SVG), gender, and optionally change passwords or export/delete data.
3. **Complaint Registration** – Authenticated users submit complaints with category, title, description, and optional image/PDF attachment; server stores metadata and file path, initializing history.
4. **Tracking & SLA Monitoring** – Users view dashboards (Dashboard, TrackComplaint, MyComplaints) showing stats, SLA timers (via [client/src/utils/sla.js](client/src/utils/sla.js)), attachments, and chronological history; resolved items can be rated and reviewed.
5. **Admin Operations** – Admin dashboards aggregate complaint counts, charts, filters, SLA badges, and allow status transitions, auto-populated histories, and access to user details plus resolved backlogs.
6. **Notifications & Support** – System admins broadcast notifications (`/api/notifications`), users receive them in Navbar/UserDashboard, and both roles interact via support tickets (`/api/support`).
7. **Automations** – Complaint listing auto-escalates older-than-7-day items on fetch, ensures attachment storage, and enforces Zod validation across routes.

## 6. Tech Stack
- **Frontend:** React 19, React Router DOM 6, Vite 7 dev server with proxying, vanilla CSS modules (e.g., [client/src/App.css](client/src/App.css), [client/src/styles/Navbar.css](client/src/styles/Navbar.css)).
- **State/Context:** Custom contexts from [client/src/auth/AuthProvider.jsx](client/src/auth/AuthProvider.jsx) and [client/src/auth/ThemeProvider.jsx](client/src/auth/ThemeProvider.jsx), localStorage persistence, and HTTP helper built on fetch with JSON parsing and token injection.
- **Backend:** Node.js, Express 5, CORS, Multer for uploads, bcryptjs for hashes, jsonwebtoken for auth, google-auth-library for OAuth token verification, nodemailer for SMTP-based password reset emails, zod for validation, dotenv for config, Twilio dependency (unused).
- **Database:** MongoDB via Mongoose 8 with schemas for users, complaints, notifications, and support tickets.

## 7. System Modules
- **Authentication & Authorization:** Registration/login, Google OAuth, JWT issuance/verification, role guard middleware, password reset, admin self-registration secret, avatar uploads, profile patching, export/delete endpoints.
- **User Complaint Lifecycle:** Complaint submission, attachment upload, real-time listing with polling, SLA timers, history logs, rating/feedback submission, resolved complaint views.
- **Admin Complaint Console:** Filters by status/category prefix, SLA countdowns, status updates with history entries, resolved backlog table, analytics (pie/bar charts) plus auto-escalation enforcement.
- **Support Ticketing:** User-side ticket submission and list, admin-side status/reply handler with persistence of reply metadata.
- **System Notifications:** Admin CRUD for announcements with severity/targeting; clients poll and badge notifications, merging with complaint updates.
- **UI/UX Services:** Navbar with theme toggle, notification drawer, sidebar navigation, bell badges tied to localStorage, and donut/bar visualizations.

## 8. AI Components
- **LLM Usage:** None. No OpenAI/LLM/embedding libraries are present.
- **Embedding/Vector Search:** None implemented.
- **Deterministic Logic:** Entire system relies on deterministic validation (Zod), JWT auth, SLA timers, and auto-escalation conditions.

## 9. Database Design
- **User ([server/src/models/User.js](server/src/models/User.js)):** Stores name, unique email, bcrypt passwordHash, avatar URL, phone, address, optional gender, role (`user|admin`), and resetToken/resetExpires. Password hash omitted from JSON responses.
- **Complaint ([server/src/models/Complaint.js](server/src/models/Complaint.js)):** References users, tracks category, title, description, optional attachment path, status enum (`Pending|In Progress|Escalated|Resolved`), rating (1–5), feedback text/timestamp, and history entries capturing from/to, notes, changer, and timestamps.
- **Notification ([server/src/models/Notification.js](server/src/models/Notification.js)):** Holds title, message, severity level (`info|maintenance|critical`), active flag, creator reference, and delivery target (`all|admins|users`).
- **Support ([server/src/models/Support.js](server/src/models/Support.js)):** References users, subject, message, optional category, status (`Open|Pending|Closed`), reply text, `repliedBy`, and `repliedAt`. A partial unique index on `ticketId` prevents duplicate non-null IDs.
- **Uploads:** Stored on disk ([server/uploads](server/uploads)) using Multer and exposed via `/uploads` static route; complaints and avatars reference relative paths persisted in MongoDB.

## 10. Matching / Scoring Logic
- No recommendation, skill-matching, or score-normalization logic exists. The only scoring-like feature is user-provided complaint ratings plus SLA countdown calculations (computeSLA, formatDuration in [client/src/utils/sla.js](client/src/utils/sla.js)) to flag overdue items.

## 11. Features Implemented
- Role-aware routing and guards with automatic redirects post-auth.
- Email/password auth with JWT, Google Identity Services button, and secure token storage.
- Password reset flow (request + token-based reset) with SMTP integration and dev token echoing.
- Profile management: avatar uploads or color-based SVG generation, gender radio buttons, DOB input, contact fields, password changer, data export JSON, and account deletion.
- Complaint submission with validation, attachment upload, automatic history seed, periodic refresh, and SLA timers for each status.
- User dashboards featuring KPIs, donut charts, merged notification feeds, unread counts, and quick navigation cards.
- Admin analytics: pie/bar charts, aggregate stats, filterable tables, inline status updates, highlight navigation via query params, and resolved complaint archive.
- Feedback loop: resolved complaints accept ratings (star rendering) and textual feedback stored server-side.
- Notification center in Navbar with mark-all-read, localStorage persistence, and quick navigation links.
- Support desk: user ticket submission + list, admin reply workflow with status dropdown and reply persistence.
- System notifications API for admin-created broadcasts filtered by role at fetch time.
- Auto-escalation job triggered during complaint listing when pending/in-progress complaints age past 7 days.
- Dark/light theming toggled at runtime via ThemeProvider storing preference in localStorage.

## 12. Removed / Not Included Features
- No HR/payroll/inventory modules; scope limited to complaint + support handling.
- No AI assistants, chatbots, or sentiment analysis despite Twilio dependency being present but unused.
- No push notifications, SMS, or email digests beyond password reset emails.
- No multi-tenant partitioning, localization/i18n, or role hierarchy beyond `user` and `admin`.
- No audit trail for admin edits outside of complaint history entries.

## 13. API Design Summary
- `POST /api/auth/register|login|google|forgot|reset` – user onboarding/auth flows with Zod validation.
- `GET /api/auth/me`, `PATCH /api/auth/me`, `PATCH /api/auth/me/password`, `POST /api/auth/me/avatar`, `GET /api/auth/me/export`, `DELETE /api/auth/me` – profile CRUD, password change, avatar upload, export, delete.
- `POST /api/auth/register-admin` – protected admin registration via shared secret.
- `POST /api/complaints` – create complaint with file upload; `GET /api/complaints` – role-aware listings + auto-escalation; `GET /api/complaints/:id` – detail view; `PATCH /api/complaints/:id/status` – admin status transition; `PATCH /api/complaints/:id/feedback` – user/admin feedback + rating.
- `POST /api/support` – user ticket submission; `GET /api/support` – list (all for admin, own for user); `GET /api/support/:id` – detail; `PATCH /api/support/:id/status` – admin status/reply updates.
- `POST /api/notifications` – admin broadcast; `GET /api/notifications` – authenticated list filtered by role; `PATCH /api/notifications/:id` – admin updates.
- `GET /api/health` – service health probe.
- Static `/uploads/*` – serves stored avatars/attachments.

## 14. Limitations
- No pagination or cursoring; complaint/support lists are capped but may still fetch up to 200 records per request, potentially heavy for large deployments.
- Auto-escalation runs only when complaints are fetched, so unattended systems may not escalate promptly.
- Attachments and avatars stay on disk indefinitely; there is no cleanup, virus scanning, or CDN integration.
- Email/SMS delivery depends entirely on external SMTP env vars; Twilio is installed but unused, so SMS alerts are absent.
- Client-side validation mirrors server rules but lacks centralized schema sharing, risking drift.
- No automated tests, CI, or lint-enforced formatting beyond manual ESLint invocation.
- Security gaps: no rate limiting, CSRF protection is unnecessary for APIs but brute-force protection is absent; delete account reuses fetch due to missing DELETE helper.

## 15. Future Scope
- Add background schedulers (e.g., cron) for proactive SLA breach detection and reminder notifications independent of user traffic.
- Implement pagination, search, and export for large complaint/support datasets.
- Integrate real-time channels (WebSocket, push notifications, SMS via Twilio) for instant status updates.
- Introduce role granularity (e.g., department admins) and assignment workflows.
- Add analytics exports, trend reports, and customizable SLA policies per category.
- Harden file handling with antivirus scanning, cloud storage (S3), and signed URLs.
- Provide multi-language UI, accessibility audits, and responsive improvements for mobile-heavy usage.
