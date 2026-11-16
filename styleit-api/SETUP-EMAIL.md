# Making Forgot Password send an email

Pick ONE of the two ways below.

## Way 1 (easiest): preview mode. No phone, no Gmail, no account.
The email is built and "sent" exactly like a real one, but to a free test inbox (ethereal.email).
The backend terminal prints a link; open it in your browser to read the email with the 6-digit code.
This is perfect for showing it in class. Nothing reaches a real mailbox.

1. In the `styleit-api` folder, copy `.env.example` to a new file named exactly `.env` (or edit your existing `.env`).
2. Make it contain this line (and put a `#` in front of any SMTP_ lines so they are ignored):

       MAIL_MODE=preview

3. Run `npm install` (once), then `npm run mail:test`. You should see a "Read it here" link. Open it.
4. Restart the backend with `npm run dev`. In the app, click **Forgot Password?**, enter an account's email,
   then look at the **backend terminal**: it prints `📧 Email ... Read it here: https://ethereal.email/...`.
   Open that link to see the email and the code. Type the code into the app.
   (Optional: add `SHOW_RESET_CODE=true` to `.env` to ALSO show the code on screen as a backup.)

## Way 2: real emails to a real inbox (needs a Gmail with 2-Step Verification, which needs a phone)
If you cannot use your phone, use Way 1. Another option later is a free email service such as Brevo, which gives
you the same SMTP_HOST / SMTP_USER / SMTP_PASS values to put in `.env`.

Without this, Forgot Password still works: the code is shown on the screen (demo).
Once you finish these steps, the code is emailed instead, and it is never shown on screen again.

### Gmail steps
#### 1. Get a Gmail "app password" (free)
An app password is a special 16-letter password just for StyleIt. Your real Gmail password is never used.
1. Open https://myaccount.google.com/security and turn on **2-Step Verification** (if it is not on yet).
2. Open https://myaccount.google.com/apppasswords
   (or search "App passwords" in your Google account settings).
3. Type the name `StyleIt` and click **Create**. Google shows 16 letters like `abcd efgh ijkl mnop`.
4. Copy them. You will not see them again.
If the app passwords page is missing, 2-Step Verification is off, or it is a school/work account that does not allow it.
In that case use a personal Gmail.

#### 2. Fill in the .env file
In the `styleit-api` folder, copy `.env.example` to a new file named exactly `.env`, then edit it:

    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=465
    SMTP_USER=yourname@gmail.com
    SMTP_PASS=abcd efgh ijkl mnop

(Spaces in the app password are fine. No quotes.)

#### 3. Install and test
Run these in the `styleit-api` terminal:

    npm install
    npm run mail:test -- yourname@gmail.com

You should see "Sent!". Check your inbox and Spam. If it says "Gmail rejected the login", the app
password or the Gmail address is wrong.

#### 4. Use it
Restart the backend (`npm run dev`), open the app, click **Forgot Password?**, and enter an account's email.
The 6-digit code arrives by email and works for 10 minutes.

## Good to know
- Emails are sent from your Gmail account. Gmail allows about 500 a day, plenty for a class project.
- The same address can only be emailed once a minute.
- Google/Facebook-button accounts have no password, so they get no email (they sign in with the buttons).
- The reply to "Forgot Password" is the same whether or not the email exists, so strangers cannot find out
  who has an account. The email only goes to real password accounts.
- To go back to the on-screen demo code, delete the SMTP / MAIL_MODE lines from `.env`.
