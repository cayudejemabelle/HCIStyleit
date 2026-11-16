# StyleIt 🎀

A clothing marketplace where people can browse and buy, and open their own shop to sell.
Built for a class project (OOP and HCI).

- **Frontend:** React + Vite (`styleit/`)
- **Backend:** Node.js + Express + SQLite, organised as **MVC** (`styleit-api/`)

## Features
- **Buyers:** search and browse by Women / Men / Kids, cart (each item once, change the number with +/−), checkout with a payment method, order tracking, cancel before shipping, confirm delivery, leave reviews.
- **Sellers:** open a shop from the buyer page, add products with a photo and stock, edit, **restock**, remove, and move orders along (Start preparing → Delivered). Buyers are notified at every step.
- **Admin:** counts only (no orders or money), a Sellers list with safe profiles, a Buyers list, suspend/reactivate, and remove a product with a reason (the seller gets a warning).
- **Accessibility / HCI:** light mode first with a dark option, three text sizes, keyboard shortcuts (press `?`), labelled forms, large touch targets.

## Run it on your computer
You need [Node.js](https://nodejs.org) 22.5 or newer. Open **two terminals**.

**Terminal 1: backend** (http://localhost:3000)

    cd styleit-api
    npm install
    npm test        # 37 tests should pass
    npm run dev

**Terminal 2: frontend** (http://localhost:5173)

    cd styleit
    npm install
    npm run dev

Open http://localhost:5173.

The database file `styleit-api/styleit.db` is created automatically on first run. An admin account is created automatically:
`admin@styleit.com` / `Admin1234`. Change it with `ADMIN_PASSWORD` in `styleit-api/.env` (see `.env.example`).

## How the backend is organised (MVC)
| Part | Folder | Job |
|---|---|---|
| Model | `models/` | Classes that own the data and rules: `User`, `Product`, `Order`, `Cart`, `Review`, `Notification` |
| View | `styleit/` (React) | What the person sees |
| Controller | `controllers/` | The logic: checks input, asks the models, sends the reply |
| Routes | `routes/` | Point each URL at one controller function |
| Middleware | `middleware/` | Login check, role check, error replies |

More detail and every endpoint: `styleit-api/README.md`.

## Demo features (not real yet)
- The **Google / Facebook** buttons are a demo pop-up and do not talk to Google or Facebook.
- **Forgot Password** shows the 6-digit code on screen. A real version would email it (the backend already supports email through `.env`, see `styleit-api/SETUP-EMAIL.md`).

## Before putting it on the internet
Set your own `JWT_SECRET` and `ADMIN_PASSWORD`, set up real email, turn off the demo sign-in with `DEMO_SOCIAL=false`, and use HTTPS.
