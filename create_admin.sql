-- Create first SUPER_ADMIN user
-- Password: 'admin123' (bcrypt hashed)
INSERT INTO admin_users (id, email, password_hash, role, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@amzcraft.xyz',
    '$2b$12$LQv3c1yqBwEHxPuNUjNudOzoPQLjXvJkLadGsSDGdVeOHJmqiluDW',
    'SUPER_ADMIN',
    true,
    NOW(),
    NOW()
);