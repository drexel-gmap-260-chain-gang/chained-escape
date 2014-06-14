ChainedEscape.Instructions = function(game) {};
ChainedEscape.Instructions.prototype = (function() {
	
	function create() {
		var titleText = this.add.image(0, 0, 'instructions');
		var backButton = this.add.button(12, 710, 'instructions-back-button', goBack, this, 1);
	}
	
	function goBack() {
		this.game.state.start('MainMenu');
	}
	
	return {
		create: create
	};
})();
