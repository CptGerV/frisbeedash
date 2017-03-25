"use strict";
var fs = require('fs');
var util = require('util');
var express = require('express');
var path = require('path');
var helmet = require('helmet');
var session = require('express-session');
var request = require('request');
var shortid = require('shortid');

var Player = require('./Player.js');
var Room = require('./Room.js');

var currentGames = [];
var sockets = [];
var rooms_chat = {};
var token = '';
var favicon = require('serve-favicon');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(8080);
app.use(express.static('public'));
app.use(helmet());

var socketIoJwt = require('socketio-jwt');

function init() {
    util.log('Start server');
    // Connection to authentication server as admin
    request.post(
        {
            url: 'http://localhost:8081/api/login', // localhost doesn't work
            form: {
                username: 'admin',
                password: 'adminadmin',
            }
        },
        function (err, httpResponse, body) {
            if (err) {
                console.log("Can't change user status");
            } else {
                body = JSON.parse(body);
                if (body.success)
                    token = body.token;
            }
        });
    setEventHandlers();
}

function setEventHandlers() {
    // io.on('connection', onSocketConnection);
    io.sockets.on('connection', socketIoJwt.authorize({
            secret: 'ilovescotchyscotch',
            timeout: 15000 // 15 seconds to send the authentication message
        })).on('authenticated', function(socket) {
        //this socket is authenticated, we are good to handle more events from it.
        console.log('hello! ' + socket.decoded_token.name);
        onSocketConnection(socket);
    });
}
function onSocketConnection(client) {
    util.log('client id: ' + client.id);
    console.log('decoded_token');
    console.log(client.decoded_token.name, 'connected');
    client.on('disconnect', onClientDisconnect);
    client.on('new player', onNewPlayer);
    client.on('move player', onMovePlayer);
    client.on('update', onUpdate);
    client.on('duel request', onDuelRequest);
    client.on('response duel', onResponseDuel);
    client.on('concede', onConcede);
    client.on('ping pong', onPing);
    client.on('chat history', onChatHistory);
    client.on('send message', onSendMessage);

    sockets.push(client);
    request.post(
        {
            url: 'http://localhost:8081/connect', // localhost doesn't work
            form: {
                name: client.decoded_token.name,
                online: true,
            }
        },
        function (err, httpResponse, body) {
            if (err) {
                console.log("Can't change user status");
            }
        });

    client.pseudo = client.decoded_token.name;
    client.playing = false;
    client.rooms = [];
}
function onPing() {
    this.emit('pong');
}
function onDuelRequest(data) {
    if (data.pseudo) {
        sockets.forEach(function (socket) {
            if (socket.pseudo == data.pseudo && socket.playing == false) {
                socket.emit('duel request', this.pseudo);
            }
        }, this);
    }
}
function onResponseDuel(data) {
    if (data.accept === true) {
        sockets.forEach(function (socket) {
            if (socket.pseudo == this.pseudo && socket.playing == false) {
                console.log('pseudo: ' + this.pseudo);
                // New game
                onNewPlayer.call(socket, {ia: false, pseudo: socket.pseudo});
            }
        }, data);
        onNewPlayer.call(this, {ia: false, pseudo: this.pseudo});
    } else {
        sockets.some(function (socket) {
            if (socket.pseudo == data.pseudo && socket.playing == false) {
                socket.emit('response duel', {success: false});
                return true;
            }
        });
    }
}
function onClientDisconnect() {
    util.log('Player has disconnected: ' + this.id);
    for (let i = 0; i < sockets.length; i++) {
        if (this.id == sockets[i].id) {
            delete sockets.splice(i, 1);
            break;
        }
    }

    request.post(
        {
            url: 'http://localhost:8081/connect', // localhost doesn't work
            form: {
                name: this.decoded_token.name,
                online: false,
            }
        },
        function (err, httpResponse, body) {
            if (err) {
                console.log("Can't change user status");
            }
        });

    if (typeof (this.id_game) != 'undefined') {
        currentGames[this.id_game].removeUser(this);
    }
}
function onNewPlayer(data) {
    console.log('new player');
    // console.log(data);
    let found = false;
    let id_game = 0;

    // If no room doesn't exist
    if (currentGames.length != 0) {
        // Search if room with free place exist and put in player
        currentGames.some(function (room, index) {
            if (typeof(room) != 'undefined') {
                if (room.players_room.length == 1) {
                    this.emit('prepare');
                    id_game = index;
                    this.id_game = index;
                    room.addUser(this);
                    found = true;
                    if (typeof(data.ia) != 'undefined' && data.ia == true) {
                        room.addUser({pseudo: 'IA'});
                    }
                    return true;
                }
            }
        }, this);

        if(!found) {
            // Search if room with free place exist and put in player
            currentGames.some(function (room, index) {
                if (typeof(room) != 'undefined') {
                    if (!room.isFull()) {
                        this.emit('prepare');
                        id_game = index;
                        this.id_game = index;
                        room.addUser(this);
                        found = true;
                        if (typeof(data.ia) != 'undefined' && data.ia == true) {
                            room.addUser({pseudo: 'IA'});
                        }
                        return true;
                    }
                }
            }, this);
        }
    }

    // If no one room found with free place
    if (!found) {
        //  Create room and put player
        let room = new Room(2, token);
        currentGames.push(room);
        id_game = currentGames.length - 1;
        this.id_game = id_game;
        this.emit('prepare');
        room.addUser(this);
        if (typeof(data.ia) != 'undefined' && data.ia == true) {
            room.addUser({pseudo: 'IA'});
        }

    }

    if (currentGames[id_game].isFull()) {
        currentGames[id_game].start();
    }
}
function onConcede() {
    util.log('Player has concede: ' + this.id);
    if (typeof (this.id_game) != 'undefined') {
        currentGames[this.id_game].removeUser(this.pseudo);
    }
}
// Player has moved
function onMovePlayer(data) {
    let currentGame = currentGames[this.id_game];

    // Get player's information
    if (typeof(currentGame) != 'undefined') {
        let player = currentGame.getPlayerById(this.pseudo);

        if (typeof(player) != 'undefined')
            player.updateCmd(data);
    }
}
function onUpdate() {
    // Get information on the current game
    let currentGame = currentGames[this.id_game];
    if (typeof(currentGame) == 'undefined') {
        this.emit('end game', "This game does not exist");
        return;
    }
    currentGame.update();
}
function onChatHistory(user_id) {
    if (typeof(this.rooms[user_id]) == 'undefined') {
        // Search for history, not persistent
        let data = { user_id: user_id, me: this.pseudo, socket: this };
        sockets.forEach(function (socket) {
            // Search if user connected
            if (socket.pseudo == this.user_id) {
                // Check if he sends message before we are connected
                if(typeof(socket.rooms[this.me]) != 'undefined') {
                    // If a chat already exist, get his uid
                    this.socket.rooms[this.user_id] = socket.rooms[this.me];
                } else {
                    // Else generate it
                    let uid = shortid.generate(); // Generate uid
                    this.socket.rooms[user_id] = uid;
                    socket.rooms[this.me] = uid;
                    rooms_chat[uid] = [];
                }
            }
        }, data);
    }
    // Get id room chat
    let rooms_id = this.rooms[user_id];
    let ret = [];
    if(rooms_id != null)
        ret = rooms_chat[rooms_id];
    // Send history chat
    this.emit('update chat', ret);
}
function onSendMessage(data) {
    // If no chat has been opened
    if (typeof(this.rooms[data.user_id]) == 'undefined') {
        // Generate chat's uid
        let uid = shortid.generate();
        this.rooms[data.user_id] = uid; // Generate uid
        rooms_chat[uid] = [];
        data.shortid = uid;
        data.user2 = this.pseudo;
        sockets.forEach(function (socket) {
            if (socket.pseudo == this.user_id) {
                socket.rooms[this.user2] = this.shortid;
            }
        }, data);
    }
    let rooms_id = this.rooms[data.user_id];
    rooms_chat[rooms_id].push({sendBy: this.pseudo, sendTo: data.user_id, msg: data.msg});
    this.emit('new msg', {sendBy: this.pseudo, sendTo: data.user_id, msg: data.msg});
    data.pseudo = this.pseudo;
    sockets.forEach(function (socket) {
        if (socket.pseudo == this.user_id) {
            socket.emit('new msg', {sendBy: this.pseudo, sendTo: this.user_id, msg: this.msg});
        }
    }, data);
}
init();

module.exports = app;