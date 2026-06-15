-- Seed: hazards
INSERT INTO hazards (category_id, hazard_name, severity, probability) VALUES
  (1, 'Moving Machinery', 'Serious', 'Possible'),
  (1, 'Rotating Equipment', 'Serious', 'Unlikely'),
  (1, 'Crushing Points', 'Serious', 'Unlikely'),
  (2, 'Electrical Shock', 'Serious', 'Unlikely'),
  (2, 'Arc Flash', 'Serious', 'Rare'),
  (3, 'Chemical Exposure', 'Significant', 'Possible'),
  (3, 'Skin/Eye Contact', 'Significant', 'Possible'),
  (4, 'Manual Handling', 'Significant', 'Likely'),
  (4, 'Repetitive Strain', 'Minor', 'Likely'),
  (5, 'Fall from Height', 'Serious', 'Rare'),
  (5, 'Dropped Objects', 'Serious', 'Possible'),
  (6, 'Noise Exposure', 'Significant', 'Likely'),
  (9, 'Fire Risk', 'Serious', 'Unlikely'),
  (9, 'Flammable Vapours', 'Serious', 'Rare'),
  (10, 'Oxygen Deficiency', 'Fatal', 'Rare');
