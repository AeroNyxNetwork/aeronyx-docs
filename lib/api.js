/**
 * ============================================
 * File: docs-frontend/lib/api.js
 * ============================================
 * Creation Reason: Centralize all API calls to Django docs endpoints
 * Modification Reason:
 *   v1.3.1 - [DOCS-NAV-DETAILS 2026-10-08 by Codex] Explain each reader
 *     section and distinguish category indexes from localized article routes.
 *   v1.3.0 - [DOCS-NAVIGATION 2026-10-08 by Codex] Organize translated
 *     reader sections independently of canonical CMS article routes.
 *   v1.2.5 - [DOCS-HOME-SEO-I18N 2026-10-07 by Codex] Share canonical
 *     language alternates and translate homepage/category fallback copy.
 *   v1.2.4 - [DOCS-LOCALE-TRANSITION 2026-10-07 by Codex] Preserve query
 *     and anchor suffixes on language changes; share reading-direction rules.
 *   v1.2.3 - [DOCS-ARTICLE-I18N 2026-10-07 by Codex] Add translated article
 *     controls, navigation labels, and reading-progress accessibility text.
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
 * Last Modified: v1.3.1 - Section summaries and route context
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

// [DOCS-ARTICLE-RETIREMENT 2026-10-09 by Codex] Owner-retired public page;
// keep the CMS original recoverable and do not retire other translations.
// [DOCS-IA-CMS 2026-10-09 by Claude] The retired zh-Hans node snapshot was
// replaced by a new "What is AeroNyx" in every language (owner approved on
// 2026-10-09). Publication is now decided in the CMS alone; this hook stays
// as the single place for any future frontend-side retirement.
const RETIRED_ARTICLES = new Set();

export function isPublicDocumentationArticle(article, lang = DEFAULT_LANGUAGE) {
  const language = article?.language || lang;
  const key = article?.translation_key || article?.canonical_slug || article?.slug;
  return !RETIRED_ARTICLES.has(`${language}:${key}`);
}

const UI_COPY = {
  // [DOCS-ARTICLE-I18N 2026-10-07 by Codex] Article utilities share the
  // selected UI locale, including screen-reader labels and empty states.
  // [DEVELOPER-CHAT-DOCS 2026-09-24 by Codex] Localize the dedicated homepage
  // API entry without changing article content or protocol terminology.
  en: {
    developerApi: 'Developer API',
    copyCode: 'Copy code',
    codeCopied: 'Code copied',
    linkToHeading: 'Link to section',
    emptyContent: 'No content available.',
    breadcrumb: 'Breadcrumb',
    articleNavigation: 'Article navigation',
    readingProgress: 'Reading progress',
    selectLanguage: 'Documentation language',
    officialDocumentation: 'Official documentation',
    protocolDocumentation: 'Protocol documentation',
    documentationDescription: 'Documentation for AeroNyx users, developers and node operators: protocol, API, deployment and privacy limits.',
    categoryDescription: (name) => `${name}: guides and reference documentation.`,
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
    // [DOCS-POLISH 2026-10-09 by Claude] Bylines show the last update.
    updatedOn: (date) => `Updated ${date}`,
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
    developerApi: '开发者 API',
    copyCode: '复制代码',
    codeCopied: '代码已复制',
    linkToHeading: '链接到此节',
    emptyContent: '暂无正文。',
    breadcrumb: '当前位置',
    articleNavigation: '文章导航',
    readingProgress: '阅读进度',
    selectLanguage: '文档语言',
    officialDocumentation: '官方文档',
    protocolDocumentation: '协议文档',
    documentationDescription: '面向 AeroNyx 用户、开发者和节点运营者的文档，涵盖协议、API、部署和隐私边界。',
    categoryDescription: (name) => `${name}：使用指南与参考文档。`,
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
    updatedOn: (date) => `更新于 ${date}`,
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
    developerApi: '開發者 API',
    copyCode: '複製程式碼',
    codeCopied: '程式碼已複製',
    linkToHeading: '連結至此節',
    emptyContent: '暫無正文。',
    breadcrumb: '目前位置',
    articleNavigation: '文章導覽',
    readingProgress: '閱讀進度',
    selectLanguage: '文件語言',
    officialDocumentation: '官方文件',
    protocolDocumentation: '協議文件',
    documentationDescription: '供 AeroNyx 使用者、開發者與節點營運者查閱，涵蓋協議、API、部署與隱私邊界。',
    categoryDescription: (name) => `${name}：使用指南與參考文件。`,
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
    updatedOn: (date) => `更新於 ${date}`,
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
    developerApi: '開発者 API',
    copyCode: 'コードをコピー',
    codeCopied: 'コードをコピーしました',
    linkToHeading: 'セクションへのリンク',
    emptyContent: '本文はありません。',
    breadcrumb: '現在の位置',
    articleNavigation: '記事ナビゲーション',
    readingProgress: '読書の進捗',
    selectLanguage: 'ドキュメントの言語',
    officialDocumentation: '公式ドキュメント',
    protocolDocumentation: 'プロトコルドキュメント',
    documentationDescription: 'AeroNyx の利用者、開発者、ノード運営者向けのドキュメント。プロトコル、API、導入手順、プライバシー保護の範囲を説明します。',
    categoryDescription: (name) => `${name}のガイドとリファレンス。`,
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
    updatedOn: (date) => `${date} 更新`,
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
    developerApi: '개발자 API',
    copyCode: '코드 복사',
    codeCopied: '코드가 복사되었습니다',
    linkToHeading: '섹션 링크',
    emptyContent: '본문이 없습니다.',
    breadcrumb: '현재 위치',
    articleNavigation: '문서 탐색',
    readingProgress: '읽기 진행률',
    selectLanguage: '문서 언어',
    officialDocumentation: '공식 문서',
    protocolDocumentation: '프로토콜 문서',
    documentationDescription: 'AeroNyx 사용자, 개발자, 노드 운영자를 위한 문서입니다. 프로토콜, API, 배포 방법과 개인정보 보호 범위를 다룹니다.',
    categoryDescription: (name) => `${name} 가이드 및 참조 문서.`,
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
    updatedOn: (date) => `${date} 업데이트`,
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
    developerApi: 'API для разработчиков',
    copyCode: 'Копировать код',
    codeCopied: 'Код скопирован',
    linkToHeading: 'Ссылка на раздел',
    emptyContent: 'Текст пока отсутствует.',
    breadcrumb: 'Навигационная цепочка',
    articleNavigation: 'Навигация по статьям',
    readingProgress: 'Прогресс чтения',
    selectLanguage: 'Язык документации',
    officialDocumentation: 'Официальная документация',
    protocolDocumentation: 'Документация протокола',
    documentationDescription: 'Документация для пользователей AeroNyx, разработчиков и операторов узлов: протокол, API, развёртывание и границы защиты данных.',
    categoryDescription: (name) => `${name}: руководства и справочная документация.`,
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
    updatedOn: (date) => `Обновлено ${date}`,
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
    developerApi: 'API para desarrolladores',
    copyCode: 'Copiar código',
    codeCopied: 'Código copiado',
    linkToHeading: 'Enlace a la sección',
    emptyContent: 'No hay contenido disponible.',
    breadcrumb: 'Ruta de navegación',
    articleNavigation: 'Navegación entre artículos',
    readingProgress: 'Progreso de lectura',
    selectLanguage: 'Idioma de la documentación',
    officialDocumentation: 'Documentación oficial',
    protocolDocumentation: 'Documentación del protocolo',
    documentationDescription: 'Documentación para usuarios de AeroNyx, desarrolladores y operadores de nodos: protocolo, API, despliegue y límites de privacidad.',
    categoryDescription: (name) => `${name}: guías y documentación de referencia.`,
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
    updatedOn: (date) => `Actualizado el ${date}`,
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
    developerApi: 'API para desenvolvedores',
    copyCode: 'Copiar código',
    codeCopied: 'Código copiado',
    linkToHeading: 'Link para a seção',
    emptyContent: 'Nenhum conteúdo disponível.',
    breadcrumb: 'Caminho de navegação',
    articleNavigation: 'Navegação entre artigos',
    readingProgress: 'Progresso de leitura',
    selectLanguage: 'Idioma da documentação',
    officialDocumentation: 'Documentação oficial',
    protocolDocumentation: 'Documentação do protocolo',
    documentationDescription: 'Documentação para usuários do AeroNyx, desenvolvedores e operadores de nós: protocolo, API, implantação e limites de privacidade.',
    categoryDescription: (name) => `${name}: guias e documentação de referência.`,
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
    updatedOn: (date) => `Atualizado em ${date}`,
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
    developerApi: 'واجهة المطورين',
    copyCode: 'نسخ الشفرة',
    codeCopied: 'تم نسخ الشفرة',
    linkToHeading: 'رابط إلى القسم',
    emptyContent: 'لا يوجد محتوى متاح.',
    breadcrumb: 'مسار التنقل',
    articleNavigation: 'التنقل بين المقالات',
    readingProgress: 'تقدم القراءة',
    selectLanguage: 'لغة الوثائق',
    officialDocumentation: 'الوثائق الرسمية',
    protocolDocumentation: 'وثائق البروتوكول',
    documentationDescription: 'وثائق لمستخدمي AeroNyx والمطورين ومشغلي العُقد، تشمل البروتوكول وواجهة API والنشر وحدود حماية الخصوصية.',
    categoryDescription: (name) => `${name}: أدلة ووثائق مرجعية.`,
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
    updatedOn: (date) => `آخر تحديث: ${date}`,
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
    developerApi: 'Geliştirici API',
    copyCode: 'Kodu kopyala',
    codeCopied: 'Kod kopyalandı',
    linkToHeading: 'Bölüm bağlantısı',
    emptyContent: 'İçerik bulunmuyor.',
    breadcrumb: 'Gezinme yolu',
    articleNavigation: 'Yazılar arası gezinme',
    readingProgress: 'Okuma ilerlemesi',
    selectLanguage: 'Dokümantasyon dili',
    officialDocumentation: 'Resmî dokümantasyon',
    protocolDocumentation: 'Protokol dokümantasyonu',
    documentationDescription: 'AeroNyx kullanıcıları, geliştiriciler ve düğüm işletmecileri için protokol, API, dağıtım ve gizlilik sınırları hakkında belgeler.',
    categoryDescription: (name) => `${name}: kılavuzlar ve başvuru belgeleri.`,
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
    updatedOn: (date) => `Güncellendi: ${date}`,
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
    developerApi: 'API cho nhà phát triển',
    copyCode: 'Sao chép mã',
    codeCopied: 'Đã sao chép mã',
    linkToHeading: 'Liên kết đến mục',
    emptyContent: 'Chưa có nội dung.',
    breadcrumb: 'Đường dẫn điều hướng',
    articleNavigation: 'Điều hướng bài viết',
    readingProgress: 'Tiến độ đọc',
    selectLanguage: 'Ngôn ngữ tài liệu',
    officialDocumentation: 'Tài liệu chính thức',
    protocolDocumentation: 'Tài liệu giao thức',
    documentationDescription: 'Tài liệu dành cho người dùng AeroNyx, nhà phát triển và đơn vị vận hành nút: giao thức, API, triển khai và giới hạn bảo vệ quyền riêng tư.',
    categoryDescription: (name) => `${name}: hướng dẫn và tài liệu tham khảo.`,
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
    updatedOn: (date) => `Cập nhật ngày ${date}`,
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
    developerApi: 'API Pengembang',
    copyCode: 'Salin kode',
    codeCopied: 'Kode disalin',
    linkToHeading: 'Tautan ke bagian',
    emptyContent: 'Belum ada isi.',
    breadcrumb: 'Jalur navigasi',
    articleNavigation: 'Navigasi antarartikel',
    readingProgress: 'Progres membaca',
    selectLanguage: 'Bahasa dokumentasi',
    officialDocumentation: 'Dokumentasi resmi',
    protocolDocumentation: 'Dokumentasi protokol',
    documentationDescription: 'Dokumentasi untuk pengguna AeroNyx, pengembang, dan operator node: protokol, API, penerapan, dan batas perlindungan privasi.',
    categoryDescription: (name) => `${name}: panduan dan dokumentasi referensi.`,
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
    updatedOn: (date) => `Diperbarui ${date}`,
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
    developerApi: 'API développeur',
    copyCode: 'Copier le code',
    codeCopied: 'Code copié',
    linkToHeading: 'Lien vers la section',
    emptyContent: 'Aucun contenu disponible.',
    breadcrumb: 'Fil d’Ariane',
    articleNavigation: 'Navigation entre les articles',
    readingProgress: 'Progression de lecture',
    selectLanguage: 'Langue de la documentation',
    officialDocumentation: 'Documentation officielle',
    protocolDocumentation: 'Documentation du protocole',
    documentationDescription: 'Documentation pour les utilisateurs d’AeroNyx, les développeurs et les opérateurs de nœuds : protocole, API, déploiement et limites de confidentialité.',
    categoryDescription: (name) => `${name} : guides et documentation de référence.`,
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
    updatedOn: (date) => `Mis à jour le ${date}`,
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

// [DOCS-LOCALE-TRANSITION 2026-10-07 by Codex] Share route-direction rules
// and preserve the query/hash verbatim when changing documentation language.
export function languageDirection(lang = DEFAULT_LANGUAGE) {
  return normalizeLanguage(lang) === 'ar' ? 'rtl' : 'ltr';
}

export function localizeDocumentationPath(path, lang = DEFAULT_LANGUAGE) {
  const source = path || '/';
  const suffixIndex = source.search(/[?#]/);
  const pathname = suffixIndex < 0 ? source : source.slice(0, suffixIndex);
  const suffix = suffixIndex < 0 ? '' : source.slice(suffixIndex);
  const firstSegment = pathname.split('/')[1];
  const hasLanguagePrefix = SUPPORTED_LANGUAGES.some(
    (item) => item.code === firstSegment
  );
  const basePath = (hasLanguagePrefix
    ? pathname.slice(firstSegment.length + 1)
    : pathname) || '/';
  const prefix = languagePathPrefix(lang);
  return `${prefix}${prefix && basePath === '/' ? '' : basePath}${suffix}`;
}

// [DOCS-HOME-SEO-I18N 2026-10-07 by Codex] Only home/category routes use
// this complete locale set; article alternates remain translation-aware.
export function documentationAlternates(path = '/', docsBaseUrl = 'https://docs.aeronyx.network') {
  const baseUrl = docsBaseUrl.replace(/\/+$/, '');
  const pathname = path.split(/[?#]/, 1)[0] || '/';
  return [
    ...SUPPORTED_LANGUAGES.map(({ code }) => ({
      language: code,
      href: `${baseUrl}${localizeDocumentationPath(pathname, code)}`,
    })),
    { language: 'x-default', href: `${baseUrl}${localizeDocumentationPath(pathname, DEFAULT_LANGUAGE)}` },
  ];
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

// [DOCS-NAVIGATION 2026-10-08 by Codex] These are presentation labels,
// not new CMS categories, article translations, or capability claims.
const NAVIGATION_LABELS = {
  en: ['Start here', 'Developer integration', 'Node operators', 'Protocol & network', 'Help & FAQ', 'Trust & policies'],
  'zh-Hans': ['开始使用', '开发者接入', '节点运营', '协议与网络', '帮助与常见问题', '信任与政策'],
  'zh-Hant': ['開始使用', '開發者接入', '節點營運', '協議與網絡', '說明與常見問題', '信任與政策'],
  ja: ['はじめに', '開発者向け連携', 'ノード運用', 'プロトコルとネットワーク', 'ヘルプとFAQ', '信頼とポリシー'],
  ko: ['시작하기', '개발자 연동', '노드 운영', '프로토콜과 네트워크', '도움말과 FAQ', '신뢰와 정책'],
  ru: ['Начало работы', 'Интеграция для разработчиков', 'Эксплуатация узлов', 'Протокол и сеть', 'Помощь и FAQ', 'Доверие и политики'],
  es: ['Primeros pasos', 'Integración para desarrolladores', 'Operación de nodos', 'Protocolo y red', 'Ayuda y preguntas frecuentes', 'Confianza y políticas'],
  'pt-BR': ['Primeiros passos', 'Integração para desenvolvedores', 'Operação de nós', 'Protocolo e rede', 'Ajuda e perguntas frequentes', 'Confiança e políticas'],
  ar: ['البدء', 'التكامل للمطورين', 'تشغيل العقد', 'البروتوكول والشبكة', 'المساعدة والأسئلة الشائعة', 'الثقة والسياسات'],
  tr: ['Başlangıç', 'Geliştirici entegrasyonu', 'Düğüm işletimi', 'Protokol ve ağ', 'Yardım ve sık sorulan sorular', 'Güven ve politikalar'],
  vi: ['Bắt đầu', 'Tích hợp cho nhà phát triển', 'Vận hành nút', 'Giao thức và mạng', 'Trợ giúp và câu hỏi thường gặp', 'Tin cậy và chính sách'],
  id: ['Mulai di sini', 'Integrasi pengembang', 'Operasi node', 'Protokol dan jaringan', 'Bantuan dan FAQ', 'Kepercayaan dan kebijakan'],
  fr: ['Premiers pas', 'Intégration pour développeurs', 'Exploitation des nœuds', 'Protocole et réseau', 'Aide et FAQ', 'Confiance et politiques'],
};
const NAVIGATION_ORDER = ['intro', 'developers', 'node-operators', 'network', 'faq', 'articles'];
// [DOCS-NAV-DETAILS 2026-10-08 by Codex] Describe documentation topics,
// not deployment status or availability of untranslated APIs.
const NAVIGATION_DESCRIPTIONS = {
  en: ['Understand AeroNyx, its components and privacy boundaries.', 'Client integration guides, chat contracts and API references.', 'Install and register a node, check health and use Nodeboard.', 'Node discovery, encrypted relay, storage and protocol safeguards.', 'Common questions and community resources.', 'Official privacy, security and service policies.'],
  'zh-Hans': ['了解 AeroNyx、各组件的职责与隐私边界。', '客户端接入指南、聊天接口契约与 API 参考。', '节点安装、注册、健康检查与 Nodeboard 使用指南。', '节点发现、加密中继、存储与协议防护机制。', '常见问题解答与社区资源。', '官方隐私、安全与服务政策。'],
  'zh-Hant': ['了解 AeroNyx、各元件的職責與隱私邊界。', '客戶端接入指南、聊天介面契約與 API 參考。', '節點安裝、註冊、健康檢查與 Nodeboard 使用指南。', '節點探索、加密中繼、儲存與協議防護機制。', '常見問題解答與社群資源。', '官方隱私、安全與服務政策。'],
  ja: ['AeroNyx の概要、各コンポーネントの役割、プライバシーの範囲。', 'クライアント連携ガイド、チャットの仕様、API リファレンス。', 'ノードのインストール、登録、稼働確認、Nodeboard の使い方。', 'ノード探索、暗号化リレー、ストレージ、プロトコルの保護機構。', 'よくある質問とコミュニティの情報。', '公式のプライバシー、セキュリティ、サービスに関するポリシー。'],
  ko: ['AeroNyx 개요, 구성 요소의 역할과 개인정보 보호 범위.', '클라이언트 연동 가이드, 채팅 인터페이스 명세와 API 참조.', '노드 설치, 등록, 상태 점검과 Nodeboard 사용 안내.', '노드 탐색, 암호화 릴레이, 저장소와 프로토콜 보호 장치.', '자주 묻는 질문과 커뮤니티 자료.', '공식 개인정보 보호, 보안 및 서비스 정책.'],
  ru: ['Обзор AeroNyx, роли компонентов и границы конфиденциальности.', 'Руководства по интеграции клиентов, спецификации чата и справочник API.', 'Установка и регистрация узла, проверка состояния и работа с Nodeboard.', 'Обнаружение узлов, зашифрованная ретрансляция, хранение и защита протокола.', 'Ответы на частые вопросы и ресурсы сообщества.', 'Официальные политики конфиденциальности, безопасности и использования сервиса.'],
  es: ['Conoce AeroNyx, sus componentes y los límites de privacidad.', 'Guías de integración de clientes, especificaciones de chat y referencia de API.', 'Instalación y registro de nodos, comprobaciones de estado y uso de Nodeboard.', 'Descubrimiento de nodos, retransmisión cifrada, almacenamiento y protecciones del protocolo.', 'Preguntas frecuentes y recursos de la comunidad.', 'Políticas oficiales de privacidad, seguridad y servicio.'],
  'pt-BR': ['Conheça o AeroNyx, seus componentes e os limites de privacidade.', 'Guias de integração de clientes, especificações de chat e referência de API.', 'Instalação e registro de nós, verificação de integridade e uso do Nodeboard.', 'Descoberta de nós, retransmissão criptografada, armazenamento e proteções do protocolo.', 'Perguntas frequentes e recursos da comunidade.', 'Políticas oficiais de privacidade, segurança e serviço.'],
  ar: ['تعرّف على AeroNyx ومكوّناته وحدود الخصوصية.', 'أدلة تكامل العملاء ومواصفات الدردشة ومرجع API.', 'تثبيت العقد وتسجيلها والتحقق من سلامتها واستخدام Nodeboard.', 'اكتشاف العقد والترحيل المشفّر والتخزين وآليات حماية البروتوكول.', 'إجابات الأسئلة الشائعة وموارد المجتمع.', 'السياسات الرسمية للخصوصية والأمان والخدمة.'],
  tr: ['AeroNyx’i, bileşenlerin rollerini ve gizlilik sınırlarını tanıyın.', 'İstemci entegrasyon kılavuzları, sohbet arayüzü tanımları ve API referansı.', 'Düğüm kurulumu, kaydı, sağlık kontrolleri ve Nodeboard kullanımı.', 'Düğüm keşfi, şifreli aktarım, depolama ve protokol korumaları.', 'Sık sorulan sorular ve topluluk kaynakları.', 'Resmî gizlilik, güvenlik ve hizmet politikaları.'],
  vi: ['Tìm hiểu AeroNyx, vai trò các thành phần và giới hạn quyền riêng tư.', 'Hướng dẫn tích hợp ứng dụng khách, đặc tả giao diện chat và tài liệu API.', 'Cài đặt, đăng ký nút, kiểm tra tình trạng và sử dụng Nodeboard.', 'Khám phá nút, chuyển tiếp mã hóa, lưu trữ và cơ chế bảo vệ giao thức.', 'Giải đáp câu hỏi thường gặp và tài nguyên cộng đồng.', 'Chính sách chính thức về quyền riêng tư, bảo mật và dịch vụ.'],
  id: ['Kenali AeroNyx, peran komponennya, dan batas privasi.', 'Panduan integrasi klien, spesifikasi antarmuka chat, dan referensi API.', 'Instalasi dan pendaftaran node, pemeriksaan kondisi, serta penggunaan Nodeboard.', 'Penemuan node, relai terenkripsi, penyimpanan, dan perlindungan protokol.', 'Jawaban atas pertanyaan umum dan sumber daya komunitas.', 'Kebijakan resmi tentang privasi, keamanan, dan layanan.'],
  fr: ['Comprendre AeroNyx, le rôle de ses composants et les limites de confidentialité.', 'Guides d’intégration client, spécifications du chat et référence API.', 'Installation et enregistrement d’un nœud, contrôles de santé et utilisation de Nodeboard.', 'Découverte des nœuds, relais chiffré, stockage et protections du protocole.', 'Questions fréquentes et ressources de la communauté.', 'Politiques officielles de confidentialité, de sécurité et de service.'],
};
const NAVIGATION_OVERVIEW = {
  en: 'Overview', 'zh-Hans': '总览', 'zh-Hant': '總覽', ja: '概要', ko: '개요',
  ru: 'Обзор', es: 'Descripción general', 'pt-BR': 'Visão geral', ar: 'نظرة عامة',
  tr: 'Genel bakış', vi: 'Tổng quan', id: 'Ringkasan', fr: 'Vue d’ensemble',
};

export function navigationCategoryName(slug, lang = DEFAULT_LANGUAGE) {
  const index = NAVIGATION_ORDER.indexOf(slug);
  return index < 0 ? null : NAVIGATION_LABELS[normalizeLanguage(lang)][index];
}

export function navigationOverviewLabel(lang = DEFAULT_LANGUAGE) {
  return NAVIGATION_OVERVIEW[normalizeLanguage(lang)];
}

// [DOCS-NAV-DETAILS 2026-10-08 by Codex] Localized category indexes use
// [category]/[slug]; only their third segment can identify an article.
export function documentationRouteContext(query = {}) {
  const segment = (key) => typeof query[key] === 'string' ? query[key] : null;
  const category = segment('category');
  const localized = SUPPORTED_LANGUAGES.some(({ code }) => code === category);
  return {
    categorySlug: localized ? segment('slug') : category,
    articleSlug: localized ? segment('articleSlug') : segment('slug'),
  };
}

export function findNavigationCategory(tree, slug) {
  for (const category of tree || []) {
    if (category.slug === slug) return category;
    const child = findNavigationCategory(category.children, slug);
    if (child) return child;
  }
  return null;
}

export function navigationArticles(category) {
  if (!category) return [];
  return [
    ...(category.articles || []),
    ...(category.children || []).flatMap(navigationArticles),
  ];
}

function navigationArticleKey(article) {
  return article?.translation_key || article?.canonical_slug || article?.slug;
}

// [DOCS-NAVIGATION 2026-10-08 by Codex] Work on owned copies. Stamp the
// original route before moving any link; never rewrite category_slug on move.
export function buildDocumentationNavigation(sourceTree, lang = DEFAULT_LANGUAGE) {
  if (!Array.isArray(sourceTree)) return [];
  const cloneCategory = (category) => {
    const name = navigationCategoryName(category.slug, lang) || category.name;
    const index = NAVIGATION_ORDER.indexOf(category.slug);
    return {
      ...category,
      name,
      description: index >= 0
        ? NAVIGATION_DESCRIPTIONS[normalizeLanguage(lang)][index] : category.description || '',
      articles: (category.articles || []).filter((article) =>
        isPublicDocumentationArticle(article, lang)
      ).map((article) => ({
        ...article,
        category_slug: article.category_slug || category.slug,
      })),
      children: (category.children || []).map(cloneCategory),
    };
  };
  const tree = sourceTree.map(cloneCategory);
  // [DOCS-IA-CMS 2026-10-09 by Claude] The CMS is the single source of the
  // information architecture: an article's category decides its section and
  // URL, and `sort_order` decides its position (the tree API already orders
  // by it). This used to be duplicated here with hard-coded moves, a merged
  // Nodeboard group, a per-section order table and an install-page alias;
  // those articles now live in the right CMS categories, and retired pages
  // are unpublished with redirects in next.config.js.
  const finishCategory = (category) => {
    category.children = category.children.map(finishCategory).filter(Boolean);
    category.article_count = navigationArticles(category).length;
    return category.article_count ? category : null;
  };
  // Empty groups leave the menu; unknown sections keep their CMS order after
  // the known ones.
  const sectionRank = (category) => {
    const index = NAVIGATION_ORDER.indexOf(category.slug);
    return index < 0 ? NAVIGATION_ORDER.length : index;
  };
  return tree.map(finishCategory).filter(Boolean)
    .sort((left, right) => sectionRank(left) - sectionRank(right));
}

export function navigationArticleContext(tree, article) {
  const key = navigationArticleKey(article);
  if (!key) return null;
  for (const section of tree || []) {
    const articles = navigationArticles(section);
    const index = articles.findIndex((candidate) => navigationArticleKey(candidate) === key);
    if (index >= 0) return {
      section,
      previous: articles[index - 1] || null,
      next: articles[index + 1] || null,
    };
  }
  return null;
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

export async function fetchSiteConfig({ lang } = {}) {
  const normalized = normalizeLanguage(lang);
  const query = normalized === DEFAULT_LANGUAGE ? '' : `?lang=${encodeURIComponent(normalized)}`;
  const json = await apiFetch(`site/${query}`);
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
  return json ? buildDocumentationNavigation(extractData(json), normalized) : null;
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
  const data = extractData(json);
  if (Array.isArray(data)) return data.filter((article) => isPublicDocumentationArticle(article, normalized));
  if (Array.isArray(data?.results)) {
    const results = data.results.filter((article) => isPublicDocumentationArticle(article, normalized));
    return { ...data, results, count: data.count - (data.results.length - results.length) };
  }
  return data;
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
  const article = extractData(json);
  return article && isPublicDocumentationArticle(article, normalized) ? article : null;
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
  if (Array.isArray(data)) return data.filter((article) => isPublicDocumentationArticle(article, normalized));
  return [];
}

export async function fetchNetworkStats() {
  const json = await rawApiFetch('privacy_network/vpn/public/network-stats/');
  if (!json) return null;
  if (json.success === true && json.data) return json.data;
  return extractData(json);
}
