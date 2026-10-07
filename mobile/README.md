# Tunisia WNT: Expo app

React Native + Expo Router + TypeScript. Four tabs (Home, Squad, Stats, Profile), an animated player card, and modal screens for match details, lineup building, player editing, adding players and notifications.

This app lives in the `mobile/` folder of the platform repo and reads and writes **the same Supabase project as the website**. A change made on the website shows up here, and a change made here shows up on the website.

## Run it

```bash
cd mobile
cp .env.example .env     # fill in the two Supabase values (same as the website's .env.local)
npm install
npx expo start
```

```bash
npm run typecheck        # tsc --noEmit
npm run test:mappers     # database <-> app mapping tests (Node 22+)
```

## How the link to the platform works

- **Same login.** Sign in with your website username and password. Your role and permission flags come from your `profiles` row. Pending and suspended accounts are refused, as on the website.
- **Same rules.** The app only ever holds the public anon key and your own session token. Postgres row-level security decides what you may read and write, exactly as on the website. There is no service-role key in the app, and `passport_image` is never requested.
- **Near-live.** The app re-reads the database every 30 seconds while it is open, when it returns to the foreground, and on pull-to-refresh on Home and Squad. Colleagues' changes (a new injury, a new player) raise an in-app alert.
- **Writes go straight to the database** and need a connection. If a write is refused or offline you get a message and nothing is changed locally. The last synced copy is kept for reading offline.

| What | Platform table | Notes |
| --- | --- | --- |
| Squad | `members` (role `PLAYERS`) | Name, number, position, category, club, birthdate, goals, assists, caps (`nat_matches`), cards, suspension, photo. Needs `editPlayer` / `addPlayer`. |
| Availability | `injuries` | Fit / Recovery / Injured map to no open injury / `recovering` / `active`. Needs `viewMedical` to see, `editMedical` to change. Without `viewMedical`, availability shows "Not shared" instead of pretending everyone is fit. |
| Next match, form, possession | `matches` | Same rule as the website: approved, dated today or later, no result yet. Date only: the platform has no kickoff time. |
| Saved lineups | `squad_templates` | Same formations and slot keys as the Squad Lab, so a lineup saved on one side loads on the other. Needs the `addCamps` flag to save or delete. |

## Not linked yet

- Camps, staff and coaches, user management, games, news, club match reports, passports.
- Fitness chart, minutes played and last-checkup date: the platform stores no such data, so they are not shown.
- Call-ups (the 23-player list) are a draft on the device. Only the lineup is saved to the platform.

## Releasing a test build

CI (`.github/workflows/release-android.yml` at the repo root) builds the Android APK from `mobile/` and attaches it to a GitHub Release.

1. In the GitHub repo, add the secrets `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Settings → Secrets and variables → Actions). Without them the APK cannot sign in.
2. Bump `version` and `versionCode` in `mobile/app.json`.
3. Tag the release: `git tag v1.1.0 && git push origin v1.1.0`.
4. The **Build & release Android APK (mobile app)** action runs and publishes `tunisia-wnt-v1.1.0.apk` on the release page.

You can also start a build from **Actions → Run workflow**; that stores the APK as a workflow artifact.

The APK is signed with the debug keystore from `expo prebuild`: fine for direct installs and QA, not for the Play Store.

## Things to know

- The session token is kept in AsyncStorage. Before wider rollout, move it to `expo-secure-store`.
- Roles in the interface only decide which buttons show; the database is what enforces permissions.
- Notifications are local to the phone. Reminders are pinned to 18:00 the day before and 08:00 on match day because the platform has no kickoff time. Alerts that reach phones while the app is closed need push notifications from a server.
- Switching language changes the text only. Arabic does not flip the layout to right-to-left yet.
- In Expo Go on Android, notifications may need a development build.
