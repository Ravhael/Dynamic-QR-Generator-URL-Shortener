-- Add sample data to notification_recipients table
-- This script adds realistic notification recipient data for testing

-- Insert sample notification recipients with various delivery statuses
INSERT INTO notification_recipients (
  id, 
  notification_id, 
  user_id, 
  is_delivered, 
  is_read, 
  is_dismissed, 
  is_clicked,
  delivered_popup, 
  delivered_email, 
  delivered_push,
  delivered_at,
  read_at,
  dismissed_at,
  clicked_at,
  email_attempts,
  push_attempts,
  last_attempt_at,
  created_at
) VALUES 
  -- Welcome notification recipients (all users get welcome notification)
  ('33333333-3333-3333-3333-333333333001',
   '26aa7738-d263-4d7f-a197-8895af3f921b', -- Welcome to Scanly v11!
   'af6b7277-5dd7-4a4d-9501-b5e6f15202e8', -- admin@scanly.indovisual.co.id
   true, true, false, true,
   true, true, true,
   NOW() - INTERVAL '2 hours',
   NOW() - INTERVAL '1 hour 30 minutes',
   NULL,
   NOW() - INTERVAL '1 hour',
   1, 1,
   NOW() - INTERVAL '2 hours',
   NOW() - INTERVAL '3 hours'),
   
  ('33333333-3333-3333-3333-333333333002',
   '26aa7738-d263-4d7f-a197-8895af3f921b', -- Welcome to Scanly v11!
   '481f02ab-abda-49de-a6f7-e42f6cebd7b6', -- testuser@example.com
   true, true, false, false,
   true, false, true,
   NOW() - INTERVAL '1 hour 45 minutes',
   NOW() - INTERVAL '45 minutes',
   NULL, NULL,
   0, 1,
   NOW() - INTERVAL '1 hour 45 minutes',
   NOW() - INTERVAL '2 hours'),
   
  ('33333333-3333-3333-3333-333333333003',
   '26aa7738-d263-4d7f-a197-8895af3f921b', -- Welcome to Scanly v11!
   'e99107c4-cba4-4ec4-8f07-473bcfa0f4fa', -- john@scanly.com
   true, false, false, false,
   true, true, false,
   NOW() - INTERVAL '3 hours',
   NULL, NULL, NULL,
   1, 0,
   NOW() - INTERVAL '3 hours',
   NOW() - INTERVAL '4 hours'),
   
  -- Database Backup notification recipients
  ('33333333-3333-3333-3333-333333333004',
   'f4bce2e0-ca50-4db3-9c42-e245f7b0eb60', -- Database Backup Completed
   'af6b7277-5dd7-4a4d-9501-b5e6f15202e8', -- admin@scanly.indovisual.co.id
   true, true, true, false,
   true, true, true,
   NOW() - INTERVAL '5 hours',
   NOW() - INTERVAL '4 hours 30 minutes',
   NOW() - INTERVAL '4 hours',
   NULL,
   1, 1,
   NOW() - INTERVAL '5 hours',
   NOW() - INTERVAL '6 hours'),
   
  ('33333333-3333-3333-3333-333333333005',
   'f4bce2e0-ca50-4db3-9c42-e245f7b0eb60', -- Database Backup Completed
   '58fc6b5a-3c29-4bc5-88ec-b71dde6ec94e', -- test@example.com
   true, false, false, false,
   false, true, true,
   NOW() - INTERVAL '5 hours 15 minutes',
   NULL, NULL, NULL,
   1, 1,
   NOW() - INTERVAL '5 hours 15 minutes',
   NOW() - INTERVAL '6 hours 15 minutes'),
   
  -- Security Update notification recipients
  ('33333333-3333-3333-3333-333333333006',
   '95e048e3-651c-4f49-b866-fed81c8fca71', -- Security Update Required
   'af6b7277-5dd7-4a4d-9501-b5e6f15202e8', -- admin@scanly.indovisual.co.id
   true, true, false, true,
   true, true, true,
   NOW() - INTERVAL '1 day 2 hours',
   NOW() - INTERVAL '1 day 1 hour',
   NULL,
   NOW() - INTERVAL '1 day',
   1, 1,
   NOW() - INTERVAL '1 day 2 hours',
   NOW() - INTERVAL '1 day 3 hours'),
   
  ('33333333-3333-3333-3333-333333333007',
   '95e048e3-651c-4f49-b866-fed81c8fca71', -- Security Update Required
   '481f02ab-abda-49de-a6f7-e42f6cebd7b6', -- testuser@example.com
   false, false, false, false,
   false, false, false,
   NULL, NULL, NULL, NULL,
   3, 2,
   NOW() - INTERVAL '30 minutes',
   NOW() - INTERVAL '1 day 3 hours'),
   
  -- Scheduled Maintenance notification recipients  
  ('33333333-3333-3333-3333-333333333008',
   '19cff0db-51e8-4812-b931-478e10c9fc23', -- Scheduled Maintenance
   'af6b7277-5dd7-4a4d-9501-b5e6f15202e8', -- admin@scanly.indovisual.co.id
   true, true, true, false,
   true, true, false,
   NOW() - INTERVAL '2 days 3 hours',
   NOW() - INTERVAL '2 days 2 hours',
   NOW() - INTERVAL '2 days 1 hour',
   NULL,
   1, 0,
   NOW() - INTERVAL '2 days 3 hours',
   NOW() - INTERVAL '2 days 4 hours'),
   
  ('33333333-3333-3333-3333-333333333009',
   '19cff0db-51e8-4812-b931-478e10c9fc23', -- Scheduled Maintenance
   'e99107c4-cba4-4ec4-8f07-473bcfa0f4fa', -- john@scanly.com
   true, true, false, false,
   true, true, true,
   NOW() - INTERVAL '2 days 4 hours',
   NOW() - INTERVAL '2 days 3 hours 30 minutes',
   NULL, NULL,
   1, 1,
   NOW() - INTERVAL '2 days 4 hours',
   NOW() - INTERVAL '2 days 5 hours'),
   
  ('33333333-3333-3333-3333-333333333010',
   '19cff0db-51e8-4812-b931-478e10c9fc23', -- Scheduled Maintenance
   '1cc6bd81-b061-476b-bd2c-41f034652486', -- testgoture@example.com
   true, false, false, false,
   true, false, true,
   NOW() - INTERVAL '2 days 5 hours',
   NULL, NULL, NULL,
   0, 1,
   NOW() - INTERVAL '2 days 5 hours',
   NOW() - INTERVAL '2 days 6 hours'),
   
  -- New Analytics Dashboard notification recipients
  ('33333333-3333-3333-3333-333333333011',
   '7703daeb-dab6-4838-b7d0-90ac5f166f0f', -- New Analytics Dashboard
   'af6b7277-5dd7-4a4d-9501-b5e6f15202e8', -- admin@scanly.indovisual.co.id
   true, true, false, true,
   true, true, true,
   NOW() - INTERVAL '30 minutes',
   NOW() - INTERVAL '15 minutes',
   NULL,
   NOW() - INTERVAL '10 minutes',
   1, 1,
   NOW() - INTERVAL '30 minutes',
   NOW() - INTERVAL '1 hour'),
   
  ('33333333-3333-3333-3333-333333333012',
   '7703daeb-dab6-4838-b7d0-90ac5f166f0f', -- New Analytics Dashboard
   '481f02ab-abda-49de-a6f7-e42f6cebd7b6', -- testuser@example.com
   true, false, false, false,
   true, true, true,
   NOW() - INTERVAL '25 minutes',
   NULL, NULL, NULL,
   1, 1,
   NOW() - INTERVAL '25 minutes',
   NOW() - INTERVAL '55 minutes'),
   
  ('33333333-3333-3333-3333-333333333013',
   '7703daeb-dab6-4838-b7d0-90ac5f166f0f', -- New Analytics Dashboard
   'e99107c4-cba4-4ec4-8f07-473bcfa0f4fa', -- john@scanly.com
   false, false, false, false,
   false, false, false,
   NULL, NULL, NULL, NULL,
   2, 1,
   NOW() - INTERVAL '5 minutes',
   NOW() - INTERVAL '55 minutes'),
   
  ('33333333-3333-3333-3333-333333333014',
   '7703daeb-dab6-4838-b7d0-90ac5f166f0f', -- New Analytics Dashboard
   '58fc6b5a-3c29-4bc5-88ec-b71dde6ec94e', -- test@example.com
   true, true, true, false,
   true, false, true,
   NOW() - INTERVAL '20 minutes',
   NOW() - INTERVAL '18 minutes',
   NOW() - INTERVAL '15 minutes',
   NULL,
   0, 1,
   NOW() - INTERVAL '20 minutes',
   NOW() - INTERVAL '50 minutes'),
   
  ('33333333-3333-3333-3333-333333333015',
   '7703daeb-dab6-4838-b7d0-90ac5f166f0f', -- New Analytics Dashboard
   '1cc6bd81-b061-476b-bd2c-41f034652486', -- testgoture@example.com
   true, false, false, false,
   false, true, true,
   NOW() - INTERVAL '35 minutes',
   NULL, NULL, NULL,
   1, 1,
   NOW() - INTERVAL '35 minutes',
   NOW() - INTERVAL '1 hour 5 minutes')
ON CONFLICT (id) DO NOTHING;

-- Show results summary
SELECT 
    n.title,
    COUNT(nr.id) as total_recipients,
    SUM(CASE WHEN nr.is_delivered = true THEN 1 ELSE 0 END) as delivered,
    SUM(CASE WHEN nr.is_read = true THEN 1 ELSE 0 END) as read_count,
    SUM(CASE WHEN nr.is_clicked = true THEN 1 ELSE 0 END) as clicked,
    SUM(CASE WHEN nr.delivered_popup = true THEN 1 ELSE 0 END) as popup_delivered,
    SUM(CASE WHEN nr.delivered_email = true THEN 1 ELSE 0 END) as email_delivered,
    SUM(CASE WHEN nr.delivered_push = true THEN 1 ELSE 0 END) as push_delivered
FROM notifications n
LEFT JOIN notification_recipients nr ON n.id = nr.notification_id
GROUP BY n.id, n.title
ORDER BY n.created_at DESC;

-- Show delivery statistics
SELECT 
    'Total Recipients' as metric,
    COUNT(*) as count
FROM notification_recipients
UNION ALL
SELECT 
    'Delivered' as metric,
    COUNT(*) as count
FROM notification_recipients 
WHERE is_delivered = true
UNION ALL
SELECT 
    'Read' as metric,
    COUNT(*) as count
FROM notification_recipients 
WHERE is_read = true
UNION ALL
SELECT 
    'Clicked' as metric,
    COUNT(*) as count
FROM notification_recipients 
WHERE is_clicked = true
UNION ALL
SELECT 
    'Dismissed' as metric,
    COUNT(*) as count
FROM notification_recipients 
WHERE is_dismissed = true;
