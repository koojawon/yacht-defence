const Phaser = require("phaser");
import { pathA, pathB, pathC, pathD, pathBoss } from "../points/mobPath";

export default class Mob extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, mobData,num,mobRoute) {
        super(scene, -5000, -5000, mobData.mobAnim);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.isTarget = true;
        this.Health = mobData.Health;
        this.MaxHealth = mobData.Health;
        this.scale = mobData.scale;
        this.m_speed = mobData.m_speed;
        this.deathAnimName = ""//나중에 DB에서 불러와 주세요
        this.defence = 20; //나중에 DB에서 불러와 주세요
        this.mobNum = num;
        this.moveType = mobRoute;

        this.deathSound = this.scene.sound.add(mobData.deathSound);
        this.healthBar = this.scene.add.image(this.x-48, this.y - 24, "healthBar").setOrigin(0,0.5);
        this.play(mobData.mobAnim);

        switch (this.moveType) {
            case "A":
                this.path = pathA;
                break;
            case "B":
                this.path = pathB;
                break;
            case "C":
                this.path = pathC;
                break;
            case "D":
                this.path = pathD;
                break;
            case "X":
                this.path = pathBoss;
                break;
            default:
                break;
        }
        
        this.pathFollower = scene.plugins.get('rexPathFollower').add(this, {
            path: this.path,
            rotateToPath: false,
            spacedPoints: false
        });

        this.tween = scene.tweens.add({
            targets: this.pathFollower,
            t: 1,
            ease: 'Linear',
            duration: this.m_speed * 1000,
            repeat: 0,
            yoyo: false
        });

        this.scene.events.on("update", this.update, this);
    }
    update()
    {   
        this.healthBar.setPosition(this.getCenter().x-48, this.getCenter().y - 24);
        const width = this.healthBar.displayWidth * (this.Health / this.MaxHealth);
        this.scene.tweens.add({
            targets: this.healthBar,
            displayWidth: width,
            ease: Phaser.Math.Easing.Sine.Out
        });

        if (this.Health <= 0)
            this.death();
        
        if (Phaser.Math.Distance.Between(this.x, this.y, 2400, 720) < 4) {
            this.scene.playerHealth--;
            this.death();
        }
    }

    death()
    {   
        this.deathSound.play({
            mute: false,
            volume: 0.7,
            rate: 1,
            loop: false
        });
        this.scene.events.off("update", this.update, this);
        this.scene.events.emit("mobDeath", this.mobNum);
        
        this.tween.remove();
        if (this.deathAnimName == "maigcianDie") {
            this.tween = scene.add.tween({
                targets: this,
                alpha: { from: 1, to: 0 },
                ease: Phaser.Math.Easing.Linear,
                duration: (28/40)*1000,
                repeat: 1,
                yoyo: false,
            });
        };
        this.anims.play(this.deathAnimName);
        this.body.enable = false;
        
        this.scene.time.delayedCall(600, () => {
            this.tween.remove();
            this.healthBar.destroy();
            this.destroy();
        }, [], this.scene);
    }
    
    hit(projectile) {
        if (projectile.shooter.projectileType == 1) {
            if (projectile.alreadyPenetrated.findIndex(e => e == this.mobNum) == -1) {
                projectile.alreadyPenetrated.push(this.mobNum);
                this.Health -= projectile.shooter.calcDamage(this.defence);
                projectile.hit();
            }
        }
        else if(projectile.shooter.projectileType == 2) {
            projectile.explode();
        }
        else {
            this.Health -= projectile.shooter.calcDamage(this.defence);
            projectile.hit();
        }
    }
}