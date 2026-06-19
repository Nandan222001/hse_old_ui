"""Reset superadmin password to a known value."""
import pymysql
import bcrypt

new_password = "SuperAdmin@123"
hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()

DB = dict(host="localhost", port=3306, user="root", password="", database="hse_db", charset="utf8mb4")
conn = pymysql.connect(**DB)
cur = conn.cursor()
cur.execute("UPDATE users SET password_hash = %s WHERE email = 'superadmin@hse.local'", (hashed,))
conn.commit()
print(f"Updated {cur.rowcount} row(s)")
print(f"Super Admin login:")
print(f"  Email: superadmin@hse.local")
print(f"  Password: {new_password}")
cur.close()
conn.close()
