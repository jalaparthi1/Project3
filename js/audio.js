class AudioManager {
    constructor() {
        this.enabled = true;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.volume = 0.7;
        this.sounds = {};
        this.musicPlaying = false;
        this.init();
    }

    init() {
        this.sounds = {
            bgMusic: document.getElementById('bgMusic'),
            tileMove: document.getElementById('tileMoveSound'),
            victory: document.getElementById('victorySound'),
            click: document.getElementById('clickSound')
        };

        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = this.volume;
            }
        });

        this.loadSettings();
    }

    loadSettings() {
        const settings = Utils.storage.get(CONFIG.STORAGE_KEYS.settings);
        if (settings) {
            this.musicEnabled = settings.music !== false;
            this.sfxEnabled = settings.sfx !== false;
            this.volume = settings.volume || 0.7;
            this.updateVolume();
        }
    }

    saveSettings() {
        const settings = Utils.storage.get(CONFIG.STORAGE_KEYS.settings) || {};
        settings.music = this.musicEnabled;
        settings.sfx = this.sfxEnabled;
        settings.volume = this.volume;
        Utils.storage.set(CONFIG.STORAGE_KEYS.settings, settings);
    }

    updateVolume() {
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = this.volume;
            }
        });
    }

    setVolume(value) {
        this.volume = Utils.clamp(value / 100, 0, 1);
        this.updateVolume();
        this.saveSettings();
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.playMusic();
        } else {
            this.stopMusic();
        }
        this.saveSettings();
        return this.musicEnabled;
    }

    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
        this.saveSettings();
        return this.sfxEnabled;
    }

    toggleAll() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopMusic();
        }
        return this.enabled;
    }

    playMusic() {
        if (!this.musicEnabled || !this.sounds.bgMusic) return;
        
        this.sounds.bgMusic.play().catch(() => {
            document.addEventListener('click', () => {
                if (this.musicEnabled && !this.musicPlaying) {
                    this.sounds.bgMusic.play().catch(() => {});
                    this.musicPlaying = true;
                }
            }, { once: true });
        });
        this.musicPlaying = true;
    }

    stopMusic() {
        if (this.sounds.bgMusic) {
            this.sounds.bgMusic.pause();
            this.sounds.bgMusic.currentTime = 0;
        }
        this.musicPlaying = false;
    }

    playSound(soundName) {
        if (!this.enabled || !this.sfxEnabled) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        }
    }

    playTileMove() {
        this.playSound('tileMove');
    }

    playVictory() {
        this.playSound('victory');
    }

    playClick() {
        this.playSound('click');
    }

    createTileSound() {
        if (!this.enabled || !this.sfxEnabled) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(this.volume * 0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch {}
    }

    createVictorySound() {
        if (!this.enabled || !this.sfxEnabled) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const notes = [523.25, 659.25, 783.99, 1046.50];
            
            notes.forEach((freq, i) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.type = 'sine';
                oscillator.frequency.value = freq;
                
                const startTime = audioContext.currentTime + i * 0.15;
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, startTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + 0.5);
            });
        } catch {}
    }
}

const audioManager = new AudioManager();

