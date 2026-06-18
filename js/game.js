(function () {
  'use strict';

  var GRID_SIZE = 20;
  var TICK_DELAY = 120;
  var INITIAL_LENGTH = 3;
  var HIGH_SCORE_KEY = 'snakeHighScore';

  var STATUS_IDLE = 'idle';
  var STATUS_RUNNING = 'running';
  var STATUS_PAUSED = 'paused';
  var STATUS_ENDED = 'ended';

  function initGame() {
    var canvas = document.getElementById('gameCanvas');
    var scoreDisplay = document.getElementById('scoreDisplay');
    var highScoreDisplay = document.getElementById('highScoreDisplay');
    var startBtn = document.getElementById('startBtn');
    var pauseBtn = document.getElementById('pauseBtn');
    var restartBtn = document.getElementById('restartBtn');

    if (!canvas || !scoreDisplay || !highScoreDisplay || !startBtn || !pauseBtn || !restartBtn) {
      return;
    }

    var ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    var columns = Math.floor(canvas.width / GRID_SIZE);
    var rows = Math.floor(canvas.height / GRID_SIZE);
    var snake = [];
    var food = null;
    var direction = { x: 1, y: 0 };
    var nextDirection = { x: 1, y: 0 };
    var score = 0;
    var highScore = loadHighScore();
    var status = STATUS_IDLE;
    var loopId = null;

    function loadHighScore() {
      var storedScore;

      try {
        if (typeof window.getHighScore === 'function') {
          return Number.parseInt(window.getHighScore(), 10) || 0;
        }
      } catch (error) {
        // Fall through to the direct localStorage fallback below.
      }

      try {
        storedScore = window.localStorage && window.localStorage.getItem(HIGH_SCORE_KEY);
      } catch (error) {
        storedScore = null;
      }

      return Number.parseInt(storedScore, 10) || 0;
    }

    function saveHighScore() {
      try {
        if (typeof window.setHighScore === 'function') {
          window.setHighScore(highScore);
          return;
        }
      } catch (error) {
        // Fall through to the direct localStorage fallback below.
      }

      try {
        if (window.localStorage) {
          window.localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
        }
      } catch (error) {
        // Ignore storage errors so gameplay continues in private or restricted contexts.
      }
    }

    function createCell(x, y) {
      return { x: x, y: y };
    }

    function sameCell(a, b) {
      return a && b && a.x === b.x && a.y === b.y;
    }

    function copyCell(cell) {
      return cell ? createCell(cell.x, cell.y) : null;
    }

    function createInitialSnake() {
      var centerX = Math.floor(columns / 2);
      var centerY = Math.floor(rows / 2);
      var headX = Math.max(INITIAL_LENGTH - 1, centerX);
      var parts = [];
      var i;

      for (i = 0; i < INITIAL_LENGTH; i += 1) {
        parts.push(createCell(headX - i, centerY));
      }

      return parts;
    }

    function isOnSnake(cell) {
      return snake.some(function (segment) {
        return sameCell(segment, cell);
      });
    }

    function generateFood() {
      var maxCells = columns * rows;
      var candidate;

      if (snake.length >= maxCells) {
        food = null;
        return;
      }

      do {
        candidate = createCell(
          Math.floor(Math.random() * columns),
          Math.floor(Math.random() * rows)
        );
      } while (isOnSnake(candidate));

      food = candidate;
    }

    function resetRound() {
      snake = createInitialSnake();
      direction = createCell(1, 0);
      nextDirection = createCell(1, 0);
      score = 0;
      generateFood();
      updateScoreDisplay();
    }

    function startLoop() {
      if (!loopId) {
        loopId = window.setInterval(tick, TICK_DELAY);
      }
    }

    function stopLoop() {
      if (loopId) {
        window.clearInterval(loopId);
        loopId = null;
      }
    }

    function updateScoreDisplay() {
      scoreDisplay.textContent = '分数: ' + score;
      highScoreDisplay.textContent = '最高分: ' + highScore;
    }

    function updateControls() {
      startBtn.disabled = status === STATUS_RUNNING || status === STATUS_PAUSED;
      pauseBtn.disabled = status !== STATUS_RUNNING && status !== STATUS_PAUSED;
      pauseBtn.textContent = status === STATUS_PAUSED ? '继续' : '暂停';
      restartBtn.disabled = false;
    }

    function drawCell(cell, color) {
      ctx.fillStyle = color;
      ctx.fillRect(
        cell.x * GRID_SIZE + 1,
        cell.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2
      );
    }

    function drawOverlay(message) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, columns * GRID_SIZE, rows * GRID_SIZE);

      if (food) {
        drawCell(food, '#ef4444');
      }

      snake.forEach(function (segment, index) {
        drawCell(segment, index === 0 ? '#22c55e' : '#86efac');
      });

      if (status === STATUS_PAUSED) {
        drawOverlay('已暂停');
      } else if (status === STATUS_ENDED) {
        drawOverlay('游戏结束');
      }
    }

    function isWallCollision(cell) {
      return cell.x < 0 || cell.x >= columns || cell.y < 0 || cell.y >= rows;
    }

    function isSelfCollision(cell, willGrow) {
      var body = willGrow ? snake : snake.slice(0, snake.length - 1);

      return body.some(function (segment) {
        return sameCell(segment, cell);
      });
    }

    function endGame() {
      if (score > highScore) {
        highScore = score;
      }

      saveHighScore();
      updateScoreDisplay();
      status = STATUS_ENDED;
      stopLoop();
      updateControls();
      draw();
    }

    function tick() {
      var head;
      var nextHead;
      var willGrow;

      if (status !== STATUS_RUNNING) {
        return;
      }

      direction = copyCell(nextDirection);
      head = snake[0];
      nextHead = createCell(head.x + direction.x, head.y + direction.y);
      willGrow = sameCell(nextHead, food);

      if (isWallCollision(nextHead) || isSelfCollision(nextHead, willGrow)) {
        endGame();
        return;
      }

      snake.unshift(nextHead);

      if (willGrow) {
        score += 1;

        if (score > highScore) {
          highScore = score;
        }

        generateFood();
        updateScoreDisplay();
      } else {
        snake.pop();
      }

      draw();
    }

    function startGame() {
      if (status === STATUS_RUNNING) {
        return;
      }

      if (status === STATUS_PAUSED) {
        status = STATUS_RUNNING;
      } else if (status === STATUS_ENDED) {
        resetRound();
        status = STATUS_RUNNING;
      } else {
        status = STATUS_RUNNING;
      }

      startLoop();
      updateControls();
      draw();
    }

    function togglePause() {
      if (status === STATUS_RUNNING) {
        status = STATUS_PAUSED;
        stopLoop();
      } else if (status === STATUS_PAUSED) {
        status = STATUS_RUNNING;
        startLoop();
      }

      updateControls();
      draw();
    }

    function restartGame() {
      stopLoop();
      resetRound();
      status = STATUS_RUNNING;
      startLoop();
      updateControls();
      draw();
    }

    function updateDirection(requestedDirection) {
      var isOppositeDirection = requestedDirection.x + direction.x === 0
        && requestedDirection.y + direction.y === 0;

      if (!isOppositeDirection) {
        nextDirection = copyCell(requestedDirection);
      }
    }

    function getState() {
      return {
        status: status,
        score: score,
        highScore: highScore,
        snake: snake.map(copyCell),
        food: copyCell(food),
        direction: copyCell(direction),
        nextDirection: copyCell(nextDirection),
        grid: {
          columns: columns,
          rows: rows,
          size: GRID_SIZE,
        },
      };
    }

    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    restartBtn.addEventListener('click', restartGame);

    window.snakeGame = {
      start: startGame,
      pause: togglePause,
      restart: restartGame,
      updateDirection: updateDirection,
      getState: getState,
    };

    if (typeof window.initInput === 'function') {
      window.initInput();
    }

    resetRound();
    updateControls();
    draw();
  }

  window.addEventListener('DOMContentLoaded', initGame);
}());
