# Edge Log Cloud

This version is ready for static hosting and cloud sync.

## What changed

- Frontend is plain HTML/CSS/JS, so it works on GitHub Pages.
- Trades are stored in Supabase instead of local browser storage.
- Login uses Supabase email magic links, so the same account works across mobile and laptop.

## 1. Create Supabase project

1. Create a project in Supabase.
2. In Supabase SQL Editor, run [`schema.sql`](./schema.sql).
3. In Authentication:
   - Enable Email auth.
   - Enable magic link / OTP sign in.
4. In URL Configuration:
   - Add your future GitHub Pages URL as an allowed redirect URL.
   - Example: `https://YOUR-USERNAME.github.io/edge-log-cloud/`

## 2. Get your public frontend keys

In Supabase Project Settings > API copy:

- Project URL
- Project API anon key

Paste those values into the app using the `Supabase Settings` button.

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
2. Click `Supabase Settings` and save your URL + anon key.
3. Click `Email Sign In`.
4. Enter your email.
5. Open the magic link from your email.
6. Start logging trades.

## Notes

- The Supabase URL and anon key are stored in browser local storage on each device. That is normal for a public frontend app.
- Your actual trade data is protected by row-level security and linked to the signed-in user.
- If you want, a next improvement would be moving the Supabase config out of the modal and into a small `config.js` file so you do not need to paste keys on each new device.
