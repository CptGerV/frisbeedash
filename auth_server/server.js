var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
// var cors = require('cors');
var shortid = require('shortid');
var assert = require('assert');
var jwt = require('jsonwebtoken');
var config = require('./config');
var User = require('./app/models/user');
var Friend = require('./app/models/friend');

// Configuring Passport
/*
 var passport = require('passport');
 var expressSession = require('express-session');
 app.use(expressSession({secret: config.secret}));
 app.use(passport.initialize());
 app.use(passport.session());

 passport.serializeUser(function(user, done) {
 done(null, user._id);
 });

 passport.deserializeUser(function(id, done) {
 User.findById(id, function(err, user) {
 done(err, user);
 });
 });

 // passport/login.js
 passport.use('login', new LocalStrategy({
 passReqToCallback: true
 },
 function(req, username, password, done) {
 User.findOne({ 'name' : username },
 function(err, user) {
 if(err) return done(err);
 if(!user) {
 console.log('User not found with username ' + username);
 return done(null, false, req.flash('message', 'User not found.'));
 }

 if(!isValidPassword(user, password)) {
 console.log('Invalid password !');
 return done(null, false, req.flash('message', 'Invalid Password'));
 }
 return done(null, user);
 })
 }));

 var isValidPassword = function(user, password){
 return bCrypt.compareSync(password, user.password);
 };

 passport.use('signup', new LocalStrategy({
 passReqToCallback : true
 },
 function(req, username, password, done) {
 findOrCreateUser = function(){
 // find a user in Mongo with provided username
 User.findOne({'username':username},function(err, user) {
 // In case of any error return
 if (err){
 console.log('Error in SignUp: '+err);
 return done(err);
 }
 // already exists
 if (user) {
 console.log('User already exists');
 return done(null, false,
 req.flash('message','User Already Exists'));
 } else {
 // if there is no user with that email
 // create the user
 var newUser = new User();
 // set the user's local credentials
 newUser.username = username;
 newUser.password = createHash(password);
 newUser.email = req.param('email');
 newUser.firstName = req.param('firstName');
 newUser.lastName = req.param('lastName');

 // save the user
 newUser.save(function(err) {
 if (err){
 console.log('Error in Saving user: '+err);
 throw err;
 }
 console.log('User Registration succesful');
 return done(null, newUser);
 });
 }
 });
 };

 // Delay the execution of findOrCreateUser and execute
 // the method in the next tick of the event loop
 process.nextTick(findOrCreateUser);
 })
 );

 // Generates hash using bCrypt
 var createHash = function(password){
 return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
 };

 app.post('/login', function(req, res, next) {
 passport.authenticate('local', function(err, user, info) {
 if (err) { return next(err); }
 if (!user) {
 res.redirect('/');
 }
 res.json({success: true, token: });
 })(req, res, next);
 });

 app.post('/signup', passport.authenticate('signup'), function(req, res) {
 res.json();
 });

 app.get('/signout', passport.authenticate('signout'), function(req, res) {
 req.logout();
 res.redirect('/');
 });
 */
// =============
// Configuration
// =============
mongoose.Promise = require('bluebird');
//mongoose.Promise = global.Promise;
const saltRounds = 10;
var port = process.env.PORT || 8081;
mongoose.connect(config.database);
app.set('superSecret', config.secret);

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
// app.use(cors);

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

/*app.get('/setup', function (req, res) {
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

    /*
    bcrypt.hash('changeme', saltRounds, function (err, hash) {
        // create a sample user
        var nick = new User({
            name: 'test1',
            password: hash,
            admin: true
        });

        // save the sample user
        var promise = nick.save();
        promise.then(function (err) {
            console.log('Add ' + 'test1');
            if (err) throw err;
            console.log('User ' + 'test1' + 'saved successfully');
        });
    });

    bcrypt.hash('changeme', saltRounds, function (err, hash) {
        // create a sample user
        var nick = new User({
            name: 'test2',
            password: hash,
            admin: true
        });

        // save the sample user
        var promise = nick.save();
        promise.then(function (err) {
            console.log('Add ' + 'test2');
            if (err) throw err;
            console.log('User ' + 'test2' + 'saved successfully');
        });
    });


    var friend = new Friend({
        user_id: 'test1',
        friend_id: 'test2'
    });

    var promise = friend.save();
    promise.then(function (err) {
        console.log('Add friend');
        if (err) throw err;
        console.log('User saved successfully');
    });

    friend = new Friend({
        user_id: 'test2',
        friend_id: 'test1'
    });

    var promise = friend.save();
    // assert.equal(promise.exec().constructor, Promise);
    assert.ok(promise instanceof require('mpromise'));
    promise.then(function (err) {
        console.log('Add friend');
        if (err) throw err;
        console.log('User saved successfully');
    });*/
/*
    res.json({success: true});
});*/

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
                /*var nick = new User({
                    name: req.body.username,
                    password: shortid.generate(),
                    mail: shortid.generate(),
                    temporary: true,
                    token: token
                });

                // save the sample user
                var promise = nick.save();
                promise.then(function (user) {*/
                    // console.log('Temporary user ' + user.name + ' saved successfully');
                    res.json({
                        success: true,
                        token: token
                    });
                // });
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
            // console.log('token ok : '+token);
            try {
                req.decoded = jwt.verify(token, app.get('superSecret'));
                // console.log(req.decoded.name);
                // if everythng is good, save to request for use in other routes
                var promise = User.findOne({name: req.decoded.name}).exec();
                // console.log(promise);
                promise.then(function (user) {
                    if (!user)
                        res.json({success: false, msg: "User didn't found"});
                    else {
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
            res.json({success: true, message: 'User successfully deleted!'});
        } else {
            res.json({success: false, message: "User does not found"});
        }
    });
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
                        // console.log(user);
                        for (var i = 0; i < friends.length; i++) {
                            if (friends[i].name == user.name) {
                                friends[i].points = user.points;
                                friends[i].online = user.online;
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

app.post('/points', function (req, res) {
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