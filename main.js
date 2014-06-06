window.onload = function() {
	var game = new Phaser.Game(600, 800, Phaser.AUTO, 'game-area', { preload: preload, create: create, update: update });
	
	// global variables:
	
	var bikeHorizSpeed = 500;
	var bikeVertSpeed = 500;
	var roadScrollSpeed = 10;
	
	var playerBikes = {};
	var backgroundSprites = {};
	var interactableChain = [];
	var chainConstraints = [];
	var chainEnds = [];
	var testText, splitText;
	var forces;
	var timeToSplit;
	var chainHealth;
	var timeBeforeNextChainYankAllowed; // a cooldown
	var timeBeforeNextSpawnAllowed; // a cooldown
	var spriteLayers = {};
	var concluded = false;
	
	var keymaps = {
		player1: {
			left: Phaser.Keyboard.LEFT,
			right: Phaser.Keyboard.RIGHT,
			up: Phaser.Keyboard.UP,
			down: Phaser.Keyboard.DOWN,
			fire: Phaser.Keyboard.SHIFT,
		},
		player2: {
			left: Phaser.Keyboard.A,
			right: Phaser.Keyboard.D,
			up: Phaser.Keyboard.W,
			down: Phaser.Keyboard.S,
			fire:Phaser.Keyboard.F,
		}
	}
	
	var music; // whatever music is currently playing
	var sounds = {};
	
	
	function preload() {
		game.load.image('backgroundCountry', 'images/road-country.png');
		game.load.image('backgroundPrison', 'images/road-prison.png');
		game.load.image('backgroundHighway', 'images/road-highway.png');
		game.load.image('bike-1', 'images/motorbike-1.png');
		game.load.image('bike-2', 'images/motorbike-2.png');
		game.load.image('chain-link-1', 'images/chainLink1.png');
		game.load.image('chain-link-2', 'images/chainLink2.png');
		game.load.image('spikes', 'images/spikes2.png');
		game.load.image('barrier', 'images/roadBlock2.png');
		game.load.image('brokenBarrier', 'images/roadBlock2broken.png');
		game.load.image('pole', 'images/metalpole.png');
		game.load.image('police', 'images/police.png');
		game.load.image('bullet', 'images/bullet.png');
		game.load.audio('defeat', 'sounds/defeat.mp3');
		game.load.audio('gameplay-start', 'sounds/gameplay music, start of loop.mp3');
		game.load.audio('gameplay-loop', 'sounds/gameplay music, looping part.mp3');
	}
	
	function create() {
		createSpriteLayers(spriteLayers, ['background', 'obstacle', 'chain', 'playerBike', 'HUD']);
		
		game.stage.backgroundColor = "#404040";
		changeToBackground('backgroundPrison');
	
		playerBikes.player1 = game.add.sprite(game.world.centerX + 150, game.world.centerY, 'bike-2');
		playerBikes.player2 = game.add.sprite(game.world.centerX - 125, game.world.centerY, 'bike-1');
		spriteLayers['playerBike'].add(playerBikes.player1);
		spriteLayers['playerBike'].add(playerBikes.player2);
		
		
		var spikes = new Spikes(game, 200, -100);
		var bullet = new Bullet(game, 200, 500);
		spriteLayers['obstacle'].add(spikes);
		
		testText = game.add.text(10, 740, 'forces = 0', {font: "20px Arial", fill: "#ffffff", align: "left"});
		spriteLayers['HUD'].add(testText)
		splitText = game.add.text(10, 770, 'Distance to fork: 0', {font: "20px Arial", fill: "#ffffff", align: "left"});
		spriteLayers['HUD'].add(splitText)


		game.physics.startSystem(Phaser.Physics.P2JS);
		game.physics.p2.gravity.y = 600;
		chainHealth = 50;
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
			bike.health = 5;
			bike.bullet = null;
			
			game.physics.p2.enable(bike, false);
			// hack to counteract weight of chain:
			bike.body.data.gravityScale = -0.135;
			
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
		addHotkey(Phaser.Keyboard.Y, cheat, this);
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
	
	function cheat() {
		var defeatText = game.add.text(520, 10, 'CHEATER!', {font: "12px Arial", fill: "#00ff00", align: "center"});
		_.each(playerBikes, function(playerBike) {
			playerBike.health = 5000;
		});
	}
	
	function loseTheGame() {
		concluded = true;
		playMusic(sounds.defeatSound);
		var defeatText = game.add.text(150, 200, 'You Lose', {font: "72px Arial", fill: "#ff8080", align: "center"});
		spriteLayers['HUD'].add(defeatText)
		// TODO show failure screen
		// TODO allow player to try again or return to main menu
	}
	
	function winTheGame() {
		for (var i = 0; i < chainConstraints.length; i++)
			game.physics.p2.removeConstraint(chainConstraints[i]);
		_.each(playerBikes, function(playerBike) {
			playerBike.body.data.gravityScale = 0;
		});
		concluded = true;
		playMusic(sounds.defeatSound);
		var victoryText = game.add.text(150, 200, 'You WIN!', {font: "72px Arial", fill: "#80ff80", align: "center"});
		spriteLayers['HUD'].add(victoryText)
		// TODO show victory screen
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
				chainConstraints.push(game.physics.p2.createLockConstraint(newChainSprite, startSprite, [0,chainDistance], maxForce));
				chainEnds.push(newChainSprite);
				// anchor the first one created
			} else {
				newChainSprite.body.mass = 2; // reduce mass for every chain link
			}
			// after the first link is created we can add the constraint
			if (previousChainSprite) {
				chainConstraints.push(game.physics.p2.createRevoluteConstraint(newChainSprite, [0,-chainDistance], previousChainSprite, [0,chainDistance], maxForce));
			}
			previousChainSprite = newChainSprite;
			if (i === length) {
				chainConstraints.push(game.physics.p2.createLockConstraint(newChainSprite, endSprite, [0,chainDistance], maxForce));
			}
			if (i !== 0 && i !== length)
				interactableChain.push(newChainSprite);
			else
				chainEnds.push(newChainSprite);
		}
	}
	
	function confirmEndStates () {
		if ((playerBikes.player1.health <= 0) || (playerBikes.player2.health <= 0))
			loseTheGame();
		if (chainHealth <= 0)
			winTheGame();
	}
	
	function update() {
		// make objects spawn, move, and interact
		if (concluded === false)
			confirmEndStates();
		possiblySpawnRandomObstacle();
		scrollBackground();
		moveBikeWithKeys(playerBikes.player1, keymaps.player1);
		moveBikeWithKeys(playerBikes.player2, keymaps.player2);
		fireBullets(playerBikes.player1, keymaps.player1);
		fireBullets(playerBikes.player2, keymaps.player2);
		_.each(playerBikes, function(bike) {
			// TODO do to police bikes too when they move sideways after the player
			rotateBikeToShowSideMovement(bike);
		});
		checkForChainYank();
		
		// update variables
		timeBeforeNextChainYankAllowed = clipNegative(timeBeforeNextChainYankAllowed - 1);
		timeBeforeNextSpawnAllowed = clipNegative(timeBeforeNextSpawnAllowed - 1);
		timeToSplit--;
		
		// update text
		
		splitText.text = 'Distance to fork: ' + clipNegative(timeToSplit);
		
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
	
	function clipNegative(number) {
		return Math.max(number, 0);
	}
	
	function rotateBikeToShowSideMovement(bikeSprite) {
		var angle = -bikeSprite.body.velocity.x / 6;
		bikeSprite.body.angle = angle; // physics body angle
		// when fixedRotation is on, the physics angle does not affect the visual angle
		bikeSprite.angle = angle; // visual angle
	}
	
	function checkForChainYank() {
		if (this.xticks === null)
			this.xticks = 0;
		if (this.yticks === null)
			this.yticks = 0;
		if (this.lastX === null)
			this.lastX = 0;
		if (this.lastY === null)
			this.lastY = 0;
		var p1Vel = Math.round(playerBikes.player1.body.x);
		var p2Vel = Math.round(playerBikes.player2.body.x);
		var p1del = Math.round(playerBikes.player1.deltaX);
		var p2del = Math.round(playerBikes.player2.deltaX);
		var diffX = Math.abs(Math.round(playerBikes.player1.x) - Math.round(playerBikes.player2.x))
		var diffY = Math.abs(Math.round(playerBikes.player1.y) - Math.round(playerBikes.player2.y))
		var dist = Math.sqrt((diffX*diffX) + (diffY*diffY));
		this.currentX = diffX;
		this.currentY = diffY;
		
		// FIXME code duplication below
		
		if (this.currentX > 70) {
			if (this.lastX === null || this.currentX > this.lastX) {
				this.xticks++;
				this.lastX = this.currentX;
				if (dist > 179 && this.xticks > 16) {
					testText.text = 'kerCHINK!';
					timeBeforeNextChainYankAllowed = 50;
					chainHealth = chainHealth - 1;
					this.xticks = -10;
				}
			} else {
				this.lastX = 69;
				this.xticks = 0;
			}
		} else {
			this.lastX = 69;
			this.xticks = 0;
		}
		
		if (this.currentY > 70) {
			if (this.lastY === null || this.currentY > this.lastY) {
				this.yticks++;
				this.lastY = this.currentY;
				if (dist > 179 && this.yticks > 16) {
					testText.text = 'kerCHINK!';
					timeBeforeNextChainYankAllowed = 50;
					chainHealth = chainHealth - 1;
					this.yticks = -10;
				}
			} else {
				this.lastY = 69;
				this.yticks = 0;
			}
		} else {
			this.lastY = 69;
			this.ticks = 0;
		}
		
		testText.text = 'P1: ' + clipNegative(playerBikes.player1.health) + ", P2: " + clipNegative(playerBikes.player2.health) + ", chain health: " + clipNegative(chainHealth);
	}
	
	function changeToBackground(backgroundName) {
		var backgroundNativeWidth = game.cache.getImage(backgroundName).width;
		var backgroundNativeHeight = game.cache.getImage(backgroundName).height;
		var backgroundScale = game.width / backgroundNativeWidth;
		var backgroundWidth = backgroundNativeWidth * backgroundScale;
		var backgroundHeight = backgroundNativeHeight * backgroundScale;
		
		backgroundSprites.background1 = game.add.sprite(0, 0, backgroundName);
		backgroundSprites.background1.scale.setTo(backgroundScale, backgroundScale);
		backgroundSprites.background2 = game.add.sprite(0, -backgroundHeight, backgroundName);
		backgroundSprites.background2.scale.setTo(backgroundScale, backgroundScale);
		spriteLayers['background'].removeAll(true);
		spriteLayers['background'].add(backgroundSprites.background1);
		spriteLayers['background'].add(backgroundSprites.background2);
	}
	
	function possiblySpawnRandomObstacle() {
		if (timeBeforeNextSpawnAllowed > 0) {
			return;
		}
		var spawnChancePerFrame = 0.05;
		if (Math.random() < spawnChancePerFrame) {
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
	
	function fireBullets(sprite, keymap) {
		if (game.input.keyboard.isDown(keymap["fire"])) {
			if (sprite.bullet === null) {
				sprite.bullet = new Bullet(game, sprite.x, sprite.y);
				game.add.existing(sprite.bullet);
			}
		}
		if (sprite.bullet === null)
			return;
		if (sprite.bullet.y < -30)
			sprite.bullet = null;
		
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
	
	
	function Bullet(game, x, y, frame) {  
		Phaser.Sprite.call(this, game, x, y, 'bullet', frame);
		this.verticalSpeed = 17;
		this.scale.setTo(0.4, 0.4)
		this.struckObject = false; // to prevent dealing damage multiple times
	};
	
	Bullet.prototype = Object.create(Phaser.Sprite.prototype);
	Bullet.prototype.constructor = Bullet;
	
	Bullet.prototype.update = function() {
		this.y -= this.verticalSpeed;
	};
	
	Bullet.prototype.struck = function() {
		this.struckObject = true;
		this.y = -40;
	};
	
	function Spikes(game, x, y, frame) {  
		Phaser.Sprite.call(this, game, x, y, 'spikes', frame);
		this.verticalSpeed = roadScrollSpeed;
		this.scale.setTo(0.4, 0.4)
		this.p1Damage = false;
		this.p2Damage = false;
		var playerHasStruck = false; // to prevent dealing damage multiple times
	};
	
	Spikes.prototype = Object.create(Phaser.Sprite.prototype);
	Spikes.prototype.constructor = Spikes;
	
	Spikes.prototype.update = function() {
		this.y += this.verticalSpeed;
		if (spritesDoOverlap(this, playerBikes.player2)) {
			if (this.p2Damage === false) {
				playerBikes.player2.health = playerBikes.player2.health - 1;
				this.p2Damage = true;
			}
		}
		if (spritesDoOverlap(this, playerBikes.player1)) {
			if (this.p1Damage === false) {
				playerBikes.player1.health = playerBikes.player1.health - 1;
				this.p1Damage = true;
			}
		}
	};
	
	
	function Barrier(game, x, y, frame) {  
		Phaser.Sprite.call(this, game, x, y, 'barrier', frame);
		this.verticalSpeed = roadScrollSpeed;
		this.scale.setTo(0.4, 0.4)
		this.p1Damage = false;
		this.p2Damage = false;
		var playerHasStruck = false; // to prevent dealing damage multiple times
	};
	
	Barrier.prototype = Object.create(Phaser.Sprite.prototype);
	Barrier.prototype.constructor = Barrier;
	
	Barrier.prototype.update = function() {
		this.y += this.verticalSpeed;
		if (spritesDoOverlap(this,playerBikes.player2)) {
			if (this.p2Damage === false) {
				playerBikes.player2.health = playerBikes.player2.health - 1;
				this.p2Damage = true;
			}
		}
		if (spritesDoOverlap(this,playerBikes.player1)) {
			if (this.p1Damage === false) {
				playerBikes.player1.health = playerBikes.player1.health - 1;
				this.p1Damage = true;
			}
		}
		if ((playerBikes.player1.bullet !== null) && spritesDoOverlap(this,playerBikes.player1.bullet)) {
			playerBikes.player1.bullet.struck();
			this.loadTexture('brokenBarrier', 0);
			this.p2Damage = true;
			this.p1Damage = true;
		}
		if ((playerBikes.player2.bullet !== null) && spritesDoOverlap(this,playerBikes.player2.bullet)) {
			playerBikes.player2.bullet.struck();
			this.loadTexture('brokenBarrier', 0);
			this.p2Damage = true;
			this.p1Damage = true;
		}
	};
	
	
	function Pole(game, x, y, frame) {  
		Phaser.Sprite.call(this, game, x, y, 'pole', frame);
		this.scale.setTo(0.4, 0.4)
		this.p1Damage = false;
		this.p2Damage = false;
		this.verticalSpeed = roadScrollSpeed;
	};
	
	Pole.prototype = Object.create(Phaser.Sprite.prototype);
	Pole.prototype.constructor = Pole;
	
	Pole.prototype.update = function() {
		this.y += this.verticalSpeed;
		
		if (spritesDoOverlap(this, playerBikes.player2)) {
			if (this.p2Damage === false) {
				playerBikes.player2.health = playerBikes.player2.health - 1;
				this.p2Damage = true;
			}
		}
		if (spritesDoOverlap(this, playerBikes.player1)) {
			if (this.p1Damage === false) {
				playerBikes.player1.health = playerBikes.player1.health - 1;
				this.p1Damage = true;
			}
		}
	};
	
	
	function Police(game, x, y, frame) {  
		Phaser.Sprite.call(this, game, x, y, 'police', frame);
		this.scale.setTo(0.4, 0.4)
		this.verticalSpeed = roadScrollSpeed - 5;
		var player = randomIntInRangeInclusive(1, 2)
		if (player === 1)
			this.chasee = playerBikes.player1;
		else
			this.chasee = playerBikes.player2;
		this.chainDamage = false;
	};
	
	Police.prototype = Object.create(Phaser.Sprite.prototype);
	Police.prototype.constructor = Police;
	
	Police.prototype.update = function() {
		this.y += this.verticalSpeed;
		
		var horizontalMovementSpeed = 2;
		if (this.chasee.x >= this.x + horizontalMovementSpeed) {
			this.x += horizontalMovementSpeed;
		} else if (this.chasee.x <= this.x - horizontalMovementSpeed) {
			this.x -= horizontalMovementSpeed;
		}
		
		if (spritesDoOverlap(this, playerBikes.player1)) {
			playerBikes.player1.health -= 1;
			this.destroy();
		}
		if (spritesDoOverlap(this, playerBikes.player2)) {
			playerBikes.player2.health -= 1;
			this.destroy();
		}
		if ((playerBikes.player1.bullet != null) && spritesDoOverlap(this, playerBikes.player1.bullet)) {
			playerBikes.player1.bullet.struck();
			this.destroy();
		}
		if ((playerBikes.player2.bullet != null) && spritesDoOverlap(this, playerBikes.player2.bullet)) {
			playerBikes.player2.bullet.struck();
			this.destroy();
		}
		
		for (var i = 0; i < interactableChain.length; i++) {
			if (spritesDoOverlap(this,interactableChain[i])) {
				if (this.chainDamage === false) {
					chainHealth = chainHealth - 5;
					this.chainDamage = true;
				}
				this.destroy();
			}
		}
	};
	
	function spritesDoOverlap(spriteA, spriteB) {
		var boundsA = spriteA.getBounds();
		var boundsB = spriteB.getBounds();
		
		return Phaser.Rectangle.intersects(boundsA, boundsB);
	}
};
