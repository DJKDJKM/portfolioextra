const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CELL_SIZE = canvas.width / 3;

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameOver = false;
let aiMode = false;
let xWins = 0, oWins = 0, draws = 0;

const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]  // Diagonals
];

canvas.addEventListener('click', (e) => {
    if (gameOver || (aiMode && currentPlayer === 'O')) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    const index = row * 3 + col;

    if (board[index] === '') {
        makeMove(index);
    }
});

function makeMove(index) {
    board[index] = currentPlayer;

    const winner = checkWinner();
    if (winner) {
        gameOver = true;
        setTimeout(() => {
            if (winner === 'draw') {
                draws++;
                document.getElementById('draws').textContent = draws;
                alert("It's a draw!");
            } else {
                if (winner === 'X') {
                    xWins++;
                    document.getElementById('xwins').textContent = xWins;
                } else {
                    oWins++;
                    document.getElementById('owins').textContent = oWins;
                }
                alert(`${winner} wins!`);
            }
        }, 100);
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';

        if (aiMode && currentPlayer === 'O') {
            setTimeout(aiMove, 500);
        }
    }
}

function checkWinner() {
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }

    if (board.every(cell => cell !== '')) {
        return 'draw';
    }

    return null;
}

function aiMove() {
    const bestMove = minimax(board, 'O').index;
    if (bestMove !== undefined) {
        makeMove(bestMove);
    }
}

function minimax(newBoard, player) {
    const availSpots = [];
    for (let i = 0; i < 9; i++) {
        if (newBoard[i] === '') availSpots.push(i);
    }

    const winner = checkWinnerForBoard(newBoard);
    if (winner === 'X') return { score: -10 };
    if (winner === 'O') return { score: 10 };
    if (availSpots.length === 0) return { score: 0 };

    const moves = [];

    for (const spot of availSpots) {
        const move = { index: spot };
        newBoard[spot] = player;

        if (player === 'O') {
            const result = minimax(newBoard, 'X');
            move.score = result.score;
        } else {
            const result = minimax(newBoard, 'O');
            move.score = result.score;
        }

        newBoard[spot] = '';
        moves.push(move);
    }

    let bestMove;
    if (player === 'O') {
        let bestScore = -Infinity;
        for (const move of moves) {
            if (move.score > bestScore) {
                bestScore = move.score;
                bestMove = move;
            }
        }
    } else {
        let bestScore = Infinity;
        for (const move of moves) {
            if (move.score < bestScore) {
                bestScore = move.score;
                bestMove = move;
            }
        }
    }

    return bestMove;
}

function checkWinnerForBoard(board) {
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

function draw() {
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 5;

    for (let i = 1; i < 3; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
    }

    // Draw X and O
    for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = col * CELL_SIZE + CELL_SIZE / 2;
        const y = row * CELL_SIZE + CELL_SIZE / 2;

        if (board[i] === 'X') {
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 15;
            ctx.lineCap = 'round';

            const offset = CELL_SIZE / 4;
            ctx.beginPath();
            ctx.moveTo(x - offset, y - offset);
            ctx.lineTo(x + offset, y + offset);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x + offset, y - offset);
            ctx.lineTo(x - offset, y + offset);
            ctx.stroke();
        } else if (board[i] === 'O') {
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 15;
            ctx.beginPath();
            ctx.arc(x, y, CELL_SIZE / 4, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    // Draw winning line
    const winner = checkWinner();
    if (winner && winner !== 'draw') {
        for (const pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                const rowA = Math.floor(a / 3);
                const colA = a % 3;
                const rowC = Math.floor(c / 3);
                const colC = c % 3;

                const x1 = colA * CELL_SIZE + CELL_SIZE / 2;
                const y1 = rowA * CELL_SIZE + CELL_SIZE / 2;
                const x2 = colC * CELL_SIZE + CELL_SIZE / 2;
                const y2 = rowC * CELL_SIZE + CELL_SIZE / 2;

                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 10;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                break;
            }
        }
    }
}

function newGame(useAI) {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameOver = false;
    aiMode = useAI;
}

function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
