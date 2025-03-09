const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game objects
const adam = {
    x: 100,
    y: 500,
    width: 50,
    height: 50,
    speed: 5,
    score: 0,
    color: '#3498db'
};

const tim = {
    x: 700,
    y: 500,
    width: 50,
    height: 50,
    speed: 5,
    score: 0,
    color: '#e74c3c'
};

const basket = {
    x: 375,
    y: 550,
    width: 50,
    height: 30
};

let eggs = [];
const eggSize = 20;

// Controls
const keys = {
    a: false,  // Adam left
    d: false,  // Adam right
    ArrowLeft: false,  // Tim left
    ArrowRight: false  // Tim right
};

// Event listeners
window.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        keys[e.key] = false;
    }
});

// Create new egg
function createEgg() {
    eggs.push({
        x: Math.random() * (canvas.width - eggSize),
        y: -eggSize,
        speed: 2 + Math.random() * 2
    });
}

// Game loop
function update() {
    // Move Adam
    if (keys.a && adam.x > 0) adam.x -= adam.speed;
    if (keys.d && adam.x < canvas.width - adam.width) adam.x += adam.speed;

    // Move Tim
    if (keys.ArrowLeft && tim.x > 0) tim.x -= tim.speed;
    if (keys.ArrowRight && tim.x < canvas.width - tim.width) tim.x += tim.speed;

    // Update eggs
    for (let i = eggs.length - 1; i >= 0; i--) {
        eggs[i].y += eggs[i].speed;

        // Check collision with basket
        if (eggs[i].y + eggSize > basket.y &&
            eggs[i].x + eggSize > basket.x &&
            eggs[i].x < basket.x + basket.width) {
            eggs.splice(i, 1);
            
            // Award point to closest player
            if (Math.abs(adam.x - basket.x) < Math.abs(tim.x - basket.x)) {
                adam.score++;
                document.getElementById('adamScore').textContent = adam.score;
            } else {
                tim.score++;
                document.getElementById('timScore').textContent = tim.score;
            }
            continue;
        }

        // Remove eggs that fall off screen
        if (eggs[i].y > canvas.height) {
            eggs.splice(i, 1);
        }
    }

    // Randomly create new eggs
    if (Math.random() < 0.02) {
        createEgg();
    }
}

// Draw game
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grass
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, 550, canvas.width, 50);

    // Draw players
    ctx.fillStyle = adam.color;
    ctx.fillRect(adam.x, adam.y, adam.width, adam.height);
    ctx.fillStyle = 'white';
    ctx.fillText('Adam', adam.x + 10, adam.y + 30);

    ctx.fillStyle = tim.color;
    ctx.fillRect(tim.x, tim.y, tim.width, tim.height);
    ctx.fillStyle = 'white';
    ctx.fillText('Tim', tim.x + 15, tim.y + 30);

    // Draw basket
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(basket.x, basket.y, basket.width, basket.height);

    // Draw eggs
    ctx.fillStyle = 'white';
    eggs.forEach(egg => {
        ctx.beginPath();
        ctx.ellipse(egg.x + eggSize/2, egg.y + eggSize/2, eggSize/2, eggSize/1.5, 0, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop(); 