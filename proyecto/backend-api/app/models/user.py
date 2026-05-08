from sqlalchemy import Column, Integer, String, Boolean, Enum, DateTime
from ..core.database import Base
import enum
from datetime import datetime

class UserRole(str, enum.Enum):
    SOCIO = "socio"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(320), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    phone_number = Column(String(30), nullable=True)
    address = Column(String(255), nullable=True)
    role = Column(Enum(UserRole, name="user_role"), nullable=False, default=UserRole.SOCIO)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
