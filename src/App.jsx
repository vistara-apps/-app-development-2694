import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Plus, TrendingUp, Clock, Trophy } from 'lucide-react';
import AppShell from './components/AppShell';
import DrawCard from './components/DrawCard';
import CreateDrawForm from './components/CreateDrawForm';
import ParticipantEntryForm from './components/ParticipantEntryForm';
import WinnerDisplay from './components/WinnerDisplay';
import SocialShareButton from './components/SocialShareButton';

// Mock data for demonstration
const mockDraws = [
  {
    drawId: 'draw_1',
    name: 'Weekly NFT Giveaway',
    description: 'Win exclusive Base ecosystem NFTs',
    creatorAddress: '0x123...',
    startTimestamp: Date.now() - 24 * 60 * 60 * 1000,
    endTimestamp: Date.now() + 2 * 24 * 60 * 60 * 1000,
    isEnded: false,
    winnerCount: 3,
    entryFee: 0.001,
    contractAddress: '0xabc123...',
    participantCount: 47,
    winnerSelected: false,
  },
  {
    drawId: 'draw_2',
    name: 'Base Builder Rewards',
    description: 'Exclusive rewards for Base builders and developers',
    creatorAddress: '0x456...',
    startTimestamp: Date.now() - 12 * 60 * 60 * 1000,
    endTimestamp: Date.now() + 6 * 60 * 60 * 1000,
    isEnded: false,
    winnerCount: 1,
    entryFee: 0.005,
    contractAddress: '0xdef456...',
    participantCount: 23,
    winnerSelected: false,
  },
  {
    drawId: 'draw_3',
    name: 'Community Appreciation Draw',
    description: 'Thank you draw for our amazing community',
    creatorAddress: '0x789...',
    startTimestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    endTimestamp: Date.now() - 1 * 60 * 60 * 1000,
    isEnded: true,
    winnerCount: 5,
    entryFee: 0.002,
    contractAddress: '0xghi789...',
    participantCount: 156,
    winnerSelected: true,
  },
];

const mockWinners = [
  {
    participantAddress: '0x1234567890123456789012345678901234567890',
    transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  },
  {
    participantAddress: '0x2345678901234567890123456789012345678901',
    transactionHash: '0xbcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890a',
  },
  {
    participantAddress: '0x3456789012345678901234567890123456789012',
    transactionHash: '0xcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
  },
];

function App() {
  const { address, isConnected } = useAccount();
  const [draws, setDraws] = useState(mockDraws);
  const [selectedTab, setSelectedTab] = useState('active');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedDraw, setSelectedDraw] = useState(null);

  const activeDraws = draws.filter(draw => !draw.isEnded);
  const endedDraws = draws.filter(draw => draw.isEnded);

  const handleCreateDraw = (newDraw) => {
    setDraws(prev => [newDraw, ...prev]);
    setShowCreateForm(false);
  };

  const handleJoinDraw = (draw) => {
    if (!isConnected) {
      alert('Please connect your wallet to join draws');
      return;
    }
    setSelectedDraw(draw);
    setShowJoinForm(true);
  };

  const handleJoinConfirm = (participation) => {
    setDraws(prev => prev.map(draw => 
      draw.drawId === participation.drawId 
        ? { ...draw, participantCount: draw.participantCount + 1 }
        : draw
    ));
    setShowJoinForm(false);
    setSelectedDraw(null);
  };

  const handleViewDetails = (draw) => {
    setSelectedDraw(draw);
    if (draw.isEnded) {
      setShowResults(true);
    }
  };

  return (
    <AppShell>
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          <span className="gradient-text">FairDraw</span> Protocol
        </h1>
        <p className="text-gray-300 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
          Verifiably fair draws, powered by Base. Create transparent, on-chain lottery systems with provable randomness.
        </p>
        
        {isConnected ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-accent hover:bg-accent/80 text-white font-medium px-8 py-4 rounded-xl transition-all duration-200 hover:scale-105 flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Create Draw</span>
          </button>
        ) : (
          <div className="bg-white/10 border border-white/20 rounded-xl p-6 max-w-md mx-auto">
            <p className="text-white mb-4">Connect your wallet to start creating draws</p>
            <p className="text-gray-300 text-sm">Powered by Base network for low fees and fast transactions</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="glass-effect rounded-xl p-6 text-center">
          <TrendingUp className="w-8 h-8 text-accent mx-auto mb-4" />
          <h3 className="text-white text-2xl font-bold mb-2">
            {draws.reduce((sum, draw) => sum + draw.participantCount, 0)}
          </h3>
          <p className="text-gray-300">Total Participants</p>
        </div>
        <div className="glass-effect rounded-xl p-6 text-center">
          <Clock className="w-8 h-8 text-accent mx-auto mb-4" />
          <h3 className="text-white text-2xl font-bold mb-2">{activeDraws.length}</h3>
          <p className="text-gray-300">Active Draws</p>
        </div>
        <div className="glass-effect rounded-xl p-6 text-center">
          <Trophy className="w-8 h-8 text-accent mx-auto mb-4" />
          <h3 className="text-white text-2xl font-bold mb-2">
            {draws.reduce((sum, draw) => sum + (draw.participantCount * draw.entryFee), 0).toFixed(2)} ETH
          </h3>
          <p className="text-gray-300">Total Prize Pool</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/10 rounded-xl p-1 mb-8 max-w-md mx-auto">
        <button
          onClick={() => setSelectedTab('active')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            selectedTab === 'active'
              ? 'bg-accent text-white'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          Active ({activeDraws.length})
        </button>
        <button
          onClick={() => setSelectedTab('ended')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            selectedTab === 'ended'
              ? 'bg-accent text-white'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          Ended ({endedDraws.length})
        </button>
      </div>

      {/* Draws Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(selectedTab === 'active' ? activeDraws : endedDraws).map((draw) => (
          <div key={draw.drawId} className="relative">
            <DrawCard
              draw={draw}
              variant={selectedTab}
              onJoin={handleJoinDraw}
              onViewDetails={handleViewDetails}
            />
            <div className="absolute top-4 right-4">
              <SocialShareButton draw={draw} />
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {(selectedTab === 'active' ? activeDraws : endedDraws).length === 0 && (
        <div className="text-center py-12">
          <div className="glass-effect rounded-xl p-8 max-w-md mx-auto">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">
              {selectedTab === 'active' ? 'No Active Draws' : 'No Completed Draws'}
            </h3>
            <p className="text-gray-300 text-sm">
              {selectedTab === 'active' 
                ? 'Be the first to create a draw and start the excitement!'
                : 'Check back later for completed draw results.'
              }
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateDrawForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleCreateDraw}
      />

      <ParticipantEntryForm
        draw={selectedDraw}
        isOpen={showJoinForm}
        onClose={() => {
          setShowJoinForm(false);
          setSelectedDraw(null);
        }}
        onJoin={handleJoinConfirm}
      />

      {showResults && selectedDraw && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <button
                onClick={() => {
                  setShowResults(false);
                  setSelectedDraw(null);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
              <WinnerDisplay
                draw={selectedDraw}
                winners={mockWinners.slice(0, selectedDraw.winnerCount)}
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default App;