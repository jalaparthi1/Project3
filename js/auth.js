const Auth = {
    currentUser: null,
    isLoggedIn: false,

    init() {
        this.loadUser();
        this.bindForms();
        this.updateUI();
    },

    loadUser() {
        const user = Utils.storage.get(CONFIG.STORAGE_KEYS.user);
        if (user && user.token) {
            this.currentUser = user;
            this.isLoggedIn = true;
        }
    },

    bindForms() {
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
    },

    async handleLogin() {
        const email = document.getElementById('loginEmail')?.value?.trim();
        const password = document.getElementById('loginPassword')?.value;
        const remember = document.getElementById('rememberMe')?.checked;

        if (!email || !password) {
            UI.showToast('Please fill in all fields', 'error');
            return;
        }

        if (!Security.validateEmail(email)) {
            UI.showToast('Invalid email format', 'error');
            return;
        }

        if (!Security.validatePassword(password)) {
            UI.showToast('Invalid password', 'error');
            return;
        }

        try {
            const response = await this.apiRequest('/auth/login', 'POST', { email, password });
            
            if (response.success) {
                this.currentUser = response.user;
                this.currentUser.token = response.token;
                this.isLoggedIn = true;
                
                if (remember) {
                    Utils.storage.set(CONFIG.STORAGE_KEYS.user, this.currentUser);
                }
                
                this.updateUI();
                UI.hideModal('loginModal');
                UI.showToast(`Welcome back, ${Security.escapeHtml(this.currentUser.username)}!`, 'success');
                
                if (UI.currentPage === 'play') {
                    UI.hideLoginRequired();
                    if (!game.isPlaying) {
                        game.render();
                    }
                }
            } else {
                UI.showToast(response.message || 'Login failed', 'error');
            }
        } catch (error) {
            this.handleOfflineLogin(email, password);
        }
    },

    handleOfflineLogin(email, password) {
        const users = Utils.storage.get('offline_users') || [];
        const user = users.find(u => u.email === email);
        
        if (user && user.password === this.hashPassword(password)) {
        this.currentUser = { ...user, token: Utils.generateId() };
        delete this.currentUser.password;
        this.isLoggedIn = true;
        Utils.storage.set(CONFIG.STORAGE_KEYS.user, this.currentUser);
        this.updateUI();
        UI.hideModal('loginModal');
        UI.showToast(`Welcome back, ${this.currentUser.username}!`, 'success');
        
        if (UI.currentPage === 'play') {
            UI.hideLoginRequired();
            if (!game.isPlaying) {
                game.render();
            }
        }
        } else {
            UI.showToast('Invalid email or password', 'error');
        }
    },

    async handleRegister() {
        const username = document.getElementById('registerUsername')?.value?.trim();
        const email = document.getElementById('registerEmail')?.value?.trim();
        const password = document.getElementById('registerPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;

        if (!username || !email || !password || !confirmPassword) {
            UI.showToast('Please fill in all fields', 'error');
            return;
        }

        if (!Security.validateUsername(username)) {
            UI.showToast('Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens', 'error');
            return;
        }

        if (!Security.validateEmail(email)) {
            UI.showToast('Invalid email format', 'error');
            return;
        }

        if (!Security.validatePassword(password)) {
            UI.showToast('Password must be 6-128 characters', 'error');
            return;
        }

        if (password !== confirmPassword) {
            UI.showToast('Passwords do not match', 'error');
            return;
        }

        try {
            const response = await this.apiRequest('/auth/register', 'POST', {
                username,
                email,
                password
            });
            
            if (response.success) {
                this.currentUser = response.user;
                this.currentUser.token = response.token;
                this.isLoggedIn = true;
                Utils.storage.set(CONFIG.STORAGE_KEYS.user, this.currentUser);
                this.updateUI();
                UI.hideModal('loginModal');
                UI.showToast('Account created successfully!', 'success');
                
                if (UI.currentPage === 'play') {
                    UI.hideLoginRequired();
                    if (!game.isPlaying) {
                        game.render();
                    }
                }
            } else {
                UI.showToast(response.message || 'Registration failed', 'error');
            }
        } catch (error) {
            this.handleOfflineRegister(username, email, password);
        }
    },

    handleOfflineRegister(username, email, password) {
        const users = Utils.storage.get('offline_users') || [];
        
        if (users.some(u => u.email === email)) {
            UI.showToast('Email already registered', 'error');
            return;
        }
        
        if (users.some(u => u.username === username)) {
            UI.showToast('Username already taken', 'error');
            return;
        }
        
        const newUser = {
            id: Utils.generateId(),
            username,
            email,
            password: this.hashPassword(password),
            createdAt: Date.now()
        };
        
        users.push(newUser);
        Utils.storage.set('offline_users', users);
        
        this.currentUser = { ...newUser, token: Utils.generateId() };
        delete this.currentUser.password;
        this.isLoggedIn = true;
        Utils.storage.set(CONFIG.STORAGE_KEYS.user, this.currentUser);
        this.updateUI();
        UI.hideModal('loginModal');
        UI.showToast('Account created successfully!', 'success');
        
        if (UI.currentPage === 'play') {
            UI.hideLoginRequired();
            if (!game.isPlaying) {
                game.render();
            }
        }
    },

    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        Utils.storage.remove(CONFIG.STORAGE_KEYS.user);
        
        if (game.isPlaying) {
            game.stopTimer();
            game.isPlaying = false;
            game.puzzle = null;
        }
        
        if (UI.currentPage === 'play') {
            UI.showLoginRequired();
            const grid = document.getElementById('puzzleGrid');
            if (grid) grid.innerHTML = '';
        }
        
        this.updateUI();
        UI.showToast('Logged out successfully', 'info');
    },

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const userMenu = document.getElementById('userMenu');
        
        if (this.isLoggedIn && this.currentUser) {
            if (loginBtn) {
                loginBtn.textContent = this.currentUser.username;
                loginBtn.onclick = () => {
                    if (confirm('Do you want to logout?')) {
                        this.logout();
                    }
                };
            }
            if (UI.currentPage === 'play') {
                UI.hideLoginRequired();
            }
        } else {
            if (loginBtn) {
                loginBtn.textContent = 'Login';
                loginBtn.onclick = () => UI.showModal('loginModal');
            }
            if (UI.currentPage === 'play') {
                UI.showLoginRequired();
            }
        }

        UI.updateStatsDisplay();
    },

    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    },

    async apiRequest(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const token = this.currentUser?.token;
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        return response.json();
    },

    getUser() {
        return this.currentUser;
    },

    isAuthenticated() {
        return this.isLoggedIn;
    }
};

