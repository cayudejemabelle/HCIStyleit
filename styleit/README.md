# StyleIt (React frontend)

Clothing marketplace for women, men and kids. Buyers, sellers and an admin.
This is the **frontend** with sample data. A backend replaces the sample data later.

## Run it
1. Install Node.js (LTS) from nodejs.org
2. In this folder, open a terminal and run:
   ```
   npm install
   npm run dev
   ```
3. Open the link it prints (usually http://localhost:5173)

Demo logins
- Buyer: `user@styleit.com` / `User1234`
- Admin: `admin@styleit.com` / `Admin1234`

## Where things are
```
src/
  main.jsx            starts the app
  App.jsx             decides which screen to show (login / buyer / seller / admin)
  styles.css          the whole design: colors, fonts, buttons, cards, pop-ups
  constants.js        text sizes, order steps, payment methods, cart limit, removal reasons
  data/seed.js        sample products and users  (the backend replaces this)
  store/StoreContext.jsx   the app's "brain": users, cart, orders, stock, notifications, reviews
  hooks/useShortcuts.js    keyboard shortcuts
  utils/              keys.js (Enter = next / Go), shop.js (helpers), image.js (photo upload), focus.js
  pages/
    AuthPage.jsx      Sign In / Sign Up
    BuyerPage.jsx     shop, My orders, Notifications   (first screen after login)
    SellerPage.jsx    Seller Centre: Overview + add product, My products, Orders, Notifications
    AdminPage.jsx     Admin: Overview + top sellers, Users & shops, Orders, Notifications
  components/         Header, ProductCard, ProductForm, CartDrawer, Checkout, OrdersView, ReviewDialog, ...
```

## Done
Login and sign up - buyer shop (search, tabs, top sellers, sold and left) - product details and reviews -
cart (select, delete, quantity, 10-item limit, bought items stay) - checkout with payment choice -
order tracking - cancel and "order received" - write a review - notifications with clickable reminders -
Start selling - Seller Centre (add product with photo and stock, edit/remove with confirmation,
orders with Start preparing...Delivered) - Admin (users and shops, remove with reason + warning to seller,
top sellers) - light and dark mode - text size - keyboard shortcuts.

## Next
Polish and testing, then the backend (database, real login, photo storage).
