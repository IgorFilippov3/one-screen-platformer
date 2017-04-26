function Hero(game, x, y) {
  Phaser.Sprite.call(this, game , x, y, 'hero');
  this.anchor.set(0.5, 0.5);
}
Hero.prototype = Object.create(Phaser.Sprite.prototype);
Hero.prototype.constructor = Hero;
Hero.prototype.move = function(direction) {
  this.x += direction * 2.5; // 2.5px each frame
};
