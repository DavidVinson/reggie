# Reggie Improvements — 2026-02-25

## Prompt

> If you were to start over with the Reggie project, what would you do differently to make it function better, or better user interface? Overall, can we make Reggie better?

---

## Changes Made

1. **SMS notifications** — `server/notifier.js` wires Twilio. Watcher now sends SMS + updates `sms_sent`/`sms_message_id` on every notification. Gracefully skips if Twilio isn't configured.

2. **Login / JWT auth** — `client/src/api.js` wraps all fetch calls with the JWT from localStorage. Login page calls `/api/auth/login`, stores token, redirects to `/`. `PrivateRoute` redirects to login if no token. All pages use `api()` — any 401 auto-clears the token and redirects.

3. **Watcher catches new programs immediately** — After discover bulk-inserts programs, `checkAllRules()` fires immediately (fire-and-forget), so watch rules trigger in seconds instead of waiting up to 5 minutes.

4. **Program search** — Search input on Programs page filters by name, type, location, and age group as you type. Works alongside the site filter.

5. **Per-site scrape intervals** — `last_scraped_at` added to sites. Scheduler now runs every minute and scrapes only sites that are due based on their individual `scrape_interval`. Watch rules also check every minute.

6. **Toast error surfacing** — `Toast.jsx` context provides a `useToast()` hook. API errors in Sites, WatchRules, and Chat now show dismissible toasts instead of failing silently.

7. **Dashboard** — Now shows: unread alerts (prominent, tappable), open programs count with names, upcoming registration deadlines with days-until, watch rule status with last-checked time, and sites list. Everything links to the relevant page.
