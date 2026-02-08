// --- DEĞİŞKENLER VE ELEMENTLER ---
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
let currentLevel = 1;
const maxLevel = 5; 
let wrongMoves = 0;
const maxWrongMoves = 4;
let visitedCells = []; // Geri dönme engeli için hafıza

// --- SES SİSTEMİ ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playVictoryMelody() {
    const notes = [523, 587, 659, 698, 783, 880, 987, 1046];
    notes.forEach((f, i) => setTimeout(() => playSound(f, 'sine', 0.2), i * 150));
}

// --- SKOR KAYDETME SİSTEMİ (KRİTİK BÖLÜM) ---
function saveHighScore() {
    if (score > userHighScore) {
        userHighScore = score;
        localStorage.setItem(currentUser, JSON.stringify({ highScore: userHighScore }));
        document.getElementById('highScore').innerText = userHighScore;
    }
}

// --- OYUN BAŞLATMA ---
function startGame() {
    const input = document.getElementById('usernameInput');
    if (!input.value.trim()) {
        alert("Adınızı Yazın!");
        return;
    }
    
    currentUser = input.value.trim();
    const saved = JSON.parse(localStorage.getItem(currentUser)) || { highScore: 0 };
    userHighScore = saved.highScore;
    
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';
    document.getElementById('displayName').innerText = currentUser;
    document.getElementById('highScore').innerText = userHighScore;
    
    alert("DİKKAT: Geçtiğin yollardan tekrar geçersen CANIN ve SÜREN gider! Stratejik ilerle.");
    
    generateLevel();
    startTimer();
    
    setInterval(() => { if(timeLeft > 0) playSound(200, 'sine', 0.05); }, 1000);
}

// --- SEVİYE VE MANTIK ---
function generateLevel() {
    showLevelSlide(); 
    currentGridSize = 4 + currentLevel; 
    visitedCells = []; 
    visitedCells.push("0,0"); 
    
    maze = [];
    for (let y = 0; y < currentGridSize; y++) {
        maze[y] = [];
        for (let x = 0; x < currentGridSize; x++) maze[y][x] = getRandomNumber(false);
    }
    
    let cX = 0, cY = 0;
    maze[cY][cX] = getRandomNumber(true);
    while (cX < currentGridSize - 1 || cY < currentGridSize - 1) {
        if (Math.random() > 0.5 && cX < currentGridSize - 1) cX++; else if (cY < currentGridSize - 1) cY++; else cX++;
        maze[cY][cX] = getRandomNumber(true);
    }
    
    player = { x: 0, y: 0 };
    draw();
}

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

function move(dir) {
    if (timeLeft <= 0) return;
    let nX = player.x, nY = player.y;
    
    if (dir === "ArrowUp" || dir === "up") nY--; 
    if (dir === "ArrowDown" || dir === "down") nY++;
    if (dir === "ArrowLeft" || dir === "left") nX--; 
    if (dir === "ArrowRight" || dir === "right") nX++;

    if (nX >= 0 && nX < currentGridSize && nY >= 0 && nY < currentGridSize) {
        
        // ESKİ KARE KONTROLÜ
        if (visitedCells.includes(`${nX},${nY}`)) {
            player.x = nX; 
            player.y = nY;
            handleWrongMove(); 
            spawnText("⚠️ ESKİ KARE! -6s & 💔", nX, nY, "#ff0000");
            scoreEl.innerText = score;
            return; 
        }

        if (isPrime(maze[nY][nX])) {
            player.x = nX; player.y = nY;
            visitedCells.push(`${nX},${nY}`);
            score += 10; timeLeft += 3;
            playSound(880, 'sine', 0.1);
            spawnText("+10 Puan", nX, nY, "#2ecc71");
        } else {
            player.x = nX; player.y = nY;
            visitedCells.push(`${nX},${nY}`);
            handleWrongMove();
        }
        
        scoreEl.innerText = score;

        if (player.x === currentGridSize - 1 && player.y === currentGridSize - 1) {
            score += 150;
            scoreEl.innerText = score;
            if (currentLevel < maxLevel) {
                currentLevel++; 
                timeLeft += 15;
                playSound(660, 'triangle', 0.3);
                setTimeout(generateLevel, 600);
            } else { victory(); }
        }
    }
}

// --- GÖRSEL VE YARDIMCI SİSTEMLER ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const tileSize = canvas.width / currentGridSize;

    for (let y = 0; y < currentGridSize; y++) {
        for (let x = 0; x < currentGridSize; x++) {
            if (visitedCells.includes(`${x},${y}`)) {
                ctx.fillStyle = "rgba(0, 212, 255, 0.1)";
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
            ctx.strokeStyle = "rgba(0, 212, 255, 0.15)";
            ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
            ctx.fillStyle = "white";
            ctx.font = `bold ${Math.max(14, 28 - currentGridSize * 2)}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText(maze[y][x], x * tileSize + tileSize/2, y * tileSize + tileSize/1.7);
        }
    }
    ctx.font = "30px Arial";
    ctx.fillText("🧑‍🎓", player.x * tileSize + tileSize/2, player.y * tileSize + tileSize/1.4);
    updateFloatingTexts();
    if (timeLeft > 0) requestAnimationFrame(draw);
}

function updateFloatingTexts() {
    floatingTexts.forEach((ft, i) => {
        ctx.globalAlpha = ft.opacity; ctx.fillStyle = ft.color;
        ctx.font = "bold 18px Arial";
        ctx.fillText(ft.text, ft.x, ft.y);
        ft.y -= 1; ft.opacity -= 0.02;
        if (ft.opacity <= 0) floatingTexts.splice(i, 1);
    });
    ctx.globalAlpha = 1;
}

function spawnText(t, x, y, c) {
    const ts = canvas.width / currentGridSize;
    floatingTexts.push({ text: t, x: x * ts + ts/2, y: y * ts + ts/2, opacity: 1, color: c });
}

function handleWrongMove() {
    const hearts = document.querySelectorAll('.heart');
    if (wrongMoves < maxWrongMoves) {
        hearts[wrongMoves].classList.add('broken');
        wrongMoves++;
        timeLeft -= 6;
        playSound(150, 'sawtooth', 0.3);
    }
    if (wrongMoves >= maxWrongMoves) {
        timeLeft = 0;
        clearInterval(timerInterval);
        saveHighScore(); // Rekoru kaydet
        setTimeout(() => { alert("❌ Oyun Bitti! Skorun: " + score); location.reload(); }, 200);
    }
}

function showLevelSlide() {
    const slide = document.getElementById('level-slide');
    const levelText = document.getElementById('level-text');
    levelText.innerText = (currentLevel === maxLevel) ? "FİNAL SEVİYESİ" : `SEVİYE ${currentLevel}`;
    slide.classList.add('active'); 
    setTimeout(() => slide.classList.remove('active'), 1500);
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) { 
            clearInterval(timerInterval);
            saveHighScore(); // Rekoru kaydet
            alert("Süre Bitti! Skorun: " + score); 
            location.reload(); 
        }
        timerEl.innerText = Math.max(0, timeLeft);
    }, 1000);
}

function victory() {
    clearInterval(timerInterval);
    saveHighScore(); // Rekoru kaydet
    playVictoryMelody();
    setTimeout(() => {
        alert("🏆 TEBRİKLER! ASAL KRAL OLDUN! SKOR: " + score);
        location.reload();
    }, 1500);
}

window.addEventListener('keydown', (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        move(e.key);
    }
});