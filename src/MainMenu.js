ChainedEscape.MainMenu = function(game) {};
ChainedEscape.MainMenu.prototype = (function() {
	
	function create() {
		var titleText = this.add.text(35, 150, "Chained Escape", {font: "72px Arial", fill: "#ddbbbb", align: "center"});
		var startGameButton = this.add.button(160, 400, 'start-game-button', startGame, this, 1);
		this.stage.backgroundColor = "#404040";
	}
	
	function startGame() {
		this.game.state.start('Game');
	}
	
	return {
		create: create
	};
})();
