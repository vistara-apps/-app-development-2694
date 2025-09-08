import React, { useState } from 'react';
import { X, Calendar, Users, DollarSign, Trophy } from 'lucide-react';
import { usePaymentContext } from '../hooks/usePaymentContext';

const CreateDrawForm = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    endDate: '',
    endTime: '',
    winnerCount: 1,
    entryFee: 0.001,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createSession } = usePaymentContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Process payment for draw creation
      await createSession("$0.001");
      
      // Create draw
      const draw = {
        ...formData,
        drawId: `draw_${Date.now()}`,
        creatorAddress: '0x...',
        startTimestamp: Date.now(),
        endTimestamp: new Date(`${formData.endDate}T${formData.endTime}`).getTime(),
        isEnded: false,
        participantCount: 0,
        winnerSelected: false,
        contractAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      };
      
      onSubmit(draw);
      setFormData({
        name: '',
        description: '',
        endDate: '',
        endTime: '',
        winnerCount: 1,
        entryFee: 0.001,
      });
    } catch (error) {
      console.error('Error creating draw:', error);
      alert('Failed to create draw. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="glass-effect rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-2xl font-bold">Create New Draw</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Draw Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-accent"
              placeholder="e.g., Weekly NFT Giveaway"
              required
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-accent"
              placeholder="Describe your draw..."
              rows="3"
            />
          </div>

          {/* Timing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                required
              />
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                required
              />
            </div>
          </div>

          {/* Draw Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                <Trophy className="w-4 h-4 inline mr-1" />
                Number of Winners
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.winnerCount}
                onChange={(e) => setFormData(prev => ({ ...prev, winnerCount: parseInt(e.target.value) }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                required
              />
            </div>
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Entry Fee (ETH)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.entryFee}
                onChange={(e) => setFormData(prev => ({ ...prev, entryFee: parseFloat(e.target.value) }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                required
              />
            </div>
          </div>

          {/* Fee Notice */}
          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
            <p className="text-accent text-sm">
              <strong>Creation Fee:</strong> 0.001 ETH + gas fees
            </p>
            <p className="text-gray-300 text-xs mt-1">
              This fee covers smart contract deployment and platform costs.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-accent hover:bg-accent/80 disabled:bg-accent/50 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200"
          >
            {isSubmitting ? 'Creating Draw...' : 'Create Draw (0.001 ETH)'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateDrawForm;