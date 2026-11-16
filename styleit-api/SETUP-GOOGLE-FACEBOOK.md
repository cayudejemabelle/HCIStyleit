# Turning on Google and Facebook sign-in

Both are free. Until you do this, the G and f buttons just say "isn't set up yet".
Google and Facebook move their menus around, so if a name differs a little, look for the same idea.

## 1. Create your .env file
In the styleit-api folder, copy `.env.example` to a new file named `.env`. You will fill it in below.
`.env` holds secrets. Never share it. (Restart `npm run dev` after every change to it.)

## 2. Google (do this one first, it is easier)
1. Go to https://console.cloud.google.com and sign in with your Google account.
2. Create a project: top bar > project picker > New project > name it StyleIt > Create. Make sure it is selected.
3. Open "APIs & Services" > "OAuth consent screen" (newer name: "Google Auth Platform").
   - App name: StyleIt. Support email: your email. Audience / user type: External. Save.
   - Keep it in "Testing". Under "Test users" add your own Gmail (and any friend who will try it).
     In Testing mode, ONLY those test users can sign in. That is normal.
4. "Credentials" (newer: "Clients") > Create credentials > OAuth client ID > Application type: Web application.
   - Authorized JavaScript origins: add BOTH  http://localhost:5173  and  http://localhost
   - Leave "Authorized redirect URIs" empty. Create.
5. Copy the Client ID (it ends in .apps.googleusercontent.com) into .env:
   GOOGLE_CLIENT_ID=your-client-id-here
6. Restart the backend. Open the app: the Google icon button should appear on the login page.

## 3. Facebook (optional, more steps)
1. Go to https://developers.facebook.com > My Apps > Create App.
   Choose the use case about authenticating / logging in with Facebook. Name it StyleIt.
2. In the app, add the "Facebook Login" product (web). In its settings, turn on "Login with the JavaScript SDK"
   and add  http://localhost:5173  (and http://localhost) to the allowed domains if it asks.
3. App settings > Basic: copy the App ID and the App Secret (click Show). Put them in .env:
   FACEBOOK_APP_ID=...
   FACEBOOK_APP_SECRET=...
4. The app starts in Development mode. Only people with a role on the app (you, plus anyone you add under
   App roles > Roles as Developer or Tester) can sign in. That is normal for a class project.
5. Restart the backend. The f button now opens Facebook's pop-up.
   If Facebook does not share an email, we cannot sign the person in (we need it to match accounts).

## How it works (good for your documentation)
- The browser asks Google/Facebook who the person is and gets back a signed proof.
- It sends only that proof to our server (POST /api/auth/google or /api/auth/facebook).
- The SERVER checks the proof itself: Google's signature, that it was made for our app, that it has not
  expired, and that the email is verified. Then it signs the person in or creates the account.
- Our server never sees a Google or Facebook password.
- If that verified email already has a StyleIt account, the person simply signs in to it.
