# FinanceFlow API Reference

Base URL: `http://localhost:5000/api` (local) or `https://<your-render-app>.onrender.com/api` (production).

All request and response bodies are JSON. Protected routes need the header:

```
Authorization: Bearer <JWT from /auth/login or /auth/register>
```

A ready-to-import Postman collection is in [`FinanceFlow.postman_collection.json`](FinanceFlow.postman_collection.json).

## Error format

Every error uses the same shape:

```json
{ "error": "Amount must be greater than 0", "details": [{ "field": "amount", "message": "Amount must be greater than 0" }] }
```

| Status | Meaning |
|---|---|
| 200 OK | Request succeeded |
| 201 Created | Resource created |
| 204 No Content | Deleted / logged out (empty body) |
| 400 Bad Request | Validation failed or invalid id |
| 401 Unauthorized | Missing, invalid or expired token |
| 403 Forbidden | Logged in but role not allowed (e.g. user on admin route) or account deactivated |
| 404 Not Found | Resource does not exist **or belongs to another user** |
| 409 Conflict | Duplicate (email already registered, category name exists, budget exists) |
| 429 Too Many Requests | Rate limit on login/register exceeded |
| 500 Internal Server Error | Unexpected error (details hidden in production) |

---

## Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | – | Service status and uptime |

## Auth – `/auth`

| Method | Endpoint | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/auth/register` | – | `{ name, email, password }` | `201 { token, user }` – also creates default categories |
| POST | `/auth/login` | – | `{ email, password }` | `200 { token, user }` |
| GET | `/auth/me` | User | – | `200 { user }` |
| PATCH | `/auth/me` | User | `{ name?, currency?, monthlyIncomeGoal? }` | `200 { user }` |
| PATCH | `/auth/password` | User | `{ currentPassword, newPassword }` | `200 { token, user }` – other sessions are logged out |
| POST | `/auth/logout` | User | – | `204` – every existing token for this user stops working |

Password rules: at least 8 characters, one letter and one number. Login and register are limited to 20 attempts per 15 minutes per IP.

## Categories – `/categories`

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| GET | `/categories` | `?type=income\|expense` | `200 [Category]` |
| POST | `/categories` | `{ name, type, color?, icon? }` | `201 Category` |
| PATCH | `/categories/:id` | `{ name?, color?, icon? }` | `200 Category` |
| DELETE | `/categories/:id` | – | `204`, or `409` if transactions still use it |

## Transactions – `/transactions`

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| GET | `/transactions` | `?search=&type=&category=&from=YYYY-MM-DD&to=YYYY-MM-DD&sort=-date\|date\|-amount\|amount&page=1&limit=10` | `200 { items, page, limit, total, pages }` |
| GET | `/transactions/summary` | `?month=YYYY-MM` (default: current) | `200 { month, income, expense, balance, count, byCategory[], monthly[6] }` |
| GET | `/transactions/:id` | – | `200 Transaction` |
| POST | `/transactions` | `{ category, amount, date, note?, paymentMethod? }` | `201 Transaction` (type comes from the category) |
| PUT | `/transactions/:id` | any of the create fields | `200 Transaction` |
| DELETE | `/transactions/:id` | – | `204` |

`paymentMethod` is one of `cash`, `card`, `upi`, `bank`. Creating or editing an expense can trigger a live **budget alert** notification at 80% and 100% of the budget.

## Budgets – `/budgets`

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| GET | `/budgets` | `?month=YYYY-MM` | `200 [Budget + spent]` |
| POST | `/budgets` | `{ category, month, limit }` | `201 Budget` (expense categories only, one per category per month) |
| PATCH | `/budgets/:id` | `{ limit }` | `200 Budget` |
| DELETE | `/budgets/:id` | – | `204` |

## Notifications – `/notifications`

| Method | Endpoint | Response |
|---|---|---|
| GET | `/notifications` | `200 { items (latest 30), unread }` |
| PATCH | `/notifications/:id/read` | `200 Notification` |
| PATCH | `/notifications/read-all` | `204` |
| DELETE | `/notifications/:id` | `204` |

## Support chat – `/chat`

| Method | Endpoint | Auth | Body / Query | Response |
|---|---|---|---|---|
| GET | `/chat/messages` | User / Admin | admin must pass `?userId=` | `200 [Message]` |
| POST | `/chat/messages` | User / Admin | `{ text, userId? }` (admin needs `userId`) | `201 Message` |
| GET | `/chat/conversations` | Admin | – | `200 [{ _id, user, lastMessage, lastAt }]` |

## Admin – `/admin` (admin role only, others get 403)

| Method | Endpoint | Body / Query | Response |
|---|---|---|---|
| GET | `/admin/stats` | – | `200 { users, admins, active, newThisWeek, transactions, online, volume }` |
| GET | `/admin/users` | `?search=&role=user\|admin&page=` | `200 { items (with online flag), page, total, pages }` |
| PATCH | `/admin/users/:id` | `{ role?, isActive? }` | `200 User` – deactivating revokes the user's tokens and live sockets |
| DELETE | `/admin/users/:id` | – | `204` – deletes the user and all their data |
| POST | `/admin/announcements` | `{ title, message }` | `201 { sent }` – live notification to every active user |

---

## Socket.IO events

Connect to the API origin with the JWT: `io(API_URL, { auth: { token } })`. Connections without a valid token are rejected.

| Direction | Event | Payload | Who |
|---|---|---|---|
| server → client | `notification:new` | Notification | the target user |
| server → client | `transactions:changed` | `{ at }` | the owner's other tabs/devices (auto refresh) |
| client → server | `chat:send` | `{ text, toUserId? }` + ack `{ ok, message \| error }` | users; admins pass `toUserId` |
| server → client | `chat:message` | Message | the conversation's user + all admins |
| client ↔ server | `chat:typing` | `{ toUserId? }` / `{ userId, name }` | typing indicator |
| server → client | `presence:update` | `[userId]` online | admins |
