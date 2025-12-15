
CREATE DATABASE IF NOT EXISTS christmas_puzzle;
USE christmas_puzzle;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    level INT DEFAULT 1,
    experience INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    music_enabled BOOLEAN DEFAULT TRUE,
    sfx_enabled BOOLEAN DEFAULT TRUE,
    volume INT DEFAULT 70,
    highlight_tiles BOOLEAN DEFAULT TRUE,
    adaptive_difficulty BOOLEAN DEFAULT TRUE,
    animation_speed ENUM('slow', 'normal', 'fast') DEFAULT 'normal',
    snowfall_enabled BOOLEAN DEFAULT TRUE,
    theme VARCHAR(50) DEFAULT 'christmas',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS game_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(100) NOT NULL,
    puzzle_size INT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',
    initial_state JSON NOT NULL,
    current_state JSON,
    moves INT DEFAULT 0,
    time_elapsed INT DEFAULT 0,
    hints_used INT DEFAULT 0,
    powerups_used JSON,
    status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS puzzle_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    puzzle_size INT NOT NULL,
    configuration JSON NOT NULL,
    difficulty_rating INT,
    optimal_moves INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_size_difficulty (puzzle_size, difficulty_rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leaderboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    username VARCHAR(50) NOT NULL,
    puzzle_size INT NOT NULL,
    time_seconds INT NOT NULL,
    moves INT NOT NULL,
    score INT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_size_time (puzzle_size, time_seconds),
    INDEX idx_size_score (puzzle_size, score DESC),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    achievement_key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    points INT DEFAULT 10,
    condition_type VARCHAR(50),
    condition_value INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS story_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    chapter_id INT NOT NULL,
    puzzle_index INT NOT NULL,
    stars_earned INT DEFAULT 0,
    time_seconds INT,
    moves INT,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_chapter_puzzle (user_id, chapter_id, puzzle_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS player_statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    total_games INT DEFAULT 0,
    games_won INT DEFAULT 0,
    total_moves INT DEFAULT 0,
    total_time INT DEFAULT 0,
    best_time_3x3 INT,
    best_time_4x4 INT,
    best_time_6x6 INT,
    best_time_8x8 INT,
    best_time_10x10 INT,
    current_streak INT DEFAULT 0,
    best_streak INT DEFAULT 0,
    last_played TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS performance_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    puzzle_size INT NOT NULL,
    difficulty ENUM('easy', 'medium', 'hard', 'expert'),
    won BOOLEAN NOT NULL,
    time_seconds INT NOT NULL,
    moves INT NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_recent (user_id, recorded_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS analytics_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    session_id VARCHAR(100),
    event_type VARCHAR(50) NOT NULL,
    event_data JSON,
    page VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO achievements (achievement_key, name, description, condition_type, condition_value) VALUES
('first_steps', 'First Steps', 'Complete your first puzzle', 'puzzles', 1),
('speed_demon', 'Speed Demon', 'Solve a puzzle in under 30 seconds', 'time', 30),
('puzzle_master', 'Puzzle Master', 'Solve 100 puzzles', 'puzzles', 100),
('perfect_play', 'Perfect Play', 'Solve a puzzle with minimum moves', 'optimal', 1),
('christmas_hero', 'Christmas Hero', 'Complete all story chapters', 'chapters', 5),
('giant_solver', 'Giant Solver', 'Complete a 10x10 puzzle', 'size', 10),
('streak_5', 'Hot Streak', 'Win 5 games in a row', 'streak', 5),
('streak_10', 'Unstoppable', 'Win 10 games in a row', 'streak', 10),
('night_owl', 'Night Owl', 'Play a game after midnight', 'special', 1),
('early_bird', 'Early Bird', 'Play a game before 6 AM', 'special', 2)
ON DUPLICATE KEY UPDATE name = VALUES(name);

CREATE OR REPLACE VIEW v_top_players AS
SELECT 
    u.id,
    u.username,
    ps.total_games,
    ps.games_won,
    ps.best_streak,
    COUNT(ua.id) as achievements_count
FROM users u
LEFT JOIN player_statistics ps ON u.id = ps.user_id
LEFT JOIN user_achievements ua ON u.id = ua.user_id
GROUP BY u.id
ORDER BY ps.games_won DESC, ps.best_streak DESC;

CREATE OR REPLACE VIEW v_leaderboard_4x4 AS
SELECT 
    username,
    time_seconds,
    moves,
    score,
    achieved_at
FROM leaderboard
WHERE puzzle_size = 4
ORDER BY time_seconds ASC
LIMIT 100;

DELIMITER //
CREATE PROCEDURE IF NOT EXISTS sp_record_game_completion(
    IN p_user_id INT,
    IN p_puzzle_size INT,
    IN p_time_seconds INT,
    IN p_moves INT,
    IN p_score INT,
    IN p_difficulty VARCHAR(20),
    IN p_won BOOLEAN
)
BEGIN
    DECLARE v_current_streak INT DEFAULT 0;
    
    IF p_user_id IS NOT NULL THEN
        SELECT current_streak INTO v_current_streak 
        FROM player_statistics 
        WHERE user_id = p_user_id;
        
        IF p_won THEN
            SET v_current_streak = v_current_streak + 1;
        ELSE
            SET v_current_streak = 0;
        END IF;
        
        INSERT INTO player_statistics (user_id, total_games, games_won, total_moves, total_time, current_streak, best_streak, last_played)
        VALUES (p_user_id, 1, IF(p_won, 1, 0), p_moves, p_time_seconds, v_current_streak, v_current_streak, NOW())
        ON DUPLICATE KEY UPDATE
            total_games = total_games + 1,
            games_won = games_won + IF(p_won, 1, 0),
            total_moves = total_moves + p_moves,
            total_time = total_time + p_time_seconds,
            current_streak = v_current_streak,
            best_streak = GREATEST(best_streak, v_current_streak),
            last_played = NOW();
        
        IF p_won THEN
            INSERT INTO leaderboard (user_id, username, puzzle_size, time_seconds, moves, score, difficulty)
            SELECT p_user_id, username, p_puzzle_size, p_time_seconds, p_moves, p_score, p_difficulty
            FROM users WHERE id = p_user_id;
        END IF;
        
        INSERT INTO performance_history (user_id, puzzle_size, difficulty, won, time_seconds, moves)
        VALUES (p_user_id, p_puzzle_size, p_difficulty, p_won, p_time_seconds, p_moves);
    END IF;
END //
DELIMITER ;


