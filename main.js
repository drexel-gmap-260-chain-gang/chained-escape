window.onload = function() {
	var game = new Phaser.Game(600, 800, Phaser.AUTO, 'game-area', { preload: preload, create: create, update: update });
	
	var bikeHorizSpeed = 500;
	var bikeVertSpeed = 500;
	
	var playerBikes = {};
	var testText, splitText;
	var forces;
	var timeToSplit;
	var chainHealth, chainCooldown;
	var p1Vel, p2Vel;
	var backLayer, obstacleLayer, frontLayer;
	
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
	
	var music; // whatever music is currently playing
	var sounds = {};
	
	function preload() {
		game.load.image('backgroundCountry', 'images/road-country-scaled.png');
		game.load.image('backgroundPrison', 'images/road-prison.png');
		game.load.image('backgroundHighway', 'images/road-highway-scaled.png');
		game.load.image('bike-1', 'images/motorbike-1.png');
		game.load.image('bike-2', 'images/motorbike-2.png');
		game.load.image('chain-link-1', 'images/chainLink1.png');
		game.load.image('chain-link-2', 'images/chainLink2.png');
		game.load.image('spikes', 'images/spikes2.png');
		game.load.audio('defeat', 'sounds/defeat.mp3');
		game.load.audio('gameplay-start', 'sounds/gameplay music, start of loop.mp3');
		game.load.audio('gameplay-loop', 'sounds/gameplay music, looping part.mp3');
	}
	
	function create() {
		backLayer = game.add.group();
		backLayer.z = 0;
		obstacleLayer = game.add.group();
		obstacleLayer.z = 1;
		frontLayer = game.add.group();
		frontLayer.z = 2;
		game.stage.backgroundColor = "#404040";
		game.background1 = game.add.sprite(0, 0, 'backgroundPrison');
		backLayer.add(game.background1);
		game.background2 = game.add.sprite(0, -800, 'backgroundPrison');
		backLayer.add(game.background2);
		playerBikes.player1 = game.add.sprite(game.world.centerX + 100, game.world.centerY, 'bike-2');
		playerBikes.player2 = game.add.sprite(game.world.centerX - 200, game.world.centerY, 'bike-1');
		frontLayer.add(playerBikes.player1);
		frontLayer.add(playerBikes.player2);
		var spikes = new Spikes(game, 200, 200);
		obstacleLayer.add(spikes);
		game.add.existing(spikes);
		testText = game.add.text(10, 740, 'forces = 0', {font: "20px Arial", fill: "#ffffff", align: "left"});
		splitText = game.add.text(10, 770, 'Distance to fork: 0', {font: "20px Arial", fill: "#ffffff", align: "left"});
		game.physics.startSystem(Phaser.Physics.P2JS);
		game.physics.p2.gravity.y = 600;
		chainHealth = 10;
		chainCooldown = 0;
		timeToSplit = 5000;
		
		//game.world.boundsCollidesWith
		game.physics.p2.setBounds(0,0,600,800,true,true,true,true,true);
		var bikeCollisionGroup = game.physics.p2.createCollisionGroup();
		
		
		_.each(playerBikes, function(bike) {
			// sprites are too big; scale images down
			bike.scale.setTo(0.6, 0.6);
			
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
		
		forces = 0;
		createChain(15, playerBikes.player1, playerBikes.player2);
		
		sounds.defeatSound = game.add.audio('defeat');
		sounds.gameplayMusicStart = game.add.audio('gameplay-start');
		sounds.gameplayMusicLoop = game.add.audio('gameplay-loop');
		playTwoPartLoopingMusic(sounds.gameplayMusicStart, sounds.gameplayMusicLoop);
		
		addHotkey(Phaser.Keyboard.L, loseTheGame, this);
		addHotkey(Phaser.Keyboard.M, toggleMute, this);
		addHotkey(Phaser.Keyboard.P, togglePause, this);
	}
	
	function addHotkey(keyCode, handler, handlerContext) {
		var hotkey = game.input.keyboard.addKey(keyCode);
		hotkey.onDown.add(handler, handlerContext);
	}
	
	function loseTheGame() {
		playMusic(sounds.defeatSound);
		var defeatText = game.add.text(150, 200, 'You Lose', {font: "72px Arial", fill: "#ff8080", align: "center"});
		// TODO show failure screen
		// TODO allow player to try again or return to main menu
	}
	
	// parameter types – sound: Phaser.Sound, shouldLoop: boolean
	function playMusic(sound, shouldLoop) {
		if (typeof shouldLoop === 'undefined') { shouldLoop = false; }
		
		// prevent more than one piece of music playing at once
		if (music !== undefined) {
			music.stop();
		}
		music = sound;
		music.play(undefined, undefined, undefined, shouldLoop, true);
	}
	
	// play the first sound once, followed by the second sound looping forever
	function playTwoPartLoopingMusic(startSound, loopingSound) {
		if (music !== undefined) {
			music.stop();
		}
		
		var startSoundFinishedSignal = new Phaser.Signal();
		startSound.onStop = startSoundFinishedSignal;
		
		// currentlyInStopHandler: a lock to prevent infinite recursion from calling music.stop()
		// it will be closed over (closure) by the function below
		var currentlyInStopHandler = false;
		
		startSoundFinishedSignal.addOnce(function(stoppedSound) {
			if (!currentlyInStopHandler) {
				currentlyInStopHandler = true;
				
				var soundHasReachedEnd = stoppedSound.currentTime >= stoppedSound.durationMS;
				if (soundHasReachedEnd) {
					playMusic(loopingSound, true);
				}
			}
		}, this);
		
		music = startSound;
		music.play();
	}
	
	function toggleMute() {
		game.sound.mute = !game.sound.mute;
	}
	
	function togglePause() {
		game.paused = !game.paused;
	}
	
	function createChain(length, startSprite, endSprite) {
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
			var x = xAnchor-(i*xInterval); // all rects are on the same x position
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
			newRect.body.collideWorldBounds = false;
			
			if (i == 0) {
				game.physics.p2.createLockConstraint(newRect, startSprite, [0,10], maxForce);
				// anchor the first one created
			} else {
				newRect.body.mass = 2; // reduce mass for every chain link
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
		testText.text = 'Chain health: ' + chainHealth;
		
		chainCooldown++;
		timeToSplit--;
		splitText.text = 'Distance to fork: ' + timeToSplit;
		p1Vel = Math.round(playerBikes.player1.body.velocity.x)
		p2Vel = Math.round(playerBikes.player2.body.velocity.x)
		moveBikeWithKeys(playerBikes.player1, keymaps.player1)
		moveBikeWithKeys(playerBikes.player2, keymaps.player2)
		
		if (timeToSplit == 3000) {
			game.background1 = game.add.sprite(0, 0, 'backgroundCountry');
			game.background2 = game.add.sprite(0, -800, 'backgroundCountry');
			backLayer.add(game.background1);
			backLayer.add(game.background2);
		} else if (timeToSplit == 1000) {
			game.background1 = game.add.sprite(0, 0, 'backgroundHighway');
			game.background2 = game.add.sprite(0, -800, 'backgroundHighway');
			backLayer.add(game.background1);
			backLayer.add(game.background2);
		}
		
		if ((game.input.keyboard.isDown(keymaps.player1["right"]) && game.input.keyboard.isDown(keymaps.player2["left"])) ||
		(game.input.keyboard.isDown(keymaps.player1["left"]) && game.input.keyboard.isDown(keymaps.player2["right"])))
		{
			if (p1Vel == 0 && p2Vel == 0 && chainCooldown > 50)
			{
				testText.text = 'kerCHINK!';
				chainCooldown = 0;
				chainHealth = chainHealth - 1;
			}
		}
		
	function moveBackground(background) {
		if (background.y > 780) {
			background.y = -800;
			background.y += 20;
		} else {
			background.y += 20;
		}
		
		moveBackground(game.background1);
		moveBackground(game.background2);
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
	
	function Spikes(game, x, y, frame) {  
		Phaser.Sprite.call(this, game, x, y, 'spikes', frame);
		this.verticalSpeed = 3;
		
		var struck = false;
	};
	
	Spikes.prototype = Object.create(Phaser.Sprite.prototype);
	Spikes.prototype.constructor = Spikes;
	
	Spikes.prototype.update = function() {
		this.y += this.verticalSpeed;
	};
};

