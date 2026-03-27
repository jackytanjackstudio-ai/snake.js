const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// Simple file-based database (for easy deployment)
const DB_FILE = path.join(__dirname, 'leaderboard.json');

// Initialize database if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
        global: [],
        classic: [],
        timeattack: [],
        survival: [],
        zen: []
    }));
}

// Helper functions
function readDB() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {
            global: [],
            classic: [],
            timeattack: [],
            survival: [],
            zen: []
        };
    }
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// API Routes

// Get leaderboard
app.get('/api/leaderboard/:mode?', (req, res) => {
    const mode = req.params.mode || 'global';
    const db = readDB();

    const leaderboard = db[mode] || [];
    const top100 = leaderboard.slice(0, 100);

    res.json({
        mode,
        count: leaderboard.length,
        leaderboard: top100
    });
});

// Submit score
app.post('/api/score', (req, res) => {
    const { playerName, score, mode, achievements, stats } = req.body;

    if (!playerName || score === undefined || !mode) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = readDB();

    const entry = {
        playerName: playerName.substring(0, 20), // Limit name length
        score: parseInt(score),
        mode,
        achievements: achievements || 0,
        stats: stats || {},
        timestamp: new Date().toISOString(),
        id: Date.now() + Math.random()
    };

    // Add to mode-specific leaderboard
    if (!db[mode]) db[mode] = [];
    db[mode].push(entry);
    db[mode].sort((a, b) => b.score - a.score);
    db[mode] = db[mode].slice(0, 1000); // Keep top 1000

    // Add to global leaderboard
    db.global.push(entry);
    db.global.sort((a, b) => b.score - a.score);
    db.global = db.global.slice(0, 1000);

    writeDB(db);

    // Find player's rank
    const rank = db[mode].findIndex(e => e.id === entry.id) + 1;
    const globalRank = db.global.findIndex(e => e.id === entry.id) + 1;

    res.json({
        success: true,
        rank,
        globalRank,
        totalPlayers: db[mode].length,
        entry
    });
});

// Get player stats
app.get('/api/stats', (req, res) => {
    const db = readDB();

    const stats = {
        totalPlayers: new Set([
            ...db.global.map(e => e.playerName)
        ]).size,
        totalGames: db.global.length,
        highestScore: db.global[0]?.score || 0,
        topPlayer: db.global[0]?.playerName || 'None',
        modeStats: {
            classic: db.classic.length,
            timeattack: db.timeattack.length,
            survival: db.survival.length,
            zen: db.zen.length
        }
    };

    res.json(stats);
});

// Clear leaderboard (admin only - you can add auth later)
app.post('/api/admin/clear', (req, res) => {
    const { password } = req.body;

    // Simple password protection
    if (password !== 'snake2024') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    fs.writeFileSync(DB_FILE, JSON.stringify({
        global: [],
        classic: [],
        timeattack: [],
        survival: [],
        zen: []
    }));

    res.json({ success: true, message: 'Leaderboard cleared' });
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
