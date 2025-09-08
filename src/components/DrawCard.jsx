import React from 'react';
import { Clock, Users, DollarSign, Trophy } from 'lucide-react';

const DrawCard = ({ draw, variant = 'active', onJoin, onViewDetails }) => {
  const isActive = variant === 'active';
  const timeLeft = isActive ? draw.endTimestamp - Date.now() : 0;
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className={`glass-effect rounded-xl p-6 transition-all duration-300 hover:scale-105 ${
      isActive ? 'border-accent/50 hover:border-accent' : 'border-gray-500/50'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-white text-lg font-semibold mb-1">{draw.name}</h3>
          <p className="text-gray-300 text-sm">{draw.description}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isActive 
            ? 'bg-accent/20 text-accent border border-accent/30' 
            : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
        }`}>
          {isActive ? 'Active' : 'Ended'}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-accent" />
          <span className="text-white text-sm">{draw.participantCount} participants</span>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-accent" />
          <span className="text-white text-sm">{draw.entryFee} ETH entry</span>
        </div>
        <div className="flex items-center space-x-2">
          <Trophy className="w-4 h-4 text-accent" />
          <span className="text-white text-sm">{draw.winnerCount} winners</span>
        </div>
        {isActive && (
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-white text-sm">{hours}h {minutes}m left</span>
          </div>
        )}
      </div>

      {/* Prize Pool */}
      <div className="bg-white/10 rounded-lg p-4 mb-4">
        <p className="text-gray-300 text-sm mb-1">Total Prize Pool</p>
        <p className="text-white text-2xl font-bold">{(draw.participantCount * draw.entryFee).toFixed(3)} ETH</p>
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        {isActive ? (
          <button
            onClick={() => onJoin(draw)}
            className="flex-1 bg-accent hover:bg-accent/80 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Join Draw
          </button>
        ) : (
          <button
            onClick={() => onViewDetails(draw)}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
          >
            View Results
          </button>
        )}
        <button
          onClick={() => onViewDetails(draw)}
          className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
        >
          Details
        </button>
      </div>
    </div>
  );
};

export default DrawCard;