class Menu extends Phaser.Scene
{
  constructor()
  {
    super({ key: 'MenuScene' });
  }

  preload()
  {
    this.load.image('background', 'assets/Tsuku_Main_Screen.png');
  }

  create()
  {
    let image = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background');
    let scaleX = this.cameras.main.width / image.width;
    let scaleY = this.cameras.main.height / image.height;
    let scale = Math.max(scaleX, scaleY);
    image.setScale(scale).setScrollFactor(0);
  }
}
