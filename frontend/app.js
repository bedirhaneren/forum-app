class PageManager {
    constructor() {
        // ! sınıf ilk calıstıgında calısır
        this.currentPage = 'home';  
        this.isLoggedIn = false;
        this.userInfo = null;
        this.editingPostId = null;
        this.init();
    }

    getEditPostPage() {
        if (!this.isLoggedIn) {
            return `
                <div class="container">
                    <h2>Erişim Reddedildi</h2>
                    <p>Bu sayfayı görüntülemek için giriş yapmalısınız.</p>
                    <button onclick=\"showPage('login')\" class=\"btn\">Giriş Yap</button>
                </div>
            `;
        }

        return `
            <div class=\"container\">
                <h2>Konuyu Düzenle</h2>
                <div class=\"new-topic-form\">
                    <input type=\"text\" id=\"edit-title\" placeholder=\"Konu başlığı\">
                    <select id=\"edit-category\">
                        <option value=\"\">Kategori seçin</option>
                        <option value=\"tech\">Teknoloji</option>
                        <option value=\"science\">Bilim</option>
                    </select>
                    <textarea id=\"edit-content\" placeholder=\"Konu içeriği\"></textarea>
                    <button onclick=\"handleUpdatePost()\">Güncelle</button>
                </div>
            </div>
        `;
    }

    async loadPostForEdit() {
        try {
            if (!this.editingPostId) {
                alert('Düzenlenecek gönderi bulunamadı.');
                this.showPage('my-topics');
                return;
            }

            const response = await fetch(`http://localhost:5000/posts/${this.editingPostId}`);
            if (!response.ok) {
                alert('Gönderi getirilemedi.');
                this.showPage('my-topics');
                return;
            }

            const post = await response.json();

            const titleInput = document.getElementById('edit-title');
            const categorySelect = document.getElementById('edit-category');
            const contentTextarea = document.getElementById('edit-content');

            if (titleInput && categorySelect && contentTextarea) {
                titleInput.value = post.title || '';
                categorySelect.value = post.category || '';
                contentTextarea.value = post.content || '';
            }
        } catch (error) {
            console.error('Düzenleme için post yükleme hatası:', error);
            alert('Bir hata oluştu.');
            this.showPage('my-topics');
        }
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
            const initials = (this.userInfo.email || '?').substring(0,1).toUpperCase();
            const userLabel = this.userInfo.email;
            nav.innerHTML = `
                <a href="#home" onclick="showPage('home')">Ana Sayfa</a>
                <a href="#categories" onclick="showPage('categories')">Kategoriler</a>
                <a href="#new-topic" onclick="showPage('new-topic')">Yeni Konu</a>
                <a href="#dashboard" onclick="showPage('dashboard')">Dashboard</a>
                <span id="nav-spacer"></span>
                <span id="nav-user"><span class="avatar">${initials}</span> ${userLabel}</span>
                <a href="#" onclick="handleLogout()" class="btn btn-logout">Çıkış Yap</a>
                <a href="#" id="theme-toggle" onclick="toggleTheme(); return false;" title="Tema Değiştir">🌗</a>
            `;
        } else {
            nav.innerHTML = `
                <a href="#home" onclick="showPage('home')">Ana Sayfa</a>
                <a href="#categories" onclick="showPage('categories')">Kategoriler</a>
                <a href="#new-topic" onclick="showPage('new-topic')">Yeni Konu</a>
                <a href="#login" onclick="showPage('login')">Giriş Yap</a>
                <a href="#register" onclick="showPage('register')" class="btn">Kayıt Ol</a>
                <span id="nav-spacer"></span>
                <a href="#" id="theme-toggle" onclick="toggleTheme(); return false;" title="Tema Değiştir">🌗</a>
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
        const hash = window.location.hash.slice(1);
        console.log('Hash değişti:', hash); // Debug için
        
        // show-post=ID formatı için özel işlem
        if (hash.startsWith('show-post=')) {
            console.log('Show-post sayfası açılıyor...'); // Debug için
            this.showPage('show-post');
            // currentPostId'yi güncelle ve detayları yükle
            const postId = window.location.hash.replace('#show-post=', '');
            if (postId) {
                this.currentPostId = postId;
                setTimeout(() => {
                    this.loadPostDetails();
                }, 100);
            }
            return;
        }
        
        const pageName = hash || 'home';
        console.log('Sayfa açılıyor:', pageName); // Debug için
        this.showPage(pageName);
    }

    showPage(pageName) {
        this.currentPage = pageName;
        
        // URL'i güncelle
        // Not: show-post sayfasında #show-post=ID formatını koru; hash'i ezme
        if (pageName === 'show-post') {
            if (!window.location.hash.startsWith('#show-post=')) {
                window.location.hash = 'show-post';
            }
        } else {
            if (window.location.hash !== `#${pageName}`) {
                window.location.hash = pageName;
            }
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

        if (pageName === 'edit-post' && this.isLoggedIn) {
            this.loadPostForEdit();
        }

        if (pageName === 'home') {
            this.loadHomePosts();
        }

        if (pageName === 'show-post') {
            // Post detayları showPost fonksiyonunda yükleniyor
            console.log('Show-post sayfası yüklendi');
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
            case 'edit-post':
                return this.getEditPostPage();
            case 'show-post':
                return this.getShowPostPage();
            default:
                return this.getHomePage();
        }
    }

  getHomePage() {
        if (this.isLoggedIn) {
            return `
                <div class="container">
                    <main>
                        <div class="content" id="home-container">
                            <div class="post">
                                <h3><a href="#">Hoş Geldiniz, ${this.userInfo.email}!</a></h3>
                                <p>MyForum'a hoş geldiniz. Tartışmalara katılmak için dashboard'ı kullanabilirsiniz.</p>
                                <div class="meta">Son güncelleme: Bugün</div>
                            </div>
                            <div id="posts-list">
                                <p>Konular yükleniyor...</p>
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
                        <div class="content" id="home-container">
                            <div class="post">
                                <h3><a href="#">Hoş Geldiniz!</a></h3>
                                <p>MyForum'a hoş geldiniz. Tartışmalara katılmak için giriş yapın.</p>
                                <div class="meta">Son güncelleme: Bugün</div>
                            </div>
                            <div id="posts-list">
                                <p>Konular yükleniyor...</p>
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

    getShowPostPage() {
        return `
            <div class="container">
                <div class="post-detail-container">
                    <div class="post-header">
                        <button onclick="showPage('home')" class="btn btn-back">← Ana Sayfaya Dön</button>
                        <h2 id="post-title">Konu yükleniyor...</h2>
                    </div>
                    <div class="post-meta" id="post-meta">
                        <p>Yükleniyor...</p>
                    </div>
                    <div class="post-content" id="post-content">
                        <p>İçerik yükleniyor...</p>
                    </div>
                    <div class="post-actions" id="post-actions">
                        <!-- Post sahibi ise düzenleme ve silme butonları burada görünecek -->
                    </div>
                    <div class="comments-section">
                        <h3>Yorumlar</h3>
                        <div id="comments-list">
                            <p>Yorumlar yükleniyor...</p>
                        </div>
                        ${this.isLoggedIn ? `
                            <div class="add-comment">
                                <h4>Yorum Ekle</h4>
                                <textarea id="comment-content" placeholder="Yorumunuzu yazın..."></textarea>
                                <button onclick="addComment()" class="btn">Yorum Ekle</button>
                            </div>
                        ` : `
                            <p>Yorum yapmak için <a href="#" onclick="showPage('login')">giriş yapın</a>.</p>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    async loadHomePosts() {
        try {
            const response = await fetch('http://localhost:5000/posts');
            if (response.ok) {
                const posts = await response.json();
                this.displayHomePosts(posts);
            } else {
                console.error('Ana sayfa konuları yüklenemedi');
                const postsList = document.getElementById('posts-list');
                if (postsList) {
                    postsList.innerHTML = '<p>Konular yüklenemedi.</p>';
                }
            }
        } catch (error) {
            console.error('Ana sayfa yükleme hatası:', error);
            const postsList = document.getElementById('posts-list');
            if (postsList) {
                postsList.innerHTML = '<p>Bir hata oluştu.</p>';
            }
        }
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
        } catch (response) {
            console.error('Hata:', error);
            document.getElementById('my-topics-list').innerHTML = '<p>Bir hata oluştu.</p>';
        }
    }

    async loadPostDetails() {
        try {
            console.log('loadPostDetails başladı');
            
            // Hash'ten post ID'yi al
            const hash = window.location.hash;
            console.log('Hash:', hash); // Debug için
            
            let postId;
            if (hash.startsWith('#show-post=')) {
                postId = hash.replace('#show-post=', '');
            } else if (hash.includes('=')) {
                postId = hash.split('=')[1];
            } else {
                // Hash'te = yoksa, hash'in kendisini kullan
                postId = hash.replace('#', '');
            }
            
            console.log('Post ID:', postId); // Debug için
            
            if (!postId || postId === 'show-post' || postId === '') {
                console.error('Post ID bulunamadı!');
                this.showPage('home');
                return;
            }

            // Yorum ve diğer işlemler için currentPostId'yi güncelle
            this.currentPostId = postId;

            console.log('Fetch başlıyor:', `http://localhost:5000/posts/${postId}`);
            
            // Post detaylarını yükle
            const response = await fetch(`http://localhost:5000/posts/${postId}`);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                console.error('Post bulunamadı! Status:', response.status);
                this.showPage('home');
                return;
            }

            const post = await response.json();
            console.log('Post alındı:', post);
            this.displayPostDetails(post);

            // Yorumları yükle
            this.loadComments(postId);

        } catch (error) {
            console.error('Post detayları yükleme hatası:', error);
            this.showPage('home');
        }
    }

     async loadPostDetailsDirect(postId) {
        try {
            console.log('loadPostDetailsDirect başladı, postId:', postId);
            
            if (!postId) {
                console.error('Post ID bulunamadı!');
                return;
            }

            // Yorum ve diğer işlemler için currentPostId'yi güncelle
            this.currentPostId = postId;

            console.log('Fetch başlıyor:', `http://localhost:5000/posts/${postId}`);
            
            // Post detaylarını yükle
            const response = await fetch(`http://localhost:5000/posts/${postId}`);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                console.error('Post bulunamadı! Status:', response.status);
                return;
            }

            const post = await response.json();
            console.log('Post alındı:', post);
            this.displayPostDetails(post);

            // Yorumları yükle
            this.loadComments(postId);

        } catch (error) {
            console.error('Post detayları yükleme hatası:', error);
        }
    }

    displayPostDetails(post) {
        console.log('displayPostDetails başladı, post:', post);
        
        // Post başlığı
        const titleElement = document.getElementById('post-title');
        console.log('titleElement:', titleElement);
        if (titleElement) {
            titleElement.textContent = post.title;
            console.log('Başlık güncellendi');
        }

        // Post meta bilgileri
        const metaElement = document.getElementById('post-meta');
        console.log('metaElement:', metaElement);
        if (metaElement) {
            metaElement.innerHTML = `
                <p>
                    <span class="category">${post.category}</span> • 
                    <span class="date">${new Date(post.createdAt).toLocaleDateString('tr-TR')}</span> • 
                    <span class="author">Yazar: ${post.authorUsername || 'Anonim'}</span>
                </p>
            `;
            console.log('Meta güncellendi');
        }

        // Post içeriği
        const contentElement = document.getElementById('post-content');
        console.log('contentElement:', contentElement);
        if (contentElement) {
            contentElement.innerHTML = `
                <div class="post-text">${post.content}</div>
            `;
            console.log('İçerik güncellendi');
        }

        // Post sahibi ise düzenleme ve silme butonları
        const actionsElement = document.getElementById('post-actions');
        console.log('actionsElement:', actionsElement);
        if (actionsElement && this.isLoggedIn && this.userInfo && this.userInfo.id === post.authorId) {
            actionsElement.innerHTML = `
                <button onclick="editPost('${post._id}')" class="btn btn-edit">Düzenle</button>
                <button onclick="deletePost('${post._id}')" class="btn btn-delete">Sil</button>
            `;
            console.log('Aksiyonlar güncellendi');
        } else if (actionsElement) {
            actionsElement.innerHTML = '';
            console.log('Aksiyonlar temizlendi');
        }
        
        console.log('displayPostDetails tamamlandı');
    }

    async loadComments(postId) {
        try {
            const response = await fetch(`http://localhost:5000/posts/${postId}/comments`);
            if (response.ok) {
                const comments = await response.json();
                this.displayComments(comments);
            } else {
                const commentsList = document.getElementById('comments-list');
                if (commentsList) {
                    commentsList.innerHTML = '<p>Yorumlar yüklenemedi.</p>';
                }
            }
        } catch (error) {
            console.error('Yorumlar yükleme hatası:', error);
            const commentsList = document.getElementById('comments-list');
            if (commentsList) {
                commentsList.innerHTML = '<p>Yorumlar yüklenirken bir hata oluştu.</p>';
            }
        }
    }

    displayComments(comments) {
        const commentsList = document.getElementById('comments-list');
        
        if (!commentsList) return;

        if (comments.length === 0) {
            commentsList.innerHTML = '<p>Henüz yorum yapılmamış.</p>';
            return;
        }

        const commentsHTML = comments.map(comment => `
            <div class="comment-item">
                <div class="comment-header">
                    <strong>${comment.authorUsername || 'Anonim'}</strong>
                    <span class="comment-date">${new Date(comment.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
                <div class="comment-content">${comment.content}</div>
            </div>
        `).join('');

        commentsList.innerHTML = commentsHTML;
    }

    displayHomePosts(posts) {
        const container = document.getElementById('posts-list');
        
        if (!container) {
            console.error('posts-list elementi bulunamadı');
            return;
        }
        
        if (posts.length === 0) {
            container.innerHTML = '<p>Henüz konu açılmamış.</p>';
            return;
        }

        // Modern kart ızgarası ve animasyonlu kartlar
        container.classList.add('cards-grid');

        const postsHTML = posts.map(post => `
            <article class="post-card reveal">
                <div class="post-card-header">
                    <a class="chip" href="#category=${post.category}" onclick="selectCategory('${post.category}'); return false;">${post.category}</a>
                    <h3 class="post-card-title"><a href="#show-post=${post._id}" onclick="showPost('${post._id}')">${post.title}</a></h3>
                    <div class="post-card-meta">
                        <span class="author">${post.authorUsername || 'Anonim'}</span>
                        <span class="dot">•</span>
                        <span class="date">${new Date(post.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>
                <div class="post-card-body">
                    <p class="post-excerpt">${post.content.substring(0, 200)}${post.content.length > 200 ? '...' : ''}</p>
                </div>
                <div class="post-card-footer">
                    <button class="btn btn-ghost" onclick="showPost('${post._id}')">Detayları Gör</button>
                </div>
            </article>
        `).join('');

        container.innerHTML = postsHTML;
    }

    displayMyTopics(posts) {
        const container = document.getElementById('my-topics-list');
        
        if (posts.length === 0) {
            container.innerHTML = '<p>Henüz konu açmamışsınız.</p>';
            return;
        }

        // Modern kartlar (Açtığım konular)
        const postsHTML = posts.map(post => `
            <article class="post-card reveal">
                <div class="post-card-header">
                    <a class="chip" href="#category=${post.category}" onclick="selectCategory('${post.category}'); return false;">${post.category}</a>
                    <h3 class="post-card-title"><a href="#show-post=${post._id}" onclick="showPost('${post._id}')">${post.title}</a></h3>
                    <div class="post-card-meta">
                        <span class="date">${new Date(post.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>
                <div class="post-card-body">
                    <p class="post-excerpt">${post.content.substring(0, 140)}${post.content.length > 140 ? '...' : ''}</p>
                </div>
                <div class="post-card-footer">
                    <button onclick="editPost('${post._id}')" class="btn btn-edit">Düzenle</button>
                    <button onclick="deletePost('${post._id}')" class="btn btn-delete">Sil</button>
                </div>
            </article>
        `).join('');

        container.innerHTML = postsHTML;
    }
}

// Global fonksiyonlar
function showPage(pageName) {
    pageManager.showPage(pageName);
}

async function fetchPosts(){
    try {
        const response = fetch("http://localhost:5000")
        if(!response.ok) throw new Error ("Postlar alınamadı") ;
        // ! response json değil response objesi dönüyor.


        const posts = (await response).json() ; 
        return posts  ;
     }


     catch(err) {
        console.error("Hata kodu : " , err) ; 
        return []; 
     }
}


async function renderHomePage() {
             const posts = await fetchPosts();
        if (!posts) throw new Error("Postlar yüklenemedi,") ;

        const container = document.getElementById('home-container'); 
        container.innerHTML = "" ; 
        
        posts.forEach(post => {
    const div = document.createElement("div");
    div.classList.add("post-card");
    div.innerHTML = `
        <h2>${post.title}</h2>
        <p>${post.content}</p>
        <small>Yazar: ${post.author || "Anonim"}</small>
        <hr>
    `;
    container.appendChild(div);
});



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
    if (!pageManager.isLoggedIn) {
        alert('Düzenlemek için giriş yapmalısınız.');
        showPage('login');
        return;
    }
    pageManager.editingPostId = postId;
    showPage('edit-post');
}

function handleUpdatePost() {
    if (!pageManager.isLoggedIn) {
        alert('Düzenlemek için giriş yapmalısınız.');
        showPage('login');
        return;
    }

    const title = document.getElementById('edit-title').value.trim();
    const category = document.getElementById('edit-category').value;
    const content = document.getElementById('edit-content').value.trim();

    if (!title || !category || !content) {
        alert('Lütfen tüm alanları doldurun!');
        return;
    }

    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/posts/${pageManager.editingPostId}` , {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, category, content })
    })
    .then(res => {
        if (res.ok) return res.json();
        return res.json().then(data => { throw new Error(data.message || 'Güncelleme başarısız'); });
    })
    .then(() => {
        alert('Gönderi güncellendi');
        showPage('my-topics');
    })
    .catch(err => {
        alert('Hata: ' + err.message);
    });
}

function deletePost(postId) {
    if (!pageManager.isLoggedIn) {
        alert('Silmek için giriş yapmalısınız.');
        showPage('login');
        return;
    }

    if (!confirm('Bu gönderiyi silmek istediğinizden emin misiniz?')) {
        return;
    }

    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/posts/${postId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => {
        if (res.ok) return res.json();
        return res.json().then(data => { throw new Error(data.message || 'Silme başarısız'); });
    })
    .then(() => {
        alert('Gönderi silindi');
        showPage('my-topics');
    })
    .catch(err => {
        alert('Hata: ' + err.message);
    });
}

function showPost(postId) {
    console.log('showPost çağrıldı, Post ID:', postId); // Debug için
    
    if (!postId) {
        alert('Post ID bulunamadı!');
        return;
    }
    
    // Post ID'yi global olarak sakla
    pageManager.currentPostId = postId;
    
    // Sayfayı göster
    showPage('show-post');
    
    // Post detaylarını hemen yükle
    setTimeout(() => {
        pageManager.loadPostDetailsDirect(postId);
    }, 200);
}

async function addComment() {
    if (!pageManager.isLoggedIn) {
        alert('Yorum yapmak için giriş yapmalısınız!');
        showPage('login');
        return;
    }

    const content = document.getElementById('comment-content').value.trim();
    if (!content) {
        alert('Lütfen yorum içeriği yazın!');
        return;
    }

    // Önce pageManager.currentPostId'yi kullan, yoksa hash'ten al
    let postId = pageManager.currentPostId;
    if (!postId) {
        const hash = window.location.hash;
        if (hash.startsWith('#show-post=')) {
            postId = hash.replace('#show-post=', '');
        } else if (hash.includes('=')) {
            postId = hash.split('=')[1];
        } else {
            postId = hash.replace('#', '');
        }
    }
    
    if (!postId || postId === 'show-post' || postId === '') {
        alert('Post ID bulunamadı!');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content })
        });

        const contentType = response.headers.get('content-type') || '';
        if (response.ok) {
            document.getElementById('comment-content').value = '';
            alert('Yorum başarıyla eklendi!');
            pageManager.loadComments(postId);
        } else if (contentType.includes('application/json')) {
            const data = await response.json();
            alert('Yorum ekleme hatası: ' + (data.message || 'Bilinmeyen hata'));
        } else {
            const text = await response.text();
            console.error('JSON olmayan hata yanıtı:', text);
            alert('Yorum ekleme hatası: Sunucu beklenmeyen yanıt döndü');
        }
    } catch (error) {
        console.error('Yorum ekleme hatası:', error);
        alert('Ağ hatası: ' + error.message);
    }
}

function handleLogout() {
    pageManager.logout();
}

const pageManager = new PageManager(); 