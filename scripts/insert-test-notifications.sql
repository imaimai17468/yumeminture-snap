-- Insert test notifications for user 45a12fc3-c100-4a30-8e22-ca7fff60d15e

-- Get some random user IDs to use as related users
WITH random_users AS (
  SELECT id, name FROM users 
  WHERE id != '45a12fc3-c100-4a30-8e22-ca7fff60d15e' 
  LIMIT 10
),
random_orgs AS (
  SELECT id, name FROM organizations LIMIT 5
)

-- Insert 40 test notifications with various types
INSERT INTO notifications (user_id, type, title, message, related_user_id, related_organization_id, is_read, created_at)
VALUES
  -- Join request notifications (5)
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'join_request', 'New Join Request', 'John Doe requested to join your organization', (SELECT id FROM random_users LIMIT 1 OFFSET 0), (SELECT id FROM random_orgs LIMIT 1 OFFSET 0), false, NOW() - INTERVAL '1 hour'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'join_request', 'New Join Request', 'Jane Smith requested to join your organization', (SELECT id FROM random_users LIMIT 1 OFFSET 1), (SELECT id FROM random_orgs LIMIT 1 OFFSET 0), true, NOW() - INTERVAL '2 hours'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'join_request', 'New Join Request', 'Bob Johnson requested to join your organization', (SELECT id FROM random_users LIMIT 1 OFFSET 2), (SELECT id FROM random_orgs LIMIT 1 OFFSET 0), false, NOW() - INTERVAL '3 hours'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'join_request', 'New Join Request', 'Alice Brown requested to join your organization', (SELECT id FROM random_users LIMIT 1 OFFSET 3), (SELECT id FROM random_orgs LIMIT 1 OFFSET 0), false, NOW() - INTERVAL '4 hours'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'join_request', 'New Join Request', 'Charlie Wilson requested to join your organization', (SELECT id FROM random_users LIMIT 1 OFFSET 4), (SELECT id FROM random_orgs LIMIT 1 OFFSET 0), true, NOW() - INTERVAL '5 hours'),

  -- Join approved notifications (5)
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'join_approved', 'Join Request Approved', 'Your request to join Tech Innovators has been approved!', NULL, (SELECT id FROM random_orgs LIMIT 1 OFFSET 1), false, NOW() - INTERVAL '6 hours'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'join_approved', 'Join Request Approved', 'Your request to join Creative Studio has been approved!', NULL, (SELECT id FROM random_orgs LIMIT 1 OFFSET 2), true, NOW() - INTERVAL '1 day'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'join_approved', 'Join Request Approved', 'Your request to join Digital Agency has been approved!', NULL, (SELECT id FROM random_orgs LIMIT 1 OFFSET 3), true, NOW() - INTERVAL '2 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'join_approved', 'Join Request Approved', 'Your request to join Startup Hub has been approved!', NULL, (SELECT id FROM random_orgs LIMIT 1 OFFSET 4), false, NOW() - INTERVAL '3 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'join_approved', 'Join Request Approved', 'Your request to join Innovation Lab has been approved!', NULL, (SELECT id FROM random_orgs LIMIT 1 OFFSET 0), true, NOW() - INTERVAL '4 days'),

  -- Join rejected notifications (3)
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'join_rejected', 'Join Request Rejected', 'Your request to join Elite Company has been rejected.', NULL, (SELECT id FROM random_orgs LIMIT 1 OFFSET 1), false, NOW() - INTERVAL '5 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'join_rejected', 'Join Request Rejected', 'Your request to join Premium Inc has been rejected.', NULL, (SELECT id FROM random_orgs LIMIT 1 OFFSET 2), true, NOW() - INTERVAL '6 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'join_rejected', 'Join Request Rejected', 'Your request to join Exclusive Corp has been rejected.', NULL, (SELECT id FROM random_orgs LIMIT 1 OFFSET 3), true, NOW() - INTERVAL '7 days'),

  -- Photo tagged notifications (10)
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'photo_tagged', 'You were tagged in a photo', 'Sarah Miller tagged you in a photo', (SELECT id FROM random_users LIMIT 1 OFFSET 5), NULL, false, NOW() - INTERVAL '8 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'photo_tagged', 'You were tagged in a photo', 'Tom Davis tagged you in a photo', (SELECT id FROM random_users LIMIT 1 OFFSET 6), NULL, false, NOW() - INTERVAL '9 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'photo_tagged', 'You were tagged in a photo', 'Emma Wilson tagged you in a photo', (SELECT id FROM random_users LIMIT 1 OFFSET 7), NULL, true, NOW() - INTERVAL '10 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'photo_tagged', 'You were tagged in a photo', 'James Taylor tagged you in a photo', (SELECT id FROM random_users LIMIT 1 OFFSET 8), NULL, false, NOW() - INTERVAL '11 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'photo_tagged', 'You were tagged in a photo', 'Olivia Anderson tagged you in a photo', (SELECT id FROM random_users LIMIT 1 OFFSET 9), NULL, true, NOW() - INTERVAL '12 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'photo_tagged', 'You were tagged in a photo', 'Michael Thomas tagged you in a photo', (SELECT id FROM random_users LIMIT 1 OFFSET 0), NULL, false, NOW() - INTERVAL '13 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'photo_tagged', 'You were tagged in a photo', 'Sophia Jackson tagged you in a photo', (SELECT id FROM random_users LIMIT 1 OFFSET 1), NULL, true, NOW() - INTERVAL '14 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'photo_tagged', 'You were tagged in a photo', 'William White tagged you in a photo', (SELECT id FROM random_users LIMIT 1 OFFSET 2), NULL, false, NOW() - INTERVAL '15 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'photo_tagged', 'You were tagged in a photo', 'Isabella Harris tagged you in a photo', (SELECT id FROM random_users LIMIT 1 OFFSET 3), NULL, true, NOW() - INTERVAL '16 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'photo_tagged', 'You were tagged in a photo', 'Daniel Martin tagged you in a photo', (SELECT id FROM random_users LIMIT 1 OFFSET 4), NULL, false, NOW() - INTERVAL '17 days'),

  -- New friend notifications (10)
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'new_friend', 'New Friend', 'Emily Thompson is now your friend!', (SELECT id FROM random_users LIMIT 1 OFFSET 5), NULL, false, NOW() - INTERVAL '18 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'new_friend', 'New Friend', 'Christopher Garcia is now your friend!', (SELECT id FROM random_users LIMIT 1 OFFSET 6), NULL, true, NOW() - INTERVAL '19 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'new_friend', 'New Friend', 'Madison Martinez is now your friend!', (SELECT id FROM random_users LIMIT 1 OFFSET 7), NULL, false, NOW() - INTERVAL '20 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'new_friend', 'New Friend', 'Alexander Robinson is now your friend!', (SELECT id FROM random_users LIMIT 1 OFFSET 8), NULL, true, NOW() - INTERVAL '21 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'new_friend', 'New Friend', 'Abigail Clark is now your friend!', (SELECT id FROM random_users LIMIT 1 OFFSET 9), NULL, false, NOW() - INTERVAL '22 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'new_friend', 'New Friend', 'Ethan Rodriguez is now your friend!', (SELECT id FROM random_users LIMIT 1 OFFSET 0), NULL, true, NOW() - INTERVAL '23 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'new_friend', 'New Friend', 'Elizabeth Lewis is now your friend!', (SELECT id FROM random_users LIMIT 1 OFFSET 1), NULL, false, NOW() - INTERVAL '24 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'new_friend', 'New Friend', 'Matthew Lee is now your friend!', (SELECT id FROM random_users LIMIT 1 OFFSET 2), NULL, true, NOW() - INTERVAL '25 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'new_friend', 'New Friend', 'Avery Walker is now your friend!', (SELECT id FROM random_users LIMIT 1 OFFSET 3), NULL, false, NOW() - INTERVAL '26 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'new_friend', 'New Friend', 'Joseph Hall is now your friend!', (SELECT id FROM random_users LIMIT 1 OFFSET 4), NULL, true, NOW() - INTERVAL '27 days'),

  -- Member removed notifications (3)
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'member_removed', 'Member Removed', 'You have been removed from Marketing Team', NULL, (SELECT id FROM random_orgs LIMIT 1 OFFSET 0), false, NOW() - INTERVAL '28 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'member_removed', 'Member Removed', 'David Brown was removed from your organization', (SELECT id FROM random_users LIMIT 1 OFFSET 5), (SELECT id FROM random_orgs LIMIT 1 OFFSET 1), true, NOW() - INTERVAL '29 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'member_removed', 'Member Removed', 'Lisa Johnson was removed from your organization', (SELECT id FROM random_users LIMIT 1 OFFSET 6), (SELECT id FROM random_orgs LIMIT 1 OFFSET 1), false, NOW() - INTERVAL '30 days'),

  -- Role changed notifications (4)
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'role_changed', 'Role Changed', 'Your role has been changed to Admin in Tech Company', NULL, (SELECT id FROM random_orgs LIMIT 1 OFFSET 2), false, NOW() - INTERVAL '31 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'role_changed', 'Role Changed', 'Your role has been changed to Member in Design Studio', NULL, (SELECT id FROM random_orgs LIMIT 1 OFFSET 3), true, NOW() - INTERVAL '32 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'role_changed', 'Role Changed', 'Mark Wilson''s role changed to Admin', (SELECT id FROM random_users LIMIT 1 OFFSET 7), (SELECT id FROM random_orgs LIMIT 1 OFFSET 4), false, NOW() - INTERVAL '33 days'),
  ('45a12fc3-c100-4a30-8e22-ca7fff60d15e', 'role_changed', 'Role Changed', 'Jennifer Davis''s role changed to Member', (SELECT id FROM random_users LIMIT 1 OFFSET 8), (SELECT id FROM random_orgs LIMIT 1 OFFSET 4), true, NOW() - INTERVAL '34 days');