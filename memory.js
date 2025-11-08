const symbols = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍉', '🍒', '🥝'];
const cards = [...symbols, ...symbols];
let flipped = [];
let matched = 0;
let moves = 0;

cards.sort(() => Math.random() - 0.5);

const grid = document.getElementById('grid');
cards.forEach((symbol, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.symbol = symbol;
    card.dataset.index = index;
    card.textContent = '?';
    card.addEventListener('click', flipCard);
    grid.appendChild(card);
});

function flipCard() {
    if (flipped.length === 2 || this.classList.contains('matched')) return;

    this.textContent = this.dataset.symbol;
    this.classList.add('flipped');
    flipped.push(this);

    if (flipped.length === 2) {
        moves++;
        document.getElementById('moves').textContent = moves;

        if (flipped[0].dataset.symbol === flipped[1].dataset.symbol) {
            flipped.forEach(card => card.classList.add('matched'));
            matched++;
            document.getElementById('matches').textContent = matched;
            flipped = [];

            if (matched === 8) {
                setTimeout(() => alert(`You won in ${moves} moves!`), 300);
            }
        } else {
            setTimeout(() => {
                flipped.forEach(card => {
                    card.textContent = '?';
                    card.classList.remove('flipped');
                });
                flipped = [];
            }, 1000);
        }
    }
}
