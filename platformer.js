const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let totalCoins = 0;
let lives = 5;
let invincible = false;
let invincibleTimer = 0;
let currentDimension = 1;

const player = {
    x: 50,
    y: 250,
    width: 30,
    height: 30,
    vx: 0,
    vy: 0,
    jumping: false,
    doubleJump: true,
    doubleJumpUsed: false
};

const gravity = 0.4;
const jumpPower = -13;
const speed = 6;

// 20 Dimensions with unique themes and challenges
const dimensions = [
    {
        name: "🌟 Starter Dimension",
        theme: { sky1: '#87CEEB', sky2: '#E0F6FF', platform: '#8B4513', grass: '#228B22' },
        platforms: [
            { x: 0, y: 350, width: 300, height: 50 },
            { x: 350, y: 300, width: 150, height: 50 },
            { x: 550, y: 250, width: 100, height: 50 },
            { x: 700, y: 300, width: 100, height: 50 }
        ],
        coins: [{ x: 420, y: 230 }, { x: 600, y: 180 }, { x: 750, y: 230 }],
        enemies: [],
        spikes: [],
        powerups: [{ x: 600, y: 200, type: 'doubleJump', collected: false }],
        goal: { x: 750, y: 250, width: 40, height: 50 }
    },
    {
        name: "🔥 Lava World",
        theme: { sky1: '#FF4500', sky2: '#FF8C00', platform: '#8B0000', grass: '#FF6347' },
        platforms: [
            { x: 0, y: 350, width: 180, height: 50 },
            { x: 190, y: 300, width: 130, height: 50 },
            { x: 330, y: 260, width: 120, height: 50 },
            { x: 460, y: 300, width: 130, height: 50 },
            { x: 600, y: 250, width: 200, height: 50 }
        ],
        coins: [{ x: 250, y: 230 }, { x: 390, y: 190 }, { x: 520, y: 230 }, { x: 700, y: 180 }],
        enemies: [],
        spikes: [],
        powerups: [],
        goal: { x: 750, y: 200, width: 40, height: 50 }
    },
    {
        name: "❄️ Ice Dimension",
        theme: { sky1: '#B0E0E6', sky2: '#E6F7FF', platform: '#4682B4', grass: '#87CEEB' },
        platforms: [
            { x: 0, y: 350, width: 200, height: 50 },
            { x: 250, y: 280, width: 90, height: 30, moving: true, vx: 2, range: { min: 230, max: 360 } },
            { x: 450, y: 250, width: 100, height: 50 },
            { x: 600, y: 180, width: 90, height: 30, moving: true, vx: -2, range: { min: 560, max: 680 } }
        ],
        coins: [{ x: 300, y: 210 }, { x: 500, y: 180 }, { x: 640, y: 110 }],
        enemies: [],
        spikes: [],
        powerups: [{ x: 500, y: 200, type: 'invincible', collected: false }],
        goal: { x: 640, y: 130, width: 40, height: 50 }
    },
    {
        name: "🌲 Forest Realm",
        theme: { sky1: '#228B22', sky2: '#90EE90', platform: '#654321', grass: '#00FF00' },
        platforms: [
            { x: 0, y: 350, width: 200, height: 50 },
            { x: 210, y: 300, width: 140, height: 50 },
            { x: 360, y: 260, width: 140, height: 50 },
            { x: 510, y: 300, width: 140, height: 50 },
            { x: 660, y: 260, width: 140, height: 50 }
        ],
        coins: [{ x: 280, y: 230 }, { x: 430, y: 190 }, { x: 580, y: 230 }, { x: 730, y: 190 }],
        enemies: [],
        spikes: [],
        powerups: [],
        goal: { x: 750, y: 210, width: 40, height: 50 }
    },
    {
        name: "🌙 Night Sky",
        theme: { sky1: '#191970', sky2: '#483D8B', platform: '#2F4F4F', grass: '#4B0082' },
        platforms: [
            { x: 0, y: 350, width: 150, height: 50 },
            { x: 200, y: 280, width: 80, height: 30, moving: true, vy: 1.5, range: { min: 240, max: 320 } },
            { x: 330, y: 250, width: 80, height: 50 },
            { x: 460, y: 180, width: 80, height: 30, moving: true, vy: -1.5, range: { min: 140, max: 220 } },
            { x: 590, y: 200, width: 100, height: 50 },
            { x: 720, y: 150, width: 80, height: 50 }
        ],
        coins: [{ x: 240, y: 210 }, { x: 380, y: 180 }, { x: 500, y: 110 }, { x: 640, y: 130 }, { x: 760, y: 80 }],
        enemies: [],
        spikes: [{ x: 410, y: 365, width: 50, height: 15 }],
        powerups: [{ x: 380, y: 200, type: 'doubleJump', collected: false }],
        goal: { x: 760, y: 100, width: 40, height: 50 }
    },
    {
        name: "⚡ Thunder Zone",
        theme: { sky1: '#4B0082', sky2: '#8B00FF', platform: '#483D8B', grass: '#9370DB' },
        platforms: [
            { x: 0, y: 350, width: 200, height: 50 },
            { x: 250, y: 280, width: 100, height: 50 },
            { x: 400, y: 220, width: 80, height: 50 },
            { x: 530, y: 280, width: 100, height: 50 },
            { x: 680, y: 200, width: 120, height: 50 }
        ],
        coins: [{ x: 300, y: 210 }, { x: 440, y: 150 }, { x: 580, y: 210 }, { x: 730, y: 130 }],
        enemies: [
            { x: 270, y: 250, width: 25, height: 25, vx: 2, range: { min: 250, max: 330 } },
            { x: 550, y: 250, width: 25, height: 25, vx: -2, range: { min: 530, max: 610 } }
        ],
        spikes: [{ x: 350, y: 365, width: 50, height: 15 }, { x: 480, y: 365, width: 50, height: 15 }],
        powerups: [],
        goal: { x: 750, y: 150, width: 40, height: 50 }
    },
    {
        name: "🏜️ Desert Sands",
        theme: { sky1: '#FFD700', sky2: '#FFA500', platform: '#D2691E', grass: '#DEB887' },
        platforms: [
            { x: 0, y: 350, width: 180, height: 50 },
            { x: 230, y: 300, width: 90, height: 50 },
            { x: 370, y: 260, width: 90, height: 50 },
            { x: 510, y: 220, width: 90, height: 50 },
            { x: 650, y: 180, width: 150, height: 50 }
        ],
        coins: [{ x: 280, y: 230 }, { x: 420, y: 190 }, { x: 560, y: 150 }, { x: 720, y: 110 }],
        enemies: [{ x: 250, y: 270, width: 25, height: 25, vx: 1.5, range: { min: 230, max: 300 } }],
        spikes: [],
        powerups: [{ x: 560, y: 170, type: 'invincible', collected: false }],
        goal: { x: 750, y: 130, width: 40, height: 50 }
    },
    {
        name: "🌊 Ocean Depths",
        theme: { sky1: '#00CED1', sky2: '#20B2AA', platform: '#008B8B', grass: '#00FFFF' },
        platforms: [
            { x: 0, y: 350, width: 150, height: 50 },
            { x: 200, y: 280, width: 100, height: 30, moving: true, vx: 1.5, range: { min: 180, max: 320 } },
            { x: 370, y: 240, width: 100, height: 50 },
            { x: 520, y: 280, width: 100, height: 30, moving: true, vx: -1.5, range: { min: 480, max: 620 } },
            { x: 680, y: 200, width: 120, height: 50 }
        ],
        coins: [{ x: 250, y: 210 }, { x: 420, y: 170 }, { x: 570, y: 210 }, { x: 730, y: 130 }],
        enemies: [],
        spikes: [{ x: 320, y: 365, width: 50, height: 15 }],
        powerups: [{ x: 420, y: 190, type: 'doubleJump', collected: false }],
        goal: { x: 750, y: 150, width: 40, height: 50 }
    },
    {
        name: "🌋 Volcano Core",
        theme: { sky1: '#8B0000', sky2: '#DC143C', platform: '#2F0000', grass: '#FF0000' },
        platforms: [
            { x: 0, y: 350, width: 150, height: 50 },
            { x: 200, y: 290, width: 80, height: 50 },
            { x: 330, y: 240, width: 80, height: 50 },
            { x: 460, y: 290, width: 80, height: 50 },
            { x: 590, y: 240, width: 80, height: 50 },
            { x: 720, y: 190, width: 80, height: 50 }
        ],
        coins: [{ x: 240, y: 220 }, { x: 370, y: 170 }, { x: 500, y: 220 }, { x: 630, y: 170 }, { x: 760, y: 120 }],
        enemies: [
            { x: 220, y: 260, width: 25, height: 25, vx: 1.8, range: { min: 200, max: 260 } },
            { x: 480, y: 260, width: 25, height: 25, vx: -1.8, range: { min: 460, max: 520 } }
        ],
        spikes: [{ x: 280, y: 365, width: 50, height: 15 }, { x: 410, y: 365, width: 50, height: 15 }, { x: 540, y: 365, width: 50, height: 15 }],
        powerups: [],
        goal: { x: 760, y: 140, width: 40, height: 50 }
    },
    {
        name: "☁️ Cloud Kingdom",
        theme: { sky1: '#87CEEB', sky2: '#B0E0E6', platform: '#F0F8FF', grass: '#E6E6FA' },
        platforms: [
            { x: 0, y: 350, width: 180, height: 50 },
            { x: 230, y: 270, width: 100, height: 30, moving: true, vy: 2, range: { min: 220, max: 310 } },
            { x: 380, y: 220, width: 100, height: 50 },
            { x: 530, y: 270, width: 100, height: 30, moving: true, vy: -2, range: { min: 220, max: 310 } },
            { x: 680, y: 180, width: 120, height: 50 }
        ],
        coins: [{ x: 280, y: 200 }, { x: 430, y: 150 }, { x: 580, y: 200 }, { x: 730, y: 110 }],
        enemies: [],
        spikes: [],
        powerups: [{ x: 430, y: 170, type: 'invincible', collected: false }],
        goal: { x: 750, y: 130, width: 40, height: 50 }
    },
    {
        name: "🌸 Sakura Garden",
        theme: { sky1: '#FFB6C1', sky2: '#FFC0CB', platform: '#8B4513', grass: '#FF69B4' },
        platforms: [
            { x: 0, y: 350, width: 200, height: 50 },
            { x: 250, y: 290, width: 100, height: 50 },
            { x: 400, y: 240, width: 100, height: 50 },
            { x: 550, y: 290, width: 100, height: 50 },
            { x: 700, y: 230, width: 100, height: 50 }
        ],
        coins: [{ x: 300, y: 220 }, { x: 450, y: 170 }, { x: 600, y: 220 }, { x: 750, y: 160 }],
        enemies: [{ x: 270, y: 260, width: 25, height: 25, vx: 1.5, range: { min: 250, max: 330 } }],
        spikes: [],
        powerups: [{ x: 450, y: 190, type: 'doubleJump', collected: false }],
        goal: { x: 750, y: 180, width: 40, height: 50 }
    },
    {
        name: "🪐 Space Station",
        theme: { sky1: '#000428', sky2: '#004e92', platform: '#708090', grass: '#778899' },
        platforms: [
            { x: 0, y: 350, width: 150, height: 50 },
            { x: 200, y: 280, width: 90, height: 30, moving: true, vx: 2, range: { min: 180, max: 330 } },
            { x: 380, y: 230, width: 80, height: 50 },
            { x: 510, y: 180, width: 90, height: 30, moving: true, vx: -2, range: { min: 470, max: 600 } },
            { x: 660, y: 250, width: 140, height: 50 }
        ],
        coins: [{ x: 250, y: 210 }, { x: 420, y: 160 }, { x: 560, y: 110 }, { x: 730, y: 180 }],
        enemies: [],
        spikes: [{ x: 330, y: 365, width: 50, height: 15 }],
        powerups: [],
        goal: { x: 750, y: 200, width: 40, height: 50 }
    },
    {
        name: "🎃 Haunted Graveyard",
        theme: { sky1: '#2C003E', sky2: '#4A0E4E', platform: '#3D2817', grass: '#5A3E2B' },
        platforms: [
            { x: 0, y: 350, width: 170, height: 50 },
            { x: 220, y: 300, width: 100, height: 50 },
            { x: 370, y: 250, width: 100, height: 50 },
            { x: 520, y: 300, width: 100, height: 50 },
            { x: 670, y: 240, width: 130, height: 50 }
        ],
        coins: [{ x: 270, y: 230 }, { x: 420, y: 180 }, { x: 570, y: 230 }, { x: 730, y: 170 }],
        enemies: [
            { x: 240, y: 270, width: 25, height: 25, vx: 1.8, range: { min: 220, max: 300 } },
            { x: 540, y: 270, width: 25, height: 25, vx: -1.8, range: { min: 520, max: 600 } }
        ],
        spikes: [{ x: 320, y: 365, width: 50, height: 15 }, { x: 470, y: 365, width: 50, height: 15 }],
        powerups: [{ x: 420, y: 200, type: 'invincible', collected: false }],
        goal: { x: 750, y: 190, width: 40, height: 50 }
    },
    {
        name: "🌈 Rainbow Bridge",
        theme: { sky1: '#FF1493', sky2: '#FFD700', platform: '#FF6347', grass: '#00CED1' },
        platforms: [
            { x: 0, y: 350, width: 180, height: 50 },
            { x: 230, y: 280, width: 90, height: 30, moving: true, vy: 2, range: { min: 230, max: 320 } },
            { x: 370, y: 250, width: 100, height: 50 },
            { x: 520, y: 280, width: 90, height: 30, moving: true, vy: -2, range: { min: 230, max: 320 } },
            { x: 660, y: 210, width: 140, height: 50 }
        ],
        coins: [{ x: 280, y: 210 }, { x: 420, y: 180 }, { x: 570, y: 210 }, { x: 730, y: 140 }],
        enemies: [],
        spikes: [],
        powerups: [{ x: 420, y: 200, type: 'doubleJump', collected: false }],
        goal: { x: 750, y: 160, width: 40, height: 50 }
    },
    {
        name: "⚔️ Castle Ruins",
        theme: { sky1: '#696969', sky2: '#A9A9A9', platform: '#696969', grass: '#808080' },
        platforms: [
            { x: 0, y: 350, width: 150, height: 50 },
            { x: 200, y: 290, width: 100, height: 50 },
            { x: 350, y: 230, width: 100, height: 50 },
            { x: 500, y: 290, width: 100, height: 50 },
            { x: 650, y: 230, width: 100, height: 50 }
        ],
        coins: [{ x: 250, y: 220 }, { x: 400, y: 160 }, { x: 550, y: 220 }, { x: 700, y: 160 }],
        enemies: [
            { x: 220, y: 260, width: 25, height: 25, vx: 2, range: { min: 200, max: 280 } },
            { x: 520, y: 260, width: 25, height: 25, vx: -2, range: { min: 500, max: 580 } }
        ],
        spikes: [{ x: 300, y: 365, width: 50, height: 15 }, { x: 450, y: 365, width: 50, height: 15 }, { x: 600, y: 365, width: 50, height: 15 }],
        powerups: [],
        goal: { x: 700, y: 180, width: 40, height: 50 }
    },
    {
        name: "🍄 Mushroom Forest",
        theme: { sky1: '#9370DB', sky2: '#DDA0DD', platform: '#8B4513', grass: '#FF1493' },
        platforms: [
            { x: 0, y: 350, width: 200, height: 50 },
            { x: 250, y: 280, width: 100, height: 30, moving: true, vx: 1.5, range: { min: 230, max: 370 } },
            { x: 420, y: 240, width: 100, height: 50 },
            { x: 570, y: 280, width: 100, height: 30, moving: true, vx: -1.5, range: { min: 530, max: 670 } },
            { x: 720, y: 200, width: 80, height: 50 }
        ],
        coins: [{ x: 300, y: 210 }, { x: 470, y: 170 }, { x: 620, y: 210 }, { x: 760, y: 130 }],
        enemies: [],
        spikes: [],
        powerups: [{ x: 470, y: 190, type: 'invincible', collected: false }],
        goal: { x: 760, y: 150, width: 40, height: 50 }
    },
    {
        name: "🔮 Crystal Cavern",
        theme: { sky1: '#4B0082', sky2: '#8A2BE2', platform: '#483D8B', grass: '#9932CC' },
        platforms: [
            { x: 0, y: 350, width: 160, height: 50 },
            { x: 210, y: 290, width: 90, height: 50 },
            { x: 350, y: 240, width: 90, height: 50 },
            { x: 490, y: 190, width: 90, height: 50 },
            { x: 630, y: 240, width: 90, height: 50 },
            { x: 750, y: 180, width: 50, height: 50 }
        ],
        coins: [{ x: 260, y: 220 }, { x: 400, y: 170 }, { x: 540, y: 120 }, { x: 680, y: 170 }],
        enemies: [{ x: 230, y: 260, width: 25, height: 25, vx: 1.5, range: { min: 210, max: 280 } }],
        spikes: [{ x: 300, y: 365, width: 50, height: 15 }, { x: 440, y: 365, width: 50, height: 15 }],
        powerups: [{ x: 540, y: 140, type: 'doubleJump', collected: false }],
        goal: { x: 775, y: 130, width: 40, height: 50 }
    },
    {
        name: "🏔️ Snowy Peaks",
        theme: { sky1: '#E0FFFF', sky2: '#F0FFFF', platform: '#FFFFFF', grass: '#B0E0E6' },
        platforms: [
            { x: 0, y: 350, width: 170, height: 50 },
            { x: 220, y: 290, width: 100, height: 30, moving: true, vy: 1.5, range: { min: 250, max: 330 } },
            { x: 370, y: 250, width: 100, height: 50 },
            { x: 520, y: 190, width: 100, height: 30, moving: true, vy: -1.5, range: { min: 150, max: 230 } },
            { x: 670, y: 220, width: 130, height: 50 }
        ],
        coins: [{ x: 270, y: 220 }, { x: 420, y: 180 }, { x: 570, y: 120 }, { x: 730, y: 150 }],
        enemies: [],
        spikes: [],
        powerups: [{ x: 420, y: 200, type: 'invincible', collected: false }],
        goal: { x: 750, y: 170, width: 40, height: 50 }
    },
    {
        name: "🎆 Neon City",
        theme: { sky1: '#FF00FF', sky2: '#00FFFF', platform: '#FF1493', grass: '#00FF00' },
        platforms: [
            { x: 0, y: 350, width: 150, height: 50 },
            { x: 200, y: 280, width: 90, height: 50 },
            { x: 340, y: 220, width: 90, height: 50 },
            { x: 480, y: 280, width: 90, height: 50 },
            { x: 620, y: 220, width: 90, height: 50 },
            { x: 740, y: 160, width: 60, height: 50 }
        ],
        coins: [{ x: 245, y: 210 }, { x: 385, y: 150 }, { x: 525, y: 210 }, { x: 665, y: 150 }, { x: 770, y: 90 }],
        enemies: [
            { x: 220, y: 250, width: 25, height: 25, vx: 2, range: { min: 200, max: 270 } },
            { x: 500, y: 250, width: 25, height: 25, vx: -2, range: { min: 480, max: 550 } }
        ],
        spikes: [{ x: 290, y: 365, width: 50, height: 15 }, { x: 430, y: 365, width: 50, height: 15 }, { x: 570, y: 365, width: 50, height: 15 }],
        powerups: [],
        goal: { x: 770, y: 110, width: 40, height: 50 }
    },
    {
        name: "🏆 Final Dimension",
        theme: { sky1: '#FFD700', sky2: '#FFA500', platform: '#DAA520', grass: '#FF8C00' },
        platforms: [
            { x: 0, y: 350, width: 140, height: 50 },
            { x: 190, y: 290, width: 80, height: 30, moving: true, vx: 2, range: { min: 170, max: 280 } },
            { x: 320, y: 240, width: 80, height: 50 },
            { x: 450, y: 190, width: 80, height: 30, moving: true, vy: 2, range: { min: 150, max: 230 } },
            { x: 580, y: 240, width: 80, height: 50 },
            { x: 710, y: 180, width: 90, height: 50 }
        ],
        coins: [{ x: 235, y: 220 }, { x: 370, y: 170 }, { x: 500, y: 120 }, { x: 630, y: 170 }, { x: 755, y: 110 }],
        enemies: [
            { x: 210, y: 260, width: 25, height: 25, vx: 2, range: { min: 190, max: 260 } },
            { x: 470, y: 160, width: 25, height: 25, vx: 2, range: { min: 450, max: 510 } }
        ],
        spikes: [{ x: 270, y: 365, width: 50, height: 15 }, { x: 400, y: 365, width: 50, height: 15 }, { x: 530, y: 365, width: 50, height: 15 }],
        powerups: [{ x: 500, y: 140, type: 'doubleJump', collected: false }],
        goal: { x: 755, y: 130, width: 40, height: 50 }
    }
];

let platforms = [];
let coinsList = [];
let enemies = [];
let spikes = [];
let powerups = [];
let goal = {};

function loadDimension(dimNum) {
    if (dimNum < 1 || dimNum > 20) {
        alert('🎉 CONGRATULATIONS! You completed all 20 dimensions!\nTotal Coins: ' + totalCoins);
        currentDimension = 1;
        dimNum = 1;
    }

    currentDimension = dimNum;
    const dim = dimensions[dimNum - 1];

    platforms = JSON.parse(JSON.stringify(dim.platforms));
    coinsList = dim.coins.map(c => ({ ...c, collected: false }));
    enemies = JSON.parse(JSON.stringify(dim.enemies));
    spikes = JSON.parse(JSON.stringify(dim.spikes));
    powerups = dim.powerups.map(p => ({ ...p, collected: false }));
    goal = { ...dim.goal };

    player.x = 50;
    player.y = 250;
    player.vx = 0;
    player.vy = 0;
    player.jumping = false;
    player.doubleJump = true;
    player.doubleJumpUsed = false;
    invincible = false;
    invincibleTimer = 0;

    document.getElementById('dimension').textContent = `${currentDimension}/20`;
    document.getElementById('coins').textContent = totalCoins;
    document.getElementById('lives').textContent = lives;
}

const keys = {};
document.addEventListener('keydown', e => {
    keys[e.key] = true;

    // Double jump
    if ((e.key === ' ' || e.key === 'ArrowUp') && player.doubleJump && !player.doubleJumpUsed && player.jumping) {
        e.preventDefault();
        player.vy = jumpPower;
        player.doubleJumpUsed = true;
    }
});
document.addEventListener('keyup', e => keys[e.key] = false);

function update() {
    // Player movement
    if (keys['ArrowLeft']) player.vx = -speed;
    else if (keys['ArrowRight']) player.vx = speed;
    else player.vx = 0;

    if ((keys['ArrowUp'] || keys[' ']) && !player.jumping) {
        player.vy = jumpPower;
        player.jumping = true;
    }

    player.vy += gravity;
    player.x += player.vx;
    player.y += player.vy;

    // Death by falling
    if (player.y > canvas.height) {
        loseLife();
    }

    // Platform collision
    player.jumping = true;
    platforms.forEach(plat => {
        if (player.x + player.width > plat.x &&
            player.x < plat.x + plat.width &&
            player.y + player.height > plat.y &&
            player.y + player.height < plat.y + 20 &&
            player.vy > 0) {
            player.y = plat.y - player.height;
            player.vy = 0;
            player.jumping = false;
            player.doubleJumpUsed = false;
        }
    });

    // Update moving platforms
    platforms.forEach(plat => {
        if (plat.moving) {
            if (plat.vx) {
                plat.x += plat.vx;
                if (plat.x <= plat.range.min || plat.x >= plat.range.max) {
                    plat.vx = -plat.vx;
                }
            }
            if (plat.vy) {
                plat.y += plat.vy;
                if (plat.y <= plat.range.min || plat.y >= plat.range.max) {
                    plat.vy = -plat.vy;
                }
            }
        }
    });

    // Coin collection
    coinsList.forEach(coin => {
        if (!coin.collected) {
            const dx = player.x + player.width/2 - coin.x;
            const dy = player.y + player.height/2 - coin.y;
            if (Math.sqrt(dx*dx + dy*dy) < 20) {
                coin.collected = true;
                totalCoins++;
                document.getElementById('coins').textContent = totalCoins;
            }
        }
    });

    // Powerup collection
    powerups.forEach(p => {
        if (!p.collected) {
            const dx = Math.abs(player.x + player.width/2 - p.x);
            const dy = Math.abs(player.y + player.height/2 - p.y);
            if (dx < 20 && dy < 20) {
                p.collected = true;
                if (p.type === 'doubleJump') {
                    player.doubleJump = true;
                } else if (p.type === 'invincible') {
                    invincible = true;
                    invincibleTimer = 300;
                }
            }
        }
    });

    // Update invincibility
    if (invincibleTimer > 0) {
        invincibleTimer--;
        if (invincibleTimer === 0) {
            invincible = false;
        }
    }

    // Enemy movement and collision
    enemies.forEach(enemy => {
        enemy.x += enemy.vx;
        if (enemy.x <= enemy.range.min || enemy.x >= enemy.range.max) {
            enemy.vx = -enemy.vx;
        }

        if (!invincible &&
            player.x + player.width > enemy.x &&
            player.x < enemy.x + enemy.width &&
            player.y + player.height > enemy.y &&
            player.y < enemy.y + enemy.height) {
            loseLife();
        }
    });

    // Spike collision
    if (!invincible) {
        spikes.forEach(spike => {
            if (player.x + player.width > spike.x &&
                player.x < spike.x + spike.width &&
                player.y + player.height > spike.y &&
                player.y + player.height < spike.y + spike.height) {
                loseLife();
            }
        });
    }

    // Goal reached
    if (player.x + player.width > goal.x &&
        player.x < goal.x + goal.width &&
        player.y + player.height > goal.y &&
        player.y < goal.y + goal.height) {
        setTimeout(() => loadDimension(currentDimension + 1), 100);
    }
}

function loseLife() {
    lives--;
    document.getElementById('lives').textContent = lives;

    if (lives <= 0) {
        alert('Game Over! You reached Dimension ' + currentDimension + '\nTotal Coins: ' + totalCoins);
        currentDimension = 1;
        totalCoins = 0;
        lives = 5;
        loadDimension(1);
    } else {
        player.x = 50;
        player.y = 250;
        player.vx = 0;
        player.vy = 0;
        invincible = true;
        invincibleTimer = 180;
    }
}

function draw() {
    const dim = dimensions[currentDimension - 1];

    // Sky background with theme
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, dim.theme.sky1);
    gradient.addColorStop(1, dim.theme.sky2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Platforms
    platforms.forEach(plat => {
        ctx.fillStyle = dim.theme.platform;
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = dim.theme.grass;
        ctx.fillRect(plat.x, plat.y, plat.width, 5);

        if (plat.moving) {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(plat.x, plat.y + plat.height - 5, plat.width, 5);
        }
    });

    // Spikes
    spikes.forEach(spike => {
        ctx.fillStyle = '#DC143C';
        const numSpikes = Math.floor(spike.width / 10);
        for (let i = 0; i < numSpikes; i++) {
            ctx.beginPath();
            ctx.moveTo(spike.x + i * 10, spike.y + spike.height);
            ctx.lineTo(spike.x + i * 10 + 5, spike.y);
            ctx.lineTo(spike.x + i * 10 + 10, spike.y + spike.height);
            ctx.closePath();
            ctx.fill();
        }
    });

    // Coins
    coinsList.forEach(coin => {
        if (!coin.collected) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(coin.x, coin.y, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });

    // Powerups
    powerups.forEach(p => {
        if (!p.collected) {
            let color, symbol;
            if (p.type === 'doubleJump') {
                color = '#00BFFF';
                symbol = '⬆⬆';
            } else if (p.type === 'invincible') {
                color = '#FFD700';
                symbol = '⭐';
            }

            ctx.fillStyle = color;
            ctx.fillRect(p.x - 15, p.y - 15, 30, 30);
            ctx.fillStyle = '#FFF';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(symbol, p.x, p.y);
        }
    });

    // Enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = '#8B008B';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(enemy.x + 5, enemy.y + 5, 5, 5);
        ctx.fillRect(enemy.x + 15, enemy.y + 5, 5, 5);
    });

    // Goal flag
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
    ctx.fillStyle = '#FFF';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏁', goal.x + 20, goal.y + 30);

    // Player
    if (!invincible || Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.fillStyle = '#000';
        ctx.fillRect(player.x + 8, player.y + 8, 5, 5);
        ctx.fillRect(player.x + 17, player.y + 8, 5, 5);

        if (player.doubleJump && !player.doubleJumpUsed && player.jumping) {
            ctx.fillStyle = '#00BFFF';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⬆', player.x + 15, player.y - 5);
        }
    }

    // Dimension name
    ctx.fillStyle = '#000';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(dim.name, canvas.width / 2, 25);

    // Power-up status
    if (player.doubleJump) {
        ctx.fillStyle = '#00BFFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('⬆⬆ Double Jump', 10, canvas.height - 10);
    }
    if (invincible) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('⭐ Invincible: ' + Math.ceil(invincibleTimer / 60) + 's', canvas.width - 10, canvas.height - 10);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

loadDimension(1);
gameLoop();
