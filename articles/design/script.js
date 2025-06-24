// ===== DOM要素の取得 =====
const navToggle = document.getElementById('navToggle');
const navigation = document.getElementById('navigation');
const overlay = document.getElementById('overlay');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const tocLinks = document.querySelectorAll('.toc-link');
const sections = document.querySelectorAll('.section');

// ===== ユーティリティ関数 =====

/**
 * 要素が画面内に表示されているかチェック
 */
function isElementInViewport(element, threshold = 0.3) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const elementHeight = rect.bottom - rect.top;
    const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
    return visibleHeight / elementHeight >= threshold;
}

/**
 * スムーズスクロール
 */
function smoothScrollTo(target, offset = 0) {
    const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
    if (!targetElement) return;
    
    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

/**
 * デバウンス関数
 */
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

/**
 * スロットル関数
 */
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

// ===== モバイルナビゲーション =====

/**
 * モバイルメニューの開閉
 */
function toggleMobileMenu() {
    const isActive = navigation.classList.contains('active');
    
    if (isActive) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

/**
 * モバイルメニューを開く
 */
function openMobileMenu() {
    navigation.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // アクセシビリティ
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'メニューを閉じる');
    
    // ハンバーガーアイコンのアニメーション
    const spans = navToggle.querySelectorAll('span');
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
}

/**
 * モバイルメニューを閉じる
 */
function closeMobileMenu() {
    navigation.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // アクセシビリティ
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'メニューを開く');
    
    // ハンバーガーアイコンのリセット
    const spans = navToggle.querySelectorAll('span');
    spans[0].style.transform = '';
    spans[1].style.opacity = '';
    spans[2].style.transform = '';
}

// ===== スクロール進捗 =====

/**
 * 読書進捗を更新
 */
function updateReadingProgress() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(Math.max((scrollTop / scrollHeight) * 100, 0), 100);
    
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}%`;
}

// ===== アクティブセクション管理 =====

/**
 * 現在表示されているセクションを特定
 */
function getCurrentSection() {
    let currentSection = null;
    
    sections.forEach(section => {
        if (isElementInViewport(section, 0.3)) {
            currentSection = section;
        }
    });
    
    return currentSection;
}

/**
 * ナビゲーションのアクティブ状態を更新
 */
function updateActiveNavigation() {
    const currentSection = getCurrentSection();
    
    tocLinks.forEach(link => {
        link.classList.remove('active');
        const targetSection = link.getAttribute('data-section');
        
        if (currentSection && currentSection.id === targetSection) {
            link.classList.add('active');
        }
    });
}

// ===== 検索機能 =====

/**
 * コンテンツ内検索
 */
function searchContent(query) {
    if (!query.trim()) {
        clearSearchHighlights();
        return;
    }
    
    clearSearchHighlights();
    
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const walker = document.createTreeWalker(
        document.querySelector('.main-content'),
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    const textNodes = [];
    let node;
    
    while (node = walker.nextNode()) {
        if (node.parentElement.tagName !== 'SCRIPT' && 
            node.parentElement.tagName !== 'STYLE' &&
            !node.parentElement.classList.contains('search-highlight')) {
            textNodes.push(node);
        }
    }
    
    let matchCount = 0;
    textNodes.forEach(textNode => {
        const text = textNode.textContent;
        if (regex.test(text)) {
            const highlightedText = text.replace(regex, '<mark class="search-highlight">$&</mark>');
            const wrapper = document.createElement('span');
            wrapper.innerHTML = highlightedText;
            textNode.parentNode.replaceChild(wrapper, textNode);
            matchCount += (text.match(regex) || []).length;
        }
    });
    
    // 最初の検索結果にスクロール
    if (matchCount > 0) {
        const firstMatch = document.querySelector('.search-highlight');
        if (firstMatch) {
            smoothScrollTo(firstMatch, 100);
        }
    }
    
    return matchCount;
}

/**
 * 検索ハイライトをクリア
 */
function clearSearchHighlights() {
    const highlights = document.querySelectorAll('.search-highlight');
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
    });
}

// ===== キーボードナビゲーション =====

/**
 * キーボードショートカット
 */
function handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + K で検索フォーカス
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        searchInput.focus();
        searchInput.select();
    }
    
    // Escape でモバイルメニューを閉じる
    if (event.key === 'Escape') {
        if (navigation.classList.contains('active')) {
            closeMobileMenu();
        }
        // 検索フォーカスを外す
        if (document.activeElement === searchInput) {
            searchInput.blur();
        }
    }
    
    // Enter で検索実行
    if (event.key === 'Enter' && document.activeElement === searchInput) {
        event.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            searchContent(query);
        }
    }
}

// ===== アニメーション =====

/**
 * 要素の表示アニメーション
 */
function animateOnScroll() {
    const animatedElements = document.querySelectorAll('.card, .highlight-box, .component-demo');
    
    animatedElements.forEach(element => {
        if (isElementInViewport(element, 0.1) && !element.classList.contains('animated')) {
            element.classList.add('animated');
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
}

/**
 * アニメーション用のスタイルを初期化
 */
function initializeAnimations() {
    const animatedElements = document.querySelectorAll('.card, .highlight-box, .component-demo');
    
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
}

// ===== フォーム機能 =====

/**
 * チェックリストの状態管理
 */
function initializeChecklist() {
    const checkboxes = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        // ローカルストレージから状態を復元
        const savedState = localStorage.getItem(`checklist-${checkbox.id}`);
        if (savedState === 'true') {
            checkbox.checked = true;
        }
        
        // 状態変更時にローカルストレージに保存
        checkbox.addEventListener('change', () => {
            localStorage.setItem(`checklist-${checkbox.id}`, checkbox.checked);
            updateChecklistProgress();
        });
    });
    
    updateChecklistProgress();
}

/**
 * チェックリストの進捗を更新
 */
function updateChecklistProgress() {
    const categories = document.querySelectorAll('.checklist-category');
    
    categories.forEach(category => {
        const checkboxes = category.querySelectorAll('input[type="checkbox"]');
        const checkedBoxes = category.querySelectorAll('input[type="checkbox"]:checked');
        const progress = checkboxes.length > 0 ? (checkedBoxes.length / checkboxes.length) * 100 : 0;
        
        // 進捗バーがあれば更新（将来の拡張用）
        const progressBar = category.querySelector('.category-progress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    });
}

// ===== ツールチップ =====

/**
 * ツールチップの初期化
 */
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
        element.addEventListener('focus', showTooltip);
        element.addEventListener('blur', hideTooltip);
    });
}

/**
 * ツールチップを表示
 */
function showTooltip(event) {
    const element = event.target;
    const tooltipText = element.getAttribute('data-tooltip');
    
    if (!tooltipText) return;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = tooltipText;
    tooltip.style.position = 'absolute';
    tooltip.style.background = 'var(--color-text-primary)';
    tooltip.style.color = 'white';
    tooltip.style.padding = 'var(--spacing-sm) var(--spacing-md)';
    tooltip.style.borderRadius = 'var(--radius-sm)';
    tooltip.style.fontSize = 'var(--font-size-xs)';
    tooltip.style.zIndex = '1000';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.3s ease';
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
    
    // アニメーション
    requestAnimationFrame(() => {
        tooltip.style.opacity = '1';
    });
    
    element._tooltip = tooltip;
}

/**
 * ツールチップを非表示
 */
function hideTooltip(event) {
    const element = event.target;
    const tooltip = element._tooltip;
    
    if (tooltip) {
        tooltip.style.opacity = '0';
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }, 300);
        delete element._tooltip;
    }
}

// ===== パフォーマンス最適化 =====

/**
 * 画像の遅延読み込み
 */
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        // フォールバック
        images.forEach(img => {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
        });
    }
}

// ===== イベントリスナーの設定 =====

/**
 * すべてのイベントリスナーを設定
 */
function setupEventListeners() {
    // モバイルナビゲーション
    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileMenu);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeMobileMenu);
    }
    
    // ナビゲーションリンク
    tocLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                smoothScrollTo(targetElement, 20);
                
                // モバイルメニューを閉じる
                if (window.innerWidth <= 767) {
                    closeMobileMenu();
                }
            }
        });
    });
    
    // 検索機能
    if (searchButton) {
        searchButton.addEventListener('click', () => {
            const query = searchInput.value.trim();
            if (query) {
                searchContent(query);
            }
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                searchContent(query);
            } else if (query.length === 0) {
                clearSearchHighlights();
            }
        }, 300));
    }
    
    // スクロールイベント
    window.addEventListener('scroll', throttle(() => {
        updateReadingProgress();
        updateActiveNavigation();
        animateOnScroll();
    }, 16)); // 60fps
    
    // リサイズイベント
    window.addEventListener('resize', debounce(() => {
        // モバイルメニューが開いている状態でデスクトップサイズになった場合
        if (window.innerWidth > 767 && navigation.classList.contains('active')) {
            closeMobileMenu();
        }
    }, 250));
    
    // キーボードイベント
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // フォーカス管理
    document.addEventListener('focusin', (event) => {
        // フォーカス可能な要素にフォーカスリングを表示
        if (event.target.matches('button, a, input, textarea, select, [tabindex]')) {
            event.target.classList.add('focus-visible');
        }
    });
    
    document.addEventListener('focusout', (event) => {
        event.target.classList.remove('focus-visible');
    });
}

// ===== 初期化 =====

/**
 * アプリケーションの初期化
 */
function initializeApp() {
    // 初期状態の設定
    updateReadingProgress();
    updateActiveNavigation();
    
    // 機能の初期化
    initializeAnimations();
    initializeChecklist();
    initializeTooltips();
    initializeLazyLoading();
    
    // イベントリスナーの設定
    setupEventListeners();
    
    // 初期アニメーション
    setTimeout(() => {
        animateOnScroll();
    }, 100);
    
    console.log('デザインシステム・ルールブック - 初期化完了');
}

// ===== CSS追加（動的スタイル） =====

/**
 * 動的スタイルを追加
 */
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .search-highlight {
            background: #ffeb3b;
            color: #000;
            padding: 0.1em 0.2em;
            border-radius: 2px;
            font-weight: 600;
        }
        
        .focus-visible {
            outline: 2px solid var(--color-primary);
            outline-offset: 2px;
        }
        
        .animated {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
        
        .lazy {
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .tooltip {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        @media (prefers-reduced-motion: reduce) {
            .animated {
                transition: none !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// ===== アプリケーション開始 =====

// DOM読み込み完了時に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        addDynamicStyles();
        initializeApp();
    });
} else {
    addDynamicStyles();
    initializeApp();
}

// ===== エクスポート（モジュール使用時） =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toggleMobileMenu,
        searchContent,
        updateReadingProgress,
        smoothScrollTo
    };
}

