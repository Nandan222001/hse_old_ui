-- Seed: permit_types
INSERT INTO permit_types (permit_type_name, risk_level, validity_period_hours, concurrent_limit) VALUES
  ('Hot Work Permit', 'Critical', 8, 5),
  ('Confined Space Entry', 'Critical', 4, 2),
  ('Work at Height', 'High', 8, 10),
  ('Equipment Isolation/Lockout', 'Critical', 12, 8),
  ('Excavation/Digging', 'High', 8, 2),
  ('Cold Work', 'Medium', 24, 20),
  ('Chemical Application', 'High', 8, 3),
  ('Testing & Commissioning', 'High', 12, 5);
