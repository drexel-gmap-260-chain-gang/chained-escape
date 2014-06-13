ChainedEscape = {};

ChainedEscape.Boot = function(game) {};
ChainedEscape.Boot.prototype = (function() {
	
	function preload() {
		// would load a progress bar image here if we had one
	}
	
	function create() {
		this.game.state.start('Preloader');
	}
	
	return {
		preload: preload,
		create: create
	};
})();
