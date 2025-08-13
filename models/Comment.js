const mongoose = require('mongoose') ;


const CommentSchema = new mongoose.Schema({
    postId : {type : mongoose.Schema.ObjectId , ref : 'Post', required: true},
    authorId : {type : mongoose.Schema.ObjectId, ref :'User'  ,required :true},
    authorUsername : {type : String , required: true},
    content :{type : String , required : true } ,
    createdAt :{ type: Date , default : Date.now},
    likes : {type: mongoose.Schema.ObjectId},
    dislikes: {type: mongoose.Schema.ObjectId},
    updatedAt: {type: Date ,default : Date.now}
    }
    
    
) ; 

module.exports = mongoose.model("Comment" , CommentSchema)  ;