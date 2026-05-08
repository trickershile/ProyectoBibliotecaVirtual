from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Biblioteca Virtual API"
    API_V1_STR: str = "/api/v1"
    
    # Seguridad JWT
    SECRET_KEY: str = "super_secret_key_change_me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Bases de Datos
    DATABASE_URL_OVERRIDE: Optional[str] = Field(default=None, alias="DATABASE_URL")

    POSTGRES_USER: str = "admin"
    POSTGRES_PASSWORD: str = "password123"
    POSTGRES_SERVER: str = "postgres"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "biblioteca_virtual"
    
    @property
    def DATABASE_URL(self) -> str:
        if self.DATABASE_URL_OVERRIDE:
            return str(self.DATABASE_URL_OVERRIDE)
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    MONGODB_URL: str = "mongodb://root:rootpassword123@localhost:27017"
    REDIS_URL: str = "redis://localhost:6379/0"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
