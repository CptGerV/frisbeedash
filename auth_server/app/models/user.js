// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var shortid = require('shortid');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('User', new Schema({
    _id: { type: String, 'default': shortid.generate },
    name: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mail: { type: String, unique: true },
    admin: {type: Boolean, default: false},
    points: { type: Number, default:0, min: 0 },
    token: { type: String, default: ''},
    online: { type: Boolean, default: false },
    temporary: { type: Boolean, default: false}
}));
