window.onload = function() {
	var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game-area', { preload: preload, create: create, update: update });
	
	var bikeHorizSpeed = 5;
	var bikeVertSpeed = 5;
	var player1Bike;
	var player2Bike;
	
	var player1Keymap = {
		left: Phaser.Keyboard.LEFT,
		right: Phaser.Keyboard.RIGHT,
		up: Phaser.Keyboard.UP,
		down: Phaser.Keyboard.DOWN,
	}
	var player2Keymap = {
		left: Phaser.Keyboard.A,
		right: Phaser.Keyboard.D,
		up: Phaser.Keyboard.W,
		down: Phaser.Keyboard.S,
	}
	
	function preload() {
		game.load.image('bike-red', 'images/motorbike-red.png');
		game.load.image('bike-blue', 'images/motorbike-blue.png');
	}
	
	function create() {
		game.stage.backgroundColor = "#404040";
		player1Bike = game.add.sprite(game.world.centerX + 100, game.world.centerY, 'bike-red');
		player2Bike = game.add.sprite(game.world.centerX - 200, game.world.centerY, 'bike-blue');
	}
	
	function update() {
		moveBikeWithKeys(player1Bike, player1Keymap)
		moveBikeWithKeys(player2Bike, player2Keymap)
	}
	
	function moveBikeWithKeys(sprite, keymap) {
		if (game.input.keyboard.isDown(keymap["left"])) {
			sprite.x -= bikeHorizSpeed;
		} else if (game.input.keyboard.isDown(keymap["right"])) {
			sprite.x += bikeHorizSpeed;
		}
		if (game.input.keyboard.isDown(keymap["up"])) {
			sprite.y -= bikeVertSpeed;
		} else if (game.input.keyboard.isDown(keymap["down"])) {
			sprite.y += bikeVertSpeed;
		}
	}
};
