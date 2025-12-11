const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'christmas-puzzle-secret-key-2024';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'christmas_puzzle',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let pool;

async function initDatabase() {
    try {
        pool = mysql.createPool(dbConfig);
        const connection = await pool.getConnection();
        console.log('Database connected successfully');
        connection.release();
    } catch (error) {
        console.log('Database not available, running in offline mode');
        pool = null;
    }
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        req.user = null;
        return next();
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null;
        } else {
            req.user = user;
        }
        next();
    });
}

app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    
    if (!pool) {
        return res.status(503).json({ success: false, message: 'Database not available' });
    }
    
    try {
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email or username already exists' });
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        
        const [result] = await pool.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );
        
        const userId = result.insertId;
        
        await pool.execute(
            'INSERT INTO user_preferences (user_id) VALUES (?)',
            [userId]
        );
        
        await pool.execute(
            'INSERT INTO player_statistics (user_id) VALUES (?)',
            [userId]
        );
        
        const token = jwt.sign({ id: userId, username, email }, JWT_SECRET, { expiresIn: '7d' });
        
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await pool.execute(
            'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
            [userId, token, expiresAt]
        );
        
        res.json({
            success: true,
            user: { id: userId, username, email },
            token
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    
    if (!pool) {
        return res.status(503).json({ success: false, message: 'Database not available' });
    }
    
    try {
        const [users] = await pool.execute(
            'SELECT id, username, email, password_hash FROM users WHERE email = ? AND is_active = TRUE',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        await pool.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
        
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await pool.execute(
            'INSERT INTO user_sessions (user_id, token, expires_at, ip_address) VALUES (?, ?, ?, ?)',
            [user.id, token, expiresAt, req.ip]
        );
        
        res.json({
            success: true,
            user: { id: user.id, username: user.username, email: user.email },
            token
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    if (!req.user || !pool) {
        return res.json({ success: true });
    }
    
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        await pool.execute('DELETE FROM user_sessions WHERE token = ?', [token]);
        
        res.json({ success: true });
    } catch (error) {
        res.json({ success: true });
    }
});

app.get('/api/user/profile', authenticateToken, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    if (!pool) {
        return res.status(503).json({ success: false, message: 'Database not available' });
    }
    
    try {
        const [users] = await pool.execute(
            'SELECT id, username, email, level, experience, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const [stats] = await pool.execute(
            'SELECT * FROM player_statistics WHERE user_id = ?',
            [req.user.id]
        );
        
        const [achievements] = await pool.execute(
            `SELECT a.achievement_key, a.name, a.description, ua.unlocked_at
             FROM user_achievements ua
             JOIN achievements a ON ua.achievement_id = a.id
             WHERE ua.user_id = ?`,
            [req.user.id]
        );
        
        res.json({
            success: true,
            user: users[0],
            stats: stats[0] || {},
            achievements
        });
        
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    const { size = 'all', sort = 'time', limit = 100 } = req.query;
    
    if (!pool) {
        return res.json([]);
    }
    
    try {
        let query = 'SELECT username as player, puzzle_size as size, time_seconds as time, moves, score, achieved_at as date FROM leaderboard';
        const params = [];
        
        if (size !== 'all') {
            query += ' WHERE puzzle_size = ?';
            params.push(parseInt(size));
        }
        
        switch (sort) {
            case 'moves':
                query += ' ORDER BY moves ASC';
                break;
            case 'score':
                query += ' ORDER BY score DESC';
                break;
            default:
                query += ' ORDER BY time_seconds ASC';
        }
        
        const limitNum = parseInt(limit) || 100;
        query += ` LIMIT ${limitNum}`;
        
        const [entries] = await pool.execute(query, params);
        
        res.json(entries);
        
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.json([]);
    }
});

app.post('/api/leaderboard', authenticateToken, async (req, res) => {
    const { time, moves, score, size } = req.body;
    
    if (!pool) {
        return res.json({ success: true, offline: true });
    }
    
    try {
        const username = req.user?.username || 'Guest';
        const userId = req.user?.id || null;
        
        await pool.execute(
            'INSERT INTO leaderboard (user_id, username, puzzle_size, time_seconds, moves, score) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, username, size, time, moves, score]
        );
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Leaderboard submit error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/game/start', authenticateToken, async (req, res) => {
    const { puzzleSize, difficulty, initialState } = req.body;
    
    if (!pool) {
        return res.json({ success: true, sessionId: Date.now().toString(36), offline: true });
    }
    
    try {
        const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        
        await pool.execute(
            'INSERT INTO game_sessions (user_id, session_id, puzzle_size, difficulty, initial_state, current_state) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user?.id || null, sessionId, puzzleSize, difficulty, JSON.stringify(initialState), JSON.stringify(initialState)]
        );
        
        res.json({ success: true, sessionId });
        
    } catch (error) {
        console.error('Game start error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/game/complete', authenticateToken, async (req, res) => {
    const { sessionId, time, moves, score, won, difficulty, size } = req.body;
    
    if (!pool) {
        return res.json({ success: true, offline: true });
    }
    
    try {
        if (sessionId) {
            await pool.execute(
                'UPDATE game_sessions SET status = ?, moves = ?, time_elapsed = ?, completed_at = NOW() WHERE session_id = ?',
                [won ? 'completed' : 'abandoned', moves, time, sessionId]
            );
        }
        
        if (req.user?.id) {
            await pool.execute('CALL sp_record_game_completion(?, ?, ?, ?, ?, ?, ?)', 
                [req.user.id, size, time, moves, score, difficulty, won]);
        }
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Game complete error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/achievements', async (req, res) => {
    if (!pool) {
        return res.json([]);
    }
    
    try {
        const [achievements] = await pool.execute(
            'SELECT achievement_key, name, description, points FROM achievements'
        );
        res.json(achievements);
    } catch (error) {
        res.json([]);
    }
});

app.post('/api/achievements/unlock', authenticateToken, async (req, res) => {
    const { achievementKey } = req.body;
    
    if (!req.user || !pool) {
        return res.json({ success: false });
    }
    
    try {
        const [achievement] = await pool.execute(
            'SELECT id FROM achievements WHERE achievement_key = ?',
            [achievementKey]
        );
        
        if (achievement.length === 0) {
            return res.status(404).json({ success: false, message: 'Achievement not found' });
        }
        
        await pool.execute(
            'INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
            [req.user.id, achievement[0].id]
        );
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('Achievement unlock error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/analytics/event', authenticateToken, async (req, res) => {
    const { eventType, eventData, page } = req.body;
    
    if (!pool) {
        return res.json({ success: true });
    }
    
    try {
        await pool.execute(
            'INSERT INTO analytics_events (user_id, event_type, event_data, page) VALUES (?, ?, ?, ?)',
            [req.user?.id || null, eventType, JSON.stringify(eventData), page]
        );
        res.json({ success: true });
    } catch (error) {
        res.json({ success: true });
    }
});

app.get('/api/user/stats', authenticateToken, async (req, res) => {
    if (!req.user || !pool) {
        return res.json({});
    }
    
    try {
        const [stats] = await pool.execute(
            'SELECT * FROM player_statistics WHERE user_id = ?',
            [req.user.id]
        );
        res.json(stats[0] || {});
    } catch (error) {
        res.json({});
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});

