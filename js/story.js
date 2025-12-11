const Story = {
    chapters: [],
    currentChapter: null,
    currentPuzzle: 0,
    progress: {},

    init() {
        this.loadChapters();
        this.loadProgress();
        this.bindEvents();
        this.render();
    },

    loadChapters() {
        this.chapters = [
            {
                id: 1,
                name: 'The Workshop',
                description: 'Santa\'s workshop is in chaos! Help organize the toys.',
                puzzles: [
                    { size: 3, difficulty: 'easy', story: 'The toy shelves are mixed up. Can you sort them?' },
                    { size: 3, difficulty: 'easy', story: 'More toys need organizing. Keep going!' },
                    { size: 4, difficulty: 'medium', story: 'The big toy chest needs your help!' }
                ],
                reward: 'Workshop Master Badge',
                unlocked: true
            },
            {
                id: 2,
                name: 'Reindeer Stables',
                description: 'The reindeer are confused! Help them find their spots.',
                puzzles: [
                    { size: 3, difficulty: 'easy', story: 'Rudolph lost his way. Guide him home.' },
                    { size: 4, difficulty: 'medium', story: 'The other reindeer need organizing too.' },
                    { size: 4, difficulty: 'medium', story: 'All reindeer must be ready for the big night!' },
                    { size: 4, difficulty: 'hard', story: 'Final check before takeoff!' }
                ],
                reward: 'Reindeer Whisperer Badge',
                unlocked: false
            },
            {
                id: 3,
                name: 'The Frozen Lake',
                description: 'Ice fragments have blocked the path! Clear the way.',
                puzzles: [
                    { size: 4, difficulty: 'medium', story: 'Ice blocks the sleigh path!' },
                    { size: 4, difficulty: 'medium', story: 'More ice to clear!' },
                    { size: 4, difficulty: 'hard', story: 'The path is almost clear!' },
                    { size: 6, difficulty: 'hard', story: 'Final ice barrier!' }
                ],
                reward: 'Ice Breaker Badge',
                unlocked: false
            },
            {
                id: 4,
                name: 'Candy Cane Forest',
                description: 'Sweet treats are scattered everywhere! Collect them all.',
                puzzles: [
                    { size: 4, difficulty: 'medium', story: 'Candy canes are everywhere!' },
                    { size: 4, difficulty: 'hard', story: 'Gumdrops need collecting.' },
                    { size: 6, difficulty: 'hard', story: 'Chocolate presents are hidden.' },
                    { size: 6, difficulty: 'hard', story: 'Lollipops mark the way.' },
                    { size: 6, difficulty: 'expert', story: 'The sweetest challenge awaits!' }
                ],
                reward: 'Sweet Tooth Badge',
                unlocked: false
            },
            {
                id: 5,
                name: 'Christmas Eve',
                description: 'The final challenge! Save Christmas!',
                puzzles: [
                    { size: 6, difficulty: 'hard', story: 'Presents are mixed up!' },
                    { size: 6, difficulty: 'hard', story: 'The gift list is scrambled.' },
                    { size: 6, difficulty: 'expert', story: 'Time is running out!' },
                    { size: 8, difficulty: 'expert', story: 'Last preparations!' },
                    { size: 8, difficulty: 'expert', story: 'Save Christmas!' }
                ],
                reward: 'Christmas Hero Badge',
                unlocked: false
            }
        ];
    },

    loadProgress() {
        this.progress = Utils.storage.get('story_progress') || {
            completedChapters: [],
            currentChapter: 1,
            puzzlesCompleted: {},
            stars: {}
        };

        this.chapters.forEach((chapter, index) => {
            if (index === 0) {
                chapter.unlocked = true;
            } else {
                chapter.unlocked = this.progress.completedChapters.includes(this.chapters[index - 1].id);
            }
        });
    },

    saveProgress() {
        Utils.storage.set('story_progress', this.progress);
    },

    bindEvents() {
        document.querySelectorAll('.chapter-card').forEach(card => {
            card.addEventListener('click', () => {
                const chapterId = parseInt(card.dataset.chapter);
                this.selectChapter(chapterId);
            });
        });
    },

    selectChapter(chapterId) {
        const validChapterId = parseInt(chapterId);
        if (isNaN(validChapterId) || validChapterId < 1 || validChapterId > 5) {
            UI.showToast('Invalid chapter', 'error');
            return;
        }
        
        const chapter = this.chapters.find(c => c.id === validChapterId);
        
        if (!chapter || !chapter.unlocked) {
            UI.showToast('Complete the previous chapter first!', 'warning');
            return;
        }

        this.currentChapter = chapter;
        this.currentPuzzle = this.progress.puzzlesCompleted[chapterId] || 0;

        if (this.currentPuzzle >= chapter.puzzles.length) {
            UI.showToast('Chapter already completed!', 'info');
            return;
        }

        this.startPuzzle();
    },

    startPuzzle() {
        if (!this.currentChapter) return;

        const puzzleData = this.currentChapter.puzzles[this.currentPuzzle];
        
        UI.showToast(puzzleData.story, 'info');
        
        game.setSize(puzzleData.size);
        game.setDifficulty(puzzleData.difficulty);
        game.newGame();
        
        game.onVictory = (stats) => this.handlePuzzleComplete(stats);
        
        UI.navigateTo('play');
    },

    handlePuzzleComplete(stats) {
        if (!this.currentChapter) {
            game.onVictory = null;
            return;
        }

        const stars = Utils.calculateStars(stats.time, stats.moves, stats.size);
        
        const key = `${this.currentChapter.id}-${this.currentPuzzle}`;
        this.progress.stars[key] = Math.max(this.progress.stars[key] || 0, stars);
        
        this.currentPuzzle++;
        this.progress.puzzlesCompleted[this.currentChapter.id] = this.currentPuzzle;
        this.saveProgress();

        if (this.currentPuzzle >= this.currentChapter.puzzles.length) {
            setTimeout(() => {
                this.completeChapter();
            }, 500);
        } else {
            setTimeout(() => {
                if (confirm('Puzzle Complete! Continue to next puzzle?')) {
                    this.startPuzzle();
                } else {
                    game.onVictory = null;
                    UI.navigateTo('story');
                    this.render();
                }
            }, 500);
        }
    },

    completeChapter() {
        if (!this.progress.completedChapters.includes(this.currentChapter.id)) {
            this.progress.completedChapters.push(this.currentChapter.id);
        }

        const nextChapterIndex = this.chapters.findIndex(c => c.id === this.currentChapter.id) + 1;
        if (nextChapterIndex < this.chapters.length) {
            this.chapters[nextChapterIndex].unlocked = true;
        }

        game.onVictory = null;
        this.saveProgress();

        UI.showToast(`Chapter Complete! Earned: ${this.currentChapter.reward}`, 'success');

        if (this.progress.completedChapters.length === this.chapters.length) {
            const achievements = Utils.storage.get(CONFIG.STORAGE_KEYS.achievements) || [];
            if (!achievements.includes('christmas_hero')) {
                achievements.push('christmas_hero');
                Utils.storage.set(CONFIG.STORAGE_KEYS.achievements, achievements);
                setTimeout(() => {
                    UI.showToast('Achievement Unlocked: Christmas Hero!', 'success');
                }, 1500);
            }
        }
        
        setTimeout(() => {
            UI.navigateTo('story');
            this.render();
        }, 1000);
    },

    getChapterStars(chapterId) {
        const chapter = this.chapters.find(c => c.id === chapterId);
        if (!chapter) return 0;

        let totalStars = 0;
        for (let i = 0; i < chapter.puzzles.length; i++) {
            const key = `${chapterId}-${i}`;
            totalStars += this.progress.stars[key] || 0;
        }

        return totalStars;
    },

    getOverallProgress() {
        const totalPuzzles = this.chapters.reduce((sum, ch) => sum + ch.puzzles.length, 0);
        let completedPuzzles = 0;

        Object.values(this.progress.puzzlesCompleted).forEach(count => {
            completedPuzzles += count;
        });

        return Math.round((completedPuzzles / totalPuzzles) * 100);
    },

    render() {
        const progressEl = document.getElementById('storyProgress');
        if (progressEl) {
            const percent = this.getOverallProgress();
            progressEl.style.width = `${percent}%`;
            
            const textEl = progressEl.parentElement?.nextElementSibling;
            if (textEl) {
                textEl.textContent = `${percent}% Complete`;
            }
        }

        document.querySelectorAll('.chapter-card').forEach(card => {
            const chapterId = parseInt(card.dataset.chapter);
            const chapter = this.chapters.find(c => c.id === chapterId);
            
            if (!chapter) return;

            card.classList.toggle('unlocked', chapter.unlocked);
            card.classList.toggle('locked', !chapter.unlocked);

            const iconEl = card.querySelector('.chapter-icon');
            if (iconEl) {
                if (chapter.unlocked) {
                    iconEl.className = `chapter-icon chapter-${chapterId}`;
                } else {
                    iconEl.className = 'chapter-icon locked-icon';
                }
            }

            const starsEl = card.querySelector('.chapter-stars');
            if (starsEl) {
                const stars = this.getChapterStars(chapterId);
                const maxStars = chapter.puzzles.length * 3;
                const filledStars = Math.min(3, Math.floor(stars / chapter.puzzles.length));
                
                starsEl.className = 'chapter-stars';
                if (stars === 0) {
                    starsEl.classList.add('empty');
                }
            }
        });
    }
};

