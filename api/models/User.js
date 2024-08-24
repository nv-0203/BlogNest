const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const UserSchema = new Schema({
    username: {type: String, required: true, min: 4, unique: true},
    password: {type: String, required: true},
    displayName: {type: String},
    about: {
        type: String, 
        maxlength: [1000, 'About must be less than 1000 characters (approximately 250 words)']
    },
    followerCount: {type: Number, default: 0},
    profilePicture: {type: String, default: ''}
}, {
    timestamps: true
});

const UserModel = model('User', UserSchema);

module.exports = UserModel;