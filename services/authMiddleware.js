const jwt = require("jsonwebtoken") ;


function authMiddleware(req, res, next) {
    const token = req.header('Authorization')?.split(' ')[1]; // "Bearer token" formatından al
    if (!token) return res.status(401).json({ message: 'Token yok, giriş yapın' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Token içindeki bilgileri req.user'a ekle
        next();
    } catch (err) {
        res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token' });
    }
}

module.exports = authMiddleware ; 

