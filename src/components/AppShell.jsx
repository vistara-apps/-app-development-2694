import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Zap, Trophy, Users } from 'lucide-react';

const AppShell = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-blue-800">
      {/* Navigation */}
      <nav className="glass-effect border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Zap className="w-8 h-8 text-accent" />
              <span className="text-white text-xl font-bold">FairDraw Protocol</span>
            </div>
            <div className="flex items-center space-x-4">
              <ConnectButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Floating Stats */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="glass-effect rounded-xl p-4 text-white space-y-2">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="text-sm">Active Draws: 12</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-accent" />
            <span className="text-sm">Total Participants: 1,234</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppShell;