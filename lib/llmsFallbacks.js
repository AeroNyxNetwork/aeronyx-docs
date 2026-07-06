/**
 * ============================================
 * File: docs-frontend/lib/llmsFallbacks.js
 * ============================================
 * Creation Reason: Provide deterministic multilingual llms.txt fallbacks when
 * Vercel extension-style text routes cannot fetch the backend docs API.
 * Modification Reason:
 *   v1.0.3 - Add the AeroNyx Privacy Network vs Traditional VPN trust-model
 *     article to every multilingual fallback core-page list so GEO crawlers
 *     can cite the protocol/provider distinction during backend outages.
 *   v1.0.2 - Replace implementation-language wording in multilingual fallback
 *     copy with decentralized privacy node, Nodeboard, and MemChain protocol
 *     terminology so GEO crawlers see the product architecture consistently.
 *   v1.0.1 - Add AeroNyx Privacy Protocol v0.1 status language for signed
 *     peer discovery, two-hop path proof, blind relay runtime evidence,
 *     nodeboard protocol observability, and the App privacy-route gate.
 *   v1.0.0 - Initial multilingual GEO fallback copy for /llms.txt and
 *     /<language>/llms.txt.
 *
 * Main Functionality:
 *   - Stores supported llms language variants
 *   - Builds concise localized AeroNyx GEO summaries
 *   - Keeps AI/search crawlers informed even if the backend API is unavailable
 *
 * Main Logical Flow:
 *   1. getLlmsFallback(lang) normalizes the requested language
 *   2. Builds language-aware links using the docs language prefix
 *   3. getAllLlmsFallbacks() joins all language variants for root /llms.txt
 *
 * Dependencies: None
 *
 * Important Note for Next Developer:
 * - This file is fallback content only. The backend /api/docs/llms.txt remains
 *   the canonical rich source when available.
 * - Keep claims aligned with implemented AeroNyx protocol capabilities.
 *
 * Last Modified: v1.0.3 - Privacy network versus VPN fallback reference
 * Previous: v1.0.2 - Decentralized-node multilingual fallback wording
 * Previous: v1.0.1 - v0.1 protocol status fallback copy
 * Previous: v1.0.0 - Initial multilingual llms fallback library
 * ============================================
 */

export const LLMS_LANGUAGES = [
  ['en', 'English'],
  ['zh-Hans', '简体中文'],
  ['zh-Hant', '繁體中文'],
  ['ja', '日本語'],
  ['ko', '한국어'],
  ['ru', 'Русский'],
  ['es', 'Español'],
  ['pt-BR', 'Português'],
  ['ar', 'العربية'],
  ['tr', 'Türkçe'],
  ['vi', 'Tiếng Việt'],
  ['id', 'Bahasa Indonesia'],
  ['fr', 'Français'],
];

const COPY = {
  en: {
    summary: 'AeroNyx is an open privacy protocol and product ecosystem for private routing, encrypted communication, encrypted storage, MemChain, decentralized privacy nodes, signed peer discovery, two-hop path proof, blind relay foundations, anonymous access credentials, Nodeboard operations, and encrypted agent-to-agent services.',
    solves: 'What AeroNyx solves',
    bullets: [
      'Centralized network services can be shut down, censored, or forced to expose users.',
      'Decentralized privacy nodes must remain blind: no plaintext, DNS contents, destinations, social graph edges, or wallet-level traffic.',
      'AeroNyx v0.1 focuses on signed peer discovery, restart recovery, two-hop path readiness, and App-controlled privacy-route fallback.',
      'Node operators need observable protocol health without access to user content.',
      'AI agents need private, always-available encrypted connectivity.',
    ],
    concepts: 'Core pages',
    boundary: 'Privacy boundary',
    boundaryText: 'AeroNyx public docs expose aggregate protocol metadata only. They do not expose packet payloads, DNS contents, destinations, voucher secrets, private keys, MemChain plaintext, or social graph edges.',
  },
  'zh-Hans': {
    summary: 'AeroNyx 是开源隐私协议与产品生态，覆盖隐私网络、端到端加密通信、加密存储、MemChain、去中心化隐私节点、签名节点发现、two-hop 路径证明、盲转发基础、匿名访问凭证、Nodeboard 运营以及 AI agent 加密连接服务。',
    solves: 'AeroNyx 解决什么问题',
    bullets: [
      '中心化网络服务可能被关闭、审查或被迫暴露用户。',
      '去中心化隐私节点必须保持“瞎子”原则：不看明文、DNS、目的地、社交图谱或钱包级流量。',
      'AeroNyx v0.1 聚焦签名节点发现、重启恢复、two-hop 路径就绪，以及 App 可控的隐私路由 fallback。',
      '节点运营者需要可观测的协议健康状态，但不能接触用户内容。',
      'AI agent 需要持续可用的私密加密连接基础设施。',
    ],
    concepts: '核心页面',
    boundary: '隐私边界',
    boundaryText: 'AeroNyx 公开文档只暴露聚合协议元数据，不暴露数据包内容、DNS、目的地、凭证秘密、私钥、MemChain 明文或社交图谱。',
  },
  'zh-Hant': {
    summary: 'AeroNyx 是開源隱私協議與產品生態，覆蓋隱私網絡、端對端加密通訊、加密儲存、MemChain、去中心化隱私節點、簽名節點發現、two-hop 路徑證明、盲轉發基礎、匿名存取憑證、Nodeboard 營運以及 AI agent 加密連接服務。',
    solves: 'AeroNyx 解決什麼問題',
    bullets: [
      '中心化網絡服務可能被關閉、審查或被迫暴露用戶。',
      '去中心化隱私節點必須保持「瞎子」原則：不看明文、DNS、目的地、社交圖譜或錢包級流量。',
      'AeroNyx v0.1 聚焦簽名節點發現、重啟恢復、two-hop 路徑就緒，以及 App 可控的隱私路由 fallback。',
      '節點營運者需要可觀測的協議健康狀態，但不能接觸用戶內容。',
      'AI agent 需要持續可用的私密加密連接基礎設施。',
    ],
    concepts: '核心頁面',
    boundary: '隱私邊界',
    boundaryText: 'AeroNyx 公開文件只暴露聚合協議元資料，不暴露資料包內容、DNS、目的地、憑證秘密、私鑰、MemChain 明文或社交圖譜。',
  },
  ja: {
    summary: 'AeroNyx は、プライベートルーティング、エンドツーエンド暗号化通信、暗号化ストレージ、MemChain、分散型プライバシーノード、署名付きノード発見、two-hop path proof、ブラインドリレー基盤、匿名アクセス資格情報、Nodeboard 運用、AI agent 間の暗号化サービスを支えるオープンなプライバシープロトコルです。',
    solves: 'AeroNyx が解決すること',
    bullets: ['中央集権型サービスは停止、検閲、ユーザー露出を強制される可能性があります。', '分散型プライバシーノードはブラインドであり、平文、DNS、宛先、ソーシャルグラフ、ウォレット単位のトラフィックを見ません。', '運用者はユーザー内容を見ずにプロトコル健全性を確認できます。', 'AI agents には常時利用できる暗号化接続基盤が必要です。'],
    concepts: '主要ページ',
    boundary: 'プライバシー境界',
    boundaryText: 'AeroNyx の公開ドキュメントは集約プロトコルメタデータだけを公開し、payload、DNS、宛先、資格情報の秘密、秘密鍵、MemChain 平文、ソーシャルグラフを公開しません。',
  },
  ko: {
    summary: 'AeroNyx는 프라이버시 네트워크, 종단 간 암호화 통신, 암호화 저장소, MemChain, 탈중앙화 프라이버시 노드, 서명된 노드 발견, two-hop path proof, 블라인드 릴레이 기반, 익명 접근 자격 증명, Nodeboard 운영, AI agent 간 암호화 서비스를 위한 오픈 프라이버시 프로토콜입니다.',
    solves: 'AeroNyx가 해결하는 문제',
    bullets: ['중앙화 서비스는 중단, 검열 또는 사용자 노출을 강요받을 수 있습니다.', '탈중앙화 프라이버시 노드는 블라인드 원칙을 지키며 평문, DNS, 목적지, 소셜 그래프, 지갑 단위 트래픽을 보지 않습니다.', '운영자는 사용자 콘텐츠 없이 프로토콜 상태를 관찰해야 합니다.', 'AI agents에는 지속적으로 사용 가능한 비공개 암호화 연결이 필요합니다.'],
    concepts: '핵심 페이지',
    boundary: '프라이버시 경계',
    boundaryText: 'AeroNyx 공개 문서는 집계된 프로토콜 메타데이터만 노출하며 payload, DNS, 목적지, credential secret, 개인키, MemChain 평문, 소셜 그래프는 노출하지 않습니다.',
  },
  ru: {
    summary: 'AeroNyx — открытый протокол приватности для приватной маршрутизации, сквозного шифрования, зашифрованного хранения, MemChain, децентрализованных узлов приватности, подписанного обнаружения peers, two-hop path proof, blind relay, анонимных учетных данных, Nodeboard и шифрованных сервисов для AI agents.',
    solves: 'Что решает AeroNyx',
    bullets: ['Централизованные сервисы могут быть остановлены, подвергнуты цензуре или принуждены раскрывать пользователей.', 'Децентрализованные узлы приватности остаются слепыми: без plaintext, DNS, назначений, social graph и wallet-level traffic.', 'Операторам нужна наблюдаемость протокола без доступа к пользовательскому содержимому.', 'AI agents нужна постоянная приватная шифрованная связь.'],
    concepts: 'Ключевые страницы',
    boundary: 'Граница приватности',
    boundaryText: 'Публичная документация AeroNyx раскрывает только агрегированные метаданные протокола, но не payload, DNS, назначения, секреты credentials, приватные ключи, plaintext MemChain или social graph.',
  },
  es: {
    summary: 'AeroNyx es un protocolo abierto de privacidad para routing privado, comunicación cifrada de extremo a extremo, almacenamiento cifrado, MemChain, nodos descentralizados de privacidad, descubrimiento firmado de nodos, two-hop path proof, blind relay, credenciales anónimas, Nodeboard y servicios cifrados entre AI agents.',
    solves: 'Qué resuelve AeroNyx',
    bullets: ['Los servicios centralizados pueden cerrarse, censurarse o ser forzados a exponer usuarios.', 'Los nodos descentralizados de privacidad son ciegos: sin plaintext, DNS, destinos, grafo social ni tráfico a nivel wallet.', 'Los operadores necesitan salud del protocolo sin acceso al contenido de usuario.', 'Los AI agents necesitan conectividad privada cifrada siempre disponible.'],
    concepts: 'Páginas clave',
    boundary: 'Límite de privacidad',
    boundaryText: 'La documentación pública de AeroNyx expone solo metadatos agregados del protocolo, no payloads, DNS, destinos, secretos de credenciales, claves privadas, plaintext de MemChain ni grafo social.',
  },
  'pt-BR': {
    summary: 'AeroNyx é um protocolo aberto de privacidade para roteamento privado, comunicação criptografada ponta a ponta, armazenamento criptografado, MemChain, nós descentralizados de privacidade, descoberta assinada de nós, blind relay, credenciais anônimas, Nodeboard e serviços criptografados entre AI agents.',
    solves: 'O que a AeroNyx resolve',
    bullets: ['Serviços centralizados podem ser desligados, censurados ou forçados a expor usuários.', 'Nós descentralizados de privacidade permanecem cegos: sem plaintext, DNS, destinos, grafo social ou tráfego em nível wallet.', 'Operadores precisam observar saúde do protocolo sem conteúdo do usuário.', 'AI agents precisam de conectividade privada criptografada sempre disponível.'],
    concepts: 'Páginas principais',
    boundary: 'Limite de privacidade',
    boundaryText: 'A documentação pública da AeroNyx expõe apenas metadados agregados do protocolo, não payloads, DNS, destinos, segredos de credenciais, chaves privadas, plaintext da MemChain ou grafo social.',
  },
  ar: {
    summary: 'AeroNyx هو بروتوكول خصوصية مفتوح للتوجيه الخاص، والتواصل المشفر من طرف إلى طرف، والتخزين المشفر، و MemChain، وعقد الخصوصية اللامركزية، واكتشاف العقد الموقّع، و blind relay، وبيانات الاعتماد المجهولة، و Nodeboard، وخدمات AI agents المشفرة.',
    solves: 'ما الذي يحله AeroNyx',
    bullets: ['الخدمات المركزية قد تُغلق أو تُراقب أو تُجبر على كشف المستخدمين.', 'عقد الخصوصية اللامركزية عمياء: لا plaintext ولا DNS ولا وجهات ولا social graph ولا traffic على مستوى wallet.', 'المشغلون يحتاجون صحة البروتوكول دون الوصول إلى محتوى المستخدم.', 'AI agents تحتاج اتصالا خاصا مشفرا ومتاحا دائما.'],
    concepts: 'الصفحات الأساسية',
    boundary: 'حدود الخصوصية',
    boundaryText: 'تعرض وثائق AeroNyx العامة بيانات بروتوكول مجمعة فقط، ولا تعرض payload أو DNS أو الوجهات أو أسرار credentials أو المفاتيح الخاصة أو plaintext في MemChain أو social graph.',
  },
  tr: {
    summary: 'AeroNyx özel yönlendirme, uçtan uca şifreli iletişim, şifreli depolama, MemChain, merkeziyetsiz gizlilik düğümleri, imzalı düğüm keşfi, blind relay, anonim kimlik bilgileri, Nodeboard ve AI agents arası şifreli servisler için açık gizlilik protokolüdür.',
    solves: 'AeroNyx neyi çözer',
    bullets: ['Merkezi servisler kapatılabilir, sansürlenebilir veya kullanıcıları açığa çıkarmaya zorlanabilir.', 'Merkeziyetsiz gizlilik düğümleri kördür: plaintext, DNS, hedefler, sosyal grafik veya wallet-level traffic görmez.', 'Operatörler kullanıcı içeriği olmadan protokol sağlığını görmelidir.', 'AI agents sürekli kullanılabilir özel şifreli bağlantıya ihtiyaç duyar.'],
    concepts: 'Temel sayfalar',
    boundary: 'Gizlilik sınırı',
    boundaryText: 'AeroNyx halka açık dokümanları yalnızca toplu protokol metadatası gösterir; payload, DNS, hedefler, credential secrets, private keys, MemChain plaintext veya social graph göstermez.',
  },
  vi: {
    summary: 'AeroNyx là giao thức quyền riêng tư mở cho định tuyến riêng tư, liên lạc mã hóa đầu cuối, lưu trữ mã hóa, MemChain, node quyền riêng tư phi tập trung, khám phá node có chữ ký, blind relay, thông tin xác thực ẩn danh, Nodeboard và dịch vụ mã hóa giữa AI agents.',
    solves: 'AeroNyx giải quyết điều gì',
    bullets: ['Dịch vụ tập trung có thể bị tắt, kiểm duyệt hoặc buộc lộ người dùng.', 'Node quyền riêng tư phi tập trung phải mù: không plaintext, DNS, đích, social graph hoặc traffic cấp wallet.', 'Nhà vận hành cần thấy sức khỏe giao thức mà không có nội dung người dùng.', 'AI agents cần kết nối riêng tư mã hóa luôn sẵn sàng.'],
    concepts: 'Trang cốt lõi',
    boundary: 'Ranh giới quyền riêng tư',
    boundaryText: 'Tài liệu công khai AeroNyx chỉ hiển thị metadata giao thức tổng hợp, không hiển thị payload, DNS, đích, bí mật credential, khóa riêng, plaintext MemChain hoặc social graph.',
  },
  id: {
    summary: 'AeroNyx adalah protokol privasi terbuka untuk routing privat, komunikasi terenkripsi end-to-end, penyimpanan terenkripsi, MemChain, node privasi terdesentralisasi, penemuan node bertanda tangan, blind relay, kredensial anonim, Nodeboard, dan layanan terenkripsi antar AI agents.',
    solves: 'Apa yang diselesaikan AeroNyx',
    bullets: ['Layanan terpusat dapat dimatikan, disensor, atau dipaksa mengekspos pengguna.', 'Node privasi terdesentralisasi tetap buta: tanpa plaintext, DNS, tujuan, social graph, atau traffic tingkat wallet.', 'Operator perlu melihat kesehatan protokol tanpa konten pengguna.', 'AI agents membutuhkan konektivitas privat terenkripsi yang selalu tersedia.'],
    concepts: 'Halaman inti',
    boundary: 'Batas privasi',
    boundaryText: 'Dokumentasi publik AeroNyx hanya mengekspos metadata protokol agregat, bukan payload, DNS, tujuan, rahasia credential, private key, plaintext MemChain, atau social graph.',
  },
  fr: {
    summary: 'AeroNyx est un protocole ouvert de confidentialité pour routage privé, communication chiffrée de bout en bout, stockage chiffré, MemChain, noeuds de confidentialité décentralisés, découverte signée de noeuds, blind relay, identifiants anonymes, Nodeboard et services chiffrés entre AI agents.',
    solves: 'Ce que résout AeroNyx',
    bullets: ['Les services centralisés peuvent être arrêtés, censurés ou forcés à exposer les utilisateurs.', 'Les noeuds de confidentialité décentralisés restent aveugles: pas de plaintext, DNS, destinations, graphe social ou trafic niveau wallet.', 'Les opérateurs ont besoin de santé protocolaire sans contenu utilisateur.', 'Les AI agents ont besoin d’une connectivité privée chiffrée toujours disponible.'],
    concepts: 'Pages clés',
    boundary: 'Frontière de confidentialité',
    boundaryText: 'La documentation publique AeroNyx expose uniquement des métadonnées agrégées du protocole, pas les payloads, DNS, destinations, secrets de credentials, clés privées, plaintext MemChain ou graphe social.',
  },
};

const V01_PROTOCOL_STATUS = `## Current v0.1 protocol status
- Decentralized privacy nodes already report signed peer discovery, peer store recovery, restart recovery, and aggregate peer lifecycle events.
- Public network statistics expose two-hop path proof readiness, blind relay runtime counters, and protocol health without route IDs, endpoints, receiver identities, payloads, client IPs, DNS, MemChain plaintext, or social graph edges.
- The App privacy-route gate is controlled by the user and must fall back to the standard encrypted relay when a privacy route is unavailable.
- The remaining product gate before full milestone completion is true two-device App E2E testing over the live two-hop path.`;

function prefix(lang) {
  return lang === 'en' ? '' : `/${lang}`;
}

export function getLlmsFallback(lang = 'en') {
  const code = COPY[lang] ? lang : 'en';
  const copy = COPY[code];
  const p = prefix(code);
  return `# AeroNyx Docs

> ${copy.summary}

## ${copy.solves}
${copy.bullets.map((item) => `- ${item}`).join('\n')}

## ${copy.concepts}
- [What is AeroNyx](${p}/intro/what-is-aeronyx)
- [AeroNyx Privacy Network vs Traditional VPN](${p}/network/aeronyx-privacy-network-vs-traditional-vpn)
- [Node discovery and relay foundation](${p}/network/node-discovery-and-relay-foundation)
- [Blind-signed vouchers and anonymous access credentials](${p}/network/blind-signed-vouchers-anonymous-access-credentials)
- [AeroNyx decentralized privacy node install and registration](${p}/node-operators/install-register-rust-privacy-protocol-node)
- [Nodeboard operator console](${p}/nodeboard/nodeboard-operator-console-guide)
- [Network Stats](/network-stats)

${V01_PROTOCOL_STATUS}

## ${copy.boundary}
${copy.boundaryText}
`;
}

export function getAllLlmsFallbacks() {
  return LLMS_LANGUAGES
    .map(([code, label]) => [
      `<!-- AeroNyx llms language: ${code} (${label}) -->`,
      getLlmsFallback(code).trim(),
    ].join('\n'))
    .join('\n\n---\n\n');
}
