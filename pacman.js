const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE = 20;
const ROWS = 31;
const COLS = 28;

let score = 0, lives = 3, level = 1;
let gameOver = false;
let powerMode = false;
let powerTimer = 0;

const maze = [
    "############################",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#*####.#####.##.#####.####*#",
    "#.####.#####.##.#####.####.#",
    "#..........................#",
    "#.####.##.########.##.####.#",
    "#.####.##.########.##.####.#",
    "#......##....##....##......#",
    "######.##### ## #####.######",
    "######.##### ## #####.######",
    "######.##          ##.######",
    "######.## ######## ##.######",
    "######.## #GGGGGG# ##.######",
    "      .   #GGGGGG#   .      ",
    "######.## #GGGGGG# ##.######",
    "######.## ######## ##.######",
    "######.##          ##.######",
    "######.## ######## ##.######",
    "######.## ######## ##.######",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#.####.#####.##.#####.####.#",
    "#*..##.......  .......##..*#",
    "###.##.##.########.##.##.###",
    "###.##.##.########.##.##.###",
    "#......##....##....##......#",
    "#.##########.##.##########.#",
    "#.##########.##.##########.#",
    "#..........................#",
    "############################"
];

const player = {
    x: 14,
    y: 23,
    dir: 0,
    nextDir: 0,
    mouth: 0,
    speed: 0.18,
    targetX: 14,
    targetY: 23
};

const ghosts = [
    { x: 13.5, y: 14.5, dir: 0, color: '#ff0000', speed: 0.12, mode: 'chase', scatter: {x: 25, y: 0} },
    { x: 14.5, y: 14.5, dir: 0, color: '#ffb8ff', speed: 0.12, mode: 'chase', scatter: {x: 2, y: 0} },
    { x: 13.5, y: 15.5, dir: 0, color: '#00ffff', speed: 0.12, mode: 'chase', scatter: {x: 27, y: 30} },
    { x: 14.5, y: 15.5, dir: 0, color: '#ffb852', speed: 0.12, mode: 'chase', scatter: {x: 0, y: 30} }
];

const dots = [];
const powerPellets = [];

function initMaze() {
    dots.length = 0;
    powerPellets.length = 0;

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const char = maze[y][x];
            if (char === '.') {
                dots.push({ x, y });
            } else if (char === '*') {
                powerPellets.push({ x, y });
            }
        }
    }
}

const keys = {};
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowUp') player.nextDir = 0;
    if (e.key === 'ArrowRight') player.nextDir = 1;
    if (e.key === 'ArrowDown') player.nextDir = 2;
    if (e.key === 'ArrowLeft') player.nextDir = 3;
});
document.addEventListener('keyup', e => keys[e.key] = false);

function canMove(x, y) {
    // Check slightly inward from the position to avoid edge cases
    const col = Math.floor(x + 0.5);
    const row = Math.floor(y + 0.5);

    // Allow tunnel wrapping
    if (row < 0 || row >= ROWS) return true;
    if (col < 0 || col >= COLS) return true;

    const char = maze[row][col];
    return char !== '#' && char !== 'G';
}

function movePlayer() {
    const dirs = [
        { dx: 0, dy: -1 },  // Up
        { dx: 1, dy: 0 },   // Right
        { dx: 0, dy: 1 },   // Down
        { dx: -1, dy: 0 }   // Left
    ];

    // Try to change direction if player wants to
    if (player.nextDir !== player.dir) {
        const nextMove = dirs[player.nextDir];
        const testX = player.x + nextMove.dx * player.speed;
        const testY = player.y + nextMove.dy * player.speed;

        if (canMove(testX, testY)) {
            player.dir = player.nextDir;
        }
    }

    // Move in current direction
    const currentMove = dirs[player.dir];
    const newX = player.x + currentMove.dx * player.speed;
    const newY = player.y + currentMove.dy * player.speed;

    if (canMove(newX, newY)) {
        player.x = newX;
        player.y = newY;
    }

    // Wrap around tunnel
    if (player.x < -1) player.x = COLS - 1;
    if (player.x >= COLS) player.x = 0;

    player.mouth = (player.mouth + 0.3) % (Math.PI * 2);
}

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function moveGhost(ghost) {
    const dirs = [
        { dx: 0, dy: -1, dir: 0 },  // Up
        { dx: 1, dy: 0, dir: 1 },   // Right
        { dx: 0, dy: 1, dir: 2 },   // Down
        { dx: -1, dy: 0, dir: 3 }   // Left
    ];

    // Check if at grid center (allow AI decisions)
    const atCenter = Math.abs(ghost.x - Math.round(ghost.x)) < 0.15 &&
                     Math.abs(ghost.y - Math.round(ghost.y)) < 0.15;

    if (atCenter) {
        ghost.x = Math.round(ghost.x);
        ghost.y = Math.round(ghost.y);

        // Determine target based on mode
        let targetX, targetY;

        if (powerMode) {
            // Run away from player
            targetX = ghost.x * 2 - player.x;
            targetY = ghost.y * 2 - player.y;
        } else if (ghost.mode === 'scatter') {
            // Go to scatter corner
            targetX = ghost.scatter.x;
            targetY = ghost.scatter.y;
        } else {
            // Chase player
            targetX = player.x;
            targetY = player.y;
        }

        // Find best direction (don't reverse unless necessary)
        let bestDir = ghost.dir;
        let bestDist = Infinity;
        const oppositeDir = (ghost.dir + 2) % 4;

        dirs.forEach(d => {
            if (d.dir === oppositeDir) return; // Skip opposite direction

            const testX = ghost.x + d.dx * ghost.speed;
            const testY = ghost.y + d.dy * ghost.speed;

            if (canMove(testX, testY)) {
                const dist = getDistance(ghost.x + d.dx, ghost.y + d.dy, targetX, targetY);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestDir = d.dir;
                }
            }
        });

        ghost.dir = bestDir;
    }

    // Move in current direction
    const move = dirs[ghost.dir];
    const newX = ghost.x + move.dx * ghost.speed;
    const newY = ghost.y + move.dy * ghost.speed;

    if (canMove(newX, newY)) {
        ghost.x = newX;
        ghost.y = newY;
    }

    // Wrap around tunnel
    if (ghost.x < -1) ghost.x = COLS - 1;
    if (ghost.x >= COLS) ghost.x = 0;
}

let modeTimer = 0;
let currentMode = 'scatter';

function update() {
    if (gameOver) return;

    movePlayer();

    // Check dot collection
    for (let i = dots.length - 1; i >= 0; i--) {
        const dot = dots[i];
        const dx = Math.abs(player.x - dot.x);
        const dy = Math.abs(player.y - dot.y);
        if (dx < 0.5 && dy < 0.5) {
            dots.splice(i, 1);
            score += 10;
            document.getElementById('score').textContent = score;
        }
    }

    // Check power pellet collection
    for (let i = powerPellets.length - 1; i >= 0; i--) {
        const pellet = powerPellets[i];
        const dx = Math.abs(player.x - pellet.x);
        const dy = Math.abs(player.y - pellet.y);
        if (dx < 0.5 && dy < 0.5) {
            powerPellets.splice(i, 1);
            score += 50;
            powerMode = true;
            powerTimer = 400; // Longer power mode
            document.getElementById('score').textContent = score;
        }
    }

    // Update power mode
    if (powerMode) {
        powerTimer--;
        if (powerTimer <= 0) powerMode = false;
    }

    // Mode switching (scatter/chase)
    modeTimer++;
    if (modeTimer > 400) {
        currentMode = currentMode === 'scatter' ? 'chase' : 'scatter';
        ghosts.forEach(g => g.mode = currentMode);
        modeTimer = 0;
    }

    // Move ghosts
    ghosts.forEach(ghost => {
        moveGhost(ghost);

        // Check collision
        const dx = Math.abs(player.x - ghost.x);
        const dy = Math.abs(player.y - ghost.y);
        if (dx < 0.6 && dy < 0.6) {
            if (powerMode) {
                // Eat ghost
                ghost.x = 13.5 + (ghosts.indexOf(ghost) % 2);
                ghost.y = 14.5 + Math.floor(ghosts.indexOf(ghost) / 2);
                score += 200;
                document.getElementById('score').textContent = score;
            } else {
                // Lose life
                lives--;
                document.getElementById('lives').textContent = lives;
                if (lives <= 0) {
                    gameOver = true;
                    setTimeout(() => {
                        alert(`Game Over! Final Score: ${score}`);
                        location.reload();
                    }, 100);
                } else {
                    // Reset positions
                    player.x = 14;
                    player.y = 23;
                    player.dir = 0;
                    player.nextDir = 0;
                    ghosts.forEach((g, i) => {
                        g.x = 13.5 + (i % 2);
                        g.y = 14.5 + Math.floor(i / 2);
                    });
                    powerMode = false;
                    powerTimer = 0;
                }
            }
        }
    });

    // Level complete
    if (dots.length === 0 && powerPellets.length === 0) {
        level++;
        document.getElementById('level').textContent = level;
        initMaze();
        player.x = 14;
        player.y = 23;
        player.dir = 0;
        player.nextDir = 0;
        ghosts.forEach((g, i) => {
            g.x = 13.5 + (i % 2);
            g.y = 14.5 + Math.floor(i / 2);
            g.speed = Math.min(0.12 + level * 0.01, 0.18); // Gradual speed increase
        });
        powerMode = false;
        powerTimer = 0;
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze
    ctx.strokeStyle = '#2121ff';
    ctx.lineWidth = 3;
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (maze[y][x] === '#') {
                ctx.strokeRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
            }
        }
    }

    // Draw ghost house
    ctx.strokeStyle = '#ff69b4';
    ctx.lineWidth = 2;
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (maze[y][x] === 'G') {
                ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
            }
        }
    }

    // Draw dots
    ctx.fillStyle = '#ffb897';
    dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x * TILE + TILE / 2, dot.y * TILE + TILE / 2, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw power pellets (flashing)
    if (Math.floor(Date.now() / 200) % 2 === 0) {
        ctx.fillStyle = '#ffb897';
        powerPellets.forEach(pellet => {
            ctx.beginPath();
            ctx.arc(pellet.x * TILE + TILE / 2, pellet.y * TILE + TILE / 2, 7, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // Draw player (Pac-Man)
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    const px = player.x * TILE + TILE / 2;
    const py = player.y * TILE + TILE / 2;
    const mouthAngle = Math.abs(Math.sin(player.mouth)) * 0.4;
    const startAngle = player.dir * Math.PI / 2 + mouthAngle;
    const endAngle = player.dir * Math.PI / 2 + Math.PI * 2 - mouthAngle;
    ctx.arc(px, py, TILE / 2 - 1, startAngle, endAngle);
    ctx.lineTo(px, py);
    ctx.fill();

    // Draw ghosts
    ghosts.forEach(ghost => {
        const gx = ghost.x * TILE + TILE / 2;
        const gy = ghost.y * TILE + TILE / 2;

        // Ghost body color
        if (powerMode && powerTimer > 100) {
            ctx.fillStyle = '#0000ff';
        } else if (powerMode) {
            // Flashing when power mode ending
            ctx.fillStyle = Math.floor(Date.now() / 150) % 2 === 0 ? '#0000ff' : '#ffffff';
        } else {
            ctx.fillStyle = ghost.color;
        }

        // Ghost body
        ctx.beginPath();
        ctx.arc(gx, gy - 4, TILE / 2 - 1, Math.PI, 0);
        ctx.lineTo(gx + TILE / 2 - 1, gy + 6);
        ctx.lineTo(gx + TILE / 4, gy);
        ctx.lineTo(gx, gy + 6);
        ctx.lineTo(gx - TILE / 4, gy);
        ctx.lineTo(gx - TILE / 2 + 1, gy + 6);
        ctx.closePath();
        ctx.fill();

        // Eyes (not shown in power mode)
        if (!powerMode) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(gx - 6, gy - 7, 5, 7);
            ctx.fillRect(gx + 1, gy - 7, 5, 7);

            // Pupils look in direction of movement
            const pupilOffsets = [
                {x: 0, y: -2}, // up
                {x: 2, y: 0},  // right
                {x: 0, y: 2},  // down
                {x: -2, y: 0}  // left
            ];
            const offset = pupilOffsets[ghost.dir];
            ctx.fillStyle = '#000';
            ctx.fillRect(gx - 5 + offset.x, gy - 5 + offset.y, 3, 4);
            ctx.fillRect(gx + 2 + offset.x, gy - 5 + offset.y, 3, 4);
        }
    });

    // Draw power mode indicator
    if (powerMode) {
        ctx.fillStyle = powerTimer > 100 ? '#ffff00' : '#ff0000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Power: ${Math.ceil(powerTimer / 60)}s`, canvas.width / 2, 15);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

initMaze();
gameLoop();
