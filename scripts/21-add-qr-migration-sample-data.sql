-- Add sample data to qr_migration table
-- This script adds realistic QR migration data for testing migration functionality

-- Insert sample QR migration records with different statuses and types
INSERT INTO qr_migration (
  id,
  user_id,
  original_qr_url,
  migrated_qr_id,
  migration_status,
  migration_type,
  original_file_name,
  original_file_size,
  original_file_type,
  error_message,
  migration_notes,
  metadata,
  started_at,
  completed_at,
  created_at,
  updated_at
) VALUES 
  -- Successful migrations
  ('44444444-4444-4444-4444-444444444001',
   'af6b7277-5dd7-4a4d-9501-b5e6f15202e8', -- admin@scanly.indovisual.co.id
   'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=https://www.google.com&choe=UTF-8',
   '550e8400-e29b-41d4-a716-446655440001', -- Google Website QR
   'completed',
   'url_conversion',
   'google_qr.png',
   15420,
   'image/png',
   NULL,
   'Successfully migrated Google Charts QR code to Scanly format',
   '{"original_service": "Google Charts", "qr_size": "300x300", "encoding": "UTF-8", "complexity": "simple"}',
   NOW() - INTERVAL '2 days 3 hours',
   NOW() - INTERVAL '2 days 2 hours',
   NOW() - INTERVAL '2 days 3 hours',
   NOW() - INTERVAL '2 days 2 hours'),
   
  ('44444444-4444-4444-4444-444444444002',
   '481f02ab-abda-49de-a6f7-e42f6cebd7b6', -- testuser@example.com
   'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=tel:+1234567890',
   '550e8400-e29b-41d4-a716-446655440005', -- Email Contact QR
   'completed',
   'file_upload',
   'contact_qr_code.jpg',
   8750,
   'image/jpeg',
   NULL,
   'Migrated contact QR code from QR Server API',
   '{"original_service": "QR Server", "qr_size": "200x200", "data_type": "phone", "compression": "jpeg"}',
   NOW() - INTERVAL '1 day 5 hours',
   NOW() - INTERVAL '1 day 4 hours',
   NOW() - INTERVAL '1 day 5 hours',
   NOW() - INTERVAL '1 day 4 hours'),
   
  ('44444444-4444-4444-4444-444444444003',
   'e99107c4-cba4-4ec4-8f07-473bcfa0f4fa', -- john@scanly.com
   'https://quickchart.io/qr?text=https://youtube.com/watch?v=dQw4w9WgXcQ&size=250',
   '550e8400-e29b-41d4-a716-446655440003', -- YouTube Channel QR
   'completed',
   'url_conversion',
   'youtube_share.png',
   12300,
   'image/png',
   NULL,
   'Migrated YouTube QR code from QuickChart service',
   '{"original_service": "QuickChart", "qr_size": "250x250", "content_type": "youtube_video", "migration_reason": "service_consolidation"}',
   NOW() - INTERVAL '3 hours 30 minutes',
   NOW() - INTERVAL '3 hours',
   NOW() - INTERVAL '3 hours 30 minutes',
   NOW() - INTERVAL '3 hours'),
   
  -- Migration in progress
  ('44444444-4444-4444-4444-444444444004',
   'af6b7277-5dd7-4a4d-9501-b5e6f15202e8', -- admin@scanly.indovisual.co.id
   'https://zxing.appspot.com/generator?type=TEXT&data=WIFI:T:WPA;S:MyNetwork;P:SecretPass123;;',
   NULL,
   'processing',
   'file_upload',
   'wifi_qr_batch_01.svg',
   4580,
   'image/svg+xml',
   NULL,
   'Processing WiFi QR code migration from ZXing generator',
   '{"original_service": "ZXing", "data_type": "wifi", "file_format": "svg", "batch_id": "batch_01"}',
   NOW() - INTERVAL '45 minutes',
   NULL,
   NOW() - INTERVAL '45 minutes',
   NOW() - INTERVAL '30 minutes'),
   
  ('44444444-4444-4444-4444-444444444005',
   '58fc6b5a-3c29-4bc5-88ec-b71dde6ec94e', -- test@example.com
   'https://www.qr-code-generator.com/api/?size=300&data=https://linkedin.com/in/johndoe',
   NULL,
   'processing',
   'bulk_import',
   'linkedin_profiles.zip',
   156700,
   'application/zip',
   NULL,
   'Bulk importing LinkedIn profile QR codes',
   '{"original_service": "QR Code Generator", "batch_count": 25, "file_type": "zip_archive", "content_type": "linkedin_profiles"}',
   NOW() - INTERVAL '15 minutes',
   NULL,
   NOW() - INTERVAL '20 minutes',
   NOW() - INTERVAL '10 minutes'),
   
  -- Failed migrations
  ('44444444-4444-4444-4444-444444444006',
   '481f02ab-abda-49de-a6f7-e42f6cebd7b6', -- testuser@example.com
   'https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=corrupted_data_here',
   NULL,
   'failed',
   'url_conversion',
   'corrupted_qr.bmp',
   25600,
   'image/bmp',
   'Invalid QR code data: Unable to decode original QR content',
   'Migration failed due to corrupted source QR code',
   '{"original_service": "QR Server", "error_code": "DECODE_ERROR", "retry_count": 3, "last_retry": "2025-08-28T10:30:00Z"}',
   NOW() - INTERVAL '4 hours',
   NOW() - INTERVAL '4 hours',
   NOW() - INTERVAL '4 hours 15 minutes',
   NOW() - INTERVAL '4 hours'),
   
  ('44444444-4444-4444-4444-444444444007',
   'e99107c4-cba4-4ec4-8f07-473bcfa0f4fa', -- john@scanly.com
   'https://chart.googleapis.com/chart?chs=1000x1000&cht=qr&chl=VeryLongDataThatExceedsLimits...',
   NULL,
   'failed',
   'file_upload',
   'large_qr_data.png',
   89400,
   'image/png',
   'QR data exceeds maximum allowed length of 2048 characters',
   'Migration failed: QR code data too large for current system limits',
   '{"original_service": "Google Charts", "data_length": 3500, "max_allowed": 2048, "error_type": "DATA_TOO_LARGE"}',
   NOW() - INTERVAL '6 hours 20 minutes',
   NOW() - INTERVAL '6 hours 20 minutes',
   NOW() - INTERVAL '6 hours 30 minutes',
   NOW() - INTERVAL '6 hours 20 minutes'),
   
  -- Pending migrations
  ('44444444-4444-4444-4444-444444444008',
   'af6b7277-5dd7-4a4d-9501-b5e6f15202e8', -- admin@scanly.indovisual.co.id
   'https://qr1.at/api/qr?size=400&url=https://github.com/scanlyproject/scanly',
   NULL,
   'pending',
   'url_conversion',
   'github_repo.png',
   18900,
   'image/png',
   NULL,
   'Queued for migration: GitHub repository QR code',
   '{"original_service": "QR1.at", "qr_size": "400x400", "content_type": "github_repo", "priority": "normal"}',
   NOW() - INTERVAL '10 minutes',
   NULL,
   NOW() - INTERVAL '12 minutes',
   NOW() - INTERVAL '10 minutes'),
   
  ('44444444-4444-4444-4444-444444444009',
   '58fc6b5a-3c29-4bc5-88ec-b71dde6ec94e', -- test@example.com
   'https://www.the-qrcode-generator.com/api/create?text=MECARD:N:Smith,John;EMAIL:john@example.com;;',
   NULL,
   'pending',
   'bulk_import',
   'business_cards_batch.zip',
   245800,
   'application/zip',
   NULL,
   'Scheduled for bulk migration: Business card QR codes collection',
   '{"original_service": "The QR Code Generator", "batch_count": 50, "data_type": "mecard", "estimated_time": "15_minutes"}',
   NOW() - INTERVAL '5 minutes',
   NULL,
   NOW() - INTERVAL '8 minutes',
   NOW() - INTERVAL '5 minutes'),
   
  -- Recently queued
  ('44444444-4444-4444-4444-444444444010',
   '481f02ab-abda-49de-a6f7-e42f6cebd7b6', -- testuser@example.com
   'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://twitter.com/scanlyapp',
   NULL,
   'pending',
   'file_upload',
   'twitter_profile.jpg',
   13400,
   'image/jpeg',
   NULL,
   'Recently submitted: Twitter profile QR code migration',
   '{"original_service": "QR Server", "content_type": "social_media", "platform": "twitter", "submission_method": "web_upload"}',
   NOW() - INTERVAL '2 minutes',
   NULL,
   NOW() - INTERVAL '3 minutes',
   NOW() - INTERVAL '2 minutes')
ON CONFLICT (id) DO NOTHING;

-- Show migration statistics
SELECT 
    migration_status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM qr_migration 
GROUP BY migration_status
ORDER BY count DESC;

-- Show migration types distribution
SELECT 
    migration_type,
    COUNT(*) as count,
    AVG(original_file_size) as avg_file_size
FROM qr_migration 
GROUP BY migration_type
ORDER BY count DESC;

-- Show recent migration activity
SELECT 
    u.email,
    qm.migration_status,
    qm.migration_type,
    qm.original_file_name,
    qm.started_at,
    qm.completed_at
FROM qr_migration qm
JOIN auth.users u ON qm.user_id = u.id
ORDER BY qm.started_at DESC
LIMIT 5;
