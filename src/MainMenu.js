ChainedEscape.MainMenu = function(game) {};
ChainedEscape.MainMenu.prototype = (function() {
	
	function create() {
		var titleText = this.add.text(35, 150, "Chained Escape", {font: "72px Arial", fill: "#ddbbbb", align: "center"});
		var instructionsButton = this.add.button(150, 350, 'instructions-button', openInstructions, this);
		var startGameButton = this.add.button(150, 470, 'start-game-button', startGame, this);
		this.stage.backgroundColor = "#404040";
	}
	
	function startGame() {
		this.game.state.start('OpeningCinematic');
	}
	
	function openInstructions() {
		this.game.state.start('Instructions');
	}
	
	return {
		create: create
	};
})();
