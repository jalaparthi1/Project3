const Sprint = {
    totalTasks: 63,
    totalDays: 21,
    featureMilestones: [
        { day: 3, feature: 'Core Puzzle Mechanics' },
        { day: 7, feature: 'Week 1 Foundation Complete' },
        { day: 9, feature: 'User Authentication' },
        { day: 10, feature: 'Adaptive Difficulty' },
        { day: 12, feature: 'Leaderboard System' },
        { day: 13, feature: 'Story Mode' },
        { day: 14, feature: 'Achievements System' },
        { day: 17, feature: 'Security Implementation' },
        { day: 21, feature: 'Project Complete' }
    ],

    init() {
        this.loadProgress();
        this.setupEventListeners();
        this.updateProgress();
        this.expandFirstWeek();
    },

    setupEventListeners() {
        const weekHeaders = document.querySelectorAll('[data-week-toggle]');
        weekHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                const week = header.getAttribute('data-week-toggle');
                this.toggleWeek(week);
            });
        });

        const checkboxes = document.querySelectorAll('[data-task]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = e.target.getAttribute('data-task');
                this.saveTaskProgress(taskId, e.target.checked);
                this.updateProgress();
            });
        });
    },

    toggleWeek(weekNum) {
        const weekSection = document.querySelector(`[data-week="${weekNum}"]`);
        if (weekSection) {
            weekSection.classList.toggle('expanded');
        }
    },

    expandFirstWeek() {
        const firstWeek = document.querySelector('[data-week="1"]');
        if (firstWeek) {
            firstWeek.classList.add('expanded');
        }
    },

    saveTaskProgress(taskId, completed) {
        const progress = this.getStoredProgress();
        progress[taskId] = completed;
        localStorage.setItem('sprintProgress', JSON.stringify(progress));
    },

    getStoredProgress() {
        const stored = localStorage.getItem('sprintProgress');
        return stored ? JSON.parse(stored) : {};
    },

    loadProgress() {
        const progress = this.getStoredProgress();
        const checkboxes = document.querySelectorAll('[data-task]');
        
        checkboxes.forEach(checkbox => {
            const taskId = checkbox.getAttribute('data-task');
            if (progress[taskId]) {
                checkbox.checked = true;
            }
        });
    },

    getCompletedTasks() {
        const progress = this.getStoredProgress();
        return Object.values(progress).filter(completed => completed).length;
    },

    getCompletedDays() {
        const progress = this.getStoredProgress();
        let completedDays = 0;

        for (let day = 1; day <= this.totalDays; day++) {
            const dayTasks = document.querySelectorAll(`[data-task^="${day}-"]`);
            let allCompleted = true;

            dayTasks.forEach(task => {
                const taskId = task.getAttribute('data-task');
                if (!progress[taskId]) {
                    allCompleted = false;
                }
            });

            if (dayTasks.length > 0 && allCompleted) {
                completedDays++;
            }
        }

        return completedDays;
    },

    getCompletedFeatures() {
        const progress = this.getStoredProgress();
        let completedFeatures = 0;

        this.featureMilestones.forEach(milestone => {
            const dayTasks = document.querySelectorAll(`[data-task^="${milestone.day}-"]`);
            let allCompleted = true;

            dayTasks.forEach(task => {
                const taskId = task.getAttribute('data-task');
                if (!progress[taskId]) {
                    allCompleted = false;
                }
            });

            if (dayTasks.length > 0 && allCompleted) {
                completedFeatures++;
            }
        });

        return completedFeatures;
    },

    updateProgress() {
        const completedTasks = this.getCompletedTasks();
        const completedDays = this.getCompletedDays();
        const completedFeatures = this.getCompletedFeatures();

        const overallPercent = Math.round((completedTasks / this.totalTasks) * 100);

        const overallProgressEl = document.getElementById('overallProgress');
        const daysCompletedEl = document.getElementById('daysCompleted');
        const featuresCompleteEl = document.getElementById('featuresComplete');

        if (overallProgressEl) {
            overallProgressEl.textContent = `${overallPercent}%`;
        }

        if (daysCompletedEl) {
            daysCompletedEl.textContent = `${completedDays}/${this.totalDays}`;
        }

        if (featuresCompleteEl) {
            featuresCompleteEl.textContent = completedFeatures;
        }
    }
};

