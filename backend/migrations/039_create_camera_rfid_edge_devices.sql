-- Migration: 039_create_camera_rfid_edge_devices
-- Physical security/monitoring infrastructure: CCTV cameras, RFID gate readers +
-- their access logs, and edge-AI devices. Previously fully mocked on the frontend
-- with no backing tables at all.

CREATE TABLE IF NOT EXISTS cctv_cameras (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    organisation_id  INT          NULL,
    camera_name      VARCHAR(255) NOT NULL,
    site_id          INT          NULL,
    zone_id          INT          NULL,
    ip_address       VARCHAR(45)  NULL,
    protocol         VARCHAR(20)  NULL,
    resolution       VARCHAR(20)  NULL,
    fps              INT          NULL,
    installed_date   DATE         NULL,
    last_maintenance DATE         NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'Active',
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cctv_cameras_org (organisation_id),
    INDEX idx_cctv_cameras_site (site_id),
    INDEX idx_cctv_cameras_zone (zone_id),
    CONSTRAINT fk_cctv_cameras_org  FOREIGN KEY (organisation_id) REFERENCES organisation(id) ON DELETE SET NULL,
    CONSTRAINT fk_cctv_cameras_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
    CONSTRAINT fk_cctv_cameras_zone FOREIGN KEY (zone_id) REFERENCES working_stations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rfid_readers (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    organisation_id  INT          NULL,
    gate_name        VARCHAR(255) NOT NULL,
    site_id          INT          NULL,
    zone_id          INT          NULL,
    reader_type      VARCHAR(50)  NULL,
    last_seen        DATETIME     NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'Active',
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rfid_readers_org (organisation_id),
    INDEX idx_rfid_readers_site (site_id),
    INDEX idx_rfid_readers_zone (zone_id),
    CONSTRAINT fk_rfid_readers_org  FOREIGN KEY (organisation_id) REFERENCES organisation(id) ON DELETE SET NULL,
    CONSTRAINT fk_rfid_readers_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
    CONSTRAINT fk_rfid_readers_zone FOREIGN KEY (zone_id) REFERENCES working_stations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rfid_access_logs (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    organisation_id  INT          NULL,
    reader_id        INT          NOT NULL,
    employee_id      INT          NULL,
    entry_type       VARCHAR(10)  NOT NULL DEFAULT 'Entry',   -- Entry / Exit
    result           VARCHAR(10)  NOT NULL DEFAULT 'Allowed', -- Allowed / Denied
    logged_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rfid_access_logs_org (organisation_id),
    INDEX idx_rfid_access_logs_reader (reader_id),
    INDEX idx_rfid_access_logs_employee (employee_id),
    INDEX idx_rfid_access_logs_logged_at (logged_at),
    CONSTRAINT fk_rfid_access_logs_org      FOREIGN KEY (organisation_id) REFERENCES organisation(id) ON DELETE SET NULL,
    CONSTRAINT fk_rfid_access_logs_reader   FOREIGN KEY (reader_id) REFERENCES rfid_readers(id) ON DELETE CASCADE,
    CONSTRAINT fk_rfid_access_logs_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS edge_devices (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    organisation_id  INT          NULL,
    device_name      VARCHAR(255) NOT NULL,
    device_type      VARCHAR(100) NULL,
    site_id          INT          NULL,
    zone_id          INT          NULL,
    firmware_version VARCHAR(50)  NULL,
    ai_model_version VARCHAR(50)  NULL,
    last_seen        DATETIME     NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'Online',
    cpu_usage        DECIMAL(5,2) NULL,
    gpu_usage        DECIMAL(5,2) NULL,
    memory_usage     DECIMAL(5,2) NULL,
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_edge_devices_org (organisation_id),
    INDEX idx_edge_devices_site (site_id),
    INDEX idx_edge_devices_zone (zone_id),
    CONSTRAINT fk_edge_devices_org  FOREIGN KEY (organisation_id) REFERENCES organisation(id) ON DELETE SET NULL,
    CONSTRAINT fk_edge_devices_site FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL,
    CONSTRAINT fk_edge_devices_zone FOREIGN KEY (zone_id) REFERENCES working_stations(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
