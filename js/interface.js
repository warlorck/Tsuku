var life_text;
var score;
var score_text;

function updateScore(n) {
  score += n;
  score_text.setText('Score:\n'+score.toString());
}

class UI extends Phaser.Scene   {
  constructor()
  {
    super({ key: 'UIScene' });
  }

  preload()
  {
    this.load.image('life', 'assets/Tsuku_life.png');
  }

  create()
  {
    this.add.image(55, 40, 'life').setScale(0.5);
    life_text = this.add.text(90, 40, 'x '+life.toString(), {
      fontSize: '24px'
    }).setOrigin(0);
    score_text = this.add.text(35, 90, 'Score:\n0', {
      fontSize: '30px'
    }).setOrigin(0);
  }
}
