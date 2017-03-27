/**************************************************
 ** GAME PLAYER CLASS
 **************************************************/
function Player(startX, startY, game, side, scale_x, scale_y) {
    this.throwing = false;
    this.x = startX;
    this.y = startY;
    this.moveAmount = 2;
    this.positions = [];
    this.positions_size = 10;
    this.powerGauge = 0;
    this.side = side;
    this.scale_x = scale_x;
    this.scale_y = scale_y;
    this.trail_left = game.add.group();
    this.trail_right = game.add.group();
    this.dashing = 0;

    while (this.positions_size--) {
        this.positions.push({x: this.x, y: this.y});
        let s_shadow_left = this.trail_left.create(this.x, this.y, 'character');
        s_shadow_left.frame = this.side == "left" ? 20: 17;
        s_shadow_left.anchor.set(0.5, 0.5);
        s_shadow_left.alpha = 0.1;
        s_shadow_left.scale.set(resize_ratio_x / 1.5, resize_ratio_y / 1.3);
        let s_shadow_right = this.trail_right.create(this.x, this.y, 'character');
        s_shadow_right.frame = this.side == "left" ? 21: 16;
        s_shadow_right.anchor.set(0.5, 0.5);
        s_shadow_right.alpha = 0.1;
        s_shadow_right.scale.set(resize_ratio_x / 1.5, resize_ratio_y / 1.3);
    }
    this.trail_right.visible = false;
    this.trail_left.visible = false;

    let sprite = game.add.sprite(this.x, this.y, 'character');
    sprite.anchor.set(0.5, 0.5);
    if(side == 'left') {
        sprite.animations.add('idle', [4, 5, 6, 7], 6, true);
        let animation = sprite.animations.add('throw', [12, 13, 14, 15], 16, false);
        animation.onComplete.add(throwComplete, this);
        sprite.animations.add('runRight', [21], 1, true);
        sprite.animations.add('runLeft', [20], 1, true);
    } else if (side == 'right') {
        sprite.animations.add('idle', [0, 1, 2, 3], 6, true);
        let animation = sprite.animations.add('throw', [8, 9, 10, 11], 16, false);
        animation.onComplete.add(throwComplete, this);
        sprite.animations.add('runLeft', [17], 1, true);
        sprite.animations.add('runRight', [16], 1, true);
    }

    this.sprites = sprite;
    this.sprites.scale.set(resize_ratio_x / 1.5, resize_ratio_y / 1.3);
}

Player.prototype.setPos = function (newPos) {
    if(this.throwing)
        return;

    if (newPos.x != this.x || newPos.y != this.y) {
        this.sprites.animations.stop('idle');
        if(newPos.x > this.x) {
            this.sprites.animations.play('runRight');
            if(new Date().getTime() < this.dashing) {
                this.trail_right.visible = true;
                this.trail_left.visible = false;
            } else {
                this.trail_right.visible = false;
                this.trail_left.visible = false;
            }
        } else if(newPos.x < this.x) {
            this.sprites.animations.play('runLeft');
            if(new Date().getTime() < this.dashing) {
                this.trail_right.visible = false;
                this.trail_left.visible = true;
            } else {
                this.trail_right.visible = false;
                this.trail_left.visible = false;
            }
        } else {
            if(this.side == 'right') {
                this.sprites.animations.play('runLeft');
                if(new Date().getTime() < this.dashing) {
                    this.trail_right.visible = false;
                    this.trail_left.visible = true;
                } else {
                    this.trail_right.visible = false;
                    this.trail_left.visible = false;
                }
            }
            else {
                this.sprites.animations.play('runRight');
                if(new Date().getTime() < this.dashing) {
                    this.trail_right.visible = true;
                    this.trail_left.visible = false;
                } else {
                    this.trail_right.visible = false;
                    this.trail_left.visible = false;
                }
            }
        }
    } else {
        this.sprites.animations.play('idle', 6, true);
        this.trail_right.visible = false;
        this.trail_left.visible = false;
     }

    this.sprites.x = newPos.x;
    this.sprites.y = newPos.y;
    this.x = newPos.x;
    this.y = newPos.y;

    this.positions.push(newPos);
    this.positions.shift();

    let i = 0;
    this.trail_left.forEach(function(t) {
        t.x = this.positions[i].x;
        t.y = this.positions[i].y;
        i++;
    }, this);

    i = 0;
    this.trail_right.forEach(function(t) {
        t.x = this.positions[i].x;
        t.y = this.positions[i].y;
        i++;
    }, this);
};

Player.prototype.update = function (keys) {
    // Up key takes priority over down
    if (keys.up) {
        this.y -= this.moveAmount;
    } else if (keys.down) {
        this.y += this.moveAmount;
    }

    // Left key takes priority over right
    if (keys.left) {
        this.x -= this.moveAmount;
    } else if (keys.right) {
        this.x += this.moveAmount;
    }
};

Player.prototype.throw = function() {
    this.throwing = true;
    this.sprites.visible = true;
    this.sprites.play('throw', 16, false);
};

Player.prototype.dash = function() {
    this.dashing = new Date().getTime() + 150;
};

function throwComplete() {
    this.throwing = false;
}