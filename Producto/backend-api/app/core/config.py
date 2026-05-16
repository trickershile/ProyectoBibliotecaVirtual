from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Biblioteca Virtual API"
    API_V1_STR: str = "/api/v1"
    
    # Seguridad JWT
    SECRET_KEY: str = "super_secret_key_change_me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Bases de Datos
    POSTGRES_USER: str = "admin"
    POSTGRES_PASSWORD: str = "password123"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "biblioteca_virtual"
    DATABASE_URL_OVERRIDE: Optional[str] = Field(default=None, validation_alias="DATABASE_URL")

    SUPABASE_URL: Optional[str] = None
    
    @property
    def DATABASE_URL(self) -> str:
        if self.DATABASE_URL_OVERRIDE:
            return self.DATABASE_URL_OVERRIDE
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def SUPABASE_ISSUER(self) -> Optional[str]:
        if not self.SUPABASE_URL:
            return None
        return f"{self.SUPABASE_URL}/auth/v1"

    @property
    def SUPABASE_JWKS_URL(self) -> Optional[str]:
        if not self.SUPABASE_URL:
            return None
        return f"{self.SUPABASE_URL}/auth/v1/keys"
    
    MONGODB_URL: str = "mongodb://root:rootpassword123@localhost:27017"
    REDIS_URL: str = "redis://localhost:6379/0"

settings = Settings()
