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
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;
        const remember = document.getElementById('rememberMe')?.checked;

        if (!email || !password) {
            UI.showToast('Please fill in all fields', 'error');
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
                UI.showToast(`Welcome back, ${this.currentUser.username}!`, 'success');
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
        } else {
            UI.showToast('Invalid email or password', 'error');
        }
    },

    async handleRegister() {
        const username = document.getElementById('registerUsername')?.value;
        const email = document.getElementById('registerEmail')?.value;
        const password = document.getElementById('registerPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;

        if (!username || !email || !password || !confirmPassword) {
            UI.showToast('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            UI.showToast('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            UI.showToast('Password must be at least 6 characters', 'error');
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
    },

    logout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        Utils.storage.remove(CONFIG.STORAGE_KEYS.user);
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
        } else {
            if (loginBtn) {
                loginBtn.textContent = 'Login';
                loginBtn.onclick = () => UI.showModal('loginModal');
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

        if (this.currentUser?.token) {
            options.headers['Authorization'] = `Bearer ${this.currentUser.token}`;
        }

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, options);
        return response.json();
    },

    getUser() {
        return this.currentUser;
    },

    isAuthenticated() {
        return this.isLoggedIn;
    }
};

