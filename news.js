
        const API_KEY = CONFIG.API_KEY
        const API_URL = 'https://newsapi.org/v2'

        let currentCategory = 'general'
        let currentArticles = []
        let bookmarks = JSON.parse(localStorage.getItem('newsBookmarks')) || [];

        // Event listeners
        document.getElementById('searchBtn').addEventListener('click', searchNews);
        document.getElementById('searchInput').addEventListener('keypress', function(e){
            if(e.key === 'Enter'){
                searchNews();
            }
        })

        document.getElementById('clearBookmarks').addEventListener('click', clearBookmarks);

        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', function(e){
                document.querySelector('.category-btn.active').classList.remove('active');
                e.target.classList.add('active');
                currentCategory = e.target.dataset.category;
                loadNews(); // FIXED: Was "laodNews()"
            })
        })

        // Initialize app
        loadNews();
        displayBookmarks();

        function loadNews(){
            if(currentCategory === ''){
                showError("Please select a category");
                return;
            }
            
            showLoading();

            const url = `${API_URL}/top-headlines?country=us&category=${currentCategory}&apiKey=${API_KEY}`;

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    hideLoading();

                    if(data.error || data.status !== 'ok'){
                        showError('Failed to load news. Using demo data instead.');
                        const demoNews = getDemoNews();
                        currentArticles = demoNews;
                        displayNews(demoNews);
                    }
                    else{
                        currentArticles = data.articles;
                        displayNews(data.articles);
                    }
                })
                .catch(error => {
                    hideLoading();
                    showError('Network error. Using demo data instead.');
                    const demoNews = getDemoNews();
                    currentArticles = demoNews;
                    displayNews(demoNews);
                })
        }

        function searchNews(){
            const query = document.getElementById('searchInput').value.trim();

            if(query === ''){
                showError("Please enter a search term");
                return;
            }

            showLoading();

            const url = `${API_URL}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&apiKey=${API_KEY}`;

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    hideLoading();

                    if(data.error || data.status !== 'ok'){
                        showError("Search failed. Searching in demo data instead.");
                        const demoNews = getDemoNews();
                        const filteredNews = demoNews.filter(article =>
                            article.title.toLowerCase().includes(query.toLowerCase()) ||
                            (article.description && article.description.toLowerCase().includes(query.toLowerCase()))
                        );
                        currentArticles = filteredNews;
                        displayNews(filteredNews);
                    }
                    else{
                        currentArticles = data.articles;
                        displayNews(data.articles);
                    }
                })
                .catch(error => {
                    hideLoading();
                    showError('Network error. Searching in demo data instead.');
                    const demoNews = getDemoNews();
                    const filteredNews = demoNews.filter(article => 
                        article.title.toLowerCase().includes(query.toLowerCase()) ||
                        (article.description && article.description.toLowerCase().includes(query.toLowerCase()))
                    );
                    currentArticles = filteredNews;
                    displayNews(filteredNews);
                });
        }

        function displayNews(articles){
            const container = document.getElementById('newsContainer')
            container.innerHTML = ''

            if(articles.length === 0){
                container.innerHTML = '<p style="text-align: center; color: white; font-size: 1.2rem;">No articles found.</p>';
                return;
            }

            articles.forEach((article, index) => {
                const isBookmarked = bookmarks.some(bookmark => bookmark.title === article.title);
                const articleCard = createArticleCard(article, index, isBookmarked);
                container.appendChild(articleCard);
            })

            document.getElementById('newsContainer').style.display = 'grid'
            document.getElementById('error').style.display = 'none'
        }

        function createArticleCard(article, index, isBookmarked = false){
            const card = document.createElement('div');
            card.className = 'news-card';
            card.innerHTML = `<button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" onclick="toggleBookmark(${index}, this)">
                    ${isBookmarked ? '❤️' : '🤍'}
                </button>
                <img src="${article.urlToImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop'}" 
                     alt="News Image" class="news-image" 
                     onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop'">
                <div class="news-content">
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-description">${article.description || 'No description available.'}</p>
                    <div class="news-meta">
                        <span class="news-source">${article.source.name}</span>
                        <span class="news-date">${formatDate(article.publishedAt)}</span>
                    </div>
                </div>`;

                card.addEventListener('click', function(e){
                    if(!e.target.classList.contains('bookmark-btn')){
                        window.open(article.url, '_blank');
                    }
                })

                return card;
        }

        function toggleBookmark(index, button){
            const article = currentArticles[index]
            if(!article) return

            const bookmarkIndex = bookmarks.findIndex(bookmark => bookmark.title === article.title);

            if (bookmarkIndex > -1) {
                bookmarks.splice(bookmarkIndex, 1);
                button.classList.remove('bookmarked');
                button.innerHTML = '🤍';
            } 
            else{
                bookmarks.push(article);
                button.classList.add('bookmarked');
                button.innerHTML = '❤️';
            }
            
            localStorage.setItem('newsBookmarks', JSON.stringify(bookmarks));
            displayBookmarks();
        }

        function displayBookmarks() {
            const container = document.getElementById('bookmarksContainer');
            container.innerHTML = '';

            if (bookmarks.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7); font-style: italic;">No bookmarked articles yet.</p>';
                return;
            }

            bookmarks.forEach((article, index) => {
                const articleCard = createBookmarkCard(article, index);
                container.appendChild(articleCard);
            });
        }

        function createBookmarkCard(article, index) {
            const card = document.createElement('div');
            card.className = 'news-card';
            card.innerHTML = `
                <button class="bookmark-btn bookmarked" onclick="removeBookmark(${index})">
                    ❌
                </button>
                <img src="${article.urlToImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop'}" 
                     alt="News Image" class="news-image"
                     onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=200&fit=crop'">
                <div class="news-content">
                    <h3 class="news-title">${article.title}</h3>
                    <p class="news-description">${article.description || 'No description available.'}</p>
                    <div class="news-meta">
                        <span class="news-source">${article.source.name}</span>
                        <span class="news-date">${formatDate(article.publishedAt)}</span>
                    </div>
                </div>
            `;

            card.addEventListener('click', function(e) {
                if (!e.target.classList.contains('bookmark-btn')) {
                    window.open(article.url, '_blank');
                }
            });

            return card;
        }

        function removeBookmark(index) {
            bookmarks.splice(index, 1);
            localStorage.setItem('newsBookmarks', JSON.stringify(bookmarks));
            displayBookmarks();
            // Refresh main news to update bookmark buttons
            if (currentArticles.length > 0) {
                displayNews(currentArticles);
            }
        }

        function clearBookmarks() {
            bookmarks = [];
            localStorage.removeItem('newsBookmarks');
            displayBookmarks();
            // Refresh main news to update bookmark buttons
            if (currentArticles.length > 0) {
                displayNews(currentArticles);
            }
        }

        function showLoading(){
            document.getElementById('loading').style.display = 'block'
            document.getElementById('newsContainer').style.display = 'none'
            document.getElementById('error').style.display = 'none'
        }

        function hideLoading(){
            document.getElementById('loading').style.display = 'none'
        }

        function showError(message){
            document.getElementById('error').textContent = message
            document.getElementById('error').style.display = 'block'
            document.getElementById('newsContainer').style.display = 'none'
        }

        function formatDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
            
            if (diffHours < 24) {
                return `${diffHours}h ago`;
            } else {
                const diffDays = Math.ceil(diffHours / 24);
                return `${diffDays}d ago`;
            }
        }

        function getDemoNews() {
            return [
                {
                    title: "Revolutionary AI Technology Transforms Healthcare Industry",
                    description: "New artificial intelligence systems are helping doctors diagnose diseases faster and more accurately than ever before.",
                    urlToImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=200&fit=crop",
                    source: { name: "Tech Today" },
                    publishedAt: new Date().toISOString(),
                    url: "#"
                },
                {
                    title: "Climate Change Summit Reaches Historic Agreement",
                    description: "World leaders unite on ambitious new climate targets, promising significant reduction in carbon emissions by 2030.",
                    urlToImage: "https://images.unsplash.com/photo-1569163139394-de44cb62e81b?w=400&h=200&fit=crop",
                    source: { name: "Global News" },
                    publishedAt: new Date(Date.now() - 3600000).toISOString(),
                    url: "#"
                },
                {
                    title: "Space Exploration Mission Discovers New Exoplanet",
                    description: "Scientists celebrate the discovery of a potentially habitable planet located 100 light-years from Earth.",
                    urlToImage: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=200&fit=crop",
                    source: { name: "Space Daily" },
                    publishedAt: new Date(Date.now() - 7200000).toISOString(),
                    url: "#"
                },
                {
                    title: "Breakthrough in Renewable Energy Storage",
                    description: "New battery technology promises to solve the storage problem for solar and wind energy systems.",
                    urlToImage: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=200&fit=crop",
                    source: { name: "Energy Weekly" },
                    publishedAt: new Date(Date.now() - 10800000).toISOString(),
                    url: "#"
                },
                {
                    title: "Major Economic Recovery Shows Positive Trends",
                    description: "Markets show strong growth as unemployment rates drop to lowest levels in five years.",
                    urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop",
                    source: { name: "Financial Times" },
                    publishedAt: new Date(Date.now() - 14400000).toISOString(),
                    url: "#"
                },
                {
                    title: "Medical Breakthrough in Cancer Treatment",
                    description: "New immunotherapy treatment shows promising results in clinical trials, offering hope to patients worldwide.",
                    urlToImage: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=200&fit=crop",
                    source: { name: "Health News" },
                    publishedAt: new Date(Date.now() - 18000000).toISOString(),
                    url: "#"
                }
            ];
        }