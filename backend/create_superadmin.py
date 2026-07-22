import pymysql
import bcrypt

hashed = bcrypt.hashpw("Admin@1234".encode(), bcrypt.gensalt()).decode()

conn = pymysql.connect(host="localhost", port=3306, user="root", password="Freight@123", database="hse")
cur = conn.cursor()

# Ensure superadmin app_role exists
cur.execute("SELECT id FROM app_roles WHERE name='superadmin'")
row = cur.fetchone()
if row:
    role_id = row[0]
    print(f"superadmin role already exists (id={role_id})")
else:
    cur.execute(
        "INSERT INTO app_roles (name, label, description, level) VALUES (%s, %s, %s, %s)",
        ("superadmin", "Super Administrator", "Full platform access", 100),
    )
    conn.commit()
    role_id = cur.lastrowid
    print(f"Created superadmin role (id={role_id})")

# Create or update superadmin user
cur.execute("SELECT id FROM users WHERE username='superadmin'")
if cur.fetchone():
    cur.execute(
        "UPDATE users SET password_hash=%s, app_role_id=%s, is_active=1 WHERE username='superadmin'",
        (hashed, role_id),
    )
    conn.commit()
    print("Updated existing superadmin user password")
else:
    cur.execute(
        "INSERT INTO users (username, email, password_hash, app_role_id, is_active) VALUES (%s, %s, %s, %s, %s)",
        ("superadmin", "superadmin@hse.local", hashed, role_id, 1),
    )
    conn.commit()
    print(f"Created superadmin user (id={cur.lastrowid})")

cur.close()
conn.close()
print("Done.")
