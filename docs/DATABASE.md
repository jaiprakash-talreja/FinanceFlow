# Database Schema (MongoDB + Mongoose)

```mermaid
erDiagram
    USER ||--o{ CATEGORY : owns
    USER ||--o{ TRANSACTION : records
    USER ||--o{ BUDGET : sets
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ MESSAGE : "conversation"
    CATEGORY ||--o{ TRANSACTION : classifies
    CATEGORY ||--o{ BUDGET : limits

    USER {
        ObjectId _id
        string name
        string email UK
        string password "bcrypt hash, select:false"
        string role "user | admin"
        boolean isActive
        string currency
        number monthlyIncomeGoal
        number tokenVersion "select:false"
        date lastLoginAt
    }
    CATEGORY {
        ObjectId _id
        ObjectId user FK
        string name
        string type "income | expense"
        string color
        string icon
    }
    TRANSACTION {
        ObjectId _id
        ObjectId user FK
        ObjectId category FK
        string type
        number amount
        date date
        string note
        string paymentMethod
    }
    BUDGET {
        ObjectId _id
        ObjectId user FK
        ObjectId category FK
        string month "YYYY-MM"
        number limit
    }
    NOTIFICATION {
        ObjectId _id
        ObjectId user FK
        string kind
        string title
        string message
        boolean read
    }
    MESSAGE {
        ObjectId _id
        ObjectId conversation FK "the user the thread belongs to"
        ObjectId sender FK
        string text
        boolean fromAdmin
    }
```

## Collections

| Model | Key validation | Indexes |
|---|---|---|
| **User** | name 2–60 chars, valid unique email, password ≥ 8 (hashed with bcrypt, cost 12), role enum | `email` unique, `role` |
| **Category** | name ≤ 40, type enum, hex color | `{ user, type, name }` unique |
| **Transaction** | amount > 0, date required, note ≤ 200, paymentMethod enum | `{ user, date: -1 }`, `{ user, category, date: -1 }`, text index on `note` |
| **Budget** | month `YYYY-MM`, limit ≥ 1 | `{ user, month, category }` unique |
| **Notification** | kind enum, title ≤ 100, message ≤ 500 | `{ user, read, createdAt: -1 }` |
| **Message** | text 1–1000 chars | `{ conversation, createdAt }` |

## Relationships

All relationships are **references** (`ObjectId` + `ref`) resolved with `.populate()`:

- `Transaction.category → Category` (populated with name, color, icon, type)
- `Budget.category → Category`
- `Message.sender → User` (name, role)
- Aggregations use `$lookup` for spending-by-category and the admin conversation list.

## Query optimisation

- Every query is filtered by `user` first, so the compound indexes above serve them.
- List endpoints use `.lean()`, pagination (`skip`/`limit`, max 100) and only populate the fields the UI needs.
- Dashboard totals, category breakdown and the 6-month trend run as three parallel aggregation pipelines.
- Sensitive fields (`password`, `tokenVersion`) are `select: false` and stripped in `toJSON`.
