-- Migration: 040_add_timestamps_rfid_access_logs
-- RfidAccessLog inherits from the ORM Base (which declares created_at/updated_at),
-- but 039 only created `logged_at` — add the missing audit columns.

ALTER TABLE rfid_access_logs
    ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
