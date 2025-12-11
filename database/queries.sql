-- Useful queries for Christmas Puzzle database
-- Run these using MySQL command line: mysql -u root -p christmas_puzzle

-- Get top 10 players by games won
SELECT u.username, ps.total_games, ps.games_won, ps.best_streak
FROM users u
JOIN player_statistics ps ON u.id = ps.user_id
ORDER BY ps.games_won DESC
LIMIT 10;

-- Get leaderboard for 4x4 puzzles
SELECT username, time_seconds, moves, score, achieved_at
FROM leaderboard
WHERE puzzle_size = 4
ORDER BY time_seconds ASC
LIMIT 20;

-- Get user's achievements
SELECT a.name, a.description, ua.unlocked_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = ?
ORDER BY ua.unlocked_at DESC;

-- Get recent performance history for adaptive difficulty
SELECT puzzle_size, difficulty, won, time_seconds, moves, recorded_at
FROM performance_history
WHERE user_id = ?
ORDER BY recorded_at DESC
LIMIT 10;

-- Count active users in last 7 days
SELECT COUNT(DISTINCT user_id) as active_users
FROM game_sessions
WHERE started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Get average completion time by puzzle size
SELECT puzzle_size, 
       AVG(time_seconds) as avg_time,
       MIN(time_seconds) as best_time,
       AVG(moves) as avg_moves
FROM leaderboard
GROUP BY puzzle_size
ORDER BY puzzle_size;

-- Get story mode completion rate
SELECT chapter_id,
       COUNT(DISTINCT user_id) as players_completed
FROM story_progress
GROUP BY chapter_id
ORDER BY chapter_id;

-- Clean up old sessions (run periodically)
DELETE FROM user_sessions WHERE expires_at < NOW();

-- Get analytics summary
SELECT event_type, COUNT(*) as count
FROM analytics_events
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY event_type
ORDER BY count DESC;

