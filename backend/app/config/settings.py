from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application
    app_name: str = "HSE Intelligence API"
    app_env: str = "development"
    app_debug: bool = True
    app_version: str = "1.0.0"

    # Database
    db_host: str = "localhost"
    db_port: int = 3306
    db_name: str = "hse_db"
    db_user: str = "root"
    db_password: str = ""
    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_pool_timeout: int = 30

    # Logging
    log_level: str = "DEBUG"
    log_dir: str = "logs"
    log_max_bytes: int = 10_485_760
    log_backup_count: int = 5

    # Security
    secret_key: str = "change-me-in-production"
    allowed_origins: str = "http://localhost:3000"

    # JWT
    jwt_secret_key: str = "hse-jwt-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 24  # 24 hours

    # Twilio SendGrid Email
    sendgrid_api_key: str = ""
    email_from_address: str = "noreply@hse-intelligence.com"
    email_from_name: str = "HSE Intelligence"

    # App
    frontend_url: str = "http://localhost:5173"

    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
