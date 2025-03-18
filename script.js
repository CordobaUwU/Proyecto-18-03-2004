const wordContainer = document.querySelector('.word-container');
const wordInput = document.getElementById('wordInput');
const timerDisplay = document.getElementById('timer');
const levelDisplay = document.getElementById('level');
const player = document.querySelector('.player');
const typingDisplay = document.getElementById('typingDisplay');
const collisionWall = document.querySelector('.collision-wall');
const startScreen = document.getElementById('startScreen');

let gameActive = false;
let currentLevel = 1;
let time;
let words = [];
let spawnInterval;
let gameInterval;
let timerInterval;

const WORD_LIST = [
    'CODE', 'DATA', 'BITS', 'BYTE',
    'DEBUG', 'LOGIN', 'CACHE', 'SPAM',
    'HACK', 'FILE', 'PING', 'RAM', 'GIT', 
    'PROTO', 'DELETE', 'SQL', 'INDEX', 'CSS', 'JAVA'
  ];
const LEVEL_SETTINGS = [
    { time: 60, speed: 1.2, spawnRate: 1800 }, // Nivel 1: Fácil, más tiempo y menos enemigos
    { time: 50, speed: 1.5, spawnRate: 1600 }, // Nivel 2: Un poco más rápido y con tiempo reducido
    { time: 40, speed: 1.8, spawnRate: 1400 }, // Nivel 3: Dificultad intermedia
    { time: 30, speed: 1.8, spawnRate: 1200 }, // Nivel 4: Reto mayor, menos tiempo y velocidad incrementada
    { time: 30, speed: 1.2, spawnRate: 800 }  // Nivel 5: Alta dificultad pero sin saturar al jugador
];

function startJourney() {
  startScreen.style.display = 'none';
  document.querySelector('.game-area').style.visibility = 'visible';

  // Iniciar la música de fondo al comenzar el juego
  const bgMusic = document.getElementById('bgMusic');
  if (bgMusic.paused) {
    bgMusic.play().catch(error => {
      console.log('La reproducción automática fue bloqueada:', error);
    });
  }

  initGame();
}

function initGame() {
  if (gameActive) return;

  gameActive = true;
  time = LEVEL_SETTINGS[currentLevel - 1].time;

  timerDisplay.textContent = time;
  levelDisplay.textContent = currentLevel;
  wordContainer.innerHTML = '';
  wordInput.value = '';
  typingDisplay.textContent = '';
  typingDisplay.classList.remove('active');

  wordInput.disabled = false;
  setTimeout(() => wordInput.focus(), 100);

  startSpawning();
  startGameLoop();
  startTimer();
}

function startSpawning() {
  const spawnRate = LEVEL_SETTINGS[currentLevel - 1].spawnRate;
  spawnInterval = setInterval(() => {
    const word = document.createElement('div');
    word.className = 'word';
    const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    word.textContent = randomWord;

    const minTop = 100;
    const maxTop = window.innerHeight - 50;
    word.style.top = `${minTop + Math.random() * (maxTop - minTop)}px`;
    word.style.right = '-300px';

    wordContainer.appendChild(word);

    words.push({
      element: word,
      x: window.innerWidth,
      active: true,
      word: randomWord
    });
  }, spawnRate);
}

function startGameLoop() {
  const wallRect = collisionWall.getBoundingClientRect();
  const speed = LEVEL_SETTINGS[currentLevel - 1].speed;

  gameInterval = setInterval(() => {
    words = words.filter(wordObj => wordObj.active);

    words.forEach((wordObj) => {
      if (!wordObj.active) return;

      wordObj.x -= speed;
      wordObj.element.style.right = `${window.innerWidth - wordObj.x}px`;

      const wordRect = wordObj.element.getBoundingClientRect();
      if (wordRect.left < wallRect.right) {
        endGame('collision');
      }

      if (wordObj.x < -500) {
        wordObj.element.remove();
        wordObj.active = false;
      }
    });
    updateTypingPosition();
  }, 16);
}

function updateTypingPosition() {
  const playerRect = player.getBoundingClientRect();
  typingDisplay.style.left = `${playerRect.left + (playerRect.width / 2)}px`;
  typingDisplay.style.top = `${playerRect.top - 30}px`;
}

function startTimer() {
  timerInterval = setInterval(() => {
    time--;
    timerDisplay.textContent = time;

    if (time <= 0) {
      clearInterval(timerInterval);
      if (currentLevel === LEVEL_SETTINGS.length) {
        endGame('victory');
      } else {
        endGame('levelup');
      }
    }
  }, 1000);
}

function endGame(reason) {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  wordInput.disabled = true;

  words.forEach(wordObj => {
    wordObj.active = false;
    wordObj.element.remove();
  });
  words = [];

  const resultScreen = document.getElementById('resultScreen');
  const resultTitle = document.getElementById('resultTitle');
  const gameOverButtons = document.getElementById('gameOverButtons');
  
  gameOverButtons.classList.remove('show');

  switch(reason) {
    case 'collision':
      resultTitle.textContent = 'Tus apuntes te consumieron, no hay manera de completar esos examenes';
      resultTitle.style.color = '#ff0000';
      gameOverButtons.classList.add('show');
      currentLevel = 1;
      break;
      
    case 'levelup':
      resultTitle.innerHTML = `¡NIVEL ${currentLevel}<br>COMPLETADO!`;
      resultTitle.style.color = '#00ff00';
      resultScreen.classList.remove('hidden');
      
      const levelUp = document.createElement('div');
      levelUp.className = 'level-up';
      levelUp.textContent = `PROTOCOLO ${currentLevel + 1} ACTIVADO`;
      document.body.appendChild(levelUp);
      setTimeout(() => levelUp.remove(), 2000);
      
      setTimeout(() => {
        resultScreen.classList.add('hidden');
        currentLevel++;
        initGame();
      }, 3000);
      return;
      
    case 'victory':
      resultTitle.innerHTML = '¡VICTORIA TOTAL!<br><span class="victory-message">Pudiste recordar todo lo estudiado mientras estabas en el sueño y lograste pasar tus exámenes</span>';
      resultTitle.style.color = '#00ff00';
      gameOverButtons.classList.add('show');
      currentLevel = 1;
      break;
  }
  
  resultScreen.classList.remove('hidden');
}

document.addEventListener('click', (e) => {
  if (gameActive && e.target !== wordInput) {
    wordInput.focus();
  }
});

wordInput.addEventListener('input', (e) => {
  const inputValue = e.target.value.toUpperCase();
  typingDisplay.textContent = inputValue;
  typingDisplay.classList.toggle('active', inputValue.length > 0);

  if (!gameActive || !inputValue) return;

  let targetWord = null;
  let minDistance = Infinity;

  words.forEach(wordObj => {
    if (wordObj.active && wordObj.word === inputValue) {
      const wordRect = wordObj.element.getBoundingClientRect();
      const distanceToWall = wordRect.left - collisionWall.getBoundingClientRect().right;

      if (distanceToWall < minDistance && distanceToWall > 0) {
        minDistance = distanceToWall;
        targetWord = wordObj;
      }
    }
  });

  if (targetWord) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    const rect = targetWord.element.getBoundingClientRect();
    explosion.style.left = `${rect.left}px`;
    explosion.style.top = `${rect.top}px`;
    document.body.appendChild(explosion);
    setTimeout(() => explosion.remove(), 500);

    targetWord.element.style.transform = 'scale(3)';
    targetWord.element.style.opacity = '0';
    setTimeout(() => {
      targetWord.element.remove();
      targetWord.active = false;
    }, 300);

    e.target.value = '';
    typingDisplay.classList.remove('active');

    player.classList.add('defending');
    setTimeout(() => player.classList.remove('defending'), 200);
  }
});

window.addEventListener('resize', () => {
  collisionWall.style.left = '25%';
  player.style.left = '15%';
  updateTypingPosition();
});

function restartGame() {
  document.getElementById('resultScreen').classList.add('hidden');
  document.getElementById('gameOverButtons').classList.remove('show');
  document.querySelector('.game-area').style.visibility = 'visible';
  currentLevel = 1;
  initGame();
}

function hideResult() {
  document.getElementById('resultScreen').classList.add('hidden');
  startScreen.style.display = 'flex';
  document.querySelector('.game-area').style.visibility = 'hidden';
}

window.addEventListener('load', () => {
  startScreen.style.display = 'flex';
  document.querySelector('.game-area').style.visibility = 'hidden';
  document.getElementById('resultScreen').classList.add('hidden');
  updateTypingPosition();
});
