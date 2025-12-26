ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 1000;
ALTER TABLE users ADD COLUMN IF NOT EXISTS matches_played INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS matches_won INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS kills INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deaths INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    rating INTEGER DEFAULT 1000,
    matches_played INTEGER DEFAULT 0,
    matches_won INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    match_type VARCHAR(50) NOT NULL,
    match_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'upcoming',
    max_players INTEGER,
    team1_id INTEGER REFERENCES teams(id),
    team2_id INTEGER REFERENCES teams(id),
    winner_team_id INTEGER REFERENCES teams(id),
    score_team1 INTEGER DEFAULT 0,
    score_team2 INTEGER DEFAULT 0,
    duration_minutes INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS match_participants (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    team_id INTEGER REFERENCES teams(id),
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'registered',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(match_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_match_participants_match ON match_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_user ON match_participants(user_id);