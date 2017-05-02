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
