const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS configuration for Vercel frontend
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'https://snake-js-lovat-beta.vercel.app',
        'https://snake-js-lovat-beta.vercel.app/',
        /\.vercel\.app$/  // Allow all Vercel preview deployments
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('.')); // Serve static files

// PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS scores (
                id SERIAL PRIMARY KEY,
                player_name VARCHAR(20) NOT NULL,
                score INTEGER NOT NULL,
                mode VARCHAR(20) NOT NULL,
                achievements INTEGER DEFAULT 0,
                stats JSONB,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_mode_score ON scores(mode, score DESC);
            CREATE INDEX IF NOT EXISTS idx_global_score ON scores(score DESC);
        `);
        console.log('✅ Database tables initialized');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
}

initDB();

// API Routes

// Get leaderboard
app.get('/api/leaderboard/:mode?', async (req, res) => {
    try {
        const mode = req.params.mode || 'global';

        let query;
        if (mode === 'global') {
            query = `
                SELECT id, player_name, score, mode, achievements, stats, timestamp
                FROM scores
                ORDER BY score DESC
                LIMIT 100
            `;
        } else {
            query = `
                SELECT id, player_name, score, mode, achievements, stats, timestamp
                FROM scores
                WHERE mode = $1
                ORDER BY score DESC
                LIMIT 100
            `;
        }

        const result = mode === 'global'
            ? await pool.query(query)
            : await pool.query(query, [mode]);

        res.json({
            mode,
            count: result.rows.length,
            leaderboard: result.rows.map(row => ({
                id: row.id,
                playerName: row.player_name,
                score: row.score,
                mode: row.mode,
                achievements: row.achievements,
                stats: row.stats,
                timestamp: row.timestamp
            }))
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Submit score
app.post('/api/score', async (req, res) => {
    try {
        const { playerName, score, mode, achievements, stats } = req.body;

        console.log('📥 Score submission:', { playerName, score, mode, achievements });

        if (!playerName || score === undefined || !mode) {
            console.error('❌ Missing required fields:', { playerName, score, mode });
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Insert score into database
        const insertQuery = `
            INSERT INTO scores (player_name, score, mode, achievements, stats)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, player_name, score, mode, achievements, stats, timestamp
        `;

        const result = await pool.query(insertQuery, [
            playerName.substring(0, 20),
            parseInt(score),
            mode,
            achievements || 0,
            JSON.stringify(stats || {})
        ]);

        const entry = result.rows[0];

        // Get player's rank in mode
        const rankQuery = `
            SELECT COUNT(*) + 1 as rank
            FROM scores
            WHERE mode = $1 AND score > $2
        `;
        const rankResult = await pool.query(rankQuery, [mode, entry.score]);
        const rank = parseInt(rankResult.rows[0].rank);

        // Get player's global rank
        const globalRankQuery = `
            SELECT COUNT(*) + 1 as rank
            FROM scores
            WHERE score > $1
        `;
        const globalRankResult = await pool.query(globalRankQuery, [entry.score]);
        const globalRank = parseInt(globalRankResult.rows[0].rank);

        // Get total players in mode
        const totalQuery = `SELECT COUNT(*) as total FROM scores WHERE mode = $1`;
        const totalResult = await pool.query(totalQuery, [mode]);

        const response = {
            success: true,
            rank,
            globalRank,
            totalPlayers: parseInt(totalResult.rows[0].total),
            entry: {
                id: entry.id,
                playerName: entry.player_name,
                score: entry.score,
                mode: entry.mode,
                achievements: entry.achievements,
                stats: entry.stats,
                timestamp: entry.timestamp
            }
        };

        console.log('✅ Score saved successfully:', response);
        res.json(response);
    } catch (error) {
        console.error('❌ Error submitting score:', error);
        res.status(500).json({ error: 'Failed to submit score', details: error.message });
    }
});

// Get player stats
app.get('/api/stats', async (req, res) => {
    try {
        // Get total unique players
        const playersQuery = `SELECT COUNT(DISTINCT player_name) as total FROM scores`;
        const playersResult = await pool.query(playersQuery);

        // Get total games
        const gamesQuery = `SELECT COUNT(*) as total FROM scores`;
        const gamesResult = await pool.query(gamesQuery);

        // Get highest score and top player
        const topQuery = `SELECT player_name, score FROM scores ORDER BY score DESC LIMIT 1`;
        const topResult = await pool.query(topQuery);

        // Get mode stats
        const modeQuery = `
            SELECT mode, COUNT(*) as count
            FROM scores
            GROUP BY mode
        `;
        const modeResult = await pool.query(modeQuery);

        const modeStats = {};
        modeResult.rows.forEach(row => {
            modeStats[row.mode] = parseInt(row.count);
        });

        res.json({
            totalPlayers: parseInt(playersResult.rows[0].total),
            totalGames: parseInt(gamesResult.rows[0].total),
            highestScore: topResult.rows[0]?.score || 0,
            topPlayer: topResult.rows[0]?.player_name || 'None',
            modeStats
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Clear leaderboard (admin only - you can add auth later)
app.post('/api/admin/clear', async (req, res) => {
    try {
        const { password } = req.body;

        // Simple password protection
        if (password !== process.env.ADMIN_PASSWORD || !password) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await pool.query('DELETE FROM scores');

        res.json({ success: true, message: 'Leaderboard cleared' });
    } catch (error) {
        console.error('Error clearing leaderboard:', error);
        res.status(500).json({ error: 'Failed to clear leaderboard' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🐍 Snake Game Server running on port ${PORT}`);
    console.log(`📊 Leaderboard API ready at http://localhost:${PORT}/api/leaderboard`);
});
