const express = require('express') ; 
const bodyParser = require('body-parser') ;
const cors = require('cors') ;



const app = express() ;
const PORT = 5000 ;
app.use(express.static('public') ) ; 

app.use(cors()) ; 
app.use(bodyParser.json()) ;

const KEY = "gizli-key" ; 

const users = [] ; 


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

app.get('/' , (req, res) => {
    res.send("Merhaba blog forum api") ;

})

app.listen(PORT, () => {
    console.log('Server ${PORT} portunda calısıyor') ;
} ); 