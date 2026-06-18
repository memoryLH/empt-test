(function () {
  'use strict';

  var HIGH_SCORE_KEY = 'snakeHighScore';

  function getHighScore() {
    var storedScore = window.localStorage.getItem(HIGH_SCORE_KEY);

    return Number.parseInt(storedScore, 10) || 0;
  }

  function setHighScore(score) {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
  }

  window.getHighScore = getHighScore;
  window.setHighScore = setHighScore;
}());
