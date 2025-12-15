class AudioManager {
    constructor() {
        this.enabled = true;
        this.musicEnabled = true;
        this.sfxEnabled = true;
        this.volume = 0.7;
        this.sounds = {};
        this.musicPlaying = false;
        this.audioContext = null;
        this.musicOscillators = [];
        this.musicGainNode = null;
        this.musicInterval = null;
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }

        this.loadSettings();
        
        document.addEventListener('click', () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            if (this.musicEnabled && !this.musicPlaying && this.audioContext) {
                this.startBackgroundMusic();
            }
        }, { once: true });
        
        document.addEventListener('keydown', () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            if (this.musicEnabled && !this.musicPlaying && this.audioContext) {
                this.startBackgroundMusic();
            }
        }, { once: true });
    }

    loadSettings() {
        const settings = Utils.storage.get(CONFIG.STORAGE_KEYS.settings);
        if (settings) {
            this.musicEnabled = settings.music !== false;
            this.sfxEnabled = settings.sfx !== false;
            this.volume = settings.volume !== undefined ? settings.volume / 100 : 0.7;
            this.updateVolume();
            this.updateUI();
        }
    }

    updateUI() {
        const musicToggle = document.getElementById('musicToggle');
        const sfxToggle = document.getElementById('sfxToggle');
        const volumeSlider = document.getElementById('volumeSlider');
        
        if (musicToggle) musicToggle.checked = this.musicEnabled;
        if (sfxToggle) sfxToggle.checked = this.sfxEnabled;
        if (volumeSlider) volumeSlider.value = Math.round(this.volume * 100);
    }

    saveSettings() {
        const settings = Utils.storage.get(CONFIG.STORAGE_KEYS.settings) || {};
        settings.music = this.musicEnabled;
        settings.sfx = this.sfxEnabled;
        settings.volume = Math.round(this.volume * 100);
        Utils.storage.set(CONFIG.STORAGE_KEYS.settings, settings);
    }

    updateVolume() {
        if (this.musicGainNode) {
            this.musicGainNode.gain.value = this.volume * 0.3;
        }
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

    startBackgroundMusic() {
        if (!this.audioContext || this.musicPlaying || !this.musicEnabled) return;
        
        try {
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            this.musicGainNode = this.audioContext.createGain();
            this.musicGainNode.connect(this.audioContext.destination);
            this.musicGainNode.gain.value = this.volume * 0.3;
            
            this.musicPlaying = true;
            this.playMusicSequence();
        } catch (e) {
            console.warn('Could not start background music:', e);
            this.musicPlaying = false;
        }
    }

    playMusicSequence() {
        if (!this.audioContext || !this.musicEnabled || !this.musicPlaying) return;
        
        const notes = [
            { freq: 523.25, duration: 0.5 },
            { freq: 659.25, duration: 0.5 },
            { freq: 783.99, duration: 0.5 },
            { freq: 1046.50, duration: 0.5 },
            { freq: 880.00, duration: 0.5 },
            { freq: 783.99, duration: 0.5 },
            { freq: 659.25, duration: 0.5 },
            { freq: 523.25, duration: 1.0 }
        ];
        
        let noteIndex = 0;
        const playNote = () => {
            if (!this.musicPlaying || !this.musicEnabled) return;
            
            const note = notes[noteIndex];
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.musicGainNode);
            
            oscillator.type = 'sine';
            oscillator.frequency.value = note.freq;
            
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
            gainNode.gain.linearRampToValueAtTime(0.3, now + note.duration - 0.1);
            gainNode.gain.linearRampToValueAtTime(0, now + note.duration);
            
            oscillator.start(now);
            oscillator.stop(now + note.duration);
            
            noteIndex = (noteIndex + 1) % notes.length;
            
            this.musicInterval = setTimeout(() => {
                if (this.musicPlaying && this.musicEnabled) {
                    playNote();
                }
            }, note.duration * 1000);
        };
        
        playNote();
    }

    playMusic() {
        if (!this.musicEnabled) return;
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                return;
            }
        }
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        if (!this.musicPlaying) {
            this.startBackgroundMusic();
        }
    }

    stopMusic() {
        this.musicPlaying = false;
        
        if (this.musicInterval) {
            clearTimeout(this.musicInterval);
            this.musicInterval = null;
        }
        
        if (this.musicOscillators.length > 0) {
            this.musicOscillators.forEach(osc => {
                try {
                    osc.stop();
                } catch (e) {}
            });
            this.musicOscillators = [];
        }
        
        if (this.musicGainNode) {
            try {
                this.musicGainNode.disconnect();
            } catch (e) {}
            this.musicGainNode = null;
        }
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
            const audioContext = this.audioContext || new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
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
            const audioContext = this.audioContext || new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
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

