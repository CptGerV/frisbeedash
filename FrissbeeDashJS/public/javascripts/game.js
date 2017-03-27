"use strict";
/**************************************************
 ** GAME VARIABLES
 **************************************************/
let remotePlayers,	// Remote players
    gameStarted,
    localDiscs = [],
    time,
    sprite_field,
    sprite_field_up,
    sprite_target,
    sprite_referee,
    sprite_prompt,
    sprite_explosion,
    sprite_pick,
    sprite_ready,
    sprite_go,
    sprite_headband,
    sprite_arrow_hb,
    sound_swish,
    sound_rlaunch,
    text_info,
    messages,
    text_setScores,
    text_scores,
    text_pseudo_left,
    text_pseudo_right,
    text_ping,
    game,
    btn_join,
    btn_play_ia,
    first = true,
    time_set_score = 0,
    barblack_left,
    barblack_right,
    bb_width_full,
    pbleft_empty,
    pbleft_tiers,
    pbleft_mid,
    pbleft_full,
    pbright_empty,
    pbright_tiers,
    pbright_mid,
    pbright_full,
    keys_enable = false,
    inputs = {},
    pad = null,
    buttonA,
    buttonB,
    buttonX,
    buttonDPadLeft,
    buttonDPadRight,
    buttonDPadUp,
    buttonDPadDown,
    btn_logout,
    btn_options,
    btn_del_account,
    btn_leave,
    btn_sound_on,
    btn_sound_mute,
    searchingGame,
    btn_help;

// ratio resize
let resize_ratio_x = 1;
let resize_ratio_y = 1;

// field ratio
let ratio_field = 1280 / 720;

// canvas size
let canvas_height = window.innerHeight;

let properties = {};
let field_marge_left = properties.width * 0.15;
let field_border_right = 0;
let field_marge_top = 0;
let field_border_bot = 0;

let game_server = "localhost";
let auth_server = "localhost";

/**
 * @brief valeurs actualisées lors du resizing
 */
function values_for_resize() {
    // size calculation
    let temp_h = window.innerWidth / ratio_field;
    let temp_w = window.innerHeight * ratio_field;
    let canvas_width = window.innerWidth;
    canvas_height = window.innerHeight;

    if (window.innerWidth > window.innerHeight && window.innerHeight >= 600) {
        if (temp_w <= window.innerWidth) {
            // si la largeur max ateignable rentre dans la largeur de la fenêtre
            // on prend la largeur max
            canvas_width = temp_w;
            canvas_height = window.innerHeight;
            //sinon, si la hauteur max rentre
        } else if (temp_h <= window.innerHeight) {
            // on prend la hauteur max
            canvas_height = temp_h;
            canvas_width = window.innerWidth;
        }
    } else {
        canvas_height = 600;
        canvas_width = 800;
    }

    properties = {
        width: canvas_width,
        height: canvas_height,
        field_width: canvas_width,
        field_height: canvas_width / ratio_field,
        field_ratio: ratio_field,
    };

    // console.log(properties);
}
values_for_resize();

/**********
 *  PING MEASUREMENT
 */
let pingTime;
let ping;

/**************************************************
 ** GAME INITIALISATION
 **************************************************/
function init() {
    console.log('Start client');

    // Initialise remote players array
    remotePlayers = [];

    gameStarted = false;
    searchingGame = false;
    messages = [];
    time = 0;
}

/**************************************************
 ** GAME EVENT HANDLERS
 **************************************************/
game = new Phaser.Game(properties.width, properties.height, Phaser.AUTO, '', {
    preload: preload,
    create: create,
    update: update
});

function preload() {
    game.load.baseURL = "http://" + game_server + ":8080/assets/";
    game.load.crossOrigin = 'anonymous';

    game.load.image('field', 'field.png');
    game.load.image('field_up', 'field_up.png');
    game.load.image('disc_trail', 'disc_shadow.png');
    game.load.image('prompt', 'prompt.png');
    game.load.image('headband', 'headband.png');
    game.load.image('arrow_hb', 'arrow_headband.png');
    game.load.image('go', 'text_go.png');
    game.load.image('ready', 'text_ready.png');

    game.load.spritesheet('disc', 'disc.png', 40, 40, 4);
    game.load.spritesheet('btn_join', 'buttons/btn_join.png', 372, 84);
    game.load.spritesheet('btn_play', 'buttons/btn_play.png', 372, 84);
    game.load.spritesheet('target', 'target.png', 50, 50);
    game.load.spritesheet('character', 'perso.png', 160, 160);
    game.load.spritesheet('explosion', 'petite_explo_rampx2.png', 200, 200);
    game.load.spritesheet('pick_effect', 'Effet_Pick.png', 80, 73);
    game.load.spritesheet('referee', 'referee.png', 160, 160);

    //options menu buttons
    game.load.spritesheet('button_del_account', "buttons/button_del_account.png", 372 / 2, 42);
    game.load.spritesheet('button_leave', "buttons/button_leave.png", 372 / 2, 42);
    game.load.spritesheet('button_logout', "buttons/button_logout.png", 372 / 2, 42);
    game.load.spritesheet('button_options', "buttons/button_options.png", 372 / 2, 42);
    game.load.spritesheet('button_sound_on', "buttons/button_sound_on.png", 372 / 2, 42);
    game.load.spritesheet('button_sound_off', "buttons/button_sound_off.png", 372 / 2, 42);

    //power bars
    game.load.spritesheet('pow_left_empty', "powerBar_left_empty.png", 400, 168);
    game.load.spritesheet('pow_left_tiers', "powerBar_left_tiers.png", 400, 168);
    game.load.spritesheet('pow_left_mid', "powerBar_left_mid.png", 400, 168);
    game.load.spritesheet('pow_left_full', "powerBar_left_full.png", 400, 168);
    game.load.spritesheet('pow_right_empty', "powerBar_right_empty.png", 400, 168);
    game.load.spritesheet('pow_right_tiers', "powerBar_right_tiers.png", 400, 168);
    game.load.spritesheet('pow_right_mid', "powerBar_right_mid.png", 400, 168);
    game.load.spritesheet('pow_right_full', "powerBar_right_full.png", 400, 168);
    game.load.spritesheet('blackbar', "black_bar.png", 227, 32);

    //how to play/help
    game.load.spritesheet('btn_help', "buttons/help-icon.png", 128, 128);

    game.load.bitmapFont('carrier_command', 'fonts/bitmapFonts/carrier_command.png', 'fonts/bitmapFonts/carrier_command.xml');

    game.load.audio('swish', 'audio/soundEffects/swish_2.wav');
    game.load.audio('rlaunch', 'audio/soundEffects/launches/rlaunch.wav');

    init();
}
function create() {
    // Graphics
    game.stage.backgroundColor = '#05258D';

    // Field
    sprite_field = game.add.sprite(0, properties.field_height * 0.071, 'field');
    sprite_field.height = properties.field_height - (properties.field_height * 0.071);

    field_marge_top = (properties.field_height * 0.071) + (129 / 7.2 / 100 * sprite_field.height);
    field_border_bot = sprite_field.y + (623 / 7.2 / 100 * sprite_field.height);

    sprite_field.width = sprite_field.height * ratio_field;
    sprite_field.anchor.set(0.5, 0);
    sprite_field.x = game.world.centerX;

    field_marge_left = (sprite_field.width * 0.15) + (game.world.centerX - (sprite_field.width / 2));
    field_border_right = (game.world.centerX + (sprite_field.width / 2)) - (sprite_field.width * 0.15);

    resize_ratio_x = sprite_field.width / 1280;
    resize_ratio_y = sprite_field.height / 750;

    // Explosion
    sprite_explosion = game.add.sprite(0, 0, 'explosion');
    sprite_explosion.scale.set(resize_ratio_x, resize_ratio_y);
    sprite_explosion.anchor.set(0.5, 0.5);
    sprite_explosion.visible = false;
    let anim = sprite_explosion.animations.add('explosion', [0, 1, 2, 3, 4, 5, 6], 16, false);
    anim.onComplete.add(explosionComplete, this);

    sprite_pick = game.add.sprite(0, 0, 'pick_effect');
    sprite_pick.scale.set(resize_ratio_x, resize_ratio_y);
    sprite_pick.anchor.set(0.5, 0.5);
    sprite_pick.visible = false;
    let anim_pick = sprite_pick.animations.add('pick_effect_anim', [0, 1, 2, 3, 4, 5, 6], 16, false);
    anim_pick.onComplete.add(function() {
        sprite_pick.visible = false;
    }, this);

    // Prompt
    sprite_prompt = game.add.sprite(0, 0, 'prompt');
    sprite_prompt.scale.set(resize_ratio_x, resize_ratio_y);
    sprite_prompt.x = game.world.centerX - sprite_prompt.width / 2;

    text_scores = game.add.bitmapText(0, 0, 'carrier_command', '', 34);
    text_scores.y = sprite_prompt.y + sprite_prompt.height / 2;
    text_scores.scale.set(resize_ratio_x, resize_ratio_y);

    text_setScores = game.add.bitmapText(0, 0, 'carrier_command', '', 34);
    text_setScores.anchor.set(0.5, 0.5);
    text_setScores.x = game.world.centerX;
    text_setScores.y = game.world.centerY;
    text_setScores.scale.set(resize_ratio_x, resize_ratio_y);
    text_setScores.visible = false;

    // Disk's target
    sprite_target = game.add.sprite(0, 0, 'target');
    sprite_target.animations.add('active');
    sprite_target.scale.set(resize_ratio_x, resize_ratio_y);
    sprite_target.visible = false;

    // Field upper part
    sprite_field_up = game.add.sprite(0, properties.field_height * 0.071, 'field_up');
    sprite_field_up.height = properties.field_height - (properties.field_height * 0.071);

    sprite_field_up.width = sprite_field.height * ratio_field;
    sprite_field_up.anchor.set(0.5, 0);
    sprite_field_up.x = game.world.centerX;

    // Disc
    let disc = new Disc(-50, -50, resize_ratio_x, resize_ratio_y, 10, game);
    localDiscs.push(disc);

    // Referee
    sprite_referee = game.add.sprite(game.world.centerX, 0, 'referee');
    sprite_referee.anchor.set(0.5, 0.5);
    sprite_referee.scale.set(resize_ratio_x, resize_ratio_y);
    sprite_referee.y = sprite_field.bottom - sprite_referee.height / 2;
    sprite_referee.animations.add('left', [0], 1, true);
    sprite_referee.animations.add('right', [1], 1, true);

    // Powers bar
    pbleft_empty = game.add.sprite(0, sprite_field.y + sprite_field.height, 'pow_left_empty');
    pbleft_empty.scale.set(resize_ratio_x, resize_ratio_y);
    pbleft_empty.y -= pbleft_empty.height;
    pbleft_empty.x = sprite_referee.x - (sprite_referee.width / 2 + pbleft_empty.width);
    pbleft_empty.visible = false;
    pbleft_tiers = game.add.sprite(0, sprite_field.y + sprite_field.height, 'pow_left_tiers');
    pbleft_tiers.scale.set(resize_ratio_x, resize_ratio_y);
    pbleft_tiers.y -= pbleft_tiers.height;
    pbleft_tiers.x = sprite_referee.x - (sprite_referee.width / 2 + pbleft_tiers.width);
    pbleft_tiers.visible = false;
    pbleft_mid = game.add.sprite(0, sprite_field.y + sprite_field.height, 'pow_left_mid');
    pbleft_mid.scale.set(resize_ratio_x, resize_ratio_y);
    pbleft_mid.y -= pbleft_mid.height;
    pbleft_mid.x = sprite_referee.x - (sprite_referee.width / 2 + pbleft_mid.width);
    pbleft_mid.visible = false;
    pbleft_full = game.add.sprite(0, sprite_field.y + sprite_field.height, 'pow_left_full');
    pbleft_full.scale.set(resize_ratio_x, resize_ratio_y);
    pbleft_full.y -= pbleft_full.height;
    pbleft_full.x = sprite_referee.x - (sprite_referee.width / 2 + pbleft_full.width);
    pbleft_full.visible = false;

    barblack_left = game.add.sprite(pbleft_empty.x, pbleft_empty.y, 'blackbar');
    barblack_left.scale.set(resize_ratio_x, resize_ratio_y);
    barblack_left.x = pbleft_empty.x + 88 * resize_ratio_x;
    barblack_left.y = pbleft_empty.y + 69 * resize_ratio_y;
    bb_width_full = barblack_left.width;
    barblack_left.visible = false;

    pbright_empty = game.add.sprite(game.world.width, sprite_field.y + sprite_field.height, 'pow_right_empty');
    pbright_empty.scale.set(resize_ratio_x, resize_ratio_y);
    pbright_empty.y -= pbright_empty.height;
    pbright_empty.x = sprite_referee.x + (sprite_referee.width / 2);
    pbright_empty.visible = false;
    pbright_tiers = game.add.sprite(0, sprite_field.y + sprite_field.height, 'pow_right_tiers');
    pbright_tiers.scale.set(resize_ratio_x, resize_ratio_y);
    pbright_tiers.y -= pbright_tiers.height;
    pbright_tiers.x = sprite_referee.x + (sprite_referee.width / 2);
    pbright_tiers.visible = false;
    pbright_mid = game.add.sprite(0, sprite_field.y + sprite_field.height, 'pow_right_mid');
    pbright_mid.scale.set(resize_ratio_x, resize_ratio_y);
    pbright_mid.y -= pbright_mid.height;
    pbright_mid.x = sprite_referee.x + (sprite_referee.width / 2);
    pbright_mid.visible = false;
    pbright_full = game.add.sprite(0, sprite_field.y + sprite_field.height, 'pow_right_full');
    pbright_full.scale.set(resize_ratio_x, resize_ratio_y);
    pbright_full.y -= pbright_full.height;
    pbright_full.x = sprite_referee.x + (sprite_referee.width / 2);
    pbright_full.visible = false;

    barblack_right = game.add.sprite(pbright_empty.x, pbright_empty.y, 'blackbar');
    barblack_right.scale.set(resize_ratio_x, resize_ratio_y);
    barblack_right.x = pbright_empty.x + 84 * resize_ratio_x;
    barblack_right.y = pbright_empty.y + 69 * resize_ratio_y;
    barblack_right.visible = false;

    //helping button
    btn_help = game.add.button(game.world.width, game.world.height, 'btn_help', helpingMode,this);
    btn_help.scale.set(resize_ratio_x / 2, resize_ratio_y / 2);
    btn_help.x = game.world.width - btn_help.width;
    btn_help.y = game.world.height - btn_help.height;

    // Headband
    sprite_headband = game.add.sprite(game.world.centerX, 0, 'headband');
    sprite_arrow_hb = game.add.sprite(0, 0, 'arrow_hb');
    sprite_ready = game.add.sprite(0, game.world.centerY, 'ready');
    sprite_ready.anchor.set(0.5, 0.5);
    sprite_headband.scale.set(resize_ratio_x, resize_ratio_y);
    sprite_headband.x -= sprite_headband.width / 2;
    sprite_headband.y = game.world.centerY - sprite_headband.height / 2;
    sprite_ready.scale.set(resize_ratio_x, resize_ratio_y);
    sprite_ready.x = game.world.centerX;
    sprite_ready.y = game.world.centerY;
    sprite_arrow_hb.scale.set(resize_ratio_x, resize_ratio_y);
    sprite_arrow_hb.x = game.world.centerX + game.world.width / 4;
    sprite_arrow_hb.y = game.world.centerY - sprite_headband.height / 2.3;//<= the 2.3 is a manual scaling ratio

    sprite_go = game.add.sprite(0, 0, 'go');
    sprite_go.anchor.set(0.5, 0.5);
    sprite_go.scale.set(resize_ratio_x, resize_ratio_y);
    sprite_go.x = game.world.centerX;
    sprite_go.y = game.world.centerY;

    sprite_headband.alpha = 0;
    sprite_arrow_hb.alpha = 0;
    sprite_ready.alpha = 0;
    sprite_go.alpha = 0;

    // Buttons
    btn_join = game.add.button(game.world.centerX, game.world.height / 3, 'btn_join', joinGame, this, 1, 0, 0, 0);
    btn_join.scale.set(resize_ratio_x, resize_ratio_y);
    btn_join.x = game.world.centerX - btn_join.width / 2;
    btn_join.y = canvas_height / 3;

    btn_play_ia = game.add.button(game.world.centerX, 1.5 * btn_join.height + game.world.height / 3, 'btn_play', playVsIA, this, 1, 0, 0, 0);
    btn_play_ia.scale.set(resize_ratio_x, resize_ratio_y);
    btn_play_ia.x = game.world.centerX - btn_play_ia.width / 2;
    btn_play_ia.y = btn_join.y + btn_join.height * 2;

    // Buttons Menu
    // btn_menu = game.add.button(game.world.width, 0, 'button_menu', showMenu, this, 1, 0, 1, 1);
    btn_options = game.add.button(game.world.width, 0, 'button_options', showMenu, this, 1, 0, 1, 1);
    btn_options.scale.set(resize_ratio_x, resize_ratio_y);
    btn_options.x = game.world.width - btn_options.width;

    btn_logout = game.add.button(game.world.width, btn_options.y + btn_options.height * 1.2, 'button_logout', logout, this, 1, 0, 1, 1);
    btn_logout.scale.set(resize_ratio_x, resize_ratio_y);
    btn_logout.x = game.world.width - btn_logout.width;
    btn_logout.visible = false;

    btn_sound_on = game.add.button(game.world.width, btn_logout.y + btn_logout.height * 1.2, 'button_sound_on', offSound, this, 1, 0, 1, 1);
    btn_sound_on.scale.set(resize_ratio_x, resize_ratio_y);
    btn_sound_on.x = game.world.width - btn_sound_on.width;
    btn_sound_on.visible = false;

    btn_sound_mute = game.add.button(game.world.width, btn_logout.y + btn_logout.height * 1.2, 'button_sound_off', onSound, this, 1, 0, 1, 1);
    btn_sound_mute.scale.set(resize_ratio_x, resize_ratio_y);
    btn_sound_mute.x = game.world.width - btn_sound_mute.width;
    btn_sound_mute.visible = false;

    btn_del_account = game.add.button(game.world.width, btn_sound_mute.y + btn_sound_mute.height * 1.2, 'button_del_account', delAccount, this, 1, 0, 1, 1);
    btn_del_account.scale.set(resize_ratio_x, resize_ratio_y);
    btn_del_account.x = game.world.width - btn_del_account.width;
    btn_del_account.visible = false;

    btn_leave = game.add.button(game.world.width, btn_del_account.y + btn_del_account.height * 1.2, 'button_leave', leave, this, 1, 0, 1, 1);
    btn_leave.scale.set(resize_ratio_x, resize_ratio_y);
    btn_leave.x = game.world.width - btn_leave.width;
    btn_leave.visible = false;

    text_info = game.add.bitmapText(game.world.centerX, btn_play_ia.y + btn_play_ia.height + 30, 'carrier_command', '', 32 * resize_ratio_x);

    let style = {font: (48*resize_ratio_x) + "px Arial", fill: "#ffffff", align: "center"};
    text_pseudo_right = game.add.text(0, game.world.height * (1 / 32), '', style);
    text_pseudo_right.scale.set(resize_ratio_x, resize_ratio_y);
    text_pseudo_left = game.add.text(0, game.world.height * (1 / 32), '', style);
    text_pseudo_left.scale.set(resize_ratio_x, resize_ratio_y);

    style.font = (24*resize_ratio_x) + "px Arial";
    text_ping = game.add.text(5, 5, '', style);
    text_ping.scale.set(resize_ratio_x, resize_ratio_y);

    // Sounds
    sound_swish = game.add.audio('swish');
    sound_rlaunch = game.add.audio('rlaunch');

    //*********
    //* Inputs
    //*********
    // Keyboard
    let keys = [
        [Phaser.Keyboard.UP, 'up'],
        [Phaser.Keyboard.DOWN, 'down'],
        [Phaser.Keyboard.LEFT, 'left'],
        [Phaser.Keyboard.RIGHT, 'right'],
        [Phaser.Keyboard.D, '1'],
        [Phaser.Keyboard.S, '2'],
        [Phaser.Keyboard.Q, '3']
    ];

    keys.forEach(function (input_key) {
        let key = game.input.keyboard.addKey(input_key[0]);
        key.onDown.add(sendCommand, key);
        key.onUp.add(sendCommand, key);
        inputs[input_key[1]] = key;
    }, this);

    // Gamepad
    game.input.gamepad.start();
    pad = game.input.gamepad.pad1;
    pad.addCallbacks(this, {onConnect: addButtons});
}
function addButtons() {
//  We can't do this until we know that the gamepad has been connected and is started

    buttonA = pad.getButton(Phaser.Gamepad.XBOX360_A);
    buttonB = pad.getButton(Phaser.Gamepad.XBOX360_B);
    buttonX = pad.getButton(Phaser.Gamepad.XBOX360_X);

    buttonA.onDown.add(sendCommandButton, this);
    buttonB.onDown.add(sendCommandButton, this);
    buttonX.onDown.add(sendCommandButton, this);

    buttonA.onUp.add(sendCommandButton, this);
    buttonB.onUp.add(sendCommandButton, this);
    buttonX.onUp.add(sendCommandButton, this);

    //  These won't work in Firefox, sorry! It uses totally different button mappings

    buttonDPadLeft = pad.getButton(Phaser.Gamepad.XBOX360_DPAD_LEFT);
    buttonDPadRight = pad.getButton(Phaser.Gamepad.XBOX360_DPAD_RIGHT);
    buttonDPadUp = pad.getButton(Phaser.Gamepad.XBOX360_DPAD_UP);
    buttonDPadDown = pad.getButton(Phaser.Gamepad.XBOX360_DPAD_DOWN);

    buttonDPadLeft.onDown.add(sendCommandButton, this);
    buttonDPadRight.onDown.add(sendCommandButton, this);
    buttonDPadUp.onDown.add(sendCommandButton, this);
    buttonDPadDown.onDown.add(sendCommandButton, this);

    buttonDPadLeft.onUp.add(sendCommandButton, this);
    buttonDPadRight.onUp.add(sendCommandButton, this);
    buttonDPadUp.onUp.add(sendCommandButton, this);
    buttonDPadDown.onUp.add(sendCommandButton, this);
}
function update() {
    // Update local player and check for change
    if (gameStarted) {
        socket.emit("update");
        if (new Date().getTime() > time_set_score)
            text_setScores.visible = false;
        if (localDiscs[0].x < game.world.centerX) {
            sprite_referee.animations.play('left');
        } else {
            sprite_referee.animations.play('right');
        }

        for (let i = 0; i < remotePlayers.length; i++) {
            if ((i % 2) == 0) {
                // console.log(remotePlayers[i].powerGauge);
                if (remotePlayers[i].powerGauge >= 99) {
                    pbleft_full.visible = true;
                    pbleft_empty.visible = false;
                    pbleft_tiers.visible = false;
                    pbleft_mid.visible = false;
                } else if (remotePlayers[i].powerGauge >= 66) {
                    pbleft_full.visible = false;
                    pbleft_empty.visible = false;
                    pbleft_tiers.visible = false;
                    pbleft_mid.visible = true;
                } else if (remotePlayers[i].powerGauge >= 33) {
                    pbleft_full.visible = false;
                    pbleft_empty.visible = false;
                    pbleft_tiers.visible = true;
                    pbleft_mid.visible = false;
                } else {
                    pbleft_full.visible = false;
                    pbleft_empty.visible = true;
                    pbleft_tiers.visible = false;
                    pbleft_mid.visible = false;
                }

                if (remotePlayers[i].powerGauge / 100 >= 0) {
                    let prec_width = barblack_left.width;
                    barblack_left.width = bb_width_full * (1 - remotePlayers[i].powerGauge / 100);
                    barblack_left.x += prec_width - barblack_left.width;
                }
            } else {
                if (remotePlayers[i].powerGauge >= 90) {
                    pbright_full.visible = true;
                    pbright_empty.visible = false;
                    pbright_tiers.visible = false;
                    pbright_mid.visible = false;
                } else if (remotePlayers[i].powerGauge >= 66) {
                    pbright_full.visible = false;
                    pbright_empty.visible = false;
                    pbright_tiers.visible = false;
                    pbright_mid.visible = true;
                } else if (remotePlayers[i].powerGauge >= 33) {
                    pbright_full.visible = false;
                    pbright_empty.visible = false;
                    pbright_tiers.visible = true;
                    pbright_mid.visible = false;
                } else {
                    pbright_full.visible = false;
                    pbright_empty.visible = true;
                    pbright_tiers.visible = false;
                    pbright_mid.visible = false;
                }

                if (remotePlayers[i].powerGauge / 100 >= 0) {
                    barblack_right.width = bb_width_full * (1 - remotePlayers[i].powerGauge / 100);
                }
            }
        }
        barblack_left.visible = false;
        barblack_left.visible = true;
        barblack_right.visible = false;
        barblack_right.visible = true;
    }
}
function explosionComplete() {
    localDiscs[0].sprite_disc.visible = true;
    sprite_explosion.visible = false;
}
function joinGame() {
    const pseudo = document.getElementById('pseudo').value;
    socket.emit("new player", {ia: false, pseudo: pseudo});
    searchingGame = true;
}
function playVsIA() {
    const pseudo = document.getElementById('pseudo').value;
    socket.emit("new player", {ia: true, pseudo: pseudo});
}
function setEventHandlers() {
    // Socket connection successful
    socket.on("connect", onSocketConnected);

}
function sendCommand() {
    if (keys_enable) {
        let cmd = -1;
        if (this.isDown) {
            // console.log("code : "+this.keyCode);
            if (this.keyCode == Phaser.Keyboard.D)
                cmd = 0;
            if (this.keyCode == Phaser.Keyboard.S)
                cmd = 1;
            if (this.keyCode == Phaser.Keyboard.Q)
                cmd = 2;
        }
        socket.emit(
            "move player",
            {
                'up': inputs.up.isDown,
                'down': inputs.down.isDown,
                'left': inputs.left.isDown,
                'right': inputs.right.isDown,
                'cmd': cmd,
            });
    }
}
function sendCommandButton(button) {
    if (keys_enable) {
        if (game.input.gamepad.supported && game.input.gamepad.active && pad.connected) {
            let cmd = -1;
            if (button.buttonCode === Phaser.Gamepad.XBOX360_A) {
                cmd = 0;
            } else if (button.buttonCode === Phaser.Gamepad.XBOX360_B) {
                cmd = 1;
            } else if (button.buttonCode === Phaser.Gamepad.XBOX360_X) {
                cmd = 2;
            }
            socket.emit(
                "move player",
                {
                    'up': pad.isDown(Phaser.Gamepad.XBOX360_DPAD_UP) || pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) < -0.1,
                    'down': pad.isDown(Phaser.Gamepad.XBOX360_DPAD_DOWN) || pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_Y) > 0.1,
                    'left': pad.isDown(Phaser.Gamepad.XBOX360_DPAD_LEFT) || pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) < -0.1,
                    'right': pad.isDown(Phaser.Gamepad.XBOX360_DPAD_RIGHT) || pad.axis(Phaser.Gamepad.XBOX360_STICK_LEFT_X) > 0.1,
                    'cmd': cmd,
                });
        }
    }
}
function onSocketDisconnect() {
    console.log("Disconnected from socket server");
}
function onNewPlayer(data) {
    console.log("New player connected: " + data.id);
    // Initialise the new player
    let newPlayer;

    if (remotePlayers.length == 0) {
        newPlayer = new Player(0, 0, game, 'left', resize_ratio_x / 1.5, resize_ratio_y / 1.3);
        newPlayer.setPos({x: sprite_field.x - sprite_field.width / 4, y: sprite_field.y + sprite_field.height / 2});

        text_pseudo_left.text = data.id;
        text_pseudo_left.x = sprite_prompt.x / 2 - text_pseudo_left.width / 2;

    } else if (remotePlayers.length == 1) {
        searchingGame = false;
        newPlayer = new Player(0, 0, game, 'right', resize_ratio_x / 1.5, resize_ratio_y / 1.3);
        newPlayer.setPos({x: sprite_field.x + sprite_field.width / 4, y: sprite_field.y + sprite_field.height / 2});

        let left_border_prompt = sprite_prompt.x + sprite_prompt.width;
        text_pseudo_right.text = data.id;
        text_pseudo_right.x = left_border_prompt + ((game.world.width - left_border_prompt) / 2) - (text_pseudo_right.width / 2);

        sprite_field_up.bringToTop();
        localDiscs[0].sprite_disc.bringToTop();
        sprite_pick.bringToTop();

        btn_join.bringToTop();
        btn_play_ia.bringToTop();

        btn_logout.bringToTop();
        btn_options.bringToTop();
        btn_del_account.bringToTop();
        btn_leave.bringToTop();
        btn_sound_on.bringToTop();
        btn_sound_mute.bringToTop();

        pbleft_empty.bringToTop();
        pbleft_tiers.bringToTop();
        pbleft_mid.bringToTop();
        pbleft_full.bringToTop();
        barblack_left.bringToTop();
        pbright_empty.bringToTop();
        pbright_tiers.bringToTop();
        pbright_mid.bringToTop();
        pbright_full.bringToTop();
        barblack_right.bringToTop();

        sprite_headband.bringToTop();
        sprite_arrow_hb.bringToTop();
        sprite_ready.bringToTop();
        sprite_go.bringToTop();
        sprite_referee.bringToTop();
    } else {
        return;
    }

    newPlayer.id = data.id;
    newPlayer.sprites.animations.play('idle');

    // Add new player to the remote players array
    remotePlayers.push(newPlayer);
}
function onRemovePlayer(data) {
    console.log("Remove player: " + data.id);
    let removePlayer = playerById(data.id);

    // Player not found
    if (!removePlayer) {
        console.log("Player not found: " + data.id);
        return;
    }

    removePlayer.sprites.destroy();

    // Remove player from array
    remotePlayers.splice(remotePlayers.indexOf(removePlayer), 1);
}
function onPrepare() {
    console.log("Prepare");
    text_scores.text = '0    0';
    text_scores.x = game.world.centerX - text_scores.width / 2;
    btn_join.visible = false;
    btn_play_ia.visible = false;
    text_pseudo_left.text = "Waiting player";
    text_pseudo_left.x = sprite_prompt.x / 2 - text_pseudo_left.width / 2;
    text_pseudo_right.text = "Waiting player";
    text_pseudo_right.x = (game.world.width * 3 / 4) - (text_pseudo_right.width / 4);
}
function onStartGame() {
    sprite_headband.alpha = 0;
    console.log("start game");
    text_info.visible = false;
    keys_enable = true;
    gameStarted = true;

    localDiscs[0].sprite_disc.visible = true;
    localDiscs[0].sprite_disc.alpha = 1;

    if (text_setScores.visible) {
        text_setScores.y = game.world.centerY - sprite_headband.height;
    }

    sprite_headband.alpha = 1;

    // Animation Ready -> Go
    // Position start
    sprite_ready.x = -sprite_ready.width;
    sprite_ready.alpha = 1;
    sprite_go.x = game.world.centerX;
    sprite_go.scale.set(3.0, 3.0);

    let arhbx = sprite_arrow_hb.x;
    // sprite_arrow_hb.x = game.world.width;

    // Tweens
    let tween_ready_1 = game.add.tween(sprite_ready).to({ x: game.world.centerX }, 1000, Phaser.Easing.Linear.None, false);
    let tween_ready_2 = game.add.tween(sprite_ready).to({}, 700, Phaser.Easing.Linear.None, false);
    let tween_go_1 = game.add.tween(sprite_go.scale).to({x: 1.0, y: 1.0}, 300, Phaser.Easing.Linear.None, false);
    let tween_go_2 = game.add.tween(sprite_go).to({}, 750, Phaser.Easing.Linear.None, false);
    let tarrow = game.add.tween(sprite_arrow_hb).to({ alpha: 1, x: game.world.width }, 750, Phaser.Easing.Linear.None, false);

    tween_go_1.onStart.add(function () {
        tarrow.start();
        sprite_ready.alpha = 0;
        game.add.tween(sprite_go).to({alpha: 1}, 500, Phaser.Easing.Linear.None, true);
    });

    tween_go_2.onComplete.add(function () {
        sprite_headband.alpha = 0;
        sprite_arrow_hb.x = arhbx;
        sprite_go.alpha = 0;
        sprite_arrow_hb.alpha = 0;
    });

    tween_ready_1.chain(tween_ready_2);
    tween_ready_2.chain(tween_go_1);
    tween_go_1.chain(tween_go_2);
    tween_ready_1.start();
}
function onEndGame(data) {
    console.log('end game');
    gameStarted = false;
    keys_enable = false;

    // Remove players from array
    for (let i = 0; i < remotePlayers.length; i++) {
        remotePlayers[i].sprites.destroy();
    }
    remotePlayers = [];

    localDiscs[0].sprite_disc.visible = false;
    localDiscs[0].sprite_disc.animations.stop();
    localDiscs[0].trail.visible = false;
    sprite_target.visible = false;

    text_info.text = 'Game over';
    if (typeof(data) == 'string')
        text_info.text = data;

    text_info.visible = true;
    // Center text info
    text_info.x = game.world.centerX - text_info.width / 2;
    text_setScores.visible = false;

    btn_join.visible = true;
    btn_play_ia.visible = true;
}
function onUpdateScore(newScores) {
    console.log('update score');
    text_scores.text = newScores.left + '    ' + newScores.right;
    text_scores.x = game.world.centerX - text_scores.width / 2;

    sprite_explosion.visible = true;
    sprite_explosion.x = localDiscs[0].x;
    sprite_explosion.y = localDiscs[0].y;
    localDiscs[0].sprite_disc.visible = false;
    sprite_explosion.animations.play('explosion');
    sound_rlaunch.play();
}
function onNextPosDisc(nextPosDisc) {
    let ratio_x = (field_border_right - field_marge_left) / 640;
    let ratio_y = (field_border_bot - field_marge_top) / 360;
    sprite_target.x = (nextPosDisc.x * ratio_x) + field_marge_left;
    sprite_target.y = (nextPosDisc.y * ratio_y) + field_marge_top;
}
function onPerfectThrow(data) {
    console.log('perfect throw: ' + data.id);
    let player = playerById(data.id);

    sprite_pick.visible = true;
    if(player.side == 'right')
        sprite_pick.x = player.x - player.sprites.width / 4;
    else
        sprite_pick.x = player.x + player.sprites.width / 4;

    sprite_pick.y = player.y;
    sprite_pick.animations.play('pick_effect_anim');
}
function onUpdate(data_u) {
    // data : { players: [{id, x, y}], disc: [{x, y, z}] }
    // console.log(data.players[0]);
    let players = data_u.players;
    let discs = data_u.disc;
    let ratio_x = (field_border_right - field_marge_left) / 640;
    let ratio_y = (field_border_bot - field_marge_top) / 360;

    discs.forEach(function (disc) {
        localDiscs.forEach(function (localDisc) {

            remotePlayers.forEach(function (localPlayer) {
                players.forEach(function (remotePlayer) {
                    if (disc.z == 1
                        && localPlayer.id == remotePlayer.id
                        && (localDisc.x == localPlayer.x && localDisc.y == localPlayer.y)
                        && ( (disc.x != remotePlayer.x) || ( disc.y != remotePlayer.y) )) {
                        localPlayer.throw();
                        sound_swish.play();
                    }
                });
            });

            disc.x *= ratio_x;
            disc.x += field_marge_left;
            disc.y *= ratio_y;
            disc.y += field_marge_top;

            localDisc.setPos(disc);

            if (localDisc.z > 1) {
                sprite_target.visible = true;
                localDisc.trail.visible = false;
                sprite_target.animations.play('active', 16, true);
            } else {
                sprite_target.animations.stop('active');
                sprite_target.visible = false;
                localDisc.trail.visible = true;
            }
        });
    });

    players.forEach(function (remotePlayer) {
        remotePlayers.forEach(function (localPlayer) {
            if (remotePlayer.id == localPlayer.id) {

                remotePlayer.x *= ratio_x;
                remotePlayer.x += field_marge_left;

                remotePlayer.y *= ratio_y;
                remotePlayer.y += field_marge_top;

                localPlayer.setPos(remotePlayer);
                localPlayer.powerGauge = remotePlayer.powerGauge;
            }
        });
    });
}
function onUpdateSet(data) {
    console.log('update set');
    text_setScores.text = ' Set\n' + data.left + ' : ' + data.right;
    text_setScores.visible = true;
    time_set_score = new Date().getTime() + 2000;
}
function onDuelRequest(pseudo) {
    let input_grp_btn = $('#list_item_' + pseudo)
        .find('.input-group')
        .find('.input-group-btn');

    input_grp_btn.find('#accept_duel_' + pseudo)
        .fadeIn('slow')
        .click(function () {
            socket.emit('response duel', {accept: true, pseudo: pseudo});
            $('#accept_duel_' + pseudo).fadeOut();
            $('#refuse_duel_' + pseudo).fadeOut();
        });

    input_grp_btn.find('#refuse_duel_' + pseudo)
        .fadeIn('slow')
        .click(function () {
            socket.emit('response duel', {accept: false, pseudo: pseudo});
            $('#accept_duel_' + pseudo).fadeOut();
            $('#refuse_duel_' + pseudo).fadeOut();
        });
}
function onUpdateTchat(data) {
    for(let i = 0; i < data.length; i++) {
        let msg = data[i];

        let element = $('<div class="row msg_container base_sent"></div>');

        if(msg.sendBy == $("#pseudo").val()) {
            $('<div class="col-md-10 col-xs-10"><div class="messages msg_sent"> <p> ' + msg.msg + ' </p> </div> </div><div class="col-md-2 col-xs-2 avatar">' +
                '<img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class=" img-responsive ">' +
                '</div>').appendTo(element);
        } else {
            $('<div class="col-md-2 col-xs-2 avatar">' +
                '<img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class=" img-responsive ">' +
                '</div><div class="col-md-10 col-xs-10"><div class="messages msg_sent"> <p> ' + msg.msg + ' </p> </div> </div>')
                .appendTo(element);
        }

        $("#container-msg").append(element);
    }
}
function onNewMessage(msg) {
    //console.log('new msg !');
    //console.log(msg)
    let title_box = $('#chat_window_1').find('.panel-title').text();
    //console.log('title_box: ' + title_box);
    //console.log("msg.sendBy: " + msg.sendBy)


    if(msg.sendBy == title_box || msg.sendTo == title_box) {
        //console.log('maj msg')
        let element = $('<div class="row msg_container base_sent"></div>');
        //console.log('$("#pseudo").val(): ' + $("#pseudo").val())

        if(msg.sendBy == $("#pseudo").val()) {
            $('<div class="col-md-10 col-xs-10"><div class="messages msg_sent"> <p> ' + msg.msg + ' </p> </div> </div><div class="col-md-2 col-xs-2 avatar">' +
                '<img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class=" img-responsive ">' +
                '</div>').appendTo(element);
        } else {
            $('<div class="col-md-2 col-xs-2 avatar">' +
                '<img src="http://www.bitrebels.com/wp-content/uploads/2011/02/Original-Facebook-Geek-Profile-Avatar-1.jpg" class=" img-responsive ">' +
                '</div><div class="col-md-10 col-xs-10"><div class="messages msg_sent"> <p> ' + msg.msg + ' </p> </div> </div>')
                .appendTo(element);
        }

        $("#container-msg").append(element);
    } else {
        $(".user_box").each(function(){
            let friend_id = $(this).find('#friend_id');
            friend_id = friend_id.text();
            if(friend_id == msg.sendBy) {
                $(this).css('background-color', 'red');
            }
        });
    }
}
function onSocketConnected() {
    this.emit('authenticate', {token: token}) //send the jwt
        .on('authenticated', function () {
            $('#modal-content').modal('hide');

            $('#chat_window_1').hide();
            $('#btn-chat').click(function () {
                let friend_id = $('#chat_window_1').find('.panel-title');
                friend_id = friend_id.text();
                let btn_input = $('#btn-input');
                socket.emit("send message", {user_id: friend_id, msg: btn_input.val()});
                btn_input.val('');
            });

            $('#close_chat_window').click(function () {
                $("#container-msg").empty();
                $('#chat_window_1').hide();
            });

            $("#friends_list").show();
            get_friend_list();
            refreshFriendlist();

            // Socket disconnection
            socket.on("disconnect", onSocketDisconnect);

            // New player has arrive
            socket.on("new player", onNewPlayer);

            // The game is ready, initialize properties
            socket.on('prepare', onPrepare);

            // The set begin
            socket.on('start game', onStartGame);

            // Update the client
            socket.on('update', onUpdate);

            socket.on("remove player", onRemovePlayer);

            socket.on('end game', onEndGame);

            socket.on('update score', onUpdateScore);

            socket.on('next pos disc', onNextPosDisc);

            socket.on('perfect throw', onPerfectThrow);

            socket.on('update set', onUpdateSet);

            socket.on('duel request', onDuelRequest);

            socket.on('pong', function () {
                ping = Date.now() - pingTime;
                text_ping.text = ping + ' ms';
            });

            socket.on('update chat', onUpdateTchat);

            socket.on('new msg', onNewMessage);

            socket.on('dash', onDash);

            function measurePing() {
                setTimeout(function () {
                    pingTime = Date.now();
                    socket.emit('ping pong');
                    measurePing();
                }, 2000);
            }

            measurePing();
        })
        .on('unauthorized', function(msg) {
            console.log("unauthorized: " + JSON.stringify(msg.data));
            $('#modal-content').modal({
                show: true
            });
        });
}
function onDash(player_id) {
    let player = playerById(player_id);
    player.dash();
}
//when connection is done
function logout() {
    if (gameStarted) {
        socket.emit('concede');
    }
    $.post("http://" + auth_server + ":8081/api/logout",
        {
            token: token
        },
        'json'
    );
    setCookie("token", "", 0);
    socket.close();
    document.location.reload(true);
}
//show/hide menu options
function showMenu() {
    if (gameStarted || searchingGame) {
        btn_leave.visible = !btn_leave.visible;
    }

    if (game.sound.mute) {
        btn_sound_mute.visible = !btn_sound_mute.visible;
    } else {
        btn_sound_on.visible = !btn_sound_on.visible;
    }

    btn_logout.visible = !btn_logout.visible;
    btn_del_account.visible = !btn_del_account.visible;
}
function delAccount() {
    $.ajax({
        url: "http://" + auth_server + ":8081/api/signout?" + $.param({'token': token}),
        type: 'DELETE',
        crossDomain: true,
        success: function (data) {
            if (data.success) {
                console.log('User delete !');
            } else {
                console.log(data.msg);
            }
        }
    });
    setCookie("token", "", 0);
    socket.close();
    document.location.reload(true);
}
function leave() {
    socket.emit('concede');
    showMenu();
}
//mute the sound
function offSound() {
    game.sound.mute = true;
    btn_sound_mute.visible = true;
    btn_sound_on.visible = false;
}
//Put the sound on
function onSound() {
    game.sound.mute = false;
    btn_sound_mute.visible = false;
    btn_sound_on.visible = true;
}

/**************************************************
 ** GAME HELPER FUNCTIONS
 **************************************************/
// Find player by ID
function playerById(id) {
    for (let i = 0; i < remotePlayers.length; i++) {
        if (remotePlayers[i].id == id)
            return remotePlayers[i];
    }
    return false;
}