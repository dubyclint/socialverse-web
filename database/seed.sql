-- Seed data for development
-- Only insert if profiles don't exist
INSERT INTO profiles (id, email, username, role, is_verified, rank, rank_points, status, email_verified) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@socialverse.com', 'admin', 'admin', true, 'gold', 1000, 'active', true),
  ('00000000-0000-0000-0000-000000000002', 'user@socialverse.com', 'testuser', 'user', false, 'bronze', 0, 'active', false)
ON CONFLICT (id) DO NOTHING;

-- Only insert posts if they don't exist
INSERT INTO posts (id, user_id, content, author, pews, created_at)
VALUES 
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Welcome to Socialverse! 🎉', 'admin', 0, NOW()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'This is a test post with **markdown** support!', 'testuser', 0, NOW())
ON CONFLICT (id) DO NOTHING;
