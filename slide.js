const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gridSize = 4;
let tileSize = canvas.width / gridSize;
let tiles = [];
let emptyPos = { x: gridSize - 1, y: gridSize - 1 };
let moves = 0;
let timeElapsed = 0;
let timerInterval = null;
let gameStarted = false;

function initGrid(size) {
    gridSize = size;
    tileSize = canvas.width / gridSize;
    tiles = [];
    moves = 0;
    timeElapsed = 0;
    gameStarted = false;

    document.getElementById('moves').textContent = moves;
    document.getElementById('time').textContent = timeElapsed;

    if (timerInterval) clearInterval(timerInterval);

    // Create ordered tiles
    for (let y = 0; y < gridSize; y++) {
        tiles[y] = [];
        for (let x = 0; x < gridSize; x++) {
            if (x === gridSize - 1 && y === gridSize - 1) {
                tiles[y][x] = null; // Empty tile
            } else {
                tiles[y][x] = y * gridSize + x + 1;
            }
        }
    }

    emptyPos = { x: gridSize - 1, y: gridSize - 1 };

    // Shuffle with valid moves
    shuffleTiles();
}

function shuffleTiles() {
    const moves = gridSize * gridSize * 50;
    for (let i = 0; i < moves; i++) {
        const validMoves = getValidMoves();
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        moveTile(randomMove.x, randomMove.y, false);
    }
}

function getValidMoves() {
    const moves = [];
    const { x, y } = emptyPos;

    if (x > 0) moves.push({ x: x - 1, y });
    if (x < gridSize - 1) moves.push({ x: x + 1, y });
    if (y > 0) moves.push({ x, y: y - 1 });
    if (y < gridSize - 1) moves.push({ x, y: y + 1 });

    return moves;
}

function moveTile(x, y, countMove = true) {
    const dx = Math.abs(x - emptyPos.x);
    const dy = Math.abs(y - emptyPos.y);

    // Check if adjacent to empty tile
    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        // Swap
        tiles[emptyPos.y][emptyPos.x] = tiles[y][x];
        tiles[y][x] = null;
        emptyPos = { x, y };

        if (countMove) {
            if (!gameStarted) {
                gameStarted = true;
                startTimer();
            }

            moves++;
            document.getElementById('moves').textContent = moves;
            checkWin();
        }
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeElapsed++;
        document.getElementById('time').textContent = timeElapsed;
    }, 1000);
}

function checkWin() {
    let expected = 1;
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (x === gridSize - 1 && y === gridSize - 1) {
                // Last tile should be empty
                if (tiles[y][x] !== null) return false;
            } else {
                if (tiles[y][x] !== expected) return false;
                expected++;
            }
        }
    }

    // Won!
    clearInterval(timerInterval);
    setTimeout(() => {
        alert(`You won! Moves: ${moves}, Time: ${timeElapsed}s`);
    }, 100);
    return true;
}

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / tileSize);
    const y = Math.floor((e.clientY - rect.top) / tileSize);

    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        moveTile(x, y);
    }
});

function draw() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const tile = tiles[y][x];

            if (tile !== null) {
                // Tile background
                const gradient = ctx.createLinearGradient(
                    x * tileSize, y * tileSize,
                    (x + 1) * tileSize, (y + 1) * tileSize
                );
                gradient.addColorStop(0, '#4a90e2');
                gradient.addColorStop(1, '#357abd');
                ctx.fillStyle = gradient;
                ctx.fillRect(x * tileSize + 2, y * tileSize + 2, tileSize - 4, tileSize - 4);

                // Tile border
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.strokeRect(x * tileSize + 2, y * tileSize + 2, tileSize - 4, tileSize - 4);

                // Tile number
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${tileSize / 2}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(tile, (x + 0.5) * tileSize, (y + 0.5) * tileSize);

                // Small number showing correct position
                const correctX = (tile - 1) % gridSize;
                const correctY = Math.floor((tile - 1) / gridSize);
                if (x !== correctX || y !== correctY) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.font = `${tileSize / 6}px Arial`;
                    ctx.fillText(`(${tile})`, (x + 0.5) * tileSize, (y + 0.2) * tileSize);
                }
            }
        }
    }

    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * tileSize, 0);
        ctx.lineTo(i * tileSize, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * tileSize);
        ctx.lineTo(canvas.width, i * tileSize);
        ctx.stroke();
    }
}

function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

function newGame(size) {
    initGrid(size);
}

initGrid(4);
gameLoop();
