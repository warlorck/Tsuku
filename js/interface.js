var life_text;

class UI extends Phaser.Scene   {
  constructor()
  {
    super({ key: 'UIScene' });
  }

  preload()
  {
    this.load.image('life', 'assets/life.png');
  }

  create()
  {
    this.add.image(60, 40, 'life').setScale(2);
    life_text = this.add.text(90, 40, 'x '+life.toString(), {
      fontSize: '24px'
    }).setOrigin(0);
  }
}
