"use client";

import React, { useState } from 'react';
import { WalletProvider, useWallet, useWalletStatus, useWalletActions } from '@/app/hooks/useWalletState';
import Icon from '@/components/icons/Icon';
import { ICON_IDS } from '@/components/icons/iconIds';
import { ProposalList, type ProposalRecord } from '@/components/governance/ProposalList';
import { VoteModal } from '@/components/governance/VoteModal';

// --- Mock Data ---
const MOCK_PROPOSALS: ProposalRecord[] = [
  { id: 'SFP-12', title: 'Whitelist West African GHS/XLM Asset Pair Feed', proposer: 'GA5THZLKMNPQRSXYZABCDEFGHIJKLMNBC9A', status: 'Active', votesFor: 785000, votesAgainst: 120000, quorumThreshold: 60, endsInLedgers: 4200 },
  { id: 'SFP-11', title: 'Adjust Global Deviation Threshold from 2.5% to 1.8%', proposer: 'GBC2VHZLKMNPQRSXYZABCDEFGHIJKLMLOPA', status: 'Active', votesFor: 450000, votesAgainst: 410000, quorumThreshold: 60, endsInLedgers: 1150 },
  { id: 'SFP-10', title: 'Upgrade Core Contract WASM to Release Version v1.2.0', proposer: 'GDRTVHZLKMNPQRSXYZABCDEFGHIJKLM1122', status: 'Passed', votesFor: 1200000, votesAgainst: 15000, quorumThreshold: 75, endsInLedgers: 0 },
  { id: 'SFP-09', title: 'Increase Relayer Missed-Heartbeat Penalty Weight by 2%', proposer: 'GCXXVHZLKMNPQRSXYZABCDEFGHIJKLM7766', status: 'Rejected', votesFor: 110000, votesAgainst: 920000, quorumThreshold: 50, endsInLedgers: 0 },
  { id: 'SFP-08', title: 'Deploy Oracle Aggregator Contract v2 on Mainnet', proposer: 'GAABVHZLKMNPQRSXYZABCDEFGHIJKLM3300', status: 'Executed', votesFor: 980000, votesAgainst: 22000, quorumThreshold: 75, endsInLedgers: 0 },
];

const GovernanceWalletControlContent = React.memo(function GovernanceWalletControlContent() {
  const { wallet } = useWallet();
  const { isChecking } = useWalletStatus();
  const { refreshWalletState } = useWalletActions();

  const walletStatus = wallet?.connected
    ? wallet.publicKey
      ? `${wallet.publicKey.slice(0, 4)}...${wallet.publicKey.slice(-4)}`
      : 'Connected'
    : 'No wallet connected';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">Admin / Consensus</p>
          <h1 className="text-3xl font-bold tracking-tight">Governance & Proposals</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => refreshWalletState()}
            disabled={isChecking}
            className="flex items-center gap-2 bg-[#161b22] border border-gray-800 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium relative overflow-hidden"
            style={{ transition: 'transform 150ms ease, box-shadow 150ms ease' }}
          >
            <span className="absolute inset-0 bg-gray-800 opacity-0 hover:opacity-100 transition-opacity duration-150 pointer-events-none" />
            <span className="relative z-10 flex items-center gap-2">
              <Icon id={ICON_IDS.wallet} size={16} className="text-purple-400" />
              {wallet?.connected ? walletStatus : 'Connect Freighter Wallet'}
            </span>
          </button>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium relative overflow-hidden"
          style={{ transition: 'transform 150ms ease, box-shadow 150ms ease' }}
        >
          <span className="absolute inset-0 bg-blue-700 opacity-0 transition-opacity duration-150 pointer-events-none" />
          <span className="relative z-10 flex items-center gap-2">
            <Icon id={ICON_IDS.filePlus} size={16} />
            Submit New Proposal
          </span>
        </button>
        </div>
      </div>

      <div className="mb-3 text-sm text-gray-400">
        Active wallet status: <span className="text-white">{walletStatus}</span>
      </div>
    </div>
  );
});

function GovernanceWalletControl() {
  return (
    <WalletProvider>
      <GovernanceWalletControlContent />
    </WalletProvider>
  );
}

export default function GovernancePage() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'archived'>('all');
  const [voteTarget, setVoteTarget] = useState<ProposalRecord | null>(null);

  const TABS: { key: typeof activeTab; label: string }[] = [
    { key: 'all',      label: 'All Ballots' },
    { key: 'active',   label: 'Active' },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-8">

      {/* Header */}
      <GovernanceWalletControl />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Staking Power" value="2.85M SF" icon={<Icon id={ICON_IDS.vote} size={20} className="text-blue-400" />} subtitle="Active voting weights" />
        <StatCard title="Active Ballots" value="2 Proposals" icon={<Icon id={ICON_IDS.clock} size={20} className="text-yellow-500" />} subtitle="Awaiting validation signatures" />
        <StatCard title="Voter Turnout Avg" value="74.2%" icon={<Icon id={ICON_IDS.users} size={20} className="text-green-400" />} subtitle="High network coordinator interest" />
        <StatCard title="Passing Invariants" value="100%" icon={<Icon id={ICON_IDS.checkCircle} size={20} className="text-emerald-400" />} subtitle="All parameters safe" />
      </div>

      {/* Filtering Tabs */}
      <div className="flex border-b border-gray-800 mb-6 gap-6">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`pb-3 text-sm font-medium capitalize relative ${activeTab === key ? 'text-blue-400 border-b-2 border-blue-500' : 'text-gray-500'}`}
          >
            {activeTab !== key && (
              <span className="absolute inset-0 bg-white/4 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      {/* Proposal List */}
      <ProposalList
        proposals={MOCK_PROPOSALS}
        filter={activeTab}
        onVote={(proposal) => setVoteTarget(proposal)}
      />

      {/* Vote Confirmation Modal */}
      <VoteModal
        isOpen={voteTarget !== null}
        onClose={() => setVoteTarget(null)}
        proposalId={voteTarget?.id ?? ''}
        proposalTitle={voteTarget?.title ?? ''}
        totalStakingPower={2_850_000}
        onVoteSuccess={(submission) => {
          console.log('Vote submitted:', submission);
          setVoteTarget(null);
        }}
        onVoteError={(error) => {
          console.error('Vote failed:', error);
        }}
      />

    </div>
  );
}

// --- Sub-components ---
function StatCard({ title, value, icon, subtitle }: { title: string, value: string, icon: React.ReactNode, subtitle: string }) {
  return (
    <div className="bg-[#161b22] border border-gray-800 p-6 rounded-xl">
      <div className="flex justify-between items-start mb-2">
        <span className="text-gray-400 text-sm font-medium">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold mb-1 tracking-tight">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}
