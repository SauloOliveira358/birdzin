// Seleciona o elemento <canvas> pelo ID 'gameCanvas' do HTML
let nomepontos = "Pontos:";
const canvas  = document.getElementById('gameCanvas');  // canvas do jogo
const bgVideo = document.getElementById('bgVideo');     // vídeo de fundo
let som = false; // só pra tocar o som do pulo quando o jogo começar

// Redimensiona o canvas para preencher a tela
function resizeCanvas() {
  const vw = Math.max(document.documentElement.clientWidth,  window.innerWidth  || 0);
  const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  canvas.width  = vw;
  canvas.height = vh;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const startScreen = document.getElementById('startScreen');
const startBtn    = document.getElementById('startBtn');
const facilBtn    = document.getElementById('facil');
const medioBtn    = document.getElementById('medio');
const dificilBtn  = document.getElementById('dificil');
const voltarBtn   = document.getElementById('voltar');

const ctx = canvas.getContext('2d');

// ===== Estado dos canos / bônus =====
const pipes = [];
let totalPipesCriados = 0; // conta colunas geradas (1,2,3...)

// Largura fixa de cada cano
const pipeWidth = 150;

// Espaço vertical entre o cano de cima e o cano de baixo
let pipeGap = 280;

let frames  = 0;
const gravity = 0.25;

let gameOver = false;
let running  = false;

// Imagem do cano
const pipeImg = new Image();
pipeImg.src = 'testest.png';

// ===== Camadas de overlay (DOM) =====
const bonusLayer = (() => {
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.left = '0';
  div.style.top = '0';
  div.style.width = '100%';
  div.style.height = '100%';
  div.style.pointerEvents = 'none';
  div.style.zIndex = '5';      // bônus acima do canvas
  div.style.display = 'none';  // <<< escondido no menu
  canvas.parentElement?.insertBefore(div, canvas.nextSibling) || document.body.appendChild(div);
  return div;
})();

// Pássaro sobre o canvas (z-index > bônus)
const birdEl = (() => {
  const img = document.createElement('img');
  img.src = 'birdzin.gif';
  img.alt = '';
  img.style.position = 'absolute';
  img.style.pointerEvents = 'none';
  img.style.zIndex = '6';      // pássaro acima dos bônus
  img.style.willChange = 'transform';
  img.style.display = 'none';  // <<< escondido no menu
  bonusLayer.appendChild(img);
  return img;
})();

// ===== BÔNUS (GIF a cada 5 colunas, DOM overlay) =====
const TOTAL_MOD = 5;     // a cada 5ª coluna
const BONUS_MIN = 40;
const BONUS_MAX = 120;
const BONUS_SRC = 'bonus.gif'; // seu arquivo GIF animado

// ===== Vídeos de fundo =====
function changeVideo(src) {
  bgVideo.src = src;
  bgVideo.currentTime = 0;
  bgVideo.play().catch(() => {});
}

// ===== Dificuldades / início =====
function startGame() {
  if (running) return;
  running = true;

  // esconde a tela inicial
  startScreen && (startScreen.style.display = 'none');

  // >>> mostra os overlays somente agora
  bonusLayer.style.display = 'block';
  birdEl.style.display     = 'block';

  loop();
}

facilBtn && facilBtn.addEventListener('click', () => {
  pipeGap = 300; // fácil
  nomepontos = "Pontos:";
  pipeImg.src = 'canofacil4.png';
  changeVideo('backgroudfacil.mp4');
  startGame();
});

medioBtn && medioBtn.addEventListener('click', () => {
  pipeGap = 250; // médio
  nomepontos = "Pontos:";
  pipeImg.src = 'testest.png';
  changeVideo('backgroud.mp4');
  startGame();
});

dificilBtn && dificilBtn.addEventListener('click', () => {
  pipeGap = 200; // difícil
  nomepontos = "Pontos:";
  pipeImg.src = 'testest.png';
  changeVideo('backgroud.mp4');
  startGame();
});

voltarBtn && voltarBtn.addEventListener('click', () => {
  location.reload();
});

// ===== Bird (física + posicionamento do <img>) =====
const bird = {
  x: 50,
  y: 150,
  w: 100,
  h: 100,
  speed: 0,
  jump: 6,

  // agora o "desenho" é posicionar o birdEl no overlay
  draw(canvasRect) {
    birdEl.style.width  = this.w + 'px';
    birdEl.style.height = this.h + 'px';
    const left = canvasRect.left + this.x;
    const top  = canvasRect.top  + this.y;
    birdEl.style.transform = `translate(${left}px, ${top}px)`;
  },

  update() {
    this.speed += gravity;
    this.y += this.speed;

    // chão
    if (this.y + this.h >= canvas.height) {
      this.y = canvas.height - this.h;
      gameOver = true;
    }
    // teto
    if (this.y < 0) {
      this.y = 0;
      this.speed = 0;
    }
  },

  flap() {
    this.speed = -this.jump;
  }
};

// ===== Criação de canos =====
function createPipe() {
  const minTop = 20;
  const maxTop = canvas.height - pipeGap - 50;
  const top = Math.random() * Math.max(10, maxTop - minTop) + minTop;

  totalPipesCriados++;
  const isBonus = (totalPipesCriados % TOTAL_MOD === 0);

  // tamanho do bônus baseado no gap, com limites
  const bonusSize = Math.max(BONUS_MIN, Math.min(BONUS_MAX, pipeGap - 60));

  // se for bônus, criamos um <img> DOM que ficará por cima do canvas
  let bonusEl = null;
  if (isBonus) {
    bonusEl = document.createElement('img');
    bonusEl.src = BONUS_SRC;
    bonusEl.alt = '';
    bonusEl.style.position = 'absolute';
    bonusEl.style.pointerEvents = 'none';
    bonusEl.style.willChange = 'transform';
    bonusEl.style.transform = 'translate(-9999px,-9999px)'; // inicia fora
    bonusLayer.appendChild(bonusEl);
  }

  pipes.push({
    x: canvas.width, // nasce fora da direita
    top,
    bottom: top + pipeGap,
    scored: false,
    // bônus
    isBonus,
    bonusCollected: false,
    bonusSize,
    bonusEl
  });
}

// AABB overlap
function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// ===== helper: atualiza posição na tela do GIF DOM (bônus) =====
function positionBonusEl(pipe, canvasRect) {
  if (!pipe.isBonus || pipe.bonusCollected || !pipe.bonusEl) return;

  const bSize = pipe.bonusSize;

  // coordenadas do bônus dentro do canvas
  const cx = pipe.x + pipeWidth / 2 - bSize / 2;
  const cy = (pipe.top + pipe.bottom) / 2 - bSize / 2;

  // posição absoluta na janela
  const left = canvasRect.left + cx;
  const top  = canvasRect.top  + cy;

  // fora de tela? estaciona fora para não forçar layout
  if (left + bSize < 0 || left > window.innerWidth || top + bSize < 0 || top > window.innerHeight) {
    pipe.bonusEl.style.transform = 'translate(-9999px,-9999px)';
    return;
  }

  pipe.bonusEl.style.width = bSize + 'px';
  pipe.bonusEl.style.height = bSize + 'px';
  pipe.bonusEl.style.transform = `translate(${left}px, ${top}px)`;
}

// ===== Atualização dos canos =====
function updatePipes() {
  if (frames % 200 === 0) {
    createPipe();
  }

  const canvasRect = canvas.getBoundingClientRect();

  for (let i = pipes.length - 1; i >= 0; i--) {
    const pipe = pipes[i];
    pipe.x -= 2;

    // colisão com canos
    const collideX = bird.x + bird.w > pipe.x && bird.x < pipe.x + pipeWidth;
    const collideY = bird.y < pipe.top || bird.y + bird.h > pipe.bottom;
    if (collideX && collideY) {
      gameOver = true;
    }

    // posiciona o <img> do bônus
    positionBonusEl(pipe, canvasRect);

    // coleta do bônus (tocar no gif)
    if (pipe.isBonus && !pipe.bonusCollected) {
      const bSize = pipe.bonusSize;

      // bounding box do bônus em coordenadas do canvas
      const bonusX = pipe.x + pipeWidth / 2 - bSize / 2;
      const bonusY = (pipe.top + pipe.bottom) / 2 - bSize / 2;

      if (aabbOverlap(bird.x, bird.y, bird.w, bird.h, bonusX, bonusY, bSize, bSize)) {
        score += 5;                 // +5 pontos
        pipe.bonusCollected = true; // some o gif deste cano
        if (pipe.bonusEl) {
          pipe.bonusEl.remove();
          pipe.bonusEl = null;
        }
      }
    }

    // pontuar ao passar pela coluna
    if (!pipe.scored && pipe.x + pipeWidth < bird.x) {
      score++;
      pipe.scored = true;
      if (score > ultimoscore) ultimoscore = score;
    }

    // remove quando sai da tela
    if (pipe.x + pipeWidth < 0) {
      if (pipe.bonusEl) {
        pipe.bonusEl.remove();
        pipe.bonusEl = null;
      }
      pipes.splice(i, 1);
    }
  }
}

// ===== Desenho dos canos =====
function drawPipes() {
  pipes.forEach(pipe => {
    // cano de cima
    ctx.drawImage(pipeImg, pipe.x, 0, pipeWidth, pipe.top);

    // cano de baixo (invertido)
    ctx.save();
    const bottomHeight = canvas.height - pipe.bottom;
    ctx.translate(pipe.x + pipeWidth / 2, pipe.bottom + bottomHeight / 2);
    ctx.scale(1, -1);
    ctx.drawImage(pipeImg, -pipeWidth / 2, -bottomHeight / 2, pipeWidth, bottomHeight);
    ctx.restore();
  });
}

// ===== Pontuação =====
let score = 0;
let ultimoscore = 0;

function drawScore() {
  ctx.fillStyle = 'white';
  ctx.font = '30px Arial';
  ctx.fillText(`${nomepontos} ${score}`, 10, 30);
  ctx.fillText(`Recorde: ${ultimoscore}`, 10, 60);
}

// ===== Atualização do jogo =====
function update() {
  if (gameOver) {
    // overlay
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // texto
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 20;

    // título
    const titleY = canvas.height * 0.35;
    const titleSize = Math.max(56, Math.min(120, canvas.width * 0.1));
    const grad = ctx.createLinearGradient(0, titleY - 60, 0, titleY + 60);
    grad.addColorStop(0, '#ff4d4f');
    grad.addColorStop(1, '#ff9a9e');

    ctx.font = `bold ${titleSize}px Orbitron, Arial, sans-serif`;
    ctx.fillStyle = grad;
    ctx.fillText('Game Over', canvas.width / 2, titleY);

    // subtítulo
    const subY = titleY + Math.max(60, titleSize * 0.6);
    const subSize = Math.max(18, Math.min(34, canvas.width * 0.025));
    ctx.font = `500 ${subSize}px Arial, sans-serif`;
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillText('Pressione espaço para reiniciar', canvas.width / 2, subY);
    const linha2Y = subY + subSize + 10;
    ctx.fillText(`${nomepontos} ${score}`, canvas.width / 2, linha2Y);

    ctx.restore();

    // botão Menu
    voltarBtn && (voltarBtn.style.display = 'block');
    return;
  }

  bird.update();
  updatePipes();
}

// ===== Desenho do jogo =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPipes();

  // posiciona o pássaro (DOM) neste frame
  const rect = canvas.getBoundingClientRect();
  bird.draw(rect);

  drawScore();
}

// ===== Loop principal =====
function loop() {
  som = true;
  draw();
  update();
  frames++;
  requestAnimationFrame(loop);
}

// ===== Música de fundo =====
const bgMusic = new Audio('musica.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5;
document.addEventListener('click', () => {
  if (bgMusic.paused) {
    bgMusic.play().catch(() => {});
  }
});

// ===== Controles =====
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (gameOver) {
      voltarBtn && (voltarBtn.style.display = 'none');

      // limpa todos os GIFs de bônus que porventura ficaram
      for (const p of pipes) if (p.bonusEl) p.bonusEl.remove();
      pipes.length = 0;

      // reseta bird
      bird.y = 150;
      bird.speed = 0;
      const rect = canvas.getBoundingClientRect();
      bird.draw(rect);

      score = 0;
      frames = 0;
      gameOver = false;
      totalPipesCriados = 0; // reinicia contagem para a próxima 5ª coluna
    } else {
      bird.flap();
      const somMagico = new Audio('somdepulo.mp3'); // som do pulo
      if (som) {
        somMagico.play().catch(() => {});
      }
    }
  }
});
