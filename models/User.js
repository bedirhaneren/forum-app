const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  avatar: {type: String , required : Option},
  bio : {type: String , required : Option},
  role: {type : String, enum : ['user' , 'mod' , 'admin'], default : "user"},
  followers: {type : mongoose.Schema.ObjectId},
  following: {type: mongoose.Schema.ObjectId}
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
