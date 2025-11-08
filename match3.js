const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 8;
const GEM_SIZE = 70;
const COLORS = ['🔴', '🟡', '🟢', '🔵', '🟣', '🟠'];

let grid = [];
let score = 0;
let moves = 30;
let selected = null;

function initGrid() {
    grid = Array(GRID_SIZE).fill().map(() =>
        Array(GRID_SIZE).fill().map(() => Math.floor(Math.random() * COLORS.length))
    );
    while (findMatches().length > 0) {
        grid = Array(GRID_SIZE).fill().map(() =>
            Array(GRID_SIZE).fill().map(() => Math.floor(Math.random() * COLORS.length))
        );
    }
}

function findMatches() {
    const matches = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE - 2; x++) {
            if (grid[y][x] === grid[y][x+1] && grid[y][x] === grid[y][x+2]) {
                if (!matches.some(m => m.x === x && m.y === y)) matches.push({x, y, dir: 'h'});
            }
        }
    }
    for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE - 2; y++) {
            if (grid[y][x] === grid[y+1][x] && grid[y][x] === grid[y+2][x]) {
                if (!matches.some(m => m.x === x && m.y === y)) matches.push({x, y, dir: 'v'});
            }
        }
    }
    return matches;
}

function removeMatches() {
    const matches = findMatches();
    if (matches.length === 0) return false;

    matches.forEach(match => {
        if (match.dir === 'h') {
            for (let i = 0; i < 3; i++) grid[match.y][match.x + i] = -1;
        } else {
            for (let i = 0; i < 3; i++) grid[match.y + i][match.x] = -1;
        }
    });

    score += matches.length * 50;
    document.getElementById('score').textContent = score;

    for (let x = 0; x < GRID_SIZE; x++) {
        let emptySpaces = 0;
        for (let y = GRID_SIZE - 1; y >= 0; y--) {
            if (grid[y][x] === -1) {
                emptySpaces++;
            } else if (emptySpaces > 0) {
                grid[y + emptySpaces][x] = grid[y][x];
                grid[y][x] = -1;
            }
        }
        for (let y = 0; y < emptySpaces; y++) {
            grid[y][x] = Math.floor(Math.random() * COLORS.length);
        }
    }
    return true;
}

function swap(x1, y1, x2, y2) {
    [grid[y1][x1], grid[y2][x2]] = [grid[y2][x2], grid[y1][x1]];
}

canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / GEM_SIZE);
    const y = Math.floor((e.clientY - rect.top) / GEM_SIZE);

    if (!selected) {
        selected = {x, y};
    } else {
        const dx = Math.abs(selected.x - x);
        const dy = Math.abs(selected.y - y);
        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
            swap(selected.x, selected.y, x, y);
            if (!removeMatches()) {
                swap(selected.x, selected.y, x, y);
            } else {
                moves--;
                document.getElementById('moves').textContent = moves;

                if (moves === 0) {
                    setTimeout(() => {
                        alert(`Game Over! Final Score: ${score}`);
                        score = 0;
                        moves = 30;
                        document.getElementById('score').textContent = score;
                        document.getElementById('moves').textContent = moves;
                        initGrid();
                    }, 300);
                } else {
                    setTimeout(() => {
                        while (removeMatches()) {}
                    }, 300);
                }
            }
        }
        selected = null;
    }
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            ctx.fillStyle = '#333';
            ctx.fillRect(x * GEM_SIZE, y * GEM_SIZE, GEM_SIZE - 2, GEM_SIZE - 2);

            ctx.font = '50px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(COLORS[grid[y][x]], x * GEM_SIZE + GEM_SIZE/2, y * GEM_SIZE + GEM_SIZE/2);

            if (selected && selected.x === x && selected.y === y) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 4;
                ctx.strokeRect(x * GEM_SIZE, y * GEM_SIZE, GEM_SIZE - 2, GEM_SIZE - 2);
            }
        }
    }
    requestAnimationFrame(draw);
}

initGrid();
draw();
