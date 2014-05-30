window.onload = function() {
	var game = new Phaser.Game(600, 800, Phaser.AUTO, 'game-area', { preload: preload, create: create, update: update });
	
	// global variables:
	
	var bikeHorizSpeed = 500;
	var bikeVertSpeed = 500;
	var roadScrollSpeed = 10;
	
	var playerBikes = {};
	var backgroundSprites = {};
	var testText, splitText;
	var forces;
	var timeToSplit;
	var chainHealth;
	var timeBeforeNextChainYankAllowed; // a cooldown
	var timeBeforeNextSpawnAllowed; // a cooldown
	var spriteLayers = {};
	
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
		game.load.image('barrier', 'images/roadBlock2.png');
		game.load.image('pole', 'images/roadBlock.png');
		game.load.image('police', 'images/police.png');
		game.load.audio('defeat', 'sounds/defeat.mp3');
		game.load.audio('gameplay-start', 'sounds/gameplay music, start of loop.mp3');
		game.load.audio('gameplay-loop', 'sounds/gameplay music, looping part.mp3');
	}
	
	function create() {
		createSpriteLayers(spriteLayers, ['background', 'obstacle', 'chain', 'playerBike', 'HUD']);
		
		game.stage.backgroundColor = "#404040";
		var backgroundHeight = game.cache.getImage('backgroundPrison').height;
		backgroundSprites.background1 = game.add.sprite(0, 0, 'backgroundPrison');
		spriteLayers['background'].add(backgroundSprites.background1);
		backgroundSprites.background2 = game.add.sprite(0, -backgroundHeight, 'backgroundPrison');
		spriteLayers['background'].add(backgroundSprites.background2);
		
		playerBikes.player1 = game.add.sprite(game.world.centerX + 175, game.world.centerY, 'bike-2');
		playerBikes.player2 = game.add.sprite(game.world.centerX - 125, game.world.centerY, 'bike-1');
		spriteLayers['playerBike'].add(playerBikes.player1);
		spriteLayers['playerBike'].add(playerBikes.player2);
		
		
		var spikes = new Spikes(game, 200, -100);
		spriteLayers['obstacle'].add(spikes);
		
		testText = game.add.text(10, 740, 'forces = 0', {font: "20px Arial", fill: "#ffffff", align: "left"});
		spriteLayers['HUD'].add(testText)
		splitText = game.add.text(10, 770, 'Distance to fork: 0', {font: "20px Arial", fill: "#ffffff", align: "left"});
		spriteLayers['HUD'].add(splitText)


		game.physics.startSystem(Phaser.Physics.P2JS);
		game.physics.p2.gravity.y = 600;
		chainHealth = 10;
		timeBeforeNextChainYankAllowed = 0;
		timeBeforeNextSpawnAllowed = 100; // give player time to get their bearings at game start
		timeToSplit = 5000;
		
		var leftWallX = 125;
		var rightWallX = 475;
		var widthOfRoad = rightWallX - leftWallX;
		game.physics.p2.setBounds(leftWallX, 0, widthOfRoad, 800, true, true, true, true, true);
		var bikeCollisionGroup = game.physics.p2.createCollisionGroup();
		
		_.each(playerBikes, function(bike) {
			// sprites are too big; scale images down
			bike.scale.setTo(0.4, 0.4);
			
			game.physics.p2.enable(bike, false);
			// hack to counteract weight of chain:
			bike.body.data.gravityScale = -0.155;
			
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
		
		forces = 0; // currently unused
		createChain(13, playerBikes.player1, playerBikes.player2);
		
		sounds.defeatSound = game.add.audio('defeat');
		sounds.gameplayMusicStart = game.add.audio('gameplay-start');
		sounds.gameplayMusicLoop = game.add.audio('gameplay-loop');
		playTwoPartLoopingMusic(sounds.gameplayMusicStart, sounds.gameplayMusicLoop);
		
		addHotkey(Phaser.Keyboard.L, loseTheGame, this);
		addHotkey(Phaser.Keyboard.M, toggleMute, this);
		addHotkey(Phaser.Keyboard.P, togglePause, this);
	}
	
	function createSpriteLayers(objectToStoreLayersIn, layerNamesFromBackToFront) {
		_.each(layerNamesFromBackToFront, function(name, index) {
			var layer = game.add.group(undefined, name);
			layer.z = index;
			objectToStoreLayersIn[name] = layer;
		});
	}
	
	function addHotkey(keyCode, handler, handlerContext) {
		var hotkey = game.input.keyboard.addKey(keyCode);
		hotkey.onDown.add(handler, handlerContext);
	}
	
	function loseTheGame() {
		playMusic(sounds.defeatSound);
		var defeatText = game.add.text(150, 200, 'You Lose', {font: "72px Arial", fill: "#ff8080", align: "center"});
		spriteLayers['HUD'].add(defeatText)
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
		var previousChainSprite; // if we created our first link this will contain it
		var xLimit = Math.abs(startSprite.x - endSprite.x);
		var xInterval = xLimit / length;
		var yLimit = Math.abs(startSprite.y - endSprite.y);
		var xAnchor = startSprite.x;
		var yAnchor = startSprite.y;
		
		var chainLinkCollisionGroup = game.physics.p2.createCollisionGroup();
		
		var maxForce = 100000; // the force that holds the rectangles together
		for (var i=0; i<=length; i++) {
			var x = xAnchor-(i*xInterval); // creat chain links from right to left
			var y = yAnchor;
			if (i%2 === 0) {
				newChainSprite = game.add.sprite(x, y, 'chain-link-2', undefined, spriteLayers['chain']);
			} else {
				newChainSprite = game.add.sprite(x, y, 'chain-link-1', undefined, spriteLayers['chain']);
				previousChainSprite.bringToTop(); // sideways chains appear to cover head-on ones
			}
			
			// if chain is too small, it jitters for some reason
			var chainScale = 0.6;
			var chainDistance = 6;
			var scaleOfPhysicsRectangle = 1.0;
			
			game.physics.p2.enable(newChainSprite, false); // enable physics body
			newChainSprite.scale.setTo(chainScale, chainScale);
			newChainSprite.body.setRectangle(newChainSprite.width * scaleOfPhysicsRectangle, newChainSprite.height * scaleOfPhysicsRectangle);
			newChainSprite.body.angle = 90;
			newChainSprite.body.setCollisionGroup(chainLinkCollisionGroup);
			newChainSprite.body.collides([chainLinkCollisionGroup]);
			newChainSprite.body.collideWorldBounds = false;
			
			if (i === 0) {
				game.physics.p2.createLockConstraint(newChainSprite, startSprite, [0,chainDistance], maxForce);
				// anchor the first one created
			} else {
				newChainSprite.body.mass = 2; // reduce mass for every chain link
			}
			// after the first link is created we can add the constraint
			if (previousChainSprite) {
				game.physics.p2.createRevoluteConstraint(newChainSprite, [0,-chainDistance], previousChainSprite, [0,chainDistance], maxForce);
			}
			previousChainSprite = newChainSprite;
			if (i === length) {
				game.physics.p2.createLockConstraint(newChainSprite, endSprite, [0,chainDistance], maxForce);
			}
		}
	}
	
	function update() {
		// make objects spawn, move, and interact
		possiblySpawnRandomObstacle();
		scrollBackground();
		moveBikeWithKeys(playerBikes.player1, keymaps.player1);
		moveBikeWithKeys(playerBikes.player2, keymaps.player2);
		_.each(playerBikes, function(bike) {
			// TODO do to police bikes too when they move sideways after the player
			rotateBikeToShowSideMovement(bike);
		});
		checkForChainYank();
		
		// update variables
		timeBeforeNextChainYankAllowed = Math.max(timeBeforeNextChainYankAllowed - 1, 0);
		timeBeforeNextSpawnAllowed = Math.max(timeBeforeNextSpawnAllowed - 1, 0);
		timeToSplit--;
		
		// update text
		
		splitText.text = 'Distance to fork: ' + Math.max(timeToSplit, 0);
		
		// check for time-based events
		if (timeToSplit === 3000) {
			changeToBackground('backgroundCountry');
		} else if (timeToSplit === 1000) {
			changeToBackground('backgroundHighway');
		} else if (timeToSplit === 0 && chainHealth > 0) {
			// TODO show crashing animation
			loseTheGame();
		}
	}
	
	function rotateBikeToShowSideMovement(bikeSprite) {
		var angle = -bikeSprite.body.velocity.x / 6;
		bikeSprite.body.angle = angle; // physics body angle
		// when fixedRotation is on, the physics angle does not affect the visual angle
		bikeSprite.angle = angle; // visual angle
	}
	
	function checkForChainYank() {
		var p1Vel = Math.round(playerBikes.player1.body.velocity.x)
		var p2Vel = Math.round(playerBikes.player2.body.velocity.x)
		testText.text = 'Velocities: ' + p1Vel + "   " + p2Vel;
		if ((game.input.keyboard.isDown(keymaps.player1["right"]) && game.input.keyboard.isDown(keymaps.player2["left"])) ||
		(game.input.keyboard.isDown(keymaps.player1["left"]) && game.input.keyboard.isDown(keymaps.player2["right"]))) {
			if (p1Vel === 0 && p2Vel === 0 && timeBeforeNextChainYankAllowed <= 0) {
				testText.text = 'kerCHINK!';
				timeBeforeNextChainYankAllowed = 50;
				chainHealth = chainHealth - 1;
			}
		}
	}
	
	function changeToBackground(backgroundName) {
		var backgroundHeight = game.cache.getImage(backgroundName).height;
		backgroundSprites.background1 = game.add.sprite(0, 0, backgroundName);
		backgroundSprites.background2 = game.add.sprite(0, -backgroundHeight, backgroundName);
		spriteLayers['background'].removeAll(true);
		spriteLayers['background'].add(backgroundSprites.background1);
		spriteLayers['background'].add(backgroundSprites.background2);
	}
	
	function possiblySpawnRandomObstacle() {
		if (timeBeforeNextSpawnAllowed > 0) {
			return;
		}
		if (Math.random() < 0.02) {
			var spawnType = randomIntInRangeInclusive(1, 4);
			switch (spawnType) {
			case 1:
				spawnSpikes();
				break;
			case 2:
				spawnBarrier();
				break;
			case 3:
				spawnPole();
				break;
			case 4:
				spawnPolice();
				break;
			}
		}
	}
	
	function randomIntInRangeInclusive(minimum, maximum) {
		return Math.floor((Math.random() * (maximum - minimum + 1))) + minimum;
	}
	
	function scrollBackground() {
		moveBackgroundSprite(backgroundSprites.background1);
		moveBackgroundSprite(backgroundSprites.background2);
	}
	
	function moveBackgroundSprite(backgroundSprite) {
		backgroundSprite.y += roadScrollSpeed;
		if (backgroundSprite.y >= game.height) {
			backgroundSprite.y -= backgroundSprite.height * 2;
			// * 2 to leapfrog over the single other background sprite
		}
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
	
	function spawnObstacle(constructor) {
		var spawnX = randomIntInRangeInclusive(200, 400);
		var spawnY = -100; // FIXME should be negative the height of the obstacle
		var obstacle = new constructor(game, spawnX, spawnY);
		
		spriteLayers['obstacle'].add(obstacle);
	}
	
	function spawnSpikes() {
		spawnObstacle(Spikes);
		timeBeforeNextSpawnAllowed = 100;
	}
	
	function spawnBarrier() {
		spawnObstacle(Barrier);
		timeBeforeNextSpawnAllowed = 100;
	}
	
	function spawnPole() {
		spawnObstacle(Pole);
		timeBeforeNextSpawnAllowed = 100;
	}
	
	function spawnPolice() {
		spawnObstacle(Police);
		timeBeforeNextSpawnAllowed = 300;
	}
	
	
	function Spikes(game, x, y, frame) {  
		Phaser.Sprite.call(this, game, x, y, 'spikes', frame);
		this.verticalSpeed = roadScrollSpeed;
		this.scale.setTo(0.4, 0.4)
		var playerHasStruck = false; // to prevent dealing damage multiple times
	};
	
	Spikes.prototype = Object.create(Phaser.Sprite.prototype);
	Spikes.prototype.constructor = Spikes;
	
	Spikes.prototype.update = function() {
		this.y += this.verticalSpeed;
		this.x = this.setX;
	};
	
	
	function Barrier(game, x, y, frame) {  
		Phaser.Sprite.call(this, game, x, y, 'barrier', frame);
		this.verticalSpeed = roadScrollSpeed;
		this.scale.setTo(0.4, 0.4)
		var playerHasStruck = false; // to prevent dealing damage multiple times
	};
	
	Barrier.prototype = Object.create(Phaser.Sprite.prototype);
	Barrier.prototype.constructor = Barrier;
	
	Barrier.prototype.update = function() {
		this.y += this.verticalSpeed;
	};
	
	
	function Pole(game, x, y, frame) {  
		Phaser.Sprite.call(this, game, x, y, 'pole', frame);
		this.scale.setTo(0.4, 0.4)
		this.verticalSpeed = roadScrollSpeed;
	};
	
	Pole.prototype = Object.create(Phaser.Sprite.prototype);
	Pole.prototype.constructor = Pole;
	
	Pole.prototype.update = function() {
		this.y += this.verticalSpeed;
	};
	
	
	function Police(game, x, y, frame) {  
		Phaser.Sprite.call(this, game, x, y, 'police', frame);
		this.scale.setTo(0.4, 0.4)
		this.verticalSpeed = roadScrollSpeed - 5;
	};
	
	Police.prototype = Object.create(Phaser.Sprite.prototype);
	Police.prototype.constructor = Police;
	
	Police.prototype.update = function() {
		this.y += this.verticalSpeed;
	};
};
