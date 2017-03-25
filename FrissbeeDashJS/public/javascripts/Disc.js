"use strict";
function Disc(startX, startY, scale_x, scale_y, r, game) {
    this.x = startX;
    this.y = startY;
    this.z = 1;
    this.radius = r;
    this.positions = [];
    this.positions_size = 10;
    this.scale_x = scale_x;
    this.scale_y = scale_y;

    this.trail = game.add.group();
    for(let i = 0; i < this.positions_size; i++) {
        let s_shadow = this.trail.create(-50, -50, 'disc_trail');
        s_shadow.scale.set(scale_x, scale_y);
        s_shadow.anchor.set(0.5, 0.5);
    }

    let sprite_disc = game.add.sprite(-50, -50, 'disc');
    sprite_disc.anchor.set(0.5, 0.5);
    sprite_disc.scale.set(scale_x, scale_y);
    sprite_disc.animations.add('turn');
    this.sprite_disc = sprite_disc;

    while (this.positions_size--)
        this.positions[this.positions_size] = {x: -50, y: -50, z: -50};
}

Disc.prototype.setPos = function (newPos) {
    if(newPos.x != this.x || newPos.y != this.y)
        this.sprite_disc.animations.play('turn', 24, true);
    else
        this.sprite_disc.animations.stop('turn');

    this.x = newPos.x;
    this.y = newPos.y;
    this.z = newPos.z;
    this.sprite_disc.x = this.x;
    this.sprite_disc.y = this.y;

    if(this.z > 1) {
        this.sprite_disc.scale.set(this.scale_x + this.z / 2, this.scale_y + this.z / 2);
    } else {
        this.sprite_disc.scale.set(this.scale_x, this.scale_y);
    }

    this.positions.push(newPos);
    this.positions.shift();

    let i = 0;
    this.trail.forEach(function(t) {
        t.alpha = (i + 1) / this.positions.length;
        t.x = this.positions[i].x;
        t.y = this.positions[i].y;
        i++;
    }, this);
};
