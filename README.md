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

2. Set up PostgreSQL database:
```bash
# Install PostgreSQL if you haven't already
# Create a database named 'snake_game'
createdb snake_game
```

3. Create `.env` file from template:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Start the server:
```bash
npm start
```

5. Open browser to:
```
http://localhost:3000
```

### Cloud Deployment (Render.com)

#### Automatic Deployment

1. Push your code to GitHub

2. Go to [Render.com](https://render.com) and sign up/login

3. Click "New +" → "Blueprint"

4. Connect your GitHub repository

5. Render will automatically detect `render.yaml` and set up:
   - PostgreSQL database (free tier)
   - Node.js web service (free tier)
   - Environment variables
   - Health checks

6. Click "Apply" and wait for deployment

#### Manual Deployment

1. Create a PostgreSQL database on Render:
   - Go to Dashboard → New → PostgreSQL
   - Name: `snake-game-db`
   - Plan: Free
   - Copy the Internal Database URL

2. Create a Web Service:
   - Go to Dashboard → New → Web Service
   - Connect your GitHub repo
   - Name: `snake-game-backend`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free

3. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = (paste your database URL)
   - `ADMIN_PASSWORD` = (your secure password)

4. Deploy and wait for it to go live

5. Your game will be available at: `https://snake-game-backend.onrender.com`

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
- **Database**: PostgreSQL (cloud-hosted on Render.com)
- **Deployment**: Render.com (free tier with automatic scaling)

## Credits

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
