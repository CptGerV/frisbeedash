"use strict";
/**
 * Created by kevin on 09/01/2017.
 */
const collide = require('box-collide');
const request = require('request');
const util = require('util');
const Disc = require('./Disc.js');
const Player = require('./Player.js');

const gameProperties = {
    screenWidth: 640,
    screenHeight: 360,

    dashSize: 5,

    discRadius: 10,
    discStartDelay: 2,

    scoreToWin: 2,
    scoreToWinSet: 3,
};

function collideDiscWithPlayer(disc, player) {
    let box_disc = {
        x: disc.x - (disc.radius / 2),
        y: disc.y - (disc.radius / 2),
        width: disc.radius,
        height: disc.radius,
    };
    let box_p = {
        x: player.x - (player.width / 2),
        y: player.y - (player.width / 2),
        width: player.width,
        height: player.height,
    };

    return !!(collide(box_disc, box_p) && ( (disc.z > 1 && player.jumping) || (disc.z >= player.z - 0.5 && disc.z <= player.z + 0.5) ));
}
/**
 * @param {integer} n_space - limit space in room.
 * @param {string} token - token for connection with authentication server.
 * @constructor
 */
function Room(n_space, token) {
    this.token = token;
    this.players_room = [];
    this.socket_users = [];
    this.space = n_space;
    this.disc = new Disc(10);
    this.disc.pause();
    this.first = Math.floor(Math.random() * 2);
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.lastUpdate = 0;
    this.time_disc_paused = 0;
    this.next_round = false;
    this.updating = false;
    this.started = false;
    this.setLeft = 0;
    this.setRight = 0;
}
/**
 * @returns {boolean} - True if no user can be added.
 */
Room.prototype.isFull = function() {
  return this.players_room.length == this.space;
};
/**
 * Start the game.
 * @param {string} startSide - Specifies which side the disc will be sent first.
 */
Room.prototype.start = function (startSide) {
    if (this.players_room.length != this.space){
        console.log("The party can't start because room is not full");
        return;
    }
    this.disc.specialMode = false;
    this.disc.pause();
    this.time_disc_paused = new Date().getTime() + 3000;
    this.next_round = true;
    if (typeof(startSide) == 'undefined')
        startSide = Math.floor(Math.random()) ? 'left': 'right';

    let target_x = gameProperties.screenWidth / 4;
    if (startSide == 'left')
        target_x = gameProperties.screenWidth * 0.75;

    let vel_x = (target_x - gameProperties.screenWidth / 2) / 120;
    let vel_y = (gameProperties.screenHeight / 2) / 120;

    this.disc.setPos({x: gameProperties.screenWidth / 2, y: gameProperties.screenHeight - this.disc.radius, z: 1});
    this.disc.setVel({x: vel_x, y: vel_y, z: 5 / 60});

    // Send start signal to players
    this.socket_users.forEach(function (socket) {
        socket.emit('start game');
    });
    this.started = true;
};
/**
 *
 * @param {object} user - User's information to add in room.
 * @returns {boolean} - True if user was successfully added.
 */
Room.prototype.addUser = function (user) {
    if (this.players_room.length < this.space) {
        let side = 'left';
        let start_x = gameProperties.screenWidth / 4;
        if (this.players_room.length % 2) {
            side = 'right';
            start_x = gameProperties.screenWidth * 0.75;
        }

        if (user.pseudo != 'IA')
            this.socket_users.push(user);

        this.players_room.push(new Player(user.pseudo, start_x, gameProperties.screenHeight / 2, 60, 60, side));

        // Send players_room information
        for (let i = 0; i < this.socket_users.length; i++) {
            const socket = this.socket_users[i];
            socket.emit('new player', {'id': user.pseudo, date:new Date().getTime()});
            if (user.pseudo != 'IA' && socket.id != user.id) {
                user.emit('new player', {'id': socket.pseudo, date:new Date().getTime()});
            }
        }
        return true;
    }
    return false;
};
/**
 * Remove the user with pseudo from the room.
 * @param pseudo - User's pseudo
 */
Room.prototype.removeUser = function (pseudo) {
    if(this.started) {
        for (let i = 0; i < this.players_room.length; i++) {
            if(this.players_room[i].id != pseudo) {
                // Send end game signal with player_id winner
                this.endGame(this.players_room[i].id);
            }
        }
    } else {
        for (let i = 0; i < this.players_room.length; i++) {
            const player = this.players_room[i];
            if (player.id == pseudo) {
                this.players_room.splice(i, 1);
            }
        }

        for (let i = 0; i < this.socket_users.length; i++) if (this.socket_users[i].pseudo == pseudo) {
            this.socket_users[i].emit('end game', '');
            delete this.socket_users.splice(i, 1);
        }
    }
};
/**
 * Get the user by pseudo.
 * @param pseudo - User's pseudo.
 * @returns {*}
 */
Room.prototype.getPlayerById = function (pseudo) {
    for (let i = 0; i < this.players_room.length; i++) {
        const player = this.players_room[i];
        if (player.id == pseudo)
            return player;
    }
};
/**
 *
 */
Room.prototype.update = function () {
    if (this.started != true)
        return;

    if (this.lastUpdate == 0) {
        // Init last update
        this.lastUpdate = new Date().getTime();
    }

    if (this.updating == false) {
        this.updating = true;
        // Define how much simulation should be done
        const time = new Date().getTime();
        const dif_time = time - this.lastUpdate;
        const n_cycle = dif_time / 34;

        for (let cycle = 0; cycle < n_cycle; cycle++) {
            // BALL
            if (this.next_round && (this.lastUpdate > this.time_disc_paused)) {
                this.disc.start();
                this.next_round = false;
            }

            // Collisions between Player and disc
            if (this.disc.isMoving()) {
                for (let j = 0; j < this.players_room.length; j++) {
                    let player = this.players_room[j];
                    if (collideDiscWithPlayer(this.disc, player)) {
                        this.disc.setSpecialMode(false);
                        if (player.countering && this.disc.velocityZ == 0) {
                            const disc_vel = this.disc.getVel();
                            this.disc.setVel({
                                x: disc_vel.velocityX * 1.2,
                                y: disc_vel.velocityY * 1.2,
                                z: 0
                            });
                            this.disc.reverseVelocityX();
                            this.disc.reverseVelocityY();
                            player.countering = false;
                        } else {
                            this.disc.pause();
                            this.disc.x = player.x;
                            this.disc.y = player.y;
                            this.disc.z = 1;
                            player.take_disc(this.disc);
                        }
                    }
                }
            }

            // Disc
            this.disc.update();

            // IA action
            for (let i = 0; i < this.players_room.length; i++) {
                let player = this.players_room[i];
                if (player.id == "IA") {
                    const newCmd = {up: false, down: false, left: false, right: false, cmd: -1};
                    if (player.holding) {
                        // If IA hold the disc
                        if (Math.random() * 100 > 60)
                            newCmd.cmd = Math.floor((Math.random() * 3) - 1);

                        let move_cmd = Math.floor((Math.random() * 3));
                        if (move_cmd == 0) {
                            newCmd.up = true;
                        } else if (move_cmd == 1) {
                            newCmd.down = true;
                        }

                        move_cmd = Math.floor((Math.random() * 3));
                        if (move_cmd == 0) {
                            newCmd.left = true;
                        } else if (move_cmd == 1) {
                            newCmd.right = true;
                        }

                    } else {
                        if (this.disc.x <= gameProperties.screenWidth / 2) {
                            // If disc on the other side
                            //  Replace IA in field's center
                            if (player.x < (gameProperties.screenWidth * 0.75 - 5)) {
                                newCmd.right = true;
                            } else if (player.x > (gameProperties.screenWidth * 0.75 + 5)) {
                                newCmd.left = true;
                            }
                            if (player.y < (gameProperties.screenHeight / 2 - 5)) {
                                newCmd.down = true;
                            } else if (player.y > (gameProperties.screenHeight / 2 + 5)) {
                                newCmd.up = true;
                            }
                        } else {

                            //  Follow the ball
                            if (this.disc.y > player.y) {
                                newCmd.down = true;
                            } else if (this.disc.y < player.y) {
                                newCmd.up = true;
                            }
                            if (this.disc.x < player.x) {
                                newCmd.left = true;
                            } else if (this.disc.x > player.x) {
                                newCmd.right = true;
                            }

                            const a = Math.pow(this.disc.x - player.x, 2);
                            const b = Math.pow(this.disc.y - player.y, 2);
                            const dist = Math.sqrt(a + b);
                            if (dist > 150) { // Approximation => define more precisely
                                newCmd.cmd = Math.floor((Math.random() * 3)) - 1;
                            }
                        }
                    }
                    player.updateCmd(newCmd);
                }
            }

            // Players action
            for (let i = 0; i < this.players_room.length; i++) {
                let player = this.players_room[i];
                if (player.holding) {
                    if (player.cmd == 0 || player.holding_time + 3000 <= new Date().getTime() ) {
                        player.throwDisc(this.disc);
                        if (Math.sign(this.disc.velocityX) * this.disc.velocityX > player.power
                        || this.disc.velocityY > 3.5
                        || this.disc.velocityY < -3.5) {
                            this.socket_users.forEach(function (socket) {
                                socket.emit('perfect throw', { id: player.id });
                            });
                        }
                    } else if (player.cmd == 1) {
                        player.lobDisc({
                            height: gameProperties.screenHeight,
                            width: gameProperties.screenWidth
                        });

                    } else if (player.cmd == 2) {
                        // technique special
                        player.specialBlow(this.disc);
                    }
                } else {
                    if (player.cmd == 0) {
                        if(player.dash()) {
                            this.socket_users.forEach(function (socket) {
                                socket.emit('dash', player.id);
                            });
                        }
                        // Command jump
                    //} else if(player.cmd == 1) {
                      //  player.jump();
                    } else if (player.cmd == 2) {
                        player.counter();
                    }
                }
                player.update();
            }

            // ##### COLLISIONS #####
            // Players and border
            for (let i = 0; i < this.players_room.length; i++) {
                let player = this.players_room[i];
                if (player.side == 'left') {
                    if (player.x < player.width / 2) {
                        player.x = (player.width / 2);
                    } else if (player.x > (gameProperties.screenWidth / 2) - (player.width / 2) - 5) {
                        player.x = ((gameProperties.screenWidth / 2) - (player.width / 2) - 5);
                    }
                } else if (player.side == 'right') {
                    if (player.x < (gameProperties.screenWidth / 2) + (player.width / 2) + 5) {
                        player.x = ((gameProperties.screenWidth / 2) + (player.width / 2) + 5);
                    } else if (player.x > gameProperties.screenWidth - player.width) {
                        player.x = (gameProperties.screenWidth - player.width);
                    }
                }
                if (player.y < player.height / 2) {
                    player.y = (player.height / 2);
                } else if (player.y > gameProperties.screenHeight - (player.height / 2)) {
                    player.y = (gameProperties.screenHeight - (player.height / 2));
                }

            }

            // Disc and border
            if (this.disc.y - this.disc.radius <= 0) {
                this.disc.reverseVelocityY();
                this.disc.setY(this.disc.radius);
            } else if (this.disc.y + this.disc.radius >= gameProperties.screenHeight) {
                this.disc.reverseVelocityY();
                this.disc.setY(gameProperties.screenHeight - this.disc.radius);
            }

            const point_set = this.checkPoint();

            if (this.setRight >= 2 || this.setLeft >= 2) {
                const player_id = this.setRight >= gameProperties.scoreToWin ? this.players_room[1].id: this.players_room[0].id;
                this.endGame(player_id);
            } else if (point_set) {
                const start_side = this.disc.x > gameProperties.screenWidth / 2 ? 'left' : 'right';
                this.start(start_side);
            }
        }

        const toUpdate = {
            players: [],
            disc: []
        };

        // Send new values to clients
        this.players_room.forEach(function (player) {
            toUpdate.players.push({id: player.id, x: player.x, y: player.y, powerGauge: player.powerGauge})
        });
        toUpdate.disc.push({x: this.disc.x, y: this.disc.y, z: this.disc.z});
        this.socket_users.forEach(function (socket) {
            socket.emit('update', toUpdate);
        });

        // If disc is in lob, send target
        if (this.disc.z > 1) {
            const next_disc_pos = this.disc.getNextPos(45);
            if (next_disc_pos.y <= this.disc.radius) {
                next_disc_pos.y = this.disc.radius;
            } else if (next_disc_pos.y + this.disc.radius >= gameProperties.screenHeight) {
                next_disc_pos.y = gameProperties.screenHeight - this.disc.radius;
            }
            this.socket_users.forEach(function (socket) {
                socket.emit('next pos disc', {x: next_disc_pos.x, y: next_disc_pos.y});
            });
        }

        if (dif_time > 34) {
            this.lastUpdate = time;
        }

        this.updating = false;
    }
};
/**
 * Update score and check if the game is end.
 * If not, replace the disc with new values.
 * @returns {boolean} - True if point set.
 */
Room.prototype.checkPoint = function () {

    if (this.disc.x < 0 || this.disc.x > gameProperties.screenWidth || this.disc.z < 0.1) {

        //console.log("disc x: " + this.disc.x + " disc z:  " + this.disc.z);
        if (this.disc.x > gameProperties.screenWidth / 2) {
            this.scoreLeft++;
        } else {
            this.scoreRight++;
        }

        // Check set
        if (this.scoreLeft >= gameProperties.scoreToWinSet || this.scoreRight >= gameProperties.scoreToWinSet) {
            if (this.scoreLeft >= gameProperties.scoreToWinSet)
                this.setLeft++;
            else
                this.setRight++;

            this.scoreLeft = 0;
            this.scoreRight = 0;

            for (let i_socket = 0; i_socket < this.socket_users.length; i_socket++) {
                let socket = this.socket_users[i_socket];
                socket.emit('update set', {left: this.setLeft, right: this.setRight});
            }
            util.log("Set " + this.setLeft + ':' + this.setRight);
        }

        for (let i_socket = 0; i_socket < this.socket_users.length; i_socket++) {
            let socket = this.socket_users[i_socket];
            socket.emit('update score', {left: this.scoreLeft, right: this.scoreRight});
        }
        util.log("Score " + this.scoreLeft + ':' + this.scoreRight);
        return true;
    }
    return false;
};
/**
 * Send messages to all users to inform that game is over.
 * @param player_id
 */
Room.prototype.endGame = function (player_id) {
    const message = 'The player ' + player_id + ' win the game !';
    this.socket_users.forEach(function (socket) {
        socket.emit('end game', message);
        let victory = false;
        if(player_id == socket.pseudo) {
            victory = true;
        }
        request.post({
                url:'http://localhost:8081/points', // localhost doesn't work
                form: {
                    name: socket.pseudo,
                    victory: victory,
                    token: this.token
                }
            },
            function(err, httpResponse, body) {
                if(err) {
                    console.log("Can't change user points");
                } else {
                    console.log(body);
                }
            });
    }, this);

    this.players_room = [];
    this.socket_users = [];
    this.disc.pause();
    this.first = Math.floor(Math.random() * 2);
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.lastUpdate = 0;
    this.time_disc_paused = 0;
    this.next_round = false;
    this.updating = false;
    this.started = false;
    this.setLeft = 0;
    this.setRight = 0;
};
/**
 * @type {Room}
 */
module.exports = Room;