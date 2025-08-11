const express = require('express') ; 
const bodyParser = require('body-parser') ;
const cors = require('cors') ;
const bcrypt = require('bcrypt') ; 
const jwt = require('jsonwebtoken') ; 
const authMiddleware = require("./services/authMiddleware"); 
const req = require('express/lib/request');
const mongoose = require('mongoose') ;
const timespan = require('jsonwebtoken/lib/timespan');
const app = express() ;
const PORT = 5000 ;
app.use(express.static('public') ) ; 

app.use(cors()) ; 
app.use(bodyParser.json()) ;

const KEY = "gizli-key" ; 

const users = [] ; 
const posts =[] ; 

mongoose.connect('mongodb://127.0.0.1:27017/blogdb', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log("MongoDB'ye bağlandı"))
.catch(err => console.error("MongoDB bağlantı hatası:", err));



 // ! ---------- REGISTER --------------

 const User= require("./models/User")  ;


app.post ('/register', async (req, res) => {
    const {email , password, username} = req.body ; 

  if (!email || !password || !username) {
    return res.status(400).json({ message: 'Lütfen email, username ve password girin.' });
  }

  const userExist = await User.findOne({email}) ;

  if (userExist) {
    return res.status(400).json({message  : "Bu email zaten kayıtlı"}) ; 

  }

  const hashedPassword = await bcrypt.hash(password, 10) ;

const newUser = new User ({email ,username, password: hashedPassword} ); 
await newUser.save() ;
 res.status(201).json({message : "Kayit basarili"}) ;
}) ;
 // ! ---------- ----------------------------



// ! ----------LOGIN --------------------------


app.post('/login' , async (req, res) => {

  const {email, password} = req.body  ; 


  const user = await User.findOne({ email} ); 
  

  if (! user) {
    return res.status(400).json({message : "Böyle bir kullanıcı yok. Lütfen kayıt olun"}) ; 
  }

  const isPasswordValid = await bcrypt.compare(password, user.password) ; 

  if (!isPasswordValid) {
  
  return  res.status(400).json({message :"Şifre yanlis !" }) ; 

  }
  
  const token = jwt.sign({id : user.id , email: user.email} , KEY, {expiresIn : "1h"}) ;

    res.json({ message: "Giriş başarılı", token });

})
 // ! ---------- -----------------------------


// ! ------------- Post oluşturma -------------------
const Posts = require("./models/Posts") ; 

app.post("/posts", authMiddleware , async (req,res)=>{
  const {title ,content}= req.body ; 
  if (!title || !content) return res.status(400).json({ message: 'Title ve content gerekli.' });

  const authorId = req.user.id ;
  const author = await User.findById(req.user.id) ;
  const newPost = new Post({
    title,
    content,
    authorId: author._id,
    authorUsername: author.username
  });

await newPost.save() ;

res.status(201).json({message: "Post atıldı" }) ; 

})

// Get all posts (public)
app.get('/posts', async (req, res) => {
  const list = await Post.find().sort({ createdAt: -1 });
  res.json(list);
});

app.get('/posts/:id' , async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({message : "Post bulunamadi"}) ; 
  res.json(post) ; 
})

app.put('/posts/:id',authMiddleware, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({message : "Post bulunamadı"}) ; 

  if (post.authorId.toString() !== req.user.id)
    return res.status(403).json({message : " Bu gönderiyi düzenleme hakkınız yok"}) ; 

  if (req.body.title) post.title = req.body.title;
  if (req.body.content) post.content = req.body.content;
  await post.save();

res.json(post) ; 
 }) ;

app.delete('/posts/:id' ,authMiddleware , async (req, res) => {
  const post = await Post.findById(req.params.id);

  if(!post) return res.status(404).json({message : "Post bulunamadı."}) ;

  if (req.authorId !== req.user.id)
  {
    return res.status(403).json({message : "Bu gönderiyi silme hakkınız yok "}) ; 
  }

await post.deleteOne() ;
  return res.status(200).json({message : "Post silindi."}) ; 

} )

app.get('/' , (req, res) => {
    res.send("Merhaba blog forum api") ;

})

app.listen(PORT, () => {
console.log(`Server ${PORT} portunda calısıyor`);
} ); 