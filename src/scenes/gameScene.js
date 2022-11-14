import Mob from '../objects/mobs/Mob.js';
import Unit from '../objects/units/playerUnit.js';
const Phaser = require('phaser');
const Config = require("../Config");

class AnimatedTile {
    tile;
    tileAnimationData;
    firstgid;
    elapsedTime;
    animationDuration

    constructor(tile, tileAnimationData, firstgid) {
        this.tile = tile;
        this.tileAnimationData = tileAnimationData;
        this.firstgid = firstgid;
        this.elapsedTime = 0;
        this.animationDuration = tileAnimationData[0].duration * tileAnimationData.length;
    }

    update(delta) {
        this.elapsedTime += delta;
        this.elapsedTime %= this.animationDuration;

        const animationFrameIndex = Math.floor(this.elapsedTime / this.tileAnimationData[0].duration);

        this.tile.index = this.tileAnimationData[animationFrameIndex].tileid + this.firstgid
    }
}
/*
무작위 구현
(mob)
1.dictionary형이므로 key만 뽑아 배열로 만듬
2.key배열의 length 미만에서 무작위 값을 뽑음
3.key 배열의 무작위 값을 조회해 dictionary에서 조회!!

(unit)
1.티어별로 번호를 저장한 배열 생성
2.배열 내에서 무작위 번호 선택
3.dictionary에서 조회

(item)
1.WIP.
*/



export default class gameScene extends Phaser.Scene{
    constructor() {
        super("gameScene");
    }
    controls;
    debugGraphics;
    animatedTiles = [];

    /*
        타이머관련 변수 선언
            phaseTimer: 현재 동작중인 타이머 저장
            timerText: 타이머 표기용 변수
    */
    phaseTimer;
    timerText;
    pointerText;
    PhaseText = "";

    create() {
// 맵
        const map = this.make.tilemap({key: "map_forest"});

        const outside_ground = map.addTilesetImage("outside_ground", "outside_ground");
        const outside_roof = map.addTilesetImage("outside_roof", "outside_roof");
        const outside_wall = map.addTilesetImage("outside_wall", "outside_wall");
        const outside_stair = map.addTilesetImage("outside_stair", "outside_stair");
        const outside_B = map.addTilesetImage("Outside_B", "outside_B");
        const possible = map.addTilesetImage("possible", "possible");

        const tile = map.createLayer("tile", outside_ground, 0, 0);
        const wall = map.createLayer("wall", outside_wall, 0, 0);
        const bridge = map.createLayer("bridge", outside_B, 0, 0);
        const grass = map.createLayer("grass", outside_B, 0, 0);
        const tree1_back = map.createLayer("Tree1_B", outside_B, 0, 0);
        const tree2_back = map.createLayer("Tree2_B", outside_B, 0, 0);
        const tree1_front = map.createLayer("Tree1_F", outside_B, 0, 0);
        const tree2_front = map.createLayer("Tree2_F", outside_B, 0, 0);
        const info = map.createLayer("info", possible, 0, 0); 
        info.alpha = 0;
        // info layer 기준 tileset index가
        // 배치 가능 2897
        // 배치 불가능 2898

        const tileData = outside_ground.tileData;

        for (let tileid in tileData) {
            let layer = map.layers[0];
            layer.data.forEach(tileRow => {
                tileRow.forEach(tile => {
                    if (tile.index - outside_ground.firstgid === parseInt(tileid, 10)) {
                        this.animatedTiles.push(
                            new AnimatedTile(
                                tile,
                                tileData[tileid].animation,
                                outside_ground.firstgid
                            )
                        )
                    }
                });
            });
        }
        
        let help = this.add.text(0, 0, '', { font: '48px monospace' }); 
        let cursors = this.input.keyboard.createCursorKeys();



//카메라
        this.controls = new Phaser.Cameras.Controls.FixedKeyControl({
            camera: this.cameras.main,
            left: cursors.left,
            right: cursors.right,
            up: cursors.up,
            down: cursors.down,
            speed: 0.75
        });
        this.debugGraphics = this.add.graphics();

        // this.input.on('pointerdown', (pointer) => {
        //     let t = this.getTileAtPointer(pointer, info);
        //     if (!t) return;
        //     console.log(`(${t.x}, ${t.y}) on ${t.layer.name}`, t);
        // });
        
        // this.input.on('pointermove', (pointer) => {
        //     let t = this.getTileAtPointer(pointer, info);
        //     if (!t) return;
        //     help.setText(t.index).setPosition(t.pixelX, t.pixelY);
        //     this.pointerText.setText("x: " + t.x+ " y: " + t.y);
        //     this.drawDebug(t);
        // });
        // => 마우스가 위치한 선택된 레이어의 타일의 인덱스가 몇인지를 알림
        // 지금 경우는 배치 가능 / 불가능만 알기 위한 info 레이어를 선택

        this.input.on("wheel",  (pointer, gameObjects, deltaX, deltaY, deltaZ) => {

            if (deltaY > 0) {
                var newZoom = this.cameras.main.zoom -.2;
                if (newZoom > 0.7) {
                    this.cameras.main.zoom = newZoom;     
                }
            }
            if (deltaY < 0) {
                var newZoom = this.cameras.main.zoom +.2;
                if (newZoom < 1.7) {
                    this.cameras.main.zoom = newZoom;     
                }
            }
            // this.camera.centerOn(pointer.worldX, pointer.worldY);
            // this.camera.pan(pointer.worldX, pointer.worldY, 2000, "Power2");
        });



// 타이머
        this.timerText = this.add.text(32, 32, "");
        this.pointerText = this.add.text(32, 64, "");
        this.waitForReady();


//BGM
        this.m_music = this.sound.add("music");
        this.sound.pauseOnBlur = false;
        const musicConfig = {
            mute: false,
            volume: 0.7,
            rate: 1,
            detune: 0,
            seek: 0,
            loop: true,
            delay: 0
        };
        //this.m_music.play(musicConfig);


//몹/유저유닛/투사체 관련
        this.m_mobs = this.physics.add.group();
        this.roundNum = 1;
        this.globalnum = 1;
        this.playerHealth = 100;
        this.placeMode = false;

        this.m_projectiles = this.physics.add.group();
        this.unitDB = this.cache.json.get("unitDB");
        this.mobDB = this.cache.json.get("mobDB");
        this.roundDB = this.cache.json.get("roundDB")["round"];
        this.m_player = [];

        this.m_player.push(new Unit(this, 0, 0, this.unitDB.unit3));

        var prePosX;
        var prePosY;

        this.input.on('dragstart', (pointer,gameObject) => {
            info.alpha = 1;
            var tile = this.getTileAtPointer(pointer, info);
            prePosX = pointer.worldX;
            prePosY = pointer.worldY;
            //gameObject.removeBuff();
            if (tile.index == "2898") tile.index = "2897";
        });

        this.input.on('drag', (pointer,gameObject) => {
            gameObject.x = pointer.worldX;
            gameObject.y = pointer.worldY;
        })

        this.input.on('dragend', (pointer, gameObject) => { 
            info.alpha = 0;
            var tile = this.getTileAtPointer(pointer, info);
            this.placeUnitOnTile(tile, gameObject, prePosX, prePosY);
        })

        this.physics.add.overlap(this.m_projectiles, this.m_mobs, (projectile, mob) => mob.hit(projectile), null, this);
        this.cameras.main.setBounds(0, 0, 2400, 1440);

        this.events.on("tryPlaceUnit", (array) => {
            var pointer = array.at(0);
            var info = array.at(1);
            var unitData = array.at(2);
            let t = this.getTileAtPointer(pointer, info);
            if (!t || t.index == "2898") return;
            this.m_player.push(new Playertest(this, t.pixelX + 24, t.pixelY + 24, unitData));
            //this.m_player[this.m_player.length].giveBuff();
            t.index = "2898";
            //this.placeMode = false;
            this.input.setDraggable(this.m_player,true);
        }, this);
        /**
         * 다시 드래그가 가능하게 바꿔줘야하는데 왜인지 듣질 않는다.
         * 
         */
//임시 선언 부분
        const button = this.add.text(60, 128, "test")
            .setOrigin(0.5)
            .setPadding(10)
            .setStyle({ backgroundColor: '#000' })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => { this.initialPlace(info); this.placeMode = (this.placeMode ? false : true); })
            .on('pointerover', () => button.setStyle({ fill: '#f39c12' }))
            .on('pointerout', () => button.setStyle({ fill: '#FFF' }));
    }

    update(time, delta) {
        this.animatedTiles.forEach(tile => tile.update(delta));
        this.controls.update(delta);
        
        let x = this.input.mousePointer.x;
        let y = this.input.mousePointer.y;

        if (x > this.cameras.main.width - 50 && y > this.cameras.main.height - 50) {
            this.cameras.main.scrollX += 12;
            this.cameras.main.scrollY += 12;
        }
        else if (x < 50 && y < 50) {
            this.cameras.main.scrollX -= 12;
            this.cameras.main.scrollY -= 12;
        }
        else if (x > this.cameras.main.width- 50 && y < 50) {
            this.cameras.main.scrollX += 12;
            this.cameras.main.scrollY -= 12;
        }
        else if (x < 50 && y > this.cameras.main.height - 50) {
            this.cameras.main.scrollX -= 12;
            this.cameras.main.scrollY += 12;
        }
        else if (x > this.cameras.main.width - 50) this.cameras.main.scrollX += 12;
        else if (x < 50) this.cameras.main.scrollX -= 12;
        else if (y > this.cameras.main.height - 50) this.cameras.main.scrollY += 12;
        else if (y < 50) this.cameras.main.scrollY -= 12;

        this.timerText.setText(this.PhaseText + ' : ' + this.phaseTimer.getRemainingSeconds().toString().substr(0, 2));
    }

    initialPlace(info,unitData)
    {
        info.alpha = (info.alpha == 1 ? 0 : 1);
        this.input.on('pointerdown', (pointer) => {
            if (this.placeMode) {
                this.input.setDraggable(this.m_player,false);
                this.events.emit('tryPlaceUnit', [pointer, info, this.unitDB.unit1]);
            }
        }, this);
    }

    startRound() {
        this.time.addEvent({
            delay: 1500,
            callback: () => {
                this.m_mobs.add(new Mob(this, this.mobDB[this.roundDB[this.roundNum]["mobName"]], this.globalnum++,this.roundDB[this.roundNum]["mobRoute"]));
                console.log(this.m_mobs);
            },  
            repeat: this.roundDB[this.roundNum]["mobCount"],
            startAt: 0
        })
    }

    placeUnitOnTile(tile, Unit, prePosX, prePosY) {
        if (tile.index == "2897") {
            tile.index = "2898";
            Unit.x = tile.pixelX + 24;
            Unit.y = tile.pixelY + 24;
            //Unit.giveBuff();
        }
        else if (tile.index == "2898") {
            Unit.x = prePosX;
            Unit.y = prePosY;
        }
    }

    mobPos(id)
    {
        return this.m_mobs.getChildren().find(e => e.mobNum === id);
    }

    getTileAtPointer(pointer, layer) {
        return layer.getTileAtWorldXY(pointer.worldX, pointer.worldY, true);
    }

    drawDebug(tile) {
        const { width, height, pixelX, pixelY } = tile;
        const left = pixelX;
        const top = pixelY;
        const right = pixelX + width;
        const bottom = pixelY + height;
        this.debugGraphics
        .clear()
        .fillStyle(0x666666, 0.6)
        .fillRect(left, top, width, height)
        .lineStyle(8, 0xff0000, 0.8);
        
        // `tile.face*` are the computed faces, from `tile.collide*`
        if (tile.faceLeft) this.debugLine(left, top, 0, height);
        if (tile.faceTop) this.debugLine(left, top, width, 0);
        if (tile.faceRight) this.debugLine(right, top, 0, height);
        if (tile.faceBottom) this.debugLine(left, bottom, width, 0);
    }

    debugLine(x, y, dx, dy) {
        this.debugGraphics.lineBetween(x, y, x + dx, y + dy);
    }

    waitForReady()
    {
        this.PhaseText = "Waiting for all players ready..."
        this.phaseTimer = this.time.delayedCall(10000, this.toDicePhase, [], this);
    }

    toDicePhase() {
        this.PhaseText = "Dice Phase";
        this.input.setDraggable(this.m_player, false);
        this.roundNum++;
        this.globalnum = 1;
        this.phaseTimer = this.time.delayedCall(30000, this.toPlacePhase, [], this);
    }
    toPlacePhase() {
        this.PhaseText = "Place Phase";
        this.input.setDraggable(this.m_player,true);
        this.phaseTimer = this.time.delayedCall(30000, this.toBattlePhase, [], this);
    }
    toBattlePhase() {
        this.PhaseText = "Battle Phase";
        this.input.setDraggable(this.m_player, false);
        this.startRound();
        this.phaseTimer = this.time.delayedCall(60000, this.toDicePhase, [], this);
    }
    // DicePhase -> PlacePhase -> BattlePhase 순서가 반복되는 구조로 호출

}
