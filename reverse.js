class Game2048 {
    constructor() {
        this.grid = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('bestScoreReverse') || 0;
        this.size = 4;
        this.gameBoard = document.getElementById('game-board');
        this.tileContainer = document.getElementById('tile-container');
        this.scoreElement = document.getElementById('score');
        this.bestElement = document.getElementById('best');
        this.gameMessage = document.getElementById('game-message');

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

        // REVERSED CONTROLS!
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                moved = this.moveRight(); // Reversed!
                break;
            case 'ArrowRight':
                e.preventDefault();
                moved = this.moveLeft(); // Reversed!
                break;
            case 'ArrowUp':
                e.preventDefault();
                moved = this.moveDown(); // Reversed!
                break;
            case 'ArrowDown':
                e.preventDefault();
                moved = this.moveUp(); // Reversed!
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

    moveLeft() {
        let moved = false;
        for (let i = 0; i < this.size; i++) {
            let row = this.grid[i].filter(val => val !== 0);
            let newRow = [];

            for (let j = 0; j < row.length; j++) {
                if (j < row.length - 1 && row[j] === row[j + 1]) {
                    newRow.push(row[j] * 2);
                    this.score += row[j] * 2;
                    j++;
                } else {
                    newRow.push(row[j]);
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

            for (let j = row.length - 1; j >= 0; j--) {
                if (j > 0 && row[j] === row[j - 1]) {
                    newRow.unshift(row[j] * 2);
                    this.score += row[j] * 2;
                    j--;
                } else {
                    newRow.unshift(row[j]);
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
            for (let i = 0; i < column.length; i++) {
                if (i < column.length - 1 && column[i] === column[i + 1]) {
                    newColumn.push(column[i] * 2);
                    this.score += column[i] * 2;
                    i++;
                } else {
                    newColumn.push(column[i]);
                }
            }

            while (newColumn.length < this.size) {
                newColumn.push(0);
            }

            for (let i = 0; i < this.size; i++) {
                if (this.grid[i][j] !== newColumn[i]) {
                    moved = true;
                }
                this.grid[i][j] = newColumn[i];
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
            for (let i = column.length - 1; i >= 0; i--) {
                if (i > 0 && column[i] === column[i - 1]) {
                    newColumn.unshift(column[i] * 2);
                    this.score += column[i] * 2;
                    i--;
                } else {
                    newColumn.unshift(column[i]);
                }
            }

            while (newColumn.length < this.size) {
                newColumn.unshift(0);
            }

            for (let i = 0; i < this.size; i++) {
                if (this.grid[i][j] !== newColumn[i]) {
                    moved = true;
                }
                this.grid[i][j] = newColumn[i];
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
            // Start with HIGHER tiles - 4 or 8 instead of 2 or 4!
            this.grid[randomCell.row][randomCell.col] = Math.random() < 0.7 ? 4 : 8;
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
            localStorage.setItem('bestScoreReverse', this.bestScore);
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
                if (this.grid[i][j] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }

    isGameOver() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === 0) {
                    return false;
                }

                if (j < this.size - 1 && this.grid[i][j] === this.grid[i][j + 1]) {
                    return false;
                }

                if (i < this.size - 1 && this.grid[i][j] === this.grid[i + 1][j]) {
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
