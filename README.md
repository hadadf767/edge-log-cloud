# Edge Log Cloud

This version is ready for static hosting and cloud sync.

## What changed

- Frontend is plain HTML/CSS/JS, so it works on GitHub Pages.
- Trades are stored in Supabase instead of local browser storage.
- Login uses Supabase email magic links, so the same account works across mobile and laptop.

## 1. Create Supabase project

1. Create a project in Supabase.
2. In Supabase SQL Editor, run [`schema.sql`](./schema.sql).
3. If you already created the table earlier from the simpler version, also run [`schema-update.sql`](./schema-update.sql).
4. In Authentication:
   - Enable Email auth.
   - Keep Email/Password sign-in enabled.
   - Enable magic link / OTP sign in.
5. In URL Configuration:
   - Add your future GitHub Pages URL as an allowed redirect URL.
   - Example: `https://YOUR-USERNAME.github.io/edge-log-cloud/`

## 2. Get your public frontend keys

In Supabase Project Settings > API copy:

- Project URL
- Project API anon key

You can use either method:

1. Built-in setup:
   - Open [`config.js`](./config.js)
   - Paste your `Project URL` into `url`
   - Paste your `anon key` into `anonKey`
   - Upload `config.js` with the site files
   - New users will not need to paste keys manually

2. Manual setup:
   - Paste those values into the app using the `Cloud Setup` button.

## 3. Publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload these files:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `schema.sql`
   - `README.md`
3. Push to GitHub.
4. In the repository go to Settings > Pages.
5. Under Build and deployment:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
6. Save.
7. Wait for the GitHub Pages URL to appear.

## 4. First login flow

1. Open the published site.
2. If you did not use `config.js`, click `Cloud Setup` and save your URL + anon key.
3. Choose one login method:
   - `Sign In` for email/password
   - `Sign Up` to create a new account
   - `Magic Link` as a backup passwordless login
4. Start logging trades.

## Notes

- The Supabase URL and anon key are stored in browser local storage on each device. That is normal for a public frontend app.
- The app now also supports an optional `window.EDGE_LOG_DEFAULT_CONFIG` object if you want to embed your default Supabase URL/key later and remove manual setup for new users.
- Password reset is supported from the sidebar:
  - `Reset Password` sends a reset email
  - `Set New Password` saves a new password after recovery/sign-in
- Your actual trade data is protected by row-level security and linked to the signed-in user.
- If you want, a next improvement would be moving the Supabase config out of the modal and into a small `config.js` file so you do not need to paste keys on each new device.
