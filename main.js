window.onload = function() {
	var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game-area', { preload: preload, create: create, update: update });
	
	function preload() {
		game.load.image('logo', 'images/phaser.png');
		game.load.image('bike-red', 'images/motorbike-red.png');
		game.load.image('bike-blue', 'images/motorbike-blue.png');
	}
	
	function create() {
		game.stage.backgroundColor = 0x404040;
		var player1Bike = game.add.sprite(game.world.centerX - 200, game.world.centerY, 'bike-red');
		var player2Bike = game.add.sprite(game.world.centerX + 100, game.world.centerY, 'bike-blue');
	}
	
	function update() {
		
	}
};
