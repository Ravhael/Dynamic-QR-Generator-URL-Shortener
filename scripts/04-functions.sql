-- Database functions for QR Code & URL Management Platform

-- Function to increment QR code scan count
CREATE OR REPLACE FUNCTION increment_qr_scan(qr_code_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE qr_codes 
    SET scans = scans + 1 
    WHERE id = qr_code_uuid AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment URL click count
CREATE OR REPLACE FUNCTION increment_url_click(url_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE short_urls 
    SET clicks = clicks + 1 
    WHERE id = url_uuid AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user analytics summary
CREATE OR REPLACE FUNCTION get_user_analytics_summary(user_uuid UUID)
RETURNS TABLE(
    qr_code_count BIGINT,
    short_url_count BIGINT,
    total_scans BIGINT,
    total_clicks BIGINT,
    active_qr_codes BIGINT,
    active_short_urls BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM qr_codes WHERE user_id = user_uuid),
        (SELECT COUNT(*) FROM short_urls WHERE user_id = user_uuid),
        (SELECT COALESCE(SUM(scans), 0) FROM qr_codes WHERE user_id = user_uuid),
        (SELECT COALESCE(SUM(clicks), 0) FROM short_urls WHERE user_id = user_uuid),
        (SELECT COUNT(*) FROM qr_codes WHERE user_id = user_uuid AND is_active = true),
        (SELECT COUNT(*) FROM short_urls WHERE user_id = user_uuid AND is_active = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean expired QR codes and URLs
CREATE OR REPLACE FUNCTION cleanup_expired_items()
RETURNS void AS $$
BEGIN
    -- Deactivate expired QR codes
    UPDATE qr_codes 
    SET is_active = false 
    WHERE expires_at IS NOT NULL AND expires_at < NOW() AND is_active = true;
    
    -- Deactivate expired URLs
    UPDATE short_urls 
    SET is_active = false 
    WHERE expires_at IS NOT NULL AND expires_at < NOW() AND is_active = true;
    
    -- Deactivate QR codes that reached max scans
    UPDATE qr_codes 
    SET is_active = false 
    WHERE max_scans IS NOT NULL AND scans >= max_scans AND is_active = true;
    
    -- Deactivate URLs that reached max clicks
    UPDATE short_urls 
    SET is_active = false 
    WHERE max_clicks IS NOT NULL AND clicks >= max_clicks AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get analytics by date range
CREATE OR REPLACE FUNCTION get_analytics_by_date_range(
    user_uuid UUID,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(
    date DATE,
    qr_scans BIGINT,
    url_clicks BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(start_date::date, end_date::date, '1 day'::interval)::date AS date
    ),
    qr_scans AS (
        SELECT 
            qsa.scanned_at::date AS date,
            COUNT(*) AS scans
        FROM qr_scan_analytics qsa
        JOIN qr_codes qc ON qsa.qr_code_id = qc.id
        WHERE qc.user_id = user_uuid 
        AND qsa.scanned_at BETWEEN start_date AND end_date
        GROUP BY qsa.scanned_at::date
    ),
    url_clicks AS (
        SELECT 
            uca.clicked_at::date AS date,
            COUNT(*) AS clicks
        FROM url_click_analytics uca
        JOIN short_urls su ON uca.url_id = su.id
        WHERE su.user_id = user_uuid 
        AND uca.clicked_at BETWEEN start_date AND end_date
        GROUP BY uca.clicked_at::date
    )
    SELECT 
        ds.date,
        COALESCE(qs.scans, 0) AS qr_scans,
        COALESCE(uc.clicks, 0) AS url_clicks
    FROM date_series ds
    LEFT JOIN qr_scans qs ON ds.date = qs.date
    LEFT JOIN url_clicks uc ON ds.date = uc.date
    ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
