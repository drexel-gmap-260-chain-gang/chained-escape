window.onload = function() {
	var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game-area', { preload: preload, create: create, update: update });
	
	var bikeHorizSpeed = 5;
	var bikeVertSpeed = 5;
	var player1Bike;
	var player2Bike;
	
	function preload() {
		game.load.image('logo', 'images/phaser.png');
		game.load.image('bike-red', 'images/motorbike-red.png');
		game.load.image('bike-blue', 'images/motorbike-blue.png');
	}
	
	function create() {
		game.stage.backgroundColor = 0x404040;
		player1Bike = game.add.sprite(game.world.centerX - 200, game.world.centerY, 'bike-red');
		player2Bike = game.add.sprite(game.world.centerX + 100, game.world.centerY, 'bike-blue');
	}
	
	function update() {
		if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
			player1Bike.x -= bikeHorizSpeed;
		} else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
			player1Bike.x += bikeHorizSpeed;
		}
		if (game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
			player1Bike.y -= bikeVertSpeed;
		} else if (game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
			player1Bike.y += bikeVertSpeed;
		}
	}
};
