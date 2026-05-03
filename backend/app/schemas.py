from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    name: str
    email: str | None = None
    mobile: str | None = None
    password: str


class UserLogin(BaseModel):
    identifier: str  # email or mobile
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str | None
    mobile: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class VehicleCreate(BaseModel):
    plate_number: str
    vehicle_name: str | None = None
    color: str | None = None


class VehicleResponse(BaseModel):
    id: str
    plate_number: str
    vehicle_name: str | None
    color: str | None
    qr_code_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class IncidentCreate(BaseModel):
    issue_type: str  # "wrong_parking", "damage", "suspicious"
    message: str | None = None
    reporter_name: str | None = None
    reporter_contact: str | None = None


class IncidentResponse(BaseModel):
    id: str
    vehicle_id: str
    issue_type: str
    message: str | None
    reporter_name: str | None
    is_resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    is_read: bool
    created_at: datetime
    incident: IncidentResponse | None = None

    class Config:
        from_attributes = True


class VehicleLookupResponse(BaseModel):
    vehicle_name: str | None
    color: str | None
    plate_number: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
