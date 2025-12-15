
SELECT u.username, ps.total_games, ps.games_won, ps.best_streak
FROM users u
JOIN player_statistics ps ON u.id = ps.user_id
ORDER BY ps.games_won DESC
LIMIT 10;

SELECT username, time_seconds, moves, score, achieved_at
FROM leaderboard
WHERE puzzle_size = 4
ORDER BY time_seconds ASC
LIMIT 20;

SELECT a.name, a.description, ua.unlocked_at
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = ?
ORDER BY ua.unlocked_at DESC;

SELECT puzzle_size, difficulty, won, time_seconds, moves, recorded_at
FROM performance_history
WHERE user_id = ?
ORDER BY recorded_at DESC
LIMIT 10;

SELECT COUNT(DISTINCT user_id) as active_users
FROM game_sessions
WHERE started_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

SELECT puzzle_size, 
       AVG(time_seconds) as avg_time,
       MIN(time_seconds) as best_time,
       AVG(moves) as avg_moves
FROM leaderboard
GROUP BY puzzle_size
ORDER BY puzzle_size;

SELECT chapter_id,
       COUNT(DISTINCT user_id) as players_completed
FROM story_progress
GROUP BY chapter_id
ORDER BY chapter_id;

DELETE FROM user_sessions WHERE expires_at < NOW();

SELECT event_type, COUNT(*) as count
FROM analytics_events
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY event_type
ORDER BY count DESC;

