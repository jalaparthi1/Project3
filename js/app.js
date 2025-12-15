document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    UI.init();
    UI.loadSettings();
    Auth.init();
    leaderboard.init();
    Story.init();
    Sprint.init();
    
    initPreviewGrid();
    initKeyboardControls();
    initTouchControls();
    
    if (Auth.isAuthenticated()) {
        game.render();
        game.renderPreview(document.getElementById('previewGrid'));
    } else {
        const grid = document.getElementById('puzzleGrid');
        if (grid) grid.innerHTML = '';
    }
}

function initPreviewGrid() {
    const previewGrid = document.getElementById('previewGrid');
    if (previewGrid) {
        previewGrid.style.gridTemplateColumns = `repeat(4, 1fr)`;
        
        for (let i = 1; i <= 16; i++) {
            const tile = document.createElement('div');
            tile.className = 'puzzle-tile';
            tile.style.fontSize = '1rem';
            tile.style.background = i === 16 
                ? 'rgba(0, 0, 0, 0.2)' 
                : 'linear-gradient(135deg, var(--primary-red), var(--primary-red-dark))';
            
            if (i < 16) {
                tile.textContent = i;
            }
            
            previewGrid.appendChild(tile);
        }
        
        animatePreviewGrid(previewGrid);
    }
}

function animatePreviewGrid(grid) {
    const tiles = grid.querySelectorAll('.puzzle-tile');
    let currentEmpty = 15;
    
    setInterval(() => {
        const possibleMoves = [];
        const row = Math.floor(currentEmpty / 4);
        const col = currentEmpty % 4;
        
        if (row > 0) possibleMoves.push(currentEmpty - 4);
        if (row < 3) possibleMoves.push(currentEmpty + 4);
        if (col > 0) possibleMoves.push(currentEmpty - 1);
        if (col < 3) possibleMoves.push(currentEmpty + 1);
        
        const moveIndex = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        
        tiles[currentEmpty].textContent = tiles[moveIndex].textContent;
        tiles[currentEmpty].style.background = 'linear-gradient(135deg, var(--primary-red), var(--primary-red-dark))';
        
        tiles[moveIndex].textContent = '';
        tiles[moveIndex].style.background = 'rgba(0, 0, 0, 0.2)';
        
        currentEmpty = moveIndex;
    }, 1000);
}

function initKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (!game.isPlaying || game.isPaused) return;
        if (UI.currentPage !== 'play') return;
        
        const { row, col } = game.puzzle.emptyPos;
        let targetRow = row;
        let targetCol = col;
        
        switch (e.key) {
            case 'ArrowUp':
                targetRow = row + 1;
                break;
            case 'ArrowDown':
                targetRow = row - 1;
                break;
            case 'ArrowLeft':
                targetCol = col + 1;
                break;
            case 'ArrowRight':
                targetCol = col - 1;
                break;
            case 'Escape':
                game.pause();
                return;
            case 'r':
            case 'R':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    game.reset();
                }
                return;
            case 'n':
            case 'N':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    game.newGame();
                }
                return;
            case 'h':
            case 'H':
                game.usePowerup('hint');
                return;
            case 'u':
            case 'U':
                game.usePowerup('undo');
                return;
            default:
                return;
        }
        
        e.preventDefault();
        
        if (targetRow >= 0 && targetRow < game.size && 
            targetCol >= 0 && targetCol < game.size) {
            game.moveTile(targetRow, targetCol);
        }
    });
}

function initTouchControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    const minSwipeDistance = 30;
    
    const puzzleGrid = document.getElementById('puzzleGrid');
    if (!puzzleGrid) return;
    
    puzzleGrid.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    puzzleGrid.addEventListener('touchend', (e) => {
        if (!game.isPlaying || game.isPaused) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
            return;
        }
        
        const { row, col } = game.puzzle.emptyPos;
        let targetRow = row;
        let targetCol = col;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
                targetCol = col - 1;
            } else {
                targetCol = col + 1;
            }
        } else {
            if (deltaY > 0) {
                targetRow = row - 1;
            } else {
                targetRow = row + 1;
            }
        }
        
        if (targetRow >= 0 && targetRow < game.size && 
            targetCol >= 0 && targetCol < game.size) {
            game.moveTile(targetRow, targetCol);
        }
    }, { passive: true });
}

window.addEventListener('beforeunload', () => {
    if (game.isPlaying) {
        game.saveStats();
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}

