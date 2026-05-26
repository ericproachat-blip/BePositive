import { EventBus } from '../EventBus';
import { BlendModes, Math as PhaserMath, Scene } from 'phaser';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    player: Phaser.Physics.Arcade.Sprite;
    obstacles: Phaser.Physics.Arcade.StaticGroup;
    lamp: Phaser.GameObjects.Sprite;
    lampGlow: Phaser.GameObjects.Arc;
    lampVisible: boolean;
    lampActivated: boolean;
    lampTriggerDistance: number;
    lampRevealYThreshold: number;
    npc: Phaser.GameObjects.Sprite;
    npcTears: Phaser.GameObjects.Arc[];
    npcSadTweens: Phaser.Tweens.Tween[];
    npcIsHappy: boolean;
    npcTriggerDistance: number;
    moveSpeed: number;
    worldWidth: number;
    worldHeight: number;

    constructor ()
    {
        super('Game');

        this.moveSpeed = 220;
        this.worldWidth = 2560;
        this.worldHeight = 1792;
        this.lampVisible = false;
        this.lampActivated = false;
        this.lampTriggerDistance = 64;
        this.lampRevealYThreshold = 520;
        this.npcTears = [];
        this.npcSadTweens = [];
        this.npcIsHappy = false;
        this.npcTriggerDistance = 84;
    }

    create ()
    {
        this.createMapTextures();

        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(0x1c262e);
        this.camera.setBounds(0, 0, this.worldWidth, this.worldHeight);

        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

        this.drawGround();

        this.obstacles = this.physics.add.staticGroup();
        this.buildVillage();

        this.createLamp(1280, 220);

        const spawnX = this.worldWidth / 2;
        const spawnY = this.worldHeight / 2;

        this.player = this.physics.add.sprite(spawnX, spawnY, 'player-char');
        this.player.setScale(1);
        this.player.setCollideWorldBounds(true);
        this.player.setSize(24, 26);
        this.player.setOffset(12, 20);
        this.player.setDepth(this.player.y);

        this.createNpc(1540, 980);

        this.physics.add.collider(this.player, this.obstacles);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard?.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT']);

        this.camera.startFollow(this.player, true, 0.14, 0.14);
        this.camera.roundPixels = true;
        this.camera.centerOn(spawnX, spawnY);

        this.createSadAtmosphere();

        this.add.text(18, 18, 'Deplacement: fleches clavier', {
            fontFamily: 'Arial',
            fontSize: 22,
            color: '#d7dde0',
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
            grass.fillStyle(0x697563, 1);
            grass.fillRect(0, 0, 64, 64);
            grass.fillStyle(0x74806d, 1);
            grass.fillRect(0, 0, 64, 32);
            grass.fillStyle(0x5b6457, 1);
            grass.fillRect(12, 8, 6, 6);
            grass.fillRect(44, 34, 5, 5);
            grass.fillRect(30, 52, 6, 6);
            grass.generateTexture('grass-tile', 64, 64);
            grass.destroy();
        }

        if (!this.textures.exists('path-tile'))
        {
            const path = this.add.graphics();
            path.fillStyle(0x8a806f, 1);
            path.fillRect(0, 0, 64, 64);
            path.fillStyle(0x73695d, 1);
            path.fillRect(8, 10, 6, 6);
            path.fillRect(42, 24, 6, 6);
            path.fillRect(24, 46, 8, 8);
            path.generateTexture('path-tile', 64, 64);
            path.destroy();
        }

        if (!this.textures.exists('wall-block'))
        {
            const wall = this.add.graphics();
            wall.fillStyle(0x676764, 1);
            wall.fillRect(0, 0, 64, 64);
            wall.lineStyle(2, 0x4f4e4c, 1);
            wall.strokeRect(2, 2, 60, 60);
            wall.lineBetween(32, 0, 32, 64);
            wall.lineBetween(0, 32, 64, 32);
            wall.generateTexture('wall-block', 64, 64);
            wall.destroy();
        }

        if (!this.textures.exists('tree-oak'))
        {
            const tree = this.add.graphics();
            tree.fillStyle(0x4a3d35, 1);
            tree.fillRect(26, 54, 12, 18);
            tree.fillStyle(0x56645b, 1);
            tree.fillCircle(32, 30, 26);
            tree.fillStyle(0x646f67, 1);
            tree.fillCircle(22, 24, 12);
            tree.fillCircle(41, 22, 11);
            tree.generateTexture('tree-oak', 64, 80);
            tree.destroy();
        }

        if (!this.textures.exists('house-small'))
        {
            const house = this.add.graphics();
            house.fillStyle(0x74685f, 1);
            house.fillRect(16, 38, 96, 64);
            house.fillStyle(0x7f6558, 1);
            house.fillTriangle(8, 40, 120, 40, 64, 6);
            house.fillStyle(0x584740, 1);
            house.fillRect(56, 66, 16, 36);
            house.fillStyle(0x515961, 1);
            house.fillRect(28, 58, 18, 16);
            house.fillRect(82, 58, 18, 16);
            house.lineStyle(2, 0x43484d, 1);
            house.strokeRect(28, 58, 18, 16);
            house.strokeRect(82, 58, 18, 16);
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

        if (!this.textures.exists('lamp-off'))
        {
            const lampOff = this.add.graphics();
            lampOff.fillStyle(0x5f5f5f, 1);
            lampOff.fillRect(28, 24, 8, 40);
            lampOff.fillStyle(0x2e2e2e, 1);
            lampOff.fillCircle(32, 20, 10);
            lampOff.fillStyle(0x1c1c1c, 1);
            lampOff.fillCircle(32, 20, 6);
            lampOff.generateTexture('lamp-off', 64, 64);
            lampOff.destroy();
        }

        if (!this.textures.exists('lamp-on'))
        {
            const lampOn = this.add.graphics();
            lampOn.fillStyle(0x5f5f5f, 1);
            lampOn.fillRect(28, 24, 8, 40);
            lampOn.fillStyle(0x2e2e2e, 1);
            lampOn.fillCircle(32, 20, 10);
            lampOn.fillStyle(0xffdd7a, 1);
            lampOn.fillCircle(32, 20, 6);
            lampOn.generateTexture('lamp-on', 64, 64);
            lampOn.destroy();
        }

        if (!this.textures.exists('npc-sad'))
        {
            const npcSad = this.add.graphics();
            npcSad.fillStyle(0x2b2b2b, 0.22);
            npcSad.fillEllipse(24, 50, 24, 8);

            npcSad.fillStyle(0xf2c7a2, 1);
            npcSad.fillCircle(24, 14, 10);

            npcSad.fillStyle(0x4d5a7a, 1);
            npcSad.fillRect(13, 24, 22, 16);
            npcSad.fillStyle(0x3c455f, 1);
            npcSad.fillRect(14, 40, 9, 9);
            npcSad.fillRect(25, 40, 9, 9);

            npcSad.fillStyle(0x1e1e1e, 1);
            npcSad.fillRect(19, 14, 2, 2);
            npcSad.fillRect(27, 14, 2, 2);
            npcSad.fillRect(18, 21, 12, 2);

            npcSad.generateTexture('npc-sad', 48, 56);
            npcSad.destroy();
        }

        if (!this.textures.exists('npc-happy'))
        {
            const npcHappy = this.add.graphics();
            npcHappy.fillStyle(0x2b2b2b, 0.22);
            npcHappy.fillEllipse(24, 50, 24, 8);

            npcHappy.fillStyle(0xf2c7a2, 1);
            npcHappy.fillCircle(24, 14, 10);

            npcHappy.fillStyle(0x4ea86e, 1);
            npcHappy.fillRect(13, 24, 22, 16);
            npcHappy.fillStyle(0x3a7e54, 1);
            npcHappy.fillRect(14, 40, 9, 9);
            npcHappy.fillRect(25, 40, 9, 9);

            npcHappy.fillStyle(0x1e1e1e, 1);
            npcHappy.fillRect(19, 14, 2, 2);
            npcHappy.fillRect(27, 14, 2, 2);
            npcHappy.fillRect(20, 21, 8, 2);
            npcHappy.fillRect(18, 20, 2, 2);
            npcHappy.fillRect(28, 20, 2, 2);

            npcHappy.generateTexture('npc-happy', 48, 56);
            npcHappy.destroy();
        }
    }

    createNpc (x: number, y: number)
    {
        this.npc = this.add.sprite(x, y, 'npc-sad').setDepth(y);
        this.npc.setAngle(12);
        this.npc.setScale(1, 0.96);

        const leftTear = this.add.circle(x - 6, y - 14, 2, 0x8cc7ff, 0.95).setDepth(y + 2);
        const rightTear = this.add.circle(x + 6, y - 14, 2, 0x8cc7ff, 0.95).setDepth(y + 2);
        this.npcTears = [leftTear, rightTear];

        this.npcSadTweens = this.npcTears.map((tear, index) =>
        {
            const baseY = tear.y;
            const baseX = tear.x;

            return this.tweens.add({
                targets: tear,
                y: baseY + 12,
                alpha: { from: 0.95, to: 0.15 },
                duration: 420 + (index * 70),
                repeat: -1,
                ease: 'Linear',
                onRepeat: () =>
                {
                    tear.y = baseY;
                    tear.x = baseX + PhaserMath.Between(-1, 1);
                    tear.alpha = 0.95;
                }
            });
        });

        this.npcSadTweens.push(this.tweens.add({
            targets: this.npc,
            angle: { from: 10, to: 14 },
            duration: 850,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        }));
    }

    checkNpcProximity ()
    {
        if (this.npcIsHappy || !this.npc)
        {
            return;
        }

        const distance = PhaserMath.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y);

        if (distance <= this.npcTriggerDistance)
        {
            this.makeNpcHappy();
        }
    }

    makeNpcHappy ()
    {
        if (this.npcIsHappy)
        {
            return;
        }

        this.npcIsHappy = true;

        this.npcSadTweens.forEach((tween) => tween.stop());
        this.npcSadTweens = [];

        this.npcTears.forEach((tear) => tear.setVisible(false));

        this.npc.setTexture('npc-happy');

        this.tweens.add({
            targets: this.npc,
            angle: 0,
            scaleY: 1,
            duration: 320,
            ease: 'Back.easeOut'
        });

        this.tweens.add({
            targets: this.npc,
            scaleX: { from: 1, to: 1.08 },
            scaleY: { from: 1, to: 1.08 },
            yoyo: true,
            repeat: 1,
            duration: 180,
            ease: 'Sine.easeOut'
        });

        const joyAura = this.add.circle(this.npc.x, this.npc.y - 18, 34, 0xfff2a6, 0.38)
            .setBlendMode(BlendModes.ADD)
            .setDepth(this.npc.y + 3);

        this.tweens.add({
            targets: joyAura,
            alpha: { from: 0.38, to: 0 },
            scale: { from: 0.75, to: 1.35 },
            duration: 650,
            ease: 'Sine.easeOut',
            onComplete: () => joyAura.destroy()
        });
    }

    createLamp (x: number, y: number)
    {
        this.lamp = this.add.sprite(x, y, 'lamp-off').setDepth(y + 1).setVisible(false);
        this.lampGlow = this.add.circle(x, y - 8, 88, 0xffde8a, 0.34)
            .setBlendMode(BlendModes.ADD)
            .setVisible(false)
            .setDepth(y - 1);
    }

    createSadAtmosphere ()
    {
        const fogPatches = [
            { x: 540, y: 420, width: 420, height: 140, alpha: 0.12 },
            { x: 1260, y: 260, width: 520, height: 170, alpha: 0.14 },
            { x: 1960, y: 620, width: 440, height: 150, alpha: 0.1 },
            { x: 880, y: 1220, width: 560, height: 180, alpha: 0.09 }
        ];

        fogPatches.forEach((patch) =>
        {
            this.add.ellipse(patch.x, patch.y, patch.width, patch.height, 0xc8d0d5, patch.alpha)
                .setDepth(1400);
        });

        this.add.ellipse(1380, 180, 620, 160, 0x8f969d, 0.18)
            .setDepth(1450);
        this.add.ellipse(1710, 220, 300, 90, 0x959ba1, 0.12)
            .setDepth(1451);

        this.add.rectangle(this.worldWidth / 2, this.worldHeight / 2, this.worldWidth, this.worldHeight, 0x5d6772, 0.12)
            .setDepth(1490);

        this.add.rectangle(512, 384, 1024, 768, 0x3f4952, 0.2)
            .setScrollFactor(0)
            .setDepth(3000);

        this.add.rectangle(512, 60, 1024, 120, 0x2d3338, 0.18)
            .setScrollFactor(0)
            .setDepth(3001);
        this.add.rectangle(512, 708, 1024, 120, 0x2d3338, 0.12)
            .setScrollFactor(0)
            .setDepth(3001);
    }

    revealLampIfDiscovered ()
    {
        if (this.lampVisible)
        {
            return;
        }

        // The lamp is hidden at first and appears only once the player explores upper map.
        if (this.player.y <= this.lampRevealYThreshold)
        {
            this.lampVisible = true;
            this.lamp.setVisible(true);
        }
    }

    activateLamp ()
    {
        if (this.lampActivated)
        {
            return;
        }

        this.lampActivated = true;
        this.lamp.setTexture('lamp-on');
        this.lampGlow.setVisible(true);
        this.lampGlow.setScale(0.5);

        this.tweens.add({
            targets: this.lampGlow,
            alpha: { from: 0.15, to: 0.42 },
            scale: { from: 0.5, to: 1 },
            duration: 500,
            ease: 'Sine.easeOut'
        });

        this.tweens.add({
            targets: this.lampGlow,
            alpha: { from: 0.42, to: 0.28 },
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    checkLampProximity ()
    {
        if (!this.lampVisible || this.lampActivated)
        {
            return;
        }

        const distance = PhaserMath.Distance.Between(this.player.x, this.player.y, this.lamp.x, this.lamp.y);

        // Trigger automatically at one tile distance.
        if (distance <= this.lampTriggerDistance)
        {
            this.activateLamp();
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
        if (this.cursors.left?.isDown)
        {
            body.setVelocityX(-this.moveSpeed);
        }
        else if (this.cursors.right?.isDown)
        {
            body.setVelocityX(this.moveSpeed);
        }
        else if (this.cursors.up?.isDown)
        {
            body.setVelocityY(-this.moveSpeed);
        }
        else if (this.cursors.down?.isDown)
        {
            body.setVelocityY(this.moveSpeed);
        }

        this.player.setDepth(this.player.y);
        if (this.npc)
        {
            this.npc.setDepth(this.npc.y);
        }
        this.checkNpcProximity();
        this.revealLampIfDiscovered();
        this.checkLampProximity();
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
