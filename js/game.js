const player_accel = 40;
const player_speed = 160;
const bullet_speed = 300;
const zombie_speed = 70;
const hitbox_margin = 5

var player;
var bullets;
var enemies;
var mov_keys;
var gun_keys;
var game_scene;
var spawns;

var invincibility;
var is_fullscreen;
var enemy_per_second;
var life;

function fire(key_event)
{
  let bullet = bullets.create(player.x, player.y, 'bullet_sprite');
  bullet.setScale(1/2);
  if (key_event.keyCode == gun_keys.LEFT.keyCode) {
    bullet.setVelocityX(-1);
  } else if (key_event.keyCode == gun_keys.RIGHT.keyCode) {
    bullet.setVelocityX(1);
  }
  if (key_event.keyCode == gun_keys.UP.keyCode) {
    bullet.setVelocityY(-1);
  } else if (key_event.keyCode == gun_keys.DOWN.keyCode) {
    bullet.setVelocityY(1);
  }
  bullet.body.velocity.normalize().scale(bullet_speed);

  game_scene.sound.play('gunshot');
}

function read_enemies_spawns(map)
{
  let spawn_objs = map.createFromObjects('spawns', {
    name: 'spawn'
  });
  spawns = [];
  while (spawn_objs.length > 0) {
    let point = spawn_objs.pop();
    point.visible = false;
    spawns.push(new Phaser.Math.Vector2(point.x, point.y));
  }
}

function pop_enemies(delta)
{
  let enemy_pop_probability = enemy_per_second * (delta / 1000) * 100;
  let chance = Phaser.Math.Between(0, 100);
  if (chance < enemy_pop_probability) {
    let random_spawn = Phaser.Math.RND.pick(spawns);
    let enemy = enemies.create(random_spawn.x, random_spawn.y, 'zombie_sheet');
    enemy.setScale(1.5);
    enemy.depth = 2;
    enemy.setCircle(enemy.displayWidth/2-hitbox_margin, hitbox_margin, hitbox_margin);
    enemy.play("zombie_walk");
    enemy.setPushable(false);
  }
}

function set_camera(scene)
{
  var camera = scene.cameras.main;
  camera.setViewport(200, 0, 800, 800);
}

class DesertScene extends Phaser.Scene
{
  constructor()
  {
    super({ key: 'DesertScene' });
  }

  resetScene()
  {
    invincibility = false;
    is_fullscreen = false;
    enemy_per_second = 1;
    life = 3;
  }

  preload()
  {
    this.load.tilemapTiledJSON("desert_map", "assets/maps/desert.json");
    this.load.image('ground_image', 'assets/maps/ground_tileset.png');
    this.load.image('tuiles_image', 'assets/maps/tuiles.png');
    this.load.spritesheet(
      'bush_image', 'assets/maps/bush_tileset.png',
      {frameWidth: 32, frameHeight: 32}
    );
    this.load.image('hero_sprite', 'assets/hero_idle.png');
    this.load.image('bullet_sprite', 'assets/bullet2.png');
    this.load.spritesheet(
      'zombie_sheet', 'assets/enemy-sheet.png',
      {frameWidth: 32, frameHeight: 32}
    );
    this.load.spritesheet(
      'explosion_sheet', 'assets/explosion_pixelfied-sheet.png',
      {frameWidth: 32, frameHeight: 32}
    );

    this.load.spritesheet(
      'tsuku_front', 'assets/tsuku_front.png',
      {frameWidth: 34, frameHeight: 52}
    );

    this.load.spritesheet(
      'tsuku_back', 'assets/tsuku_back.png',
      {frameWidth: 34, frameHeight: 52}
    );

    this.load.spritesheet(
      'tsuku_left', 'assets/tsuku_left.png',
      {frameWidth: 34, frameHeight: 52}
    );

    this.load.audio('gunshot', ['assets/sounds/shot.wav']);
    this.load.audio('battle_theme', ['assets/sounds/battle_theme.mp3']);
  }

  create()
  {
    this.resetScene();

    set_camera(this);

    game_scene = this;
    const map = this.make.tilemap({ key: 'desert_map' });
    const ground_tileset = map.addTilesetImage('ground_tileset', 'ground_image');
    const tuiles_tileset = map.addTilesetImage('tuiles_tileset', 'tuiles_image');
    const bush_tileset = map.addTilesetImage('bush_tileset', 'bush_image');
    //map.createLayer('ground', ground_tileset);
    map.createLayer('ground', tuiles_tileset);
    var bush_layer = map.createLayer('bushes', bush_tileset);

    this.anims.create({
      key: 'bush_dance',
      frames: this.anims.generateFrameNumbers('bush_image', {start: 0, end: 1}),
      frameRate: 4,
      repeat: -1
    });

    const bushes_tiles = map.createFromTiles([6], -1, { useSpriteSheet: true });
    let bushes = this.physics.add.staticGroup();
    bushes_tiles.forEach((bush) => {
      bushes.add(bush);
      bush.play({key: "bush_dance", delay: Math.random() * 100});
    });

    read_enemies_spawns(map);

    player = this.physics.add.sprite(400, 200, 'tsuku_front');
    player.setCircle(player.displayWidth/2-hitbox_margin, hitbox_margin, hitbox_margin);
    player.setCollideWorldBounds(true);
    player.setPushable(false);
    player.setScale(1.5);
    player.depth = 2;

    this.anims.create({
      key: 'tsuku_front_anim',
      frames: this.anims.generateFrameNumbers('tsuku_front', {start: 1, end: 2}),
      frameRate: 4,
      repeat: -1
    });
    this.anims.create({
      key: 'tsuku_back_anim',
      frames: this.anims.generateFrameNumbers('tsuku_back', {start: 1, end: 2}),
      frameRate: 4,
      repeat: -1
    });
    this.anims.create({
      key: 'tsuku_left_anim',
      frames: this.anims.generateFrameNumbers('tsuku_left', {start: 1, end: 2}),
      frameRate: 4,
      repeat: -1
    });

    mov_keys = this.input.keyboard.addKeys({
      up: "W",
      left: "A",
      down: "S",
      right: "D",
    });
    gun_keys = this.input.keyboard.addKeys("UP,DOWN,LEFT,RIGHT");
    gun_keys.UP.on("down", fire);
    gun_keys.DOWN.on("down", fire);
    gun_keys.LEFT.on("down", fire);
    gun_keys.RIGHT.on("down", fire);

    // Fullscreen when you hit Alt+Enter
    let fullscreen_key = this.input.keyboard.addKey('ENTER');
    fullscreen_key.on('down', function(event) {
      if (!event.altKey) {
        return;
      }
      if (is_fullscreen) {
        game_scene.scale.stopFullscreen();
      } else {
        game_scene.scale.startFullscreen();
      }
      is_fullscreen = !is_fullscreen;
    });

    bullets = this.physics.add.group();

    enemies = this.physics.add.group();
    this.anims.create({
      key: 'zombie_walk',
      frames: this.anims.generateFrameNumbers('zombie_sheet', {start: 0, end: 1}),
      frameRate: 4,
      repeat: -1
    });

    this.anims.create({
      key: 'explosion',
      frames: this.anims.generateFrameNumbers('explosion_sheet', {start: 0, end: 15}),
      frameRate: 16
    });

    this.physics.add.overlap(bullets, enemies, bulletHitEnemy);
    this.physics.add.collider(enemies, bushes);
    this.physics.add.collider(player, bushes);
    this.physics.add.collider(player, enemies, enemyHitPlayer);

    this.scene.launch('UIScene');

    this.battle_theme = this.sound.add('battle_theme');
    this.battle_theme.play();

    this.events.on('pause', function(event) {
      event.scene.battle_theme.stop();
    })
  }

  update(time, delta)
  {
    pop_enemies(delta);
    player_movement();
    enemies.getChildren().forEach(enemy =>
      game_scene.physics.moveToObject(enemy, player, zombie_speed));

    clearBullets(this);
  }
}

function player_movement()
{
  player.setVelocity(0);

  if (mov_keys.left.isDown) {
    player.setVelocityX(-1);
    player.play('tsuku_left_anim', true);
    player.setFlipX(false);
  }
  else if (mov_keys.right.isDown) {
    player.setVelocityX(1);
    player.play('tsuku_left_anim', true);
    player.setFlipX(true);
  }

  if (mov_keys.up.isDown) {
    player.setVelocityY(-1);
    player.play('tsuku_back_anim', true);
  } else if (mov_keys.down.isDown) {
    player.setVelocityY(1);
    player.play('tsuku_front_anim', true);
  }

  // Normalize and scale the velocity so that player can't move faster along a diagonal
  player.body.velocity.normalize().scale(player_speed);
}

function clearBullets(scene)
{
  let i = bullets.getLength();
  while (i--) {
    let bullet = bullets.getChildren()[i];
    if ((bullet.x < -(bullet.displayWidth/2))
      || (bullet.x > (scene.game.config.width + bullet.displayWidth/2))
      || (bullet.y < -(bullet.displayHeight/2))
      || (bullet.y > (scene.game.config.height + bullet.displayHeight/2)))
    {
      bullet.destroy();
    } 
  }
}

function bulletHitEnemy(bullet, enemy)
{
  bullet.destroy();
  enemy.body.enable = false;
  enemy.play('explosion');
  enemy.once('animationcomplete', () =>  {
    enemy.destroy();
  })
}

function enemyHitPlayer(player, enemy)
{
  player.setVelocity(0);
  enemy.setVelocity(0);

  if (invincibility) {
    return;
  }

  invincibility = true;

  life--;
  life_text.setText('x '+life.toString());
  if (life == 0) {
    game_scene.scene.launch('GameOverScene');
  }

  game_scene.tweens.add({
    targets: player,
    props: {
      alpha: { value: 0, duration: 200, yoyo: true },
    },
    repeat: 1,
    ease: 'Linear',
    onComplete: () => {
      invincibility = false;
    }
  });
}

var config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1000,
    height: 800
  },
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      debugShowBody: false,
      debugShowStaticBody: false,
    }
  },
  scene: [DesertScene, UI, GameOver]
  //scene: [Menu]
};

var game = new Phaser.Game(config);
