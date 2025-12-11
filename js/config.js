const CONFIG = {
    API_BASE_URL: '/api',
    DEFAULT_PUZZLE_SIZE: 4,
    MIN_PUZZLE_SIZE: 3,
    MAX_PUZZLE_SIZE: 10,
    
    ANIMATION_SPEEDS: {
        slow: 400,
        normal: 200,
        fast: 100
    },
    
    DIFFICULTY_LEVELS: {
        easy: { shuffleMoves: 20, timeBonus: 1.5, scoreMultiplier: 0.8 },
        medium: { shuffleMoves: 50, timeBonus: 1.0, scoreMultiplier: 1.0 },
        hard: { shuffleMoves: 100, timeBonus: 0.7, scoreMultiplier: 1.3 },
        expert: { shuffleMoves: 200, timeBonus: 0.5, scoreMultiplier: 1.5 }
    },
    
    POWERUPS: {
        hint: { default: 3, max: 5 },
        freeze: { default: 2, max: 3, duration: 10000 },
        shuffle: { default: 1, max: 2 },
        undo: { default: 5, max: 10 }
    },
    
    ACHIEVEMENTS: [
        { id: 'first_steps', name: 'First Steps', desc: 'Complete your first puzzle', condition: { puzzles: 1 } },
        { id: 'speed_demon', name: 'Speed Demon', desc: 'Solve in under 30 seconds', condition: { time: 30 } },
        { id: 'puzzle_master', name: 'Puzzle Master', desc: 'Solve 100 puzzles', condition: { puzzles: 100 } },
        { id: 'perfect_play', name: 'Perfect Play', desc: 'Solve with minimum moves', condition: { optimal: true } },
        { id: 'christmas_hero', name: 'Christmas Hero', desc: 'Complete all story chapters', condition: { chapters: 7 } },
        { id: 'giant_solver', name: 'Giant Solver', desc: 'Complete a 10x10 puzzle', condition: { size: 10 } }
    ],
    
    THEMES: {
        christmas: { primary: '#228b22', secondary: '#c41e3a', accent: '#ffd700' },
        santa: { primary: '#c41e3a', secondary: '#ffffff', accent: '#000000' },
        snowman: { primary: '#87ceeb', secondary: '#ffffff', accent: '#ff6347' },
        reindeer: { primary: '#8b4513', secondary: '#daa520', accent: '#228b22' },
        gifts: { primary: '#ff69b4', secondary: '#4169e1', accent: '#ffd700' }
    },
    
    STORY_CHAPTERS: [
        { id: 1, name: 'The Workshop', puzzles: 3, unlocked: true },
        { id: 2, name: 'Reindeer Stables', puzzles: 4, unlocked: false },
        { id: 3, name: 'The Frozen Lake', puzzles: 4, unlocked: false },
        { id: 4, name: 'Candy Cane Forest', puzzles: 5, unlocked: false },
        { id: 5, name: 'Christmas Eve', puzzles: 5, unlocked: false },
        { id: 6, name: 'New Year\'s Dawn', puzzles: 5, unlocked: false },
        { id: 7, name: 'Twelfth Night Finale', puzzles: 5, unlocked: false }
    ],
    
    ADAPTIVE_DIFFICULTY: {
        enabled: true,
        winStreakThreshold: 3,
        lossStreakThreshold: 2,
        performanceWindow: 5
    },
    
    SCORING: {
        baseScore: 1000,
        timePenalty: 2,
        movePenalty: 5,
        hintPenalty: 50,
        perfectBonus: 500
    },
    
    STORAGE_KEYS: {
        user: 'puzzle_user',
        settings: 'puzzle_settings',
        stats: 'puzzle_stats',
        achievements: 'puzzle_achievements',
        leaderboard: 'puzzle_leaderboard'
    }
};

Object.freeze(CONFIG);

