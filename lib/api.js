/**
 * ============================================
 * File: docs-frontend/lib/api.js
 * ============================================
 * Creation Reason: Centralize all API calls to Django docs endpoints
 * Modification Reason:
 *   v1.2.2 - [DOCS-UX 2026-08-04 by Codex] Localize the recommended-reading
 *     label and mobile navigation states across every supported language.
 *   v1.2.1 - Added locale helpers so category and article metadata use
 *     language-appropriate dates and counters.
 *   v1.2.0 - Added multilingual docs helpers and optional lang query
 *     propagation for global SEO/GEO routes such as /ja/network/article.
 *   v1.1.0 - Added fetchSiteConfig() and fetchNetworkStats() for GEO/LLM
 *     optimization, admin-controlled homepage copy, and public network data page.
 *   v1.0.1 - Fixed searchArticles() return format
 *   (was returning raw object, now correctly returns array),
 *   added request timeout, improved error messages
 *
 * Main Functionality:
 *   - fetchSiteConfig()    → GET /api/docs/site/
 *   - fetchCategoryTree()  → GET /api/docs/categories/tree/?lang=
 *   - fetchArticleList()   → GET /api/docs/articles/?lang=
 *   - fetchArticleBySlug() → GET /api/docs/articles/<slug>/?lang=
 *   - searchArticles()     → GET /api/docs/articles/search/?q=&lang=
 *   - fetchNetworkStats()  → GET /api/privacy_network/vpn/public/network-stats/
 *
 * Main Logical Flow:
 *   1. All functions call the base API URL via apiFetch()
 *   2. Response is normalized: Django returns { code, message, data }
 *   3. DRF paginated responses { count, next, results } are also handled
 *   4. 10s timeout prevents hanging requests
 *
 * Dependencies: None (native fetch + AbortController)
 *
 * ⚠️ Important Note for Next Developer:
 * - API_BASE is set via env var NEXT_PUBLIC_API_BASE_URL
 * - SSR calls go directly to the API; client calls may use proxy
 * - All Django responses follow { code: 0, message: 'success', data: ... }
 * - searchArticles returns { code: 0, data: [...], keyword, total }
 *   so we must extract data array specifically
 *
 * Last Modified: v1.2.1 - Locale-aware UI metadata helpers
 * ============================================
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.aeronyx.network/api';
const REQUEST_TIMEOUT = 10000; // 10 seconds

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'zh-Hans', label: 'Simplified Chinese', nativeLabel: '简体中文' },
  { code: 'zh-Hant', label: 'Traditional Chinese', nativeLabel: '繁體中文' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'pt-BR', label: 'Brazilian Portuguese', nativeLabel: 'Português' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe' },
  { code: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt' },
  { code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
];

export const DEFAULT_LANGUAGE = 'en';

const UI_COPY = {
  en: {
    recentArticles: 'Recommended reading',
    browseByCategory: 'Browse by Category',
    featured: 'Featured',
    documentationComingSoon: 'Documentation coming soon',
    buildingDocs: "We're building out our docs. Check back soon or visit the main site.",
    loading: 'Loading...',
    noArticlesInCategory: 'No articles in this category yet.',
    docs: 'Docs',
    searchDocs: 'Search docs...',
    articleNotFound: 'Article not found',
    backToDocs: 'Back to docs',
    previous: 'Previous',
    next: 'Next',
    onThisPage: 'On this page',
    minRead: (minutes) => `${minutes} min read`,
    views: (count) => `${count.toLocaleString()} views`,
    noResultsFound: 'No results found',
    tryDifferentKeywords: 'Try different or broader keywords',
    typeAtLeastTwo: 'Type at least 2 characters to search',
    resultCount: (count) => `${count} result${count === 1 ? '' : 's'}`,
    navigate: 'Navigate',
    open: 'Open',
    close: 'Close',
    clearSearch: 'Clear search',
    navigation: 'Navigation',
    noCategories: 'No documentation categories are available.',
    articleCount: (count) => `${count} article${count === 1 ? '' : 's'}`,
  },
  'zh-Hans': {
    recentArticles: '推荐阅读',
    browseByCategory: '按分类浏览',
    featured: '推荐',
    documentationComingSoon: '文档即将上线',
    buildingDocs: '我们正在完善文档。请稍后回来查看，或访问 AeroNyx 官网。',
    loading: '加载中...',
    noArticlesInCategory: '该分类下暂时没有文章。',
    docs: '文档',
    searchDocs: '搜索文档...',
    articleNotFound: '未找到文章',
    backToDocs: '返回文档',
    previous: '上一篇',
    next: '下一篇',
    onThisPage: '本页内容',
    minRead: (minutes) => `${minutes} 分钟阅读`,
    views: (count) => `${count.toLocaleString()} 次浏览`,
    noResultsFound: '没有找到结果',
    tryDifferentKeywords: '请尝试其他关键词或更宽泛的搜索',
    typeAtLeastTwo: '至少输入 2 个字符开始搜索',
    resultCount: (count) => `${count} 个结果`,
    navigate: '导航',
    open: '打开',
    close: '关闭',
    clearSearch: '清除搜索',
    navigation: '导航',
    noCategories: '暂无可用的文档分类。',
    articleCount: (count) => `${count} 篇文章`,
  },
  'zh-Hant': {
    recentArticles: '推薦閱讀',
    browseByCategory: '按分類瀏覽',
    featured: '推薦',
    documentationComingSoon: '文件即將上線',
    buildingDocs: '我們正在完善文件。請稍後回來查看，或造訪 AeroNyx 官網。',
    loading: '載入中...',
    noArticlesInCategory: '此分類下暫時沒有文章。',
    docs: '文件',
    searchDocs: '搜尋文件...',
    articleNotFound: '找不到文章',
    backToDocs: '返回文件',
    previous: '上一篇',
    next: '下一篇',
    onThisPage: '本頁內容',
    minRead: (minutes) => `${minutes} 分鐘閱讀`,
    views: (count) => `${count.toLocaleString()} 次瀏覽`,
    noResultsFound: '找不到結果',
    tryDifferentKeywords: '請嘗試其他關鍵字或更寬泛的搜尋',
    typeAtLeastTwo: '至少輸入 2 個字元開始搜尋',
    resultCount: (count) => `${count} 個結果`,
    navigate: '導覽',
    open: '開啟',
    close: '關閉',
    clearSearch: '清除搜尋',
    navigation: '導覽',
    noCategories: '暫無可用的文件分類。',
    articleCount: (count) => `${count} 篇文章`,
  },
  ja: {
    recentArticles: 'おすすめのドキュメント',
    browseByCategory: 'カテゴリから探す',
    featured: '注目',
    documentationComingSoon: 'ドキュメントは準備中です',
    buildingDocs: '現在ドキュメントを整備しています。後ほど再度ご確認ください。',
    loading: '読み込み中...',
    noArticlesInCategory: 'このカテゴリにはまだ記事がありません。',
    docs: 'ドキュメント',
    searchDocs: 'ドキュメントを検索...',
    articleNotFound: '記事が見つかりません',
    backToDocs: 'ドキュメントへ戻る',
    previous: '前へ',
    next: '次へ',
    onThisPage: 'このページ',
    minRead: (minutes) => `約${minutes}分で読めます`,
    views: (count) => `${count.toLocaleString()} 回表示`,
    noResultsFound: '結果が見つかりません',
    tryDifferentKeywords: '別のキーワード、またはより広い語句で検索してください',
    typeAtLeastTwo: '2文字以上入力して検索',
    resultCount: (count) => `${count} 件の結果`,
    navigate: '移動',
    open: '開く',
    close: '閉じる',
    clearSearch: '検索をクリア',
    navigation: 'ナビゲーション',
    noCategories: '利用できるドキュメントカテゴリはありません。',
    articleCount: (count) => `${count} 件の記事`,
  },
  ko: {
    recentArticles: '추천 문서',
    browseByCategory: '카테고리별 보기',
    featured: '추천',
    documentationComingSoon: '문서 준비 중',
    buildingDocs: '문서를 정리하고 있습니다. 잠시 후 다시 확인하거나 AeroNyx 공식 사이트를 방문해 주세요.',
    loading: '불러오는 중...',
    noArticlesInCategory: '이 카테고리에는 아직 문서가 없습니다.',
    docs: '문서',
    searchDocs: '문서 검색...',
    articleNotFound: '문서를 찾을 수 없습니다',
    backToDocs: '문서로 돌아가기',
    previous: '이전',
    next: '다음',
    onThisPage: '이 페이지',
    minRead: (minutes) => `${minutes}분 읽기`,
    views: (count) => `${count.toLocaleString()}회 조회`,
    noResultsFound: '검색 결과가 없습니다',
    tryDifferentKeywords: '다른 키워드나 더 넓은 검색어를 입력해 보세요',
    typeAtLeastTwo: '검색하려면 2자 이상 입력하세요',
    resultCount: (count) => `${count}개 결과`,
    navigate: '이동',
    open: '열기',
    close: '닫기',
    clearSearch: '검색 지우기',
    navigation: '탐색',
    noCategories: '사용 가능한 문서 카테고리가 없습니다.',
    articleCount: (count) => `${count}개 문서`,
  },
  ru: {
    recentArticles: 'Рекомендуемые материалы',
    browseByCategory: 'Просмотр по категориям',
    featured: 'Избранное',
    documentationComingSoon: 'Документация скоро появится',
    buildingDocs: 'Мы обновляем документацию. Проверьте позже или посетите основной сайт AeroNyx.',
    loading: 'Загрузка...',
    noArticlesInCategory: 'В этой категории пока нет материалов.',
    docs: 'Документация',
    searchDocs: 'Поиск по документации...',
    articleNotFound: 'Материал не найден',
    backToDocs: 'Вернуться к документации',
    previous: 'Предыдущий',
    next: 'Следующий',
    onThisPage: 'На этой странице',
    minRead: (minutes) => `${minutes} мин чтения`,
    views: (count) => `${count.toLocaleString()} просмотров`,
    noResultsFound: 'Ничего не найдено',
    tryDifferentKeywords: 'Попробуйте другие или более общие ключевые слова',
    typeAtLeastTwo: 'Введите минимум 2 символа для поиска',
    resultCount: (count) => `${count} результатов`,
    navigate: 'Навигация',
    open: 'Открыть',
    close: 'Закрыть',
    clearSearch: 'Очистить поиск',
    navigation: 'Навигация',
    noCategories: 'Категории документации недоступны.',
    articleCount: (count) => `${count} материалов`,
  },
  es: {
    recentArticles: 'Lecturas recomendadas',
    browseByCategory: 'Explorar por categoría',
    featured: 'Destacado',
    documentationComingSoon: 'La documentación estará disponible pronto',
    buildingDocs: 'Estamos ampliando la documentación. Vuelve pronto o visita el sitio principal de AeroNyx.',
    loading: 'Cargando...',
    noArticlesInCategory: 'Todavía no hay artículos en esta categoría.',
    docs: 'Documentación',
    searchDocs: 'Buscar en la documentación...',
    articleNotFound: 'Artículo no encontrado',
    backToDocs: 'Volver a la documentación',
    previous: 'Anterior',
    next: 'Siguiente',
    onThisPage: 'En esta página',
    minRead: (minutes) => `${minutes} min de lectura`,
    views: (count) => `${count.toLocaleString()} vistas`,
    noResultsFound: 'No se encontraron resultados',
    tryDifferentKeywords: 'Prueba con palabras clave diferentes o más amplias',
    typeAtLeastTwo: 'Escribe al menos 2 caracteres para buscar',
    resultCount: (count) => `${count} resultado${count === 1 ? '' : 's'}`,
    navigate: 'Navegar',
    open: 'Abrir',
    close: 'Cerrar',
    clearSearch: 'Borrar búsqueda',
    navigation: 'Navegación',
    noCategories: 'No hay categorías de documentación disponibles.',
    articleCount: (count) => `${count} artículo${count === 1 ? '' : 's'}`,
  },
  'pt-BR': {
    recentArticles: 'Leituras recomendadas',
    browseByCategory: 'Explorar por categoria',
    featured: 'Destaque',
    documentationComingSoon: 'Documentação em breve',
    buildingDocs: 'Estamos ampliando a documentação. Volte em breve ou visite o site principal da AeroNyx.',
    loading: 'Carregando...',
    noArticlesInCategory: 'Ainda não há artigos nesta categoria.',
    docs: 'Documentação',
    searchDocs: 'Pesquisar na documentação...',
    articleNotFound: 'Artigo não encontrado',
    backToDocs: 'Voltar para a documentação',
    previous: 'Anterior',
    next: 'Próximo',
    onThisPage: 'Nesta página',
    minRead: (minutes) => `${minutes} min de leitura`,
    views: (count) => `${count.toLocaleString()} visualizações`,
    noResultsFound: 'Nenhum resultado encontrado',
    tryDifferentKeywords: 'Tente palavras-chave diferentes ou mais amplas',
    typeAtLeastTwo: 'Digite pelo menos 2 caracteres para pesquisar',
    resultCount: (count) => `${count} resultado${count === 1 ? '' : 's'}`,
    navigate: 'Navegar',
    open: 'Abrir',
    close: 'Fechar',
    clearSearch: 'Limpar pesquisa',
    navigation: 'Navegação',
    noCategories: 'Não há categorias de documentação disponíveis.',
    articleCount: (count) => `${count} artigo${count === 1 ? '' : 's'}`,
  },
  ar: {
    recentArticles: 'قراءات موصى بها',
    browseByCategory: 'تصفح حسب الفئة',
    featured: 'مميز',
    documentationComingSoon: 'الوثائق قادمة قريباً',
    buildingDocs: 'نعمل على توسيع الوثائق. تحقق لاحقاً أو زر موقع AeroNyx الرئيسي.',
    loading: 'جار التحميل...',
    noArticlesInCategory: 'لا توجد مقالات في هذه الفئة بعد.',
    docs: 'الوثائق',
    searchDocs: 'ابحث في الوثائق...',
    articleNotFound: 'لم يتم العثور على المقالة',
    backToDocs: 'العودة إلى الوثائق',
    previous: 'السابق',
    next: 'التالي',
    onThisPage: 'في هذه الصفحة',
    minRead: (minutes) => `${minutes} دقيقة قراءة`,
    views: (count) => `${count.toLocaleString()} مشاهدة`,
    noResultsFound: 'لم يتم العثور على نتائج',
    tryDifferentKeywords: 'جرّب كلمات مختلفة أو أوسع',
    typeAtLeastTwo: 'اكتب حرفين على الأقل للبحث',
    resultCount: (count) => `${count} نتيجة`,
    navigate: 'تنقل',
    open: 'فتح',
    close: 'إغلاق',
    clearSearch: 'مسح البحث',
    navigation: 'التنقل',
    noCategories: 'لا تتوفر فئات وثائق حالياً.',
    articleCount: (count) => `${count} مقالة`,
  },
  tr: {
    recentArticles: 'Önerilen içerikler',
    browseByCategory: 'Kategoriye göre göz at',
    featured: 'Öne çıkan',
    documentationComingSoon: 'Dokümantasyon yakında',
    buildingDocs: 'Dokümantasyonu genişletiyoruz. Daha sonra tekrar kontrol edin veya AeroNyx ana sitesini ziyaret edin.',
    loading: 'Yükleniyor...',
    noArticlesInCategory: 'Bu kategoride henüz yazı yok.',
    docs: 'Dokümanlar',
    searchDocs: 'Dokümanlarda ara...',
    articleNotFound: 'Yazı bulunamadı',
    backToDocs: 'Dokümanlara dön',
    previous: 'Önceki',
    next: 'Sonraki',
    onThisPage: 'Bu sayfada',
    minRead: (minutes) => `${minutes} dk okuma`,
    views: (count) => `${count.toLocaleString()} görüntüleme`,
    noResultsFound: 'Sonuç bulunamadı',
    tryDifferentKeywords: 'Farklı veya daha geniş anahtar kelimeler deneyin',
    typeAtLeastTwo: 'Aramak için en az 2 karakter yazın',
    resultCount: (count) => `${count} sonuç`,
    navigate: 'Gezin',
    open: 'Aç',
    close: 'Kapat',
    clearSearch: 'Aramayı temizle',
    navigation: 'Gezinme',
    noCategories: 'Kullanılabilir dokümantasyon kategorisi yok.',
    articleCount: (count) => `${count} yazı`,
  },
  vi: {
    recentArticles: 'Nội dung đề xuất',
    browseByCategory: 'Duyệt theo danh mục',
    featured: 'Nổi bật',
    documentationComingSoon: 'Tài liệu sắp ra mắt',
    buildingDocs: 'Chúng tôi đang hoàn thiện tài liệu. Vui lòng quay lại sau hoặc truy cập trang AeroNyx chính.',
    loading: 'Đang tải...',
    noArticlesInCategory: 'Danh mục này chưa có bài viết.',
    docs: 'Tài liệu',
    searchDocs: 'Tìm kiếm tài liệu...',
    articleNotFound: 'Không tìm thấy bài viết',
    backToDocs: 'Quay lại tài liệu',
    previous: 'Trước',
    next: 'Tiếp theo',
    onThisPage: 'Trong trang này',
    minRead: (minutes) => `${minutes} phút đọc`,
    views: (count) => `${count.toLocaleString()} lượt xem`,
    noResultsFound: 'Không tìm thấy kết quả',
    tryDifferentKeywords: 'Hãy thử từ khóa khác hoặc rộng hơn',
    typeAtLeastTwo: 'Nhập ít nhất 2 ký tự để tìm kiếm',
    resultCount: (count) => `${count} kết quả`,
    navigate: 'Điều hướng',
    open: 'Mở',
    close: 'Đóng',
    clearSearch: 'Xóa tìm kiếm',
    navigation: 'Điều hướng',
    noCategories: 'Chưa có danh mục tài liệu khả dụng.',
    articleCount: (count) => `${count} bài viết`,
  },
  id: {
    recentArticles: 'Bacaan pilihan',
    browseByCategory: 'Jelajahi berdasarkan kategori',
    featured: 'Unggulan',
    documentationComingSoon: 'Dokumentasi segera hadir',
    buildingDocs: 'Kami sedang melengkapi dokumentasi. Silakan cek lagi nanti atau kunjungi situs utama AeroNyx.',
    loading: 'Memuat...',
    noArticlesInCategory: 'Belum ada artikel dalam kategori ini.',
    docs: 'Dokumentasi',
    searchDocs: 'Cari dokumentasi...',
    articleNotFound: 'Artikel tidak ditemukan',
    backToDocs: 'Kembali ke dokumentasi',
    previous: 'Sebelumnya',
    next: 'Berikutnya',
    onThisPage: 'Di halaman ini',
    minRead: (minutes) => `${minutes} menit baca`,
    views: (count) => `${count.toLocaleString()} tayangan`,
    noResultsFound: 'Tidak ada hasil',
    tryDifferentKeywords: 'Coba kata kunci lain atau yang lebih luas',
    typeAtLeastTwo: 'Ketik minimal 2 karakter untuk mencari',
    resultCount: (count) => `${count} hasil`,
    navigate: 'Navigasi',
    open: 'Buka',
    close: 'Tutup',
    clearSearch: 'Bersihkan pencarian',
    navigation: 'Navigasi',
    noCategories: 'Belum ada kategori dokumentasi yang tersedia.',
    articleCount: (count) => `${count} artikel`,
  },
  fr: {
    recentArticles: 'Lectures recommandées',
    browseByCategory: 'Parcourir par catégorie',
    featured: 'À la une',
    documentationComingSoon: 'Documentation bientôt disponible',
    buildingDocs: 'Nous enrichissons la documentation. Revenez bientôt ou visitez le site principal AeroNyx.',
    loading: 'Chargement...',
    noArticlesInCategory: 'Aucun article dans cette catégorie pour le moment.',
    docs: 'Documentation',
    searchDocs: 'Rechercher dans la documentation...',
    articleNotFound: 'Article introuvable',
    backToDocs: 'Retour à la documentation',
    previous: 'Précédent',
    next: 'Suivant',
    onThisPage: 'Sur cette page',
    minRead: (minutes) => `${minutes} min de lecture`,
    views: (count) => `${count.toLocaleString()} vues`,
    noResultsFound: 'Aucun résultat trouvé',
    tryDifferentKeywords: 'Essayez des mots-clés différents ou plus larges',
    typeAtLeastTwo: 'Saisissez au moins 2 caractères pour rechercher',
    resultCount: (count) => `${count} résultat${count === 1 ? '' : 's'}`,
    navigate: 'Naviguer',
    open: 'Ouvrir',
    close: 'Fermer',
    clearSearch: 'Effacer la recherche',
    navigation: 'Navigation',
    noCategories: 'Aucune catégorie de documentation disponible.',
    articleCount: (count) => `${count} article${count === 1 ? '' : 's'}`,
  },
};

export function normalizeLanguage(lang) {
  return SUPPORTED_LANGUAGES.some((item) => item.code === lang) ? lang : DEFAULT_LANGUAGE;
}

export function getUiCopy(lang = DEFAULT_LANGUAGE) {
  return {
    ...UI_COPY[DEFAULT_LANGUAGE],
    ...(UI_COPY[normalizeLanguage(lang)] || {}),
  };
}

export function languagePathPrefix(lang) {
  const normalized = normalizeLanguage(lang);
  return normalized === DEFAULT_LANGUAGE ? '' : `/${normalized}`;
}

export function languageLocale(lang = DEFAULT_LANGUAGE) {
  const normalized = normalizeLanguage(lang);
  const localeMap = {
    en: 'en-US',
    'zh-Hans': 'zh-CN',
    'zh-Hant': 'zh-TW',
    ja: 'ja-JP',
    ko: 'ko-KR',
    ru: 'ru-RU',
    es: 'es-ES',
    'pt-BR': 'pt-BR',
    ar: 'ar',
    tr: 'tr-TR',
    vi: 'vi-VN',
    id: 'id-ID',
    fr: 'fr-FR',
  };
  return localeMap[normalized] || localeMap[DEFAULT_LANGUAGE];
}

export function articleHref(article, lang = DEFAULT_LANGUAGE, fallbackCategory = 'uncategorized') {
  const categorySlug = article?.category_slug || fallbackCategory || 'uncategorized';
  const slug = article?.canonical_slug || article?.translation_key || article?.slug;
  if (!slug) return languagePathPrefix(lang) || '/';
  return `${languagePathPrefix(lang)}/${categorySlug}/${slug}`;
}

/**
 * Generic fetch wrapper with error handling & timeout
 * @param {string} endpoint - API path after /api/docs/
 * @param {object} options  - fetch options
 * @returns {object|null}   - raw parsed JSON response or null on error
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}/docs/${endpoint}`;

  // Abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error(`[API] ${res.status} ${res.statusText} — ${url}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.error(`[API] Request timeout (${REQUEST_TIMEOUT}ms) — ${url}`);
    } else {
      console.error(`[API] Fetch error — ${url}:`, err.message);
    }
    return null;
  }
}

async function rawApiFetch(path, options = {}) {
  const url = `${API_BASE}/${path.replace(/^\/+/, '')}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      console.error(`[API] ${res.status} ${res.statusText} — ${url}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(`[API] Fetch error — ${url}:`, err.message);
    return null;
  }
}

/**
 * Extract data from normalized Django response
 * Django returns: { code: 0, message: 'success', data: ... }
 * DRF pagination: { count, next, previous, results }
 */
function extractData(json) {
  if (!json) return null;

  // Django custom wrapper: { code, message, data }
  if (json.code !== undefined) {
    return json.code === 0 ? json.data : null;
  }

  // DRF paginated response: { count, next, previous, results }
  if (json.results !== undefined) {
    return {
      results: json.results,
      count: json.count,
      next: json.next,
      previous: json.previous,
    };
  }

  // Raw data (plain array or object)
  return json;
}

// ============================================
// Public API Functions
// ============================================

export async function fetchSiteConfig() {
  const json = await apiFetch('site/');
  return extractData(json);
}

/**
 * Get full category tree (with nested children + article slugs)
 * Used by Sidebar component
 * @returns {Array|null}
 */
export async function fetchCategoryTree({ lang } = {}) {
  const params = new URLSearchParams();
  const normalized = normalizeLanguage(lang);
  if (normalized !== DEFAULT_LANGUAGE) params.set('lang', normalized);
  const query = params.toString();
  const json = await apiFetch(`categories/tree/${query ? `?${query}` : ''}`);
  return extractData(json);
}

/**
 * Get flat list of all categories
 * @returns {Array|null}
 */
export async function fetchCategories() {
  const json = await apiFetch('categories/');
  return extractData(json);
}

/**
 * Get published articles, optionally filtered by category slug
 * @param {object} params
 * @param {string} params.category - category slug filter
 * @param {boolean} params.pinned  - only pinned articles
 * @param {number} params.page     - page number
 * @returns {object|null} - { results, count, next, previous } or raw array
 */
export async function fetchArticleList({ category, pinned, page, lang } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (pinned) params.set('pinned', 'true');
  if (page) params.set('page', String(page));
  const normalized = normalizeLanguage(lang);
  if (normalized !== DEFAULT_LANGUAGE) params.set('lang', normalized);

  const query = params.toString();
  const json = await apiFetch(`articles/${query ? `?${query}` : ''}`);
  return extractData(json);
}

/**
 * Get single article by slug (full markdown content)
 * @param {string} slug
 * @returns {object|null} - article detail object
 */
export async function fetchArticleBySlug(slug, { lang } = {}) {
  if (!slug) return null;
  const params = new URLSearchParams();
  const normalized = normalizeLanguage(lang);
  if (normalized !== DEFAULT_LANGUAGE) params.set('lang', normalized);
  const query = params.toString();
  const json = await apiFetch(`articles/${encodeURIComponent(slug)}/${query ? `?${query}` : ''}`);
  return extractData(json);
}

/**
 * Search articles by keyword
 * BUG FIX (v1.0.1): The search endpoint returns:
 *   { code: 0, message: 'success', data: [...], keyword: '...', total: N }
 * extractData() returns the `data` array correctly.
 * We always return an array (empty on failure).
 *
 * @param {string} keyword - min 2 characters
 * @returns {Array} - array of article objects, never null
 */
export async function searchArticles(keyword, { lang } = {}) {
  if (!keyword || keyword.trim().length < 2) return [];

  const params = new URLSearchParams();
  params.set('q', keyword.trim());
  const normalized = normalizeLanguage(lang);
  if (normalized !== DEFAULT_LANGUAGE) params.set('lang', normalized);

  const json = await apiFetch(`articles/search/?${params.toString()}`);
  const data = extractData(json);

  // Ensure we always return an array
  if (Array.isArray(data)) return data;
  return [];
}

export async function fetchNetworkStats() {
  const json = await rawApiFetch('privacy_network/vpn/public/network-stats/');
  if (!json) return null;
  if (json.success === true && json.data) return json.data;
  return extractData(json);
}
