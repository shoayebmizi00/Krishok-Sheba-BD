# REST API

Base URL: `http://localhost:5000/api`

Authenticated requests use:

```http
Authorization: Bearer <jwt>
```

## Authentication

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/register` | Register a farmer, buyer, equipment owner, or transport provider |
| POST | `/auth/login` | Login and receive a JWT |
| POST | `/auth/logout` | Stateless logout acknowledgement |
| GET | `/auth/me` | Current user |
| PATCH | `/auth/me` | Update current profile |
| POST | `/auth/forgot-password` | Create a time-limited reset token |
| POST | `/auth/reset-password` | Set a new password |

Registration body:

```json
{
  "full_name": "Rahim Uddin",
  "email": "rahim@example.com",
  "password": "strong-password",
  "role": "farmer"
}
```

Roles: `admin`, `farmer`, `buyer`, `equipment_owner`, `transport_provider`.

## Resources

Every resource supports the standard routes below. Public listing access and write authorization vary by resource and role.

| Method | Route pattern | Purpose |
|---|---|---|
| GET | `/api/{resource}?sort=-created_date&limit=100&field=value` | List and filter |
| GET | `/api/{resource}/{id}` | Get one |
| POST | `/api/{resource}` | Create |
| PATCH | `/api/{resource}/{id}` | Update |
| DELETE | `/api/{resource}/{id}` | Delete |

Available resources:

| Resource | Route |
|---|---|
| Users | `/users` |
| Crop listings | `/crop-listings` |
| Bids | `/bids` |
| Conversations | `/conversations` |
| Messages | `/messages` |
| Equipment | `/equipment` |
| Equipment bookings | `/equipment-bookings` |
| Vehicles | `/vehicles` |
| Transport bookings | `/transport-bookings` |
| Orders | `/orders` |
| Products | `/products` |
| Transactions | `/transactions` |
| Notifications | `/notifications` |
| Government notices | `/government-notices` |
| Market prices | `/market-prices` |

Examples:

```http
GET /api/crop-listings?status=active&sort=-created_date&limit=50
POST /api/crop-listings
PATCH /api/crop-listings/7d57d6d4-9f61-4dcb-a50f-7e68e7ef3cd5
DELETE /api/crop-listings/7d57d6d4-9f61-4dcb-a50f-7e68e7ef3cd5
```

## Uploads

```http
POST /api/uploads/{folder}
Content-Type: multipart/form-data
Authorization: Bearer <jwt>
```

Folders: `crops`, `equipment`, `vehicles`, `profiles`.

Form field: `file`.

Response:

```json
{
  "file_url": "http://localhost:5000/uploads/crops/filename.webp"
}
```

Allowed formats are JPEG, PNG, WebP, and GIF. The default size limit is 5 MB.
