const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const paddle1 = { x: 20, y: canvas.height/2 - 50, width: 10, height: 100, dy: 0 };
const paddle2 = { x: canvas.width - 30, y: canvas.height/2 - 50, width: 10, height: 100, dy: 0 };
const ball = { x: canvas.width/2, y: canvas.height/2, radius: 8, dx: 5, dy: 5 };
let score1 = 0, score2 = 0;

const keys = {};
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

function update() {
    if (keys['w'] && paddle1.y > 0) paddle1.y -= 6;
    if (keys['s'] && paddle1.y < canvas.height - paddle1.height) paddle1.y += 6;
    if (keys['ArrowUp'] && paddle2.y > 0) paddle2.y -= 6;
    if (keys['ArrowDown'] && paddle2.y < canvas.height - paddle2.height) paddle2.y += 6;

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) ball.dy = -ball.dy;

    if (ball.x - ball.radius < paddle1.x + paddle1.width &&
        ball.y > paddle1.y && ball.y < paddle1.y + paddle1.height) {
        ball.dx = Math.abs(ball.dx);
        ball.dy += (ball.y - (paddle1.y + paddle1.height/2)) * 0.1;
    }

    if (ball.x + ball.radius > paddle2.x &&
        ball.y > paddle2.y && ball.y < paddle2.y + paddle2.height) {
        ball.dx = -Math.abs(ball.dx);
        ball.dy += (ball.y - (paddle2.y + paddle2.height/2)) * 0.1;
    }

    if (ball.x < 0) {
        score2++;
        document.getElementById('score2').textContent = score2;
        resetBall();
    }
    if (ball.x > canvas.width) {
        score1++;
        document.getElementById('score1').textContent = score1;
        resetBall();
    }
}

function resetBall() {
    ball.x = canvas.width/2;
    ball.y = canvas.height/2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
    ball.dy = (Math.random() - 0.5) * 8;
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#00ff00';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width/2, 0);
    ctx.lineTo(canvas.width/2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#00ff00';
    ctx.fillRect(paddle1.x, paddle1.y, paddle1.width, paddle1.height);
    ctx.fillRect(paddle2.x, paddle2.y, paddle2.width, paddle2.height);

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
