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
    lampGlowOuter: Phaser.GameObjects.Arc;
    lampBloomFlowers: Phaser.GameObjects.Image[];
    lampVisible: boolean;
    lampActivated: boolean;
    lampTriggerDistance: number;
    lampRevealYThreshold: number;
    npc: Phaser.GameObjects.Sprite;
    npcTears: Phaser.GameObjects.Arc[];
    npcSadTweens: Phaser.Tweens.Tween[];
    npcIsHappy: boolean;
    npcTriggerDistance: number;
    stressNpc: Phaser.GameObjects.Sprite;
    stressNpcMarks: Phaser.GameObjects.Arc[];
    stressNpcTweens: Phaser.Tweens.Tween[];
    stressClutter: Phaser.GameObjects.Image[];
    stressZoneShade: Phaser.GameObjects.Ellipse;
    stressZoneGlow: Phaser.GameObjects.Ellipse;
    stressNpcResolved: boolean;
    stressNpcInteractionStarted: boolean;
    stressNpcTriggerDistance: number;
    duckMom: Phaser.GameObjects.Sprite;
    ducklings: Phaser.GameObjects.Sprite[];
    duckPlank: Phaser.GameObjects.Image;
    duckZoneShade: Phaser.GameObjects.Ellipse;
    duckZoneGlow: Phaser.GameObjects.Ellipse;
    duckWaterHighlights: Phaser.GameObjects.Ellipse[];
    duckFamilyReunited: boolean;
    duckInteractionStarted: boolean;
    duckPlankTriggerDistance: number;
    completedInteractions: Set<string>;
    worldRestoreLevel: number;
    worldDarkOverlay: Phaser.GameObjects.Rectangle;
    worldColdOverlay: Phaser.GameObjects.Rectangle;
    worldWarmOverlay: Phaser.GameObjects.Rectangle;
    vignetteTop: Phaser.GameObjects.Rectangle;
    vignetteBottom: Phaser.GameObjects.Rectangle;
    playerHopeGlow: Phaser.GameObjects.Arc;
    ambientFogPatches: Phaser.GameObjects.Ellipse[];
    ambientMotionStarted: boolean;
    grassTiles: Phaser.GameObjects.Image[];
    occupiedGrassTileKeys: Set<string>;
    worldFullyRevived: boolean;
    worldReviveTintOverlay: Phaser.GameObjects.Rectangle;
    playerInputLocked: boolean;
    finalSequenceStarted: boolean;
    finalSequenceCompleted: boolean;
    finalMessageText: Phaser.GameObjects.Text;
    finalMessageFadeOverlay: Phaser.GameObjects.Rectangle;
    finalRedMapBackground: Phaser.GameObjects.Rectangle | null;
    finalRedStateLocked: boolean;
    worldLifeMotes: Phaser.GameObjects.Arc[];
    stressNpcCalmWalkTween: Phaser.Tweens.Tween | null;
    npcComfortShadowZone: Phaser.GameObjects.Ellipse;
    npcComfortShadowRing: Phaser.GameObjects.Ellipse;
    npcComfortShadowCleared: boolean;
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
        this.lampBloomFlowers = [];
        this.lampTriggerDistance = 64;
        this.lampRevealYThreshold = 520;
        this.npcTears = [];
        this.npcSadTweens = [];
        this.npcIsHappy = false;
        this.npcTriggerDistance = 84;
        this.stressNpcMarks = [];
        this.stressNpcTweens = [];
        this.stressClutter = [];
        this.stressNpcResolved = false;
        this.stressNpcInteractionStarted = false;
        this.stressNpcTriggerDistance = 108;
        this.ducklings = [];
        this.duckWaterHighlights = [];
        this.duckFamilyReunited = false;
        this.duckInteractionStarted = false;
        this.duckPlankTriggerDistance = 112;
        this.completedInteractions = new Set<string>();
        this.worldRestoreLevel = 0;
        this.ambientFogPatches = [];
        this.ambientMotionStarted = false;
        this.grassTiles = [];
        this.occupiedGrassTileKeys = new Set<string>();
        this.worldFullyRevived = false;
        this.playerInputLocked = false;
        this.finalSequenceStarted = false;
        this.finalSequenceCompleted = false;
        this.finalRedMapBackground = null;
        this.finalRedStateLocked = false;
        this.worldLifeMotes = [];
        this.stressNpcCalmWalkTween = null;
        this.npcComfortShadowCleared = false;
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
        this.createDuckFamilyZone();

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
        this.createStressNpcZone(1980, 1180);

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

        if (!this.textures.exists('water-tile'))
        {
            const water = this.add.graphics();
            water.fillStyle(0x4b5f70, 1);
            water.fillRect(0, 0, 64, 64);
            water.fillStyle(0x607989, 1);
            water.fillRect(0, 8, 64, 10);
            water.fillRect(0, 28, 64, 8);
            water.fillRect(0, 46, 64, 10);
            water.fillStyle(0x364958, 0.65);
            water.fillRect(12, 0, 6, 64);
            water.fillRect(40, 0, 5, 64);
            water.generateTexture('water-tile', 64, 64);
            water.destroy();
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

            player.fillStyle(0x3a2b1f, 1);
            player.fillRect(16, 5, 16, 4);

            player.fillStyle(0xf4c9a2, 1);
            player.fillCircle(24, 12, 9);

            player.fillStyle(0x1f1f1f, 1);
            player.fillCircle(20, 11, 1.5);
            player.fillCircle(28, 11, 1.5);

            // Smile: a small crescent made from two ellipses.
            player.fillStyle(0xa43a4f, 1);
            player.fillEllipse(24, 16, 9, 5);
            player.fillStyle(0xf4c9a2, 1);
            player.fillEllipse(24, 14.5, 9, 4.2);

            player.fillStyle(0xf4c9a2, 1);
            player.fillRect(9, 24, 4, 13);
            player.fillRect(35, 24, 4, 13);
            player.fillCircle(11, 38, 2.2);
            player.fillCircle(37, 38, 2.2);

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

        if (!this.textures.exists('flower-yellow'))
        {
            const flower = this.add.graphics();
            flower.fillStyle(0x4f6a45, 1);
            flower.fillRect(15, 18, 2, 10);
            flower.fillStyle(0xf4d96b, 1);
            flower.fillCircle(16, 14, 4);
            flower.fillStyle(0xffefb2, 1);
            flower.fillCircle(16, 14, 1.5);
            flower.generateTexture('flower-yellow', 32, 32);
            flower.destroy();
        }

        if (!this.textures.exists('flower-pink'))
        {
            const flower = this.add.graphics();
            flower.fillStyle(0x4f6a45, 1);
            flower.fillRect(15, 18, 2, 10);
            flower.fillStyle(0xe8a3c5, 1);
            flower.fillCircle(16, 14, 4);
            flower.fillStyle(0xffd9e9, 1);
            flower.fillCircle(16, 14, 1.5);
            flower.generateTexture('flower-pink', 32, 32);
            flower.destroy();
        }

        if (!this.textures.exists('flower-blue'))
        {
            const flower = this.add.graphics();
            flower.fillStyle(0x4f6a45, 1);
            flower.fillRect(15, 18, 2, 10);
            flower.fillStyle(0x9bc5f6, 1);
            flower.fillCircle(16, 14, 4);
            flower.fillStyle(0xe6f3ff, 1);
            flower.fillCircle(16, 14, 1.5);
            flower.generateTexture('flower-blue', 32, 32);
            flower.destroy();
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

        if (!this.textures.exists('npc-stress'))
        {
            const npcStress = this.add.graphics();
            npcStress.fillStyle(0x2b2b2b, 0.18);
            npcStress.fillEllipse(26, 54, 30, 8);

            npcStress.fillStyle(0xf2c7a2, 1);
            npcStress.fillCircle(24, 20, 9);

            npcStress.fillStyle(0x746a5f, 1);
            npcStress.fillEllipse(24, 34, 28, 16);
            npcStress.fillRect(9, 34, 30, 8);
            npcStress.fillStyle(0x60584f, 1);
            npcStress.fillRect(12, 42, 9, 8);
            npcStress.fillRect(27, 42, 9, 8);

            npcStress.fillStyle(0x1f1f1f, 1);
            npcStress.fillRect(18, 18, 2, 2);
            npcStress.fillRect(28, 18, 2, 2);
            npcStress.fillRect(18, 24, 12, 2);

            npcStress.generateTexture('npc-stress', 56, 60);
            npcStress.destroy();
        }

        if (!this.textures.exists('npc-calm'))
        {
            const npcCalm = this.add.graphics();
            npcCalm.fillStyle(0x2b2b2b, 0.2);
            npcCalm.fillEllipse(24, 52, 24, 8);

            npcCalm.fillStyle(0xf2c7a2, 1);
            npcCalm.fillCircle(24, 14, 10);

            npcCalm.fillStyle(0xa98b55, 1);
            npcCalm.fillRect(13, 24, 22, 16);
            npcCalm.fillStyle(0x7f6b40, 1);
            npcCalm.fillRect(14, 40, 9, 9);
            npcCalm.fillRect(25, 40, 9, 9);

            npcCalm.fillStyle(0x1e1e1e, 1);
            npcCalm.fillRect(19, 14, 2, 2);
            npcCalm.fillRect(27, 14, 2, 2);
            npcCalm.fillRect(20, 21, 8, 2);
            npcCalm.fillRect(18, 20, 2, 2);
            npcCalm.fillRect(28, 20, 2, 2);

            npcCalm.generateTexture('npc-calm', 48, 56);
            npcCalm.destroy();
        }

        if (!this.textures.exists('duck-mom'))
        {
            const duckMom = this.add.graphics();
            duckMom.fillStyle(0x2f2f2f, 0.2);
            duckMom.fillEllipse(22, 30, 30, 8);
            duckMom.fillStyle(0xe4d08a, 1);
            duckMom.fillEllipse(18, 20, 24, 16);
            duckMom.fillCircle(31, 15, 8);
            duckMom.fillStyle(0xd09f53, 1);
            duckMom.fillTriangle(37, 14, 47, 17, 37, 20);
            duckMom.fillStyle(0x232323, 1);
            duckMom.fillCircle(33, 14, 1.6);
            duckMom.generateTexture('duck-mom', 56, 40);
            duckMom.destroy();
        }

        if (!this.textures.exists('duckling'))
        {
            const duckling = this.add.graphics();
            duckling.fillStyle(0x2f2f2f, 0.2);
            duckling.fillEllipse(14, 20, 18, 6);
            duckling.fillStyle(0xe7d689, 1);
            duckling.fillEllipse(12, 13, 14, 10);
            duckling.fillCircle(20, 10, 5);
            duckling.fillStyle(0xd09f53, 1);
            duckling.fillTriangle(24, 9, 30, 11, 24, 13);
            duckling.fillStyle(0x232323, 1);
            duckling.fillCircle(21, 9, 1.2);
            duckling.generateTexture('duckling', 34, 28);
            duckling.destroy();
        }

        if (!this.textures.exists('wood-plank'))
        {
            const plank = this.add.graphics();
            plank.fillStyle(0x6d5441, 1);
            plank.fillRoundedRect(2, 2, 92, 22, 4);
            plank.lineStyle(2, 0x4f3e31, 1);
            plank.strokeRoundedRect(2, 2, 92, 22, 4);
            plank.lineBetween(20, 2, 20, 24);
            plank.lineBetween(42, 2, 42, 24);
            plank.lineBetween(64, 2, 64, 24);
            plank.generateTexture('wood-plank', 96, 26);
            plank.destroy();
        }

        if (!this.textures.exists('wood-plank-bridge'))
        {
            const bridge = this.add.graphics();
            bridge.fillStyle(0x6d5441, 1);
            bridge.fillRoundedRect(2, 2, 192, 22, 4);
            bridge.lineStyle(2, 0x4f3e31, 1);
            bridge.strokeRoundedRect(2, 2, 192, 22, 4);

            for (let x = 18; x <= 178; x += 20)
            {
                bridge.lineBetween(x, 2, x, 24);
            }

            bridge.generateTexture('wood-plank-bridge', 196, 26);
            bridge.destroy();
        }

        if (!this.textures.exists('clutter-paper'))
        {
            const paper = this.add.graphics();
            paper.fillStyle(0x9a9da0, 1);
            paper.fillRect(4, 4, 18, 14);
            paper.lineStyle(1, 0x72767a, 1);
            paper.strokeRect(4, 4, 18, 14);
            paper.generateTexture('clutter-paper', 28, 24);
            paper.destroy();
        }

        if (!this.textures.exists('clutter-box'))
        {
            const box = this.add.graphics();
            box.fillStyle(0x68584f, 1);
            box.fillRect(4, 6, 20, 14);
            box.lineStyle(2, 0x4e423b, 1);
            box.strokeRect(4, 6, 20, 14);
            box.lineBetween(14, 6, 14, 20);
            box.generateTexture('clutter-box', 28, 28);
            box.destroy();
        }

        if (!this.textures.exists('clutter-bag'))
        {
            const bag = this.add.graphics();
            bag.fillStyle(0x58606b, 1);
            bag.fillRoundedRect(4, 8, 18, 14, 4);
            bag.lineStyle(2, 0x404750, 1);
            bag.strokeRoundedRect(4, 8, 18, 14, 4);
            bag.lineBetween(9, 8, 9, 4);
            bag.lineBetween(19, 8, 19, 4);
            bag.generateTexture('clutter-bag', 28, 28);
            bag.destroy();
        }
    }

    createNpc (x: number, y: number)
    {
        this.npc = this.add.sprite(x, y, 'npc-sad').setDepth(y);
        this.npc.setAngle(12);
        this.npc.setScale(1, 0.96);

        this.createNpcComfortShadow(x, y);

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

        this.clearNpcComfortShadowPermanent();

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

        this.onWorldInteractionCompleted('sad-npc');
    }

    createStressNpcZone (x: number, y: number)
    {
        this.stressZoneShade = this.add.ellipse(x, y + 8, 340, 230, 0x50575f, 0.2)
            .setDepth(y - 40);
        this.stressZoneGlow = this.add.ellipse(x, y + 4, 320, 210, 0xf4ecb2, 0)
            .setBlendMode(BlendModes.ADD)
            .setDepth(y - 39);

        this.stressNpc = this.add.sprite(x, y, 'npc-stress').setDepth(y + 4);
        this.stressNpc.setAngle(-18);
        this.stressNpc.setScale(1, 0.92);

        const markA = this.add.circle(x - 18, y - 34, 3, 0xaeb9c4, 0.8).setDepth(y + 8);
        const markB = this.add.circle(x + 2, y - 44, 3, 0xaeb9c4, 0.74).setDepth(y + 8);
        const markC = this.add.circle(x + 20, y - 36, 3, 0xaeb9c4, 0.8).setDepth(y + 8);
        this.stressNpcMarks = [markA, markB, markC];

        this.stressClutter = [
            this.addStressClutter(x - 54, y + 30, 'clutter-paper', -32, x - 86, y - 30, 1),
            this.addStressClutter(x - 20, y + 46, 'clutter-box', 24, x - 42, y - 30, 0.95),
            this.addStressClutter(x + 30, y + 34, 'clutter-bag', -20, x + 6, y - 30, 1),
            this.addStressClutter(x + 62, y + 10, 'clutter-paper', 18, x + 54, y - 30, 1),
            this.addStressClutter(x - 66, y - 4, 'clutter-box', -14, x + 90, y - 30, 0.92),
            this.addStressClutter(x + 70, y + 46, 'clutter-bag', 30, x + 126, y - 30, 0.95)
        ];

        this.stressNpcTweens.push(this.tweens.add({
            targets: this.stressNpc,
            angle: { from: -22, to: -11 },
            x: { from: x - 4, to: x + 4 },
            duration: 160,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        }));

        this.stressNpcTweens.push(this.tweens.add({
            targets: this.stressNpc,
            y: { from: y - 2, to: y + 2 },
            duration: 110,
            yoyo: true,
            repeat: -1,
            ease: 'Linear'
        }));

        this.stressNpcMarks.forEach((mark, index) =>
        {
            const baseY = mark.y;
            const baseX = mark.x;

            this.stressNpcTweens.push(this.tweens.add({
                targets: mark,
                y: baseY - 10,
                x: baseX + (index - 1) * 5,
                alpha: { from: 0.82, to: 0.18 },
                duration: 260 + (index * 40),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeOut'
            }));
        });
    }

    addStressClutter (x: number, y: number, texture: string, angle: number, tidyX: number, tidyY: number, scale = 1)
    {
        const clutter = this.add.image(x, y, texture).setDepth(y + 2);
        clutter.setAngle(angle);
        clutter.setScale(scale);
        clutter.setAlpha(0.88);
        clutter.setData('tidyX', tidyX);
        clutter.setData('tidyY', tidyY);
        clutter.setData('tidyAngle', 0);
        clutter.setData('tidyScale', scale);
        return clutter;
    }

    createDuckFamilyZone ()
    {
        const zoneY = 930;

        this.duckZoneShade = this.add.ellipse(235, zoneY, 430, 280, 0x5a6169, 0.2)
            .setDepth(860);
        this.duckZoneGlow = this.add.ellipse(236, zoneY, 420, 270, 0xf9ec9a, 0)
            .setBlendMode(BlendModes.ADD)
            .setDepth(861);

        this.duckMom = this.add.sprite(372, zoneY - 12, 'duck-mom')
            .setDepth(zoneY + 10)
            .setFlipX(true);

        this.duckPlank = this.add.image(414, zoneY + 22, 'wood-plank-bridge')
            .setDepth(zoneY + 12)
            .setAngle(-8)
            .setAlpha(0.92);

        const ducklingPositions = [
            { x: 88, y: zoneY - 24 },
            { x: 118, y: zoneY - 6 },
            { x: 104, y: zoneY + 18 },
            { x: 136, y: zoneY + 34 }
        ];

        this.ducklings = ducklingPositions.map((pos) =>
        {
            return this.add.sprite(pos.x, pos.y, 'duckling')
                .setDepth(pos.y + 10)
                .setFlipX(false);
        });

        this.tweens.add({
            targets: this.duckMom,
            y: this.duckMom.y - 3,
            duration: 1100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.ducklings.forEach((duckling, index) =>
        {
            this.tweens.add({
                targets: duckling,
                y: duckling.y - 2,
                duration: 960 + (index * 120),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    checkDuckPlankProximity ()
    {
        if (this.duckFamilyReunited || this.duckInteractionStarted || !this.duckPlank)
        {
            return;
        }

        const distance = PhaserMath.Distance.Between(this.player.x, this.player.y, this.duckPlank.x, this.duckPlank.y);

        if (distance <= this.duckPlankTriggerDistance)
        {
            this.startDuckFamilySequence();
        }
    }

    startDuckFamilySequence ()
    {
        if (this.duckInteractionStarted)
        {
            return;
        }

        this.duckInteractionStarted = true;

        this.tweens.add({
            targets: this.duckPlank,
            x: 224,
            y: 952,
            angle: 0,
            duration: 900,
            ease: 'Sine.easeInOut',
            onComplete: () =>
            {
                // As soon as the bridge is in place, the area starts recovering.
                this.tweens.add({
                    targets: this.duckZoneShade,
                    alpha: 0.06,
                    duration: 520,
                    ease: 'Sine.easeOut'
                });

                this.tweens.add({
                    targets: this.duckZoneGlow,
                    alpha: 0.2,
                    scaleX: 1.08,
                    scaleY: 1.08,
                    duration: 520,
                    ease: 'Sine.easeOut'
                });
            }
        });

        this.time.delayedCall(980, () =>
        {
            this.ducklings.forEach((duckling, index) =>
            {
                this.tweens.add({
                    targets: duckling,
                    x: duckling.x + 4,
                    y: duckling.y - 4,
                    duration: 120,
                    yoyo: true,
                    repeat: 1,
                    delay: index * 70,
                    ease: 'Sine.easeInOut'
                });
            });
        });

        const targetSpots = [
            { x: 322, y: 906 },
            { x: 344, y: 932 },
            { x: 302, y: 944 },
            { x: 334, y: 966 }
        ];

        this.time.delayedCall(1350, () =>
        {
            this.ducklings.forEach((duckling, index) =>
            {
                this.tweens.add({
                    targets: duckling,
                    x: 224,
                    y: 946,
                    duration: 700,
                    delay: index * 240,
                    ease: 'Sine.easeInOut',
                    onStart: () => duckling.setFlipX(false),
                    onComplete: () =>
                    {
                        this.tweens.add({
                            targets: duckling,
                            x: targetSpots[index].x,
                            y: targetSpots[index].y,
                            duration: 520,
                            ease: 'Sine.easeOut',
                            onStart: () => duckling.setFlipX(false)
                        });
                    }
                });
            });
        });

        this.time.delayedCall(3150, () =>
        {
            this.duckFamilyReunited = true;
            this.duckMom.setFlipX(true);

            this.tweens.add({
                targets: [this.duckMom, ...this.ducklings],
                y: '-=4',
                duration: 180,
                yoyo: true,
                repeat: 2,
                ease: 'Sine.easeOut'
            });

            this.tweens.add({
                targets: this.duckZoneShade,
                alpha: 0.04,
                duration: 900,
                ease: 'Sine.easeOut'
            });

            this.tweens.add({
                targets: this.duckZoneGlow,
                alpha: 0.24,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 900,
                ease: 'Sine.easeOut'
            });

            this.spawnDuckWaterLife();
            this.startDuckFamilyIdleGroup();
            this.onWorldInteractionCompleted('duck-family');

            // Force immediate visual refresh right after duck sequence completion.
            this.forceMapVisualRefresh();

            // Immediate global map color change after duck reunion.
            this.activateFullMapRevival();

            this.time.delayedCall(500, () =>
            {
                this.startFinalHarmonySequence();
            });
        });
    }

    spawnDuckWaterLife ()
    {
        const rippleData = [
            { x: 200, y: 900, width: 42, height: 12 },
            { x: 238, y: 1020, width: 36, height: 10 },
            { x: 210, y: 780, width: 30, height: 9 }
        ];

        rippleData.forEach((ripple, index) =>
        {
            const shape = this.add.ellipse(ripple.x, ripple.y, ripple.width, ripple.height, 0xc6e8ff, 0.28)
                .setDepth(875 + index)
                .setBlendMode(BlendModes.SCREEN);

            this.duckWaterHighlights.push(shape);

            this.tweens.add({
                targets: shape,
                alpha: { from: 0.32, to: 0.08 },
                scaleX: { from: 0.8, to: 1.4 },
                scaleY: { from: 0.8, to: 1.35 },
                duration: 920 + (index * 120),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    startDuckFamilyIdleGroup ()
    {
        this.tweens.add({
            targets: [this.duckMom, ...this.ducklings],
            y: '-=2',
            duration: 780,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    startFinalHarmonySequence ()
    {
        if (this.finalSequenceStarted)
        {
            return;
        }

        this.finalSequenceStarted = true;

        // Right after duck sequence: trigger the global map transformation.
        this.activateFullMapRevival();

        // 1) Soft activation around ducks.
        this.tweens.add({
            targets: this.duckZoneGlow,
            alpha: 0.32,
            scaleX: 1.16,
            scaleY: 1.16,
            duration: 700,
            ease: 'Sine.easeOut'
        });

        this.tweens.add({
            targets: this.worldDarkOverlay,
            alpha: Math.max(this.worldDarkOverlay.alpha - 0.04, 0.03),
            duration: 700,
            ease: 'Sine.easeOut'
        });

        this.time.delayedCall(700, () =>
        {
            // 2) World trigger: ensure all zones are in positive state.
            if (!this.npcIsHappy)
            {
                this.makeNpcHappy();
            }

            if (!this.stressNpcResolved)
            {
                this.resolveStressNpc();
            }

            if (!this.lampActivated)
            {
                this.lampVisible = true;
                this.lamp.setVisible(true);
                this.activateLamp();
            }

            // Saturation / light increase to full progression.
            if (!this.worldFullyRevived)
            {
                this.worldRestoreLevel = 4;
                this.applyWorldProgressVisuals(true);
            }

            this.time.delayedCall(400, () =>
            {
                this.startStressNpcCalmWalk();
            });
        });

        this.time.delayedCall(1500, () =>
        {
            // 3) Global life propagation.
            this.spawnGlobalLifeMotes();
        });

        this.time.delayedCall(1700, () =>
        {
            // 4) Gentle positive sound bed.
            this.playFinalAmbientHarmony();
        });

        this.time.delayedCall(2100, () =>
        {
            // 6) Brief visual pause for observation.
            this.pausePlayerForMoment(1500);
        });

        this.time.delayedCall(2500, () =>
        {
            // 7) Final center message.
            this.showFinalImpactMessage();
        });

        this.time.delayedCall(4200, () =>
        {
            this.finalSequenceCompleted = true;
        });
    }

    startStressNpcCalmWalk ()
    {
        if (!this.stressNpc || this.stressNpcCalmWalkTween)
        {
            return;
        }

        this.stressNpcCalmWalkTween = this.tweens.add({
            targets: this.stressNpc,
            x: { from: this.stressNpc.x - 22, to: this.stressNpc.x + 22 },
            duration: 2600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: this.stressNpc,
            y: '-=2',
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    spawnGlobalLifeMotes ()
    {
        if (this.worldLifeMotes.length > 0)
        {
            return;
        }

        for (let i = 0; i < 24; i++)
        {
            const x = PhaserMath.Between(120, this.worldWidth - 120);
            const y = PhaserMath.Between(120, this.worldHeight - 120);
            const mote = this.add.circle(x, y, PhaserMath.Between(1, 2), 0xf5f9b8, 0.18)
                .setBlendMode(BlendModes.SCREEN)
                .setDepth(1700);

            this.worldLifeMotes.push(mote);

            this.tweens.add({
                targets: mote,
                y: y - PhaserMath.Between(24, 52),
                x: x + PhaserMath.Between(-16, 16),
                alpha: { from: 0.08, to: 0.34 },
                duration: 3000 + PhaserMath.Between(0, 1800),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    playFinalAmbientHarmony ()
    {
        const anySound = this.sound as unknown as { context?: AudioContext };
        const audioContext = anySound?.context;

        if (!audioContext)
        {
            return;
        }

        const now = audioContext.currentTime;
        const master = audioContext.createGain();
        master.gain.value = 0.0001;
        master.connect(audioContext.destination);

        const freqs = [220, 277.18, 329.63];
        freqs.forEach((freq) =>
        {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.value = 0.0001;
            osc.connect(gain);
            gain.connect(master);

            osc.start(now);
            gain.gain.exponentialRampToValueAtTime(0.012, now + 1.2);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 6.5);
            osc.stop(now + 6.6);
        });

        master.gain.exponentialRampToValueAtTime(0.12, now + 1.4);
        master.gain.exponentialRampToValueAtTime(0.0001, now + 6.8);
    }

    pausePlayerForMoment (duration: number)
    {
        this.playerInputLocked = true;
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0);

        if (this.playerInputLocked)
        {
            this.player.setDepth(this.player.y);
            if (this.playerHopeGlow)
            {
                this.playerHopeGlow.setPosition(this.player.x, this.player.y);
            }
            this.updateNpcComfortShadowProgress();

            if (this.npc)
            {
                this.npc.setDepth(this.npc.y);
            }
            if (this.stressNpc)
            {
                this.stressNpc.setDepth(this.stressNpc.y + 4);
            }
            if (this.duckMom)
            {
                this.duckMom.setDepth(this.duckMom.y + 10);
            }
            this.ducklings.forEach((duckling) => duckling.setDepth(duckling.y + 10));
            return;
        }

        this.time.delayedCall(duration, () =>
        {
            this.playerInputLocked = false;
        });
    }

    showFinalImpactMessage ()
    {
        if (this.finalMessageText)
        {
            return;
        }

        this.applyFinalNatureLook();

        this.finalMessageFadeOverlay = this.add.rectangle(512, 384, 1024, 768, 0xf4f6df, 0)
            .setScrollFactor(0)
            .setDepth(4990);

        this.tweens.add({
            targets: this.finalMessageFadeOverlay,
            alpha: 0.18,
            duration: 640,
            ease: 'Sine.easeInOut',
            onComplete: () =>
            {
                this.tweens.add({
                    targets: this.finalMessageFadeOverlay,
                    alpha: 0.08,
                    duration: 480,
                    ease: 'Sine.easeOut'
                });
            }
        });

        this.finalMessageText = this.add.text(512, 380, 'Small actions. Big impact.', {
            fontFamily: 'Arial Black',
            fontSize: 52,
            color: '#f6ffe5',
            stroke: '#20331b',
            strokeThickness: 7,
            align: 'center'
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(5000)
            .setAlpha(0);

        this.tweens.add({
            targets: this.finalMessageText,
            alpha: 1,
            duration: 900,
            delay: 320,
            ease: 'Sine.easeOut'
        });
    }

    applyFinalNatureLook ()
    {
        this.finalRedStateLocked = true;

        // Stop any in-flight transitions that could bring back previous map colors.
        this.tweens.killTweensOf(this.grassTiles);
        this.tweens.killTweensOf(this.ambientFogPatches);
        this.tweens.killTweensOf([this.worldDarkOverlay, this.worldColdOverlay, this.worldWarmOverlay, this.vignetteTop, this.vignetteBottom]);
        if (this.worldReviveTintOverlay)
        {
            this.tweens.killTweensOf(this.worldReviveTintOverlay);
        }

        // At final message time, remove grass and force a solid vivid-green background.
        this.tweens.add({
            targets: [this.worldDarkOverlay, this.worldColdOverlay, this.worldWarmOverlay],
            alpha: 0,
            duration: 500,
            ease: 'Sine.easeOut'
        });

        this.tweens.add({
            targets: [this.vignetteTop, this.vignetteBottom],
            alpha: 0,
            duration: 500,
            ease: 'Sine.easeOut'
        });

        this.ambientFogPatches.forEach((fog) =>
        {
            fog.setAlpha(0);
            fog.setVisible(false);
        });

        this.grassTiles.forEach((tile) =>
        {
            tile.clearTint();
            tile.setAlpha(0);
            tile.setVisible(false);
        });

        if (!this.finalRedMapBackground)
        {
            this.finalRedMapBackground = this.add.rectangle(
                this.worldWidth / 2,
                this.worldHeight / 2,
                this.worldWidth,
                this.worldHeight,
                0x39ff14,
                0
            ).setDepth(-980);
        }
        else
        {
            this.finalRedMapBackground.setFillStyle(0x39ff14, 0);
        }

        this.tweens.add({
            targets: this.finalRedMapBackground,
            alpha: 1,
            duration: 260,
            ease: 'Sine.easeOut'
        });

        if (this.worldReviveTintOverlay)
        {
            this.tweens.add({
                targets: this.worldReviveTintOverlay,
                alpha: 0,
                duration: 500,
                ease: 'Sine.easeOut'
            });
        }

        this.cameras.main.setBackgroundColor(0x2de600);
        this.forceMapVisualRefresh();
    }

    checkStressNpcProximity ()
    {
        if (this.stressNpcResolved || this.stressNpcInteractionStarted || !this.stressNpc)
        {
            return;
        }

        const distance = PhaserMath.Distance.Between(this.player.x, this.player.y, this.stressNpc.x, this.stressNpc.y);

        if (distance <= this.stressNpcTriggerDistance)
        {
            this.resolveStressNpc();
        }
    }

    resolveStressNpc ()
    {
        if (this.stressNpcInteractionStarted)
        {
            return;
        }

        this.stressNpcInteractionStarted = true;

        this.stressNpcTweens.forEach((tween) => tween.timeScale = 0.25);

        this.tweens.add({
            targets: this.stressNpc,
            angle: -8,
            scaleY: 0.95,
            duration: 450,
            ease: 'Sine.easeOut'
        });

        this.time.delayedCall(260, () =>
        {
            this.stressNpcMarks.forEach((mark) =>
            {
                this.tweens.add({
                    targets: mark,
                    alpha: 0,
                    scale: 0.6,
                    duration: 280,
                    ease: 'Sine.easeInOut',
                    onComplete: () => mark.setVisible(false)
                });
            });

            this.organizeStressClutter();
        });

        this.time.delayedCall(950, () =>
        {
            this.stressNpcTweens.forEach((tween) => tween.stop());
            this.stressNpcTweens = [];

            this.stressNpc.setTexture('npc-calm');

            this.tweens.add({
                targets: this.stressNpc,
                angle: 0,
                x: this.stressNpc.x,
                y: this.stressNpc.y - 28,
                scaleX: 1,
                scaleY: 1,
                duration: 520,
                ease: 'Back.easeOut'
            });

            this.tweens.add({
                targets: this.stressZoneShade,
                alpha: 0.03,
                duration: 900,
                ease: 'Sine.easeOut'
            });

            this.tweens.add({
                targets: this.stressZoneGlow,
                alpha: 0.22,
                scaleX: 1.08,
                scaleY: 1.06,
                duration: 900,
                ease: 'Sine.easeOut'
            });
        });

        this.time.delayedCall(1480, () =>
        {
            this.stressNpcResolved = true;

            this.tweens.add({
                targets: this.stressNpc,
                y: { from: this.stressNpc.y, to: this.stressNpc.y - 3 },
                duration: 850,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.onWorldInteractionCompleted('stress-npc');
        });
    }

    organizeStressClutter ()
    {
        this.stressClutter.forEach((item, index) =>
        {
            this.tweens.add({
                targets: item,
                x: item.getData('tidyX') as number,
                y: item.getData('tidyY') as number,
                angle: item.getData('tidyAngle') as number,
                alpha: 0.98,
                duration: 650 + (index * 60),
                ease: 'Sine.easeInOut'
            });
        });
    }

    createLamp (x: number, y: number)
    {
        this.lamp = this.add.sprite(x, y, 'lamp-off').setDepth(y + 1).setVisible(false);
        this.lampGlow = this.add.circle(x, y - 8, 88, 0xffde8a, 0.34)
            .setBlendMode(BlendModes.ADD)
            .setVisible(false)
            .setDepth(y - 1);

        this.lampGlowOuter = this.add.circle(x, y - 8, 190, 0xfff0bf, 0.2)
            .setBlendMode(BlendModes.SCREEN)
            .setVisible(false)
            .setDepth(y - 2);
    }

    bloomLampFlowers ()
    {
        const flowerLayout = [
            { x: -92, y: 28, texture: 'flower-yellow' },
            { x: -64, y: 44, texture: 'flower-pink' },
            { x: -32, y: 30, texture: 'flower-blue' },
            { x: 22, y: 34, texture: 'flower-yellow' },
            { x: 56, y: 48, texture: 'flower-pink' },
            { x: 88, y: 30, texture: 'flower-blue' },
            { x: -16, y: 56, texture: 'flower-yellow' },
            { x: 38, y: 62, texture: 'flower-pink' },
            { x: -58, y: 66, texture: 'flower-blue' }
        ];

        flowerLayout.forEach((flowerData, index) =>
        {
            const flower = this.add.image(
                this.lamp.x + flowerData.x,
                this.lamp.y + flowerData.y,
                flowerData.texture
            )
                .setAlpha(0)
                .setScale(0.2)
                .setDepth(this.lamp.y + flowerData.y + 4);

            this.lampBloomFlowers.push(flower);

            this.tweens.add({
                targets: flower,
                alpha: 1,
                scale: 1,
                duration: 360,
                delay: index * 70,
                ease: 'Back.easeOut'
            });
        });
    }

    onWorldInteractionCompleted (interactionId: string)
    {
        if (this.completedInteractions.has(interactionId))
        {
            return;
        }

        this.completedInteractions.add(interactionId);
        this.worldRestoreLevel = Math.min(this.completedInteractions.size, 4);
        this.applyWorldProgressVisuals(true);
    }

    applyWorldProgressVisuals (animated: boolean)
    {
        if (this.worldFullyRevived || this.finalRedStateLocked)
        {
            return;
        }

        const progress = this.worldRestoreLevel / 4;
        const duration = animated ? 900 : 0;

        this.tweens.add({
            targets: this.worldDarkOverlay,
            alpha: 0.2 - (progress * 0.14),
            duration,
            ease: 'Sine.easeOut'
        });

        this.tweens.add({
            targets: this.worldColdOverlay,
            alpha: 0.12 - (progress * 0.08),
            duration,
            ease: 'Sine.easeOut'
        });

        this.tweens.add({
            targets: this.worldWarmOverlay,
            alpha: 0.02 + (progress * 0.16),
            duration,
            ease: 'Sine.easeOut'
        });

        this.tweens.add({
            targets: [this.vignetteTop, this.vignetteBottom],
            alpha: 0.18 - (progress * 0.11),
            duration,
            ease: 'Sine.easeOut'
        });

        if (this.worldRestoreLevel >= 1)
        {
            this.tweens.add({
                targets: this.playerHopeGlow,
                alpha: 0.11 + (progress * 0.08),
                duration,
                ease: 'Sine.easeOut'
            });

            this.startAmbientDecorMotion();
        }

        if (this.worldRestoreLevel >= 4)
        {
            // Final full-map revival is triggered in the final message sequence.
        }
    }

    activateFullMapRevival ()
    {
        if (this.worldFullyRevived || this.finalRedStateLocked)
        {
            return;
        }

        this.worldFullyRevived = true;

        // Final state: joyful, bright light-green world.
        this.grassTiles.forEach((tile) =>
        {
            this.tweens.add({
                targets: tile,
                alpha: 1,
                duration: 1400,
                ease: 'Sine.easeOut'
            });
            tile.setTint(0x84c86a);
        });

        this.obstacles.getChildren().forEach((obj) =>
        {
            this.tweens.add({
                targets: obj,
                alpha: 1,
                duration: 1400,
                ease: 'Sine.easeOut'
            });
        });

        this.tweens.add({
            targets: [this.worldDarkOverlay, this.worldColdOverlay],
            alpha: 0,
            duration: 1400,
            ease: 'Sine.easeOut'
        });

        // Remove any remaining gray veil at the end.
        this.tweens.add({
            targets: [this.vignetteTop, this.vignetteBottom],
            alpha: 0,
            duration: 1400,
            ease: 'Sine.easeOut'
        });

        this.ambientFogPatches.forEach((fog) =>
        {
            this.tweens.add({
                targets: fog,
                alpha: 0,
                duration: 1400,
                ease: 'Sine.easeOut'
            });
        });

        this.tweens.add({
            targets: this.worldWarmOverlay,
            alpha: 0.12,
            duration: 1400,
            ease: 'Sine.easeOut'
        });

        this.worldReviveTintOverlay = this.add.rectangle(this.worldWidth / 2, this.worldHeight / 2, this.worldWidth, this.worldHeight, 0xa7ff70, 0)
            .setBlendMode(BlendModes.SCREEN)
            .setDepth(1492);

        this.tweens.add({
            targets: this.worldReviveTintOverlay,
            alpha: 0.46,
            duration: 1400,
            ease: 'Sine.easeOut'
        });

        this.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 1400,
            ease: 'Sine.easeOut',
            onUpdate: (tween) =>
            {
                const t = tween.getValue() / 100;
                const r = Math.round(PhaserMath.Linear(0x1c, 0x79, t));
                const g = Math.round(PhaserMath.Linear(0x26, 0xb9, t));
                const b = Math.round(PhaserMath.Linear(0x2e, 0x6a, t));
                const color = (r << 16) | (g << 8) | b;
                this.cameras.main.setBackgroundColor(color);
            }
        });

        this.forceMapVisualRefresh();

    }

    forceMapVisualRefresh ()
    {
        // Explicitly force a render refresh for map layers and camera after visual state changes.
        this.children.depthSort();

        const cam = this.cameras.main as Phaser.Cameras.Scene2D.Camera & { dirty?: boolean };
        cam.setScroll(cam.scrollX, cam.scrollY);
        cam.dirty = true;

        // Apply a second immediate pass on next tick to avoid relying on implicit player updates.
        this.time.delayedCall(0, () =>
        {
            this.children.depthSort();
            cam.setScroll(cam.scrollX, cam.scrollY);
            cam.dirty = true;
        });
    }

    startAmbientDecorMotion ()
    {
        if (this.ambientMotionStarted)
        {
            return;
        }

        this.ambientMotionStarted = true;

        this.ambientFogPatches.forEach((fog, index) =>
        {
            this.tweens.add({
                targets: fog,
                y: fog.y + (index % 2 === 0 ? 6 : -5),
                duration: 6200 + (index * 700),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        const trees = this.obstacles.getChildren()
            .filter((obj) => (obj as Phaser.Physics.Arcade.Image).texture.key === 'tree-oak') as Phaser.Physics.Arcade.Image[];

        trees.forEach((tree, index) =>
        {
            this.tweens.add({
                targets: tree,
                angle: index % 2 === 0 ? 1.2 : -1.2,
                duration: 2100 + (index * 40),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
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
            const fog = this.add.ellipse(patch.x, patch.y, patch.width, patch.height, 0xc8d0d5, patch.alpha)
                .setDepth(1400);
            this.ambientFogPatches.push(fog);
        });

        const topCloudA = this.add.ellipse(1380, 180, 620, 160, 0x8f969d, 0.18)
            .setDepth(1450);
        const topCloudB = this.add.ellipse(1710, 220, 300, 90, 0x959ba1, 0.12)
            .setDepth(1451);
        this.ambientFogPatches.push(topCloudA, topCloudB);

        this.worldColdOverlay = this.add.rectangle(this.worldWidth / 2, this.worldHeight / 2, this.worldWidth, this.worldHeight, 0x5d6772, 0.12)
            .setDepth(1490);

        this.worldWarmOverlay = this.add.rectangle(this.worldWidth / 2, this.worldHeight / 2, this.worldWidth, this.worldHeight, 0xf2c874, 0.02)
            .setBlendMode(BlendModes.SCREEN)
            .setDepth(1491);

        this.worldDarkOverlay = this.add.rectangle(512, 384, 1024, 768, 0x3f4952, 0.2)
            .setScrollFactor(0)
            .setDepth(3000);

        this.playerHopeGlow = this.add.circle(this.player.x, this.player.y, 140, 0xffe5a2, 0)
            .setBlendMode(BlendModes.ADD)
            .setDepth(3002);

        this.vignetteTop = this.add.rectangle(512, 60, 1024, 120, 0x2d3338, 0.18)
            .setScrollFactor(0)
            .setDepth(3001);
        this.vignetteBottom = this.add.rectangle(512, 708, 1024, 120, 0x2d3338, 0.12)
            .setScrollFactor(0)
            .setDepth(3001);

        this.applyWorldProgressVisuals(false);
    }

    createNpcComfortShadow (x: number, y: number)
    {
        // Dark emotional zone around the crying NPC that fades when the player approaches.
        this.npcComfortShadowZone = this.add.ellipse(x, y, 420, 320, 0x12171d, 0.42)
            .setDepth(y - 6);

        this.npcComfortShadowRing = this.add.ellipse(x, y, 530, 410, 0x0d1117, 0.2)
            .setDepth(y - 5);
    }

    updateNpcComfortShadowProgress ()
    {
        if (this.npcComfortShadowCleared || !this.npcComfortShadowZone || !this.npcComfortShadowRing || !this.npc)
        {
            return;
        }

        const distanceFromNpc = PhaserMath.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y);
        const approachRadius = 180;

        // As the player approaches the crying NPC, the shadow fades and then disappears.
        const progress = PhaserMath.Clamp((approachRadius - distanceFromNpc) / approachRadius, 0, 1);
        this.npcComfortShadowZone.setAlpha(0.42 * (1 - progress));
        this.npcComfortShadowRing.setAlpha(0.2 * (1 - progress));

        // Permanently clear shadow once the player is close enough to comfort the NPC.
        if (distanceFromNpc <= this.npcTriggerDistance)
        {
            this.clearNpcComfortShadowPermanent();
        }
    }

    clearNpcComfortShadowPermanent ()
    {
        if (this.npcComfortShadowCleared || !this.npcComfortShadowZone || !this.npcComfortShadowRing)
        {
            return;
        }

        this.npcComfortShadowCleared = true;

        this.tweens.add({
            targets: [this.npcComfortShadowZone, this.npcComfortShadowRing],
            alpha: 0,
            duration: 260,
            ease: 'Sine.easeOut',
            onComplete: () =>
            {
                this.npcComfortShadowZone.destroy();
                this.npcComfortShadowRing.destroy();
            }
        });
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
        this.lampGlowOuter.setVisible(true);
        this.lampGlow.setScale(0.5);
        this.lampGlowOuter.setScale(0.4);

        this.tweens.add({
            targets: this.lampGlow,
            alpha: { from: 0.2, to: 0.58 },
            scale: { from: 0.5, to: 1.25 },
            duration: 620,
            ease: 'Sine.easeOut'
        });

        this.tweens.add({
            targets: this.lampGlow,
            alpha: { from: 0.58, to: 0.35 },
            duration: 960,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: this.lampGlowOuter,
            alpha: { from: 0.08, to: 0.34 },
            scale: { from: 0.4, to: 1.12 },
            duration: 700,
            ease: 'Sine.easeOut'
        });

        this.tweens.add({
            targets: this.lampGlowOuter,
            alpha: { from: 0.34, to: 0.18 },
            duration: 1250,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.bloomLampFlowers();

        this.onWorldInteractionCompleted('lamp');
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
                const grass = this.add.image(x, y, 'grass-tile').setDepth(-1000);
                this.grassTiles.push(grass);
            }
        }

        // River strip on the left side from top to bottom.
        for (let y = 32; y < this.worldHeight; y += 64)
        {
            this.add.image(160, y, 'water-tile').setDepth(-996);
            this.add.image(224, y, 'water-tile').setDepth(-996);
            this.add.image(288, y, 'water-tile').setDepth(-996);
        }

        this.add.rectangle(224, this.worldHeight / 2, 214, this.worldHeight, 0x56697a, 0.12)
            .setDepth(-995);

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
        this.markGrassTilesOccupiedByObstacle(obstacle);
        return obstacle;
    }

    markGrassTilesOccupiedByObstacle (obstacle: Phaser.Physics.Arcade.Image)
    {
        const bounds = obstacle.getBounds();
        const startCol = Math.floor((bounds.left - 32) / 64);
        const endCol = Math.ceil((bounds.right - 32) / 64);
        const startRow = Math.floor((bounds.top - 32) / 64);
        const endRow = Math.ceil((bounds.bottom - 32) / 64);

        for (let col = startCol; col <= endCol; col++)
        {
            for (let row = startRow; row <= endRow; row++)
            {
                const tileX = 32 + (col * 64);
                const tileY = 32 + (row * 64);

                if (tileX < 32 || tileX > this.worldWidth || tileY < 32 || tileY > this.worldHeight)
                {
                    continue;
                }

                this.occupiedGrassTileKeys.add(`${tileX}:${tileY}`);
            }
        }
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
        if (this.playerHopeGlow)
        {
            this.playerHopeGlow.setPosition(this.player.x, this.player.y);
        }
        this.updateNpcComfortShadowProgress();
        if (this.npc)
        {
            this.npc.setDepth(this.npc.y);
        }
        if (this.stressNpc)
        {
            this.stressNpc.setDepth(this.stressNpc.y + 4);
        }
        if (this.duckMom)
        {
            this.duckMom.setDepth(this.duckMom.y + 10);
        }
        this.ducklings.forEach((duckling) => duckling.setDepth(duckling.y + 10));
        this.checkDuckPlankProximity();
        this.checkStressNpcProximity();
        this.checkNpcProximity();
        this.revealLampIfDiscovered();
        this.checkLampProximity();
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
