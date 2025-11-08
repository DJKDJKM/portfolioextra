class Game2048 {
    constructor() {
        this.grid = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('bestScoreTime') || 0;
        this.size = 4;
        this.gameBoard = document.getElementById('game-board');
        this.tileContainer = document.getElementById('tile-container');
        this.scoreElement = document.getElementById('score');
        this.bestElement = document.getElementById('best');
        this.timerElement = document.getElementById('timer');
        this.gameMessage = document.getElementById('game-message');
        this.finalScoreElement = document.getElementById('final-score');

        this.timeLimit = 120; // 2 minutes in seconds
        this.timeRemaining = this.timeLimit;
        this.timerInterval = null;
        this.gameStarted = false;

        this.init();
    }

    init() {
        this.setupGrid();
        this.setupEventListeners();
        this.updateScore();
        this.updateTimer();
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
            // Start timer on first move
            if (!this.gameStarted) {
                this.startTimer();
                this.gameStarted = true;
            }

            this.addRandomTile();
            this.renderGrid();
            this.checkGameState();
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeRemaining--;
            this.updateTimer();

            if (this.timeRemaining <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    updateTimer() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Add warning class when time is low
        const timerContainer = this.timerElement.closest('.timer-display');
        if (this.timeRemaining <= 30 && this.timeRemaining > 0) {
            timerContainer.classList.add('warning');
        } else {
            timerContainer.classList.remove('warning');
        }
    }

    endGame() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.showMessage('Time\'s Up!', `Final Score: ${this.score}`);
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
            this.grid[randomCell.row][randomCell.col] = Math.random() < 0.9 ? 2 : 4;
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
            localStorage.setItem('bestScoreTime', this.bestScore);
        }

        this.bestElement.textContent = this.bestScore;
    }

    checkGameState() {
        if (this.hasWon()) {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
            this.showMessage('Amazing!', `Score: ${this.score} | Time: ${120 - this.timeRemaining}s`);
            return;
        }

        if (this.isGameOver()) {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
            }
            this.showMessage('Game Over!', `Final Score: ${this.score}`);
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

    showMessage(message, details = '') {
        this.gameMessage.querySelector('p').textContent = message;
        this.finalScoreElement.textContent = details;
        this.gameMessage.classList.remove('hidden');
    }

    restart() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.score = 0;
        this.timeRemaining = this.timeLimit;
        this.gameStarted = false;
        this.setupGrid();
        this.gameMessage.classList.add('hidden');
        this.updateTimer();
        this.addRandomTile();
        this.addRandomTile();
        this.renderGrid();
    }
}

const game = new Game2048();
