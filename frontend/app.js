class PageManager {
    constructor() {
        // ! sınıf ilk calıstıgında calısır
        this.currentPage = 'home';  
        this.isLoggedIn = false;
        this.userInfo = null;
        this.init();
    }

    init() {
        // Sayfa yuklendiginde url hangisiyse onu aciyor
        this.handleHashChange();
        
        // Hash değişimini dinliyor
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });

        // Giriş durumunu kontrol et
        this.checkLoginStatus();
    }

    checkLoginStatus() {
        const token = localStorage.getItem('token');
        if (token) {
            this.isLoggedIn = true;
            // jwt decode   
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                this.userInfo = {
                    id: payload.id,
                    email: payload.email
                };
                this.updateNavigation();
            } catch (error) {
                console.error('Token decode hatası:', error);
                this.logout();
            }
        }
    }

    updateNavigation() {
        const nav = document.querySelector('nav');
        if (this.isLoggedIn) {
            nav.innerHTML = `
                <a href="#home" onclick="showPage('home')">Ana Sayfa</a>
                <a href="#categories" onclick="showPage('categories')">Kategoriler</a>
                <a href="#new-topic" onclick="showPage('new-topic')">Yeni Konu</a>
                <a href="#dashboard" onclick="showPage('dashboard')">Dashboard</a>
                <a href="#" onclick="handleLogout()" class="btn btn-logout">Çıkış Yap</a>
            `;
        } else {
            nav.innerHTML = `
                <a href="#home" onclick="showPage('home')">Ana Sayfa</a>
                <a href="#categories" onclick="showPage('categories')">Kategoriler</a>
                <a href="#new-topic" onclick="showPage('new-topic')">Yeni Konu</a>
                <a href="#login" onclick="showPage('login')">Giriş Yap</a>
                <a href="#register" onclick="showPage('register')" class="btn">Kayıt Ol</a>
            `;
        }
        this.updateActiveNav(this.currentPage);
    }

    logout() {
        localStorage.removeItem('token');
        this.isLoggedIn = false;
        this.userInfo = null;
        this.updateNavigation();
        this.showPage('home');
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

        // Navigasyonu güncelle (giriş durumu değişmiş olabilir)
        this.updateNavigation();
        
        // Aktif nav linkini güncelle
        this.updateActiveNav(pageName);

        if (pageName === 'my-topics' && this.isLoggedIn) {
            this.loadMyTopics();
        }
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
            case 'dashboard':
                return this.getDashboardPage();
            case 'my-topics': 
                return this.getMyTopicsPage();
            default:
                return this.getHomePage();
        }
    }

    getHomePage() {
        if (this.isLoggedIn) {
            return `
                <div class="container">
                    <main>
                        <div class="content">
                            <div class="post">
                                <h3><a href="#">Hoş Geldiniz, ${this.userInfo.email}!</a></h3>
                                <p>MyForum'a hoş geldiniz. Tartışmalara katılmak için dashboard'ı kullanabilirsiniz.</p>
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
        } else {
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

    getDashboardPage() {
        if (!this.isLoggedIn) {
            return `
                <div class="container">
                    <h2>Erişim Reddedildi</h2>
                    <p>Bu sayfayı görüntülemek için giriş yapmalısınız.</p>
                    <button onclick="showPage('login')">Giriş Yap</button>
                </div>
            `;
        }

        return `
            <div class="container">
                <h2>Kullanıcı Dashboard</h2>
                <div class="dashboard-content">
                    <div class="user-info">
                        <h3>Kullanıcı Bilgileri</h3>
                        <p><strong>Email:</strong> ${this.userInfo.email}</p>
                        <p><strong>Kullanıcı ID:</strong> ${this.userInfo.id}</p>
                    </div>
                    
                    <div class="dashboard-actions">
                        <h3>Hızlı İşlemler</h3>
                        <button onclick="showPage('new-topic')" class="btn">Yeni Konu Aç</button>
                        <button onclick="showPage('categories')" class="btn">Kategorileri Görüntüle</button>
                        <button onclick = "showPage('my-topics')" class = "btn"> Açtığım Konuları Görüntüle</button>
                        
                    </div>
                    
                    <div class="recent-activity">
                        <h3>Son Aktiviteler</h3>
                        <p>Henüz aktivite bulunmuyor.</p>
                    </div>
                </div>
            </div>
        `;
    }

    getMyTopicsPage() {
        if (!this.isLoggedIn) {
            return `
                <div class="container">
                    <h2>Erişim Reddedildi</h2>
                    <p>Bu sayfayı görüntülemek için giriş yapmalısınız.</p>
                    <button onclick="showPage('login')" class="btn">Giriş Yap</button>
                </div>
            `;
        }

        return `
            <div class="container">
                <h2>Açtığım Konular</h2>
                <div id="my-topics-list">
                    <p>Konular yükleniyor...</p>
                </div>
            </div>
        `;
    }

    async loadMyTopics() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/posts/my-posts', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const posts = await response.json();
                this.displayMyTopics(posts);
            } else {
                console.error('Konular yüklenemedi');
                document.getElementById('my-topics-list').innerHTML = '<p>Konular yüklenemedi.</p>';
            }
        } catch (error) {
            console.error('Hata:', error);
            document.getElementById('my-topics-list').innerHTML = '<p>Bir hata oluştu.</p>';
        }
    }

    displayMyTopics(posts) {
        const container = document.getElementById('my-topics-list');
        
        if (posts.length === 0) {
            container.innerHTML = '<p>Henüz konu açmamışsınız.</p>';
            return;
        }

        const postsHTML = posts.map(post => `
            <div class="post-item">
                <h3><a href="#" onclick="showPost('${post._id}')">${post.title}</a></h3>
                <p class="post-meta">
                    <span class="category">${post.category}</span> • 
                    <span class="date">${new Date(post.createdAt).toLocaleDateString('tr-TR')}</span>
                </p>
                <p class="post-excerpt">${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}</p>
                <div class="post-actions">
                    <button onclick="editPost('${post._id}')" class="btn btn-edit">Düzenle</button>
                    <button onclick="deletePost('${post._id}')" class="btn btn-delete">Sil</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = postsHTML;
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
                
                    pageManager.checkLoginStatus();
                    alert("Giriş başarılı!");
                    showPage('dashboard');
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
    if (!pageManager.isLoggedIn) {
        alert('Yeni konu oluşturmak için giriş yapmalısınız!');
        showPage('login');
        return;
    }

    const title = document.getElementById('topic-title').value.trim();
    const category = document.getElementById('topic-category').value;
    const content = document.getElementById('topic-content').value.trim();

    if (!title || !category || !content) {
        alert('Lütfen tüm alanları doldurun!');
        return;
    }

    console.log("Topic bilgileri : ", {title, category, content})  ;
    
    const token = localStorage.getItem('token');
    
    fetch("http://localhost:5000/posts",{
        method: 'POST' ,
        headers : {
            'Content-Type' : 'application/json',
            'Authorization': `Bearer ${token}`
        }, 
        body: JSON.stringify({title, category, content}) 
    })
    .then (res => {
        if (res.ok) {
            return res.json().then(data => { 
                alert('Konu başarıyla oluşturuldu!');
                document.getElementById('topic-title').value = '';
                document.getElementById('topic-category').value = '';
                document.getElementById('topic-content').value = '';
                showPage('home');
            } );
        }
        else{
            return res.json().then(data=> {
                alert('Konu oluşturma hatası: ' + (data.message || 'Bilinmeyen hata'));
                console.error('Post oluşturma hatası:', data);
            })
        }
    })
    .catch(error => {
        console.error('Fetch hatası:', error);
        alert('Ağ hatası: ' + error.message);
    }); 

}
function editPost(postId) {
            if (!this.isLoggedIn) {
            return `
                <div class="container">
                    <h2>Erişim Reddedildi</h2>
                    <p>Bu sayfayı görüntülemek için giriş yapmalısınız.</p>
                    <button onclick="showPage('login')" class="btn">Giriş Yap</button>
                </div>
            `;
        }


                return `
            <div class="container">
                <h2>Konuyu düzenle</h2>
                <div id="edit-topics">
                    <p>Konu yükleniyor...</p>
                </div>
            </div>
        `;
}

function handleLogout() {
    pageManager.logout();
}

const pageManager = new PageManager(); 