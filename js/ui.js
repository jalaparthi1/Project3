const UI = {
    currentPage: 'home',

    init() {
        this.bindNavigation();
        this.bindModals();
        this.bindSettings();
        this.initSnowfall();
        this.updateStatsDisplay();
    },

    bindNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateTo(page);
            });
        });

        document.getElementById('navToggle')?.addEventListener('click', () => {
            document.querySelector('.nav-links')?.classList.toggle('active');
        });

        document.getElementById('playNowBtn')?.addEventListener('click', () => {
            this.navigateTo('play');
            game.newGame();
        });

        document.getElementById('storyModeBtn')?.addEventListener('click', () => {
            this.navigateTo('story');
        });
    },

    navigateTo(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        const pageEl = document.getElementById(`${page}Page`);
        const linkEl = document.querySelector(`.nav-link[data-page="${page}"]`);

        if (pageEl) pageEl.classList.add('active');
        if (linkEl) linkEl.classList.add('active');

        this.currentPage = page;

        if (page === 'play' && !game.isPlaying) {
            game.render();
            game.renderPreview(document.getElementById('previewImage'));
        }

        if (page === 'leaderboard') {
            leaderboard.load();
        }

        if (page === 'profile') {
            this.updateProfilePage();
        }

        document.querySelector('.nav-links')?.classList.remove('active');
    },

    bindModals() {
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => {
                const modal = overlay.closest('.modal');
                if (modal && modal.id !== 'victoryModal') {
                    this.hideModal(modal.id);
                }
            });
        });

        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.showModal('settingsModal');
        });

        document.getElementById('closeSettings')?.addEventListener('click', () => {
            this.hideModal('settingsModal');
        });

        document.getElementById('loginBtn')?.addEventListener('click', () => {
            this.showModal('loginModal');
        });

        document.getElementById('closeLogin')?.addEventListener('click', () => {
            this.hideModal('loginModal');
        });

        document.getElementById('previewBtn')?.addEventListener('click', () => {
            game.renderPreview(document.getElementById('previewImage'));
            this.showModal('previewModal');
        });

        document.getElementById('closePreview')?.addEventListener('click', () => {
            this.hideModal('previewModal');
        });

        document.getElementById('resumeBtn')?.addEventListener('click', () => {
            game.resume();
        });

        document.getElementById('quitGameBtn')?.addEventListener('click', () => {
            game.stopTimer();
            game.isPlaying = false;
            this.hideModal('pauseModal');
            this.navigateTo('home');
        });

        document.getElementById('playAgainBtn')?.addEventListener('click', () => {
            this.hideModal('victoryModal');
            game.newGame();
        });

        document.getElementById('shareBtn')?.addEventListener('click', () => {
            this.shareResult();
        });

        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
                
                tab.classList.add('active');
                const formId = tab.dataset.tab === 'login' ? 'loginForm' : 'registerForm';
                document.getElementById(formId)?.classList.add('active');
            });
        });
    },

    bindSettings() {
        document.getElementById('musicToggle')?.addEventListener('change', (e) => {
            audioManager.toggleMusic();
        });

        document.getElementById('sfxToggle')?.addEventListener('change', (e) => {
            audioManager.toggleSfx();
        });

        document.getElementById('volumeSlider')?.addEventListener('input', (e) => {
            audioManager.setVolume(e.target.value);
        });

        document.getElementById('soundToggle')?.addEventListener('click', () => {
            const enabled = audioManager.toggleAll();
            document.getElementById('soundToggle')?.classList.toggle('muted', !enabled);
        });

        document.getElementById('snowfallToggle')?.addEventListener('change', (e) => {
            const snowfall = document.getElementById('snowfall');
            if (snowfall) {
                snowfall.style.display = e.target.checked ? 'block' : 'none';
            }
            this.saveSettings();
        });

        document.getElementById('highlightTiles')?.addEventListener('change', () => {
            this.saveSettings();
            if (game.isPlaying) game.render();
        });

        document.getElementById('adaptiveDifficulty')?.addEventListener('change', (e) => {
            CONFIG.ADAPTIVE_DIFFICULTY.enabled = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('animationSpeed')?.addEventListener('change', (e) => {
            this.saveSettings();
        });

        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                game.setSize(parseInt(btn.dataset.size));
                if (!game.isPlaying) {
                    game.newGame();
                }
            });
        });

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                game.setTheme(btn.dataset.theme);
            });
        });

        document.querySelectorAll('.powerup-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                game.usePowerup(btn.dataset.power);
            });
        });

        document.getElementById('newGameBtn')?.addEventListener('click', () => {
            game.newGame();
        });

        document.getElementById('resetBtn')?.addEventListener('click', () => {
            game.reset();
        });

        document.getElementById('pauseBtn')?.addEventListener('click', () => {
            game.pause();
        });
    },

    saveSettings() {
        const settings = {
            music: document.getElementById('musicToggle')?.checked,
            sfx: document.getElementById('sfxToggle')?.checked,
            volume: document.getElementById('volumeSlider')?.value,
            showTimer: document.getElementById('showTimer')?.checked,
            highlightTiles: document.getElementById('highlightTiles')?.checked,
            adaptiveDifficulty: document.getElementById('adaptiveDifficulty')?.checked,
            animationSpeed: document.getElementById('animationSpeed')?.value,
            snowfall: document.getElementById('snowfallToggle')?.checked
        };
        Utils.storage.set(CONFIG.STORAGE_KEYS.settings, settings);
    },

    loadSettings() {
        const settings = Utils.storage.get(CONFIG.STORAGE_KEYS.settings);
        if (!settings) return;

        if (settings.music !== undefined) {
            const toggle = document.getElementById('musicToggle');
            if (toggle) toggle.checked = settings.music;
        }
        if (settings.sfx !== undefined) {
            const toggle = document.getElementById('sfxToggle');
            if (toggle) toggle.checked = settings.sfx;
        }
        if (settings.volume !== undefined) {
            const slider = document.getElementById('volumeSlider');
            if (slider) slider.value = settings.volume;
        }
        if (settings.highlightTiles !== undefined) {
            const toggle = document.getElementById('highlightTiles');
            if (toggle) toggle.checked = settings.highlightTiles;
        }
        if (settings.adaptiveDifficulty !== undefined) {
            const toggle = document.getElementById('adaptiveDifficulty');
            if (toggle) toggle.checked = settings.adaptiveDifficulty;
            CONFIG.ADAPTIVE_DIFFICULTY.enabled = settings.adaptiveDifficulty;
        }
        if (settings.snowfall !== undefined) {
            const toggle = document.getElementById('snowfallToggle');
            if (toggle) toggle.checked = settings.snowfall;
            const snowfall = document.getElementById('snowfall');
            if (snowfall) snowfall.style.display = settings.snowfall ? 'block' : 'none';
        }
    },

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const sanitizedMessage = Security.escapeHtml(String(message || ''));
        const validType = ['success', 'error', 'info', 'warning'].includes(type) ? type : 'info';

        const toast = document.createElement('div');
        toast.className = `toast ${validType}`;
        
        const icons = { success: '✓', error: '✗', info: 'ℹ', warning: '⚠' };
        
        const iconSpan = document.createElement('span');
        iconSpan.className = 'toast-icon';
        iconSpan.textContent = icons[validType];
        
        const messageSpan = document.createElement('span');
        messageSpan.className = 'toast-message';
        messageSpan.textContent = sanitizedMessage;
        
        toast.appendChild(iconSpan);
        toast.appendChild(messageSpan);

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    initSnowfall() {
        const snowfall = document.getElementById('snowfall');
        if (snowfall) {
            Utils.createSnowflakes(snowfall, 50);
        }
    },

    updateStatsDisplay() {
        const stats = game.getPlayerStats();
        
        document.getElementById('totalGames')?.textContent && 
            (document.getElementById('totalGames').textContent = stats.totalGames);
        
        document.getElementById('bestTime')?.textContent && 
            (document.getElementById('bestTime').textContent = 
                stats.bestTime ? Utils.formatTime(stats.bestTime) : '--:--');
        
        document.getElementById('currentStreak')?.textContent && 
            (document.getElementById('currentStreak').textContent = stats.currentStreak);
        
        const achievements = Utils.storage.get(CONFIG.STORAGE_KEYS.achievements) || [];
        document.getElementById('achievements')?.textContent && 
            (document.getElementById('achievements').textContent = achievements.length);
    },

    updateProfilePage() {
        const stats = game.getPlayerStats();
        const user = Utils.storage.get(CONFIG.STORAGE_KEYS.user);

        document.getElementById('profileName')?.textContent && 
            (document.getElementById('profileName').textContent = user?.username || 'Guest Player');
        
        document.getElementById('profileGames')?.textContent && 
            (document.getElementById('profileGames').textContent = stats.totalGames);
        
        document.getElementById('profileWins')?.textContent && 
            (document.getElementById('profileWins').textContent = stats.totalWins);
        
        document.getElementById('profileBestTime')?.textContent && 
            (document.getElementById('profileBestTime').textContent = 
                stats.bestTime ? Utils.formatTime(stats.bestTime) : '--:--');
        
        document.getElementById('profileTotalMoves')?.textContent && 
            (document.getElementById('profileTotalMoves').textContent = stats.totalMoves);

        this.updateAchievementsDisplay();
    },

    updateAchievementsDisplay() {
        const unlockedIds = Utils.storage.get(CONFIG.STORAGE_KEYS.achievements) || [];
        
        document.querySelectorAll('.achievement').forEach(el => {
            const iconEl = el.querySelector('.achievement-icon');
            if (!iconEl) return;
            
            const classList = iconEl.classList;
            let achievementId = null;
            
            classList.forEach(c => {
                if (c !== 'achievement-icon' && c !== 'locked-icon') {
                    achievementId = c.replace(/-/g, '_');
                }
            });
            
            if (achievementId && unlockedIds.includes(achievementId)) {
                el.classList.remove('locked');
                el.classList.add('unlocked');
            }
        });
    },

    shareResult() {
        const text = `I solved a ${game.size}x${game.size} Christmas Puzzle in ${Utils.formatTime(game.timer)} with ${game.moves} moves! Can you beat my score?`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Christmas Fifteen Puzzle',
                text: text,
                url: window.location.href
            }).catch(() => {});
        } else {
            navigator.clipboard?.writeText(text).then(() => {
                this.showToast('Result copied to clipboard!', 'success');
            }).catch(() => {
                this.showToast('Could not share result', 'error');
            });
        }
        
        this.hideModal('victoryModal');
    }
};

