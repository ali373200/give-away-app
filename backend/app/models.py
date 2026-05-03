import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship

from .database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=True)
    mobile = Column(String(20), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utcnow)

    vehicles = relationship("Vehicle", back_populates="owner")
    notifications = relationship("Notification", back_populates="owner")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(String, primary_key=True, default=generate_uuid)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    plate_number = Column(String(20), nullable=False)
    vehicle_name = Column(String(100), nullable=True)
    color = Column(String(50), nullable=True)
    qr_code_id = Column(String, unique=True, default=generate_uuid)
    created_at = Column(DateTime, default=utcnow)

    owner = relationship("User", back_populates="vehicles")
    incidents = relationship("Incident", back_populates="vehicle")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, default=generate_uuid)
    vehicle_id = Column(String, ForeignKey("vehicles.id"), nullable=False)
    issue_type = Column(String(50), nullable=False)
    message = Column(Text, nullable=True)
    reporter_name = Column(String(100), nullable=True)
    reporter_contact = Column(String(255), nullable=True)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    vehicle = relationship("Vehicle", back_populates="incidents")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    owner = relationship("User", back_populates="notifications")
    incident = relationship("Incident")
