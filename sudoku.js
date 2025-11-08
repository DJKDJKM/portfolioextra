const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CELL_SIZE = 60;
let grid = [];
let solution = [];
let locked = [];
let selectedCell = null;
let timeElapsed = 0;
let timerInterval = null;
let difficulty = 'medium';

function generateSolution() {
    solution = Array(9).fill(null).map(() => Array(9).fill(0));

    // Fill diagonal 3x3 boxes first
    for (let box = 0; box < 9; box += 3) {
        fillBox(box, box);
    }

    // Fill remaining cells
    solveSudoku(solution);
}

function fillBox(row, col) {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    shuffle(numbers);

    let idx = 0;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            solution[row + i][col + j] = numbers[idx++];
        }
    }
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function isValid(board, row, col, num) {
    // Check row
    for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
        if (board[x][col] === num) return false;
    }

    // Check 3x3 box
    const startRow = row - row % 3;
    const startCol = col - col % 3;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i + startRow][j + startCol] === num) return false;
        }
    }

    return true;
}

function solveSudoku(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] === 0) {
                for (let num = 1; num <= 9; num++) {
                    if (isValid(board, row, col, num)) {
                        board[row][col] = num;
                        if (solveSudoku(board)) return true;
                        board[row][col] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

function createPuzzle(diff) {
    generateSolution();

    // Copy solution to grid
    grid = solution.map(row => [...row]);
    locked = Array(9).fill(null).map(() => Array(9).fill(false));

    // Remove numbers based on difficulty
    let cellsToRemove;
    if (diff === 'easy') cellsToRemove = 30;
    else if (diff === 'medium') cellsToRemove = 45;
    else cellsToRemove = 55;

    let removed = 0;
    while (removed < cellsToRemove) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);

        if (grid[row][col] !== 0) {
            grid[row][col] = 0;
            removed++;
        }
    }

    // Lock filled cells
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (grid[row][col] !== 0) {
                locked[row][col] = true;
            }
        }
    }
}

function newGame(diff) {
    difficulty = diff;
    document.getElementById('difficulty').textContent = diff.charAt(0).toUpperCase() + diff.slice(1);

    createPuzzle(diff);
    selectedCell = null;
    timeElapsed = 0;
    document.getElementById('time').textContent = timeElapsed;

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeElapsed++;
        document.getElementById('time').textContent = timeElapsed;
    }, 1000);
}

function selectNumber(num) {
    if (selectedCell && !locked[selectedCell.row][selectedCell.col]) {
        grid[selectedCell.row][selectedCell.col] = num;
        checkWin();
    }
}

function clearSelected() {
    if (selectedCell && !locked[selectedCell.row][selectedCell.col]) {
        grid[selectedCell.row][selectedCell.col] = 0;
    }
}

function checkWin() {
    // Check if all cells filled
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (grid[row][col] === 0) return;
        }
    }

    // Check if solution is correct
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (grid[row][col] !== solution[row][col]) return;
        }
    }

    clearInterval(timerInterval);
    setTimeout(() => {
        alert(`Congratulations! You solved it in ${timeElapsed}s!`);
    }, 100);
}

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    if (row >= 0 && row < 9 && col >= 0 && col < 9) {
        selectedCell = { row, col };
    }
});

function draw() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw cells
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const x = col * CELL_SIZE;
            const y = row * CELL_SIZE;

            // Highlight selected cell
            if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
                ctx.fillStyle = '#bbdefb';
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
            }

            // Highlight same number
            if (selectedCell && grid[row][col] !== 0 &&
                grid[row][col] === grid[selectedCell.row][selectedCell.col]) {
                ctx.fillStyle = '#e3f2fd';
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
            }

            // Highlight errors
            if (grid[row][col] !== 0 && solution[row][col] !== grid[row][col]) {
                ctx.fillStyle = '#ffcdd2';
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
            }

            // Draw number
            if (grid[row][col] !== 0) {
                ctx.fillStyle = locked[row][col] ? '#000' : '#2196f3';
                ctx.font = locked[row][col] ? 'bold 32px Arial' : '32px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(grid[row][col], x + CELL_SIZE / 2, y + CELL_SIZE / 2);
            }
        }
    }

    // Draw grid lines
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 9; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }

    // Draw bold lines for 3x3 boxes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 9; i += 3) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }
}

function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

newGame('medium');
gameLoop();
