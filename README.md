# Christmas Fifteen Puzzle - Santa's Workshop

A festive, adaptive sliding puzzle game with Christmas theme, built for Web Programming Final Project.

## Authors
- Joshika Alaparthi
- Mahendra Krishna Koneru

## Features

### Core Features
- Adaptive difficulty that adjusts based on player performance
- Multiple puzzle sizes (3x3, 4x4, 6x6, 8x8, 10x10)
- Real-time timer and move counter
- Strategic assistance with hints and power-ups
- Victory celebrations with animations

### Graduate-Level Features
- Advanced festive theme system
- Comprehensive achievement system
- Interactive story mode with 5 chapters
- Social features and leaderboards
- Predictive analytics for difficulty adjustment
- Magic power-up system

## Technology Stack
- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js, Express
- Database: MySQL
- Authentication: JWT, bcrypt

## Setup Instructions

### 1. Prerequisites
- Node.js (v18 or higher)
- MySQL Server

### 2. Database Setup (Command Line Only)
```bash
# Login to MySQL
mysql -u root -p

# Run the schema script
source database/schema.sql

# Or from terminal
mysql -u root -p < database/schema.sql
```

### 3. Environment Configuration
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your database credentials
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start the Server
```bash
# Development
npm run dev

# Production
npm start
```

### 6. Access the Application
Open http://localhost:3000 in your browser

## Live Demo

🌐 **GitHub Pages**: [https://jalaparthi1.github.io/Project3/](https://jalaparthi1.github.io/Project3/)

### ⚠️ Important Disclaimer

**GitHub Pages Limitations:**
- GitHub Pages only serves **static files** (HTML, CSS, JavaScript)
- **Database and backend functionality require separate deployment**
- The live demo works with **localStorage** for offline functionality
- For full functionality (authentication, database, leaderboard), you need to:
  1. Deploy the backend API to a hosting service (Render, Railway, Heroku, etc.)
  2. Update the API URL in `js/config.js`
  3. Set up a MySQL database on a hosting provider

**Current Status:**
- ✅ Frontend is fully functional on GitHub Pages
- ✅ Game mechanics work (puzzle solving, story mode, local progress)
- ⚠️ Backend features (user accounts, global leaderboard, database) require separate backend deployment

## Project Structure
```
Project3/
├── index.html           # Main HTML file
├── css/
│   ├── styles.css      # Main styles
│   └── animations.css  # Animation styles
├── js/
│   ├── config.js       # Configuration
│   ├── utils.js        # Utility functions
│   ├── audio.js        # Audio manager
│   ├── puzzle.js       # Puzzle logic
│   ├── game.js         # Game controller
│   ├── ui.js           # UI management
│   ├── auth.js         # Authentication
│   ├── leaderboard.js  # Leaderboard
│   ├── story.js        # Story mode
│   └── app.js          # Main app
├── server/
│   └── server.js       # Express server
├── database/
│   ├── schema.sql      # Database schema
│   ├── queries.sql     # Useful queries
│   └── setup.sh        # Setup script
├── package.json        # Dependencies
└── README.md           # Documentation
```

## Database Tables
- users - User accounts
- user_sessions - JWT sessions
- user_preferences - Settings
- game_sessions - Game tracking
- leaderboard - High scores
- achievements - Achievement definitions
- user_achievements - Unlocked achievements
- story_progress - Story mode progress
- player_statistics - Player stats
- performance_history - For adaptive difficulty
- analytics_events - Analytics tracking

## API Endpoints

### Authentication
- POST /api/auth/register - Create account
- POST /api/auth/login - Login
- POST /api/auth/logout - Logout

### Game
- POST /api/game/start - Start session
- POST /api/game/complete - Record completion

### Leaderboard
- GET /api/leaderboard - Get rankings
- POST /api/leaderboard - Submit score

### User
- GET /api/user/profile - Get profile
- GET /api/user/stats - Get statistics

### Achievements
- GET /api/achievements - List all
- POST /api/achievements/unlock - Unlock achievement

## Keyboard Controls
- Arrow keys - Move tiles
- H - Use hint
- U - Undo move
- Escape - Pause game
- Ctrl+R - Reset puzzle
- Ctrl+N - New game

## AI Usage Disclosure

This project utilized AI assistance for approximately 20% of the development work, specifically for theme integration and visual design elements. AI tools were used to:

- Generate CSS color schemes and gradient combinations for the Christmas theme
- Suggest animation timing and easing functions for festive effects
- Assist with theme consistency across different UI components
- Generate initial theme selector icons and decorative elements

All core functionality, game logic, database implementation, authentication systems, and problem-solving solutions were developed manually by the project team. The AI assistance was limited to visual design and styling aspects only.

## Development Notes

### Database Constraint
GUI tools like MySQL Workbench are NOT used. 
All database operations use command-line interfaces or server-side code.

### Adaptive Difficulty Algorithm
The system tracks:
- Win/loss streak
- Completion times
- Move counts
- Recent performance (last 5 games)

Difficulty adjusts after:
- 3 consecutive wins (increases)
- 2 consecutive losses (decreases)

