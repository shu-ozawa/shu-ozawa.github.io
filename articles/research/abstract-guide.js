// ===== DOM要素の取得 =====
const navigation = document.getElementById('navigation');
const navToggle = document.getElementById('navToggle');
const navContent = document.getElementById('navContent');
const tableOfContents = document.getElementById('tableOfContents');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const searchResults = document.getElementById('searchResults');
const searchResultsContent = document.getElementById('searchResultsContent');
const closeSearch = document.getElementById('closeSearch');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', function() {
    generateTableOfContents();
    setupScrollProgress();
    setupSearch();
    setupNavigation();
    setupSmoothScrolling();
    setupActiveSection();
    
    // 初期の進捗更新
    updateScrollProgress();
});

// ===== 目次の自動生成 =====
function generateTableOfContents() {
    const sections = document.querySelectorAll('.section');
    const tocList = document.getElementById('tableOfContents');
    
    sections.forEach((section, index) => {
        const sectionId = section.id;
        const sectionTitle = section.querySelector('h2');
        const subsections = section.querySelectorAll('.subsection');
        
        if (sectionTitle) {
            // メインセクションのリンク
            const mainLi = document.createElement('li');
            const mainLink = document.createElement('a');
            mainLink.href = `#${sectionId}`;
            mainLink.textContent = sectionTitle.textContent;
            mainLink.className = 'toc-main-link';
            mainLink.addEventListener('click', handleTocClick);
            mainLi.appendChild(mainLink);
            
            // サブセクションのリンク
            if (subsections.length > 0) {
                const subList = document.createElement('ul');
                subList.className = 'toc-sub-list';
                
                subsections.forEach(subsection => {
                    const subsectionId = subsection.id;
                    const subsectionTitle = subsection.querySelector('h3');
                    
                    if (subsectionTitle && subsectionId) {
                        const subLi = document.createElement('li');
                        const subLink = document.createElement('a');
                        subLink.href = `#${subsectionId}`;
                        subLink.textContent = subsectionTitle.textContent;
                        subLink.className = 'toc-sub-link subsection-link';
                        subLink.addEventListener('click', handleTocClick);
                        subLi.appendChild(subLink);
                        subList.appendChild(subLi);
                    }
                });
                
                mainLi.appendChild(subList);
            }
            
            tocList.appendChild(mainLi);
        }
    });
}

// ===== 目次クリックハンドラー =====
function handleTocClick(e) {
    e.preventDefault();
    const targetId = e.target.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
        targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        // モバイルでナビゲーションを閉じる
        if (window.innerWidth <= 768) {
            navigation.classList.remove('active');
        }
    }
}

// ===== スクロール進捗の設定 =====
function setupScrollProgress() {
    window.addEventListener('scroll', updateScrollProgress);
    window.addEventListener('resize', updateScrollProgress);
}

function updateScrollProgress() {
    const mainContent = document.querySelector('.main-content');
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / scrollHeight) * 100;
    
    if (progressBar && progressText) {
        progressBar.style.width = `${Math.min(scrollPercent, 100)}%`;
        progressText.textContent = `${Math.round(Math.min(scrollPercent, 100))}%`;
    }
}

// ===== 検索機能の設定 =====
function setupSearch() {
    if (searchButton) {
        searchButton.addEventListener('click', performSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // リアルタイム検索（デバウンス付き）
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (searchInput.value.trim().length > 2) {
                    performSearch();
                } else if (searchInput.value.trim().length === 0) {
                    closeSearchResults();
                }
            }, 300);
        });
    }
    
    if (closeSearch) {
        closeSearch.addEventListener('click', closeSearchResults);
    }
    
    // 検索結果エリア外クリックで閉じる
    document.addEventListener('click', function(e) {
        if (searchResults && !searchResults.contains(e.target) && 
            !searchInput.contains(e.target) && !searchButton.contains(e.target)) {
            closeSearchResults();
        }
    });
}

function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (query.length < 2) return;
    
    const results = searchContent(query);
    displaySearchResults(results, query);
}

function searchContent(query) {
    const results = [];
    const sections = document.querySelectorAll('.section');
    
    sections.forEach(section => {
        const sectionTitle = section.querySelector('h2');
        const sectionId = section.id;
        
        if (sectionTitle) {
            const sectionTitleText = sectionTitle.textContent.toLowerCase();
            
            // セクションタイトルでの検索
            if (sectionTitleText.includes(query)) {
                results.push({
                    type: 'section',
                    title: sectionTitle.textContent,
                    id: sectionId,
                    excerpt: getExcerpt(section, query),
                    relevance: 10
                });
            }
            
            // サブセクションでの検索
            const subsections = section.querySelectorAll('.subsection');
            subsections.forEach(subsection => {
                const subsectionTitle = subsection.querySelector('h3');
                const subsectionId = subsection.id;
                
                if (subsectionTitle && subsectionId) {
                    const subsectionTitleText = subsectionTitle.textContent.toLowerCase();
                    
                    if (subsectionTitleText.includes(query)) {
                        results.push({
                            type: 'subsection',
                            title: subsectionTitle.textContent,
                            id: subsectionId,
                            excerpt: getExcerpt(subsection, query),
                            relevance: 8
                        });
                    }
                }
            });
            
            // コンテンツ内での検索
            const contentBlocks = section.querySelectorAll('.content-block');
            contentBlocks.forEach(block => {
                const blockText = block.textContent.toLowerCase();
                if (blockText.includes(query)) {
                    const parentSubsection = block.closest('.subsection');
                    const parentTitle = parentSubsection ? 
                        parentSubsection.querySelector('h3')?.textContent : 
                        sectionTitle.textContent;
                    const parentId = parentSubsection ? 
                        parentSubsection.id : 
                        sectionId;
                    
                    results.push({
                        type: 'content',
                        title: parentTitle,
                        id: parentId,
                        excerpt: getExcerpt(block, query),
                        relevance: 5
                    });
                }
            });
        }
    });
    
    // 関連度でソート
    return results.sort((a, b) => b.relevance - a.relevance).slice(0, 10);
}

function getExcerpt(element, query) {
    const text = element.textContent;
    const lowerText = text.toLowerCase();
    const queryIndex = lowerText.indexOf(query.toLowerCase());
    
    if (queryIndex === -1) return text.substring(0, 150) + '...';
    
    const start = Math.max(0, queryIndex - 50);
    const end = Math.min(text.length, queryIndex + query.length + 50);
    
    let excerpt = text.substring(start, end);
    if (start > 0) excerpt = '...' + excerpt;
    if (end < text.length) excerpt = excerpt + '...';
    
    return excerpt;
}

function displaySearchResults(results, query) {
    if (!searchResults || !searchResultsContent) return;
    
    searchResultsContent.innerHTML = '';
    
    if (results.length === 0) {
        searchResultsContent.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 2rem;">検索結果が見つかりませんでした。</p>';
    } else {
        results.forEach(result => {
            const resultElement = document.createElement('div');
            resultElement.className = 'search-result-item';
            resultElement.addEventListener('click', () => {
                scrollToElement(result.id);
                closeSearchResults();
            });
            
            const titleElement = document.createElement('div');
            titleElement.className = 'search-result-title';
            titleElement.textContent = result.title;
            
            const excerptElement = document.createElement('div');
            excerptElement.className = 'search-result-excerpt';
            excerptElement.innerHTML = highlightQuery(result.excerpt, query);
            
            resultElement.appendChild(titleElement);
            resultElement.appendChild(excerptElement);
            searchResultsContent.appendChild(resultElement);
        });
    }
    
    searchResults.classList.add('active');
}

function highlightQuery(text, query) {
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function closeSearchResults() {
    if (searchResults) {
        searchResults.classList.remove('active');
    }
}

function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// ===== ナビゲーション機能の設定 =====
function setupNavigation() {
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navigation.classList.toggle('active');
        });
    }
    
    // ナビゲーション外クリックで閉じる（モバイル）
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && navigation && 
            !navigation.contains(e.target) && !navToggle.contains(e.target)) {
            navigation.classList.remove('active');
        }
    });
    
    // ウィンドウリサイズ時の処理
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navigation.classList.remove('active');
        }
    });
}

// ===== スムーズスクロールの設定 =====
function setupSmoothScrolling() {
    // 全てのアンカーリンクにスムーズスクロールを適用
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===== アクティブセクションの設定 =====
function setupActiveSection() {
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                updateActiveNavLink(entry.target.id);
            }
        });
    }, observerOptions);
    
    // 全てのセクションとサブセクションを監視
    document.querySelectorAll('.section, .subsection').forEach(section => {
        if (section.id) {
            observer.observe(section);
        }
    });
}

function updateActiveNavLink(activeId) {
    // 全てのナビゲーションリンクからactiveクラスを削除
    document.querySelectorAll('.toc a').forEach(link => {
        link.classList.remove('active');
    });
    
    // アクティブなリンクにactiveクラスを追加
    const activeLink = document.querySelector(`.toc a[href="#${activeId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
        
        // 親セクションのリンクもアクティブにする（サブセクションの場合）
        if (activeLink.classList.contains('subsection-link')) {
            const parentSection = activeLink.closest('li').parentElement.previousElementSibling;
            if (parentSection && parentSection.tagName === 'A') {
                parentSection.classList.add('active');
            }
        }
    }
}

// ===== チェックリスト機能 =====
function setupChecklist() {
    const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        // ローカルストレージから状態を復元
        const checkboxId = generateCheckboxId(checkbox);
        const savedState = localStorage.getItem(`checklist_${checkboxId}`);
        if (savedState === 'true') {
            checkbox.checked = true;
        }
        
        // チェック状態の変更を監視
        checkbox.addEventListener('change', function() {
            const checkboxId = generateCheckboxId(this);
            localStorage.setItem(`checklist_${checkboxId}`, this.checked);
        });
    });
}

function generateCheckboxId(checkbox) {
    const section = checkbox.closest('.section');
    const sectionId = section ? section.id : 'unknown';
    const text = checkbox.parentElement.textContent.trim().substring(0, 20);
    return `${sectionId}_${text.replace(/\s+/g, '_')}`;
}

// ===== キーボードショートカット =====
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + F で検索フォーカス
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Escape で検索結果を閉じる
        if (e.key === 'Escape') {
            closeSearchResults();
            if (window.innerWidth <= 768) {
                navigation.classList.remove('active');
            }
        }
        
        // Ctrl/Cmd + K で検索フォーカス（GitHub風）
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
    });
}

// ===== 印刷機能 =====
function setupPrintFunction() {
    // 印刷ボタンがあれば設定
    const printButton = document.getElementById('printButton');
    if (printButton) {
        printButton.addEventListener('click', function() {
            window.print();
        });
    }
    
    // Ctrl/Cmd + P での印刷前処理
    window.addEventListener('beforeprint', function() {
        // 検索結果を閉じる
        closeSearchResults();
        // ナビゲーションを閉じる
        if (navigation) {
            navigation.classList.remove('active');
        }
    });
}

// ===== ダークモード切り替え（オプション） =====
function setupDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        // ローカルストレージから設定を復元
        const savedDarkMode = localStorage.getItem('darkMode');
        if (savedDarkMode === 'true') {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        }
        
        darkModeToggle.addEventListener('change', function() {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', this.checked);
        });
    }
}

// ===== パフォーマンス最適化 =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// ===== エラーハンドリング =====
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
    // 本番環境では適切なエラー報告を実装
});

// ===== 追加の初期化 =====
document.addEventListener('DOMContentLoaded', function() {
    setupChecklist();
    setupKeyboardShortcuts();
    setupPrintFunction();
    setupDarkMode();
    
    // パフォーマンス最適化されたスクロールイベント
    const debouncedScrollProgress = debounce(updateScrollProgress, 10);
    window.addEventListener('scroll', debouncedScrollProgress);
    
    // 読み込み完了の表示
    console.log('アブストラクト作成ガイドが正常に読み込まれました。');
});

// ===== ユーティリティ関数 =====
function getElementOffset(element) {
    const rect = element.getBoundingClientRect();
    return {
        top: rect.top + window.pageYOffset,
        left: rect.left + window.pageXOffset
    };
}

function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// ===== 外部API（将来の拡張用） =====
window.AbstractGuide = {
    scrollToSection: scrollToElement,
    search: performSearch,
    toggleNavigation: function() {
        if (navigation) {
            navigation.classList.toggle('active');
        }
    },
    getProgress: function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        return (scrollTop / scrollHeight) * 100;
    }
};

