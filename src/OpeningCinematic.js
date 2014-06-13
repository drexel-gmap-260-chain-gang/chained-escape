ChainedEscape.OpeningCinematic = function(game) {};
ChainedEscape.OpeningCinematic.prototype = (function() {
	
	var displayedImage; // holds the current image of the comic
	var displayTimeForImagesInSecs = [3, 3, 4, 4];
	var sirenSound;
	var skipText;
	var timeoutId;
	
	function create() {
		addHotkey(Phaser.Keyboard.SPACEBAR, startGame, this);
		addHotkey(Phaser.Keyboard.ENTER, startGame, this);
		addHotkey(Phaser.Keyboard.NUMPAD_ENTER, startGame, this);
		addHotkey(Phaser.Keyboard.ESC, startGame, this);
		sirenSound = game.add.audio('cops-coming');
		
		displayPage1();
		skipText = game.add.text(468, 785, "Press Space to skip", {font: "12px Arial", fill: "#444444", align: "right"});
	}
	
	function addHotkey(keyCode, handler, handlerContext) {
		var hotkey = game.input.keyboard.addKey(keyCode);
		hotkey.onDown.add(handler, handlerContext);
	}
	
	function displayPage1() {
		displayedImage = game.add.image(0, 0, 'opening-comic-1');
		timeoutId = setTimeout(displayPage2, displayTimeForImagesInSecs[0] * 1000);
	}
	
	function displayPage2() {
		displayedImage.loadTexture('opening-comic-2');
		timeoutId = setTimeout(displayPage3, displayTimeForImagesInSecs[1] * 1000);
	}
	
	function displayPage3() {
		displayedImage.loadTexture('opening-comic-3');
		sirenSound.play();
		timeoutId = setTimeout(displayPage4, displayTimeForImagesInSecs[2] * 1000);
	}
	
	function displayPage4() {
		displayedImage.loadTexture('opening-comic-4');
		timeoutId = setTimeout(startGame, displayTimeForImagesInSecs[3] * 1000);
	}
	
	function startGame() {
		clearTimeout(timeoutId);
		if (sirenSound !== undefined) {
			sirenSound.stop();
		}
		this.game.state.start('Game');
	}
	
	return {
		create: create
	};
})();
