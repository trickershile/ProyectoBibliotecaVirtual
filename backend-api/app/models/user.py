from sqlalchemy import Column, Integer, String, Boolean, Enum
from ..core.database import Base
import enum

class UserRole(str, enum.Enum):
    SOCIO = "socio"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    address = Column(String, nullable=True)
    role = Column(String, default=UserRole.SOCIO)
    is_active = Column(Boolean, default=True)
