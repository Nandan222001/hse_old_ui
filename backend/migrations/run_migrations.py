"""
Run all SQL migrations in order against a MySQL database.
Usage:  python run_migrations.py
Configure DB credentials via environment variables or edit DB_CONFIG below.
"""

import os
import pymysql
from pathlib import Path

# Load .env if present
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env")
except ImportError:
    pass

DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "port":     int(os.getenv("DB_PORT", 3306)),
    "user":     os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "hse_db"),
}

MIGRATIONS_DIR = Path(__file__).parent


def run_migrations():
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()

    # Track applied migrations in a simple table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS _migrations (
            id          INT AUTO_INCREMENT PRIMARY KEY,
            filename    VARCHAR(255) UNIQUE NOT NULL,
            applied_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
    """)
    conn.commit()

    cursor.execute("SELECT filename FROM _migrations")
    applied = {row[0] for row in cursor.fetchall()}

    sql_files = sorted(MIGRATIONS_DIR.glob("[0-9]*.sql"))

    for sql_file in sql_files:
        if sql_file.name in applied:
            print(f"  skip  {sql_file.name}")
            continue

        print(f"  apply {sql_file.name} ...", end=" ")
        sql = sql_file.read_text(encoding="utf-8")

        # Execute each statement separated by semicolons
        for statement in sql.split(";"):
            statement = statement.strip()
            if statement:
                try:
                    cursor.execute(statement)
                except pymysql.err.OperationalError as e:
                    if e.args[0] in (1050, 1060, 1061):
                        print(f"\n  [info] Skipped duplicate: {e.args[1]}")
                    else:
                        raise

        cursor.execute(
            "INSERT INTO _migrations (filename) VALUES (%s)", (sql_file.name,)
        )
        conn.commit()
        print("done")

    cursor.close()
    conn.close()
    print("\nAll migrations applied.")


if __name__ == "__main__":
    run_migrations()
