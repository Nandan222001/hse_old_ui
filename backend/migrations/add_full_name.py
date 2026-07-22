"""Add full_name column to users table."""
import pymysql

DB = dict(host="localhost", port=3306, user="root", password="Freight@123", database="hse", charset="utf8mb4")
conn = pymysql.connect(**DB)
cur = conn.cursor()

cur.execute("""
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'hse' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'full_name'
""")
if cur.fetchone()[0] == 0:
    cur.execute("ALTER TABLE users ADD COLUMN full_name VARCHAR(255) NULL AFTER username")
    print("Added full_name column to users table")
else:
    print("full_name already exists, skipping")

conn.commit()
cur.close()
conn.close()
print("Done.")
