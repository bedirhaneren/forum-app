class PageManager {
    constructor() {
        // ! sınıf ilk calıstıgında calısır
        this.currentPage = 'home';  
        this.init();
    }

    init() {
        // Sayfa yuklendiginde url hangisiyse onu aciyor
        this.handleHashChange();
        
        // Hash değişimini dinliyor
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });
    }

    handleHashChange() {
        const hash = window.location.hash.slice(1) || 'home';
        this.showPage(hash);
    }

    showPage(pageName) {
        this.currentPage = pageName;
        
        // URL'i güncelle
        if (window.location.hash !== `#${pageName}`) {
            window.location.hash = pageName;
        }

        // Sayfa içeriğini yükle
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = this.getPageContent(pageName);

        // Aktif nav linkini güncelle
        this.updateActiveNav(pageName);
    }

    updateActiveNav(pageName) {
        // Tüm nav linklerinden active class'ını kaldır
        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
        });
        
        // Aktif sayfaya active class'ı ekle
        const activeLink = document.querySelector(`nav a[href="#${pageName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    getPageContent(pageName) {
        switch (pageName) {
            case 'home':
                return this.getHomePage();
            case 'login':
                return this.getLoginPage();
            case 'register':
                return this.getRegisterPage();
            case 'categories':
                return this.getCategoriesPage();
            case 'new-topic':
                return this.getNewTopicPage();
            default:
                return this.getHomePage();
        }
    }

    getHomePage() {
        return `
            <div class="container">
                <main>
                    <div class="content">
                        <div class="post">
                            <h3><a href="#">Hoş Geldiniz!</a></h3>
                            <p>MyForum'a hoş geldiniz. Tartışmalara katılmak için giriş yapın.</p>
                            <div class="meta">Son güncelleme: Bugün</div>
                        </div>
                    </div>
                    <div class="sidebar">
                        <h2>Popüler Konular</h2>
                        <ul>
                            <li><a href="#">Teknoloji</a></li>
                            <li><a href="#">Bilim</a></li>
                            <li><a href="#">Sanat</a></li>
                        </ul>
                    </div>
                </main>
            </div>
        `;
    }

    getLoginPage() {
        return `
            <div class="form-container">
                <h2>Giriş Yap</h2>
                <input type="email" id="username" placeholder="E-posta adresi">
                <input type="password" id="password" placeholder="Şifre">
                <button onclick="handleLogin()">Giriş Yap</button>
                <p id="message"></p>
            </div>
        `;
    }

    getRegisterPage() {
        return `
            <div class="form-container">
                <h2>Kayıt Ol</h2>
                <input type="text" id="reg-username" placeholder="Kullanıcı adı">
                <input type="email" id="reg-email" placeholder="E-posta">
                <input type="password" id="reg-password" placeholder="Şifre">
                <button onclick="handleRegister()">Kayıt Ol</button>
                <p id="reg-message"></p>
            </div>
        `;
    }

    getCategoriesPage() {
        return `
            <div class="container">
                <h2>Kategoriler</h2>
                <div class="categories-grid">
                    <div class="category-card">
                        <h3>Teknoloji</h3>
                        <p>Teknoloji ile ilgili tartışmalar</p>
                    </div>
                    <div class="category-card">
                        <h3>Bilim</h3>
                        <p>Bilimsel konular</p>
                    </div>
                </div>
            </div>
        `;
    }

    getNewTopicPage() {
        return `
            <div class="container">
                <h2>Yeni Konu Aç</h2>
                <div class="new-topic-form">
                    <input type="text" id="topic-title" placeholder="Konu başlığı">
                    <select id="topic-category">
                        <option value="">Kategori seçin</option>
                        <option value="tech">Teknoloji</option>
                        <option value="science">Bilim</option>
                    </select>
                    <textarea id="topic-content" placeholder="Konu içeriği"></textarea>
                    <button onclick="handleNewTopic()">Konu Aç</button>
                </div>
            </div>
        `;
    }
}

// Global fonksiyonlar
function showPage(pageName) {
    pageManager.showPage(pageName);
}

function handleLogin() {
    const email = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => {
        if (res.ok) {
            return res.json().then(data => {
                document.getElementById('message').innerText = data.message || "Giriş başarılı!";
                
                if (data.token) {
                    localStorage.setItem("token", data.token);
                    alert("Giriş başarılı!");
                    showPage('home');
                }
            });
        } else {
            return res.json().then(data => {
                document.getElementById('message').innerText = data.message || "Giriş hatası!";
            });
        }
    })
    .catch(error => {
        document.getElementById('message').innerText = 'Giriş hatası: ' + error.message;
    });
}

function handleRegister() {
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    console.log('Kayıt verileri:', { username, email, password });

    fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    })
    .then(res => {
        if (res.ok) {
            return res.json().then(data => {
                document.getElementById('reg-message').innerText = data.message || "Kayıt başarılı!";
                alert("Kayıt başarılı! Giriş yapabilirsiniz.");
                showPage('login');
            });
        } else {
            return res.json().then(data => {
                document.getElementById('reg-message').innerText = data.message || "Kayıt hatası!";
            });
        }
    })
    .catch(error => {
        document.getElementById('reg-message').innerText = 'Kayıt hatası: ' + error.message;
    });
}

function handleNewTopic() {
    const title = document.getElementById('topic-title').value.trim();
    const category = document.getElementById('topic-category').value;
    const content = document.getElementById('topic-content').value.trim();

    if (!title || !category || !content) {
        alert('Lütfen tüm alanları doldurun!');
        return;
    }

    // Yeni konu oluşturma API çağrısı burada yapılacak
    alert('Konu başarıyla oluşturuldu!');
    showPage('home');
}

// Sayfa yöneticisini başlat
const pageManager = new PageManager(); 