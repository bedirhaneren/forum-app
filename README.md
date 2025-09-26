# Forum App (Node.js + Vanilla Frontend)

Basit bir forum/blog uygulaması: Express + MongoDB backend, sade HTML/CSS/JS frontend.

## Özellikler
- JWT ile kayıt/giriş
- Post oluşturma, listeleme, düzenleme, silme
- Kategori filtreleme (tech, science)
- Post detay ve yorumlar (ekleme/listeleme)
- Yazar veya admin/mod silme yetkisi

## Gereksinimler
- Node.js 18+
- MongoDB (lokal: mongodb://127.0.0.1:27017/blogdb)

## Kurulum
```bash
npm install
```
MongoDB bağlantısı ve JWT anahtarı `server.js` içinde tanımlıdır.

## Çalıştırma
Backend’i başlatın:
```bash
node server.js
```
Sunucu: http://localhost:5000

Frontend’i çalıştırın (örnek):
```bash
# örnek: npm i -g http-server
http-server frontend -p 8080
```
Arayüz: http://localhost:8080

## Klasörler
- `server.js` – API rotaları (auth, posts, comments)
- `models/` – `User`, `Posts`, `Comment`
- `frontend/` – `index.html`, `style.css`, `app.js`
- `services/` – `authMiddleware`, `roleMiddleware`

## API (özet)
- POST /register
- POST /login
- GET /posts (?category=tech)
- POST /posts (Auth)
- GET /posts/:id
- PUT /posts/:id (Auth, yazar)
- DELETE /posts/:id (Auth, yazar | admin/mod)
- GET /posts/:postId/comments
- POST /posts/:postId/comments (Auth)

