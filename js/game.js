/******************************************************************************
 * Global
 ******************************************************************************/

var game_scene;
var is_fullscreen = false;
var coins;

function register_fullscreen_input(scene)
{
  // Fullscreen when you hit Alt+Enter
  let fullscreen_key = scene.input.keyboard.addKey('ENTER');
  fullscreen_key.on('down', function(event) {
    if (!event.altKey) {
      return;
    }
    if (is_fullscreen) {
      scene.scale.stopFullscreen();
    } else {
      scene.scale.startFullscreen();
    }
    is_fullscreen = !is_fullscreen;
  });
}

function difficulty(time)
{
  percent = time / (1000 * 120);
  percent = (percent > 1) ? 1 : percent;
  enemy_speed = 70 + percent * 50;
  enemy_per_second = 0.6 + 1 * percent;
}

/******************************************************************************
 * Map
 ******************************************************************************/

var spawns;

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

/******************************************************************************
 * Player
 ******************************************************************************/

const player_accel = 40;
const player_speed = 160;
const bullet_speed = 300;
const hitbox_margin = 5
const gun_cooldown = 300;

var player;
var invincibility;
var life;
var mov_keys;
var bullets;
var gun_keys;
var gun_ready;

function player_movement()
{
  player.setVelocity(0);

  if (mov_keys.left.isDown) {
    player.setVelocityX(-1);
  }
  else if (mov_keys.right.isDown) {
    player.setVelocityX(1);
  }

  if (mov_keys.up.isDown) {
    player.setVelocityY(-1);
  } else if (mov_keys.down.isDown) {
    player.setVelocityY(1);
  }

  // Normalize and scale the velocity so that player can't move faster along a diagonal
  player.body.velocity.normalize().scale(player_speed);
}

function body_direction(velocity)
{
  let degree = Phaser.Math.RadToDeg(velocity.angle())
  let direction = Phaser.Math.RoundTo(degree / 45);
  switch (direction) {
    case 0:
      return "RIGHT";
    case 1: case 2: case 3:
      return "DOWN";
    case 4:
      return "LEFT";
    case 5: case 6: case 7:
      return "UP";
  }
}

function sprite_animation(sprite, prefix)
{
  if (sprite.body.velocity.length() < 0.1) {
    return;
  }

  let direction = body_direction(sprite.body.velocity);

  if (direction == "LEFT") {
    sprite.play(prefix + '_left_anim', true);
    sprite.setFlipX(false);
  } else if (direction == "RIGHT") {
    sprite.play(prefix + '_left_anim', true);
    sprite.setFlipX(true);
  } else if (direction == "UP") {
    sprite.play(prefix + '_back_anim', true);
  } else if (direction == "DOWN") {
    sprite.play(prefix + '_front_anim', true);
  }
}

function fire(key_event)
{
  if (!gun_ready) {
    return;
  }

  game_scene.time.delayedCall(gun_cooldown, () => {
    gun_ready = true;
  });

  gun_ready = false;

  let bullet = bullets.create(player.x, player.y, 'bullet_sprite');
  bullet.setScale(2);

  if (gun_keys.LEFT.isDown) {
    bullet.setVelocityX(-1);
  } else if (gun_keys.RIGHT.isDown) {
    bullet.setVelocityX(1);
  }

  if (gun_keys.UP.isDown) {
    bullet.setVelocityY(-1);
  } else if (gun_keys.DOWN.isDown) {
    bullet.setVelocityY(1);
  }
  bullet.body.velocity.normalize().scale(bullet_speed);

  bullet.rotation = bullet.body.velocity.angle() - Phaser.Math.PI2/4;

  game_scene.sound.play('gunshot');
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

/******************************************************************************
 * Enemies
 ******************************************************************************/

var enemies;
var enemy_per_second;
var enemy_speed;

function pop_enemies(delta)
{
  let enemy_pop_probability = enemy_per_second * (delta / 1000) * 100;
  let chance = Phaser.Math.Between(0, 100);
  if (chance < enemy_pop_probability) {
    let random_spawn = Phaser.Math.RND.pick(spawns);
    let enemy = enemies.create(random_spawn.x, random_spawn.y, 'enemy_front');
    enemy.setBodySize(enemy.displayWidth/2, enemy.displayHeight/2, true);
    enemy.setScale(1.5).refreshBody();
    enemy.depth = 2;
    //enemy.setCircle(12, 5, 20);
    enemy.setPushable(false);
  }
}

const coin_pop_probability = 15;
const coin_duration = 10000;

function pop_coin(x, y)
{
  let chance = Phaser.Math.Between(0, 100);
  if (chance < coin_pop_probability) {
    let coin = coins.create(x, y, 'coin');
    coin.play('spin');
    game_scene.time.delayedCall(coin_duration, () => {
      coin.destroy();
    });
  }
}

const wilhelm_probability = 5;

function wilhelm()
{
  let chance = Phaser.Math.Between(0, 100);
  if (chance < wilhelm_probability) {
    game_scene.sound.play('wilhelm');
  } else {
    game_scene.sound.play('quack');
  }
}

function bulletHitEnemy(bullet, enemy)
{
  bullet.destroy();
  enemy.body.enable = false;
  enemy.play('explosion');
  wilhelm();
  enemy.once('animationcomplete', () =>  {
    pop_coin(enemy.body.x, enemy.body.y);
    enemy.destroy();
  })
  updateScore(1);
}

function playerHitCoin(player, coin)
{
  game_scene.sound.play('coin_sound');
  coin.destroy();
  updateScore(5);
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

function enemies_preload(scene)
{
  let width = 38;
  let height = 50;
  scene.load.spritesheet(
    'enemy_front', 'assets/enemy_front.png',
    {frameWidth: width, frameHeight: height}
  );

  scene.load.spritesheet(
    'enemy_back', 'assets/enemy_back.png',
    {frameWidth: width, frameHeight: height}
  );

  scene.load.spritesheet(
    'enemy_left', 'assets/enemy_left.png',
    {frameWidth: width, frameHeight: height}
  );
}

function enemies_create_animations(scene)
{
  scene.anims.create({
    key: 'enemy_front_anim',
    frames: scene.anims.generateFrameNumbers('enemy_front', {start: 0, end: 3}),
    frameRate: 4,
    repeat: -1
  });
  scene.anims.create({
    key: 'enemy_back_anim',
    frames: scene.anims.generateFrameNumbers('enemy_back', {start: 0, end: 2}),
    frameRate: 4,
    repeat: -1
  });
  scene.anims.create({
    key: 'enemy_left_anim',
    frames: scene.anims.generateFrameNumbers('enemy_left', {start: 0, end: 1}),
    frameRate: 4,
    repeat: -1
  });
}

/******************************************************************************
 * Main Scene
 ******************************************************************************/

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
    //is_fullscreen = false;
    enemy_per_second = 1;
    enemy_speed = 70;
    life = 3;
    score = 0;
    gun_ready = true;
  }

  preload()
  {
    this.load.tilemapTiledJSON("desert_map", "assets/maps/desert.json");
    this.load.image('ground_center', 'assets/maps/Ground_Center.png');
    this.load.image('ground_main', 'assets/maps/Ground_Main.png');
    this.load.image('ground_side', 'assets/maps/Ground_side.png');
    this.load.image('ground_step', 'assets/maps/Ground_step.png');
    this.load.spritesheet(
      'bush_image', 'assets/maps/bush_tileset.png',
      {frameWidth: 32, frameHeight: 32}
    );

    this.load.image('hero_sprite', 'assets/hero_idle.png');
    this.load.image('bullet_sprite', 'assets/Kunai.png');
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
    this.load.spritesheet(
      'coin', 'assets/coin.png',
      {frameWidth: 32, frameHeight: 32}
    );

    this.load.audio('gunshot', ['assets/sounds/shot.wav']);
    this.load.audio('battle_theme', ['assets/sounds/battle_theme.mp3']);
    this.load.audio('coin_sound', ['assets/sounds/coin.mp3']);
    this.load.audio('wilhelm', ['assets/sounds/wilhelmscream.mp3']);
    this.load.audio('quack', ['assets/sounds/quack.mp3']);

    enemies_preload(this);
  }

  create()
  {
    this.resetScene();

    set_camera(this);

    this.anims.create({
      key: 'spin',
      frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 5 }),
      frameRate: 16,
      repeat: -1
    });

    game_scene = this;
    const map = this.make.tilemap({ key: 'desert_map' });
    const ground_center = map.addTilesetImage('Middle_Ground', 'ground_center');
    const ground_main = map.addTilesetImage('Main_Ground', 'ground_main');
    const ground_side = map.addTilesetImage('Side_Ground', 'ground_side');
    const ground_step = map.addTilesetImage('Step_Ground', 'ground_step');

    const bush_tileset = map.addTilesetImage('bush_tileset', 'bush_image');
    map.createLayer('ground', [ground_center, ground_main, ground_side, ground_step]);
    var bush_layer = map.createLayer('bushes', bush_tileset);
    this.anims.create({
      key: 'bush_dance',
      frames: this.anims.generateFrameNumbers('bush_image', {start: 0, end: 1}),
      frameRate: 4,
      repeat: -1
    });

    const bushes_tiles = map.createFromTiles([1], -1, { useSpriteSheet: true });
    let bushes = this.physics.add.staticGroup();
    bushes_tiles.forEach((bush) => {
      bushes.add(bush);
      bush.play({key: "bush_dance", delay: Math.random() * 100});
    });

    read_enemies_spawns(map);

    player = this.physics.add.sprite(400, 200, 'tsuku_front');
    player.setBodySize(player.displayWidth/2-hitbox_margin, player.displayHeight/2-hitbox_margin, true);
    player.setScale(1.5);
    player.setCollideWorldBounds(true);
    player.setPushable(false);
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
    //let fullscreen_key = this.input.keyboard.addKey('ENTER');
    //fullscreen_key.on('down', function(event) {
    //  if (!event.altKey) {
    //    return;
    //  }
    //  if (is_fullscreen) {
    //    game_scene.scale.stopFullscreen();
    //  } else {
    //    game_scene.scale.startFullscreen();
    //  }
    //  is_fullscreen = !is_fullscreen;
    //});
    register_fullscreen_input(this);

    this.anims.create({
      key: 'explosion',
      frames: this.anims.generateFrameNumbers('explosion_sheet', {start: 0, end: 15}),
      frameRate: 16
    });

    bullets = this.physics.add.group();
    enemies = this.physics.add.group();
    coins = this.physics.add.group();

    this.physics.add.overlap(player, coins, playerHitCoin);
    this.physics.add.overlap(bullets, enemies, bulletHitEnemy);
    this.physics.add.collider(enemies, bushes);
    this.physics.add.collider(player, bushes);
    this.physics.add.collider(player, enemies, enemyHitPlayer);

    this.scene.launch('UIScene');

    this.battle_theme = this.sound.add('battle_theme', {
      volume: 0.5,
      loop: true
    });
    this.battle_theme.play();

    this.events.on('pause', function(event) {
      event.scene.battle_theme.stop();
    })

    enemies_create_animations(this);
  }

  update(time, delta)
  {
    difficulty(time);
    pop_enemies(delta);
    player_movement();
    sprite_animation(player, 'tsuku');
    enemies.getChildren().forEach(enemy =>
        enemy_update(enemy)
    );

    clearBullets(this);
  }
}

function enemy_update(enemy)
{
  game_scene.physics.moveToObject(enemy, player, enemy_speed);
  if (enemy.body.enable) {
    sprite_animation(enemy, 'enemy');
  }
}

var config = {
  type: Phaser.AUTO,
  parent: "mygame",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
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
  scene: [Menu, DesertScene, UI, GameOver]
  //scene: [Menu]
};

var game = new Phaser.Game(config);
