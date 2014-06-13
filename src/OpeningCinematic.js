ChainedEscape.OpeningCinematic = function(game) {};
ChainedEscape.OpeningCinematic.prototype = (function() {
	
	var displayedImage; // holds the current image of the comic
	var delayBetweenImagesInMs = 3*1000;
	var sirenSound;
	var timeoutId;
	
	function create() {
		displayPage1();
		// FIXME space doesn’t work when enabled
		//addHotkey(Phaser.Keyboard.SPACE, startGame, this);
		addHotkey(Phaser.Keyboard.ESC, startGame, this);
	}
	
	function addHotkey(keyCode, handler, handlerContext) {
		var hotkey = game.input.keyboard.addKey(keyCode);
		hotkey.onDown.add(handler, handlerContext);
	}
	
	function displayPage1() {
		displayedImage = game.add.image(0, 0, 'opening-comic-1');
		timeoutId = setTimeout(displayPage2, delayBetweenImagesInMs);
	}
	
	function displayPage2() {
		displayedImage.destroy();
		displayedImage = game.add.image(0, 0, 'opening-comic-2');
		timeoutId = setTimeout(displayPage3, delayBetweenImagesInMs);
	}
	
	function displayPage3() {
		displayedImage.destroy();
		displayedImage = game.add.image(0, 0, 'opening-comic-3');
		timeoutId = setTimeout(displayPage4, delayBetweenImagesInMs);
		sirenSound = game.add.audio('cops-coming');
		sirenSound.play();
	}
	
	function displayPage4() {
		displayedImage.destroy();
		displayedImage = game.add.image(0, 0, 'opening-comic-4');
		timeoutId = setTimeout(startGame, delayBetweenImagesInMs);
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
