/**
 * ============================================
 * File: docs-frontend/pages/network-stats.js
 * ============================================
 * Creation Reason: Provide a GEO-friendly public data page for AeroNyx network metrics.
 * Modification Reason:
 *   v1.2.3 - Replaced public-facing Rust implementation wording with
 *     decentralized privacy node terminology so the page reads as protocol
 *     infrastructure instead of an engineering dashboard.
 *   v1.2.2 - Correct the documented data source path to the live privacy
 *     network stats API namespace used by docs and public GEO references.
 *   v1.2.1 - Add canonical metadata because this public statistics page is a
 *     primary GEO citation target for AI search engines.
 *   v1.2.0 - Added protocol synchronization and PeerStore lifecycle metrics
 *     from protocol_status.peer_store.peer_lifecycle. The page now documents
 *     how Rust privacy nodes discover, accept, refresh, reject, and recover
 *     peer state without exposing node IDs, endpoints, public keys, routes,
 *     encrypted payloads, or social graph edges.
 *   v1.1.0 - Replaced public-facing VPN wording with AeroNyx privacy
 *     protocol wording so network stats describe the protocol and privacy
 *     nodes instead of presenting the product as a VPN panel.
 *   v1.0.0 - Initial implementation.
 *
 * Main Functionality:
 *   - Renders public aggregate AeroNyx network statistics
 *   - Shows privacy boundary and data source for AI-search citation
 *   - Uses existing public API: /api/privacy_network/vpn/public/network-stats/
 *
 * Main Logical Flow:
 *   1. getServerSideProps fetches SiteConfig, category tree, and public stats
 *   2. Page renders complete numbers rather than abbreviated counters
 *   3. Privacy boundary explains what is not collected or exposed
 *
 * Dependencies:
 *   - components/Layout.js
 *   - lib/api.js (fetchSiteConfig, fetchCategoryTree, fetchNetworkStats)
 *   - lucide-react
 *
 * Important Note for Next Developer:
 * - Keep this page factual and citation-friendly.
 * - Do not add client IPs, destinations, DNS contents, domains, URLs, or payload data.
 *
 * Last Modified: v1.2.3 - Use decentralized privacy node wording
 * Previous: v1.2.2 - Correct privacy network stats API path
 * Previous: v1.2.1 - Network stats canonical metadata
 * Previous: v1.2.0 - Add protocol synchronization metrics
 * Previous: v1.1.0 - Use privacy protocol terminology on public stats
 * Previous: v1.0.0 - Initial public network stats page
 * ============================================
 */

import { Activity, Database, GitBranch, Globe2, RefreshCw, ShieldCheck } from 'lucide-react';
import Layout from '../components/Layout';
import { fetchSiteConfig, fetchCategoryTree, fetchNetworkStats } from '../lib/api';

function formatInteger(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('en-US').format(n);
}

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (n >= 1024 ** 4) return `${(n / 1024 ** 4).toFixed(2)} TB`;
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(2)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(2)} KB`;
  return `${formatInteger(n)} B`;
}

function Metric({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className="text-primary/70" />
        <div className="text-[11px] uppercase tracking-wider text-white/25">
          {label}
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-semibold text-white/90 tabular-nums break-words">
        {value}
      </div>
      {detail && (
        <p className="mt-3 text-[12px] leading-relaxed text-white/30">
          {detail}
        </p>
      )}
    </div>
  );
}

export default function NetworkStatsPage({ siteConfig, categoryTree, stats }) {
  const docsBaseUrl = siteConfig?.docs_base_url || 'https://docs.aeronyx.network';
  const network = stats?.network || {};
  const traffic = stats?.encrypted_traffic || {};
  const forwarding = stats?.encrypted_message_forwarding || {};
  const health = stats?.health || {};
  const protocol = stats?.protocol_status || {};
  const networkStory = protocol?.network_story || {};
  const peerStore = protocol?.peer_store || {};
  const peerLifecycle = peerStore?.peer_lifecycle || {};
  const peerLifecycleOutcomes = peerLifecycle?.outcome_counts || {};
  const peerLifecycleEvents = peerLifecycle?.event_counts || {};

  return (
    <Layout
      categoryTree={categoryTree}
      siteConfig={siteConfig}
      title="AeroNyx Network Stats"
      description="Public aggregate AeroNyx privacy protocol statistics for encrypted traffic, encrypted message forwarding, node coverage, and availability."
      meta={{
        keywords: 'AeroNyx network stats, encrypted traffic, privacy nodes, privacy protocol metrics',
        canonical: `${docsBaseUrl}/network-stats`,
      }}
    >
      <div className="max-w-5xl mx-auto px-6 py-10 lg:py-14">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/[0.08] border border-primary/[0.12] mb-5">
            <ShieldCheck size={13} className="text-primary" />
            <span className="text-[11px] font-medium text-primary-300 tracking-wide">
              Public Aggregate Data
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white/95 tracking-tight mb-4">
            AeroNyx Network Stats
          </h1>
          <p className="text-[15px] text-white/45 max-w-2xl leading-relaxed">
            These metrics summarize aggregate AeroNyx privacy protocol activity. They are designed
            for public transparency and AI-search citation without exposing user traffic details.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <Metric
            icon={Globe2}
            label="Public Privacy Nodes"
            value={formatInteger(network.public_vpn_candidates)}
            detail={`${formatInteger(network.regions_count)} active region${Number(network.regions_count) === 1 ? '' : 's'}`}
          />
          <Metric
            icon={Database}
            label="Encrypted Traffic"
            value={formatBytes(traffic.total_bytes)}
            detail={`${formatInteger(traffic.total_bytes)} total encrypted bytes forwarded`}
          />
          <Metric
            icon={Activity}
            label="Encrypted Packets"
            value={formatInteger(forwarding.count)}
            detail={`Reported by ${formatInteger(forwarding.reported_nodes)} node${Number(forwarding.reported_nodes) === 1 ? '' : 's'}`}
          />
          <Metric
            icon={ShieldCheck}
            label="24h Availability"
            value={`${Number(health.availability_24h_percent || 0).toFixed(2)}%`}
            detail={`${formatInteger(health.valid_heartbeat_samples_24h)} valid heartbeat samples`}
          />
        </div>

        <section className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 mb-8">
          <div className="mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/[0.08] border border-primary/[0.12] mb-4">
              <GitBranch size={13} className="text-primary" />
              <span className="text-[11px] font-medium text-primary-300 tracking-wide">
                Protocol Synchronization
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white/90 mb-3">
              Decentralized privacy nodes are building a signed peer view
            </h2>
            <p className="text-[13px] sm:text-[14px] leading-relaxed text-white/40 max-w-3xl">
              AeroNyx privacy nodes report only aggregate discovery state: healthy reporting nodes,
              verified peer counts, restart recovery evidence, and PeerStore lifecycle events.
              This proves the network is moving from static registration toward node-to-node
              discovery while preserving the blind-node invariant.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Metric
              icon={ShieldCheck}
              label="Protocol Status"
              value={protocol.status || 'syncing'}
              detail={`${formatInteger(protocol.healthy_nodes)} healthy of ${formatInteger(protocol.reported_nodes)} reporting nodes`}
            />
            <Metric
              icon={GitBranch}
              label="Verified Peer View"
              value={formatInteger(peerStore.max_valid_peers)}
              detail={`${formatInteger(networkStory.foundation_ready_nodes)} foundation-ready node${Number(networkStory.foundation_ready_nodes) === 1 ? '' : 's'}`}
            />
            <Metric
              icon={RefreshCw}
              label="Peer Lifecycle Events"
              value={formatInteger(peerLifecycle.recent_events)}
              detail={`${formatInteger(peerLifecycleOutcomes.accepted)} accepted · ${formatInteger(peerLifecycleEvents.peer_refreshed)} refreshed · ${formatInteger(peerLifecycleOutcomes.rejected)} rejected`}
            />
            <Metric
              icon={Activity}
              label="Restart Recovery"
              value={`${formatInteger(protocol.cache_recovered_nodes)} / ${formatInteger(protocol.reported_nodes)}`}
              detail={`Latest gossip timestamp: ${peerStore.latest_gossip_at ? formatInteger(peerStore.latest_gossip_at) : 'syncing'}`}
            />
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-3">
          <section className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5">
            <h2 className="text-sm font-medium text-white/75 mb-3">
              What These Metrics Mean
            </h2>
            <div className="space-y-3 text-[13px] leading-relaxed text-white/40">
              <p>
                Encrypted traffic is the aggregate number of encrypted payload bytes forwarded by
                AeroNyx privacy protocol sessions. Encrypted packets count protocol-level
                forwarding events reported by online decentralized privacy nodes.
              </p>
              <p>
                Node and region counts describe public privacy-node candidates that can
                participate in privacy routing. Availability is computed from signed heartbeat
                samples.
              </p>
              <p>
                Peer lifecycle events summarize how AeroNyx nodes accept, refresh, reject, and
                recover peer records in PeerStore. The public page intentionally publishes only
                aggregate buckets, not node identities, endpoints, routes, or user traffic.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-5">
            <h2 className="text-sm font-medium text-white/75 mb-3">
              Privacy Boundary
            </h2>
            <p className="text-[13px] leading-relaxed text-white/40">
              {stats?.privacy_boundary ||
                'Aggregate operations only; no packet payloads, DNS contents, destinations, domains, URLs, browsing history, voucher secrets, client public IPs, or wallet-level traffic.'}
            </p>
            {stats?.generated_at && (
              <p className="mt-4 text-[11px] text-white/20">
                Generated at {new Date(stats.generated_at).toISOString()}
              </p>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps() {
  const [siteConfig, categoryTree, stats] = await Promise.all([
    fetchSiteConfig(),
    fetchCategoryTree(),
    fetchNetworkStats(),
  ]);

  return {
    props: {
      siteConfig: siteConfig || null,
      categoryTree: categoryTree || [],
      stats: stats || null,
    },
  };
}
