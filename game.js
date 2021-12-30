// Huge thanks to Brian Koponen who provided an awesome tutorial for this!!!
// More information at www.briankoponen.com

/*eslint-env browser */
/*eslint-disable no-console */
/*jslint devel: true, browser: true, nomen: true */

"use-strict";
//Root Domain
const url = "https://hyptocrypton.github.io/dronies-vs-cryptopunks/"

//
// Vec2D
//
var Vec2D = function (x, y) {
  this.x = x;
  this.y = y;
};

Vec2D.prototype.set = function (x, y) {
  this.x = x;
  this.y = y;
};

Vec2D.prototype.add = function (v2) {
  this.x += v2.x;
  this.y += v2.y;
};

Vec2D.prototype.subtract = function (v2) {
  this.x -= v2.x;
  this.y -= v2.y;
};

Vec2D.prototype.scalarMultiply = function (s) {
  this.x *= s;
  this.y *= s;
};

Vec2D.prototype.clone = function () {
  return new Vec2D(this.x, this.y);
};

//
// Rect Object
//
function Rect(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
}

Rect.prototype.left = function () {
  return this.x;
};

Rect.prototype.right = function () {
  return this.x + this.width;
};

Rect.prototype.top = function () {
  return this.y;
};

Rect.prototype.bottom = function () {
  return this.y + this.height;
};

Rect.prototype.intersects = function (r2) {
  return (
    this.right() >= r2.left() &&
    this.left() <= r2.right() &&
    this.top() <= r2.bottom() &&
    this.bottom() >= r2.top()
  );
};

Rect.prototype.containsPoint = function (x, y) {
  return (
    this.left() <= x &&
    x <= this.right() &&
    this.top() <= y &&
    y <= this.bottom()
  );
};

Rect.prototype.union = function (r2) {
  var x, y, width, height;

  if (r2 === undefined) {
    return;
  }

  x = Math.min(this.x, r2.x);
  y = Math.min(this.y, r2.y);
  width = Math.max(this.right(), r2.right()) - Math.min(this.left(), r2.left());
  height =
    Math.max(this.bottom(), r2.bottom()) - Math.min(this.top(), r2.top());

  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
};

Rect.prototype.set = function (x, y, w, h) {
  this.x = x;
  this.y = y;
  this.width = w;
  this.height = h;
};

Rect.prototype.clone = function () {
  return new Rect(this.x, this.y, this.width, this.height);
};

//
// Random Number Generator
//
function returnRandInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

//
// Base Entity Class
//
function Entity(position, speed, direction) {
  this.position = position.clone();
  this.speed = speed;
  this.direction = direction.clone();
  this.time = 0;
  this.width = 5;
  this.height = 5;
  this.hp = 1;

  this._collisionRect = new Rect(
    this.position.x - this.width / 2,
    this.position.y - this.height / 2,
    this.width,
    this.height
  );
}

Entity.prototype.init = function () {
  this.position.set(0, 0);
  this.speed = 0;
  this.direction.set(0, 0);
  this.time = 0;
  this.width = 5;
  this.height = 5;
  this.hp = 1;
};

Entity.prototype.update = function (dt) {
  this.time += dt;
};

Entity.prototype.collisionRect = function () {
  this._collisionRect.x = this.position.x - this.width / 2;
  this._collisionRect.y = this.position.y - this.height / 2;
  this._collisionRect.width = this.width;
  this._collisionRect.height = this.height;

  return this._collisionRect;
};

//
// Dronie Class
//
function Dronie(position, speed, direction) {
  Entity.call(this, position, speed, direction);

  this.width = 20;
  this.height = 20;

  this.movingLeft = false;
  this.movingRight = false;
}
Dronie.prototype = Object.create(Entity.prototype);

Dronie.prototype.updateDirection = function () {
  var x = 0;
  if (this.movingLeft) {
    x -= 1;
  }
  if (this.movingRight) {
    x += 1;
  }

  this.direction.set(x, 0);
};

Dronie.prototype.moveRight = function (enable) {
  this.movingRight = enable;
  this.updateDirection();
};

Dronie.prototype.moveLeft = function (enable) {
  this.movingLeft = enable;
  this.updateDirection();
};

Dronie.prototype.shoot = function () {
  var dronieBulletCount = 0;

  var bullets = game.bullets();
  for (var i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].type === "dronie") {
      dronieBulletCount++;
    }
  }

  if (dronieBulletCount === 0) {
    var proj = game.bulletPool().take();
    proj.position.set(this.position.x, this.position.y);
    proj.speed = 180;
    proj.direction.set(0, -1);
    proj.type = "dronie";

    game.addEntity(proj);
  }
};

Dronie.prototype.update = function (dt) {
  Entity.prototype.update.call(this, dt);
};

//
// Exploding Dronie Booom!
//
function DronieExplosion(position, duration) {
  Entity.call(this, position, 0, new Vec2D(0, 0));

  this.width = 20;
  this.height = 20;
  this.duration = duration;
}
DronieExplosion.prototype = Object.create(Entity.prototype);

DronieExplosion.prototype.update = function (dt) {
  Entity.prototype.update.call(this, dt);
  if (this.time > this.duration) {
    this.hp = 0;
  }
};

//
// Punk Class
//
function Punk(position, speed, direction, rank) {
  Entity.call(this, position, speed, direction);

  this.width = 13;
  this.height = 19;
  this.rank = rank;

  this.dropTarget = 0;
  this.dropAmount = 1;
  this.timer = 0;
  this.shootPercent = 10;
  this.shootWait = Math.random() * 5;
}
Punk.prototype = Object.create(Entity.prototype);

Punk.prototype.init = function () {
  Entity.prototype.init.call(this);

  this.width = 13;
  this.height = 19;
  this.rank = 0;

  this.dropTarget = 0;
  this.dropAmount = 1;
  this.timer = 0;
  this.shootPercent = 10;
  this.shootWait = Math.random() * 5;
};

Punk.prototype.clone = function () {
  return new Punk(this.position, this.speed, this.direction, this.rank);
};

Punk.prototype.update = (function () {
  var p = new Vec2D(0, 0);

  function existsUnderneath(e) {
    var rect = e.collisionRect();
    if (!rect) {
      return false;
    }
    return p.y <= rect.top() && rect.left() <= p.x && p.x <= rect.right();
  }

  return function update(dt) {
    // Edge collision detect
    var punksLeft = game.punksRect().left(),
      punksRight = game.punksRect().right(),
      edgeMargin = 5,
      gameLeftEdge = game.gameFieldRect().left() + edgeMargin,
      gameRightEdge = game.gameFieldRect().right() - edgeMargin;

    Entity.prototype.update.call(this, dt);

    // Drop if the punk hits a corner
    if (
      (this.direction.x < 0 && punksLeft < gameLeftEdge) ||
      (this.direction.x > 0 && punksRight > gameRightEdge)
    ) {
      this.dropTarget += this.dropAmount;
    }

    // Find Direction
    if (this.position.y < this.dropTarget) {
      this.direction.set(0, 1);
    } else if (this.direction.y > 0) {
      var x = punksRight > gameRightEdge ? -1 : 1;

      this.direction.set(x, 0);
    }

    // Find Firing Weapon
    p.set(this.position.x, this.position.y + 5);

    this.timer += dt;
    if (this.timer > this.shootWait) {
      this.timer = 0;
      this.shootWait = 1 + Math.random() * 4;

      if (
        returnRandInt(100) < this.shootPercent &&
        !game.punks().find(existsUnderneath)
      ) {
        var proj = game.bulletPool().take();
        proj.position.set(p.x, p.y);
        proj.speed = 60;
        proj.direction.set(0, 1);
        proj.type = "enemy";

        game.addEntity(proj);
      }
    }
  };
})();

//
// Bullet
//
function Bullet(position, speed, direction, type) {
  Entity.call(this, position, speed, direction);

  this.width = 1;
  this.height = 5;
  this.type = type;
}
Bullet.prototype = Object.create(Entity.prototype);

Bullet.prototype.init = function () {
  Entity.prototype.init.call(this);

  this.width = 1;
  this.height = 5;
  this.type = "";
};

Bullet.prototype.clone = function () {
  return new Bullet(this.position, this.speed, this.direction, this.type);
};

//
// Explosion Object
//
function Explosion(position, speed, direction, rank, duration) {
  Entity.call(this, position, speed, direction);

  this.width = 13;
  this.height = 10;

  this.rank = rank;
  this.duration = duration;
}
Explosion.prototype = Object.create(Entity.prototype);

Explosion.prototype.init = function () {
  Entity.prototype.init.call(this);

  this.width = 13;
  this.height = 10;

  this.rank = 0;
  this.duration = 0;
};

Explosion.prototype.clone = function () {
  return new Explosion(
    this.position,
    this.speed,
    this.direction,
    this.rank,
    this.duration
  );
};

Explosion.prototype.update = function (dt) {
  Entity.prototype.update.call(this, dt);

  if (this.time > this.duration) {
    this.hp = 0;
  }
};

//
// Sprite Object
//
function Sprite(imgPath, frames, frameRate, r, g, b) {
  var spriteImage = new Image();
  var image = new Image();

  spriteImage.onload = function () {
    var spriteCanvas = document.createElement("canvas");
    var spriteContext = spriteCanvas.getContext("2d");

    spriteCanvas.width = spriteImage.width;
    spriteCanvas.height = spriteImage.height;

    spriteContext.drawImage(
      spriteImage,
      0,
      0,
      spriteImage.width,
      spriteImage.height,
      0,
      0,
      spriteCanvas.width,
      spriteCanvas.height
    );

    var sourceData = spriteContext.getImageData(
      0,
      0,
      spriteImage.width,
      spriteImage.height
    );

    // For color changing!
    // var data = sourceData.data;
    // for (var i = 0; i < data.length; i += 4) {
    //   data[i] = r;
    //   data[i + 1] = g;
    //   data[i + 2] = b;
    //   // Leave the alpha channel alone
    // }
    spriteContext.putImageData(sourceData, 0, 0);

    image.src = spriteCanvas.toDataURL("image/png");
  };

  spriteImage.src = imgPath;

  this.frames = frames;
  this.frameRate = frameRate;
  this.timer = 0;
  this.currentFrame = 0;
  this.image = image;
}

Sprite.prototype.update = function (dt) {
  this.timer += dt;
  if (this.timer > 1 / this.frameRate) {
    this.timer = 0;

    this.currentFrame = (this.currentFrame + 1) % this.frames;
  }
};

//
// Renderer
//
var renderer = (function () {
  var _canvas = document.getElementById("game-layer"),
    _context = _canvas.getContext("2d"),
    _bulletColors = { dronie: "#9FEAA4", enemy: "#FCE38F" };

  var _dronieSprite = new Sprite(url + "/docs/assets/dronie.png", 1, 1, 255, 255, 0);
  var _dronieExplosionSprite = new Sprite(
    url + "/docs/assets/dead-dronie.png",
    2,
    4,
    255,
    255,
    0
  );

  var _enemySprites = [
    new Sprite(url + "/docs/assets/punk2338.png", 2, 2, 150, 7, 7),
    new Sprite(url + "/docs/assets/punk2338.png", 2, 2, 150, 89, 7),
    new Sprite(url + "/docs/assets/punk5217.png", 2, 2, 56, 150, 7),
    new Sprite(url + "/docs/assets/punk5217.png", 2, 2, 7, 150, 122),
    new Sprite(url + "/docs/assets/punk3100.png", 2, 2, 46, 7, 150),
  ];

  var _explosionSprites = [
    new Sprite(url + "/docs/assets/explosion.png", 1, 1, 150, 7, 7),
    new Sprite(url + "/docs/assets/explosion.png", 1, 1, 150, 89, 7),
    new Sprite(url + "/docs/assets/explosion.png", 1, 1, 56, 150, 7),
    new Sprite(url + "/docs/assets/explosion.png", 1, 1, 7, 150, 122),
    new Sprite(url + "/docs/assets/explosion.png", 1, 1, 46, 7, 150),
  ];

  var _sprites = [].concat(
    _dronieSprite,
    _dronieExplosionSprite,
    _enemySprites,
    _explosionSprites
  );

  var _previousLives = 0;

  function _drawSprite(sprite, entity) {
    _context.drawImage(
      sprite.image,
      (sprite.image.width / sprite.frames) * sprite.currentFrame,
      0,
      sprite.image.width / sprite.frames,
      sprite.image.height,
      entity.position.x - entity.width / 2,
      entity.position.y - entity.height / 2,
      entity.width,
      entity.height
    );
  }

  function _drawRect(color, entity) {
    _context.fillStyle = color;
    _context.fillRect(
      entity.position.x - entity.width / 2,
      entity.position.y - entity.height / 2,
      entity.width,
      entity.height
    );
  }

  function _updateUI() {
    const _scoreElement = document.getElementById("score");
    const _highScoresElement = document.getElementById("highscores");
    const _startscreenElement = document.getElementById("startscreen");
    const _livesElement = document.getElementById("lives");

    // Update Score
    var scoreText = Math.round(game.score());
    if (_scoreElement.innerHTML != scoreText) {
      _scoreElement.innerHTML = scoreText;
    }

    // Update Dronie Lives
    if (_previousLives !== game.livesRemaining()) {
      _previousLives = game.livesRemaining();

      while (_livesElement.hasChildNodes()) {
        _livesElement.removeChild(_livesElement.firstChild);
      }

      _livesElement.innerHTML = "&nbsp;";

      for (i = 0; i < game.livesRemaining(); i++) {
        var img = document.createElement("img");
        img.src = "/docs/assets/dronie.png";
        img.style.height = "24px";
        img.style.width = "24px";

        _livesElement.appendChild(img);
      }
    }

    if (game.gameOver()) {
      var scores = game.highScores();
      for (i = 0; i < scores.length; i++) {
        var elem = document.getElementById("score" + i);
        elem.innerHTML = scores[i];
      }

      _highScoresElement.style.display = "flex";
      _startscreenElement.style.display = "none";
    } else {
      _highScoresElement.style.display = "none";
      _startscreenElement.style.display = "none";
    }
  }

  function _render(dt) {
    var i,
      entity,
      entities = game.entities();

    _scaleFactor = _canvas.clientWidth / game.gameFieldRect().width;
    _scaleFactor = Math.max(1, Math.min(2, _scaleFactor));
    _canvas.width = game.gameFieldRect().width * _scaleFactor;
    _canvas.height = game.gameFieldRect().height * _scaleFactor;
    _context.scale(_scaleFactor, _scaleFactor);

    for (i = _sprites.length - 1; i >= 0; i--) {
      _sprites[i].update(dt);
    }

    // _context.fillStyle = "black";
    // _context.fillRect(0, 0, _canvas.width, _canvas.height);

    for (i = entities.length - 1; i >= 0; i--) {
      entity = entities[i];

      if (entity instanceof Punk) {
        _drawSprite(_enemySprites[entity.rank], entity);
      } else if (entity instanceof Dronie) {
        _drawSprite(_dronieSprite, entity);
      } else if (entity instanceof DronieExplosion) {
        _drawSprite(_dronieExplosionSprite, entity);
      } else if (entity instanceof Explosion) {
        _drawSprite(_explosionSprites[entity.rank], entity);
      } else if (entity instanceof Bullet) {
        _drawRect(_bulletColors[entity.type], entity);
      }
    }

    _context.strokeStyle = "#9FEAA4";
    _context.moveTo(0, game.gameFieldRect().height);
    _context.lineTo(game.gameFieldRect().width, game.gameFieldRect().height);
    _context.stroke();

    _updateUI();
  }

  return {
    render: _render,
  };
})();

//
// Physics
//
var physics = (function () {
  var velocityStep = new Vec2D(0, 0);

  function _collide(entity0, entity1) {
    if (
      entity0 &&
      entity1 &&
      entity0.collisionRect().intersects(entity1.collisionRect())
    ) {
      entity0.hp -= 1;
      entity1.hp -= 1;
    }
  }

  function _update(dt) {
    var i,
      j,
      e,
      entities = game.entities(),
      punks = game.punks(),
      bullets = game.bullets(),
      dronie = game.dronie();

    for (i = entities.length - 1; i >= 0; i--) {
      e = entities[i];
      velocityStep.set(e.direction.x, e.direction.y);
      velocityStep.scalarMultiply(e.speed * dt);

      e.position.add(velocityStep);
    }

    // Collision Detection
    // Dronie vs All punks
    for (i = punks.length - 1; i >= 0; i--) {
      _collide(dronie, punks[i]);
    }

    // Bullets vs other Entities
    for (i = bullets.length - 1; i >= 0; i--) {
      // Punk Bullets vs Dronie
      if (bullets[i].type === "enemy") {
        _collide(bullets[i], dronie);
      }

      // Dronie Bullets vs Enemies
      else if (bullets[i].type === "dronie") {
        for (j = punks.length - 1; j >= 0; j--) {
          _collide(bullets[i], punks[j]);
        }
      }
    }

    // Punk vs floor (special case)
    if (
      game.punksRect() &&
      dronie &&
      game.punksRect().bottom() > dronie.collisionRect().bottom()
    ) {
      game.setGameOver();
    }

    // Bullet vs floor (special case)
    for (i = bullets.length - 1; i >= 0; i--) {
      var proj = bullets[i];
      if (!game.gameFieldRect().intersects(proj.collisionRect())) {
        proj.hp -= 1;
      }
    }
  }

  return {
    update: _update,
  };
})();

//
// Cloneable Pool
//
function CloneablePool(cloneable) {
  this.template = cloneable;

  this.pool = [];
}

CloneablePool.prototype.take = function () {
  // If there is an available object, return it.
  for (var i = this.pool.length - 1; i >= 0; i--) {
    if (this.pool[i].available) {
      this.pool[i].available = false;
      this.pool[i].object.init();
      return this.pool[i].object;
    }
  }

  // Otherwise, create a new one and return it.
  var obj = this.template.clone();
  obj.init();
  this.pool.push({ available: false, object: obj });
  return obj;
};

CloneablePool.prototype.putBack = function (cloneable) {
  // Mark the object as available again.
  for (var i = this.pool.length - 1; i >= 0; i--) {
    if (this.pool[i].object === cloneable) {
      this.pool[i].available = true;
      break;
    }
  }
};

//
// Main Game Loop
//
var game = (function () {
  var _entities,
    _punks,
    _dronie,
    _gameFieldRect,
    _started = false,
    _bullets,
    _score,
    _highScores,
    _livesRemaining,
    _gameOver,
    _updateFunc,
    _enemyPool = new CloneablePool(
      new Punk(new Vec2D(0, 0), 0, new Vec2D(0, 0), 0)
    ),
    _bulletPool = new CloneablePool(
      new Bullet(new Vec2D(0, 0), 0, new Vec2D(0, 0), "")
    ),
    _explosionPool = new CloneablePool(
      new Explosion(new Vec2D(0, 0), 0, new Vec2D(0, 0), 0, 0)
    );

  function mutableRemoveIndex(array, index) {
    if (index >= array.length) {
      console.error("ERROR: mutableRemoveIndex: index is out of range");
      return;
    }

    if (array.length <= 0) {
      console.error("ERROR: mutableRemoveIndex: empty array");
      return;
    }

    array[index] = array[array.length - 1];
    array[array.length - 1] = undefined;

    array.length = array.length - 1;
  }

  //Start Settings
  function _start() {
    _lastFrameTime = 0;

    _entities = [];
    _punks = [];
    _gameFieldRect = new Rect(0, 0, 300, 180);
    _punksRect = new Rect(0, 0, 0, 0);
    _enemySpeed = 10;
    _enemyFirePercent = 10;
    _enemyDropAmount = 1;

    _bullets = [];
    _score = 0;
    _livesRemaining = 2;
    _gameOver = false;

    //Add dronie to game
    this.addEntity(new Dronie(new Vec2D(150, 170), 100, new Vec2D(0, 0)));

    _highScores = [];

    if (typeof Storage !== "undefined") {
      try {
        _highScores = JSON.parse(localStorage.invadersScores);
      } catch (e) {
        _highScores = [];
      }
    }

    if (!_started) {
      _updateFunc = this.update.bind(this);
      window.requestAnimationFrame(_updateFunc);
      _started = true;
    }
  }

  function _addEntity(entity) {
    _entities.push(entity);

    if (entity instanceof Dronie) {
      _dronie = entity;
    }

    if (entity instanceof Punk) {
      _punks.push(entity);
    }

    if (entity instanceof Bullet) {
      _bullets.push(entity);
    }
  }

  function _removeEntities(entities) {
    if (entities.length === 0) {
      return;
    }

    for (var i = entities.length - 1; i >= 0; i--) {
      var idx = _entities.indexOf(entities[i]);
      if (idx >= 0) {
        mutableRemoveIndex(_entities, idx);
      }

      idx = _punks.indexOf(entities[i]);
      if (idx >= 0) {
        mutableRemoveIndex(_punks, idx);
        _enemyPool.putBack(entities[i]);
      }

      idx = _bullets.indexOf(entities[i]);
      if (idx >= 0) {
        mutableRemoveIndex(_bullets, idx);
        _bulletPool.putBack(entities[i]);
      }

      _explosionPool.putBack(entities[i]);
    }

    if (entities.includes(_dronie)) {
      _dronie = undefined;
    }
  }

  function _addScore(score) {
    _highScores.push(score);
    _highScores.sort(function (a, b) {
      return b - a;
    });
    _highScores = _highScores.slice(0, 5);

    if (typeof Storage !== "undefined") {
      localStorage.invadersScores = JSON.stringify(_highScores);
    }
  }

  function _update(time) {
    var i,
      j,
      dt = Math.min((time - _lastFrameTime) / 1000, 3 / 60);

    _lastFrameTime = time;

    if (_gameOver) {
      _started = false;
      return;
    }

    // Update Physics
    physics.update(dt);

    // Calculate the bounding rectangle around the punks
    if (_punks.length > 0) {
      // Prime _punksRect
      var rect = _punks[0].collisionRect();
      _punksRect.set(rect.x, rect.y, rect.width, rect.height);

      // Calculate the rest of the punksRect
      for (i = _punks.length - 1; i >= 0; i--) {
        _punksRect.union(_punks[i].collisionRect());
      }
    }

    // Update Entities
    for (i = _entities.length - 1; i >= 0; i--) {
      _entities[i].update(dt);
    }

    // Delete dead objects.
    var removeEntities = [];
    for (i = _entities.length - 1; i >= 0; i--) {
      var e = _entities[i];

      if (e.hp <= 0) {
        removeEntities.push(e);

        if (e instanceof Punk) {
          if (e.rank == 0 || e.rank == 1) {
            _score += 10;
          } else if (e.rank == 2 || e.rank == 3) {
            _score += 20;
          } else {
            _score += 30;
          }

          var exp = _explosionPool.take();
          exp.position.set(e.position.x, e.position.y);
          exp.speed = e.speed;
          exp.direction.set(e.direction.x, e.direction.y);
          exp.rank = e.rank;
          exp.duration = 5 / 60;

          this.addEntity(exp);
        } else if (e instanceof Dronie) {
          _livesRemaining--;
          this.addEntity(new DronieExplosion(e.position, 2));
        } else if (e instanceof DronieExplosion) {
          this.addEntity(new Dronie(new Vec2D(150, 170), 90, new Vec2D(0, 0)));
        }
      }
    }

    _removeEntities(removeEntities);

    // Update Punk Speed
    var speed = _enemySpeed + _enemySpeed * (1 - _punks.length / 50);
    for (i = _punks.length - 1; i >= 0; i--) {
      _punks[i].speed = speed;
    }

    // Create new Enemies if there are 0
    if (_punks.length === 0) {
      for (i = 0; i < 10; i++) {
        for (j = 0; j < 5; j++) {
          var dropTarget = 10 + j * 20,
            enemy = _enemyPool.take();

          enemy.position.set(50 + i * 20, dropTarget - 100);
          enemy.direction.set(1, 0);
          enemy.speed = _enemySpeed;
          enemy.rank = 4 - j;

          enemy.dropTarget = dropTarget;
          enemy.shootPercent = _enemyFirePercent;
          enemy.dropAmount = _enemyDropAmount;

          this.addEntity(enemy);
        }
      }

      _enemySpeed += 5;
      _enemyFirePercent += 5;
      _enemyDropAmount += 1;
      _livesRemaining += 1;
    }

    // Check for Game Over
    if (_livesRemaining < 0 && !_gameOver) {
      _setGameOver();
    }

    // Render the frame
    renderer.render(dt);

    window.requestAnimationFrame(_updateFunc);
  }

  function _setGameOver() {
    _gameOver = true;
    _addScore(Math.round(game.score()));
  }

  return {
    start: _start,
    update: _update,
    addEntity: _addEntity,
    entities: function () {
      return _entities;
    },
    punks: function () {
      return _punks;
    },
    bullets: function () {
      return _bullets;
    },
    dronie: function () {
      return _dronie;
    },
    gameFieldRect: function () {
      return _gameFieldRect;
    },
    punksRect: function () {
      return _punksRect;
    },
    score: function () {
      return _score;
    },
    highScores: function () {
      return _highScores;
    },
    livesRemaining: function () {
      return _livesRemaining;
    },
    gameOver: function () {
      return _gameOver;
    },
    setGameOver: _setGameOver,
    bulletPool: function () {
      return _bulletPool;
    },
  };
})();

//
// Dronie Actions
//
var dronieActions = (function () {
  var _ongoingActions = [];

  var startActs = {
    moveLeft: function () {
      if (game.dronie()) game.dronie().moveLeft(true);
    },
    moveRight: function () {
      if (game.dronie()) game.dronie().moveRight(true);
    },
    shoot: function () {
      if (game.dronie()) game.dronie().shoot();
    },
  };

  var endActs = {
    moveLeft: function () {
      if (game.dronie()) game.dronie().moveLeft(false);
    },
    moveRight: function () {
      if (game.dronie()) game.dronie().moveRight(false);
    },
  };

  function _startAction(id, dronieAction) {
    if (dronieAction === undefined) {
      return;
    }

    var f;

    if ((f = startActs[dronieAction])) f();

    _ongoingActions.push({ identifier: id, dronieAction: dronieAction });
  }

  function _endAction(id) {
    var f;
    var idx = _ongoingActions.findIndex(function (a) {
      return a.identifier === id;
    });

    if (idx >= 0) {
      if ((f = endActs[_ongoingActions[idx].dronieAction])) f();
      _ongoingActions.splice(idx, 1); // remove action at idx
    }
  }

  return {
    startAction: _startAction,
    endAction: _endAction,
  };
})();

//
// Touch
//
function getOffsetLeft(elem) {
  var offsetLeft = 0;
  do {
    if (!isNaN(elem.offsetLeft)) {
      offsetLeft += elem.offsetLeft;
    }
  } while ((elem = elem.offsetParent));
  return offsetLeft;
}

function getOffsetTop(elem) {
  var offsetTop = 0;
  do {
    if (!isNaN(elem.offsetTop)) {
      offsetTop += elem.offsetTop;
    }
  } while ((elem = elem.offsetParent));
  return offsetTop;
}

function getRelativeTouchCoords(touch) {
  var scale = game.gameFieldRect().width / canvas.clientWidth;
  var x = touch.pageX - getOffsetLeft(canvas);
  var y = touch.pageY - getOffsetTop(canvas);

  return { x: x * scale, y: y * scale };
}

function touchStart(e) {
  var touches = e.changedTouches,
    touchLocation,
    dronieAction;

  e.preventDefault();

  for (var i = touches.length - 1; i >= 0; i--) {
    touchLocation = getRelativeTouchCoords(touches[i]);

    if (touchLocation.x < game.gameFieldRect().width * (1 / 5)) {
      dronieAction = "moveLeft";
    } else if (touchLocation.x < game.gameFieldRect().width * (4 / 5)) {
      dronieAction = "shoot";
    } else {
      dronieAction = "moveRight";
    }

    dronieActions.startAction(touches[i].identifier, dronieAction);
  }
}

function touchEnd(e) {
  var touches = e.changedTouches;
  e.preventDefault();

  for (var i = touches.length - 1; i >= 0; i--) {
    dronieActions.endAction(touches[i].identifier);
  }
}

var canvas = document.getElementById("game-layer");
canvas.addEventListener("touchstart", touchStart);
canvas.addEventListener("touchend", touchEnd);
canvas.addEventListener("touchcancel", touchEnd);

//
// Keyboard
//
var keybinds = { 32: "shoot", 37: "moveLeft", 39: "moveRight" };

function keyDown(e) {
  var x = e.which || e.keyCode; // which or keyCode depends on browser support

  if (keybinds[x] !== undefined) {
    e.preventDefault();
    dronieActions.startAction(x, keybinds[x]);
  }
}

function keyUp(e) {
  var x = e.which || e.keyCode;

  if (keybinds[x] !== undefined) {
    e.preventDefault();
    dronieActions.endAction(x);
  }
}

document.body.addEventListener("keydown", keyDown);
document.body.addEventListener("keyup", keyUp);
