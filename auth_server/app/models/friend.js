// get an instance of mongoose and mongoose.Schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// set up a mongoose model and pass it using module.exports
module.exports = mongoose.model('Friend', new Schema({
    user_id: { type: String, required: true },
    friend_id: { type: String, required: true },
    confirm: { type: Boolean, default: false}
}));