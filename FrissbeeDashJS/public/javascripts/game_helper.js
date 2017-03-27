"use strict";
// useful variables
let token = '';

// onload hidden function
function onJSLoad() {
    $("#hiddenps").hide();
    $("#hiddenm").hide();
    $("#hiddenpw").hide();
    $("#hiddenpwc").hide();
    $("#passconfirm").hide();
    $("#mail").hide();
    $("#pconf").hide();
    $("#friends_list").hide();
    $("#imail").hide(function () {
        $("#imail").next("br").hide();
    });

    $("#friends_list").find($("#panel_friends_list").click(function () {
        $(".user_box").each(function(){
            if($(this).is(":hidden")) {
                $(this).show('slow');
            }
            else {
                $(this).hide('slow');
            }
        });
    }));

    $("#btn-add-friend").click(function () {
        let request_name = $('#requestname_friend');
        if (request_name.val().length > 0) {
            $.post(
                'http://' + auth_server + ':8081/api/friend/request',
                {
                    token: token,
                    requestname: request_name.val()
                },
                function (data) {
                    if (data.success) {
                        console.log(data.msg);
                    } else {
                        get_friend_list();
                    }
                },
                'json'
            );
            request_name.val('');
        }
    });

    // set focus when modal is opened
    let modal_content = $('#modal-content');
    modal_content.on('shown.bs.modal', function () {
        $("#txtname").focus();
    });

    // Get token cookies
    token = getCookie("token");
    if (token != "") {

        // Check if token is valid on server
        connectToServer();
    } else {
        // show the modal onload
        modal_content.modal({
            show: true
        });
    }
}

//calling loading function
onJSLoad();

//called when click on connect
function connect() {
    //get the pseudo value
    let pseudo = $("#pseudo").val();

    //if null pseudo, error message is shown and we stop
    if (typeof(pseudo) == 'undefined' || pseudo.length == 0) {
        $("#hiddenps").text("Please enter a pseudo").fadeIn();

        //when pseudo is changing we hide the error message
        $("#pseudo").change(function () {
            $("#hiddenps").fadeOut();
        });
        return;
    }

    //get the password value and send to server (null password is tested on server)
    let password = $("#passwd").val();
    $.post(
        'http://' + auth_server + ':8081/api/login',
        {
            username: pseudo,
            password: password
        },
        function (data) {
            if (data.success) {
                token = data.token;
                setCookie("token", data.token, 365);
                connectToServer();
            } else {
                alert("Can't connect");
            }
            return data;
        },
        'json'
    );
}
function refreshFriendlist() {
    setTimeout(function () {
        get_friend_list();
        refreshFriendlist();
    }, 5000);
}
function connectToServer() {
    socket = io('http://'+ game_server + ':8080', {transports: ['websocket']});
    setEventHandlers();
}
//called when click on cancel
function cancel() {
    //off the click event
    $("#btn-connect").off('click');

    //hide everything which should be hide
    $("#mail").fadeOut(25, function () {
        $("#imail").fadeOut(25, function () {
            $("#imail").next("br").hide();
            $("#passconfirm").fadeOut(25, function () {
                $("#pconf").fadeOut(25);
            });
        });
    });

    //hiding error messages
    $("#hiddenps").hide();
    $("#hiddenm").hide();
    $("#hiddenpw").hide();
    $("#hiddenpwc").hide();

    //remake a connection button
    $("#btn-connect").html('Connect').attr("onclick", "connect()");

    //reset the subscribeMode function to the button subscribe
    $("#btn-subscribe").attr("onclick", "subscribeMode()");

    //respecify that password is optional
    $("#passwd").attr("placeholder", "Optional");
}
//switch to subscribe mode when click on subscribe the first time
function subscribeMode() {
    //password is now required
    $("#passwd").attr("placeholder", "Required");

    //hide the connection error messages if they were visible
    $("#hiddenpw").hide();
    $("#hiddenps").hide();

    //show the subscribing inputs
    $("#pconf").fadeIn(25, function () {
        $("#passconfirm").fadeIn(25, function () {
            $("#imail").fadeIn(25, function () {
                $("#imail").next("br").show();
                $("#mail").fadeIn(25);

                //the connection button is now a cancel button
                $("#btn-connect").html('Cancel').off('click').attr("onclick", "cancel()");

                //the subscribing function is now on
                $("#btn-subscribe").attr("onclick", "subscribe()");
            });
        });
    });
}
function subscribe() {
    //values for subscribing
    let pseudo = $("#pseudo").val();
    let password = $("#passwd").val();
    let passconf = $("#passconfirm").val();
    let mail = $("#mail").val();

    // There is errors or not (ctrl true = errors)
    let ctrl = false;

    // If null pseudo
    if (typeof(pseudo) == 'undefined' || pseudo.length == 0) {

        //show error message
        $("#hiddenps").text("Please enter a pseudo").fadeIn();

        //when changing, hide error message
        $("#pseudo").change(function () {
            $("#hiddenps").fadeOut();
        });

        //there is one error
        ctrl = true;
    }

    //same as pseudo control
    if (typeof(password) == 'undefined' || password.length == 0) {
        $("#hiddenpw").text("Please enter a password").fadeIn();
        $("#passwd").change(function () {
            $("#hiddenpw").fadeOut();
        });
        ctrl = true;
    }

    //first part same as others
    if (typeof(passconf) == 'undefined' || passconf.length == 0) {

        $("#hiddenpwc").text("Please confirm your password").fadeIn();
        $("#passconfirm").change(function () {
            $("#hiddenpwc").fadeOut();
        });
        ctrl = true;
    } else if (passconf != password) {
        //if password confirmation is not the same as password
        $("#hiddenpwc").text("Password doesn't match").fadeIn();
        $("#passconfirm").change(function () {
            $("#hiddenpwc").fadeOut();
        });
        ctrl = true;
    }

    //same
    if (typeof(mail) == 'undefined' || mail.length == 0) {
        $("#hiddenm").text("Please enter an email").fadeIn();
        $("#mail").change(function () {
            $("#hiddenm").fadeOut();
        });
        ctrl = true;
    }

    //if at least one error, stop; else send to server
    if (ctrl) {

    } else {
        $.post(
            'http://' + auth_server + ':8081/api/signup',
            {
                username: pseudo,
                password: password,
                mail: mail
            },
            function (data) {
                if (!data.success) {
                    alert(data.msg);
                } else {
                    cancel();
                }
            },
            'json'
        ).fail(function () {
            alert("error");
        });
    }
}
//keyboard capture
$(document).off("keyup").keyup(function (e) {
    let code = e.which;
    if (code == 13) {
        if ($("#btn-connect").attr("onclick") == "connect()") {
            connect();
        }
        else if ($("#btn-subscribe").attr("onclick") == "subscribe") {
            subscribe();
        }
    }
});

// ************
// To implement
// ************
// Return friends list
function get_friend_list() {
    let friendlist = [];
    $.post(
        'http://' + auth_server + ':8081/api/friend/list',
        {
            token: token
        },
        function (data) {
            if (!data.success) {
                console.log(data.msg);
            } else {

                $(".user_box").not("#add-friend-box").each(function () {
                    let found = false;
                    for(let friend in data.friends) {
                        if($(this).prop("id") == friend.name) {
                            found = true;
                            break;
                        }
                    }
                    if(!found)
                        $(this).remove();
                });

                let hide = true;
                $(".user_box").each(function(){
                    if($(this).is(":hidden")) {
                        hide = true;
                    }
                    else {
                        hide = false;
                    }
                });

                data.friends.forEach(function (friend) {
                    let s = $('#friends_list').find('#list_item_' + friend.name);
                    if(s.length == 0) {
                        let element = $("<li class=\"list-group-item user_box\" id='list_item_" + friend.name + "'></li>");
                        let input_group = $("<div class=\"input-group\" id=\"input-group-" + friend.name + "\"></div>");
                        let indicator = $("<div id=\"online-indicator\"></div>");
                        if (!friend.online) {
                            indicator.css("background-color", "red");
                        }
                        input_group.append(indicator);
                        input_group.append("<div id='friend_id'>" + friend.name + " </div>");

                        let input_group_btn = $("<div class=\"input-group-btn\"></div>");

                        if (!friend.confirm) {
                            let confirm_btn = $("<button type=\"button\" class=\"btn btn-default glyphicon glyphicon glyphicon-ok\" id='" + friend.name + "'></button>")
                                .click(function () {
                                    $.post(
                                        'http://' + auth_server + ':8081/api/friend/accept',
                                        {
                                            token: token,
                                            requestname: event.target.id
                                        },
                                        function (data) {
                                            if (!data.success) {
                                                alert(data.msg);
                                            } else {
                                                get_friend_list();
                                            }
                                        },
                                        'json'
                                    );
                                });
                            input_group_btn.append(confirm_btn);

                            let refuse_btn = $("<button type=\"button\" class=\"btn btn-default glyphicon glyphicon glyphicon-remove warning\" id='" + friend.name + "'></button>")
                                .click(function () {
                                $.post(
                                    'http://' + auth_server + ':8081/api/friend/refuse',
                                    {
                                        token: token,
                                        requestname: event.target.id
                                    },
                                    function (data) {
                                        if (!data.success) {
                                            alert(data.msg);
                                        } else {
                                            get_friend_list();
                                        }
                                    },
                                    'json'
                                );
                            });
                            input_group_btn.append(refuse_btn);

                        } else {
                            if (friend.online) {
                                $("<button type=\"button\" class=\"btn btn-default glyphicon glyphicon-comment\" id='" + friend.name + "'></button>")
                                    .appendTo(input_group_btn)
                                    .click(function () {
                                        $('#chat_window_1').show();
                                        let friend_id = $('#chat_window_1').find('.panel-title');
                                        friend_id.text(friend.name);
                                        $("#container-msg").empty();
                                        console.log("friend.name: " + friend.name);
                                        socket.emit('chat history', friend.name);
                                    });
                                $("<button type=\"button\" class=\"btn btn-default glyphicon glyphicon-tower\" id='" + friend.name + "'></button>")
                                    .appendTo(input_group_btn)
                                    .click(function () {
                                        socket.emit('duel request', {pseudo: event.target.id});
                                    });
                            }
                            $("<button type=\"button\" class=\"btn btn-default glyphicon glyphicon glyphicon-remove\" id='" + friend.name + "'></button>")
                                .appendTo(input_group_btn)
                                .click(function () {
                                    $.post(
                                        'http://' + auth_server + ':8081/api/friend/remove',
                                        {
                                            token: token,
                                            requestname: event.target.id
                                        },
                                        function (data) {
                                            if (!data.success) {
                                                alert(data.msg);
                                            } else {
                                                get_friend_list();
                                            }
                                        },
                                        'json'
                                    );
                                });

                            $("<button type=\"button\" class=\"btn btn-default glyphicon glyphicon glyphicon-ok duel\" id='accept_duel_" + friend.name + "'></button>")
                                .appendTo(input_group_btn)
                                .hide();

                            $("<button type=\"button\" class=\"btn btn-default glyphicon glyphicon glyphicon-remove duel\" id='refuse_duel_" + friend.name + "'></button>")
                                .appendTo(input_group_btn)
                                .hide();
                        }

                        input_group.append(input_group_btn);
                        element.append(input_group);
                        if (friend.online === 'true')
                            element.css("background-color", "red");
                        if(hide) {
                            element.hide();
                        }
                        $("#friends_list").append(element);
                    } else {
                        if (!friend.online)
                            $('#friends_list').find('#list_item_' + friend.name).find("#input-group-" + friend.name).find("#online-indicator").css("background-color", "red");
                    }
                }, this);
            }
        },
        'json'
    );
    return friendlist;
}
// Change password
function update_password(new_password) {
    $.ajax({
        url: 'http://' + auth_server + ':8081/api/change_password',
        type: 'PUT',
        data: {
            token: token,
            password: new_password
        },
        crossDomain: true,
        dataType: 'application/json',
        success: function (data) {
            if (data.success) {
                alert("Password modified");
            } else {
                alert("Error: " + data.msg);
            }
        },
        error: function () {
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('x-access-token', token);
        }
    });
}
/*******************/
/***** Cookies *****/
/*******************/
function setCookie(cname, cvalue, exdays) {
    let d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

//Mode how to play
function helpingMode(){
    $("#btn_ooh").width(btn_help.width);
    $("#btn_ooh").height(btn_help.height);
    $("#help_modal").width(game.world.width*0.8);
    $("#help_modal").height(game.world.height*0.8);
    $("#help_modal").css("position","absolute");
    $("#help_modal").css("top", ( $(window).height() - $("#help_modal").height() ) / 2  + "px");
    $("#help_modal").css("left", ( $(window).width() - $("#help_modal").width() ) / 2 + "px");
    $("#help_modal").modal("toggle");
}

function outOfHelp(){
    $("#help_modal").modal("toggle");
}

