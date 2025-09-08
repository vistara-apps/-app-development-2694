import React, { useState } from 'react';
import { X, DollarSign, Users, Trophy, Clock } from 'lucide-react';
import { usePaymentContext } from '../hooks/usePaymentContext';

const ParticipantEntryForm = ({ draw, isOpen, onClose, onJoin }) => {
  const [isJoining, setIsJoining] = useState(false);
  const { createSession } = usePaymentContext();

  const handleJoin = async () => {
    setIsJoining(true);
    
    try {
      // Process payment for entry fee
      await createSession(`$${draw.entryFee * 3000}`); // Rough ETH to USD conversion
      
      // Join draw
      const participation = {
        participationId: `part_${Date.now()}`,
        drawId: draw.drawId,
        participantAddress: '0x...',
        entryTimestamp: Date.now(),
        isWinner: false,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      };
      
      onJoin(participation);
    } catch (error) {
      console.error('Error joining draw:', error);
      alert('Failed to join draw. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  if (!isOpen || !draw) return null;

  const timeLeft = draw.endTimestamp - Date.now();
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="glass-effect rounded-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-bold">Join Draw</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Draw Info */}
        <div className="space-y-4 mb-6">
          <h3 className="text-white text-lg font-semibold">{draw.name}</h3>
          <p className="text-gray-300 text-sm">{draw.description}</p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Users className="w-4 h-4 text-accent" />
                <span className="text-gray-300 text-sm">Participants</span>
              </div>
              <p className="text-white font-semibold">{draw.participantCount}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Trophy className="w-4 h-4 text-accent" />
                <span className="text-gray-300 text-sm">Winners</span>
              </div>
              <p className="text-white font-semibold">{draw.winnerCount}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <DollarSign className="w-4 h-4 text-accent" />
                <span className="text-gray-300 text-sm">Prize Pool</span>
              </div>
              <p className="text-white font-semibold">{(draw.participantCount * draw.entryFee).toFixed(3)} ETH</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-accent" />
                <span className="text-gray-300 text-sm">Time Left</span>
              </div>
              <p className="text-white font-semibold">{hours}h {minutes}m</p>
            </div>
          </div>
        </div>

        {/* Entry Fee */}
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">Entry Fee:</span>
            <span className="text-accent font-bold">{draw.entryFee} ETH</span>
          </div>
          <p className="text-gray-300 text-sm mt-1">+ gas fees</p>
        </div>

        {/* Action */}
        <button
          onClick={handleJoin}
          disabled={isJoining}
          className="w-full bg-accent hover:bg-accent/80 disabled:bg-accent/50 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200"
        >
          {isJoining ? 'Joining Draw...' : `Join Draw (${draw.entryFee} ETH)`}
        </button>

        <p className="text-gray-400 text-xs text-center mt-3">
          By joining, you agree to the draw terms and conditions
        </p>
      </div>
    </div>
  );
};

export default ParticipantEntryForm;