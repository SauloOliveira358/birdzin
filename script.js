// Seleciona o elemento <canvas> pelo ID 'gameCanvas' do HTML
let nomepontos = "Pontos:";
const canvas = document.getElementById('gameCanvas');

// Função para ajustar o tamanho do canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

const startScreen = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');
const facilBtn = document.getElementById('facil'); // botão fácil
const medioBtn = document.getElementById('medio'); // botão médio
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

// Imagem do cano
let pipeImg = new Image();
pipeImg.src = 'testest.png';





// --- Dificuldades ---
facilBtn.addEventListener('click', () => {
  pipeGap = 250; // fácil
  nomepontos = "Gaypoints🌈:";
  pipeImg.src = 'canofacil4.png';
  document.body.style.background = "url('backgroudfacil.png') no-repeat center center";
  document.body.style.backgroundSize = "cover";
  loop();
  startScreen.style.display = 'none';
});

medioBtn.addEventListener('click', () => {
  pipeGap = 180; // médio
  loop();
  startScreen.style.display = 'none';
});

dificilBtn.addEventListener('click', () => {
  pipeGap = 120; // difícil
  loop();
  startScreen.style.display = 'none';
});

voltarBtn.addEventListener('click', () => {
  location.reload();
});
// Ajusta o tamanho do canvas na inicialização e ao redimensionar
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

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

    if (this.y + this.h >= canvas.height) {
      gameOver = true;
    }
  },

  flap() {
    this.speed = -this.jump;
  }
};

// === Função que cria os canos ===
function createPipe() {
  const top = Math.random() * (canvas.height - pipeGap - 50) + 20;

  pipes.push({
    x: canvas.width / 1.5 - pipeWidth / 1.5,
    top,
    bottom: top + pipeGap
  });
}

// === Atualiza os canos ===
function updatePipes() {
  if (frames % 100 === 0) {
    createPipe();
  }

  pipes.forEach((pipe, i) => {
    pipe.x -= 2;

    if (
      bird.x + bird.w > pipe.x &&
      bird.x < pipe.x + pipeWidth &&
      (bird.y < pipe.top || bird.y + bird.h > pipe.bottom)
    ) {
      gameOver = true;
    }

    if (pipe.x + pipeWidth < 0) {
      pipes.splice(i, 1);
    }
  });
}

// === Desenha os canos ===
function drawPipes() {
  pipes.forEach(pipe => {
    // Cano de cima
    ctx.drawImage(pipeImg, pipe.x, 0, pipeWidth, pipe.top);

    // Cano de baixo (invertido)
    ctx.save();
    ctx.translate(pipe.x + pipeWidth / 2, pipe.bottom + (canvas.height - pipe.bottom) / 2);
    ctx.scale(1, -1);
    ctx.drawImage(pipeImg, -pipeWidth / 2, -(canvas.height - pipe.bottom) / 2, pipeWidth, canvas.height - pipe.bottom);
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
    ctx.fillStyle = 'red';
    ctx.font = '100px Arial';
    ctx.fillText('Game Over💀', 500, 200);
    ctx.font = '30px Arial';
    ctx.fillText('Pressione espaço para reiniciar', 560, 300);
    
    
    voltarBtn.style.display = 'block';
    
    return;
  }

  bird.update();
  updatePipes();
if(frames == 450){
  score++;
}
  if (frames >= 451) {
   
    if(String(frames).endsWith('50')){
      score++;
    }
    
  }
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

// === Controle de teclas ===
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (gameOver) {
      voltarBtn.style.display = 'none';
      pipes.length = 0;
      bird.y = 150;
      bird.speed = 0;

      if (score > ultimoscore) {
        ultimoscore = score;
      }

      score = 0;
      gameOver = false;
      frames = 0;
    } else {
      bird.flap();
    }
  }
});
