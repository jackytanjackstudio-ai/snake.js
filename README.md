# 🐍 Snake Game Premium

A premium snake game with multiplayer, leaderboards, achievements, and much more!

## Features

### 🎮 Game Modes
- **Classic** - Traditional endless gameplay
- **Time Attack** - 60-second challenge
- **Survival** - 3 lives with increasing difficulty
- **Zen Mode** - No walls, pure flow

### 🎨 Customization
- 5 visual themes (Classic, Neon, Retro, Dark, Ocean)
- Sound effects system
- Settings menu

### ⚡ Power-Ups
- Shield 🛡 - Protection from collisions
- Ghost 👻 - Pass through walls
- Speed ⚡ - Faster movement
- Magnet 🧲 - Attract food
- Freeze ❄️ - Slow time
- 2x Multiplier ✖️ - Double points

### 👑 Special Features
- Golden Apples (30 points)
- Combo system (up to 10x with multiplier!)
- 13 achievements
- Full statistics tracking
- Particle effects & screen shake

### 🏆 Online Features
- Global leaderboard
- Mode-specific rankings
- Score submission
- Real-time updates

## Installation

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open browser to:
```
http://localhost:3000
```

### Deployment to Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. The backend API will run as Vercel serverless functions.

## API Endpoints

### GET /api/leaderboard/:mode
Get leaderboard for a specific mode (global, classic, timeattack, survival, zen)

### POST /api/score
Submit a score to the leaderboard

Body:
```json
{
  "playerName": "Player1",
  "score": 500,
  "mode": "classic",
  "achievements": 10,
  "stats": {}
}
```

### GET /api/stats
Get global game statistics

### GET /api/health
Health check endpoint

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5 Canvas, CSS3
- **Backend**: Node.js, Express
- **Database**: JSON file storage (easily replaceable with MongoDB/PostgreSQL)
- **Deployment**: Vercel

## Credits

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
