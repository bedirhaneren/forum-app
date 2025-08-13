const mongoose = require('mongoose')  ;
const User = require('./User');

const postSchema = new mongoose.Schema({
    title : {type : String, required : true }, 
    content : {type: String, required: true} ,
    authorId : {type : mongoose.Schema.ObjectId , ref: 'User', required: true} ,
    authorUsername : {type: String , required : true} ,
    likes: {type : mongoose.Schema.ObjectId , ref : 'User'} ,
    dislikes : {type : mongoose.Schema.ObjectId, ref : 'User'},
    views : {type: Number},
    tags: {type: String},
    createdAt : {type : Date, default: Date.now},
    updatedAt : {type : Date , default : Date.now}

}, {timestamps: true}) ;

module.exports= mongoose.model('Post', postSchema) ; 
