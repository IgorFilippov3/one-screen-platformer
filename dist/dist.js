function Hero(game, x, y) {
  Phaser.Sprite.call(this, game , x, y, 'hero');
  this.anchor.set(0.5, 0.5);
  this.game.physics.enable(this);
  this.body.collideWorldBounds = true;
}
Hero.prototype = Object.create(Phaser.Sprite.prototype);
Hero.prototype.constructor = Hero;

Hero.prototype.move = function(direction) {
  const SPEED = 200;
  this.body.velocity.x = direction * SPEED;
  // this.x += direction * 2.5; // 2.5px each frame
};

Hero.prototype.jump = function() {
  const JUMP_SPEED = 600;
  let canJump = this.body.touching.down; // проверка касается ли герой чего-либо снизу.

  if(canJump) {
      this.body.velocity.y = -JUMP_SPEED;
  }
  return canJump;
};

Hero.prototype.bounce = function() {
  const BOUNCE_SPEED = 200;
  this.body.velocity.y = -BOUNCE_SPEED; // чем выше герой, тем меньше velocity.y
};

window.onload = function() {
  let game = new Phaser.Game(960, 600, Phaser.AUTO, 'game');
  game.state.add('play', PlayState);
  game.state.start('play');
};

PlayState = {};

PlayState.init = function() {
  this.keys = this.game.input.keyboard.addKeys({
    left: Phaser.KeyCode.LEFT,
    right: Phaser.KeyCode.RIGHT,
    up: Phaser.KeyCode.UP
  });

  this.keys.up.onDown.add(function(){
    let didJump = this.hero.jump(); // Сначала выполняется метод. Персонаж прыгает и только потом didJump получает то что метод ретурнит.
    if(didJump) {
      this.sfx.jump.play(); // звук прыжка.
      // this.hero.jump(); - старый прыжок
    }
  }, this);
  this.game.renderer.renderSession.roundPixels = true;

  this.coinPickupCount = 0;
};

PlayState.preload = function() {
  let load = this.game.load;
  // this.game is reference to the Phaser.Game
  load.image('background', 'images/background.png');
  load.image('ground', 'images/ground.png');
  load.image('grass:8x1', 'images/grass_8x1.png');
  load.image('grass:6x1', 'images/grass_6x1.png');
  load.image('grass:4x1', 'images/grass_4x1.png');
  load.image('grass:2x1', 'images/grass_2x1.png');
  load.image('grass:1x1', 'images/grass_1x1.png');
  load.image('hero', 'images/hero_stopped.png');
  load.image('invisible-wall', 'images/invisible_wall.png');
  load.image('icon:coin', 'images/coin_icon.png');
  load.image('font:numbers', 'images/numbers.png');

  load.spritesheet('coin', 'images/coin_animated.png', 22, 22);
  load.spritesheet('spider', 'images/spider.png', 42, 32);

  load.json('level:1', 'data/level01.json');

  load.audio('sfx:jump', 'audio/jump.wav'); // jump sound
  load.audio('sfx:coin', 'audio/coin.wav'); // pick coin sound
  load.audio('sfx:stomp', 'audio/stomp.wav'); // when hero collide with spider
};

PlayState.create = function() {
  this.game.add.image(0, 0, 'background');
  this._loadLevel(this.game.cache.getJSON('level:1'));
  this._createHud();

  this.sfx = {
    jump: this.game.add.audio('sfx:jump'),
    coin: this.game.add.audio('sfx:coin'),
    stomp: this.game.add.audio('sfx:stomp')
  };


};

PlayState.update = function() {
  this._handleCollisions();
  this._handleInput();
};

PlayState._handleInput = function() {
  if(this.keys.left.isDown) {
    this.hero.move(-1);
  }
  else if(this.keys.right.isDown) {
    this.hero.move(1);
  }
  else {
    this.hero.move(0); // stop char;
  }
};

PlayState._handleCollisions = function() {
  var arcade = this.game.physics.arcade;

  arcade.collide(this.hero, this.platforms);
  arcade.collide(this.spiders, this.platforms);
  arcade.collide(this.spiders, this.enemyWalls);
  // null is arg for filter sprites
  // this._onHeroVsCoin is callback that will be executed every time the main character touches a coin
  arcade.overlap(this.hero, this.coins, this._onHeroVsCoin, null, this);
  arcade.overlap(this.hero, this.spiders, this._onHeroVsEnemy, null, this);

};

PlayState._onHeroVsCoin = function(hero, coin) {
  this.coinPickupCount++;
  this.sfx.coin.play();
  coin.kill();
  // sound when hero pick a coin

};

PlayState._onHeroVsEnemy = function(hero, enemy) {
  if(hero.body.velocity.y > 0) {
    hero.bounce(); // герой слегка подпрыгивает
    enemy.die();
    this.sfx.stomp.play();
  } else {
    this.sfx.stomp.play();
    this.game.state.restart();
  }


};

PlayState._loadLevel = function(data) {
    this.platforms = this.game.add.group();
    this.coins = this.game.add.group();
    this.spiders = this.game.add.group();
    this.enemyWalls = this.game.add.group();
    this.enemyWalls.visible = false;

    const GRAVITY = 1200;
    this.game.physics.arcade.gravity.y = GRAVITY;

    data.platforms.forEach(this._spawnPlatform, this);
    data.coins.forEach(this._spawnCoin, this);

    this._spawnCharacters({ hero: data.hero, spiders: data.spiders });
};

PlayState._spawnCoin = function(coin) {
  let sprite = this.coins.create(coin.x, coin.y, 'coin');
  sprite.anchor.set(0.5, 0.5);
  sprite.animations.add('rotate', [0, 1, 2, 1], 6, true); // 6 frames per second, true - loop;
  sprite.animations.play('rotate');

  this.game.physics.enable(sprite);
  sprite.body.allowGravity = false;
};

PlayState._spawnPlatform = function(platform) {
    let sprite = this.platforms.create(
      platform.x, platform.y, platform.image
    );
    this.game.physics.enable(sprite);
    sprite.body.allowGravity = false;
    sprite.body.immovable = true;
    // this.game.add.sprite(platform.x, platform.y, platform.image);
    this._spawnEnemyWall(platform.x, platform.y, 'left');
    this._spawnEnemyWall(platform.x + sprite.width, platform.y, 'right');

};

PlayState._spawnCharacters = function(data) {
    this.hero = new Hero(this.game, data.hero.x, data.hero.y);
    this.game.add.existing(this.hero);

    data.spiders.forEach(function(spider){
      let sprite = new Spider(this.game, spider.x, spider.y);
      this.spiders.add(sprite);
    }, this);
};

PlayState._spawnEnemyWall = function(x , y, side) {
  let sprite = this.enemyWalls.create(x, y, 'invisible-wall');
  sprite.anchor.set(side === 'left' ? 1 : 0, 1);
  this.game.physics.enable(sprite);
  sprite.body.immovable = true;
  sprite.body.allowGravity = false;
  // sprite.visible = false;
};

PlayState._createHud = function() {
  let coinIcon = this.game.make.image(0, 0, 'icon:coin');

  this.hud = this.game.add.group();
  this.hud.add(coinIcon);
  this.hud.position.set(10, 10);
};

function Spider(game, x, y) {
  Phaser.Sprite.call(this, game , x, y, 'spider');
  this.anchor.set(0.5);
  this.animations.add('crawl', [0,1,2], 8, true);
  this.animations.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);
  this.animations.play('crawl');

  this.game.physics.enable(this);
  this.body.collideWorldBounds = true;
  this.body.velocity.x = Spider.SPEED;
}

Spider.SPEED = 100;

Spider.prototype = Object.create(Phaser.Sprite.prototype); // говорим интерпретатору, что наш конструктор это спрайт
Spider.prototype.constructor = Spider;

Spider.prototype.update = function() {
  if(this.body.touching.right || this.body.blocked.right) {
    this.body.velocity.x = -Spider.SPEED; // поворот в лево
  }
  else if(this.body.touching.left || this.body.blocked.left) {
    this.body.velocity.x = Spider.SPEED; // поворот в право
  }
};

Spider.prototype.die = function() {
  this.body.enable = false;
  this.animations.play('die').onComplete.addOnce(function(){
    this.kill();
  }, this);
};
