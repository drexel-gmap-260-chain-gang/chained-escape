ChainedEscape.OpeningCinematic = function(game) {};
ChainedEscape.OpeningCinematic.prototype = (function() {
	
	var displayedImage; // holds the current image of the comic
	var delayBetweenImagesInMs = 3*1000;
	
	function create() {
		displayPage1();
	}
	
	function displayPage1() {
		displayedImage = game.add.image(0, 0, 'opening-comic-1');
		setTimeout(displayPage2, delayBetweenImagesInMs);
	}
	
	function displayPage2() {
		displayedImage.destroy();
		displayedImage = game.add.image(0, 0, 'opening-comic-2');
		setTimeout(displayPage3, delayBetweenImagesInMs);
	}
	
	function displayPage3() {
		displayedImage.destroy();
		displayedImage = game.add.image(0, 0, 'opening-comic-3');
		setTimeout(displayPage4, delayBetweenImagesInMs);
	}
	
	function displayPage4() {
		displayedImage.destroy();
		displayedImage = game.add.image(0, 0, 'opening-comic-4');
		setTimeout(startGame, delayBetweenImagesInMs);
	}
	
	function startGame() {
		this.game.state.start('Game');
	}
	
	return {
		create: create
	};
})();
