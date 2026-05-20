from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.security import create_access_token, get_password_hash, verify_password
from ..models.pg_models import User
from ..schemas.auth_schema import UserCreate


class AuthService:
    async def register_user(self, db: AsyncSession, user_in: UserCreate) -> User:
        existing = await db.execute(select(User).where(User.email == user_in.email))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

        user = User(email=user_in.email, hashed_password=get_password_hash(user_in.password), role="cliente", is_active=True)
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    async def authenticate_user(self, db: AsyncSession, email: str, password: str) -> User:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
        return user

    def create_token_for_user(self, user: User) -> str:
        return create_access_token(subject=str(user.id), extra_claims={"role": user.role})
