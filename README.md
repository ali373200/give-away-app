# Give Away App

A smart vehicle communication app that uses QR codes to enable instant issue reporting between vehicle owners and the public.

## How It Works

### Phase 1: Registration & QR Code Generation
1. User downloads/opens the app
2. Registers with mobile number or email
3. Adds their vehicle(s) with plate number, name, and color
4. A unique QR code is generated for each vehicle
5. User prints and sticks the QR code on their vehicle (front/back)

### Phase 2: Issue Detection & Reporting
1. Someone notices an issue with a parked vehicle (wrong parking, damage, suspicious activity)
2. They scan the QR code on the vehicle using the app
3. They select the type of issue:
   - "Your vehicle is on the wrong way, please"
   - "Your vehicle is damaged, please"
   - "Please check your vehicle, there is something wrong"
4. Optionally add a message and contact info

### Phase 3: Vehicle Owner Notification
1. The vehicle owner receives an instant notification
2. They can view the issue details
3. They take action (move vehicle, check damage, verify issue)

## Tech Stack

- **Frontend**: React + Vite (mobile-first responsive design)
- **Backend**: FastAPI (Python)
- **Database**: SQLite
- **QR Code**: Generated server-side with `qrcode` library

## Setup

### Backend
```bash
cd backend
pip install -e .
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api` requests to the backend at `http://localhost:8000`.

## API Endpoints

### Auth
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Vehicles
- `POST /api/vehicles` - Add a vehicle
- `GET /api/vehicles` - List user's vehicles
- `DELETE /api/vehicles/{id}` - Delete a vehicle
- `GET /api/vehicles/{id}/qr` - Get QR code image
- `GET /api/vehicles/{id}/qr-data` - Get QR code as base64

### Reporting (Public)
- `GET /api/lookup/{qr_code_id}` - Look up vehicle by QR code
- `POST /api/report/{qr_code_id}` - Report an issue

### Notifications
- `GET /api/notifications` - List notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/{id}/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

### Incidents
- `GET /api/incidents` - List incidents for user's vehicles
- `PUT /api/incidents/{id}/resolve` - Resolve an incident
