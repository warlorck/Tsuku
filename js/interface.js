var life_text;

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
  }
}
