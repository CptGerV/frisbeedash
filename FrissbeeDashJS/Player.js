"use strict";
/************************************
 ** GAME PLAYER CLASS
 ************************************/
/**
 * Initialize all player settings.
 * @param {string} newId
 * @param {number} startX
 * @param {number} startY
 * @param {number} w
 * @param {number} h
 * @param {string} side
 * @constructor
 */
function Player(newId, startX, startY, w, h, side) {
    this.x = startX;
    this.y = startY;
    this.z = 1;
    this.id = newId;
    this.side = side;
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    this.cmd = -1;
    this.moveSpeed = 3;
    this.height = h;
    this.width = w;
    this.jumping = false;
    this.holding = false;
    this.holding_time = 0;
    this.power = 6;
    this.dash_time = 0;
    this.dashing = false;
    this.dash_vector = {x: 0, y: 0};
    this.time_break = 0;
    this.countering = false;
    this.powerGauge = 0;
    this.disc = null;
    this.velocityX = 0;
}
/**
 * Updates player informations.
 */
Player.prototype.update = function () {
    this.cmd = -1;
    if (this.powerGauge < 100)
        this.powerGauge += 0.04;
    if (!this.holding) {
        if (this.dashing) {
            if (new Date().getTime() >= this.dash_time) {
                this.dashing = false;
            }
            this.x += this.dash_vector.x;
            this.y += this.dash_vector.y;
        } else if(this.jumping) {
            this.z += this.velocityZ;
            if(this.z >= 2)
                this.velocityZ = -this.velocityZ;
            if(this.z <= 1) {
                this.z = 1;
                this.velocityZ = 0;
                this.jumping = false;
            }
        } else if(this.countering) {
            if (this.time_break < new Date().getTime())
                this.countering = false;
        } else {
            if (this.time_break > new Date().getTime())
                return;

            if (this.up) {
                this.y -= this.moveSpeed;
            }
            if (this.down) {
                this.y += this.moveSpeed;
            }
            if (this.right) {
                this.x += this.moveSpeed;
            }
            if (this.left) {
                this.x -= this.moveSpeed;
            }
        }
    } else {
        if(new Date().getTime() < this.time_break) {
            this.x += this.velocityX;
            this.disc.x += this.velocityX;
        } else {
            this.velocityX = 0;
        }
    }
};
/**
 * Associates disk to the player.
 * @param {object} disc
 */
Player.prototype.take_disc = function (disc) {
    this.time_break = new Date().getTime() + 100;
    this.holding_time = new Date().getTime();
    this.holding = true;
    this.disc = disc;

    if(disc.velocityZ == 0) {
        this.velocityX = this.disc.velocityX / 4;
    }
    this.disc.setVel({x: 0, y: 0, z: 0});
};
/**
 * Applies new settings to disk.
 */
Player.prototype.throwDisc = function () {
    if (this.time_break > new Date().getTime())
        return;
    // Replace the disc in front of player
    if (this.side == 'left') {
        this.disc.x = (this.x + (this.width / 2) + this.disc.radius + 10);
    } else {
        this.disc.x = (this.x - (this.width / 2) - this.disc.radius - 10);
    }

    let perfect = 1;
    if (new Date().getTime() <= this.time_break + 250) {
        perfect = 1.1;
    }

    let angle = 0;
    if (this.up && this.down) {
        this.disc.velocityY = 0;
    } else if (this.up) {
        this.disc.y = (this.y - (this.width / 2) - this.disc.radius);
        if (this.right)
            angle = 35;
        else
            angle = 50;
    } else if (this.down) {
        this.disc.y = (this.y + (this.width / 2) + this.disc.radius);
        if (this.right)
            angle = -35;
        else
            angle = -50;
    } else {
        this.disc.setVelY(0);
    }

    let sens = 1;
    if (this.side == 'right')
        sens = -1;

    this.disc.velocityX = (sens * Math.cos(angle * (Math.PI / 180)) * this.power * perfect);
    this.disc.velocityY = -(Math.sin(angle * (Math.PI / 180)) * this.power * perfect);

    this.time_break = new Date().getTime() + 300;
    this.disc.start();
    this.disc = null;
    this.holding = false;
};
/**
 * Applies new settings to disk.
 * @param {object} field
 */
Player.prototype.lobDisc = function (field) {
    if (this.powerGauge < 10)
        return;
    this.powerGauge -= 10;

    let target = {x: 0, y: 0};

    target.y = this.y;
    if (this.up) {
        target.y = this.y - (field.height / 2);
        if (target.y < this.disc.radius + 5)
            target.y = this.disc.radius + 5;
    } else if (this.down) {
        target.y = this.y + (field.height / 2);
        if (target.y > field.height - this.disc.radius)
            target.y = field.height - this.disc.radius;
    }

    target.x = field.width / 4;
    if (this.side == 'left') {
        target.x = field.width * 0.75;
    }

    if (this.right) {
        target.x = (field.width - this.disc.radius) - 50;
        if (this.side == 'right')
            target.x = (field.width / 2) - this.disc.radius - 50;

    } else if (this.left) {
        target.x = this.disc.radius + 50;
        if (this.side == 'left')
            target.x = (field.width / 2) + this.disc.radius + 50;
    }

    // velocity
    const velX = (target.x - this.x) / 120;
    const velY = (target.y - this.y) / 120;
    const velZ = 5 / 60;

    // Set velocity
    this.disc.setVelX(velX);
    this.disc.setVelY(velY);
    this.disc.setVelZ(velZ);

    if (this.side == 'left') {
        this.disc.x = (this.x + (this.width / 2)) + this.disc.radius;
    } else {
        this.disc.x = (this.x - (this.width / 2)) - this.disc.radius;
    }

    this.disc.start();
    this.disc = null;
    this.holding = false;
};
/**
 * Increase player speed in the direction of movement.
 * @returns {boolean}
 */
Player.prototype.dash = function () {
    // 300 ms between action and dash
    if (!this.doingSomething() && this.time_break <= new Date().getTime()) {
        if (this.powerGauge < 10)
            return false;
        this.powerGauge -= 10;

        this.dashing = true;
        this.dash_time = new Date().getTime() + 150;
        this.dash_vector = {x: 0, y: 0};
        let dash_speed = this.moveSpeed * 3;
        if (this.up) {
            this.dash_vector.y = -dash_speed;
        }
        if (this.down) {
            this.dash_vector.y = dash_speed;
        }
        if (this.right) {
            this.dash_vector.x = dash_speed;
        }
        if (this.left) {
            this.dash_vector.x = -dash_speed;
        }
        return true;
    } else {
        return false;
    }
};
/**
 *
 */
Player.prototype.jump = function () {
    if (this.time_break < new Date().getTime() && !this.doingSomething()) {
        this.jumping = true;
        this.velocityZ = 1 / 60;
    }
};
/**
 * Enables "counter mode" during 500 milliseconds.
 */
Player.prototype.counter = function () {
    if (this.time_break < new Date().getTime() && !this.doingSomething()) {
        this.countering = true;
        this.time_break = new Date().getTime() + 500;
    }
};
/**
 * Enables "special mode" disc.
 */
Player.prototype.specialBlow = function () {
    if (this.powerGauge < 30)
        return;
    this.powerGauge -= 30;

    this.disc.setSpecialMode(true);

    this.disc.target.x = this.side == "left" ? this.x + 120 : this.x - 120;
    this.disc.target.y = this.y;

    this.disc.sens.y = 1;
    if (this.y > (360 / 2)) {
        this.disc.sens.y = -1;
    }

    if (this.side == "left") {
        this.disc.setX(this.x + (this.width / 2) + this.disc.radius + 10);
        this.disc.sens.x = 1;
        this.disc.setVelX(8);
    } else {
        this.disc.setX(this.x - (this.width / 2) - this.disc.radius - 10);
        this.disc.sens.x = -1;
        this.disc.setVelX(-8);
    }

    this.disc.start();
    this.disc = null;
    this.holding = false;
};
/**
 * Get player state.
 * @returns {boolean} - True if player is jumping, dashing or countering.
 */
Player.prototype.doingSomething = function() {
    return this.jumping || this.dashing || this.countering;
};
/**
 * Update player controls.
 * @param {object} data
 */
Player.prototype.updateCmd = function (data) {
    this.up = data.up || false;
    this.down = data.down || false;
    this.left = data.left || false;
    this.right = data.right || false;
    this.cmd = data.cmd || -1;
    if(data.cmd == 0){
        this.cmd = 0;
    }
};

// Export the Player class so you can use it in
// other files by using require("Player").Player
module.exports = Player;