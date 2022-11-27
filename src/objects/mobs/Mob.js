const Phaser = require("phaser");
import {
    pathA0,
    pathB0,
    pathC0,
    pathD0,
    pathBoss0,
    pathA1,
    pathB1,
    pathC1,
    pathD1,
    pathBoss1,
    pathA2,
    pathB2,
    pathC2,
    pathD2,
    pathBoss2,
    pathA3,
    pathB3,
    pathC3,
    pathD3,
    pathBoss3
} from "../points/mobPath";
import Game from "../../Game.js";

export default class Mob extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, mobData,num,mobRoute,hpFactor,playerNum) {
        super(scene, -5000, -5000, mobData.mobAnim);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.isTarget = true;
        this.Health = mobData.health * hpFactor;
        this.MaxHealth = mobData.health * hpFactor;
        this.scale = mobData.scale;
        this.m_speed = mobData.m_speed;
        this.deathAnimName = mobData.deathAnimName;
        this.defence = mobData.defence;
        //this.damage = mobData.damage;
        this.mobNum = num;
        this.moveType = mobRoute + playerNum;
        this.deathCalled = false;
        this.isBoss = mobData.boss;
        this.dotDamageDict = {};
        this.debuffDict = {};
        this.totalDebuffVal = 0;
        this.playerNum = playerNum;
        

        this.deathSound = this.scene.sound.add(mobData.deathSound);
        
        this.play(mobData.mobAnim);
        this.flipX = !mobData.boss;

        if (!this.isBoss) {
            this.healthBar = this.scene.add.image(this.x-48, this.y - 24, "healthBar").setOrigin(0,0.5);
            this.healthBarWidth = this.healthBar.displayWidth;
            if (playerNum != 0)
                this.healthBar.setVisible(false);
        }
        else if (this.isBoss && this.playerNum == 0) {
            Game.showUI("bossArea");
            document.getElementsByClassName("ui-bossArea-bosshp-bar")[0].style.width = (this.Health / this.MaxHealth) * 100 + "%";
            document.getElementsByClassName("ui-bossArea-bosshp-text")[0].innerText = this.Health.toLocaleString() + "/" + this.MaxHealth.toLocaleString();
        }
        
        if (this.playerNum != 0) {
            this.setVisible(false);      
        }

        if (this.scene.currentView == this.playerNum)
        {
            this.setVisible(true);
            if (this.healthBar)
                this.healthBar.setVisible(true);
        }
        switch (this.moveType) {
            case "A0":
                this.path = pathA0;
                break;
            case "B0":
                this.path = pathB0;
                break;
            case "C0":
                this.path = pathC0; 
                break;
            case "D0":
                this.path = pathD0;
                break;
            case "X0":
                this.path = pathBoss0;
                this.flipX = false;
                break;
            case "A1":
                this.path = pathA1;
                break;
            case "B1":
                this.path = pathB1;
                break;
            case "C1":
                this.path = pathC1; 
                break;
            case "D1":
                this.path = pathD1;
                break;
            case "X1":
                this.path = pathBoss1;
                this.flipX = false;
                break;
            case "A2":
                this.path = pathA2;
                break;
            case "B2":
                this.path = pathB2;
                break;
            case "C2":
                this.path = pathC2; 
                break;
            case "D2":
                this.path = pathD2;
                break;
            case "X2":
                this.path = pathBoss2;
                this.flipX = false;
                break;
            case "A3":
                this.path = pathA3;
                break;
            case "B3":
                this.path = pathB3;
                break;
            case "C3":
                this.path = pathC3; 
                break;
            case "D3":
                this.path = pathD3;
                break;
            case "X3":
                this.path = pathBoss3;
                this.flipX = false;
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
        this.scene.events.on("spectateChange", this.setVisibility, this);
    }
    update()
    {       
        if (!this.isBoss) {
            
            this.healthBar.setPosition(this.getCenter().x-48, this.getCenter().y - 24);
            this.healthBar.displayWidth = this.healthBarWidth * (this.Health / this.MaxHealth);
        }
        else {
            if (this.playerNum == this.scene.currentView) {
                if (this.Health <= 0) {
                    document.getElementsByClassName("ui-bossArea-bosshp-bar")[0].style.width =  "0%";
                    document.getElementsByClassName("ui-bossArea-bosshp-text")[0].innerText = "0";
                }
                else {
                    document.getElementsByClassName("ui-bossArea-bosshp-bar")[0].style.width =  (this.Health / this.MaxHealth) * 100  + "%";
                    document.getElementsByClassName("ui-bossArea-bosshp-text")[0].innerText = Math.floor(this.Health).toLocaleString() + "/" + this.MaxHealth.toLocaleString();
                }
            }
        }

        if (this.Health <= 0 && !this.deathCalled) {
            this.death();
        }
        else if (this.tween.progress == 1 && !this.deathCalled) {
            if(this.playerNum == 0) {
                let b_Damage = 2;

                if (this.isBoss) b_Damage = 20;
                else if (this.scene.roundNum <= 10) b_Damage = 2;
                else if (this.scene.roundNum <= 25) b_Damage = 3;
                else b_Damage = 4;

                Game.hitPlayerBase(b_Damage);
            }

            this.deathCalled = true;
            this.death();
        }
    }

    setVisibility()
    {
        if (this.playerNum == this.scene.currentView) {
            this.setVisible(true);
            if (this.healthBar)
                this.healthBar.setVisible(true);
        }
        else {
            this.setVisible(false);
            if (this.healthBar)
                this.healthBar.setVisible(false);
        }
    }

    death() {
        // this.deathSound.play(Game.effectSoundConfig);
        this.scene.events.off("update", this.update, this);
        this.scene.events.off("spectateChange", this.setVisibility, this);
        if (this.playerNum == 0) {
            this.scene.mobCounter--;
            Game.updateMobCounter();
        }
        this.body.enable = false;

        if (!this.isBoss) this.healthBar.destroy();

        this.tween.remove();
        this.body.destroy();
        this.play(this.deathAnimName);

        var animConfig = this.scene.anims.get(this.deathAnimName);
        var animtime = animConfig.frames.length * animConfig.msPerFrame;
        this.scene.time.delayedCall(animtime, () => {
            if (this.playerNum == 0) this.scene.events.emit("mobAnimDone");
            this.destroy();
        }, [], this.scene);
    }
    
    hit(projectile) {
        if (projectile.shooter.projectileType == 1) {
            if (projectile.alreadyPenetrated.findIndex(e => e == this.mobNum) == -1) {
                var damage = projectile.shooter.calcDamage(projectile.shooter.attack, this.defence) * (1 + this.totalDebuffVal / 100);
                projectile.alreadyPenetrated.push(this.mobNum);
                if (projectile.skillInfo != null) {
                    if (projectile.skillInfo.skillType == "DOT")
                        this.dotDamageFactory(projectile);
                    if (projectile.skillInfo.skillType == "debuff")
                        this.handleDebuff(projectile.shooter.id, projectile.skillInfo.value);
                    if (projectile.skillInfo.skillType == "attackCount") {
                        if (projectile.skillInfo.ofHealth == "cur")
                            damage = projectile.shooter.calcDamage(projectile.shooter.attack + this.Health * (projectile.skillInfo.value / 100), this.defence) * (1 + this.totalDebuffVal / 100);
                        if (projectile.skillInfo.ofHealth == "lost")
                            damage = projectile.shooter.calcDamage(projectile.shooter.attack * projectile.skillInfo.value * (1 - this.Health / this.MaxHealth), this.defence) * (1 + this.totalDebuffVal / 100);
                        if (projectile.skillInfo.ofHealth == "atk")
                            damage = projectile.shooter.calcDamage(projectile.shooter.attack * (1 + projectile.skillInfo.value / 100), this.defence) * (1 + this.totalDebuffVal / 100);
                    }
                }
                this.Health -= damage;
                projectile.hit();
            }
        }
        else if (projectile.shooter.projectileType == 2) {
            projectile.explode();
        }
        else {
            var damage = projectile.shooter.calcDamage(projectile.shooter.attack, this.defence) * (1 + this.totalDebuffVal / 100);
            if (projectile.skillInfo != null) {
                if (projectile.skillInfo.skillType == "DOT")
                    this.dotDamageFactory(projectile);
                if (projectile.skillInfo.skillType == "debuff")
                    this.handleDebuff(projectile.shooter.id, projectile.skillInfo.value);
                if (projectile.skillInfo.skillType == "attackCount") {
                    if (projectile.skillInfo.ofHealth == "cur")
                        damage = projectile.shooter.calcDamage(projectile.shooter.attack + this.Health * (projectile.skillInfo.value / 100), this.defence) * (1 + this.totalDebuffVal / 100);
                    if (projectile.skillInfo.ofHealth == "lost")
                        damage = projectile.shooter.calcDamage(projectile.shooter.attack * projectile.skillInfo.value * (1 - this.Health / this.MaxHealth), this.defence) * (1 + this.totalDebuffVal / 100);
                    if (projectile.skillInfo.ofHealth == "atk")
                        damage = projectile.shooter.calcDamage(projectile.shooter.attack * (1 + projectile.skillInfo.value / 100), this.defence) * (1 + this.totalDebuffVal / 100);
                }
            }
            this.Health -= damage;
            projectile.hit();
        }
    }

    handleDebuff(id, value)
    {
        if (!this.debuffDict[id])
        {
            this.debuffDict[id] = value;
            this.totalDebuffVal += value;   
        }
    }

    dotDamageFactory(projectile) {
        if (!this.dotDamageDict[projectile.skillInfo.callerID]) {

            var damage = projectile.skillInfo.ofHealth == "cur" ?
                projectile.shooter.attack + (this.Health * projectile.skillInfo.value) :
                projectile.shooter.attack * (1 + projectile.skillInfo.value / 100);
            
            this.dotDamageDict[projectile.skillInfo.callerID] = this.scene.time.addEvent({
                delay: projectile.skillInfo.delay * 1000,
                repeat: projectile.skillInfo.duration / projectile.skillInfo.delay,
                callback: () => {
                    this.Health -= projectile.shooter.calcDamage(damage, this.defence) * (1 + this.totalDebuffVal / 100);
                },
                startAt: 0
            });
        }
        else {
            this.dotDamageDict[projectile.skillInfo.callerID].addEvent(this.dotDamageDict[projectile.skillInfo.callerID]);
        }
        console.log(this.dotDamageDict);
    }

    dotDamageFactoryMili(unit) {
        console.log(this.dotDamageDict);
        if (!this.dotDamageDict[unit.index]) {
            var damage = unit.skillInfo.ofHealth == "cur" ?
                unit.attack + (this.Health * unit.skillInfo.value) :
                unit.attack * (1 + unit.skillInfo.value / 100);
            
            this.dotDamageDict[unit.index] = this.scene.time.addEvent({
                delay: unit.skillInfo.delay * 1000,
                repeat: unit.skillInfo.duration / unit.skillInfo.delay,
                callback: () => {
                    this.Health -= unit.calcDamage(damage, this.defence) * (1 + this.totalDebuffVal / 100);
                },
                startAt: 0
            });
        }
        else {
            this.dotDamageDict[unit.index].addEvent(this.dotDamageDict[unit.index]);
        }
        console.log(this.dotDamageDict);
    }
}