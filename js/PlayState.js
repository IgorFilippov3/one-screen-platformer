PlayState = {};

const LEVEL_COUNT = 2;

PlayState.init = function(data) {
  this.level = (data.level || 0) % LEVEL_COUNT;

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
  this.hasKey = false;
};

PlayState.preload = function() {
  let load = this.game.load;
  // this.game is reference to the Phaser.Game
  load.json('level:1', 'data/level01.json');
  load.json('level:0', 'data/level00.json');

  load.image('background', 'images/background.png');
  load.image('ground', 'images/ground.png');
  load.image('grass:8x1', 'images/grass_8x1.png');
  load.image('grass:6x1', 'images/grass_6x1.png');
  load.image('grass:4x1', 'images/grass_4x1.png');
  load.image('grass:2x1', 'images/grass_2x1.png');
  load.image('grass:1x1', 'images/grass_1x1.png');
  // load.image('hero', 'images/hero_stopped.png');
  load.image('invisible-wall', 'images/invisible_wall.png');
  load.image('icon:coin', 'images/coin_icon.png');
  load.image('font:numbers', 'images/numbers.png');
  load.image('key', 'images/key.png');

  load.spritesheet('coin', 'images/coin_animated.png', 22, 22);
  load.spritesheet('spider', 'images/spider.png', 42, 32);
  load.spritesheet('hero', 'images/hero.png', 36, 42);
  load.spritesheet('door', 'images/door.png', 42, 66);
  load.spritesheet('icon:key', 'images/key_icon.png', 34, 30);
  load.spritesheet('grue', 'images/grue.png', 56, 71);

  load.audio('sfx:jump', 'audio/jump.wav'); // jump sound
  load.audio('sfx:coin', 'audio/coin.wav'); // pick coin sound
  load.audio('sfx:stomp', 'audio/stomp.wav'); // when hero collide with spider
  load.audio('sfx:key', 'audio/key.wav'); // when pick key
  load.audio('sfx:door', 'audio/door.wav'); // when open the door
};

PlayState.create = function() {
  this.game.add.image(0, 0, 'background');
  this._loadLevel(this.game.cache.getJSON(`level:${this.level}`));
  this._createHud();

  this.sfx = {
    jump: this.game.add.audio('sfx:jump'),
    coin: this.game.add.audio('sfx:coin'),
    stomp: this.game.add.audio('sfx:stomp'),
    key: this.game.add.audio('sfx:key'),
    door: this.game.add.audio('sfx:door')
  };


};

PlayState.update = function() {
  this._handleCollisions();
  this._handleInput();
  this.coinFont.text = `x${this.coinPickupCount}`;
  this.keyIcon.frame = this.hasKey ? 1 : 0;
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
  arcade.collide(this.grue, this.platforms);
  arcade.collide(this.grue, this.enemyWalls);
  // null is arg for filter sprites
  // this._onHeroVsCoin is callback that will be executed every time the main character touches a coin
  arcade.overlap(this.hero, this.coins, this._onHeroVsCoin, null, this);
  arcade.overlap(this.hero, this.spiders, this._onHeroVsEnemy, null, this);
  arcade.overlap(this.hero, this.key, this._onHeroVsKey, null, this);
  arcade.overlap(this.hero, this.door, this._onHeroVsDoor, function(hero, door){
    return this.hasKey && hero.body.touching.down // Если герой не имеет ключа или не касается земли, то колбек _onHeroVsDoor не сработает
  }, this);

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
    this.game.state.restart(true, false, { level: this.level });
  }
};

PlayState._onHeroVsKey = function(hero, key) {
  this.sfx.key.play();
  key.kill();
  this.hasKey = true;
};

PlayState._onHeroVsDoor = function(hero, door) {
  this.sfx.door.play();
  if(this.level === 1) {
    alert(`Congratulations, you won with score - ${this.coinPickupCount}`);
    this.game.state.restart(true, false, { level: 0 });
  } else {
    this.game.state.restart(true, false, { level: this.level + 1 });
  }


};

PlayState._loadLevel = function(data) {
    this.bgDecoration = this.game.add.group();
    this.platforms = this.game.add.group();
    this.coins = this.game.add.group();
    this.spiders = this.game.add.group();
    this.enemyWalls = this.game.add.group();

    this.enemyWalls.visible = false;

    const GRAVITY = 1200;
    this.game.physics.arcade.gravity.y = GRAVITY;

    data.platforms.forEach(this._spawnPlatform, this);
    data.coins.forEach(this._spawnCoin, this);

    this._spawnCharacters({ hero: data.hero, spiders: data.spiders, grue: data.grue });
    this._spawnDoor(data.door.x, data.door.y);
    this._spawnKey(data.key.x, data.key.y);
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

    if(data.grue.x && data.grue.y) {
      this.grue = new Grue(this.game, data.grue.x, data.grue.y);
      this.game.add.existing(this.grue);
    }

};

PlayState._spawnEnemyWall = function(x , y, side) {
  let sprite = this.enemyWalls.create(x, y, 'invisible-wall');
  sprite.anchor.set(side === 'left' ? 1 : 0, 1);
  this.game.physics.enable(sprite);
  sprite.body.immovable = true;
  sprite.body.allowGravity = false;
  // sprite.visible = false;
};

PlayState._createHud = function() { // панелька со счетчиком
  this.keyIcon = this.game.make.image(0, 19, 'icon:key');
  this.keyIcon.anchor.set(0, 0.5);

  const NUMBERS_STR = '0123456789X ';
  this.coinFont = this.game.add.retroFont('font:numbers', 20, 26, NUMBERS_STR, 6);

  let coinIcon = this.game.make.image(this.keyIcon.width + 10, 0, 'icon:coin');

  this.hud = this.game.add.group();
  this.hud.add(coinIcon);
  this.hud.position.set(10, 10);

  let coinScoreImg = this.game.make.image(coinIcon.x + coinIcon.width, coinIcon.height / 2, this.coinFont);
  coinScoreImg.anchor.set(0, 0.5);

  this.hud.add(coinScoreImg);
  this.hud.add(this.keyIcon);
};

PlayState._spawnDoor = function(x, y) {
  this.door = this.bgDecoration.create(x, y, 'door'); // создание спрайта
  this.door.anchor.set(0.5, 1);
  this.game.physics.enable(this.door);
  this.door.body.allowGravity = false;

  if(this.level === 0) {
    this._spawnEnemyWall(this.door.x + this.door.width / 2 , this.door.y, 'right');
  }
};

PlayState._spawnKey = function(x, y) {
  this.key = this.bgDecoration.create(x, y, 'key');
  this.key.anchor.set(0.5, 0.5);
  this.game.physics.enable(this.key);
  this.key.body.allowGravity = false;
  this.key.y -= 3;
  this.game.add.tween(this.key)
      .to({y: this.key.y + 6}, 800, Phaser.Easing.Sinusoidal.InOut)
      .yoyo(true)
      .loop()
      .start();
};
