// Seleciona o elemento <canvas> pelo ID 'gameCanvas' do HTML
let nomepontos = "Pontos:";
const canvas = document.getElementById('gameCanvas');

function resizeCanvas() {
  const vw = Math.max(document.documentElement.clientWidth,  window.innerWidth  || 0);
  const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  canvas.width  = vw;
  canvas.height = vh;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);


const startScreen = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');
const facilBtn = document.getElementById('facil');   // botão fácil
const medioBtn = document.getElementById('medio');   // botão médio
const dificilBtn = document.getElementById('dificil'); // botão difícil
const voltarBtn = document.getElementById('voltar'); // botão voltar

// Pega o contexto 2D do canvas
const ctx = canvas.getContext('2d');

// Array de canos
const pipes = [];

// Largura fixa de cada cano
const pipeWidth = 50;

// Espaço vertical entre o cano de cima e o cano de baixo
let pipeGap = 180;

let frames = 0;

// Gravidade do jogo
const gravity = 0.25;

// Variável para controlar se o jogo acabou ou não
let gameOver = false;

// Controle se o loop já foi iniciado (evita 2x loop)
let running = false;

// Imagem do cano
const pipeImg = new Image();
pipeImg.src = 'testest.png';

// --- Dificuldades ---
// Pega o vídeo de fundo
const bgVideo = document.getElementById('bgVideo');

// Função pra trocar o vídeo
function changeVideo(src) {
  bgVideo.src = src;
  bgVideo.currentTime = 0; // reinicia o vídeo do começo
  bgVideo.play().catch(() => {}); // evita erro de autoplay
}

// --- Dificuldades ---
function startGame() {
  if (running) return;
  running = true;
  startScreen && (startScreen.style.display = 'none');
  loop();
}

facilBtn && facilBtn.addEventListener('click', () => {
  pipeGap = 250; // fácil
  nomepontos = "Gaypoints🌈:";
  nomepontos = "Pontos:";
  pipeImg.src = 'canofacil4.png';

  // 🔥 Fundo do modo fácil
  changeVideo('backgroudfacil.mp4');

  startGame();
});

medioBtn && medioBtn.addEventListener('click', () => {
  pipeGap = 180; // médio
  nomepontos = "Pontos:";
  pipeImg.src = 'testest.png';

  // 🔥 Fundo do modo médio
  changeVideo('backgroud.mp4');

  startGame();
});

dificilBtn && dificilBtn.addEventListener('click', () => {
  pipeGap = 120; // difícil
  nomepontos = "Pontos:";
  pipeImg.src = 'testest.png';

  // 🔥 Fundo do modo difícil (mesmo vídeo do médio)
  changeVideo('backgroud.mp4');

  startGame();
});
// Botão "Menu" — volta para a tela inicial
voltarBtn.addEventListener('click', () => {
  location.reload();
  });


// === Objeto do Pássaro (Bird) ===
const bird = {
  x: 50,
  y: 150,
  w: 50,
  h: 50,
  speed: 0,
  jump: 4.6,

  // GIF animado do pássaro
  img: (() => {
    const i = new Image();
    i.src = 'teste.gif'; // seu arquivo GIF animado
    return i;
  })(),

  draw() {
    ctx.drawImage(this.img, this.x, this.y, this.w, this.h);
  },

  update() {
    this.speed += gravity;
    this.y += this.speed;

    // bateu no chão
    if (this.y + this.h >= canvas.height) {
      this.y = canvas.height - this.h;
      gameOver = true;
    }

    // bateu no teto
    if (this.y < 0) {
      this.y = 0;
      this.speed = 0;
    }
  },

  flap() {
    this.speed = -this.jump;
  }
};

// === Função que cria os canos ===
function createPipe() {
  const minTop = 20;
  const maxTop = canvas.height - pipeGap - 50;
  const top = Math.random() * Math.max(10, maxTop - minTop) + minTop;

  pipes.push({
    x: canvas.width, // nasce fora da direita da tela
    top,
    bottom: top + pipeGap,
    scored: false
  });
}

// === Atualiza os canos ===
function updatePipes() {
  if (frames % 100 === 0) {
    createPipe();
  }

  for (let i = pipes.length - 1; i >= 0; i--) {
    const pipe = pipes[i];
    pipe.x -= 2;

    // colisão
    const collideX = bird.x + bird.w > pipe.x && bird.x < pipe.x + pipeWidth;
    const collideY = bird.y < pipe.top || bird.y + bird.h > pipe.bottom;
    if (collideX && collideY) {
      gameOver = true;
    }

    // pontuar quando passar do cano (só uma vez por cano)
    if (!pipe.scored && pipe.x + pipeWidth < bird.x) {
      score++;
      pipe.scored = true;
      if (score > ultimoscore) ultimoscore = score;
    }

    // remove fora da tela
    if (pipe.x + pipeWidth < 0) {
      pipes.splice(i, 1);
    }
  }
}

// === Desenha os canos ===
function drawPipes() {
  pipes.forEach(pipe => {
    // Cano de cima
    ctx.drawImage(pipeImg, pipe.x, 0, pipeWidth, pipe.top);

    // Cano de baixo (invertido)
    ctx.save();
    const bottomHeight = canvas.height - pipe.bottom;
    ctx.translate(pipe.x + pipeWidth / 2, pipe.bottom + bottomHeight / 2);
    ctx.scale(1, -1);
    ctx.drawImage(pipeImg, -pipeWidth / 2, -bottomHeight / 2, pipeWidth, bottomHeight);
    ctx.restore();
  });
}

// === Pontuação ===
let score = 0;
let ultimoscore = 0;

function drawScore() {
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.fillText(`${nomepontos} ${score}`, 10, 30);
  ctx.fillText(`Recorde: ${ultimoscore}`, 10, 60);
}

// === Atualiza o jogo ===
function update() {
 if (gameOver) {
  // fundo suavemente escurecido
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // centralização e sombras
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 20;

  // Título responsivo com gradiente
  const titleY = canvas.height * 0.35;
  const titleSize = Math.max(56, Math.min(120, canvas.width * 0.1));
  const grad = ctx.createLinearGradient(0, titleY - 60, 0, titleY + 60);
  grad.addColorStop(0, '#ff4d4f');
  grad.addColorStop(1, '#ff9a9e');

  ctx.font = `bold ${titleSize}px Orbitron, Arial, sans-serif`;
  ctx.fillStyle = grad;
  ctx.fillText('Game Over', canvas.width / 2, titleY);

  // Subtítulo responsivo
  const subY = titleY + Math.max(60, titleSize * 0.6);
  const subSize = Math.max(18, Math.min(34, canvas.width * 0.025));
  ctx.font = `500 ${subSize}px Arial, sans-serif`;
  ctx.shadowBlur = 10;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fillText('Pressione espaço para reiniciar', canvas.width / 2, subY);

  ctx.restore();

  // mostra o botão Menu
  voltarBtn && (voltarBtn.style.display = 'block');
  return;
}

  bird.update();
  updatePipes();

  // Exemplo de pontuação temporal: a cada 90 frames (opcional)
  // if (frames % 90 === 0) score++;
}

// === Desenha o jogo ===
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPipes();
  bird.draw();
  drawScore();
}

// === Loop principal ===
function loop() {
  draw();
  update();
  frames++;
  requestAnimationFrame(loop);
  
}
// === Música de fundo ===
const bgMusic = new Audio('musica.mp3');
bgMusic.loop = true;   
bgMusic.volume = 0.5;  
document.addEventListener('click', () => {
  if (bgMusic.paused) {
    bgMusic.play().catch(() => {});
  }
});


// === Controle de teclas ===
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (gameOver) {
      voltarBtn && (voltarBtn.style.display = 'none');
      pipes.length = 0;
      bird.y = 150;
      bird.speed = 0;
      score = 0;
      frames = 0;
      gameOver = false;
      // o loop já está rodando; não reinicie outro
    } else {
      bird.flap();
    }
  }
});
