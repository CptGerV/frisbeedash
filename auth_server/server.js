var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var shortid = require('shortid');
var jwt = require('jsonwebtoken');

var assert = require('assert');

var config = require('./config');
var User = require('./app/models/user');
var Friend = require('./app/models/friend');

// =============
// Configuration
// =============
mongoose.Promise = require('bluebird');
const saltRounds = 10;
var port = process.env.PORT || 8081;
mongoose.connect(config.database);
app.set('superSecret', config.secret);

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// =============
// routes ======
//==============
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function (req, res) {
    res.send('Hello! The API is a http://localhost:' + port + '/api');
});

app.get('/setup', function (req, res) {
    console.log('Setup');

    bcrypt.hash('adminadmin', saltRounds, function (err, hash) {
        // create a sample user
        var nick = new User({
            name: 'admin',
            password: hash,
            admin: true
        });

        // save the sample user
        var promise = nick.save();
        promise.then(function (err) {
            console.log('Add admin');
            if (err) throw err;
            console.log('User admin saved successfully');
        });
    });

    res.json({success: true});
});

// ====================
// API ROUTES ---------
//=====================

// get an instance of the router for api routes
var apiRoutes = express.Router();

apiRoutes.options('/api/user/del', function (req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'DELETE');
    res.end();
});

// Route to add user
apiRoutes.post('/signup', function (req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    // Check if user already exists
    var promise1 = User.findOne({name: req.body.username, mail: req.body.mail}).exec();
    promise1.then(function (user) {
        console.log('promise')
        if (user) {
            console.log('User already exist');
            res.status(200).json({success: false, message: 'User already exist'});
        } else {
            console.log('user doesnt exist')
            bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
                if (err) throw err;
                // create a sample user
                var nick = new User({
                    name: req.body.username,
                    password: hash,
                    mail: req.body.mail
                });

                // save the sample user
                var promise2 = nick.save();
                promise2.then(function (user) {
                    console.log('User ' + user.name + ' saved successfully');
                    res.status(201).json({success: true});
                });
            });
        }
        console.log('test')
    }).catch(function (error) {
        console.log('error:', error);
    });
});

// Route to authenticate a user // TODO: must be PUT METHOD
apiRoutes.post('/login', function (req, res) {
    console.log('login');
    res.header('Access-Control-Allow-Origin', '*');
    if (typeof(req.body.username) == 'undefined' || req.body.username.length == 0) {
        return res.json({success: false, msg: "Can't find username"});
    }

    if (typeof(req.body.password) == 'undefined' || req.body.password.length == 0) {
        // Check if user already exists
        var promise = User.findOne({name: req.body.username}).exec();
        promise.then(function (user) {
            if (user) {
                console.log('User already exist');
                res.json({success: false, message: 'User already exist'});
            } else {
                var token = jwt.sign({name: req.body.username, temporary: true}, app.get('superSecret'), {expiresIn: "1h"});
                // create a sample user
                    res.json({
                        success: true,
                        token: token
                    });
            }
        }).catch(function (error) {
            console.log('error registering temp user:', error);
        });
    } else {
        var promise = User.findOne({name: req.body.username, temporary: false}).exec();
        promise.then(function (user) {
            if (user) {
                // Load hash from DB.
                if (bcrypt.compareSync(req.body.password, user.password)) {
                    // if user is found and password is right
                    // create a token
                    user.token = '';
                    var user_to_register = {name: user.name, temporary: false};
                    var token = jwt.sign(user_to_register, app.get('superSecret'), {
                        expiresIn: "2h"
                    });
                    user.token = token;
                    user.save();
                    res.json({success: true, token: user.token})
                } else {
                    console.log("Error during compare password.")
                    res.status(401).json({success: false, msg: "Error during compare password."});
                }
            } else {
                console.log("Error User does not found.");
                res.status(400).json({success: false, msg: "Error User does not found."});
            }
        }).catch(function (error) {
            console.log('error login user:', error);
        });
    }
});

// route middleware to verify a token
apiRoutes.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    if (req.method == 'OPTIONS') {
        console.log('Method option');
        var headers = {};
        headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
        headers["Access-Control-Allow-Credentials"] = false;
        headers["Access-Control-Max-Age"] = '86400'; // 24 hours
        headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
        res.writeHead(200, headers);
        res.end();
    } else {
        var token = req.body.token || req.query.token || req.headers['x-access-token'];
        if (token) {
            // verifies secret and checks exp
            try {
                req.decoded = jwt.verify(token, app.get('superSecret'));
                // if everythng is good, save to request for use in other routes
                var promise = User.findOne({name: req.decoded.name}).exec();
                promise.then(function (user) {
                    if (!user)
                        res.json({success: false, msg: "User didn't found"});
                    else {
                        // console.log(user)
                        console.log("user.admin: " + user.admin)
                        if (user.admin)
                            req.admin = true;

                        if (user.token == token) {
                            next();
                        } else {
                            res.status(401).json({success: false, msg: "Wrong token"});
                        }
                    }
                }).then(function (error) {
                    console.log('error:', error);
                });
            } catch (err) {
                console.log('error:', err);
                res.json({success: false, error: err});
            }
        } else {
            // if there is no token
            // return an error
            console.log('Token missing');
            return res.status(401).send({
                success: false,
                message: 'Invalid or expired token.'
            });
        }
    }
});

// Route to del user
apiRoutes.delete('/signout', function (req, res) {
    // get the user
    console.log(req.decoded);
    User.findOneAndRemove({name: req.decoded.name}, function (err, user) {
        if (err) throw err;
        if (user) {
            console.log('User successfully deleted!');
            //res.json({success: true, message: 'User successfully deleted!'});
        } else {
            //res.json({success: false, message: "User does not found"});
        }
    });

    Friend.findOneAndRemove({user_id: req.decoded.name}, function (err, user) {
        if (err) throw err;
        if (user) {
            console.log('User successfully deleted!');
            //res.json({success: true, message: 'User successfully deleted!'});
        } else {
            //res.json({success: false, message: "User does not found"});
        }
    });

    Friend.findOneAndRemove({friend_id: req.decoded.name}, function (err, user) {
        if (err) throw err;
        if (user) {
            console.log('User successfully deleted!');
            //res.json({success: true, message: 'User successfully deleted!'});
        } else {
            //res.json({success: false, message: "User does not found"});
        }
    });
    res.json({success: true, message: 'User successfully deleted!'});
});

apiRoutes.post('/logout', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    // find the user
    User.findOneAndUpdate({name: req.decoded.name}, {$set: {token: ''}}, {new: true},
        function (err, user) {
            if (err) throw err;
            if (user) {
                console.log('Token saved successfully');
                res.json({success: true});
            } else {
                res.json({success: false, msg: "User does not exists."});
            }
        }
    );
});

// Route to update user
apiRoutes.post('/change_password', function (req, res) {
    // get the user
    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
        if (err) throw err;
        User.findOneAndUpdate({name: req.decoded.name, temporary: false},
            {$set: {password: hash}},
            {new: true},
            function (err, user) {
                if (err) throw err;
                if (user) {
                    console.log('Password modified for user: ' + user.name);
                    res.json({success: true});
                } else {
                    console.log("Password not modified, User does not found");
                    res.json({success: false, msg: "User does not found"});
                }
            });
    });
});

apiRoutes.post('/friend/request', function (req, res) {
    if(req.body.requestname === req.decoded.name || req.decoded.temporary === true){
        return res.status(200).json({success: false, msg: "You can not make this request friends"});
    }
    User.findOne({name: req.body.requestname, temporary: false}, function (err, user) {
        if (user) {
            Friend.findOne({
                user_id: req.body.requestname,
                friend_id: req.decoded.name
            }, function (err, friendship) {
                if (!friendship) {
                    var friend = new Friend({user_id: req.body.requestname, friend_id: req.decoded.name});
                    friend.save().then(function (error) {
                        console.log('Request friendship created');
                        res.json({success: true});
                    });
                } else {
                    res.json({success: false, msg: "Pending request"});
                }
            });
        } else {
            res.status(200).json({success: false, msg: "You re not able to make request or user does not exist."});
        }
    });
});

apiRoutes.post('/friend/accept', function (req, res) {

    Friend.findOneAndUpdate({user_id: req.decoded.name, friend_id: req.body.requestname},
        {confirm: true},
        {new: true},
        function (err, fsUpdated) {
            if (fsUpdated) {
                var friend = new Friend({
                    user_id: req.body.requestname,
                    friend_id: req.decoded.name,
                    confirm: true
                });

                var promise = friend.save();
                promise.then(function () {
                    console.log('Friendship saved successfully');
                    res.json({success: true});
                }).catch(function (error) {
                    console.log('error:', error);
                    res.json({success: false});
                });
            } else {
                res.json({success: false, msg: "Can't valid friendship between " + req.decoded.name + " and " + req.body.requestname});
            }
        });
});

apiRoutes.post('/friend/refuse', function (req, res) {
    Friend.findOneAndRemove({user_id: req.decoded.name, friend_id: req.body.requestname, confirm: false},
        function (err, friendship) {
            if (friendship) {
                res.json({success: true});
            } else {
                res.json({success: false, msg: "Friendship didn't found"});
            }
        });
});

apiRoutes.post('/friend/remove', function (req, res) {
    Friend.findOneAndRemove({user_id: req.decoded.name, friend_id: req.body.requestname},
        function (err, friendship) {
            if (friendship) {
                Friend.findOneAndRemove({user_id: req.body.requestname, friend_id: req.decoded.name},
                    function (err, friendship) {
                        if (friendship) {
                            res.json({success: true});
                        } else {
                            res.json({success: false, msg: "Request didn't found"});
                        }
                    });
            } else {
                res.json({success: false, msg: "Request didn't found"});
            }
        });
});

apiRoutes.post('/friend/list', function (req, res) {
    var promise = Friend.find({user_id: req.decoded.name});
    promise.then(function (friendships) {
        if (friendships.length > 0) {
            var friends = [];
            for (var i = 0; i < friendships.length; i++) {
                var friendship = friendships[i];
                friends.push({name: friendship.friend_id, confirm: friendship.confirm});
                User.findOne({name: friendship.friend_id})
                    .exec()
                    .then(function (user) {
                        if(user) {
                            for (var i = 0; i < friends.length; i++) {
                                if (friends[i].name == user.name) {
                                    friends[i].points = user.points;
                                    friends[i].online = user.online;
                                }
                            }
                        }
                        return friends;
                    })
                    .then(function (friends) {
                        if (friends.length == friendships.length) {
                            res.json({success: true, friends: friends});
                        }
                    });
            }
        } else {
            res.json({success: true, friends: friendships});
        }
    }).catch(function (error) {
        if(error) {
            console.log('error:', error);
        }
    });
});

// -------------
// Admin routes
// -------------
apiRoutes.get('/points/:username', function (req, res) {
    if (!req.admin)
        return res.json({success: false, msg: "Only for administrator."});

    User.findOne({name: req.params.username}, function (err, user) {
        if (err) throw err;
        if (user)
            res.json({points: user.points});
        else
            res.json({errmsg: "User does not exists"});
    });
});

apiRoutes.post('/points', function (req, res) {
    if (typeof(req.admin) != 'undefined' && req.admin) {
    // TODO: check if points is under 0
        var to_inc = -1;
        if(req.body.victory === 'true') {
            to_inc = 1;
        }
        var promise = User.findOneAndUpdate({name: req.body.name}, {$inc: {points: to_inc}}, {new: true});
        promise.then(function (user) {
            if(user) {
                console.log('Point modified for user: ' + user.name);
                res.json({success: true});
            } else {
                console.log('User ' + req.body.name + ' does not found.');
                res.json({success: false});
            }
        }).catch(function(error) {
            console.log('Error:', error);
        });
    } else {
        console.log('typeof(req.admin): ' + typeof(req.admin))
        console.log(req.admin)
    }
});

apiRoutes.get('/users', function (req, res) {
    var limit = -1;
    if (typeof(req.body.limit) != 'undefined' && req.body.limit > 0) {
        limit = req.body.limit;
    }

    var query = User.find({});
    query.select('name points');
    query.sort({points: -1});
    if (limit != -1) {
        query.limit(limit);
    }

    query.exec(function (err, users) {
        res.json(users);
    });
});

app.use('/api', apiRoutes);

app.post('/connect', function (req, res) {
    console.log('connect');
    //if(!req.admin) {
     //   return res.status(401).json({success: false, msg: "Only for administrator"});
    //}
    var promise = User.findOneAndUpdate({name: req.body.name}, {$set: {online: req.body.online}}, {new: true}).exec();
    promise.then(function (user) {
        if (user) {
            req.body.online = (req.body.online === 'true');
            if (user.temporary && !req.body.online) {
                console.log('remove user temp')
                User.findOneAndRemove({name: req.body.name}).exec();
            } else {
                console.log('Status modified for: ' + user.online);
            }
            res.json({success: true});
        } else {
            console.log('User does not found: ' + req.body.name);
            res.json({success: false, msg: 'User does not found: ' + req.body.name});
        }
    }).catch(function (error) {
        console.log('Error:', error);
    });
});

// ===============
// start server
// ==============
app.listen(port);

console.log('Magic happens at http://localhost:' + port);