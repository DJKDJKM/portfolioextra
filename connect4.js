const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ROWS = 6;
const COLS = 7;
const CELL_SIZE = 90;
const MARGIN = 25;

let board = [];
let currentPlayer = 1; // 1 = Red, 2 = Yellow
let gameOver = false;
let aiMode = false;
let animatingDisc = null;

function initBoard() {
    board = [];
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = 0;
        }
    }
    currentPlayer = 1;
    gameOver = false;
    animatingDisc = null;
    updatePlayerDisplay();
}

function updatePlayerDisplay() {
    document.getElementById('player').innerHTML = currentPlayer === 1 ? '🔴 Red' : '🟡 Yellow';
    document.getElementById('player').style.color = currentPlayer === 1 ? '#ef4444' : '#fbbf24';
}

canvas.addEventListener('click', (e) => {
    if (gameOver || animatingDisc || (aiMode && currentPlayer === 2)) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const col = Math.floor((x - MARGIN) / CELL_SIZE);

    if (col >= 0 && col < COLS) {
        dropDisc(col);
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (gameOver || animatingDisc || (aiMode && currentPlayer === 2)) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const col = Math.floor((x - MARGIN) / CELL_SIZE);

    if (col >= 0 && col < COLS) {
        canvas.style.cursor = 'pointer';
    } else {
        canvas.style.cursor = 'default';
    }
});

function dropDisc(col) {
    // Find lowest empty row
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][col] === 0) {
            row = r;
            break;
        }
    }

    if (row === -1) return; // Column full

    // Animate disc falling
    animatingDisc = {
        col,
        targetRow: row,
        y: 0,
        player: currentPlayer,
        speed: 0,
        acceleration: 1
    };
}

function updateAnimation() {
    if (!animatingDisc) return;

    const disc = animatingDisc;
    disc.speed += disc.acceleration;
    disc.y += disc.speed;

    const targetY = MARGIN + disc.targetRow * CELL_SIZE + CELL_SIZE / 2;

    if (disc.y >= targetY) {
        disc.y = targetY;
        board[disc.targetRow][disc.col] = disc.player;
        animatingDisc = null;

        if (checkWin(disc.targetRow, disc.col)) {
            gameOver = true;
            const winner = disc.player === 1 ? 'Red' : 'Yellow';
            setTimeout(() => alert(`${winner} wins!`), 100);
        } else if (isBoardFull()) {
            gameOver = true;
            setTimeout(() => alert("It's a draw!"), 100);
        } else {
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            updatePlayerDisplay();

            if (aiMode && currentPlayer === 2) {
                setTimeout(aiMove, 500);
            }
        }
    }
}

function isBoardFull() {
    for (let col = 0; col < COLS; col++) {
        if (board[0][col] === 0) return false;
    }
    return true;
}

function checkWin(row, col) {
    const player = board[row][col];

    // Check horizontal
    let count = 1;
    for (let c = col - 1; c >= 0 && board[row][c] === player; c--) count++;
    for (let c = col + 1; c < COLS && board[row][c] === player; c++) count++;
    if (count >= 4) return true;

    // Check vertical
    count = 1;
    for (let r = row - 1; r >= 0 && board[r][col] === player; r--) count++;
    for (let r = row + 1; r < ROWS && board[r][col] === player; r++) count++;
    if (count >= 4) return true;

    // Check diagonal /
    count = 1;
    for (let r = row - 1, c = col + 1; r >= 0 && c < COLS && board[r][c] === player; r--, c++) count++;
    for (let r = row + 1, c = col - 1; r < ROWS && c >= 0 && board[r][c] === player; r++, c--) count++;
    if (count >= 4) return true;

    // Check diagonal \
    count = 1;
    for (let r = row - 1, c = col - 1; r >= 0 && c >= 0 && board[r][c] === player; r--, c--) count++;
    for (let r = row + 1, c = col + 1; r < ROWS && c < COLS && board[r][c] === player; r++, c++) count++;
    if (count >= 4) return true;

    return false;
}

function aiMove() {
    if (gameOver || animatingDisc) return;

    // Simple AI: Try to win, block opponent, or random
    let move = -1;

    // Try to win
    for (let col = 0; col < COLS; col++) {
        const row = getLowestEmptyRow(col);
        if (row !== -1) {
            board[row][col] = 2;
            if (checkWin(row, col)) {
                board[row][col] = 0;
                move = col;
                break;
            }
            board[row][col] = 0;
        }
    }

    // Try to block
    if (move === -1) {
        for (let col = 0; col < COLS; col++) {
            const row = getLowestEmptyRow(col);
            if (row !== -1) {
                board[row][col] = 1;
                if (checkWin(row, col)) {
                    board[row][col] = 0;
                    move = col;
                    break;
                }
                board[row][col] = 0;
            }
        }
    }

    // Random move
    if (move === -1) {
        const availableCols = [];
        for (let col = 0; col < COLS; col++) {
            if (board[0][col] === 0) availableCols.push(col);
        }
        if (availableCols.length > 0) {
            move = availableCols[Math.floor(Math.random() * availableCols.length)];
        }
    }

    if (move !== -1) {
        dropDisc(move);
    }
}

function getLowestEmptyRow(col) {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === 0) return row;
    }
    return -1;
}

function draw() {
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw board
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(MARGIN - 10, MARGIN - 10, COLS * CELL_SIZE + 20, ROWS * CELL_SIZE + 20);

    // Draw cells
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const x = MARGIN + col * CELL_SIZE + CELL_SIZE / 2;
            const y = MARGIN + row * CELL_SIZE + CELL_SIZE / 2;

            // Draw slot
            ctx.fillStyle = '#1e3a8a';
            ctx.beginPath();
            ctx.arc(x, y, CELL_SIZE / 2 - 5, 0, Math.PI * 2);
            ctx.fill();

            // Draw disc
            if (board[row][col] !== 0) {
                ctx.fillStyle = board[row][col] === 1 ? '#ef4444' : '#fbbf24';
                ctx.beginPath();
                ctx.arc(x, y, CELL_SIZE / 2 - 10, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = board[row][col] === 1 ? '#dc2626' : '#f59e0b';
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        }
    }

    // Draw animating disc
    if (animatingDisc) {
        const x = MARGIN + animatingDisc.col * CELL_SIZE + CELL_SIZE / 2;
        ctx.fillStyle = animatingDisc.player === 1 ? '#ef4444' : '#fbbf24';
        ctx.beginPath();
        ctx.arc(x, animatingDisc.y, CELL_SIZE / 2 - 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = animatingDisc.player === 1 ? '#dc2626' : '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

function gameLoop() {
    updateAnimation();
    draw();
    requestAnimationFrame(gameLoop);
}

function newGame() {
    aiMode = false;
    initBoard();
}

function playAI() {
    aiMode = true;
    initBoard();
}

initBoard();
gameLoop();
