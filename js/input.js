(function () {
  'use strict';

  var DIRECTIONS = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  };

  var isInitialized = false;

  function handleKeyDown(event) {
    var requestedDirection = DIRECTIONS[event.key];
    var game = window.snakeGame;
    var state;

    if (!requestedDirection || !game || typeof game.updateDirection !== 'function') {
      return;
    }

    if (typeof game.getState === 'function') {
      state = game.getState();

      if (state.status === 'running' || state.status === 'paused') {
        event.preventDefault();
      }

      if (state.status !== 'running') {
        return;
      }
    }

    game.updateDirection(requestedDirection);
  }

  function initInput() {
    if (isInitialized) {
      return;
    }

    window.addEventListener('keydown', handleKeyDown);
    isInitialized = true;
  }

  window.initInput = initInput;
}());
