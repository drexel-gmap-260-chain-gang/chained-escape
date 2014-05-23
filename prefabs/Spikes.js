'use strict';

var Spikes = function(game, x, y, frame) {  
  Phaser.Sprite.call(this, game, x, y, 'spikes', frame);

  var struck = false;

};

Spikes.prototype = Object.create(Phaser.Sprite.prototype);  
Spikes.prototype.constructor = Spikes;

Spikes.prototype.update = function() {

  // write your prefab's specific update code here

};