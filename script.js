// 1. DEĞİŞKENLER
const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');

let score = 0;
let timeLeft = 30; 
let player = { x: 0, y: 0 };
let currentGridSize = 5; 
let maze = [];
let currentUser = "";
let userHighScore = 0;
let timerInterval;
let floatingTexts = []; 
let particles = [];

// Mobil uyum için canvas boyutunu ayarla
function resizeCanvas() {
    const size = Math.min(window.innerWidth * 0.95, 500);
    canvas.width = size;
    canvas.height = size;
    if (maze.length > 0) draw(); // Boyut değişince yeniden çiz
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // İlk açılışta çalıştır

// 2. OYUNU BAŞLATMA (BUTONUN ÇALIŞMASI İÇİN KRİTİK)
function startGame() {
    console.log("Butona basıldı!"); // Konsolda kontrol için
    const input = document.getElementById('usernameInput');
    
    if (!input || input.value.trim() === "") {
        alert("Lütfen bir isim girin!");
        return;
    }

    currentUser = input.value.trim();
    const savedData = JSON.parse(localStorage.getItem(currentUser)) || { highScore: 0 };
    userHighScore = savedData.highScore;
    
    // Ekranları değiştir
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    
    // Bilgileri yazdır
    document.getElementById('displayName').innerText = currentUser;
    document.getElementById('highScore').innerText = userHighScore;
    
    generateLevel();
    startTimer();
}

// 3. ASAL SAYI MANTIĞI
function isPrime(num) {
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) if (num % i === 0) return false;
    return true;
}

function getRandomNumber(wantPrime) {
    let limit = 50 + (score / 2); 
    let n = Math.floor(Math.random() * limit) + 2;
    while (isPrime(n) !== wantPrime) n = Math.floor(Math.random() * limit) + 2;
    return n;
}

// 4. KONFETİ VE METİN EFEKTLERİ
function spawnConfetti() {
    const tileSize = canvas.width / currentGridSize;
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: player.x * tileSize + tileSize / 2,
            y: player.y * tileSize + tileSize / 2,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            size: Math.random() * 6 + 2,
            life: 1
        });
    }
}

function spawnText(text, x, y, color) {
    const tileSize = canvas.width / currentGridSize;
    floatingTexts.push({
        text: text,
        x: x * tileSize + tileSize / 2,
        y: y * tileSize + tileSize / 2,
        opacity: 1,
        color: color
    });
}

// 5. LABİRENT VE HAREKET
function generateLevel() {
    currentGridSize = Math.min(5 + Math.floor(score / 100), 10);
    maze = [];
    for (let y = 0; y < currentGridSize; y++) {
        maze[y] = [];
        for (let x = 0; x < currentGridSize; x++) maze[y][x] = getRandomNumber(false);
    }
    createPath(); 
    createPath(); 
    player = { x: 0, y: 0 };
    draw();
}

function createPath() {
    let currX = 0, currY = 0;
    maze[currY][currX] = getRandomNumber(true);
    while (currX < currentGridSize - 1 || currY < currentGridSize - 1) {
        if (Math.random() > 0.5 && currX < currentGridSize - 1) currX++;
        else if (currY < currentGridSize - 1) currY++;
        else currX++;
        maze[currY][currX] = getRandomNumber(true);
    }
}

function move(direction) {
    if (timeLeft <= 0 || !currentUser) return;
    let newX = player.x;
    let newY = player.y;

    if (direction === "ArrowUp") newY--;
    if (direction === "ArrowDown") newY++;
    if (direction === "ArrowLeft") newX--;
    if (direction === "ArrowRight") newX++;

    if (newX >= 0 && newX < currentGridSize && newY >= 0 && newY < currentGridSize) {
        if (isPrime(maze[newY][newX])) {
            player.x = newX; player.y = newY;
            score += 10; timeLeft += 3;
            spawnText("+3s", newX, newY, "#2ecc71");
        } else {
            player.x = newX; player.y = newY;
            timeLeft -= 3;
            spawnText("-3s", newX, newY, "#e74c3c");
        }

        if (player.x === currentGridSize - 1 && player.y === currentGridSize - 1) {
            score += 50;
            spawnConfetti();
            setTimeout(generateLevel, 300);
        }
        scoreEl.innerText = score;
    }
}

window.addEventListener('keydown', (e) => move(e.key));

// 6. GÖRSEL DÖNGÜ
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const tileSize = canvas.width / currentGridSize;

    for (let y = 0; y < currentGridSize; y++) {
        for (let x = 0; x < currentGridSize; x++) {
            ctx.strokeStyle = "rgba(15, 52, 96, 0.3)";
            ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
            ctx.fillStyle = "white";
            ctx.font = `bold ${Math.max(12, 24 - currentGridSize)}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText(maze[y][x], x * tileSize + tileSize/2, y * tileSize + tileSize/1.7);
        }
    }

    ctx.font = `${Math.max(20, 45 - currentGridSize * 3)}px Arial`;
    ctx.fillText("🧑‍🎓", player.x * tileSize + tileSize/2, player.y * tileSize + tileSize/1.4);

    // Konfeti Döngüsü
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.005;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // Metin Döngüsü
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        let ft = floatingTexts[i];
        ctx.globalAlpha = ft.opacity;
        ctx.fillStyle = ft.color;
        ctx.font = "bold 20px Arial";
        ctx.fillText(ft.text, ft.x, ft.y);
        ft.y -= 1.2; ft.opacity -= 0.02;
        if (ft.opacity <= 0) floatingTexts.splice(i, 1);
    }

    ctx.globalAlpha = 1;
    if (timeLeft > 0) requestAnimationFrame(draw);
}

// 7. SİSTEM
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            finishGame();
        }
        timerEl.innerText = Math.max(0, timeLeft);
    }, 1000);
}

function finishGame() {
    if (score > userHighScore) {
        localStorage.setItem(currentUser, JSON.stringify({ highScore: score }));
        alert("🎉 REKOR: " + score);
    } else {
        alert("Süre Bitti! Skor: " + score);
    }
    location.reload();
}