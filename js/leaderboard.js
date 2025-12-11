const leaderboard = {
    data: [],
    currentFilter: { size: 'all', sort: 'time' },

    init() {
        this.bindFilters();
        this.load();
    },

    bindFilters() {
        document.getElementById('leaderboardSize')?.addEventListener('change', (e) => {
            this.currentFilter.size = e.target.value;
            this.render();
        });

        document.getElementById('leaderboardSort')?.addEventListener('change', (e) => {
            this.currentFilter.sort = e.target.value;
            this.render();
        });
    },

    async load() {
        try {
            const params = new URLSearchParams({
                size: this.currentFilter.size,
                sort: this.currentFilter.sort,
                limit: '100'
            });
            const response = await fetch(`${CONFIG.API_BASE_URL}/leaderboard?${params}`);
            if (response.ok) {
                this.data = await response.json();
            } else {
                throw new Error('API not available');
            }
        } catch {
            this.data = Utils.storage.get(CONFIG.STORAGE_KEYS.leaderboard) || [];
        }
        
        this.render();
    },

    getFilteredData() {
        let filtered = [...this.data];

        if (this.currentFilter.size !== 'all') {
            const size = parseInt(this.currentFilter.size);
            filtered = filtered.filter(entry => entry.size === size);
        }

        switch (this.currentFilter.sort) {
            case 'time':
                filtered.sort((a, b) => a.time - b.time);
                break;
            case 'moves':
                filtered.sort((a, b) => a.moves - b.moves);
                break;
            case 'score':
                filtered.sort((a, b) => b.score - a.score);
                break;
        }

        return filtered;
    },

    render() {
        const filtered = this.getFilteredData();
        
        this.renderPodium(filtered.slice(0, 3));
        this.renderTable(filtered);
    },

    renderPodium(topThree) {
        const positions = ['first', 'second', 'third'];
        
        positions.forEach((pos, index) => {
            const entry = topThree[index];
            const nameEl = document.getElementById(`${pos}-name`);
            const scoreEl = document.getElementById(`${pos}-score`);
            
            if (nameEl && scoreEl) {
                if (entry) {
                    nameEl.textContent = entry.player || 'Anonymous';
                    scoreEl.textContent = this.formatScore(entry);
                } else {
                    nameEl.textContent = '---';
                    scoreEl.textContent = '--:--';
                }
            }
        });
    },

    renderTable(data) {
        const tbody = document.getElementById('leaderboardBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (data.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 6;
            cell.style.textAlign = 'center';
            cell.style.padding = '2rem';
            cell.textContent = 'No records yet. Be the first!';
            row.appendChild(cell);
            tbody.appendChild(row);
            return;
        }

        data.slice(0, 50).forEach((entry, index) => {
            const row = document.createElement('tr');
            
            let rankDisplay = index + 1;
            if (index === 0) rankDisplay = '🥇';
            else if (index === 1) rankDisplay = '🥈';
            else if (index === 2) rankDisplay = '🥉';

            const rankCell = Security.createElementWithText('td', rankDisplay);
            const playerCell = Security.createElementWithText('td', Security.escapeHtml(entry.player || 'Anonymous'));
            const timeCell = Security.createElementWithText('td', Utils.formatTime(entry.time || 0));
            const movesCell = Security.createElementWithText('td', String(entry.moves || 0));
            const scoreCell = Security.createElementWithText('td', String(entry.score || 0));
            const dateCell = Security.createElementWithText('td', Utils.formatDate(entry.date || Date.now()));

            row.appendChild(rankCell);
            row.appendChild(playerCell);
            row.appendChild(timeCell);
            row.appendChild(movesCell);
            row.appendChild(scoreCell);
            row.appendChild(dateCell);

            tbody.appendChild(row);
        });
    },

    formatScore(entry) {
        switch (this.currentFilter.sort) {
            case 'time':
                return Utils.formatTime(entry.time);
            case 'moves':
                return `${entry.moves} moves`;
            case 'score':
                return entry.score || 0;
            default:
                return Utils.formatTime(entry.time);
        }
    },

    async submitScore(scoreData) {
        const entry = {
            id: Utils.generateId(),
            player: Auth.currentUser?.username || 'Guest',
            time: scoreData.time,
            moves: scoreData.moves,
            score: scoreData.score,
            size: scoreData.size,
            date: Date.now()
        };

        this.data.push(entry);
        this.data.sort((a, b) => a.time - b.time);
        
        Utils.storage.set(CONFIG.STORAGE_KEYS.leaderboard, this.data.slice(0, 100));

        try {
            await fetch(`${CONFIG.API_BASE_URL}/leaderboard`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.currentUser?.token || ''}`
                },
                body: JSON.stringify(entry)
            });
        } catch {}
    },

    getUserRank(userId) {
        const sorted = [...this.data].sort((a, b) => a.time - b.time);
        const index = sorted.findIndex(e => e.playerId === userId);
        return index >= 0 ? index + 1 : null;
    },

    getPersonalBest(userId, size = null) {
        let entries = this.data.filter(e => e.playerId === userId);
        
        if (size) {
            entries = entries.filter(e => e.size === size);
        }

        if (entries.length === 0) return null;

        return entries.reduce((best, current) => {
            return current.time < best.time ? current : best;
        });
    }
};

