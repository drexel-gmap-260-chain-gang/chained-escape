ChainedEscape = {};

ChainedEscape.Boot = function(game) {};
ChainedEscape.Boot.prototype = (function() {
	
	function preload() {
		game.load.image('preload-bar-background', 'images/preload-bar-background.png');
		game.load.image('preload-bar-fill', 'images/preload-bar-fill.png');
	}
	
	function create() {
		this.game.state.start('Preloader');
	}
	
	return {
		preload: preload,
		create: create
	};
})();
