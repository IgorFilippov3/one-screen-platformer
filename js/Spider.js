function Spider(game, x, y) {
  Phaser.Sprite.call(this, game , x, y, 'spider');
  this.anchor.set(0.5);
  this.animation.add('crawl', [0,1,2], 8, true);
  this.animation.add('die', [0, 4, 0, 4, 0, 4, 3, 3, 3, 3, 3, 3], 12);
  this.animation.play('crawl');

  this.game.physics.enable(this);
  this.body.collideWorldBounds = true;
  this.body.velocity.x = Spider.SPEED;
}

Spider.SPEED = 100;

Spider.prototype = Object.create(Phaser.Sprite.prototype); // говорим интерпретатору, что наш конструктор это спрайт
Spider.prototype.constructor = Spider;
