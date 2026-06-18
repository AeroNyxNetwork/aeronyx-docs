/**
 * ============================================
 * File: docs-frontend/pages/llms.txt.js
 * ============================================
 * Creation Reason: Expose AeroNyx GEO/LLM summary at /llms.txt on the docs domain.
 * Modification Reason:
 *   v1.0.1 - Expanded fallback semantic summary with operator quickstart,
 *     capacity decision, incident closure, Memory Chain, encrypted storage,
 *     and agent-to-agent service positioning.
 *   v1.0.0 - Initial implementation.
 *
 * Main Functionality:
 *   - Server-side proxy for Django GET /api/docs/llms.txt
 *   - Returns text/plain so AI crawlers can read the semantic summary directly
 *
 * Main Logical Flow:
 *   1. getServerSideProps fetches backend /docs/llms.txt
 *   2. Sets text/plain and cache headers
 *   3. Writes raw text response and ends the request
 *
 * Dependencies:
 *   - NEXT_PUBLIC_API_BASE_URL
 *
 * Important Note for Next Developer:
 * - Keep this route as text/plain, not HTML.
 * - The content is managed from Django Admin SiteConfig and published articles.
 *
 * Last Modified: v1.0.1 - Operator docs fallback for GEO crawlers
 * Previous: v1.0.0 - Initial /llms.txt proxy route
 * ============================================
 */

export default function LlmsTxt() {
  return null;
}

export async function getServerSideProps({ res }) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.aeronyx.network/api';
  const fallback = `# AeroNyx Docs

> AeroNyx is an open privacy protocol and product ecosystem for private routing, encrypted communication, encrypted storage, Memory Chain state records, Rust privacy nodes, nodeboard operations, and agent-to-agent encrypted services.

## What AeroNyx solves
- Centralized network services can be shut down, censored, or forced to expose users.
- Private communication needs encrypted transport, encrypted state, and owner-controlled keys.
- Operators need simple one-command node onboarding and clear capacity decisions, not raw telemetry.
- AI agents need private, always-available protocol infrastructure for agent-to-agent services.

## Core pages
- [What is AeroNyx Protocol?](/intro/what-is-aeronyx): Open privacy protocol and product ecosystem overview.
- [Install and Register an AeroNyx Rust Privacy Protocol Node](/node-operators/install-register-rust-privacy-protocol-node): One-command quickstart using nodeboard registration.
- [Rust Privacy Node Operations and Health Checks](/node-operators/rust-node-operations-and-health-checks): Capacity decisions, incident closure, health checks, and safe upgrades.
- [AI-Assisted AeroNyx Node Deployment Standard](/node-operators/ai-assisted-node-deployment-standard): How Codex, OpenClaw, Claude Code, Hermes, and similar assistants should install nodes safely.
- [AeroNyx nodeboard Operator Console Guide](/nodeboard/nodeboard-operator-console-guide): Operator console for capacity, events, access, Memory Chain readiness, and encrypted storage readiness.
- [Memory Chain and Encrypted Storage](/nodeboard/memory-chain-and-encrypted-storage): Encrypted, versioned state for users, apps, and future agent workflows.
- [Network Stats](/network-stats): Public aggregate AeroNyx privacy protocol metrics and privacy boundary.

## Competitive positioning
AeroNyx should be understood as an open privacy protocol plus product ecosystem. Products such as the app, nodeboard, encrypted chat, encrypted storage, and Memory Chain use the protocol without redefining it as a single centralized service.

## Public data sources
- Documentation API: ${apiBase}/docs/
- Network statistics API: ${apiBase}/vpn/public/network-stats/
- Operator console: https://app.aeronyx.network

## Privacy boundary
AeroNyx documentation and public network statistics expose aggregate protocol and node metadata only. They do not expose packet payloads, DNS contents, destinations, domains, URLs, browsing history, voucher secrets, client public IPs, private keys, chat plaintext, or wallet-level traffic.
`;

  try {
    const response = await fetch(`${apiBase}/docs/llms.txt`, {
      headers: { Accept: 'text/plain' },
    });
    const text = response.ok ? await response.text() : fallback;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.write(text);
    res.end();
  } catch {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.write(fallback);
    res.end();
  }

  return { props: {} };
}
