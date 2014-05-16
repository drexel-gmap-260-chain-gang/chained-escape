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
		game.load.image('arrow-a', 'images/animArrow0.png');
		game.load.image('arrow-b', 'images/animArrow1.png');
	}
	
	function create() {
		game.stage.backgroundColor = "#404040";
		player1Bike = game.add.sprite(game.world.centerX - 200, game.world.centerY, 'bike-red');
		player2Bike = game.add.sprite(game.world.centerX + 100, game.world.centerY, 'bike-blue');
		game.physics.startSystem(Phaser.Physics.P2JS);  //activate physics
		game.physics.p2.gravity.y = 1200;  //realistic gravity

		createRope(15,player1Bike,player2Bike);  // length, xAnchor, yAnchor
	}
	
	function createRope(length, startSprite,endSprite){
    var lastRect;  //if we created our first rect this will contain it	
	var xLimit = Math.abs(startSprite.x - endSprite.x);
	var xInterval = xLimit / length;
	var yLimit = Math.abs(startSprite.y - endSprite.y);
	var xAnchor = startSprite.x;
	var yAnchor = startSprite.y;
	game.physics.p2.enable(startSprite,false);
	startSprite.body.data.gravityScale=0;
	startSprite.body.data.mass=9999;
	startSprite.body.static=true;
	game.physics.p2.enable(endSprite,false);
	endSprite.body.data.gravityScale=0;
	endSprite.body.data.mass=9999;
	endSprite.body.static=true;
	var height = 20;  //height for the physics body - your image height is 8px
    var width = 16;   //this is the width for the physics body.. if to small the rectangles will get scrambled together
    var maxForce =20000;  //the force that holds the rectangles together
    for(var i=0; i<=length; i++){
        var x = xAnchor+(i*xInterval);                 // all rects are on the same x position
        var y = yAnchor;               // every new rects is positioned below the last
        if (i%2==0){newRect = game.add.sprite(x, y, 'arrow-a');}   //add sprite
        else {newRect = game.add.sprite(x, y, 'arrow-b'); lastRect.bringToTop();}  //optical polish .. 
        game.physics.p2.enable(newRect,false);      // enable physicsbody
        newRect.body.setRectangle(width,height);    //set custom rectangle

        if (i==0){game.physics.p2.createRevoluteConstraint(newRect, [0,-10], startSprite, [0,10], maxForce); }  //anchor the first one created
        else{  
            newRect.body.velocity.x =100;   //give it a push :)
            newRect.body.mass =  2;  // reduce mass for evey rope element
        }
        //after the first rectangle is created we can add the constraint
        if(lastRect){game.physics.p2.createRevoluteConstraint(newRect, [0,-10], lastRect, [0,10], maxForce);}
        lastRect = newRect;
		if (i==length){game.physics.p2.createRevoluteConstraint(newRect, [0,-10], endSprite, [0,10], maxForce);}
    }; 
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
