-- Seed: roles
INSERT INTO roles (role_name, job_category, authority_level, permit_authority, safety_signatory) VALUES
  ('Plant Manager', 'Senior Management', 5, 'Yes', 'Yes'),
  ('Safety Manager', 'Senior Management', 5, 'Yes', 'Yes'),
  ('Operations Manager', 'Senior Management', 5, 'Yes', 'Yes'),
  ('Department Supervisor', 'Supervision', 4, 'Yes', 'Yes'),
  ('Shift Leader', 'Supervision', 3, 'Yes', 'No'),
  ('Assembly Technician', 'Technician', 2, 'No', 'No'),
  ('Quality Engineer', 'Technician', 2, 'No', 'No'),
  ('Test Technician', 'Technician', 2, 'No', 'No'),
  ('Maintenance Technician', 'Technician', 2, 'Yes', 'No'),
  ('Machine Operator', 'Operator', 1, 'No', 'No'),
  ('Production Operator', 'Operator', 1, 'No', 'No'),
  ('Administrative Assistant', 'Admin', 1, 'No', 'No'),
  ('Contractor - Specialist', 'Contractor', 1, 'No', 'No');
