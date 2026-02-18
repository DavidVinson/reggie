# Reggie

- Monitors city activity program websites (parks & rec, etc.) for new listings and openings
- Scraper → Parser → Notifier sub-agent pipeline powered by Firecrawl
- Data stored in SQLite; mobile-first React frontend over an Express API
- Alerts delivered via SMS (Twilio) and in-app notifications
- Scheduling runs via node-cron inside the Express server
- Registration is currently manual — agent finds openings and notifies the user
- Automated registration is planned as a future sub-agent
