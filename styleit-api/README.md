# StyleIt API (complete)

Express + SQLite, organised as MVC. Needs Node 22.5 or newer.

## Run it
    npm install
    npm test        # 37 tests should pass
    npm run dev     # starts http://localhost:3000

Check it: open http://localhost:3000/api/health in a browser. You should see {"ok":true,...}.
Admin login: admin@styleit.com / Admin1234 (change it with ADMIN_PASSWORD).

## MVC map
| Part | Folder | Job |
|---|---|---|
| Model | models/ | Classes that own the data and rules: User, Product, ResetCode |
| View | (React app) | What the person sees |
| Controller | controllers/ | The logic: checks input, asks models, sends the reply |
| Routes | routes/ | Point each URL at one controller function |
| Middleware | middleware/ | Runs first: login check, role check, error replies |

## Endpoints (send the login token as  Authorization: Bearer <token>)
Accounts   POST /api/auth/signup, /signin, /forgot, /reset, /open-shop · GET /api/auth/me
Products   GET /api/products, /mine, /:id · POST /api/products · PUT /api/products/:id
           POST /api/products/:id/restock · DELETE /api/products/:id
Reviews    GET /api/products/:id/reviews · POST /api/products/:id/reviews (after delivery)
Cart       GET /api/cart · POST /api/cart {productId} (once only) · PATCH /api/cart/:productId {delta}
           POST /api/cart/remove {ids}
Orders     POST /api/orders {productIds, payment: cod|gcash|maya|card|bank}
           GET /api/orders/mine (bought) · GET /api/orders/received (seller)
           POST /api/orders/:id/cancel · /advance (seller) · /received (buyer)
Notifications  GET /api/notifications · POST /api/notifications/read
Admin      GET /api/admin/overview, /sellers, /sellers/:id, /buyers   (counts and safe profile info only)
           POST /api/admin/users/:id/suspend {suspended: true|false}
           POST /api/admin/products/:id/remove {reason: 0-5, note}    (warns the seller)
Public     GET /api/reviews · GET /api/top-sellers (shop + order count only)
Demo       POST /api/auth/social-demo {provider, name, email}   (the Google/Facebook buttons are a demo; DEMO_SOCIAL=false turns it off)
Email      Forgot Password sends an email: MAIL_MODE=preview (no account needed) or real SMTP_* settings in .env (see SETUP-EMAIL.md); `npm run mail:test -- you@gmail.com` checks it
