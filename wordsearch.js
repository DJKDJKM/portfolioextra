const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 12;
const CELL_SIZE = canvas.width / GRID_SIZE;

let grid = [];
let words = [];
let foundWords = [];
let selecting = false;
let selection = { start: null, end: null };

const wordLists = [
    ['JAVASCRIPT', 'PYTHON', 'RUBY', 'JAVA', 'SWIFT', 'RUST', 'GOLANG', 'PHP'],
    ['PIZZA', 'BURGER', 'PASTA', 'SUSHI', 'TACOS', 'CURRY', 'SALAD', 'STEAK'],
    ['SOCCER', 'TENNIS', 'HOCKEY', 'BOXING', 'RACING', 'GOLF', 'RUGBY', 'BASEBALL'],
    ['GUITAR', 'PIANO', 'DRUMS', 'VIOLIN', 'FLUTE', 'SAXOPHONE', 'TRUMPET', 'CELLO']
];

canvas.addEventListener('mousedown', (e) => {
    const pos = getGridPosition(e);
    selection.start = pos;
    selection.end = pos;
    selecting = true;
});

canvas.addEventListener('mousemove', (e) => {
    if (!selecting) return;
    selection.end = getGridPosition(e);
});

canvas.addEventListener('mouseup', () => {
    if (selecting) {
        checkSelection();
        selecting = false;
        selection = { start: null, end: null };
    }
});

function getGridPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    return {
        row: Math.floor(y / CELL_SIZE),
        col: Math.floor(x / CELL_SIZE)
    };
}

function checkSelection() {
    if (!selection.start || !selection.end) return;

    const selectedWord = getSelectedWord();
    if (selectedWord) {
        const word = words.find(w => w.word === selectedWord && !w.found);
        if (word) {
            word.found = true;
            word.cells = getSelectedCells();
            foundWords.push(word);
            updateWordsList();

            if (foundWords.length === words.length) {
                setTimeout(() => alert('Congratulations! You found all words!'), 100);
            }
        }
    }
}

function getSelectedWord() {
    const cells = getSelectedCells();
    if (cells.length < 3) return null;

    return cells.map(cell => grid[cell.row][cell.col]).join('');
}

function getSelectedCells() {
    const cells = [];
    const { start, end } = selection;

    if (!start || !end) return cells;

    const dr = end.row - start.row;
    const dc = end.col - start.col;
    const steps = Math.max(Math.abs(dr), Math.abs(dc));

    if (steps === 0) return cells;

    const rowStep = dr === 0 ? 0 : dr / Math.abs(dr);
    const colStep = dc === 0 ? 0 : dc / Math.abs(dc);

    // Check if selection is straight line (horizontal, vertical, or diagonal)
    // Valid selections: dr === 0 (horizontal), dc === 0 (vertical), or abs(dr) === abs(dc) (diagonal)
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) {
        return cells; // Not a valid straight line
    }

    for (let i = 0; i <= steps; i++) {
        const row = start.row + i * rowStep;
        const col = start.col + i * colStep;
        if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
            cells.push({ row, col });
        }
    }

    return cells;
}

function newGame() {
    const wordList = wordLists[Math.floor(Math.random() * wordLists.length)];
    words = wordList.slice(0, 8).map(w => ({ word: w, found: false, cells: [] }));
    foundWords = [];

    // Initialize empty grid
    grid = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        grid[i] = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            grid[i][j] = '';
        }
    }

    // Place words
    words.forEach(wordObj => {
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 100) {
            const direction = Math.floor(Math.random() * 8);
            const row = Math.floor(Math.random() * GRID_SIZE);
            const col = Math.floor(Math.random() * GRID_SIZE);

            if (tryPlaceWord(wordObj.word, row, col, direction)) {
                placed = true;
            }
            attempts++;
        }
    });

    // Fill empty spaces with random letters
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (grid[i][j] === '') {
                grid[i][j] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            }
        }
    }

    updateWordsList();
}

function tryPlaceWord(word, row, col, direction) {
    const directions = [
        { dr: 0, dc: 1 },   // Right
        { dr: 1, dc: 0 },   // Down
        { dr: 1, dc: 1 },   // Diagonal down-right
        { dr: -1, dc: 1 },  // Diagonal up-right
        { dr: 0, dc: -1 },  // Left
        { dr: -1, dc: 0 },  // Up
        { dr: -1, dc: -1 }, // Diagonal up-left
        { dr: 1, dc: -1 }   // Diagonal down-left
    ];

    const dir = directions[direction];
    const cells = [];

    for (let i = 0; i < word.length; i++) {
        const r = row + i * dir.dr;
        const c = col + i * dir.dc;

        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) {
            return false;
        }

        if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
            return false;
        }

        cells.push({ r, c, letter: word[i] });
    }

    // Place the word
    cells.forEach(cell => {
        grid[cell.r][cell.c] = cell.letter;
    });

    return true;
}

function updateWordsList() {
    const listDiv = document.getElementById('wordsList');
    listDiv.innerHTML = '';

    words.forEach(wordObj => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word' + (wordObj.found ? ' found' : '');
        wordSpan.textContent = wordObj.word;
        listDiv.appendChild(wordSpan);
    });
}

function draw() {
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const x = col * CELL_SIZE;
            const y = row * CELL_SIZE;

            // Check if cell is part of found word
            let isFound = false;
            foundWords.forEach(wordObj => {
                if (wordObj.cells.some(cell => cell.row === row && cell.col === col)) {
                    isFound = true;
                }
            });

            // Check if cell is being selected
            let isSelected = false;
            const selectedCells = getSelectedCells();
            if (selectedCells.some(cell => cell.row === row && cell.col === col)) {
                isSelected = true;
            }

            // Draw cell background
            if (isFound) {
                ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
            } else if (isSelected) {
                ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
            } else {
                ctx.fillStyle = '#374151';
            }
            ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

            // Draw letter
            ctx.fillStyle = isFound ? '#10b981' : '#fff';
            ctx.font = `bold ${CELL_SIZE / 2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(grid[row][col], x + CELL_SIZE / 2, y + CELL_SIZE / 2);
        }
    }

    // Draw grid lines
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    for (let i = 0; i <= GRID_SIZE; i++) {
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

newGame();
gameLoop();
