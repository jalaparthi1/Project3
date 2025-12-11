class FifteenPuzzle {
    constructor(size = 4) {
        this.size = size;
        this.tiles = [];
        this.emptyPos = { row: size - 1, col: size - 1 };
        this.moveHistory = [];
        this.init();
    }

    init() {
        this.tiles = [];
        for (let i = 0; i < this.size * this.size - 1; i++) {
            this.tiles.push(i + 1);
        }
        this.tiles.push(0);
        this.emptyPos = { row: this.size - 1, col: this.size - 1 };
        this.moveHistory = [];
    }

    getIndex(row, col) {
        return row * this.size + col;
    }

    getPosition(index) {
        return {
            row: Math.floor(index / this.size),
            col: index % this.size
        };
    }

    getTile(row, col) {
        return this.tiles[this.getIndex(row, col)];
    }

    setTile(row, col, value) {
        this.tiles[this.getIndex(row, col)] = value;
    }

    isAdjacent(row, col) {
        const rowDiff = Math.abs(row - this.emptyPos.row);
        const colDiff = Math.abs(col - this.emptyPos.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    canMove(row, col) {
        return this.isAdjacent(row, col);
    }

    getMovableTiles() {
        const movable = [];
        const { row: eRow, col: eCol } = this.emptyPos;
        
        if (eRow > 0) movable.push({ row: eRow - 1, col: eCol });
        if (eRow < this.size - 1) movable.push({ row: eRow + 1, col: eCol });
        if (eCol > 0) movable.push({ row: eRow, col: eCol - 1 });
        if (eCol < this.size - 1) movable.push({ row: eRow, col: eCol + 1 });
        
        return movable;
    }

    move(row, col) {
        if (typeof row !== 'number' || typeof col !== 'number') return false;
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) return false;
        if (!this.canMove(row, col)) return false;
        
        if (this.moveHistory.length > 1000) {
            this.moveHistory = this.moveHistory.slice(-500);
        }
        
        const tileValue = this.getTile(row, col);
        
        this.moveHistory.push({
            from: { row, col },
            to: { ...this.emptyPos },
            value: tileValue
        });
        
        this.setTile(this.emptyPos.row, this.emptyPos.col, tileValue);
        this.setTile(row, col, 0);
        this.emptyPos = { row, col };
        
        return true;
    }

    undo() {
        if (this.moveHistory.length === 0) return false;
        
        const lastMove = this.moveHistory.pop();
        const { from, to, value } = lastMove;
        
        this.setTile(from.row, from.col, value);
        this.setTile(to.row, to.col, 0);
        this.emptyPos = { ...to };
        
        return true;
    }

    isSolved() {
        for (let i = 0; i < this.tiles.length - 1; i++) {
            if (this.tiles[i] !== i + 1) return false;
        }
        return this.tiles[this.tiles.length - 1] === 0;
    }

    countInversions() {
        let inversions = 0;
        const flatTiles = this.tiles.filter(t => t !== 0);
        
        for (let i = 0; i < flatTiles.length; i++) {
            for (let j = i + 1; j < flatTiles.length; j++) {
                if (flatTiles[i] > flatTiles[j]) {
                    inversions++;
                }
            }
        }
        
        return inversions;
    }

    isSolvable() {
        const inversions = this.countInversions();
        
        if (this.size % 2 === 1) {
            return inversions % 2 === 0;
        } else {
            const emptyRowFromBottom = this.size - this.emptyPos.row;
            if (emptyRowFromBottom % 2 === 0) {
                return inversions % 2 === 1;
            } else {
                return inversions % 2 === 0;
            }
        }
    }

    shuffle(moves = null) {
        moves = moves || CONFIG.DIFFICULTY_LEVELS.medium.shuffleMoves;
        moves = Math.min(Math.max(parseInt(moves) || 50, 10), 1000);
        
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            this.moveHistory = [];
            for (let i = 0; i < moves; i++) {
                const movable = this.getMovableTiles();
                if (movable.length === 0) break;
                const randomTile = movable[Math.floor(Math.random() * movable.length)];
                this.move(randomTile.row, randomTile.col);
            }
            
            if (this.isSolvable() && !this.isSolved()) {
                this.moveHistory = [];
                return;
            }
            
            attempts++;
            if (attempts < maxAttempts) {
                this.init();
            }
        }
        
        this.moveHistory = [];
    }

    shuffleWithDifficulty(difficulty) {
        const moves = CONFIG.DIFFICULTY_LEVELS[difficulty]?.shuffleMoves || 50;
        this.shuffle(moves);
    }

    getState() {
        return {
            tiles: [...this.tiles],
            emptyPos: { ...this.emptyPos },
            size: this.size
        };
    }

    setState(state) {
        this.tiles = [...state.tiles];
        this.emptyPos = { ...state.emptyPos };
        this.size = state.size;
    }

    clone() {
        const cloned = new FifteenPuzzle(this.size);
        cloned.tiles = [...this.tiles];
        cloned.emptyPos = { ...this.emptyPos };
        cloned.moveHistory = [...this.moveHistory];
        return cloned;
    }

    getHint() {
        const solution = this.solve();
        if (solution && solution.length > 0) {
            return solution[0];
        }
        return null;
    }

    manhattanDistance(tile, currentPos, goalPos) {
        return Math.abs(currentPos.row - goalPos.row) + Math.abs(currentPos.col - goalPos.col);
    }

    heuristic() {
        let distance = 0;
        
        for (let i = 0; i < this.tiles.length; i++) {
            const tile = this.tiles[i];
            if (tile !== 0) {
                const currentPos = this.getPosition(i);
                const goalPos = this.getPosition(tile - 1);
                distance += this.manhattanDistance(tile, currentPos, goalPos);
            }
        }
        
        return distance;
    }

    solve(maxIterations = 10000) {
        if (this.isSolved()) return [];
        if (!this.isSolvable()) return null;
        
        const startState = this.getState();
        const openSet = [{ puzzle: this.clone(), moves: [], cost: this.heuristic() }];
        const closedSet = new Set();
        let iterations = 0;
        
        while (openSet.length > 0 && iterations < maxIterations) {
            iterations++;
            openSet.sort((a, b) => (a.moves.length + a.cost) - (b.moves.length + b.cost));
            
            const current = openSet.shift();
            const stateKey = current.puzzle.tiles.join(',');
            
            if (closedSet.has(stateKey)) continue;
            closedSet.add(stateKey);
            
            if (current.puzzle.isSolved()) {
                this.setState(startState);
                return current.moves;
            }
            
            const movable = current.puzzle.getMovableTiles();
            
            for (const tile of movable) {
                const newPuzzle = current.puzzle.clone();
                newPuzzle.move(tile.row, tile.col);
                
                const newStateKey = newPuzzle.tiles.join(',');
                if (!closedSet.has(newStateKey)) {
                    openSet.push({
                        puzzle: newPuzzle,
                        moves: [...current.moves, tile],
                        cost: newPuzzle.heuristic()
                    });
                }
            }
        }
        
        this.setState(startState);
        return null;
    }
}

