const gameover_fade_duration = 1000;
const gameover_fade_text_duration = 1500;

class GameOver extends Phaser.Scene
{
  retry_enable;
  death_theme;

  constructor()
  {
    super({ key: 'GameOverScene' });
  }

  resetScene()
  {
    this.retry_enable = false;
  }

  preload()
  {
    this.load.image('skull', 'assets/rose-skull.png');

    this.load.audio('agony', ['assets/sounds/gameover.mp3']);
  }

  create()
  {
    this.resetScene();

    this.scene.pause('DesertScene');

    this.death_theme = this.sound.add('agony', {
      volume: 0.2
    });
    this.death_theme.play();

    // fade to black
    let camWidth = this.cameras.main.width;
    let camHeight = this.cameras.main.height;
    let rt = this.add.renderTexture(camWidth / 2, camHeight / 2, camWidth, camHeight);
    rt.fill(0x000000); // black
    rt.setAlpha(0);
    this.tweens.add({
      targets: rt,
      props: {
        alpha: { value: 0.5, duration: gameover_fade_duration},
      }
    });

    let image = this.add.image(300, camHeight / 2, 'skull').setOrigin(0.5);
    image.setAlpha(0);
    this.tweens.add({
      targets: image,
      props: {
        alpha: { value: 1, duration: gameover_fade_text_duration},
      }
    });

    let msg = 'What a horrible night\nto have a curse...\n<Press space to retry>'
    let gameover_text = this.add.text(620, camHeight / 2, msg, {
      fontSize: '30px'
    }).setOrigin(0.5);
    gameover_text.setAlpha(0);
    this.tweens.add({
      targets: gameover_text,
      props: {
        alpha: { value: 1, duration: gameover_fade_text_duration},
      },
      onComplete: () => {
        this.retry_enable = true;
      }
    });

    this.input.keyboard.on('keydown-SPACE', function (event) {
      if (this.scene.retry_enable) {
        this.scene.scene.start('DesertScene');
        this.scene.death_theme.stop();
      }
    });
  }
}
