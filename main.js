window.onload = function() {
	var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });
	
	function preload() {
		game.load.image('logo', 'images/phaser.png');
	}
	
	function create() {
		var logo = game.add.sprite(game.world.centerX, game.world.centerY, 'logo');
		logo.anchor.setTo(0.5, 0.5);
	}
	
	function update() {
		
	}
};
