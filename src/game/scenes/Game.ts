import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    player: Phaser.Physics.Arcade.Sprite;
    obstacles: Phaser.Physics.Arcade.StaticGroup;
    moveSpeed: number;
    worldWidth: number;
    worldHeight: number;

    constructor ()
    {
        super('Game');

        this.moveSpeed = 220;
        this.worldWidth = 2560;
        this.worldHeight = 1792;
    }

    create ()
    {
        this.createMapTextures();

        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x2a4858);
        this.camera.setBounds(0, 0, this.worldWidth, this.worldHeight);

        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

        this.drawGround();

        this.obstacles = this.physics.add.staticGroup();
        this.buildVillage();

        this.player = this.physics.add.sprite(320, this.worldHeight - 260, 'player-char');
        this.player.setScale(1);
        this.player.setCollideWorldBounds(true);
        this.player.setSize(24, 26);
        this.player.setOffset(12, 20);
        this.player.setDepth(this.player.y);

        this.physics.add.collider(this.player, this.obstacles);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.camera.startFollow(this.player, true, 0.14, 0.14);
        this.camera.roundPixels = true;

        this.add.text(18, 18, 'Deplacement: fleches clavier', {
            fontFamily: 'Arial',
            fontSize: 22,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(2000);

        EventBus.emit('current-scene-ready', this);
    }

    createMapTextures ()
    {
        if (!this.textures.exists('grass-tile'))
        {
            const grass = this.add.graphics();
            grass.fillStyle(0x5f9b4e, 1);
            grass.fillRect(0, 0, 64, 64);
            grass.fillStyle(0x6ead57, 1);
            grass.fillRect(0, 0, 64, 32);
            grass.fillStyle(0x4b8b40, 1);
            grass.fillRect(12, 8, 6, 6);
            grass.fillRect(44, 34, 5, 5);
            grass.fillRect(30, 52, 6, 6);
            grass.generateTexture('grass-tile', 64, 64);
            grass.destroy();
        }

        if (!this.textures.exists('path-tile'))
        {
            const path = this.add.graphics();
            path.fillStyle(0xa88a62, 1);
            path.fillRect(0, 0, 64, 64);
            path.fillStyle(0x93744f, 1);
            path.fillRect(8, 10, 6, 6);
            path.fillRect(42, 24, 6, 6);
            path.fillRect(24, 46, 8, 8);
            path.generateTexture('path-tile', 64, 64);
            path.destroy();
        }

        if (!this.textures.exists('wall-block'))
        {
            const wall = this.add.graphics();
            wall.fillStyle(0x7f7368, 1);
            wall.fillRect(0, 0, 64, 64);
            wall.lineStyle(2, 0x5d534b, 1);
            wall.strokeRect(2, 2, 60, 60);
            wall.lineBetween(32, 0, 32, 64);
            wall.lineBetween(0, 32, 64, 32);
            wall.generateTexture('wall-block', 64, 64);
            wall.destroy();
        }

        if (!this.textures.exists('tree-oak'))
        {
            const tree = this.add.graphics();
            tree.fillStyle(0x5b3a28, 1);
            tree.fillRect(26, 54, 12, 18);
            tree.fillStyle(0x2f6b3b, 1);
            tree.fillCircle(32, 30, 26);
            tree.fillStyle(0x3c7d47, 1);
            tree.fillCircle(22, 24, 12);
            tree.fillCircle(41, 22, 11);
            tree.generateTexture('tree-oak', 64, 80);
            tree.destroy();
        }

        if (!this.textures.exists('house-small'))
        {
            const house = this.add.graphics();
            house.fillStyle(0x8f6446, 1);
            house.fillRect(16, 38, 96, 64);
            house.fillStyle(0xc86c3e, 1);
            house.fillTriangle(8, 40, 120, 40, 64, 6);
            house.fillStyle(0x5f3d2b, 1);
            house.fillRect(56, 66, 16, 36);
            house.fillStyle(0x9fd4ec, 1);
            house.fillRect(28, 58, 18, 16);
            house.fillRect(82, 58, 18, 16);
            house.generateTexture('house-small', 128, 110);
            house.destroy();
        }

        if (!this.textures.exists('player-char'))
        {
            const player = this.add.graphics();
            player.fillStyle(0x2b2b2b, 0.28);
            player.fillEllipse(24, 44, 26, 10);

            player.fillStyle(0xf4c9a2, 1);
            player.fillCircle(24, 12, 9);

            player.fillStyle(0x2f3f9e, 1);
            player.fillRect(13, 22, 22, 15);

            player.fillStyle(0x263067, 1);
            player.fillRect(13, 37, 10, 10);
            player.fillRect(25, 37, 10, 10);

            player.fillStyle(0x80582f, 1);
            player.fillRect(12, 45, 10, 3);
            player.fillRect(26, 45, 10, 3);

            player.generateTexture('player-char', 48, 48);
            player.destroy();
        }
    }

    drawGround ()
    {
        for (let y = 32; y < this.worldHeight; y += 64)
        {
            for (let x = 32; x < this.worldWidth; x += 64)
            {
                this.add.image(x, y, 'grass-tile').setDepth(-1000);
            }
        }

        // Main path from the spawn to village center.
        for (let x = 224; x <= 1344; x += 64)
        {
            this.add.image(x, this.worldHeight - 256, 'path-tile').setDepth(-990);
        }

        for (let y = this.worldHeight - 256; y >= this.worldHeight - 704; y -= 64)
        {
            this.add.image(1344, y, 'path-tile').setDepth(-990);
        }
    }

    addObstacle (x: number, y: number, texture: string, scale = 1)
    {
        const obstacle = this.physics.add.staticImage(x, y, texture);
        obstacle.setScale(scale);
        obstacle.setDepth(y);
        obstacle.refreshBody();
        this.obstacles.add(obstacle);
        return obstacle;
    }

    buildVillage ()
    {
        // Outer wall.
        for (let x = 32; x < this.worldWidth; x += 64)
        {
            this.addObstacle(x, 32, 'wall-block');
            this.addObstacle(x, this.worldHeight - 32, 'wall-block');
        }
        for (let y = 96; y < this.worldHeight - 64; y += 64)
        {
            this.addObstacle(32, y, 'wall-block');
            this.addObstacle(this.worldWidth - 32, y, 'wall-block');
        }

        // Houses.
        this.addObstacle(1040, this.worldHeight - 930, 'house-small', 1);
        this.addObstacle(1460, this.worldHeight - 930, 'house-small', 1);
        this.addObstacle(1280, this.worldHeight - 1140, 'house-small', 1.1);

        // Trees clusters.
        const trees = [
            { x: 470, y: this.worldHeight - 420 },
            { x: 560, y: this.worldHeight - 520 },
            { x: 680, y: this.worldHeight - 450 },
            { x: 1910, y: this.worldHeight - 420 },
            { x: 2010, y: this.worldHeight - 530 },
            { x: 1810, y: this.worldHeight - 560 },
            { x: 860, y: this.worldHeight - 1250 },
            { x: 1780, y: this.worldHeight - 1290 },
            { x: 620, y: this.worldHeight - 1350 },
            { x: 2060, y: this.worldHeight - 1380 }
        ];

        trees.forEach((tree) =>
        {
            this.addObstacle(tree.x, tree.y, 'tree-oak');
        });

        // Village fences / small walls.
        for (let x = 896; x <= 1664; x += 64)
        {
            if (x < 1216 || x > 1408)
            {
                this.addObstacle(x, this.worldHeight - 770, 'wall-block');
            }
            this.addObstacle(x, this.worldHeight - 1220, 'wall-block');
        }

        for (let y = this.worldHeight - 1156; y <= this.worldHeight - 834; y += 64)
        {
            this.addObstacle(896, y, 'wall-block');
            this.addObstacle(1664, y, 'wall-block');
        }
    }

    update ()
    {
        if (!this.player || !this.cursors)
        {
            return;
        }

        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0);

        // 4-direction movement only (no jump, no diagonal) at constant speed.
        if (this.cursors.left.isDown)
        {
            body.setVelocityX(-this.moveSpeed);
        }
        else if (this.cursors.right.isDown)
        {
            body.setVelocityX(this.moveSpeed);
        }
        else if (this.cursors.up.isDown)
        {
            body.setVelocityY(-this.moveSpeed);
        }
        else if (this.cursors.down.isDown)
        {
            body.setVelocityY(this.moveSpeed);
        }

        this.player.setDepth(this.player.y);
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
