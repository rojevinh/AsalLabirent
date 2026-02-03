// 1. DEĞİŞKENLER VE AYARLAR
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

// SEVİYE VE KALP SİSTEMİ
let currentLevel = 1;
const maxLevel = 5; 
let wrongMoves = 0;
const maxWrongMoves = 4;

// 2. OYUNU BAŞLATMA
function startGame() {
    const input = document.getElementById('usernameInput');
    if (!input || input.value.trim() === "") {
        alert("Lütfen bir isim girin!");
        return;
    }
    currentUser = input.value.trim();
    const savedData = JSON.parse(localStorage.getItem(currentUser)) || { highScore: 0 };
    userHighScore = savedData.highScore;
    
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    document.getElementById('displayName').innerText = currentUser;
    document.getElementById('highScore').innerText = userHighScore;
    
    generateLevel();
    startTimer();
}

// 3. SEVİYE SLAYT GEÇİŞİ
function showLevelSlide() {
    const slide = document.getElementById('level-slide');
    const text = document.getElementById('level-text');
    
    text.innerText = `SEVİYE ${currentLevel}`;
    slide.classList.add('active'); 

    setTimeout(() => {
        slide.classList.remove('active');
    }, 1500);
}

// 4. KALP SİSTEMİ MANTIĞI
function handleWrongMove() {
    const hearts = document.querySelectorAll('.heart');
    
    if (wrongMoves < maxWrongMoves) {
        // Sıradaki kalbi siyah yap
        hearts[wrongMoves].classList.add('broken');
        wrongMoves++;
        timeLeft -= 6; // -6 saniye cezası
        spawnText("-6s💔", player.x, player.y, "#e74c3c");
    }

    // Haklar biterse süreyi sıfırla ve oyunu bitir
    if (wrongMoves >= maxWrongMoves) {
        timeLeft = 0;
        timerEl.innerText = 0;
        setTimeout(() => {
            alert("❌ Tüm kalplerin söndü! Asal sayılara daha dikkat etmelisin.");
            location.reload();
        }, 150);
    }
}

// 5. MATEMATİKSEL FONKSİYONLAR
function isPrime(num) {
    if (num <= 1) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) if (num % i === 0) return false;
    return true;
}

function getRandomNumber(wantPrime) {
    let limit = 40 + (currentLevel * 20); 
    let n = Math.floor(Math.random() * limit) + 2;
    while (isPrime(n) !== wantPrime) n = Math.floor(Math.random() * limit) + 2;
    return n;
}

// 6. GÖRSEL EFEKTLER
function spawnConfetti() {
    const tileSize = canvas.width / currentGridSize;
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: player.x * tileSize + tileSize / 2,
            y: player.y * tileSize + tileSize / 2,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            size: Math.random() * 6 + 2,
            life: 1
        });
    }
}

function spawnText(text, x, y, color) {
    const tileSize = canvas.width / currentGridSize;
    floatingTexts.push({
        text: text, x: x * tileSize + tileSize / 2, y: y * tileSize + tileSize / 2,
        opacity: 1, color: color
    });
}

// 7. LABİRENT ÜRETİMİ
function generateLevel() {
    showLevelSlide(); 
    currentGridSize = 4 + currentLevel; 
    
    maze = [];
    for (let y = 0; y < currentGridSize; y++) {
        maze[y] = [];
        for (let x = 0; x < currentGridSize; x++) maze[y][x] = getRandomNumber(false);
    }
    createPath(); createPath(); 
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

// 8. HAREKET VE KONTROL
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
            handleWrongMove(); // Kalp ve ceza fonksiyonunu çağır
        }

        // BİTİŞE ULAŞMA (TEK SEFERDE GEÇİŞ)
        if (player.x === currentGridSize - 1 && player.y === currentGridSize - 1) {
            score += 150; 
            spawnConfetti();
            
            if (currentLevel < maxLevel) {
                currentLevel++;
                timeLeft += 15; 
                setTimeout(generateLevel, 600);
            } else {
                setTimeout(victory, 600);
                return;
            }
        }
        scoreEl.innerText = score;
    }
}

window.addEventListener('keydown', (e) => move(e.key));

// 9. ÇİZİM DÖNGÜSÜ
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Tam sayı bölmesi yaparak kenarlarda boşluk kalmasını engelliyoruz
    const tileSize = Math.floor(canvas.width / currentGridSize); 

    for (let y = 0; y < currentGridSize; y++) {
        for (let x = 0; x < currentGridSize; x++) {
            // Hücre çizgileri (ince ve hafif)
            ctx.strokeStyle = "rgba(0, 212, 255, 0.15)";
            ctx.lineWidth = 1;
            ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
            
            // Sayılar
            ctx.fillStyle = "white";
            ctx.font = `bold ${Math.max(12, 24 - currentGridSize)}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText(maze[y][x], x * tileSize + tileSize/2, y * tileSize + tileSize/1.7);
        }
    }
    
    // Karakter ve diğer efektler buraya devam edecek...
    ctx.font = `${Math.max(18, 40 - currentGridSize * 2)}px Arial`;
    ctx.fillText("🧑‍🎓", player.x * tileSize + tileSize/2, player.y * tileSize + tileSize/1.4);

    particles.forEach((p, i) => {
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 0.005;
        if (p.life <= 0) particles.splice(i, 1);
    });

    floatingTexts.forEach((ft, i) => {
        ctx.globalAlpha = ft.opacity; ctx.fillStyle = ft.color;
        ctx.font = "bold 18px Arial";
        ctx.fillText(ft.text, ft.x, ft.y);
        ft.y -= 1.2; ft.opacity -= 0.02;
        if (ft.opacity <= 0) floatingTexts.splice(i, 1);
    });

    ctx.globalAlpha = 1;
    if (timeLeft > 0) requestAnimationFrame(draw);
}

// 10. BİTİŞ VE ZAMANLAYICI
function victory() {
    clearInterval(timerInterval);
    timeLeft = 0;
    spawnConfetti();
    setTimeout(spawnConfetti, 500);
    alert(`🏆 EFSANESİNİZ! 🏆\n5 Seviyeyi de başarıyla bitirdiniz!\nToplam Skor: ${score}`);
    if (score > userHighScore) localStorage.setItem(currentUser, JSON.stringify({ highScore: score }));
    location.reload();
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) { clearInterval(timerInterval); finishGame(); }
        timerEl.innerText = Math.max(0, timeLeft);
    }, 1000);
}

function finishGame() {
    alert("Süre bitti! Skorunuz: " + score);
    if (score > userHighScore) localStorage.setItem(currentUser, JSON.stringify({ highScore: score }));
    location.reload();
}