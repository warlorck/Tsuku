class Menu extends Phaser.Scene
{
  constructor()
  {
    super({ key: 'MenuScene' });
  }

  preload()
  {
    this.load.image('background', 'assets/Tsuku_Main_Screen.png');

    this.load.audio('menu_theme', ['assets/sounds/menu_theme.mp3']);
  }

  create()
  {
    let image = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'background');
    let scaleX = this.cameras.main.width / image.width;
    let scaleY = this.cameras.main.height / image.height;
    let scale = Math.max(scaleX, scaleY);
    image.setScale(scale).setScrollFactor(0);

    this.menu_theme = this.sound.add('menu_theme', {
      volume: 0.6
    });
    this.menu_theme.play();

    let start_text = this.add.text(500, 550,
      'Appuyer sur Espace\n  pour commencer', {
      fontSize: '25px'
    }).setOrigin(0.5);
    start_text.setAlpha(1);
    this.tweens.add({
      targets: start_text,
      props: {
        alpha: { value: 0, duration: 500, yoyo: true },
      },
      repeat: -1
    });

    let credit_text = this.add.text(900, 780,
      'Fond par PixelArtJourney', {
      fontSize: '12px'
    }).setOrigin(0.5);

    register_fullscreen_input(this);

    this.input.keyboard.on('keydown-SPACE', function (event) {
        this.scene.scene.start('DesertScene');
        this.scene.menu_theme.stop();
    });

    let control_msg = '          [Contrôles]\n'
    control_msg += 'Se déplacer : ZQSD\n'
    control_msg += 'Tirer : Touches directionnelles\n'
    control_msg += 'Plein écran : Alt+Entrée'
    this.add.text(500, 660, control_msg, {
      fontSize: '25px'
    }).setOrigin(0.5);
  }
}
