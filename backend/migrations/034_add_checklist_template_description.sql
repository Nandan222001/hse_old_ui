-- Migration: 034_add_checklist_template_description
-- Client feedback: "Add a Description field to the Checklist" — checklist_templates
-- had no description column at all.

ALTER TABLE checklist_templates ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER display_name;
