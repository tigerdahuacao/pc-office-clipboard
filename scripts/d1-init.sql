-- Cloudflare D1 Database Initialization Script
-- Run this script to initialize your D1 database:
-- wrangler d1 execute clipboard-db --file=./scripts/d1-init.sql

-- Settings table for storing the login password
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Topics table for storing clipboard content
CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    content TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default password (change this to your desired password)
INSERT OR IGNORE INTO settings (key, value) VALUES ('password', 'clipboard123');

-- Insert a default topic
INSERT INTO topics (name, content) VALUES ('Default', 'Welcome to your personal clipboard!');
