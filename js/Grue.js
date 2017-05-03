function Grue(game, x, y) {
  Phaser.Sprite.call(this, game, x, y, 'grue');
  this.anchor.set(0.5);
  this.game.physics.enable(this);
  this.body.collideWorldBounds = true;
  this.body.velocity.x = Grue.SPEED;

  this.animations.add('right', [0], 8, true);
  this.animations.add('left', [2], 8, true);
  this.animations.play('right');
}

Grue.SPEED = 200;

Grue.prototype = Object.create(Phaser.Sprite.prototype);
Grue.prototype.constructor = Grue;

Grue.prototype.update = function() {
  if(this.body.touching.right || this.body.blocked.right) {
    this.body.velocity.x = -Grue.SPEED; // поворот в лево
    this.animations.play('left');
  }
  else if(this.body.touching.left || this.body.blocked.left) {
    this.body.velocity.x = Grue.SPEED; // поворот в право
    this.animations.play('right');
  }
}
