class Game {
    constructor() {
        this.puzzle = null;
        this.size = CONFIG.DEFAULT_PUZZLE_SIZE;
        this.theme = 'christmas';
        this.difficulty = 'medium';
        this.timer = 0;
        this.timerInterval = null;
        this.moves = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.isFrozen = false;
        this.hintsUsed = 0;
        this.powerups = { ...CONFIG.POWERUPS };
        this.powerupCounts = {};
        this.performanceHistory = [];
        this.currentStreak = 0;
        this.onVictory = null;
        this.init();
    }

    init() {
        this.resetPowerups();
        this.loadStats();
    }

    resetPowerups() {
        this.powerupCounts = {
            hint: CONFIG.POWERUPS.hint.default,
            freeze: CONFIG.POWERUPS.freeze.default,
            shuffle: CONFIG.POWERUPS.shuffle.default,
            undo: CONFIG.POWERUPS.undo.default
        };
        this.updatePowerupUI();
    }

    loadStats() {
        const stats = Utils.storage.get(CONFIG.STORAGE_KEYS.stats);
        if (stats) {
            this.performanceHistory = stats.history || [];
            this.currentStreak = stats.streak || 0;
        }
    }

    saveStats() {
        Utils.storage.set(CONFIG.STORAGE_KEYS.stats, {
            history: this.performanceHistory.slice(-20),
            streak: this.currentStreak
        });
    }

    setSize(size) {
        this.size = Utils.clamp(size, CONFIG.MIN_PUZZLE_SIZE, CONFIG.MAX_PUZZLE_SIZE);
    }

    setTheme(theme) {
        if (CONFIG.THEMES[theme]) {
            this.theme = theme;
        }
    }

    setDifficulty(difficulty) {
        if (CONFIG.DIFFICULTY_LEVELS[difficulty]) {
            this.difficulty = difficulty;
        }
    }

    newGame() {
        this.puzzle = new FifteenPuzzle(this.size);
        this.puzzle.shuffleWithDifficulty(this.difficulty);
        this.timer = 0;
        this.moves = 0;
        this.hintsUsed = 0;
        this.isPlaying = true;
        this.isPaused = false;
        this.isFrozen = false;
        this.resetPowerups();
        this.startTimer();
        this.render();
    }

    reset() {
        if (!this.puzzle) return;
        this.puzzle.init();
        this.puzzle.shuffleWithDifficulty(this.difficulty);
        this.timer = 0;
        this.moves = 0;
        this.hintsUsed = 0;
        this.isFrozen = false;
        this.isPlaying = true;
        this.isPaused = false;
        this.startTimer();
        this.render();
    }

    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
            if (!this.isPaused && !this.isFrozen) {
                this.timer++;
                this.updateTimerUI();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    pause() {
        if (!this.isPlaying) return;
        this.isPaused = true;
        UI.showModal('pauseModal');
    }

    resume() {
        this.isPaused = false;
        UI.hideModal('pauseModal');
    }

    moveTile(row, col) {
        if (!this.isPlaying || this.isPaused) return false;
        
        if (this.puzzle.move(row, col)) {
            this.moves++;
            audioManager.createTileSound();
            this.updateMovesUI();
            this.render();
            
            if (this.puzzle.isSolved()) {
                this.handleVictory();
            }
            
            return true;
        }
        
        return false;
    }

    handleVictory() {
        this.stopTimer();
        this.isPlaying = false;
        
        const score = Utils.calculateScore(this.timer, this.moves, this.size, this.hintsUsed);
        const stars = Utils.calculateStars(this.timer, this.moves, this.size);
        
        this.recordPerformance(true);
        this.currentStreak++;
        this.saveStats();
        
        this.checkAchievements();
        this.saveToLeaderboard(score);
        
        audioManager.createVictorySound();
        
        this.showVictoryModal(score, stars);
        
        if (this.onVictory) {
            setTimeout(() => {
                UI.hideModal('victoryModal');
                this.onVictory({
                    time: this.timer,
                    moves: this.moves,
                    size: this.size,
                    score: score,
                    stars: stars
                });
            }, 2000);
        }
        
        this.updateAdaptiveDifficulty(true);
    }

    recordPerformance(won) {
        this.performanceHistory.push({
            won,
            time: this.timer,
            moves: this.moves,
            size: this.size,
            difficulty: this.difficulty,
            date: Date.now()
        });
        
        if (this.performanceHistory.length > 20) {
            this.performanceHistory.shift();
        }
    }

    updateAdaptiveDifficulty(won) {
        if (!CONFIG.ADAPTIVE_DIFFICULTY.enabled) return;
        
        const recent = this.performanceHistory.slice(-CONFIG.ADAPTIVE_DIFFICULTY.performanceWindow);
        const wins = recent.filter(p => p.won).length;
        const winRate = wins / recent.length;
        
        const difficulties = Object.keys(CONFIG.DIFFICULTY_LEVELS);
        const currentIndex = difficulties.indexOf(this.difficulty);
        
        if (won && this.currentStreak >= CONFIG.ADAPTIVE_DIFFICULTY.winStreakThreshold && winRate > 0.7) {
            if (currentIndex < difficulties.length - 1) {
                this.difficulty = difficulties[currentIndex + 1];
                UI.showToast(`Difficulty increased to ${this.difficulty}!`, 'success');
            }
        } else if (!won && winRate < 0.3) {
            if (currentIndex > 0) {
                this.difficulty = difficulties[currentIndex - 1];
                UI.showToast(`Difficulty adjusted to ${this.difficulty}`, 'info');
            }
        }
        
        this.updateDifficultyUI();
    }

    usePowerup(type) {
        if (!this.isPlaying || this.isPaused) return false;
        if (this.powerupCounts[type] <= 0) return false;
        
        switch (type) {
            case 'hint':
                return this.useHint();
            case 'freeze':
                return this.useFreeze();
            case 'shuffle':
                return this.useShuffle();
            case 'undo':
                return this.useUndo();
            default:
                return false;
        }
    }

    useHint() {
        const hint = this.puzzle.getHint();
        if (hint) {
            this.powerupCounts.hint--;
            this.hintsUsed++;
            this.highlightHint(hint);
            this.updatePowerupUI();
            return true;
        }
        return false;
    }

    useFreeze() {
        this.powerupCounts.freeze--;
        this.isFrozen = true;
        this.updatePowerupUI();
        UI.showToast('Timer frozen for 10 seconds!', 'success');
        
        setTimeout(() => {
            this.isFrozen = false;
            if (this.isPlaying) {
                UI.showToast('Timer resumed!', 'info');
            }
        }, CONFIG.POWERUPS.freeze.duration);
        
        return true;
    }

    useShuffle() {
        this.powerupCounts.shuffle--;
        
        const movable = this.puzzle.getMovableTiles();
        const easiest = movable.reduce((best, tile) => {
            const testPuzzle = this.puzzle.clone();
            testPuzzle.move(tile.row, tile.col);
            const cost = testPuzzle.heuristic();
            return cost < best.cost ? { tile, cost } : best;
        }, { tile: movable[0], cost: Infinity });
        
        if (easiest.tile) {
            this.puzzle.move(easiest.tile.row, easiest.tile.col);
            this.moves++;
            this.render();
        }
        
        this.updatePowerupUI();
        UI.showToast('Smart move applied!', 'success');
        return true;
    }

    useUndo() {
        if (this.puzzle.undo()) {
            this.powerupCounts.undo--;
            this.moves = Math.max(0, this.moves - 1);
            this.render();
            this.updateMovesUI();
            this.updatePowerupUI();
            return true;
        }
        return false;
    }

    highlightHint(tile) {
        const tileElement = document.querySelector(
            `.puzzle-tile[data-row="${tile.row}"][data-col="${tile.col}"]`
        );
        if (tileElement) {
            tileElement.classList.add('hint');
            setTimeout(() => {
                tileElement.classList.remove('hint');
            }, 2000);
        }
    }

    checkAchievements() {
        const stats = this.getPlayerStats();
        const unlockedAchievements = Utils.storage.get(CONFIG.STORAGE_KEYS.achievements) || [];
        
        CONFIG.ACHIEVEMENTS.forEach(achievement => {
            if (unlockedAchievements.includes(achievement.id)) return;
            
            let unlocked = false;
            
            if (achievement.condition.puzzles && stats.totalWins >= achievement.condition.puzzles) {
                unlocked = true;
            }
            if (achievement.condition.time && this.timer <= achievement.condition.time) {
                unlocked = true;
            }
            if (achievement.condition.size && this.size >= achievement.condition.size) {
                unlocked = true;
            }
            
            if (unlocked) {
                unlockedAchievements.push(achievement.id);
                Utils.storage.set(CONFIG.STORAGE_KEYS.achievements, unlockedAchievements);
                UI.showToast(`Achievement unlocked: ${achievement.name}!`, 'success');
            }
        });
    }

    saveToLeaderboard(score) {
        const leaderboard = Utils.storage.get(CONFIG.STORAGE_KEYS.leaderboard) || [];
        const user = Utils.storage.get(CONFIG.STORAGE_KEYS.user);
        
        leaderboard.push({
            id: Utils.generateId(),
            player: user?.username || 'Guest',
            time: this.timer,
            moves: this.moves,
            score,
            size: this.size,
            date: Date.now()
        });
        
        leaderboard.sort((a, b) => a.time - b.time);
        
        Utils.storage.set(CONFIG.STORAGE_KEYS.leaderboard, leaderboard.slice(0, 100));
    }

    getPlayerStats() {
        const allGames = this.performanceHistory;
        const wins = allGames.filter(g => g.won);
        
        return {
            totalGames: allGames.length,
            totalWins: wins.length,
            bestTime: wins.length > 0 ? Math.min(...wins.map(w => w.time)) : null,
            totalMoves: allGames.reduce((sum, g) => sum + g.moves, 0),
            currentStreak: this.currentStreak
        };
    }

    showVictoryModal(score, stars) {
        document.getElementById('victoryTime').textContent = Utils.formatTime(this.timer);
        document.getElementById('victoryMoves').textContent = this.moves;
        document.getElementById('victoryScore').textContent = score;
        
        for (let i = 1; i <= 3; i++) {
            const starEl = document.getElementById(`star${i}`);
            if (starEl) {
                starEl.classList.toggle('earned', i <= stars);
            }
        }
        
        Utils.createConfetti(document.getElementById('confettiContainer'));
        UI.showModal('victoryModal');
    }

    render() {
        const grid = document.getElementById('puzzleGrid');
        if (!grid || !this.puzzle) return;
        
        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        
        const settings = Utils.storage.get(CONFIG.STORAGE_KEYS.settings) || {};
        const highlightMovable = settings.highlightTiles !== false;
        const movable = highlightMovable ? this.puzzle.getMovableTiles() : [];
        
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const value = this.puzzle.getTile(row, col);
                const tile = document.createElement('div');
                tile.className = 'puzzle-tile';
                tile.dataset.row = row;
                tile.dataset.col = col;
                
                if (value === 0) {
                    tile.classList.add('empty');
                } else {
                    tile.textContent = value;
                    
                    if (movable.some(m => m.row === row && m.col === col)) {
                        tile.classList.add('movable');
                    }
                    
                    tile.addEventListener('click', () => {
                        this.moveTile(row, col);
                    });
                }
                
                grid.appendChild(tile);
            }
        }
    }

    renderPreview(container) {
        if (!container) return;
        
        container.innerHTML = '';
        container.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
        
        for (let i = 1; i <= this.size * this.size; i++) {
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile';
            
            if (i === this.size * this.size) {
                tile.classList.add('empty');
            } else {
                tile.textContent = i;
            }
            
            container.appendChild(tile);
        }
    }

    updateTimerUI() {
        const timerEl = document.getElementById('gameTimer');
        if (timerEl) {
            timerEl.textContent = Utils.formatTime(this.timer);
            if (this.isFrozen) {
                timerEl.classList.add('frozen');
            } else {
                timerEl.classList.remove('frozen');
            }
        }
    }

    updateMovesUI() {
        const movesEl = document.getElementById('moveCounter');
        if (movesEl) {
            movesEl.textContent = this.moves;
        }
    }

    updateDifficultyUI() {
        const diffEl = document.getElementById('difficultyLevel');
        if (diffEl) {
            diffEl.textContent = this.difficulty.charAt(0).toUpperCase() + this.difficulty.slice(1);
        }
    }

    updatePowerupUI() {
        Object.keys(this.powerupCounts).forEach(type => {
            const countEl = document.getElementById(`${type}Count`);
            if (countEl) {
                countEl.textContent = this.powerupCounts[type];
            }
            
            const btnEl = document.getElementById(`${type}Power`);
            if (btnEl) {
                btnEl.disabled = this.powerupCounts[type] <= 0;
            }
        });
    }
}

const game = new Game();

