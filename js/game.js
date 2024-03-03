const tile_size = 32;
const player_speed = 160;
const bullet_speed = 300;
var player;
var cursors;
var bushes;
var bullets;
var mov_keys;
var gun_keys;

function destroyBullet(bullet)
{
	console.log("destroy");
}

function fire(key_event)
{
	let bullet = bullets.create(player.x, player.y, 'bullet_sprite');
	bullet.body.onWorldBounds = true; // todo
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
}

class DesertScene extends Phaser.Scene
{
	preload()
	{
		this.load.tilemapTiledJSON("desert_map", "assets/maps/desert.json");
		this.load.image('ground_image', 'assets/maps/ground_tileset.png');
		this.load.spritesheet(
			'bush_image', 'assets/maps/bush_tileset.png',
			{frameWidth: 32, frameHeight: 32}
		);
		this.load.image('hero_sprite', 'assets/hero_idle.png');
		this.load.image('bullet_sprite', 'assets/bullet2.png');
	}
	
	create()
	{
		const map = this.make.tilemap({ key: 'desert_map' });
		const ground_tileset = map.addTilesetImage('ground_tileset', 'ground_image');
		const bush_tileset = map.addTilesetImage('bush_tileset', 'bush_image');
		map.createLayer('ground', ground_tileset);
		var bush_layer = map.createLayer('bushes', bush_tileset);
		
		this.anims.create({
			key: 'bush_dance',
			frames: this.anims.generateFrameNumbers('bush_image', { start: 0, end: 1 }),
			frameRate: 4,
			repeat: -1
		});
		
		const bushes_tiles = map.createFromTiles([6], -1, { useSpriteSheet: true });
		bushes = this.physics.add.staticGroup();
		bushes_tiles.forEach((bush) => {
			bushes.add(bush);
			bush.play({key: "bush_dance", delay: Math.random() * 100});
		});
		
		player = this.physics.add.sprite(100, 450, 'hero_sprite');
		player.setCollideWorldBounds(true);
		this.physics.add.collider(player, bushes);
		
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
		
		this.physics.world.on('worldbounds', (body) =>
        {
            const bullet = body.gameObject;
			bullet.destroy();
        }); // todo
		
		bullets = this.physics.add.group({collideWorldBounds: true}); // todo
	}
	
	update()
	{
		player.setVelocityX(0);
		player.setVelocityY(0);

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
		
		cursors = this.input.keyboard.createCursorKeys();
	}
}
	
var config = {
	type: Phaser.AUTO,
	width: 800,
	height: 800,
	pixelArt: true,
	physics: {
		default: 'arcade',
		arcade: {
			debug: false
		}
	},
	scene: DesertScene
};

var game = new Phaser.Game(config);