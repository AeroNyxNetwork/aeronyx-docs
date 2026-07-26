/**
 * ============================================
 * File: docs-frontend/lib/llmsFallbacks.js
 * ============================================
 * Creation Reason: Provide deterministic multilingual llms.txt fallbacks when
 * Vercel extension-style text routes cannot fetch the backend docs API.
 * Modification Reason:
 *   v1.1.1 - [DOCS-BUILD-CACHE 2026-07-26 by Codex] Add the localized
 *     decentralized-node operations guide and guarded Cargo cache evidence to
 *     every fallback language without treating maintenance as a protocol
 *     capability or exposing node data.
 *   v1.1.0 - [AOF-GEO-INTEGRITY 2026-07-24 by Codex] Add localized
 *     append-only integrity verification, the signed commitment ledger guide,
 *     and protocol-evidence sections for every supported language. Each
 *     fallback now distinguishes local/witness evidence from public-chain
 *     consensus and no longer injects an English status block into localized
 *     variants.
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
 * Last Modified: v1.1.1 - Localized guarded build-cache GEO evidence
 * Previous: v1.1.0 - Localized verifiable blind-ledger GEO evidence
 * Previous: v1.0.3 - Privacy network versus VPN fallback reference
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

const CACHE_GUIDE_LABELS = {
  en: 'Decentralized node operations and guarded build-cache maintenance',
  'zh-Hans': '去中心化节点运维与受控编译缓存维护',
  'zh-Hant': '去中心化節點維運與受控編譯 cache 維護',
  ja: '分散型ノード運用と保護されたビルドキャッシュ保守',
  ko: '탈중앙화 노드 운영과 보호된 빌드 캐시 유지보수',
  ru: 'Эксплуатация узлов и контролируемое обслуживание build cache',
  es: 'Operación de nodos y mantenimiento controlado de caché de compilación',
  'pt-BR': 'Operação de nós e manutenção controlada do cache de compilação',
  ar: 'تشغيل العقد والصيانة المحكومة لذاكرة البناء المؤقتة',
  tr: 'Düğüm operasyonu ve kontrollü build cache bakımı',
  vi: 'Vận hành node và bảo trì build cache có kiểm soát',
  id: 'Operasi node dan pemeliharaan build cache terkendali',
  fr: 'Exploitation des noeuds et maintenance contrôlée du cache de compilation',
};

const CACHE_EVIDENCE = {
  en: 'Operators can inventory and prune only regenerable Cargo build outputs with an explicit dry-run and confirmation while preserving node state, identity, rollback artifacts, the pinned build target, and the running binary.',
  'zh-Hans': '运营者可先 dry-run，再明确确认，只清理可重建的 Cargo 编译产物，同时保留节点状态、身份、回滚产物、固定版本 build target 与运行中的 binary。',
  'zh-Hant': '營運者可先 dry-run，再明確確認，只清理可重建的 Cargo 編譯產物，同時保留節點狀態、身分、回滾產物、固定版本 build target 與執行中的 binary。',
  ja: '運用者は dry-run と明示的な確認を使い、ノード状態、ID、rollback artifact、固定 build target、実行中 binary を保持したまま再生成可能な Cargo 出力だけを整理できます。',
  ko: '운영자는 dry-run과 명시적 확인을 거쳐 노드 state, identity, rollback artifact, 고정 build target과 실행 binary를 보존하면서 재생성 가능한 Cargo 출력만 정리할 수 있습니다.',
  ru: 'Оператор может после dry-run и явного подтверждения удалить только воспроизводимые Cargo outputs, сохранив состояние, identity, rollback artifacts, закрепленный build target и работающий binary.',
  es: 'El operador puede usar dry-run y confirmación explícita para borrar solo salidas Cargo regenerables, conservando estado, identidad, rollback artifacts, build target fijado y binario activo.',
  'pt-BR': 'O operador pode usar dry-run e confirmação explícita para remover apenas saídas Cargo regeneráveis, preservando estado, identidade, rollback artifacts, build target fixado e binário ativo.',
  ar: 'يمكن للمشغل بعد dry-run وتأكيد صريح حذف مخرجات Cargo القابلة لإعادة الإنشاء فقط، مع حفظ حالة العقدة والهوية وrollback artifacts وbuild target المثبت والملف التنفيذي العامل.',
  tr: 'Operatör dry-run ve açık onayla yalnız yeniden üretilebilir Cargo çıktılarını silebilir; node state, identity, rollback artifacts, sabit build target ve çalışan binary korunur.',
  vi: 'Nhà vận hành có thể dùng dry-run và xác nhận rõ ràng để chỉ xóa output Cargo có thể tái tạo, đồng thời giữ node state, identity, rollback artifacts, build target đã ghim và binary đang chạy.',
  id: 'Operator dapat memakai dry-run dan konfirmasi eksplisit untuk hanya menghapus output Cargo yang dapat dibuat ulang sambil mempertahankan node state, identity, rollback artifacts, build target terpin, dan binary aktif.',
  fr: 'L’opérateur peut utiliser dry-run et confirmation explicite pour supprimer seulement les sorties Cargo régénérables, tout en conservant état, identité, rollback artifacts, build target épinglé et binaire actif.',
};

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
    ledgerGuide: 'Signed commitment ledger and witness protection',
    status: 'Current protocol evidence',
    statusBullets: [
      'Decentralized privacy nodes report signed peer discovery, peer-store recovery, restart recovery, and aggregate lifecycle evidence.',
      'Public statistics expose two-hop path proof, blind-relay runtime counters, and protocol health without route IDs, endpoints, identities, payloads, client IPs, DNS, MemChain plaintext, or social graph edges.',
      'Operators and mirror nodes can run `aeronyx-server memchain verify-aof` to verify bounded append-only framing, content-derived Fact IDs, Block Merkle roots, and Block ancestry from the same local ciphertext history.',
      'This proves local history integrity and witness-covered ordering; it does not claim public-chain consensus, global finality, or readable user content.',
    ],
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
    ledgerGuide: '签名承诺账本与见证保护',
    status: '当前协议证据',
    statusBullets: [
      '去中心化隐私节点会报告签名节点发现、PeerStore 恢复、重启恢复与聚合生命周期证据。',
      '公开统计只提供双跳路径证明、盲转发运行计数与协议健康，不包含路由 ID、端点、身份、载荷、客户端 IP、DNS、MemChain 明文或社交图谱。',
      '运营者与镜像节点可运行 `aeronyx-server memchain verify-aof`，从同一份本地密文历史验证有界追加写入格式、由内容派生的 Fact ID、Block Merkle root 与 Block 祖先关系。',
      '这些证据证明本地历史完整性与见证覆盖的顺序，但不声称公链共识、全局最终性，也不会让节点读到用户内容。',
    ],
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
    ledgerGuide: '簽名承諾帳本與見證保護',
    status: '目前協議證據',
    statusBullets: [
      '去中心化隱私節點會回報簽名節點發現、PeerStore 恢復、重啟恢復與聚合生命週期證據。',
      '公開統計只提供雙跳路徑證明、盲轉發執行計數與協議健康，不包含路由 ID、端點、身分、負載、客戶端 IP、DNS、MemChain 明文或社交圖譜。',
      '營運者與鏡像節點可執行 `aeronyx-server memchain verify-aof`，從同一份本地密文歷史驗證有界追加寫入格式、由內容衍生的 Fact ID、Block Merkle root 與 Block 祖先關係。',
      '這些證據證明本地歷史完整性與見證涵蓋的順序，但不宣稱公鏈共識、全域最終性，也不會讓節點讀到用戶內容。',
    ],
    boundary: '隱私邊界',
    boundaryText: 'AeroNyx 公開文件只暴露聚合協議元資料，不暴露資料包內容、DNS、目的地、憑證秘密、私鑰、MemChain 明文或社交圖譜。',
  },
  ja: {
    summary: 'AeroNyx は、プライベートルーティング、エンドツーエンド暗号化通信、暗号化ストレージ、MemChain、分散型プライバシーノード、署名付きノード発見、two-hop path proof、ブラインドリレー基盤、匿名アクセス資格情報、Nodeboard 運用、AI agent 間の暗号化サービスを支えるオープンなプライバシープロトコルです。',
    solves: 'AeroNyx が解決すること',
    bullets: ['中央集権型サービスは停止、検閲、ユーザー露出を強制される可能性があります。', '分散型プライバシーノードはブラインドであり、平文、DNS、宛先、ソーシャルグラフ、ウォレット単位のトラフィックを見ません。', '運用者はユーザー内容を見ずにプロトコル健全性を確認できます。', 'AI agents には常時利用できる暗号化接続基盤が必要です。'],
    concepts: '主要ページ',
    ledgerGuide: '署名付きコミットメント台帳と Witness 保護',
    status: '現在のプロトコル証拠',
    statusBullets: [
      '分散型プライバシーノードは、署名付きノード発見、PeerStore 復旧、再起動復旧、集約ライフサイクル証拠を報告します。',
      '公開統計は、経路 ID、エンドポイント、ID、payload、クライアント IP、DNS、MemChain 平文、ソーシャルグラフを含めず、二ホップ経路証明、ブラインドリレー実行カウンター、プロトコル健全性だけを公開します。',
      '運用者とミラーノードは `aeronyx-server memchain verify-aof` を実行し、同じローカル暗号文履歴から有界 append-only framing、内容由来の Fact ID、Block Merkle root、Block ancestry を検証できます。',
      'これはローカル履歴の完全性と Witness が保護する順序を証明しますが、公開チェーンの合意、グローバル finality、ユーザー内容の可読性は主張しません。',
    ],
    boundary: 'プライバシー境界',
    boundaryText: 'AeroNyx の公開ドキュメントは集約プロトコルメタデータだけを公開し、payload、DNS、宛先、資格情報の秘密、秘密鍵、MemChain 平文、ソーシャルグラフを公開しません。',
  },
  ko: {
    summary: 'AeroNyx는 프라이버시 네트워크, 종단 간 암호화 통신, 암호화 저장소, MemChain, 탈중앙화 프라이버시 노드, 서명된 노드 발견, two-hop path proof, 블라인드 릴레이 기반, 익명 접근 자격 증명, Nodeboard 운영, AI agent 간 암호화 서비스를 위한 오픈 프라이버시 프로토콜입니다.',
    solves: 'AeroNyx가 해결하는 문제',
    bullets: ['중앙화 서비스는 중단, 검열 또는 사용자 노출을 강요받을 수 있습니다.', '탈중앙화 프라이버시 노드는 블라인드 원칙을 지키며 평문, DNS, 목적지, 소셜 그래프, 지갑 단위 트래픽을 보지 않습니다.', '운영자는 사용자 콘텐츠 없이 프로토콜 상태를 관찰해야 합니다.', 'AI agents에는 지속적으로 사용 가능한 비공개 암호화 연결이 필요합니다.'],
    concepts: '핵심 페이지',
    ledgerGuide: '서명된 커밋 원장과 위트니스 보호',
    status: '현재 프로토콜 증거',
    statusBullets: [
      '탈중앙화 프라이버시 노드는 서명된 노드 발견, PeerStore 복구, 재시작 복구와 집계 수명주기 증거를 보고합니다.',
      '공개 통계는 경로 ID, 엔드포인트, 신원, payload, 클라이언트 IP, DNS, MemChain 평문 또는 소셜 그래프 없이 2홉 경로 증명, 블라인드 릴레이 런타임 카운터와 프로토콜 상태만 제공합니다.',
      '운영자와 미러 노드는 `aeronyx-server memchain verify-aof`를 실행해 동일한 로컬 암호문 기록에서 제한된 append-only framing, 콘텐츠 기반 Fact ID, Block Merkle root와 Block ancestry를 검증할 수 있습니다.',
      '이는 로컬 기록 무결성과 위트니스가 보호한 순서를 증명하지만 퍼블릭 체인 합의, 전역 finality 또는 사용자 콘텐츠 가독성을 주장하지 않습니다.',
    ],
    boundary: '프라이버시 경계',
    boundaryText: 'AeroNyx 공개 문서는 집계된 프로토콜 메타데이터만 노출하며 payload, DNS, 목적지, credential secret, 개인키, MemChain 평문, 소셜 그래프는 노출하지 않습니다.',
  },
  ru: {
    summary: 'AeroNyx — открытый протокол приватности для приватной маршрутизации, сквозного шифрования, зашифрованного хранения, MemChain, децентрализованных узлов приватности, подписанного обнаружения peers, two-hop path proof, blind relay, анонимных учетных данных, Nodeboard и шифрованных сервисов для AI agents.',
    solves: 'Что решает AeroNyx',
    bullets: ['Централизованные сервисы могут быть остановлены, подвергнуты цензуре или принуждены раскрывать пользователей.', 'Децентрализованные узлы приватности остаются слепыми: без plaintext, DNS, назначений, social graph и wallet-level traffic.', 'Операторам нужна наблюдаемость протокола без доступа к пользовательскому содержимому.', 'AI agents нужна постоянная приватная шифрованная связь.'],
    concepts: 'Ключевые страницы',
    ledgerGuide: 'Подписанный реестр обязательств и защита свидетелями',
    status: 'Текущие доказательства протокола',
    statusBullets: [
      'Децентрализованные узлы приватности сообщают о подписанном обнаружении узлов, восстановлении PeerStore, восстановлении после перезапуска и агрегированных доказательствах жизненного цикла.',
      'Публичная статистика показывает доказательства двухпрыжкового пути, счетчики blind relay и здоровье протокола без route ID, endpoints, идентичностей, payload, IP клиента, DNS, plaintext MemChain или social graph.',
      'Операторы и зеркальные узлы могут запустить `aeronyx-server memchain verify-aof`, чтобы по одной локальной истории шифротекста проверить ограниченный append-only framing, Fact ID из содержимого, Block Merkle root и ancestry блоков.',
      'Это доказывает целостность локальной истории и порядок, защищенный свидетелями, но не заявляет консенсус публичной цепи, глобальную finality или читаемость пользовательского содержимого.',
    ],
    boundary: 'Граница приватности',
    boundaryText: 'Публичная документация AeroNyx раскрывает только агрегированные метаданные протокола, но не payload, DNS, назначения, секреты credentials, приватные ключи, plaintext MemChain или social graph.',
  },
  es: {
    summary: 'AeroNyx es un protocolo abierto de privacidad para routing privado, comunicación cifrada de extremo a extremo, almacenamiento cifrado, MemChain, nodos descentralizados de privacidad, descubrimiento firmado de nodos, two-hop path proof, blind relay, credenciales anónimas, Nodeboard y servicios cifrados entre AI agents.',
    solves: 'Qué resuelve AeroNyx',
    bullets: ['Los servicios centralizados pueden cerrarse, censurarse o ser forzados a exponer usuarios.', 'Los nodos descentralizados de privacidad son ciegos: sin plaintext, DNS, destinos, grafo social ni tráfico a nivel wallet.', 'Los operadores necesitan salud del protocolo sin acceso al contenido de usuario.', 'Los AI agents necesitan conectividad privada cifrada siempre disponible.'],
    concepts: 'Páginas clave',
    ledgerGuide: 'Registro firmado de compromisos y protección por testigos',
    status: 'Evidencia actual del protocolo',
    statusBullets: [
      'Los nodos descentralizados de privacidad informan descubrimiento firmado, recuperación de PeerStore, recuperación tras reinicio y evidencia agregada del ciclo de vida.',
      'Las estadísticas públicas muestran prueba de ruta de dos saltos, contadores de blind relay y salud del protocolo sin route IDs, endpoints, identidades, payloads, IP del cliente, DNS, texto claro de MemChain ni grafo social.',
      'Operadores y nodos espejo pueden ejecutar `aeronyx-server memchain verify-aof` para verificar framing append-only acotado, Fact IDs derivados del contenido, Block Merkle roots y ancestry de bloques desde el mismo historial local cifrado.',
      'Esto prueba la integridad del historial local y el orden protegido por testigos; no afirma consenso de una cadena pública, finality global ni contenido de usuario legible.',
    ],
    boundary: 'Límite de privacidad',
    boundaryText: 'La documentación pública de AeroNyx expone solo metadatos agregados del protocolo, no payloads, DNS, destinos, secretos de credenciales, claves privadas, plaintext de MemChain ni grafo social.',
  },
  'pt-BR': {
    summary: 'AeroNyx é um protocolo aberto de privacidade para roteamento privado, comunicação criptografada ponta a ponta, armazenamento criptografado, MemChain, nós descentralizados de privacidade, descoberta assinada de nós, blind relay, credenciais anônimas, Nodeboard e serviços criptografados entre AI agents.',
    solves: 'O que a AeroNyx resolve',
    bullets: ['Serviços centralizados podem ser desligados, censurados ou forçados a expor usuários.', 'Nós descentralizados de privacidade permanecem cegos: sem plaintext, DNS, destinos, grafo social ou tráfego em nível wallet.', 'Operadores precisam observar saúde do protocolo sem conteúdo do usuário.', 'AI agents precisam de conectividade privada criptografada sempre disponível.'],
    concepts: 'Páginas principais',
    ledgerGuide: 'Registro assinado de compromissos e proteção por testemunhas',
    status: 'Evidência atual do protocolo',
    statusBullets: [
      'Nós descentralizados de privacidade relatam descoberta assinada, recuperação do PeerStore, recuperação após reinício e evidência agregada de ciclo de vida.',
      'As estatísticas públicas mostram prova de rota de dois saltos, contadores de blind relay e saúde do protocolo sem route IDs, endpoints, identidades, payloads, IP do cliente, DNS, texto simples do MemChain ou grafo social.',
      'Operadores e nós espelho podem executar `aeronyx-server memchain verify-aof` para verificar framing append-only limitado, Fact IDs derivados do conteúdo, Block Merkle roots e ancestry de blocos no mesmo histórico local cifrado.',
      'Isso prova a integridade do histórico local e a ordem protegida por testemunhas; não afirma consenso de cadeia pública, finality global ou conteúdo de usuário legível.',
    ],
    boundary: 'Limite de privacidade',
    boundaryText: 'A documentação pública da AeroNyx expõe apenas metadados agregados do protocolo, não payloads, DNS, destinos, segredos de credenciais, chaves privadas, plaintext da MemChain ou grafo social.',
  },
  ar: {
    summary: 'AeroNyx هو بروتوكول خصوصية مفتوح للتوجيه الخاص، والتواصل المشفر من طرف إلى طرف، والتخزين المشفر، و MemChain، وعقد الخصوصية اللامركزية، واكتشاف العقد الموقّع، و blind relay، وبيانات الاعتماد المجهولة، و Nodeboard، وخدمات AI agents المشفرة.',
    solves: 'ما الذي يحله AeroNyx',
    bullets: ['الخدمات المركزية قد تُغلق أو تُراقب أو تُجبر على كشف المستخدمين.', 'عقد الخصوصية اللامركزية عمياء: لا plaintext ولا DNS ولا وجهات ولا social graph ولا traffic على مستوى wallet.', 'المشغلون يحتاجون صحة البروتوكول دون الوصول إلى محتوى المستخدم.', 'AI agents تحتاج اتصالا خاصا مشفرا ومتاحا دائما.'],
    concepts: 'الصفحات الأساسية',
    ledgerGuide: 'سجل الالتزامات الموقّع وحماية الشهود',
    status: 'أدلة البروتوكول الحالية',
    statusBullets: [
      'تبلغ عقد الخصوصية اللامركزية عن اكتشاف العقد الموقّع واستعادة PeerStore والتعافي بعد إعادة التشغيل وأدلة دورة الحياة المجمعة.',
      'تعرض الإحصاءات العامة إثبات المسار ثنائي القفزات وعدادات blind relay وصحة البروتوكول دون route IDs أو endpoints أو هويات أو payloads أو IP العميل أو DNS أو نص MemChain الصريح أو social graph.',
      'يمكن للمشغلين وعقد المرآة تشغيل `aeronyx-server memchain verify-aof` للتحقق من framing محدود append-only وFact IDs المشتقة من المحتوى وBlock Merkle roots وتسلسل ancestry للكتل من سجل التشفير المحلي نفسه.',
      'يثبت ذلك سلامة السجل المحلي والترتيب المحمي بالشهود، لكنه لا يدعي إجماع سلسلة عامة أو finality عالمية أو إمكانية قراءة محتوى المستخدم.',
    ],
    boundary: 'حدود الخصوصية',
    boundaryText: 'تعرض وثائق AeroNyx العامة بيانات بروتوكول مجمعة فقط، ولا تعرض payload أو DNS أو الوجهات أو أسرار credentials أو المفاتيح الخاصة أو plaintext في MemChain أو social graph.',
  },
  tr: {
    summary: 'AeroNyx özel yönlendirme, uçtan uca şifreli iletişim, şifreli depolama, MemChain, merkeziyetsiz gizlilik düğümleri, imzalı düğüm keşfi, blind relay, anonim kimlik bilgileri, Nodeboard ve AI agents arası şifreli servisler için açık gizlilik protokolüdür.',
    solves: 'AeroNyx neyi çözer',
    bullets: ['Merkezi servisler kapatılabilir, sansürlenebilir veya kullanıcıları açığa çıkarmaya zorlanabilir.', 'Merkeziyetsiz gizlilik düğümleri kördür: plaintext, DNS, hedefler, sosyal grafik veya wallet-level traffic görmez.', 'Operatörler kullanıcı içeriği olmadan protokol sağlığını görmelidir.', 'AI agents sürekli kullanılabilir özel şifreli bağlantıya ihtiyaç duyar.'],
    concepts: 'Temel sayfalar',
    ledgerGuide: 'İmzalı taahhüt defteri ve tanık koruması',
    status: 'Güncel protokol kanıtı',
    statusBullets: [
      'Merkeziyetsiz gizlilik düğümleri imzalı düğüm keşfi, PeerStore kurtarma, yeniden başlatma kurtarması ve toplu yaşam döngüsü kanıtı bildirir.',
      'Genel istatistikler route ID, endpoint, kimlik, payload, istemci IP, DNS, MemChain plaintext veya social graph olmadan iki atlamalı yol kanıtı, blind relay çalışma sayaçları ve protokol sağlığını gösterir.',
      'Operatörler ve ayna düğümler `aeronyx-server memchain verify-aof` çalıştırarak aynı yerel şifreli geçmişte sınırlı append-only framing, içerikten türetilen Fact ID, Block Merkle root ve Block ancestry doğrulayabilir.',
      'Bu, yerel geçmiş bütünlüğünü ve tanık korumalı sıralamayı kanıtlar; açık zincir konsensüsü, küresel finality veya okunabilir kullanıcı içeriği iddia etmez.',
    ],
    boundary: 'Gizlilik sınırı',
    boundaryText: 'AeroNyx halka açık dokümanları yalnızca toplu protokol metadatası gösterir; payload, DNS, hedefler, credential secrets, private keys, MemChain plaintext veya social graph göstermez.',
  },
  vi: {
    summary: 'AeroNyx là giao thức quyền riêng tư mở cho định tuyến riêng tư, liên lạc mã hóa đầu cuối, lưu trữ mã hóa, MemChain, node quyền riêng tư phi tập trung, khám phá node có chữ ký, blind relay, thông tin xác thực ẩn danh, Nodeboard và dịch vụ mã hóa giữa AI agents.',
    solves: 'AeroNyx giải quyết điều gì',
    bullets: ['Dịch vụ tập trung có thể bị tắt, kiểm duyệt hoặc buộc lộ người dùng.', 'Node quyền riêng tư phi tập trung phải mù: không plaintext, DNS, đích, social graph hoặc traffic cấp wallet.', 'Nhà vận hành cần thấy sức khỏe giao thức mà không có nội dung người dùng.', 'AI agents cần kết nối riêng tư mã hóa luôn sẵn sàng.'],
    concepts: 'Trang cốt lõi',
    ledgerGuide: 'Sổ cam kết có chữ ký và bảo vệ bằng witness',
    status: 'Bằng chứng giao thức hiện tại',
    statusBullets: [
      'Node quyền riêng tư phi tập trung báo cáo khám phá node có chữ ký, phục hồi PeerStore, phục hồi sau khởi động lại và bằng chứng vòng đời tổng hợp.',
      'Thống kê công khai hiển thị bằng chứng đường đi hai hop, bộ đếm blind relay và sức khỏe giao thức mà không có route ID, endpoint, danh tính, payload, IP client, DNS, MemChain plaintext hoặc social graph.',
      'Nhà vận hành và node mirror có thể chạy `aeronyx-server memchain verify-aof` để xác minh framing append-only có giới hạn, Fact ID suy ra từ nội dung, Block Merkle root và Block ancestry từ cùng lịch sử ciphertext cục bộ.',
      'Điều này chứng minh tính toàn vẹn lịch sử cục bộ và thứ tự được witness bảo vệ; không tuyên bố đồng thuận chuỗi công khai, finality toàn cục hoặc nội dung người dùng có thể đọc.',
    ],
    boundary: 'Ranh giới quyền riêng tư',
    boundaryText: 'Tài liệu công khai AeroNyx chỉ hiển thị metadata giao thức tổng hợp, không hiển thị payload, DNS, đích, bí mật credential, khóa riêng, plaintext MemChain hoặc social graph.',
  },
  id: {
    summary: 'AeroNyx adalah protokol privasi terbuka untuk routing privat, komunikasi terenkripsi end-to-end, penyimpanan terenkripsi, MemChain, node privasi terdesentralisasi, penemuan node bertanda tangan, blind relay, kredensial anonim, Nodeboard, dan layanan terenkripsi antar AI agents.',
    solves: 'Apa yang diselesaikan AeroNyx',
    bullets: ['Layanan terpusat dapat dimatikan, disensor, atau dipaksa mengekspos pengguna.', 'Node privasi terdesentralisasi tetap buta: tanpa plaintext, DNS, tujuan, social graph, atau traffic tingkat wallet.', 'Operator perlu melihat kesehatan protokol tanpa konten pengguna.', 'AI agents membutuhkan konektivitas privat terenkripsi yang selalu tersedia.'],
    concepts: 'Halaman inti',
    ledgerGuide: 'Ledger komitmen bertanda tangan dan perlindungan saksi',
    status: 'Bukti protokol saat ini',
    statusBullets: [
      'Node privasi terdesentralisasi melaporkan penemuan node bertanda tangan, pemulihan PeerStore, pemulihan setelah restart, dan bukti siklus hidup agregat.',
      'Statistik publik menampilkan bukti jalur dua hop, penghitung runtime blind relay, dan kesehatan protokol tanpa route ID, endpoint, identitas, payload, IP client, DNS, plaintext MemChain, atau social graph.',
      'Operator dan node mirror dapat menjalankan `aeronyx-server memchain verify-aof` untuk memverifikasi framing append-only terbatas, Fact ID turunan konten, Block Merkle root, dan Block ancestry dari riwayat ciphertext lokal yang sama.',
      'Ini membuktikan integritas riwayat lokal dan urutan yang dilindungi saksi; tidak mengklaim konsensus rantai publik, finality global, atau konten pengguna yang dapat dibaca.',
    ],
    boundary: 'Batas privasi',
    boundaryText: 'Dokumentasi publik AeroNyx hanya mengekspos metadata protokol agregat, bukan payload, DNS, tujuan, rahasia credential, private key, plaintext MemChain, atau social graph.',
  },
  fr: {
    summary: 'AeroNyx est un protocole ouvert de confidentialité pour routage privé, communication chiffrée de bout en bout, stockage chiffré, MemChain, noeuds de confidentialité décentralisés, découverte signée de noeuds, blind relay, identifiants anonymes, Nodeboard et services chiffrés entre AI agents.',
    solves: 'Ce que résout AeroNyx',
    bullets: ['Les services centralisés peuvent être arrêtés, censurés ou forcés à exposer les utilisateurs.', 'Les noeuds de confidentialité décentralisés restent aveugles: pas de plaintext, DNS, destinations, graphe social ou trafic niveau wallet.', 'Les opérateurs ont besoin de santé protocolaire sans contenu utilisateur.', 'Les AI agents ont besoin d’une connectivité privée chiffrée toujours disponible.'],
    concepts: 'Pages clés',
    ledgerGuide: 'Registre signé des engagements et protection par témoins',
    status: 'Preuves actuelles du protocole',
    statusBullets: [
      'Les noeuds de confidentialité décentralisés publient la découverte signée, la reprise du PeerStore, la reprise après redémarrage et des preuves agrégées de cycle de vie.',
      'Les statistiques publiques montrent la preuve de route à deux sauts, les compteurs blind relay et la santé du protocole sans route ID, endpoints, identités, payloads, IP client, DNS, texte clair MemChain ni graphe social.',
      'Les opérateurs et noeuds miroirs peuvent exécuter `aeronyx-server memchain verify-aof` pour vérifier un framing append-only borné, les Fact IDs dérivés du contenu, les Block Merkle roots et la Block ancestry depuis le même historique local chiffré.',
      'Cela prouve l’intégrité de l’historique local et l’ordre protégé par témoins, sans revendiquer un consensus de chaîne publique, une finality globale ni un contenu utilisateur lisible.',
    ],
    boundary: 'Frontière de confidentialité',
    boundaryText: 'La documentation publique AeroNyx expose uniquement des métadonnées agrégées du protocole, pas les payloads, DNS, destinations, secrets de credentials, clés privées, plaintext MemChain ou graphe social.',
  },
};

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
- [${copy.ledgerGuide}](${p}/network/signed-commitment-ledger-and-witness-protection)
- [Blind-signed vouchers and anonymous access credentials](${p}/network/blind-signed-vouchers-anonymous-access-credentials)
- [AeroNyx decentralized privacy node install and registration](${p}/node-operators/install-register-rust-privacy-protocol-node)
- [${CACHE_GUIDE_LABELS[code]}](${p}/node-operators/rust-node-operations-and-health-checks)
- [Nodeboard operator console](${p}/nodeboard/nodeboard-operator-console-guide)
- [Network Stats](/network-stats)

## ${copy.status}
${copy.statusBullets.map((item) => `- ${item}`).join('\n')}
- ${CACHE_EVIDENCE[code]}

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
