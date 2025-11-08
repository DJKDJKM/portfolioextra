const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let level = 1;
let bestScore = localStorage.getItem('simonBest') || 0;
let sequence = [];
let playerSequence = [];
let isPlaying = false;
let canClick = false;

document.getElementById('best').textContent = bestScore;

const buttons = [
    { x: 50, y: 50, width: 175, height: 175, color: '#ff0000', activeColor: '#ff6666', sound: 261.63, id: 0 },
    { x: 275, y: 50, width: 175, height: 175, color: '#00ff00', activeColor: '#66ff66', sound: 329.63, id: 1 },
    { x: 50, y: 275, width: 175, height: 175, color: '#0000ff', activeColor: '#6666ff', sound: 392.00, id: 2 },
    { x: 275, y: 275, width: 175, height: 175, color: '#ffff00', activeColor: '#ffff66', sound: 523.25, id: 3 }
];

let activeButton = -1;
let activeDuration = 0;

const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration = 300) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
}

canvas.addEventListener('click', (e) => {
    if (!canClick) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    buttons.forEach(btn => {
        if (x >= btn.x && x <= btn.x + btn.width &&
            y >= btn.y && y <= btn.y + btn.height) {
            handleButtonClick(btn.id);
        }
    });
});

function handleButtonClick(id) {
    playerSequence.push(id);
    flashButton(id);

    // Check if correct
    const currentIndex = playerSequence.length - 1;
    if (playerSequence[currentIndex] !== sequence[currentIndex]) {
        // Wrong!
        gameOver();
        return;
    }

    // Check if sequence complete
    if (playerSequence.length === sequence.length) {
        canClick = false;
        setTimeout(() => {
            level++;
            document.getElementById('level').textContent = level;
            if (level > bestScore) {
                bestScore = level;
                localStorage.setItem('simonBest', bestScore);
                document.getElementById('best').textContent = bestScore;
            }
            nextRound();
        }, 1000);
    }
}

function flashButton(id, duration = 300) {
    activeButton = id;
    activeDuration = duration;
    playSound(buttons[id].sound, duration);
}

function nextRound() {
    playerSequence = [];
    sequence.push(Math.floor(Math.random() * 4));
    playSequence();
}

async function playSequence() {
    isPlaying = true;
    canClick = false;

    for (let i = 0; i < sequence.length; i++) {
        await sleep(500);
        flashButton(sequence[i], 500);
        await sleep(700);
    }

    isPlaying = false;
    canClick = true;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function gameOver() {
    canClick = false;
    playSound(100, 500);
    setTimeout(() => {
        alert(`Game Over! You reached level ${level}!`);
        level = 1;
        sequence = [];
        playerSequence = [];
        document.getElementById('level').textContent = level;
        setTimeout(() => nextRound(), 500);
    }, 1000);
}

function update() {
    if (activeDuration > 0) {
        activeDuration -= 16;
        if (activeDuration <= 0) {
            activeButton = -1;
        }
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw buttons
    buttons.forEach((btn, i) => {
        ctx.fillStyle = i === activeButton ? btn.activeColor : btn.color;
        ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

        // Border
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 5;
        ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);

        // Shine effect when active
        if (i === activeButton) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
        }
    });

    // Draw center circle
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 80, 0, Math.PI * 2);
    ctx.fill();

    // Draw status text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isPlaying) {
        ctx.fillText('WATCH', canvas.width / 2, canvas.height / 2);
    } else if (canClick) {
        ctx.fillText('YOUR TURN', canvas.width / 2, canvas.height / 2);
    } else {
        ctx.fillText('SIMON', canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = '14px Arial';
        ctx.fillText('SAYS', canvas.width / 2, canvas.height / 2 + 10);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
setTimeout(() => nextRound(), 1000);
