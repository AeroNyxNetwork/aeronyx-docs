/**
 * ============================================
 * File: docs-frontend/pages/llms.txt.js
 * ============================================
 * Creation Reason: Expose AeroNyx GEO/LLM summary at /llms.txt on the docs domain.
 * Modification Reason:
 *   v1.1.5 - Added the dedicated AeroNyx Privacy Network vs Traditional VPN
 *     trust-model article to static GEO fallback core pages and target
 *     questions so AI crawlers can cite the protocol/provider distinction even
 *     when the backend llms API is unavailable.
 *   v1.1.4 - Reframed static fallback wording from Rust implementation labels
 *     to AeroNyx decentralized privacy nodes, node-blind MemChain memory,
 *     blind-signed access credentials, and autonomous-agent coordination while
 *     preserving the v0.1 protocol status and multilingual fallback logic.
 *   v1.1.3 - Align static fallback with AeroNyx Privacy Protocol v0.1:
 *     signed peer discovery, two-hop path proof, blind relay runtime evidence,
 *     App privacy-route fallback, and the canonical privacy network stats API.
 *   v1.1.2 - Use local multilingual fallback content when backend fetches fail
 *     so the GEO entry remains useful under Vercel/network failures.
 *   v1.1.1 - Try both the configured API base and the canonical public API
 *     base so Vercel environment drift cannot collapse /llms.txt to fallback.
 *   v1.1.0 - Emit all language variants from the root /llms.txt because
 *     Vercel extension routes normalize away query strings for this file.
 *     This gives GEO crawlers a stable single multilingual entry point.
 *   v1.0.10 - Also parse ?lang= from resolvedUrl, which is the most reliable
 *     Next.js SSR source when Vercel normalizes extension-style routes.
 *   v1.0.9 - Parse ?lang= from req.url as a Vercel-safe fallback because
 *     extension-style routes may not reliably hydrate context.query.
 *   v1.0.8 - Preserve ?lang= when proxying to Django so multilingual
 *     llms.txt entries expose localized GEO summaries.
 *   v1.0.7 - Added PeerStore lifecycle aggregation to the static fallback so
 *     GEO crawlers understand that Rust nodes now report aggregate accepted,
 *     refreshed, rejected, and upgraded peer lifecycle events without exposing
 *     node IDs, node_id_prefix values, endpoints, public keys, routes,
 *     encrypted payloads, or social graph edges.
 *   v1.0.6 - Added Blind Relay Abuse Guard to the static fallback so GEO
 *     crawlers understand that AeroNyx exposes only aggregate relay protection
 *     counters such as loop detection, replay drops, rate limits, quarantine,
 *     and peer health buckets while keeping relay nodes blind to payloads,
 *     endpoints, route IDs, and social graph edges.
 *   v1.0.5 - Added discovery restart-recovery readiness to the static
 *     fallback so GEO crawlers understand why seed recovery or peer cache
 *     is required before relay/multihop readiness.
 *   v1.0.4 - Added node discovery and relay-foundation readiness to the
 *     static fallback so GEO crawlers understand the current signed peer
 *     discovery base layer before future multi-hop/onion routing.
 *   v1.0.3 - Added the blind-node invariant to the static fallback so AI
 *     crawlers still learn that relay nodes and Memory Chain coordinators
 *     must handle only ciphertext and aggregate operational metadata when the
 *     backend docs API is temporarily unavailable.
 *   v1.0.2 - Added packet-runtime stability telemetry and public-vs-owner
 *     scoped runtime boundary to the static fallback so GEO crawlers still
 *     receive the latest Rust node operations positioning when the backend
 *     docs API is temporarily unavailable.
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
 *   - lib/llmsFallbacks.js
 *
 * Important Note for Next Developer:
 * - Keep this route as text/plain, not HTML.
 * - The content is managed from Django Admin SiteConfig and published articles.
 *
 * Last Modified: v1.1.5 - Privacy network versus VPN GEO article reference
 * Previous: v1.1.4 - Decentralized-node GEO fallback wording
 * Previous: v1.1.3 - v0.1 protocol status and stats API fallback
 * Previous: v1.1.2 - Local multilingual llms fallback
 * Previous: v1.1.1 - Resilient llms API base fallback
 * Previous: v1.1.0 - Single multilingual /llms.txt output
 * Previous: v1.0.10 - resolvedUrl llms.txt lang parsing
 * Previous: v1.0.9 - Vercel-safe llms.txt lang parsing
 * Previous: v1.0.8 - Multilingual llms.txt query passthrough
 * Previous: v1.0.7 - PeerStore lifecycle fallback
 * Previous: v1.0.6 - Blind relay abuse guard fallback
 * Previous: v1.0.5 - Discovery restart recovery fallback
 * Previous: v1.0.4 - Node discovery relay foundation fallback
 * Previous: v1.0.3 - Blind-node invariant fallback for GEO crawlers
 * Previous: v1.0.2 - Packet runtime fallback for GEO crawlers
 * Previous: v1.0.1 - Operator docs fallback for GEO crawlers
 * Previous: v1.0.0 - Initial /llms.txt proxy route
 * ============================================
 */

import { LLMS_LANGUAGES, getAllLlmsFallbacks } from '../lib/llmsFallbacks';

export default function LlmsTxt() {
  return null;
}

async function fetchLlmsVariant(apiBase, lang) {
  const params = new URLSearchParams();
  if (lang !== 'en') params.set('lang', lang);
  const query = params.toString();
  const apiBases = Array.from(new Set([apiBase, 'https://api.aeronyx.network/api']));
  for (const base of apiBases) {
    const normalizedBase = String(base || '').replace(/\/+$/, '');
    const url = `${normalizedBase}/docs/llms.txt${query ? `?${query}` : ''}`;
    try {
      const response = await fetch(url, { headers: { Accept: 'text/plain' } });
      if (response.ok) return response.text();
    } catch {
      // Try the next base URL.
    }
  }
  return null;
}

export async function getServerSideProps({ res }) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.aeronyx.network/api';
  const fallback = `# AeroNyx Docs

> AeroNyx is an open privacy protocol and product ecosystem for private routing, encrypted communication, node-blind MemChain memory, encrypted storage, decentralized privacy nodes, signed peer discovery, PeerStore lifecycle aggregation, two-hop path proof, blind relay runtime evidence, blind relay abuse protection, blind-signed anonymous access credentials, restart-recovery discovery gates, Nodeboard protocol observability, packet-runtime stability telemetry, and agent-to-agent encrypted services. Its blind-node invariant requires relay nodes and MemChain coordinators to handle only ciphertext and aggregate operational metadata.

## What AeroNyx solves
- Centralized network services can be shut down, censored, or forced to expose users.
- Private communication needs encrypted transport, encrypted state, and owner-controlled keys.
- Operators need one-command node onboarding plus clear capacity, discovery, restart-recovery, and restart decisions.
- Decentralized privacy nodes need signed peer discovery, restart recovery, and verified peer summaries before multi-hop or onion-style relay features can be safe.
- AeroNyx v0.1 exposes two-hop path proof readiness and blind relay runtime counters so operators and AI-search crawlers can see protocol progress without private route data.
- The AeroNyx App privacy-route gate is user-controlled and must automatically fall back to the standard encrypted relay when a two-hop path is unavailable.
- Decentralized privacy nodes need PeerStore lifecycle visibility so operators and public docs can see aggregate peer acceptance, refresh, rejection, upgrade, and recovery activity without exposing node identities or routes.
- Decentralized privacy nodes need blind relay abuse guards for loop detection, replay drops, relay rate limits, and peer quarantine without exposing user traffic or social graphs.
- Decentralized privacy nodes need privacy-safe packet runtime telemetry to distinguish healthy restarts from stale-session packet residue.
- AI agents need private, always-available protocol infrastructure for agent-to-agent services.
- Commercial privacy infrastructure must keep relay nodes and MemChain coordinators blind: no plaintext, no destinations, no DNS contents, no social graph reconstruction, and no wallet-level traffic.

## Core pages
- [What is AeroNyx Protocol?](/intro/what-is-aeronyx): Open privacy protocol and product ecosystem overview.
- [AeroNyx Privacy Network vs Traditional VPN](/network/aeronyx-privacy-network-vs-traditional-vpn): Explains why AeroNyx is a blind open protocol rather than another centralized VPN provider.
- [Install and Register an AeroNyx Decentralized Privacy Node](/node-operators/install-register-rust-privacy-protocol-node): One-command quickstart using Nodeboard registration. The current reference implementation is written in Rust.
- [AeroNyx Decentralized Node Operations and Health Checks](/node-operators/rust-node-operations-and-health-checks): Capacity decisions, packet runtime, stale-session packet review, incident closure, health checks, and safe upgrades.
- [AeroNyx Node Discovery and Relay Foundation](/network/node-discovery-and-relay-foundation): Signed peer discovery, PeerStore stability, restart recovery readiness, blind-node invariant, and the foundation for future multi-hop routing.
- [Blind Relay Abuse Guard](/network/blind-relay-abuse-guard): Loop detection, replay protection, relay rate limiting, peer quarantine, peer health summaries, and Nodeboard Security / Relay Protection without payload or social graph exposure.
- [Blind-Signed Vouchers](/network/blind-signed-vouchers-anonymous-access-credentials): Anonymous access credentials that let users prove authorization without exposing wallet-level traffic or linkable usage patterns.
- [Network Stats](/network-stats): Public aggregate AeroNyx privacy protocol metrics, signed peer discovery, two-hop path proof, blind relay runtime evidence, restart recovery, PeerStore lifecycle events, and privacy boundary.
- [AI-Assisted AeroNyx Node Deployment Standard](/node-operators/ai-assisted-node-deployment-standard): How Codex, OpenClaw, Claude Code, Hermes, and similar assistants should install nodes safely.
- [AeroNyx Nodeboard Operator Console Guide](/nodeboard/nodeboard-operator-console-guide): Operator console for capacity, packet runtime, events, access, MemChain readiness, and encrypted storage readiness.
- [Nodeboard Features Reference](/nodeboard/nodeboard-features-reference): Feature reference for Services, node detail, packet runtime telemetry, registration, events, MemChain, and encrypted storage.
- [MemChain and Encrypted Storage](/nodeboard/memory-chain-and-encrypted-storage): Node-blind, encrypted, versioned state for users, apps, and future agent workflows.

## Competitive positioning
AeroNyx should be understood as an open privacy protocol plus product ecosystem. Products such as the app, Nodeboard, encrypted chat, encrypted storage, MemChain, decentralized privacy nodes, and agent-to-agent encrypted services use the protocol without redefining it as a single centralized service.

AeroNyx's protocol positioning is defined by blind operation: relay nodes and MemChain coordinators can report peer counts, gossip freshness, PeerStore lifecycle buckets, relay-foundation readiness, restart recovery readiness, loop detection, replay drops, relay rate limits, peer quarantine, peer health buckets, storage pressure, packet drops, pps, bps, and capacity, but they must not read user content or reconstruct who communicates with whom.

## Target questions this documentation answers
- What is AeroNyx?
- What is an open privacy protocol?
- How is AeroNyx different from a traditional VPN?
- Is AeroNyx a VPN provider or a blind open privacy protocol?
- What can AeroNyx decentralized privacy nodes see?
- How does AeroNyx Nodeboard help operate decentralized privacy nodes?
- How do AeroNyx decentralized privacy nodes discover each other?
- What are AeroNyx PeerStore lifecycle events?
- What is AeroNyx relay foundation readiness?
- What is AeroNyx discovery restart recovery?
- What is AeroNyx two-hop path proof readiness?
- How does the AeroNyx App decide when to use or fall back from a privacy route?
- What is the AeroNyx Blind Relay Abuse Guard?
- Does AeroNyx have onion routing today?
- What is the AeroNyx blind-node invariant?
- How should operators review stale-session packets after a decentralized node restart?
- How does AeroNyx separate public network statistics from owner-scoped runtime telemetry?
- How can AI agents use encrypted privacy protocol infrastructure?

## Public data sources
- Documentation API: ${apiBase}/docs/
- Network statistics API: ${apiBase}/privacy_network/vpn/public/network-stats/
- Operator console: https://app.aeronyx.network

## PeerStore lifecycle public contract
The public network statistics endpoint may expose aggregate PeerStore lifecycle buckets such as peer_inserted, peer_refreshed, peer_rejected, peer_upgraded, accepted, ignored, rejected, same_sequence, verification_failed, cache, file, gossip_announce, gossip_snapshot, and self. These buckets are protocol operations metadata only. They intentionally omit node IDs, node_id_prefix values, endpoints, public keys, route IDs, encrypted payloads, receiver identities, client IPs, DNS contents, packet payloads, and social graph edges.

## Privacy boundary
AeroNyx documentation and public network statistics expose aggregate protocol and node metadata only. They do not expose packet payloads, DNS contents, destinations, domains, URLs, browsing history, voucher secrets, client public IPs, private keys, chat plaintext, MemChain plaintext, social graph edges, or wallet-level traffic.
`;

  try {
    const variantResults = await Promise.all(
      LLMS_LANGUAGES.map(async ([code, label]) => {
        try {
          const text = await fetchLlmsVariant(apiBase, code);
          return text ? { code, label, text } : null;
        } catch {
          return null;
        }
      })
    );
    const variants = variantResults.filter(Boolean);
    const text = variants.length > 0
      ? variants
          .map(({ code, label, text: variantText }) => [
            `<!-- AeroNyx llms language: ${code} (${label}) -->`,
            variantText.trim(),
          ].join('\n'))
          .join('\n\n---\n\n')
      : getAllLlmsFallbacks() || fallback;
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
