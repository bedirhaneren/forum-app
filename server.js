const express = require('express') ; 
const bodyParser = require('body-parser') ;
const cors = require('cors') ;
const bcrypt = require('bcrypt') ; 
const jwt = require('jsonwebtoken') ; 
const authMiddleware = require("./services/authMiddleware"); 
const roleMiddleware = require("./services/roleMiddleware") ;
const req = require('express/lib/request');
const mongoose = require('mongoose') ;
const timespan = require('jsonwebtoken/lib/timespan');
const app = express() ;
const PORT = 5000 ;
const Comment = require("./models/Comment") ;
const  {body , validationResult} = require('express-validator') ;

app.use(express.static('public') ) ; 

app.use(cors()) ; 
app.use(bodyParser.json()) ;

const KEY = "gizli-key" ; 


mongoose.connect('mongodb://127.0.0.1:27017/blogdb', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => {
  console.log(" MongoDB'ye bağlandı");
})
.catch(err => {
  console.error(" MongoDB bağlantı hatası:", err);
  process.exit(1);
});



 // ! ---------- REGISTER --------------

 const User= require("./models/User")  ;
  
app.post ('/register', 
  [
    body('email').isEmail().withMessage("Gecerli bir email girin."),
    body('password').isLength().withMessage("Şifre 6 karakterden kısa olamaz"),
    body('username').notEmpty().withMessage("Kullanıcı adı boş olamaz") 
  ],
  
  async (req, res) => {                   
    const errors = validationResult(req) ; 
    if (!errors.isEmpty())
      {
        return res.status(400).json({errors : errors.array()}); 
      } 
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


app.post('/login' ,
  [
    body('email').isEmail().withMessage("Lütfen geçerli bir email girin"), 
    body('password').notEmpty().withMessage("Şifre boş olamaz")
  ],
  
  async (req, res) => {

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
const Post = require("./models/Posts") ; 

app.post("/posts", authMiddleware , 
  [ 
    body('title').notEmpty().withMessage("Başlık boş kalamaz"),
    body('category').notEmpty().withMessage("Kategori bos kalamaz"),
    body('content').notEmpty().withMessage("Content boş kalamaz")
    
  ],
  
  async (req,res)=>{
         console.log("=== POST /posts çağrıldı ===");
         console.log("Request body:", req.body);
         console.log("User bilgileri:", req.user);

  const errors = validationResult(req) ; 
   if (!errors.isEmpty())
      {       
         console.log("Validation hatası:", errors.array());

        return res.status(400).json({errors : errors.array()}); 
      }   
    const {title , category , content}= req.body ; 
  if (!title || !content || !category) return res.status(400).json({ message: 'Title ve content ve category gerekli.' });
console.log("islem basarili") ;

  console.log("User bilgileri:", req.user);
  const authorId = req.user.id ;
  const author = await User.findById(req.user.id) ;
  
  if (!author) {
    return res.status(400).json({ message: 'Kullanıcı bulunamadı' });
  }
  
  const newPost = new Post({
    title,
    content,
    category,
    authorId,
    authorUsername: author.username
  });
console.log("Post oluşturuluyor:", newPost);

try {
  const savedPost = await newPost.save();
  console.log("Post başarıyla kaydedildi:", savedPost);
  res.status(201).json({message: "Post atıldı", post: savedPost});
} catch (error) {
  console.error("Post kaydetme hatası:", error);
  res.status(500).json({message: "Post kaydedilemedi", error: error.message});
} 

})

// Get all posts (public)
app.get('/posts', async (req, res) => {
  try {
    const list = await Post.find().sort({ createdAt: -1 });
    console.log(`📊 Posts collection'ında ${list.length} adet post bulundu`);
    res.json(list);
  } catch (error) {
    console.error('Posts getirme hatası:', error);
    res.status(500).json({message: 'Posts getirilemedi'});
  }
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

app.delete('/posts/:id', authMiddleware, async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) return res.status(404).json({ message: "Post bulunamadı." });

  // Sadece post sahibi veya admin/mod silebilir
  if (post.authorId.toString() !== req.user.id && !['admin', 'mod'].includes(req.user.role)) {
    return res.status(403).json({ message: "Bu gönderiyi silme hakkınız yok" });
  }

  await post.deleteOne();
  res.status(200).json({ message: "Post silindi." });
});


app.post ("/posts/:postId/comments" , authMiddleware ,
  [
    body('content').notEmpty().withMessage('Yorum boş kalamaz')
  ]  ,
async (req , res) => {
  const errors = validationResult(req) ; 
  if (! errors.isEmpty())
  {
    return res.status(400).json({errors : errors.array()}) ; 
  }

  const postId = req.params.postId ; 
  const content = req.body.content ; 

  const post = await Post.findById(postId)  ;
  if (! post) return res.status(404).json({message : 'Post bulunamadı'
  });

  const comment = new Comment ({

    postId,
    authorId : req.user.id, 
    authorUsername: req.user.username, 
    content
  }) ; 

  await comment.save() ; 

  res.status(201).json({message: "Yorum başarıyla gönderildi"}); 

})

// ! Bir postun tüm yorumları ------------ 
app.get('/posts/:postId/comments', async (req, res) => 
{
  const postId = req.params.postId ;
  const comments = await Comment.find({ postId }).sort({ createdAt: -1 });

  res.json(comments) ;
},

// !!   Like atma route 
app.post('/posts/:id/like', authMiddleware, async (req, res) => {
  const postId = req.params.postId ; 
  const post = await Post.findById(postId) ; 
    if (! post) return res.status(404).json({message : 'Post bulunamadı' 
  });
 // ? mongodb den objectId döndüğü için tostring kullan
  post.dislikes= post.dislikes.filter(userId => userId.toString() !== req.user.id) ;
  
  if (post.likes.includes(req.user.id) ){
  post.likes = post.likes.filter(id => id.toString()!==req.user.id) ;
  }
  else {
    post.likes.push(req.user.id); 
  }
  await post.save() ;
  res.json({likes: post.likes.length, dislikes: post.dislikes.length}) ; 
}),

app.post ('/post/:id/dislike', authMiddleware, async (req,res) => {
  const postId = req.params.postId ; 
  const post= await Post.findById(postId) ;
  if (!post) return res.status(404).json({message: "Post bulunamadı"}) ; 

  post.likes= post.likes.filter(userId => userId.toString() !== req.user.id) ; 

//? userId.toString() !== req.user.id koşulu true ise bu eleman yeni array’e dahil ediliyor değilse çıkarılıyor.
  if (post.dislikes.includes(req.user.id) )
  {
    post.dislikes= post.dislikes.filter(id => id.toString()!== req.user.id);

  }
else{
  post.dislikes.push(req.user.id); 
}
await post.save() ;

res.json({likes : post.likes.length, dislikes : post.dislikes.length}); 

})

) 

app.put ('/users/me', authMiddleware, 
  [
  body('email').optional().isEmail().withMessage('Geçerli bir email girin'),
  body('username').optional().isLength({ min: 3 }).withMessage('Kullanıcı adı en az 3 karakter olmalı'),
  body('password').optional().isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı'),
  ],
  async (req,res) => {
  errors= validationResult(req) ; 
   if (!errors.isEmpty())
      {
        return res.status(400).json({errors : errors.array()}); 
      } 
  const user =  await User.findById(req.user.id) ; 
  if (!user) return res.status(404).json({message: "Kullanıcı bulunamadı"} ); 
  if (user.id != req.user.id) return res.status(403).json({message: "Bu profili düzenlemeye yetkiniz yok"} );

  if (req.body.email) user.email= req.body.email ;
  if (req.body.username) user.username = req.body.username ; 
  if (req.body.password)
    {
      user.password = await bcrypt.hash(req.body.password, 10) ;
    } 

  await user.save() ;
  
  res.json(user) ;

})

app.get('/' , (req, res) => {
    res.send("Merhaba blog forum api") ;

})

app.listen(PORT, () => {
console.log(`Server ${PORT} portunda calısıyor`);
} ); 



