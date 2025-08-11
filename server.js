const express = require('express') ; 
const bodyParser = require('body-parser') ;
const cors = require('cors') ;
const bcrypt = require('bcrypt') ; 
const jwt = require('jsonwebtoken') ; 
const authMiddleware = require("./services/authMiddleware"); 

const app = express() ;
const PORT = 5000 ;
app.use(express.static('public') ) ; 

app.use(cors()) ; 
app.use(bodyParser.json()) ;

const KEY = "gizli-key" ; 

const users = [] ; 
const posts =[] ; 

 // ! ---------- REGISTER --------------

app.post ('/register', async (req, res) => {
    const {email , password, username} = req.body ; 

  if (!email || !password || !username) {
    return res.status(400).json({ message: 'Lütfen email, username ve password girin.' });
  }

  const userExist = users.find (u=> u.email === email) ;

  if (userExist) {
    return res.status(400).json({message  : "Bu email zaten kayıtlı"}) ; 

  }

  const hashedPassword = await bcrypt.hash(password, 10) ;

  const newUser = {
    id : users.length + 1,
    email,
    username,
    password: hashedPassword 

  }
 users.push(newUser) ;

 res.status(201).json({message : "Kayit basarili"}) ;
}) ;
 // ! ---------- ----------------------------



// ! ----------LOGIN --------------------------
app.post('/login' , async (req, res) => {

  const {email, password} = req.body  ; 


  const user = users.find(u => u.email===email) ; 

  if (! user) {
    return res.status(400).json({message : "Böyle bir kullanıcı yok. Lütfen kayıt olun"}) ; 
  }

  const isPasswordValid = await bcrypt.compare(password, user.password) ; 

  if (!isPasswordValid) {
    res.status(400).json({message :"Şifre yanlis !" }) ; 

  }
  
  const token = jwt.sign({id : user.id , email: user.email} , KEY, {expiresIn : "1h"}) ;

    res.json({ message: "Giriş başarılı", token });

})
 // ! ---------- -----------------------------


app.post("/posts", authMiddleware ,(req,res)=>{
  const {title ,content}= req.body ; 
  if (!title || !content) return res.status(400).json({ message: 'Title ve content gerekli.' });

  const authorId = req.user.id ;
  const author = users.find(u=> u.id === authorId) ;
  const newPost = {
    id : posts.length + 1 , 
    title,
    content ,
    authorId  ,
    authorUsername : author ? author.username : 'unknown',
    createdAt: new Date(),
    updatedAt: new Date()
  }
  posts.push(newPost) ;
  res.status(201).json({message: "Post atıldı" }) ; 

})

// Get all posts (public)
app.get('/posts', (req, res) => {
  const list = posts.slice().sort((a,b) => b.createdAt - a.createdAt);
  res.json(list);
});

app.get('/posts/:id' , (req, res) => {
  const id = Number(req.params.id) ; 
  const posts = posts.find(p=> p.id === id) ; 
  if (!posts) return res.status(404).json({message : "Post bulunamadi"}) ; 
  res.json(post) ; 
})


app.get('/' , (req, res) => {
    res.send("Merhaba blog forum api") ;

})

app.listen(PORT, () => {
    console.log('Server ${PORT} portunda calısıyor') ;
} ); 