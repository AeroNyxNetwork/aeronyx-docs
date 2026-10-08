/**
 * ============================================
 * File: docs-frontend/pages/[category]/[slug].js
 * ============================================
 * Creation Reason: Article detail page with full Markdown rendering
 * Modification Reason:
 *   v1.2.0 - [DOCS-NAVIGATION 2026-10-08 by Codex] Align breadcrumbs and
 *     reading order with shared sections while preserving canonical URLs.
 *   v1.1.7 - [DOCS-CHAT-AI-PROMPT 2026-10-08 by Codex] Add a local-only,
 *     translated integration prompt builder to the chat reference article.
 *   v1.1.6 - [DOCS-ARTICLE-RTL 2026-10-07 by Codex] Mirror article
 *     navigation/summary spacing and request SiteConfig in the article locale.
 *   v1.1.5 - [DOCS-UX 2026-08-04 by Codex] Suppress the summary callout only
 *     when it exactly duplicates the first Markdown paragraph.
 *   v1.1.4 - [DOCS-UX 2026-08-04 by Codex] Fix conditional hook ordering,
 *     estimate CJK reading time correctly, and refine mobile article layout.
 *   v1.1.3 - Add self-referencing canonical URLs and JSON-LD structured data
 *     for article and breadcrumb discovery.
 *   v1.1.2 - Localize article metadata dates so translated pages do not keep
 *     English month names in the byline.
 *   v1.1.1 - Stabilized TOC memoization and removed article-level
 *   framer-motion wrapper to prevent client-side route cancellation /
 *   removeChild crashes during markdown page navigation.
 *   v1.1.0 - Pass SiteConfig into Layout for admin-controlled SEO/header.
 *   v1.0.1 - Added reading progress bar, fixed prev/next
 *   links to use correct category slug from article data instead of URL param
 *   (BUG: if article moved categories, links would 404). Improved TOC
 *   active state tracking. Added estimated reading time.
 *
 * Main Logical Flow:
 *   1. getServerSideProps fetches article by slug + category tree
 *   2. Returns 404 if article not found
 *   3. Renders breadcrumb, metadata, Markdown content, TOC, prev/next nav
 *   4. Reading progress bar tracks scroll position
 *   5. TOC highlights active heading via IntersectionObserver
 *
 * Dependencies:
 *   - lib/api.js (fetchSiteConfig, fetchArticleBySlug, fetchCategoryTree)
 *   - components/Layout.js, components/MarkdownRenderer.js
 *   - lucide-react (icons)
 *
 * ⚠️ Important Note for Next Developer:
 * - TOC is extracted client-side from markdown headings
 * - Article views are incremented server-side by Django on each fetch
 * - Navigation supplies reading order; serializer neighbors remain a fallback
 * - BUG FIX: prev/next links now use article.category_slug (from API)
 *   instead of the URL categorySlug param, since articles might change category
 *
 * Last Modified: v1.2.0 - Reader sections with stable canonical routes
 * ============================================
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Clock, Eye, User, ChevronLeft, ChevronRight, BookOpen, FileText } from 'lucide-react';
import Layout from '../../components/Layout';
import CategoryPage, { getCategoryPageProps } from './index';
import MarkdownRenderer, { extractTOC } from '../../components/MarkdownRenderer';
import {
  articleHref,
  navigationArticleContext,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  fetchSiteConfig,
  fetchArticleBySlug,
  fetchCategoryTree,
  getUiCopy,
  isPublicDocumentationArticle,
  languageDirection,
  languageLocale,
  languagePathPrefix,
  normalizeLanguage,
} from '../../lib/api';

// ============================================
// Estimated reading time utility
// ============================================

function estimateReadTime(content) {
  if (!content) return 0;
  const readableText = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_`>\[\]()~-]/g, ' ');
  const cjkCharacters = readableText.match(
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu
  )?.length || 0;
  const nonCjkWords = readableText
    .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, ' ')
    .match(/[\p{L}\p{N}]+/gu)?.length || 0;

  return Math.max(1, Math.ceil((cjkCharacters / 450) + (nonCjkWords / 220)));
}

function normalizeComparableText(value) {
  return (value || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function summaryRepeatsFirstParagraph(content, summary) {
  if (!content || !summary) return false;
  const withoutDocumentTitle = content
    .replace(/^\uFEFF/, '')
    .replace(/^\s*#\s+.+(?:\r?\n|$)/, '')
    .trimStart();
  const firstParagraph = withoutDocumentTitle.split(/\r?\n\s*\r?\n/, 1)[0];
  return normalizeComparableText(firstParagraph) === normalizeComparableText(summary);
}

// [DOCS-CHAT-AI-PROMPT 2026-10-08 by Codex] Static, translated task context.
// No repository content, credentials or user text is sent to a model.
const CHAT_INTEGRATION_PROMPT_COPY = {
  "en": {
    "title": "Build an integration prompt",
    "description": "Choose a client stack and a task, then copy the prompt into your coding assistant. It is generated locally; nothing is sent to an AI service.",
    "stackLabel": "Client stack",
    "stacks": {
      "web": "Web / TypeScript",
      "flutter": "Flutter / Dart",
      "existing": "Existing client"
    },
    "taskLabel": "Task",
    "tasks": {
      "messages": "Integrate direct messaging",
      "media": "Add encrypted media and resume",
      "review": "Review an existing integration"
    },
    "promptLabel": "Generated prompt",
    "copyPrompt": "Copy prompt",
    "copied": "Prompt copied",
    "copyFailed": "Copy failed. Select the prompt below and copy it manually.",
    "references": "Official references",
    "heading": "Work on an AeroNyx-compatible chat integration using the selected stack and task.",
    "requirements": "Read the official references and inspect the existing repository before proposing changes. Confirm the deployed server version and its contract; documentation or local source alone does not prove a live endpoint.\nKeep the centralized RelayWS/HTTP service separate from decentralized node relay APIs. Do not invent endpoints, frame fields, signatures, limits or transport fallbacks. If a required detail is missing, ask for its specification.\nKeep identity secrets and content-encryption keys at the endpoint. Encrypt message and media content before transport; put media keys and private metadata inside the encrypted message, not the upload request. Do not log plaintext, keys or bearer blob links.\nTreat server acceptance, recipient delivery and user read state separately. Preserve event identity on retries, verify signatures and ciphertext before exposing content, persist received events before acknowledging offline custody, and respect presence/read-receipt privacy settings.\nFor media, check upload status before resuming, retry only the intended encrypted chunk, and follow returned limits and expiry. Never silently downgrade to plaintext. For a review task, do not edit code.",
    "deliverables": "Return a contract/version map, a file-scoped plan and the selected implementation or review. Include tests for invalid authentication/signatures, duplicates, reconnect/offline ACK handling and applicable media expiry or permission failures. Report exactly which checks ran and their results; label missing evidence and untested deployment behavior. Do not claim a multi-hop path or anonymous cross-entry offline mailbox is production-ready without matching release and live evidence."
  },
  "zh-Hans": {
    "title": "生成接入提示词",
    "description": "选择技术栈和接入目标，即可复制给编程助手。提示词在本地生成，不会发送到 AI 服务。",
    "stackLabel": "客户端技术栈",
    "stacks": {
      "web": "Web / TypeScript",
      "flutter": "Flutter / Dart",
      "existing": "现有客户端"
    },
    "taskLabel": "接入目标",
    "tasks": {
      "messages": "接入一对一聊天",
      "media": "接入加密媒体与断点续传",
      "review": "审查现有接入"
    },
    "promptLabel": "生成的提示词",
    "copyPrompt": "复制提示词",
    "copied": "提示词已复制",
    "copyFailed": "复制失败。请选中下方提示词，手动复制。",
    "references": "官方参考文档",
    "heading": "请按所选技术栈和目标，完成 AeroNyx 兼容聊天的接入或审查。",
    "requirements": "先阅读官方文档并检查现有仓库，再提出修改方案。确认目标服务端的部署版本与接口契约；文档或本地源码不能证明接口已在线可用。\n分开处理集中式 RelayWS/HTTP 服务与去中心化节点中继 API。不要猜测端点、消息字段、签名、限制或传输回退；缺少必要规格时先列出问题。\n身份秘密和内容密钥只留在端点。消息与媒体先加密再传输；媒体密钥与私密元数据放进加密消息，不放上传请求。不得记录明文、密钥或具有访问能力的 blob 链接。\n分清服务端接收、接收方交付与用户已读。重试保留事件标识；验证签名和密文后才展示内容；离线事件持久化后再确认托管收取；遵守在线状态与已读回执的隐私设置。\n媒体恢复前查询上传状态，仅重传对应密文分块，按返回值处理大小限制和过期。禁止静默降级为明文。如果目标是审查，不修改代码。",
    "deliverables": "交付接口与版本对照、精确到文件的计划，以及所选实现或审查结果。覆盖认证或签名失败、重复消息、重连与离线 ACK，以及适用的媒体过期、权限失败测试。准确列出实际运行的检查及结果，标明缺少的证据和未验证的部署行为。没有对应发布与线上证据，不得宣称多跳或跨入口匿名离线邮箱已可用于生产。"
  },
  "zh-Hant": {
    "title": "產生接入提示詞",
    "description": "選擇技術棧與接入目標，即可複製給程式設計助手。提示詞在本機產生，不會傳送至 AI 服務。",
    "stackLabel": "客戶端技術棧",
    "stacks": {
      "web": "Web / TypeScript",
      "flutter": "Flutter / Dart",
      "existing": "現有客戶端"
    },
    "taskLabel": "接入目標",
    "tasks": {
      "messages": "接入一對一聊天",
      "media": "接入加密媒體與斷點續傳",
      "review": "審查現有接入"
    },
    "promptLabel": "產生的提示詞",
    "copyPrompt": "複製提示詞",
    "copied": "提示詞已複製",
    "copyFailed": "複製失敗。請選取下方提示詞，手動複製。",
    "references": "官方參考文件",
    "heading": "請按所選技術棧與目標，完成 AeroNyx 相容聊天的接入或審查。",
    "requirements": "先閱讀官方文件並檢查現有儲存庫，再提出修改方案。確認目標服務端的部署版本與介面契約；文件或本機原始碼不能證明介面已在線上可用。\n分開處理集中式 RelayWS/HTTP 服務與去中心化節點中繼 API。不要猜測端點、訊息欄位、簽章、限制或傳輸備援；缺少必要規格時先列出問題。\n身分秘密與內容金鑰只留在端點。訊息與媒體先加密再傳輸；媒體金鑰與私密中繼資料放進加密訊息，不放上傳請求。不得記錄明文、金鑰或具有存取能力的 blob 連結。\n分清服務端接收、接收方交付與使用者已讀。重試保留事件識別碼；驗證簽章和密文後才顯示內容；離線事件持久化後再確認託管收取；遵守在線狀態與已讀回執的隱私設定。\n媒體恢復前查詢上傳狀態，僅重傳對應密文區塊，依回傳值處理大小限制與到期。禁止靜默降級為明文。如果目標是審查，不修改程式碼。",
    "deliverables": "交付介面與版本對照、精確到檔案的計畫，以及所選實作或審查結果。涵蓋認證或簽章失敗、重複訊息、重連與離線 ACK，以及適用的媒體到期、權限失敗測試。準確列出實際執行的檢查與結果，標明缺少的證據和未驗證的部署行為。沒有對應發布與線上證據，不得宣稱多跳或跨入口匿名離線信箱已可用於正式環境。"
  },
  "ja": {
    "title": "連携用プロンプトを作成",
    "description": "技術スタックと作業を選び、コーディングアシスタントにコピーできます。端末内で生成し、AIサービスには送信しません。",
    "stackLabel": "クライアントの技術スタック",
    "stacks": {
      "web": "Web / TypeScript",
      "flutter": "Flutter / Dart",
      "existing": "既存のクライアント"
    },
    "taskLabel": "作業",
    "tasks": {
      "messages": "1対1チャットの連携",
      "media": "暗号化メディアと再開処理の追加",
      "review": "既存の連携をレビュー"
    },
    "promptLabel": "生成されたプロンプト",
    "copyPrompt": "プロンプトをコピー",
    "copied": "コピーしました",
    "copyFailed": "コピーできませんでした。下のプロンプトを選択して手動でコピーしてください。",
    "references": "公式リファレンス",
    "heading": "選択した技術スタックと作業に従い、AeroNyx互換チャットの連携またはレビューを行ってください。",
    "requirements": "変更を提案する前に公式文書と既存リポジトリを確認してください。対象サーバーの配備バージョンと契約を確認し、文書やローカルコードだけで公開APIが稼働中と判断しないでください。\n中央管理のRelayWS/HTTPと分散ノードのリレーAPIを区別してください。エンドポイント、フィールド、署名、上限、代替経路を推測せず、不足する仕様を質問してください。\n識別情報の秘密とコンテンツ鍵は端末に保持してください。メッセージとメディアは転送前に暗号化し、メディア鍵と非公開メタデータはアップロード要求ではなく暗号化メッセージに含めてください。平文、鍵、アクセス権を持つblobリンクをログに残さないでください。\nサーバー受付、受信側への配信、既読を区別してください。再試行でもイベント識別子を保持し、署名と暗号文を検証してから表示してください。オフラインイベントは永続化してから受領確認し、プレゼンスと既読のプライバシー設定に従ってください。\nメディアの再開前に状態を照会し、対象の暗号化チャンクだけを再送してください。上限と有効期限は応答に従い、平文へ黙って切り替えないでください。レビューではコードを変更しないでください。",
    "deliverables": "契約とバージョンの対応表、ファイル単位の計画、実装またはレビュー結果を提示してください。認証・署名エラー、重複、再接続、オフラインACK、該当するメディアの期限切れと権限エラーをテスト対象に含め、実行済み検査と結果、不足する証拠、未検証の配備動作を明記してください。対応するリリースと稼働環境の証拠なしに、マルチホップや入口をまたぐ匿名オフラインメールボックスを本番対応としないでください。"
  },
  "ko": {
    "title": "연동 프롬프트 만들기",
    "description": "기술 스택과 작업을 선택한 뒤 코딩 도우미에 복사하세요. 프롬프트는 로컬에서 생성되며 AI 서비스로 전송되지 않습니다.",
    "stackLabel": "클라이언트 기술 스택",
    "stacks": {
      "web": "Web / TypeScript",
      "flutter": "Flutter / Dart",
      "existing": "기존 클라이언트"
    },
    "taskLabel": "작업",
    "tasks": {
      "messages": "일대일 채팅 연동",
      "media": "암호화 미디어와 재개 처리 추가",
      "review": "기존 연동 검토"
    },
    "promptLabel": "생성된 프롬프트",
    "copyPrompt": "프롬프트 복사",
    "copied": "프롬프트 복사됨",
    "copyFailed": "복사하지 못했습니다. 아래 프롬프트를 선택해 직접 복사하세요.",
    "references": "공식 참고 문서",
    "heading": "선택한 기술 스택과 작업에 따라 AeroNyx 호환 채팅을 연동하거나 검토하세요.",
    "requirements": "변경을 제안하기 전에 공식 문서와 기존 저장소를 확인하세요. 대상 서버의 배포 버전과 계약을 확인하고, 문서나 로컬 코드만으로 실제 API가 제공된다고 판단하지 마세요.\n중앙 RelayWS/HTTP 서비스와 탈중앙 노드 릴레이 API를 구분하세요. 엔드포인트, 필드, 서명, 제한, 대체 전송을 추측하지 말고 필요한 명세가 없으면 질문하세요.\n신원 비밀과 콘텐츠 키는 엔드포인트에 보관하세요. 메시지와 미디어는 전송 전에 암호화하고 미디어 키와 비공개 메타데이터는 업로드 요청이 아닌 암호화 메시지에 넣으세요. 평문, 키, 접근 권한이 있는 blob 링크를 로그에 남기지 마세요.\n서버 수락, 수신 측 전달, 사용자 읽음을 구분하세요. 재시도 시 이벤트 식별자를 유지하고, 서명과 암호문을 검증한 뒤 표시하세요. 오프라인 이벤트를 영구 저장한 뒤 수신을 확인하고, 접속 상태와 읽음 확인의 개인정보 설정을 지키세요.\n미디어 재개 전에 업로드 상태를 조회하고 해당 암호화 청크만 재전송하세요. 응답의 제한과 만료를 따르며 평문으로 조용히 전환하지 마세요. 검토 작업에서는 코드를 수정하지 마세요.",
    "deliverables": "계약·버전 대응표, 파일별 계획, 선택한 구현 또는 검토 결과를 제공하세요. 인증·서명 실패, 중복, 재연결과 오프라인 ACK, 해당 미디어 만료·권한 오류 테스트를 포함하세요. 실제 실행한 검사와 결과, 부족한 증거, 검증하지 않은 배포 동작을 명시하세요. 해당 릴리스와 운영 환경 증거 없이 멀티홉 또는 진입점 간 익명 오프라인 메일함이 운영 준비를 마쳤다고 주장하지 마세요."
  },
  "ru": {
    "title": "Подготовить задание для ИИ",
    "description": "Выберите стек и задачу, затем скопируйте задание в помощник по программированию. Оно формируется локально, без отправки в сервис ИИ.",
    "stackLabel": "Стек клиента",
    "stacks": {
      "web": "Web / TypeScript",
      "flutter": "Flutter / Dart",
      "existing": "Существующий клиент"
    },
    "taskLabel": "Задача",
    "tasks": {
      "messages": "Подключить личные сообщения",
      "media": "Добавить зашифрованные медиа и возобновление",
      "review": "Проверить существующую интеграцию"
    },
    "promptLabel": "Готовое задание",
    "copyPrompt": "Скопировать задание",
    "copied": "Задание скопировано",
    "copyFailed": "Копирование не удалось. Выделите задание ниже и скопируйте вручную.",
    "references": "Официальные материалы",
    "heading": "Выполните интеграцию или проверку совместимого с AeroNyx чата для выбранных стека и задачи.",
    "requirements": "До изменений прочитайте официальные материалы и изучите репозиторий. Уточните развернутую версию сервера и ее контракт: документация и локальный код не доказывают доступность API в рабочей среде.\nРазделяйте централизованный RelayWS/HTTP и API децентрализованных узлов. Не придумывайте адреса, поля, подписи, лимиты или резервный транспорт. Запросите недостающую спецификацию.\nСекреты идентификации и ключи содержимого остаются на конечном устройстве. Шифруйте сообщения и медиа до передачи; ключи медиа и закрытые метаданные помещайте в зашифрованное сообщение, не в запрос загрузки. Не записывайте открытый текст, ключи и дающие доступ ссылки blob в журналы.\nРазличайте прием сервером, доставку получателю и прочтение. При повторах сохраняйте идентификатор события; проверяйте подписи и шифротекст до показа. Подтверждайте получение офлайн-событий после надежного сохранения. Соблюдайте настройки видимости и уведомлений о прочтении.\nПеред возобновлением медиа проверьте состояние загрузки. Повторяйте только нужный зашифрованный блок, учитывайте лимиты и срок из ответа. Не переходите незаметно на открытый текст. При проверке не изменяйте код.",
    "deliverables": "Предоставьте соответствие контрактов и версий, план по файлам и реализацию либо отчет проверки. Включите тесты неверной аутентификации/подписей, дублей, переподключения, офлайн-ACK и применимых ошибок срока или доступа к медиа. Укажите реально выполненные проверки, результаты и пробелы доказательств. Не называйте многопереходную доставку или анонимный офлайн-ящик между входными узлами готовыми к эксплуатации без доказательств выпуска и работы."
  },
  "es": {
    "title": "Preparar una instrucción de integración",
    "description": "Elige la tecnología y la tarea, y copia la instrucción a tu asistente de programación. Se genera localmente; no se envía a un servicio de IA.",
    "stackLabel": "Tecnología del cliente",
    "stacks": {
      "web": "Web / TypeScript",
      "flutter": "Flutter / Dart",
      "existing": "Cliente existente"
    },
    "taskLabel": "Tarea",
    "tasks": {
      "messages": "Integrar mensajes directos",
      "media": "Añadir medios cifrados y reanudación",
      "review": "Revisar una integración existente"
    },
    "promptLabel": "Instrucción generada",
    "copyPrompt": "Copiar instrucción",
    "copied": "Instrucción copiada",
    "copyFailed": "No se pudo copiar. Selecciona la instrucción y cópiala manualmente.",
    "references": "Referencias oficiales",
    "heading": "Realiza la integración o revisión de chat compatible con AeroNyx para la tecnología y tarea seleccionadas.",
    "requirements": "Lee las referencias oficiales e inspecciona el repositorio antes de proponer cambios. Confirma la versión desplegada y su contrato; la documentación o el código local no prueban que una API esté operativa.\nSepara RelayWS/HTTP centralizado de las API de nodos descentralizados. No inventes rutas, campos, firmas, límites ni transportes alternativos. Solicita las especificaciones que falten.\nMantén secretos de identidad y claves de contenido en los extremos. Cifra mensajes y medios antes del transporte; incluye claves y metadatos privados del medio en el mensaje cifrado, no en la subida. No registres texto claro, claves ni enlaces blob que concedan acceso.\nDistingue aceptación del servidor, entrega al destinatario y lectura. Conserva la identidad del evento al reintentar, valida firmas y contenido cifrado antes de mostrarlo, y persiste los eventos sin conexión antes de confirmar su recepción. Respeta la privacidad de presencia y lectura.\nConsulta el estado antes de reanudar medios; reenvía solo el bloque cifrado correspondiente y sigue los límites y caducidad devueltos. No uses texto claro como alternativa silenciosa. En una revisión, no modifiques código.",
    "deliverables": "Entrega un mapa de contratos/versiones, un plan por archivos y la implementación o revisión elegida. Incluye pruebas de autenticación y firmas inválidas, duplicados, reconexión y ACK sin conexión, y fallos aplicables de caducidad o permisos de medios. Indica qué comprobaciones ejecutaste y sus resultados, y qué evidencia falta. No declares listos para producción los saltos múltiples ni el buzón anónimo sin conexión entre entradas sin evidencia de publicación y funcionamiento."
  },
  "pt-BR": {
    "title": "Gerar instruções de integração",
    "description": "Escolha a tecnologia e a tarefa e copie as instruções para seu assistente de programação. A geração é local, sem envio a serviços de IA.",
    "stackLabel": "Tecnologia do cliente",
    "stacks": {
      "web": "Web / TypeScript",
      "flutter": "Flutter / Dart",
      "existing": "Cliente existente"
    },
    "taskLabel": "Tarefa",
    "tasks": {
      "messages": "Integrar mensagens diretas",
      "media": "Adicionar mídia criptografada e retomada",
      "review": "Revisar uma integração existente"
    },
    "promptLabel": "Instruções geradas",
    "copyPrompt": "Copiar instruções",
    "copied": "Instruções copiadas",
    "copyFailed": "Não foi possível copiar. Selecione as instruções abaixo e copie manualmente.",
    "references": "Referências oficiais",
    "heading": "Implemente ou revise a integração de chat compatível com AeroNyx para a tecnologia e tarefa selecionadas.",
    "requirements": "Leia as referências oficiais e examine o repositório antes de propor alterações. Confirme a versão implantada e seu contrato; documentação e código local não comprovam que uma API está em operação.\nSepare RelayWS/HTTP centralizado das APIs de nós descentralizados. Não invente endpoints, campos, assinaturas, limites ou transportes alternativos. Solicite as especificações ausentes.\nMantenha segredos de identidade e chaves de conteúdo nas pontas. Criptografe mensagens e mídia antes do transporte; inclua chaves e metadados privados da mídia na mensagem criptografada, não no upload. Não registre texto claro, chaves ou links blob que concedam acesso.\nDistinga aceitação pelo servidor, entrega ao destinatário e leitura. Preserve a identidade do evento em novas tentativas, valide assinaturas e conteúdo cifrado antes de exibir e persista eventos offline antes de confirmar o recebimento. Respeite as configurações de privacidade de presença e leitura.\nConsulte o estado antes de retomar mídia; reenvie apenas o bloco cifrado correspondente e siga os limites e a validade retornados. Não adote texto claro como alternativa silenciosa. Em revisões, não altere código.",
    "deliverables": "Entregue um mapa de contratos/versões, um plano por arquivo e a implementação ou revisão escolhida. Inclua testes de autenticação e assinaturas inválidas, duplicatas, reconexão e ACK offline, além de falhas aplicáveis de validade e permissão de mídia. Informe os testes realmente executados, resultados e lacunas de evidência. Não declare produção pronta para múltiplos saltos ou caixa postal anônima offline entre entradas sem evidências de lançamento e operação."
  },
  "ar": {
    "title": "إنشاء تعليمات للتكامل",
    "description": "اختر تقنية العميل والمهمة، ثم انسخ التعليمات إلى مساعد البرمجة. تُنشأ محليًا ولا تُرسل إلى خدمة ذكاء اصطناعي.",
    "stackLabel": "تقنية العميل",
    "stacks": {
      "web": "Web / TypeScript",
      "flutter": "Flutter / Dart",
      "existing": "عميل قائم"
    },
    "taskLabel": "المهمة",
    "tasks": {
      "messages": "دمج الرسائل المباشرة",
      "media": "إضافة الوسائط المشفرة واستئناف الرفع",
      "review": "مراجعة تكامل قائم"
    },
    "promptLabel": "التعليمات المُنشأة",
    "copyPrompt": "نسخ التعليمات",
    "copied": "تم نسخ التعليمات",
    "copyFailed": "تعذر النسخ. حدّد التعليمات أدناه وانسخها يدويًا.",
    "references": "المراجع الرسمية",
    "heading": "نفّذ تكامل محادثة متوافقًا مع AeroNyx أو راجعه وفق التقنية والمهمة المختارتين.",
    "requirements": "اقرأ المراجع الرسمية وافحص المستودع قبل اقتراح تغييرات. تأكد من إصدار الخادم المنشور وعقد واجهاته؛ لا تثبت الوثائق أو الشيفرة المحلية أن الواجهة تعمل في بيئة الإنتاج.\nافصل خدمة RelayWS/HTTP المركزية عن واجهات العُقد اللامركزية. لا تخمّن المسارات أو الحقول أو التواقيع أو الحدود أو مسارات النقل البديلة. اطلب المواصفات الناقصة.\nأبقِ أسرار الهوية ومفاتيح المحتوى عند أطراف الاتصال. شفّر الرسائل والوسائط قبل النقل، وضع مفاتيح الوسائط وبياناتها الخاصة داخل الرسالة المشفرة لا طلب الرفع. لا تسجل النص الواضح أو المفاتيح أو روابط blob التي تمنح صلاحية الوصول.\nميّز قبول الخادم من التسليم إلى المستلم ومن القراءة. حافظ على هوية الحدث عند إعادة المحاولة، وتحقق من التواقيع والمحتوى المشفر قبل عرضه. خزّن الأحداث المستلمة دون اتصال تخزينًا دائمًا قبل تأكيد استلامها، واحترم إعدادات خصوصية الحضور والقراءة.\nاستعلم عن حالة الرفع قبل الاستئناف، وأعد إرسال الجزء المشفر المعني فقط، والتزم بالحدود والصلاحية الواردة في الرد. لا تنتقل بصمت إلى النص الواضح. في مهمة المراجعة لا تعدّل الشيفرة.",
    "deliverables": "قدّم خريطة للعقود والإصدارات، وخطة محددة بالملفات، والتنفيذ أو المراجعة المطلوبة. أدرج اختبارات فشل المصادقة والتواقيع والتكرار وإعادة الاتصال وتأكيدات ACK دون اتصال، وأخطاء صلاحية الوسائط وأذونها عند انطباقها. اذكر الاختبارات المنفذة فعلًا ونتائجها والأدلة الناقصة. لا تصف الترحيل متعدد القفزات أو صندوق البريد المجهول دون اتصال عبر مداخل مختلفة بأنه جاهز للإنتاج دون دليل نشر وتشغيل مطابق."
  },
  "tr": {
    "title": "Entegrasyon istemi oluştur",
    "description": "İstemci teknolojisini ve görevi seçip kodlama yardımcınıza kopyalayın. İstem yerel olarak oluşturulur; yapay zekâ hizmetine gönderilmez.",
    "stackLabel": "İstemci teknolojisi",
    "stacks": {
      "web": "Web / TypeScript",
      "flutter": "Flutter / Dart",
      "existing": "Mevcut istemci"
    },
    "taskLabel": "Görev",
    "tasks": {
      "messages": "Bire bir mesajlaşmayı entegre et",
      "media": "Şifreli medya ve devam ettirme ekle",
      "review": "Mevcut entegrasyonu incele"
    },
    "promptLabel": "Oluşturulan istem",
    "copyPrompt": "İstemi kopyala",
    "copied": "İstem kopyalandı",
    "copyFailed": "Kopyalanamadı. Aşağıdaki istemi seçip elle kopyalayın.",
    "references": "Resmî kaynaklar",
    "heading": "Seçilen teknoloji ve göreve göre AeroNyx uyumlu sohbet entegrasyonunu uygulayın veya inceleyin.",
    "requirements": "Değişiklik önermeden önce resmî kaynakları ve mevcut depoyu inceleyin. Dağıtılan sunucu sürümünü ve sözleşmesini doğrulayın; belge veya yerel kod, API'nin canlı olduğunu kanıtlamaz.\nMerkezî RelayWS/HTTP hizmetini merkeziyetsiz düğüm API'lerinden ayırın. Uç nokta, alan, imza, sınır veya alternatif aktarım uydurmayın. Eksik özellikleri sorun.\nKimlik sırlarını ve içerik anahtarlarını uçlarda tutun. Mesaj ve medyayı aktarmadan önce şifreleyin; medya anahtarlarını ve özel üst veriyi yükleme isteğine değil şifreli mesaja koyun. Açık metin, anahtar veya erişim sağlayan blob bağlantılarını günlüğe yazmayın.\nSunucu kabulünü, alıcıya teslimi ve okunmayı ayırın. Yeniden denemelerde olay kimliğini koruyun; göstermeden önce imza ve şifreli içeriği doğrulayın. Çevrimdışı olayları kalıcı kaydettikten sonra alındı onayı verin. Varlık ve okundu gizlilik ayarlarını koruyun.\nMedyaya devam etmeden önce yükleme durumunu sorgulayın; yalnız ilgili şifreli parçayı yeniden gönderin, döndürülen sınır ve süreyi izleyin. Sessizce açık metne dönmeyin. İnceleme görevinde kodu değiştirmeyin.",
    "deliverables": "Sözleşme/sürüm haritası, dosya bazlı plan ve seçilen uygulama veya incelemeyi sunun. Geçersiz kimlik doğrulama/imza, tekrarlar, yeniden bağlanma, çevrimdışı ACK ve ilgili medya süresi/izin hatalarını testlere ekleyin. Gerçekte çalıştırılan kontrolleri, sonuçları ve eksik kanıtları belirtin. Sürüm ve canlı kanıt olmadan çok atlamalı aktarım veya girişler arası anonim çevrimdışı posta kutusu için üretime hazır iddiasında bulunmayın."
  },
  "vi": {
    "title": "Tạo yêu cầu tích hợp cho AI",
    "description": "Chọn công nghệ và tác vụ rồi sao chép cho trợ lý lập trình. Nội dung được tạo cục bộ, không gửi đến dịch vụ AI.",
    "stackLabel": "Công nghệ phía máy khách",
    "stacks": {
      "web": "Web / TypeScript",
      "flutter": "Flutter / Dart",
      "existing": "Máy khách hiện có"
    },
    "taskLabel": "Tác vụ",
    "tasks": {
      "messages": "Tích hợp nhắn tin trực tiếp",
      "media": "Thêm nội dung đa phương tiện mã hóa và tiếp tục tải",
      "review": "Rà soát tích hợp hiện có"
    },
    "promptLabel": "Yêu cầu đã tạo",
    "copyPrompt": "Sao chép yêu cầu",
    "copied": "Đã sao chép yêu cầu",
    "copyFailed": "Không sao chép được. Hãy chọn nội dung bên dưới và sao chép thủ công.",
    "references": "Tài liệu chính thức",
    "heading": "Thực hiện hoặc rà soát tích hợp trò chuyện tương thích AeroNyx theo công nghệ và tác vụ đã chọn.",
    "requirements": "Đọc tài liệu chính thức và kiểm tra kho mã trước khi đề xuất thay đổi. Xác nhận phiên bản máy chủ đã triển khai và đặc tả tương ứng; tài liệu hoặc mã cục bộ không chứng minh API đang hoạt động.\nPhân biệt RelayWS/HTTP tập trung với API nút phi tập trung. Không tự đặt điểm cuối, trường, chữ ký, giới hạn hay đường truyền dự phòng. Hỏi rõ đặc tả còn thiếu.\nGiữ bí mật định danh và khóa nội dung tại thiết bị đầu cuối. Mã hóa tin nhắn và tệp trước khi truyền; đặt khóa tệp và siêu dữ liệu riêng trong tin nhắn mã hóa, không trong yêu cầu tải lên. Không ghi bản rõ, khóa hay liên kết blob có quyền truy cập vào nhật ký.\nPhân biệt máy chủ chấp nhận, giao đến bên nhận và người dùng đã đọc. Giữ định danh sự kiện khi thử lại; xác minh chữ ký và bản mã trước khi hiển thị. Lưu bền vững sự kiện ngoại tuyến trước khi xác nhận đã nhận. Tuân thủ quyền riêng tư của trạng thái và xác nhận đã đọc.\nKiểm tra trạng thái trước khi tiếp tục tải; chỉ gửi lại khối mã hóa tương ứng và theo giới hạn, thời hạn trả về. Không âm thầm chuyển sang bản rõ. Với tác vụ rà soát, không sửa mã.",
    "deliverables": "Cung cấp đối chiếu đặc tả/phiên bản, kế hoạch theo tệp và kết quả triển khai hoặc rà soát. Bao gồm kiểm thử xác thực/chữ ký sai, trùng lặp, kết nối lại, ACK ngoại tuyến và lỗi hết hạn/quyền truy cập tệp nếu áp dụng. Nêu đúng kiểm tra đã chạy, kết quả và bằng chứng còn thiếu. Không tuyên bố đa chặng hay hộp thư ngoại tuyến ẩn danh qua nhiều điểm vào sẵn sàng sản xuất khi chưa có bằng chứng phát hành và vận hành tương ứng."
  },
  "id": {
    "title": "Buat instruksi integrasi",
    "description": "Pilih teknologi klien dan tugas, lalu salin ke asisten pemrograman. Instruksi dibuat secara lokal, tanpa dikirim ke layanan AI.",
    "stackLabel": "Teknologi klien",
    "stacks": {
      "web": "Web / TypeScript",
      "flutter": "Flutter / Dart",
      "existing": "Klien yang sudah ada"
    },
    "taskLabel": "Tugas",
    "tasks": {
      "messages": "Integrasikan pesan langsung",
      "media": "Tambahkan media terenkripsi dan kelanjutan unggahan",
      "review": "Tinjau integrasi yang sudah ada"
    },
    "promptLabel": "Instruksi yang dibuat",
    "copyPrompt": "Salin instruksi",
    "copied": "Instruksi disalin",
    "copyFailed": "Penyalinan gagal. Pilih instruksi di bawah dan salin secara manual.",
    "references": "Referensi resmi",
    "heading": "Kerjakan atau tinjau integrasi percakapan yang kompatibel dengan AeroNyx sesuai teknologi dan tugas yang dipilih.",
    "requirements": "Baca referensi resmi dan periksa repositori sebelum mengusulkan perubahan. Pastikan versi server yang diterapkan beserta kontraknya; dokumentasi atau kode lokal tidak membuktikan API sedang beroperasi.\nPisahkan RelayWS/HTTP terpusat dari API node terdesentralisasi. Jangan mengarang endpoint, kolom, tanda tangan, batas, atau transport cadangan. Tanyakan spesifikasi yang belum tersedia.\nSimpan rahasia identitas dan kunci konten di endpoint. Enkripsi pesan dan media sebelum dikirim; masukkan kunci media dan metadata privat ke pesan terenkripsi, bukan permintaan unggahan. Jangan mencatat teks terbuka, kunci, atau tautan blob pemberi akses.\nBedakan penerimaan server, pengiriman ke penerima, dan status dibaca. Pertahankan identitas peristiwa saat mencoba ulang; verifikasi tanda tangan dan teks sandi sebelum ditampilkan. Simpan peristiwa offline secara persisten sebelum mengakui penerimaannya. Patuhi privasi kehadiran dan tanda terima baca.\nPeriksa status sebelum melanjutkan unggahan; kirim ulang hanya bagian terenkripsi yang sesuai dan ikuti batas serta masa berlaku pada respons. Jangan diam-diam beralih ke teks terbuka. Untuk peninjauan, jangan ubah kode.",
    "deliverables": "Berikan peta kontrak/versi, rencana per berkas, dan implementasi atau hasil peninjauan. Sertakan pengujian autentikasi/tanda tangan tidak valid, duplikasi, koneksi ulang, ACK offline, dan kegagalan masa berlaku/izin media yang relevan. Nyatakan pemeriksaan yang benar-benar dijalankan, hasilnya, dan bukti yang belum tersedia. Jangan mengklaim multihop atau kotak surat anonim offline lintas titik masuk siap produksi tanpa bukti rilis dan operasional yang sesuai."
  },
  "fr": {
    "title": "Préparer une consigne d’intégration",
    "description": "Choisissez la technologie et la tâche, puis copiez la consigne dans votre assistant de programmation. Elle est générée localement, sans envoi à un service d’IA.",
    "stackLabel": "Technologie du client",
    "stacks": {
      "web": "Web / TypeScript",
      "flutter": "Flutter / Dart",
      "existing": "Client existant"
    },
    "taskLabel": "Tâche",
    "tasks": {
      "messages": "Intégrer les messages directs",
      "media": "Ajouter les médias chiffrés et la reprise",
      "review": "Examiner une intégration existante"
    },
    "promptLabel": "Consigne générée",
    "copyPrompt": "Copier la consigne",
    "copied": "Consigne copiée",
    "copyFailed": "La copie a échoué. Sélectionnez la consigne ci-dessous et copiez-la manuellement.",
    "references": "Références officielles",
    "heading": "Réalisez ou examinez une intégration de chat compatible AeroNyx selon la technologie et la tâche choisies.",
    "requirements": "Lisez les références officielles et examinez le dépôt avant toute proposition. Confirmez la version déployée du serveur et son contrat ; la documentation ou le code local ne prouvent pas qu’une API est en service.\nDistinguez RelayWS/HTTP centralisé des API des nœuds décentralisés. N’inventez ni routes, ni champs, ni signatures, ni limites, ni transport de secours. Demandez les spécifications manquantes.\nGardez les secrets d’identité et les clés de contenu aux extrémités. Chiffrez messages et médias avant transport ; placez les clés des médias et leurs métadonnées privées dans le message chiffré, pas dans la requête d’envoi. Ne journalisez ni texte clair, ni clés, ni liens blob donnant accès.\nDistinguez acceptation du serveur, livraison au destinataire et lecture. Conservez l’identité de l’événement lors des reprises ; vérifiez signatures et contenu chiffré avant affichage. Persistez les événements hors ligne avant d’en accuser réception. Respectez les réglages de confidentialité de présence et de lecture.\nConsultez l’état avant de reprendre un envoi de média ; renvoyez uniquement le bloc chiffré concerné et suivez les limites et échéances retournées. Aucun repli silencieux en clair. Pour une revue, ne modifiez pas le code.",
    "deliverables": "Fournissez une correspondance contrats/versions, un plan par fichier et l’implémentation ou la revue demandée. Incluez les tests d’authentification/signature invalides, doublons, reconnexion, ACK hors ligne et erreurs applicables d’expiration ou d’autorisation des médias. Précisez les contrôles réellement exécutés, leurs résultats et les preuves manquantes. Ne déclarez pas prêts pour la production le multihop ou la boîte anonyme hors ligne entre points d’entrée sans preuve de publication et d’exploitation correspondante."
  }
};

export function getChatIntegrationPromptCopy(lang = DEFAULT_LANGUAGE) {
  return CHAT_INTEGRATION_PROMPT_COPY[normalizeLanguage(lang)];
}

export function isChatIntegrationArticle(article) {
  return (article?.translation_key || article?.canonical_slug || article?.slug)
    === 'aeronyx-chat-relay-client-integration';
}

export function buildChatIntegrationPrompt({ language = DEFAULT_LANGUAGE, stack = 'web', task = 'messages' } = {}) {
  const lang = normalizeLanguage(language);
  const copy = getChatIntegrationPromptCopy(lang);
  const selectedStack = Object.hasOwn(copy.stacks, stack) ? stack : 'web';
  const selectedTask = Object.hasOwn(copy.tasks, task) ? task : 'messages';
  const prefix = languagePathPrefix(lang);
  const references = [
    '/network/aeronyx-chat-relay-client-integration',
    '/intro/aeronyx-app-and-protocol-architecture',
    '/network/node-discovery-and-relay-foundation',
  ].map((path) => `https://docs.aeronyx.network${prefix}${path}`);
  return [
    copy.heading,
    `${copy.stackLabel}: ${copy.stacks[selectedStack]}\n${copy.taskLabel}: ${copy.tasks[selectedTask]}`,
    `${copy.references}:\n${references.join('\n')}`,
    copy.requirements,
    copy.deliverables,
  ].join('\n\n');
}

// [DOCS-CHAT-AI-PROMPT 2026-10-08 by Codex] Only fixed task choices are
// accepted. Copying never invokes a model, analytics event or network request.
export function ChatIntegrationPrompt({ currentLanguage = DEFAULT_LANGUAGE }) {
  const copy = getChatIntegrationPromptCopy(currentLanguage);
  const [stack, setStack] = useState('web');
  const [task, setTask] = useState('messages');
  const [copyStatus, setCopyStatus] = useState('idle');
  const copyAttempt = useRef(0);
  const promptDetails = useRef(null);
  const promptText = useRef(null);
  const prompt = useMemo(
    () => buildChatIntegrationPrompt({ language: currentLanguage, stack, task }),
    [currentLanguage, stack, task]
  );

  useEffect(() => () => { copyAttempt.current += 1; }, []);

  const changeSelection = (setter, value) => {
    copyAttempt.current += 1;
    setCopyStatus('idle');
    setter(value);
  };

  const handleCopy = async () => {
    const attempt = ++copyAttempt.current;
    setCopyStatus('idle');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(prompt);
      if (attempt === copyAttempt.current) setCopyStatus('copied');
    } catch {
      if (attempt !== copyAttempt.current) return;
      setCopyStatus('failed');
      if (promptDetails.current) promptDetails.current.open = true;
      promptText.current?.focus();
      promptText.current?.select();
    }
  };

  return (
    <section className="mb-10 rounded-lg border border-white/[0.08] p-5" aria-labelledby="chat-prompt-title">
      <h2 id="chat-prompt-title" className="text-base font-medium text-white/85">{copy.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{copy.description}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="min-w-0 text-xs text-white/60" htmlFor="chat-prompt-stack">
          {copy.stackLabel}
          <select id="chat-prompt-stack" value={stack} onChange={(event) => changeSelection(setStack, event.target.value)}
            className="mt-2 block w-full min-w-0 rounded-md border border-white/10 bg-surface p-2.5 text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-primary">
            {Object.entries(copy.stacks).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="min-w-0 text-xs text-white/60" htmlFor="chat-prompt-task">
          {copy.taskLabel}
          <select id="chat-prompt-task" value={task} onChange={(event) => changeSelection(setTask, event.target.value)}
            className="mt-2 block w-full min-w-0 rounded-md border border-white/10 bg-surface p-2.5 text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-primary">
            {Object.entries(copy.tasks).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      <details ref={promptDetails} className="mt-4">
        <summary className="cursor-pointer text-sm text-white/65 focus-visible:outline-primary">{copy.promptLabel}</summary>
        <textarea ref={promptText} value={prompt} readOnly rows={12} aria-label={copy.promptLabel}
          dir={languageDirection(currentLanguage)} onFocus={(event) => event.currentTarget.select()}
          className="mt-3 block w-full resize-y rounded-md border border-white/10 bg-surface p-3 text-sm leading-relaxed text-white/75 focus:outline-none focus:ring-2 focus:ring-primary" />
      </details>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={handleCopy}
          className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          {copy.copyPrompt}
        </button>
        <p role="status" aria-live="polite" className="text-xs text-white/65">
          {copyStatus === 'copied' ? copy.copied : copyStatus === 'failed' ? copy.copyFailed : ''}
        </p>
      </div>
    </section>
  );
}

// ============================================
// Main Component
// ============================================

export default function ArticlePage({
  pageKind = 'article',
  siteConfig,
  categoryTree,
  articles,
  categoryInfo,
  article,
  categorySlug,
  currentLanguage = DEFAULT_LANGUAGE,
}) {
  const router = useRouter();
  const [activeHeading, setActiveHeading] = useState('');
  const [readProgress, setReadProgress] = useState(0);
  const copy = getUiCopy(currentLanguage);

  // Extract TOC from markdown.
  // Keep the array stable so scroll progress renders do not recreate the
  // IntersectionObserver tree while the markdown DOM is still settling.
  const toc = useMemo(
    () => (article?.content ? extractTOC(article.content) : []),
    [article?.content]
  );
  const readTime = article?.content ? estimateReadTime(article.content) : 0;
  const locale = languageLocale(currentLanguage);

  // Reading progress bar
  useEffect(() => {
    if (pageKind !== 'article') return undefined;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setReadProgress(Math.min((scrollTop / docHeight) * 100, 100));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pageKind]);

  // IntersectionObserver for active heading tracking
  useEffect(() => {
    if (toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -75% 0px', threshold: 0 }
    );

    // Small delay to ensure DOM is ready after markdown render
    const timer = setTimeout(() => {
      toc.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 200);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [toc]);

  // Keep all hooks above route-mode branching. Next.js can reuse this page
  // component when navigating between language category and article routes.
  if (pageKind === 'category') {
    return (
      <CategoryPage
        siteConfig={siteConfig}
        categoryTree={categoryTree}
        categorySlug={categorySlug}
        articles={articles}
        categoryInfo={categoryInfo}
        currentLanguage={currentLanguage}
      />
    );
  }

  // 404 state
  if (router.isFallback || !article) {
    return (
      <Layout
        categoryTree={categoryTree}
        siteConfig={siteConfig}
        currentLanguage={currentLanguage}
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-center">
              <FileText size={24} className="text-white/20" aria-hidden="true" />
            </div>
            <h1 className="text-lg text-white/50 mb-2 font-light">{copy.articleNotFound}</h1>
            <Link
              href={languagePathPrefix(currentLanguage) || '/'}
              className="text-sm text-primary hover:text-primary-300 transition-colors"
            >
              &larr; {copy.backToDocs}
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // BUG FIX (v1.0.1): Use article's own category_slug for prev/next links
  const articleCatSlug = article.category_slug || categorySlug;
  // [DOCS-NAVIGATION 2026-10-08 by Codex] CMS category determines the URL;
  // reader section determines the breadcrumb and adjacent reading links.
  const navigationContext = navigationArticleContext(categoryTree, article);
  const sectionSlug = navigationContext?.section.slug || articleCatSlug;
  const sectionName = navigationContext?.section.name || article.category_name || articleCatSlug;
  const previousArticle = navigationContext ? navigationContext.previous : article.prev_article;
  const nextArticle = navigationContext ? navigationContext.next : article.next_article;
  const showSummary = Boolean(
    article.summary && !summaryRepeatsFirstParagraph(article.content, article.summary)
  );
  const docsBaseUrl = siteConfig?.docs_base_url || 'https://docs.aeronyx.network';
  const canonicalSlug = article.canonical_slug || article.translation_key || article.slug;
  const canonicalUrl = `${docsBaseUrl}${languagePathPrefix(currentLanguage)}/${articleCatSlug}/${canonicalSlug}`;
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: copy.docs,
        item: `${docsBaseUrl}${languagePathPrefix(currentLanguage) || '/'}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: sectionName,
        item: `${docsBaseUrl}${languagePathPrefix(currentLanguage)}/${sectionSlug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: canonicalUrl,
      },
    ],
  };
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: article.title,
    description: article.meta_description || article.summary,
    inLanguage: currentLanguage,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: {
      '@type': 'Organization',
      name: article.author_name || 'AeroNyx',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AeroNyx',
      url: 'https://aeronyx.network',
    },
    mainEntityOfPage: canonicalUrl,
    url: canonicalUrl,
  };

  return (
    <Layout
      categoryTree={categoryTree}
      siteConfig={siteConfig}
      title={article.meta_title || article.title}
      description={article.meta_description || article.summary}
      currentLanguage={currentLanguage}
      meta={{
        keywords: article.meta_keywords,
        image: article.cover_image,
        canonical: canonicalUrl,
        type: 'article',
      }}
    >
      <Head>
        {/* [DOCS-ARTICLE-RETIREMENT 2026-10-09 by Codex] Retained translations
            must not advertise the retired variant as an alternate page. */}
        {SUPPORTED_LANGUAGES.filter((language) => isPublicDocumentationArticle(
          { ...article, language: language.code }
        )).map((language) => {
          return (
            <link
              key={language.code}
              rel="alternate"
              hrefLang={language.code}
              href={`${docsBaseUrl}${languagePathPrefix(language.code)}/${articleCatSlug}/${canonicalSlug}`}
            />
          );
        })}
        <link
          rel="alternate"
          hrefLang="x-default"
          href={`${docsBaseUrl}/${articleCatSlug}/${canonicalSlug}`}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </Head>

      {/* Reading progress bar */}
      <div
        className="reading-progress"
        style={{ width: `${readProgress}%` }}
        role="progressbar"
        aria-label={copy.readingProgress}
        aria-valuenow={Math.round(readProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      <div className="flex">
        {/* ===== Article content ===== */}
        <article
          className="flex-1 min-w-0 max-w-3xl mx-auto px-5 sm:px-7 py-9 sm:py-10 lg:py-12"
        >
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[11px] text-white/20 mb-8" aria-label={copy.breadcrumb}>
            <Link
              href={languagePathPrefix(currentLanguage) || '/'}
              className="hover:text-white/50 transition-colors"
            >
              {copy.docs}
            </Link>
            <span className="text-white/10">/</span>
            {sectionName && (
              <>
                <Link
                  href={`${languagePathPrefix(currentLanguage)}/${sectionSlug}`}
                  className="hover:text-white/50 transition-colors"
                >
                  {sectionName}
                </Link>
                <span className="text-white/10">/</span>
              </>
            )}
            <span className="text-white/35 truncate max-w-[200px]">{article.title}</span>
          </nav>

          {/* Cover image */}
          {article.cover_image && (
            <img
              src={article.cover_image}
              alt={article.title}
              className="w-full rounded-lg border border-white/[0.06] mb-8 max-h-72 object-cover"
              loading="eager"
            />
          )}

          {/* Title */}
          <h1 className="text-[1.75rem] sm:text-[2rem] lg:text-[2.25rem] font-semibold text-white/95 mb-5 leading-[1.2]">
            {article.title}
          </h1>

          {/* Meta info bar */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-white/25 mb-8 pb-6 border-b border-white/[0.05]">
            {article.author_name && (
              <span className="flex items-center gap-1.5">
                <User size={11} />
                {article.author_name}
              </span>
            )}
            {article.published_at && (
              <span className="flex items-center gap-1.5">
                <Clock size={11} />
                {new Date(article.published_at).toLocaleDateString(locale, {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </span>
            )}
            {readTime > 0 && (
              <span className="flex items-center gap-1.5">
                <BookOpen size={11} />
                {copy.minRead(readTime)}
              </span>
            )}
            {article.view_count > 0 && (
              <span className="flex items-center gap-1.5">
                <Eye size={11} />
                {copy.views(article.view_count)}
              </span>
            )}
          </div>

          {/* Summary callout */}
          {showSummary && (
            <div className="border-s-2 border-primary/60 ps-4 mb-8">
              <p className="text-[14px] text-white/50 leading-[1.75]">
                {article.summary}
              </p>
            </div>
          )}

          {isChatIntegrationArticle(article) && (
            <ChatIntegrationPrompt key={currentLanguage} currentLanguage={currentLanguage} />
          )}

          {/* ===== Markdown content ===== */}
          {/* [DOCS-ARTICLE-I18N 2026-10-07 by Codex] Shared by localized routes. */}
          <MarkdownRenderer content={article.content} currentLanguage={currentLanguage} />

          {/* ===== Prev / Next navigation ===== */}
          <nav className="mt-14 pt-8 border-t border-white/[0.05]" aria-label={copy.articleNavigation}>
            <div className="grid sm:grid-cols-2 gap-3">
              {previousArticle ? (
                <Link
                  href={articleHref(previousArticle, currentLanguage, articleCatSlug)}
                  className="group flex items-center gap-3 p-4 rounded-lg
                    border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.02]
                    transition-all duration-200"
                >
                  <ChevronLeft
                    size={16}
                    className="text-white/15 group-hover:text-primary/60 transition-colors flex-shrink-0 rtl:rotate-180"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-white/20 mb-1">
                      {copy.previous}
                    </div>
                    <div className="text-[13px] text-white/50 group-hover:text-white/75 truncate transition-colors">
                      {previousArticle.title}
                    </div>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {nextArticle ? (
                <Link
                  href={articleHref(nextArticle, currentLanguage, articleCatSlug)}
                  className="group flex items-center justify-end gap-3 p-4 rounded-lg
                    border border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.02]
                    transition-all duration-200 text-end"
                >
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-white/20 mb-1">
                      {copy.next}
                    </div>
                    <div className="text-[13px] text-white/50 group-hover:text-white/75 truncate transition-colors">
                      {nextArticle.title}
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-white/15 group-hover:text-primary/60 transition-colors flex-shrink-0 rtl:rotate-180"
                  />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </nav>
        </article>

        {/* ===== Contents sidebar at the inline end (desktop only) ===== */}
        {toc.length > 0 && (
          <aside className="hidden xl:block w-52 flex-shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-10 pe-6">
            <div className="text-[10px] uppercase tracking-[0.1em] text-white/20 mb-4 font-medium">
              {copy.onThisPage}
            </div>
            <nav className="space-y-0.5" aria-label={copy.onThisPage}>
              {toc.map(({ level, text, id }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`
                    block text-[12px] leading-relaxed transition-all duration-150 py-[3px] rounded-sm
                    ${level === 3 ? 'ps-3' : level === 4 ? 'ps-6' : ''}
                    ${
                      activeHeading === id
                        ? 'text-primary font-medium translate-x-0.5 rtl:-translate-x-0.5'
                        : 'text-white/20 hover:text-white/45'
                    }
                  `}
                >
                  {text}
                </a>
              ))}
            </nav>
          </aside>
        )}
      </div>
    </Layout>
  );
}

// ============================================
// Data Fetching
// ============================================

export async function getArticlePageProps(context, lang = DEFAULT_LANGUAGE) {
  const { category: categorySlug, slug } = context.params;
  const isLanguageCategory = SUPPORTED_LANGUAGES.some((language) => language.code === categorySlug);

  if (isLanguageCategory) {
    const categoryProps = await getCategoryPageProps(
      { params: { category: slug } },
      normalizeLanguage(categorySlug)
    );
    return {
      ...categoryProps,
      props: {
        ...categoryProps.props,
        pageKind: 'category',
      },
    };
  }

  const [siteConfig, categoryTree, article] = await Promise.all([
    fetchSiteConfig({ lang }),
    fetchCategoryTree({ lang }),
    fetchArticleBySlug(slug, { lang }),
  ]);

  if (!article) {
    return { notFound: true };
  }

  return {
    props: {
      categoryTree: categoryTree || [],
      siteConfig: siteConfig || null,
      article,
      categorySlug,
      currentLanguage: lang,
    },
  };
}

export async function getServerSideProps(context) {
  return getArticlePageProps(context, DEFAULT_LANGUAGE);
}
