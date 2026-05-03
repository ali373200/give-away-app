import io
import base64

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import qrcode

from .database import engine, get_db, Base
from .models import User, Vehicle, Incident, Notification
from .schemas import (
    UserRegister,
    UserLogin,
    UserResponse,
    VehicleCreate,
    VehicleResponse,
    IncidentCreate,
    IncidentResponse,
    NotificationResponse,
    VehicleLookupResponse,
    TokenResponse,
)
from .auth import hash_password, verify_password, create_access_token, get_current_user

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Give Away App", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ISSUE_TYPES = {
    "wrong_parking": "Your vehicle is on the wrong way, please move it",
    "damage": "Your vehicle is damaged, please check",
    "suspicious": "Please check your vehicle, there is something wrong",
}


# ─── Auth Routes ───


@app.post("/api/auth/register", response_model=TokenResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if not data.email and not data.mobile:
        raise HTTPException(400, "Email or mobile number is required")

    if data.email:
        existing = db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(400, "Email already registered")

    if data.mobile:
        existing = db.query(User).filter(User.mobile == data.mobile).first()
        if existing:
            raise HTTPException(400, "Mobile number already registered")

    user = User(
        name=data.name,
        email=data.email,
        mobile=data.mobile,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@app.post("/api/auth/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter((User.email == data.identifier) | (User.mobile == data.identifier))
        .first()
    )
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ─── Vehicle Routes ───


@app.post("/api/vehicles", response_model=VehicleResponse)
def add_vehicle(
    data: VehicleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vehicle = Vehicle(
        owner_id=current_user.id,
        plate_number=data.plate_number,
        vehicle_name=data.vehicle_name,
        color=data.color,
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@app.get("/api/vehicles", response_model=list[VehicleResponse])
def list_vehicles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Vehicle).filter(Vehicle.owner_id == current_user.id).all()


@app.delete("/api/vehicles/{vehicle_id}")
def delete_vehicle(
    vehicle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id, Vehicle.owner_id == current_user.id)
        .first()
    )
    if not vehicle:
        raise HTTPException(404, "Vehicle not found")
    db.delete(vehicle)
    db.commit()
    return {"message": "Vehicle deleted"}


# ─── QR Code Routes ───


@app.get("/api/vehicles/{vehicle_id}/qr")
def get_qr_code(
    vehicle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id, Vehicle.owner_id == current_user.id)
        .first()
    )
    if not vehicle:
        raise HTTPException(404, "Vehicle not found")

    qr_url = f"/report/{vehicle.qr_code_id}"

    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(qr_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")


@app.get("/api/vehicles/{vehicle_id}/qr-data")
def get_qr_data(
    vehicle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id, Vehicle.owner_id == current_user.id)
        .first()
    )
    if not vehicle:
        raise HTTPException(404, "Vehicle not found")

    qr_url = f"/report/{vehicle.qr_code_id}"

    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(qr_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode()

    return {
        "qr_code_id": vehicle.qr_code_id,
        "qr_image": f"data:image/png;base64,{img_base64}",
        "report_url": qr_url,
    }


# ─── Vehicle Lookup (Public - for QR scan) ───


@app.get("/api/lookup/{qr_code_id}", response_model=VehicleLookupResponse)
def lookup_vehicle(qr_code_id: str, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.qr_code_id == qr_code_id).first()
    if not vehicle:
        raise HTTPException(404, "Vehicle not found")
    return VehicleLookupResponse(
        vehicle_name=vehicle.vehicle_name,
        color=vehicle.color,
        plate_number=vehicle.plate_number,
    )


# ─── Incident Reporting (Public - for QR scan) ───


@app.post("/api/report/{qr_code_id}", response_model=IncidentResponse)
def report_incident(
    qr_code_id: str,
    data: IncidentCreate,
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(Vehicle.qr_code_id == qr_code_id).first()
    if not vehicle:
        raise HTTPException(404, "Vehicle not found")

    if data.issue_type not in ISSUE_TYPES:
        raise HTTPException(400, f"Invalid issue type. Must be one of: {list(ISSUE_TYPES.keys())}")

    incident = Incident(
        vehicle_id=vehicle.id,
        issue_type=data.issue_type,
        message=data.message,
        reporter_name=data.reporter_name,
        reporter_contact=data.reporter_contact,
    )
    db.add(incident)
    db.flush()

    notification = Notification(
        owner_id=vehicle.owner_id,
        incident_id=incident.id,
        title=ISSUE_TYPES[data.issue_type],
        message=f"Issue reported for vehicle {vehicle.plate_number}: {ISSUE_TYPES[data.issue_type]}."
        + (f" Additional info: {data.message}" if data.message else ""),
    )
    db.add(notification)
    db.commit()
    db.refresh(incident)
    return incident


# ─── Notifications ───


@app.get("/api/notifications", response_model=list[NotificationResponse])
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Notification)
        .filter(Notification.owner_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@app.get("/api/notifications/unread-count")
def unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = (
        db.query(Notification)
        .filter(Notification.owner_id == current_user.id, Notification.is_read == False)
        .count()
    )
    return {"count": count}


@app.put("/api/notifications/{notification_id}/read")
def mark_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.owner_id == current_user.id)
        .first()
    )
    if not notif:
        raise HTTPException(404, "Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Marked as read"}


@app.put("/api/notifications/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.owner_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


# ─── Incidents (for vehicle owner) ───


@app.get("/api/incidents", response_model=list[IncidentResponse])
def list_incidents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vehicle_ids = [v.id for v in current_user.vehicles]
    return (
        db.query(Incident)
        .filter(Incident.vehicle_id.in_(vehicle_ids))
        .order_by(Incident.created_at.desc())
        .all()
    )


@app.put("/api/incidents/{incident_id}/resolve")
def resolve_incident(
    incident_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vehicle_ids = [v.id for v in current_user.vehicles]
    incident = (
        db.query(Incident)
        .filter(Incident.id == incident_id, Incident.vehicle_id.in_(vehicle_ids))
        .first()
    )
    if not incident:
        raise HTTPException(404, "Incident not found")
    incident.is_resolved = True
    db.commit()
    return {"message": "Incident resolved"}


@app.get("/api/health")
def health():
    return {"status": "ok"}
