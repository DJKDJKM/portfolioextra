class Game2048 {
    constructor() {
        this.grid = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('bestScoreFib') || 0;
        this.size = 4;
        this.gameBoard = document.getElementById('game-board');
        this.tileContainer = document.getElementById('tile-container');
        this.scoreElement = document.getElementById('score');
        this.bestElement = document.getElementById('best');
        this.gameMessage = document.getElementById('game-message');

        // Fibonacci sequence up to 2584
        this.fibSequence = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181];

        this.init();
    }

    init() {
        this.setupGrid();
        this.setupEventListeners();
        this.updateScore();
        this.addRandomTile();
        this.addRandomTile();
        this.renderGrid();
    }

    setupGrid() {
        this.grid = [];
        for (let i = 0; i < this.size; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.size; j++) {
                this.grid[i][j] = 0;
            }
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('new-game').addEventListener('click', () => this.restart());
        document.querySelector('.retry-button').addEventListener('click', () => this.restart());
    }

    handleKeyPress(e) {
        if (this.gameMessage.classList.contains('hidden') === false) {
            return;
        }

        let moved = false;

        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                moved = this.moveLeft();
                break;
            case 'ArrowRight':
                e.preventDefault();
                moved = this.moveRight();
                break;
            case 'ArrowUp':
                e.preventDefault();
                moved = this.moveUp();
                break;
            case 'ArrowDown':
                e.preventDefault();
                moved = this.moveDown();
                break;
            default:
                return;
        }

        if (moved) {
            this.addRandomTile();
            this.renderGrid();
            this.checkGameState();
        }
    }

    canMerge(a, b) {
        // Check if two numbers can merge in Fibonacci sequence
        if (a === 0 || b === 0) return false;

        const indexA = this.fibSequence.indexOf(a);
        const indexB = this.fibSequence.indexOf(b);

        if (indexA === -1 || indexB === -1) return false;

        // They can merge if they're consecutive in the sequence
        return Math.abs(indexA - indexB) === 1;
    }

    getMergeResult(a, b) {
        // Get the result of merging two Fibonacci numbers
        const indexA = this.fibSequence.indexOf(a);
        const indexB = this.fibSequence.indexOf(b);

        const maxIndex = Math.max(indexA, indexB);
        return this.fibSequence[maxIndex + 1];
    }

    moveLeft() {
        let moved = false;
        for (let i = 0; i < this.size; i++) {
            let row = this.grid[i].filter(val => val !== 0);
            let newRow = [];
            let j = 0;

            while (j < row.length) {
                if (j < row.length - 1 && this.canMerge(row[j], row[j + 1])) {
                    const merged = this.getMergeResult(row[j], row[j + 1]);
                    newRow.push(merged);
                    this.score += merged;
                    j += 2;
                } else {
                    newRow.push(row[j]);
                    j++;
                }
            }

            while (newRow.length < this.size) {
                newRow.push(0);
            }

            if (JSON.stringify(this.grid[i]) !== JSON.stringify(newRow)) {
                moved = true;
            }

            this.grid[i] = newRow;
        }
        return moved;
    }

    moveRight() {
        let moved = false;
        for (let i = 0; i < this.size; i++) {
            let row = this.grid[i].filter(val => val !== 0);
            let newRow = [];
            let j = row.length - 1;

            while (j >= 0) {
                if (j > 0 && this.canMerge(row[j], row[j - 1])) {
                    const merged = this.getMergeResult(row[j], row[j - 1]);
                    newRow.unshift(merged);
                    this.score += merged;
                    j -= 2;
                } else {
                    newRow.unshift(row[j]);
                    j--;
                }
            }

            while (newRow.length < this.size) {
                newRow.unshift(0);
            }

            if (JSON.stringify(this.grid[i]) !== JSON.stringify(newRow)) {
                moved = true;
            }

            this.grid[i] = newRow;
        }
        return moved;
    }

    moveUp() {
        let moved = false;
        for (let j = 0; j < this.size; j++) {
            let column = [];
            for (let i = 0; i < this.size; i++) {
                if (this.grid[i][j] !== 0) {
                    column.push(this.grid[i][j]);
                }
            }

            let newColumn = [];
            let i = 0;

            while (i < column.length) {
                if (i < column.length - 1 && this.canMerge(column[i], column[i + 1])) {
                    const merged = this.getMergeResult(column[i], column[i + 1]);
                    newColumn.push(merged);
                    this.score += merged;
                    i += 2;
                } else {
                    newColumn.push(column[i]);
                    i++;
                }
            }

            while (newColumn.length < this.size) {
                newColumn.push(0);
            }

            for (let k = 0; k < this.size; k++) {
                if (this.grid[k][j] !== newColumn[k]) {
                    moved = true;
                }
                this.grid[k][j] = newColumn[k];
            }
        }
        return moved;
    }

    moveDown() {
        let moved = false;
        for (let j = 0; j < this.size; j++) {
            let column = [];
            for (let i = 0; i < this.size; i++) {
                if (this.grid[i][j] !== 0) {
                    column.push(this.grid[i][j]);
                }
            }

            let newColumn = [];
            let i = column.length - 1;

            while (i >= 0) {
                if (i > 0 && this.canMerge(column[i], column[i - 1])) {
                    const merged = this.getMergeResult(column[i], column[i - 1]);
                    newColumn.unshift(merged);
                    this.score += merged;
                    i -= 2;
                } else {
                    newColumn.unshift(column[i]);
                    i--;
                }
            }

            while (newColumn.length < this.size) {
                newColumn.unshift(0);
            }

            for (let k = 0; k < this.size; k++) {
                if (this.grid[k][j] !== newColumn[k]) {
                    moved = true;
                }
                this.grid[k][j] = newColumn[k];
            }
        }
        return moved;
    }

    addRandomTile() {
        let emptyCells = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === 0) {
                    emptyCells.push({row: i, col: j});
                }
            }
        }

        if (emptyCells.length > 0) {
            let randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            // Start with 1 or 2 for Fibonacci
            this.grid[randomCell.row][randomCell.col] = Math.random() < 0.5 ? 1 : 2;
        }
    }

    renderGrid() {
        this.tileContainer.innerHTML = '';

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] !== 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${this.grid[i][j]}`;
                    tile.textContent = this.grid[i][j];

                    const position = this.getTilePosition(i, j);
                    tile.style.left = position.left;
                    tile.style.top = position.top;

                    this.tileContainer.appendChild(tile);

                    setTimeout(() => {
                        tile.classList.add('tile-new');
                    }, 0);
                }
            }
        }

        this.updateScore();
    }

    getTilePosition(row, col) {
        const tileSize = 106.25;
        const gap = 15;

        return {
            left: `${col * (tileSize + gap)}px`,
            top: `${row * (tileSize + gap)}px`
        };
    }

    updateScore() {
        this.scoreElement.textContent = this.score;

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScoreFib', this.bestScore);
        }

        this.bestElement.textContent = this.bestScore;
    }

    checkGameState() {
        if (this.hasWon()) {
            this.showMessage('You win!');
            return;
        }

        if (this.isGameOver()) {
            this.showMessage('Game Over!');
        }
    }

    hasWon() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === 2584) {
                    return true;
                }
            }
        }
        return false;
    }

    isGameOver() {
        // Check if there are any empty cells
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === 0) {
                    return false;
                }
            }
        }

        // Check if any adjacent cells can merge
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                // Check right neighbor
                if (j < this.size - 1 && this.canMerge(this.grid[i][j], this.grid[i][j + 1])) {
                    return false;
                }
                // Check bottom neighbor
                if (i < this.size - 1 && this.canMerge(this.grid[i][j], this.grid[i + 1][j])) {
                    return false;
                }
            }
        }

        return true;
    }

    showMessage(message) {
        this.gameMessage.querySelector('p').textContent = message;
        this.gameMessage.classList.remove('hidden');
    }

    restart() {
        this.score = 0;
        this.setupGrid();
        this.gameMessage.classList.add('hidden');
        this.addRandomTile();
        this.addRandomTile();
        this.renderGrid();
    }
}

const game = new Game2048();
