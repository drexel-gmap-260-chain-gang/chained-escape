window.onload = function() {
	var game = new Phaser.Game(600, 800, Phaser.AUTO, 'game-area', { preload: preload, create: create, update: update });
	
	var bikeHorizSpeed = 500;
	var bikeVertSpeed = 500;
	
	var playerBikes = {};
	
	var keymaps = {
		player1: {
			left: Phaser.Keyboard.LEFT,
			right: Phaser.Keyboard.RIGHT,
			up: Phaser.Keyboard.UP,
			down: Phaser.Keyboard.DOWN,
		},
		player2: {
			left: Phaser.Keyboard.A,
			right: Phaser.Keyboard.D,
			up: Phaser.Keyboard.W,
			down: Phaser.Keyboard.S,
		}
	}
	
	function preload() {
		game.load.image('bike-red', 'images/motorbike-red.png');
		game.load.image('bike-blue', 'images/motorbike-blue.png');
		game.load.image('chain-link-1', 'images/chainLink1.png');
		game.load.image('chain-link-2', 'images/chainLink2.png');
	}
	
	function create() {
		game.stage.backgroundColor = "#404040";
		playerBikes.player1 = game.add.sprite(game.world.centerX + 100, game.world.centerY, 'bike-blue');
		playerBikes.player2 = game.add.sprite(game.world.centerX - 200, game.world.centerY, 'bike-red');
		
		game.physics.startSystem(Phaser.Physics.P2JS);
		game.physics.p2.gravity.y = 600;
		game.physics.p2.setBounds(0,0,600,800,true,true,true,true,true);
		game.world.boundsCollidesWith
		
		var bikeCollisionGroup = game.physics.p2.createCollisionGroup();
		
		_.each(playerBikes, function(bike) {
			game.physics.p2.enable(bike, false);
			// hack to counteract weight of chain:
			bike.body.data.gravityScale = -0.15;
			
			bike.body.setCollisionGroup(bikeCollisionGroup);
			bike.body.collides([bikeCollisionGroup]);
			bike.body.data.mass = 100;
			bike.body.fixedRotation = true;
		})
		
		_.each(keymaps, function(keymap) {
			_.each(keymap, function(keyCode, direction) {
				game.input.keyboard.addKey(keyCode);
			});
		});
	
		createChain(15, playerBikes.player1, playerBikes.player2);
	}
	
	function createChain(length, startSprite, endSprite){
		var lastRect; // if we created our first rect this will contain it
		var xLimit = Math.abs(startSprite.x - endSprite.x);
		var xInterval = xLimit / length;
		var yLimit = Math.abs(startSprite.y - endSprite.y);
		var xAnchor = startSprite.x;
		var yAnchor = startSprite.y;
		
		var chainLinkCollisionGroup = game.physics.p2.createCollisionGroup();
		
		var height = 20; // height for the physics body - your image height is 8px
		var width = 16; // this is the width for the physics body… if too small the rectangles will get scrambled together
		var maxForce = 20000; // the force that holds the rectangles together
		for (var i=0; i<=length; i++) {
			var x = xAnchor+(i*xInterval); // all rects are on the same x position
			var y = yAnchor; // every new rects is positioned below the last
			if (i%2 == 0) {
				newRect = game.add.sprite(x, y, 'chain-link-2'); // add sprite
			} else {
				newRect = game.add.sprite(x, y, 'chain-link-1');
				lastRect.bringToTop();
			} // optical polish ..
			game.physics.p2.enable(newRect, false); // enable physicsbody
			newRect.body.setRectangle(width, height); // set custom rectangle
			newRect.body.setCollisionGroup(chainLinkCollisionGroup);
			newRect.body.collides([chainLinkCollisionGroup]);
			
			if (i == 0) {
				game.physics.p2.createLockConstraint(newRect, startSprite, [0,10], maxForce);
				// anchor the first one created
			} else {
				newRect.body.mass = 2; // reduce mass for every rope element
			}
			// after the first rectangle is created we can add the constraint
			if (lastRect) {
				game.physics.p2.createRevoluteConstraint(newRect, [0,-10], lastRect, [0,10], maxForce);
			}
			lastRect = newRect;
			if (i == length) {
				game.physics.p2.createLockConstraint(newRect, endSprite, [0,10], maxForce);
			}
		}
	}
	
	function update() {
		moveBikeWithKeys(playerBikes.player1, keymaps.player1)
		moveBikeWithKeys(playerBikes.player2, keymaps.player2)
	}
	
	function moveBikeWithKeys(sprite, keymap) {
		sprite.body.setZeroVelocity();
		
		if (game.input.keyboard.isDown(keymap["left"])) {
			sprite.body.moveLeft(bikeHorizSpeed);
		} else if (game.input.keyboard.isDown(keymap["right"])) {
			sprite.body.moveRight(bikeHorizSpeed);
		}
		if (game.input.keyboard.isDown(keymap["up"])) {
			sprite.body.moveUp(bikeVertSpeed);
		} else if (game.input.keyboard.isDown(keymap["down"])) {
			sprite.body.moveDown(bikeVertSpeed);
		}
	}
};
