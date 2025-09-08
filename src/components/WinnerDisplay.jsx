import React from 'react';
import { Trophy, ExternalLink, Copy } from 'lucide-react';

const WinnerDisplay = ({ draw, winners = [] }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const shortenAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="glass-effect rounded-xl p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Trophy className="w-6 h-6 text-accent" />
        <h2 className="text-white text-xl font-bold">Draw Results</h2>
      </div>

      {/* Draw Info */}
      <div className="mb-6">
        <h3 className="text-white text-lg font-semibold mb-2">{draw.name}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-gray-300 text-sm">Total Participants</p>
            <p className="text-white font-bold">{draw.participantCount}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-gray-300 text-sm">Winners Selected</p>
            <p className="text-white font-bold">{winners.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-gray-300 text-sm">Prize Pool</p>
            <p className="text-white font-bold">{(draw.participantCount * draw.entryFee).toFixed(3)} ETH</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-gray-300 text-sm">Per Winner</p>
            <p className="text-white font-bold">{((draw.participantCount * draw.entryFee) / winners.length).toFixed(3)} ETH</p>
          </div>
        </div>
      </div>

      {/* Winners List */}
      <div>
        <h4 className="text-white font-semibold mb-4">🏆 Winners</h4>
        <div className="space-y-3">
          {winners.map((winner, index) => (
            <div key={winner.participantAddress} className="bg-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {shortenAddress(winner.participantAddress)}
                    </p>
                    <p className="text-gray-300 text-sm">
                      Winner #{index + 1}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(winner.participantAddress)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => window.open(`https://basescan.org/tx/${winner.transactionHash}`, '_blank')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verification */}
      <div className="mt-6 bg-accent/10 border border-accent/30 rounded-lg p-4">
        <h5 className="text-accent font-medium mb-2">Verification</h5>
        <p className="text-gray-300 text-sm mb-2">
          This draw was conducted using verifiable randomness and all results are recorded on the Base blockchain.
        </p>
        <button
          onClick={() => window.open(`https://basescan.org/address/${draw.contractAddress}`, '_blank')}
          className="text-accent hover:text-accent/80 text-sm flex items-center space-x-1"
        >
          <span>View Smart Contract</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default WinnerDisplay;