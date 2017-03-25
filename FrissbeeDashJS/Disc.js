"use strict";
/**
 *
 * @param {number} r - disc radius.
 * @constructor
 */
function Disc(r) {
    // List of variables only the object can see (private variables).
    this.velocityX = 0;
    this.velocityY = 0;
    this.velocityZ = 0;
    this.x = 0;
    this.y = 0;
    this.z = 1;
    this.paused = false;
    this.radius = r;
    this.specialMode = false;
    this.target = {x: 0, y: 0};
    this.sens = {x: 0, y: 0};
}
/**
 *
 * @param sp
 */
Disc.prototype.setSpecialMode = function (sp) {
    this.specialMode = sp;
};
/**
 *
 * @param newX
 */
Disc.prototype.setX = function (newX) {
    this.x = newX;
};
/**
 *
 * @param newY
 */
Disc.prototype.setY = function (newY) {
    this.y = newY;
};
/**
 *
 * @param pos
 */
Disc.prototype.setPos = function (pos) {
    this.x = pos.x;
    this.y = pos.y;
    this.z = pos.z;
};
/**
 *
 * @param newX
 */
Disc.prototype.setVelX = function (newX) {
    this.velocityX = newX;
};
/**
 *
 * @param newY
 */
Disc.prototype.setVelY = function (newY) {
    this.velocityY = newY;
};
/**
 *
 * @param newZ
 */
Disc.prototype.setVelZ = function (newZ) {
    this.velocityZ = newZ;
};
/**
 *
 * @param vel
 */
Disc.prototype.setVel = function (vel) {
    this.velocityX = vel.x;
    this.velocityY = vel.y;
    this.velocityZ = vel.z;
};
/**
 *
 * @returns {{velocityX: *, velocityY: *, velocityZ: *}}
 */
Disc.prototype.getVel = function () {
    return {velocityX: this.velocityX, velocityY: this.velocityY, velocityZ: this.velocityZ};
};

// Method that moves the ball based on its velocity. This method is only used
// internally and will not be made accessible outside of the object.
Disc.prototype.move = function () {
    if (this.specialMode) {

        this.x += this.velocityX;
        this.y += this.velocityY;

        if ( (this.sens.x == 1 && this.x > this.target.x) || (this.sens.x == -1 && this.x < this.target.x) ) {
            this.x = this.target.x;
            this.velocityX = 0;
            this.target.y = this.y + (this.sens.y * 120); // (screenHeight / 3)
            this.velocityY = this.sens.y * (12 / 2);
        }  else if ( (this.y < this.target.y && this.sens.y == -1) || (this.y > this.target.y && this.sens.y == 1)) {
            this.y = this.target.y;
            this.velocityY = 0;
            this.target.x = this.x + (this.sens.x * 120); // (screenHeight / 3)
            this.sens.y = -this.sens.y;
            this.velocityX = this.sens.x * 8;
        }

    } else {
        this.x += this.velocityX;
        this.y += this.velocityY;
        if (this.velocityZ != 0) {
            this.z += this.velocityZ;
            if (this.z >= 2) {
                this.velocityZ -= ((5 / 60) / 48);
            }
        }
    }
};
/**
 *
 */
Disc.prototype.reverseVelocityX = function () {
    this.velocityX = -this.velocityX;
};
/**
 *
 */
Disc.prototype.reverseVelocityY = function () {
    this.velocityY = -this.velocityY;
};
/**
 *
 */
Disc.prototype.update = function () {
    if (!this.paused) {
        this.move();
    }
};
/**
 * Pause the ball motion.
 */
Disc.prototype.pause = function () {
    this.paused = true;
};
/**
 * Start the ball motion.
 */
Disc.prototype.start = function () {
    this.paused = false;
};
/**
 *
 * @returns {boolean}
 */
Disc.prototype.isMoving = function () {
    return !this.paused;
};
/**
 *
 * @param n_frame
 * @returns {{x: (number|*), y: (number|*)}}
 */
Disc.prototype.getNextPos = function (n_frame) {
    let f = 0, x_next = this.x, y_next = this.y, z_next = this.z;
    let velZ = this.velocityZ,
        velX = this.velocityX,
        velY = this.velocityY;
    do {
        if (z_next >= 2) {
            velZ -= ((5 / 60) / 48);
        }
        if (z_next < 0.9) {
            velZ = 0;
            velY = 0;
            velX = 0;
        }
        x_next += velX;
        y_next += velY;
        z_next += velZ;
        f++;
    } while (f < n_frame);

    return {x: x_next, y: y_next};
};

module.exports = Disc;
