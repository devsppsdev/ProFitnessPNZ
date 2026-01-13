
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crm_client_id INTEGER NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    notification_preference VARCHAR(10) DEFAULT 'push', -- 'push' или 'telegram'
    telegram_chat_id BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    last_visit_date DATE,
    check_date DATE DEFAULT CURRENT_DATE,
    UNIQUE(user_id, check_date)
);

CREATE TABLE IF NOT EXISTS points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason VARCHAR(50) NOT NULL, -- 'attended', 'future_booking', 'measurement'
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_points_user_id ON points(user_id);
CREATE INDEX idx_points_created_at ON points(created_at DESC);