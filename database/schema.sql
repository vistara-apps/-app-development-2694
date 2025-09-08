-- FairDraw Protocol Database Schema
-- This schema is designed for Supabase/PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Draws table
CREATE TABLE draws (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    draw_id BIGINT UNIQUE NOT NULL,
    creator TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_ended BOOLEAN DEFAULT FALSE,
    winner_count INTEGER NOT NULL,
    entry_fee DECIMAL(18, 18) NOT NULL, -- Store in ETH
    participant_count INTEGER DEFAULT 0,
    winners_selected BOOLEAN DEFAULT FALSE,
    contract_address TEXT NOT NULL,
    vrf_request_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Participants table
CREATE TABLE participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    address TEXT NOT NULL,
    farcaster_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(address)
);

-- Participations table
CREATE TABLE participations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    participation_id TEXT UNIQUE NOT NULL,
    draw_id BIGINT NOT NULL REFERENCES draws(draw_id),
    participant_address TEXT NOT NULL,
    entry_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_winner BOOLEAN DEFAULT FALSE,
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (participant_address) REFERENCES participants(address)
);

-- Draw statistics view
CREATE VIEW draw_stats AS
SELECT 
    d.draw_id,
    d.name,
    d.creator,
    d.entry_fee,
    d.winner_count,
    d.is_ended,
    d.winners_selected,
    COUNT(p.id) as actual_participant_count,
    COUNT(CASE WHEN p.is_winner THEN 1 END) as actual_winner_count,
    d.entry_fee * COUNT(p.id) as total_prize_pool,
    d.start_time,
    d.end_time,
    d.created_at
FROM draws d
LEFT JOIN participations p ON d.draw_id = p.draw_id
GROUP BY d.draw_id, d.name, d.creator, d.entry_fee, d.winner_count, 
         d.is_ended, d.winners_selected, d.start_time, d.end_time, d.created_at;

-- User statistics view
CREATE VIEW user_stats AS
SELECT 
    p.address,
    COUNT(DISTINCT part.draw_id) as total_participations,
    COUNT(DISTINCT CASE WHEN part.is_winner THEN part.draw_id END) as total_wins,
    COUNT(DISTINCT d.draw_id) as total_draws_created,
    SUM(CASE WHEN part.is_winner THEN draws.entry_fee * draws.participant_count / draws.winner_count ELSE 0 END) as total_winnings,
    SUM(part_fee.entry_fee) as total_spent_on_entries,
    MIN(part.entry_timestamp) as first_participation,
    MAX(part.entry_timestamp) as last_participation
FROM participants p
LEFT JOIN participations part ON p.address = part.participant_address
LEFT JOIN draws d ON p.address = d.creator
LEFT JOIN draws draws ON part.draw_id = draws.draw_id
LEFT JOIN draws part_fee ON part.draw_id = part_fee.draw_id
GROUP BY p.address;

-- Platform statistics view
CREATE VIEW platform_stats AS
SELECT 
    COUNT(DISTINCT d.draw_id) as total_draws,
    COUNT(DISTINCT CASE WHEN d.is_ended = FALSE THEN d.draw_id END) as active_draws,
    COUNT(DISTINCT CASE WHEN d.is_ended = TRUE THEN d.draw_id END) as completed_draws,
    COUNT(DISTINCT p.participant_address) as unique_participants,
    COUNT(part.id) as total_participations,
    SUM(d.entry_fee * d.participant_count) as total_volume,
    AVG(d.entry_fee) as avg_entry_fee,
    AVG(d.participant_count) as avg_participants_per_draw
FROM draws d
LEFT JOIN participations part ON d.draw_id = part.draw_id
LEFT JOIN participants p ON part.participant_address = p.address;

-- Indexes for performance
CREATE INDEX idx_draws_creator ON draws(creator);
CREATE INDEX idx_draws_is_ended ON draws(is_ended);
CREATE INDEX idx_draws_end_time ON draws(end_time);
CREATE INDEX idx_draws_created_at ON draws(created_at);

CREATE INDEX idx_participations_draw_id ON participations(draw_id);
CREATE INDEX idx_participations_participant ON participations(participant_address);
CREATE INDEX idx_participations_is_winner ON participations(is_winner);
CREATE INDEX idx_participations_timestamp ON participations(entry_timestamp);

CREATE INDEX idx_participants_address ON participants(address);
CREATE INDEX idx_participants_farcaster_id ON participants(farcaster_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_draws_updated_at BEFORE UPDATE ON draws
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participants_updated_at BEFORE UPDATE ON participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;

-- Public read access for draws
CREATE POLICY "Draws are viewable by everyone" ON draws
    FOR SELECT USING (true);

-- Users can insert their own draws
CREATE POLICY "Users can create draws" ON draws
    FOR INSERT WITH CHECK (auth.uid()::text = creator);

-- Users can update their own draws
CREATE POLICY "Users can update their own draws" ON draws
    FOR UPDATE USING (auth.uid()::text = creator);

-- Public read access for participants
CREATE POLICY "Participants are viewable by everyone" ON participants
    FOR SELECT USING (true);

-- Users can insert their own participant record
CREATE POLICY "Users can create participant record" ON participants
    FOR INSERT WITH CHECK (auth.uid()::text = address);

-- Users can update their own participant record
CREATE POLICY "Users can update their own participant record" ON participants
    FOR UPDATE USING (auth.uid()::text = address);

-- Public read access for participations
CREATE POLICY "Participations are viewable by everyone" ON participations
    FOR SELECT USING (true);

-- Users can insert their own participations
CREATE POLICY "Users can create participations" ON participations
    FOR INSERT WITH CHECK (auth.uid()::text = participant_address);

-- Functions for common queries
CREATE OR REPLACE FUNCTION get_active_draws()
RETURNS TABLE (
    draw_id BIGINT,
    name TEXT,
    description TEXT,
    creator TEXT,
    entry_fee DECIMAL,
    winner_count INTEGER,
    participant_count INTEGER,
    end_time TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT d.draw_id, d.name, d.description, d.creator, d.entry_fee, 
           d.winner_count, d.participant_count, d.end_time
    FROM draws d
    WHERE d.is_ended = FALSE AND d.end_time > NOW()
    ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_draws(user_address TEXT)
RETURNS TABLE (
    draw_id BIGINT,
    name TEXT,
    description TEXT,
    entry_fee DECIMAL,
    winner_count INTEGER,
    participant_count INTEGER,
    is_ended BOOLEAN,
    winners_selected BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT d.draw_id, d.name, d.description, d.entry_fee, d.winner_count,
           d.participant_count, d.is_ended, d.winners_selected, d.created_at
    FROM draws d
    WHERE d.creator = user_address
    ORDER BY d.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_participations(user_address TEXT)
RETURNS TABLE (
    draw_id BIGINT,
    draw_name TEXT,
    entry_fee DECIMAL,
    is_winner BOOLEAN,
    entry_timestamp TIMESTAMP WITH TIME ZONE,
    transaction_hash TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.draw_id, d.name, d.entry_fee, p.is_winner, 
           p.entry_timestamp, p.transaction_hash
    FROM participations p
    JOIN draws d ON p.draw_id = d.draw_id
    WHERE p.participant_address = user_address
    ORDER BY p.entry_timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Insert initial data (optional)
-- This would be populated by the smart contract events in production

-- Sample participants (for testing)
INSERT INTO participants (address, farcaster_id) VALUES
('0x1234567890123456789012345678901234567890', 'user1'),
('0x2345678901234567890123456789012345678901', 'user2'),
('0x3456789012345678901234567890123456789012', 'user3')
ON CONFLICT (address) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE draws IS 'Stores draw information from the smart contract';
COMMENT ON TABLE participants IS 'Stores participant wallet addresses and optional Farcaster IDs';
COMMENT ON TABLE participations IS 'Stores individual participation records for each draw';

COMMENT ON COLUMN draws.draw_id IS 'Unique draw ID from the smart contract';
COMMENT ON COLUMN draws.entry_fee IS 'Entry fee in ETH (decimal format)';
COMMENT ON COLUMN draws.vrf_request_id IS 'Chainlink VRF request ID for randomness';

COMMENT ON COLUMN participations.participation_id IS 'Unique participation identifier';
COMMENT ON COLUMN participations.transaction_hash IS 'Blockchain transaction hash for the participation';

-- Grant permissions (adjust based on your authentication setup)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON draws TO authenticated;
GRANT INSERT, UPDATE ON participants TO authenticated;
GRANT INSERT ON participations TO authenticated;
