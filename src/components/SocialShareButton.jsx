import React from 'react';
import { Share2, Twitter, Copy } from 'lucide-react';

const SocialShareButton = ({ draw, variant = 'default' }) => {
  const shareUrl = `${window.location.origin}/draw/${draw.drawId}`;
  const shareText = `Check out this fair draw on FairDraw Protocol! 🎯\n\n${draw.name}\n💰 ${(draw.participantCount * draw.entryFee).toFixed(3)} ETH prize pool\n🏆 ${draw.winnerCount} winners\n\nJoin now: ${shareUrl}`;

  const handleShare = async (platform) => {
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'copy':
        await navigator.clipboard.writeText(shareText);
        break;
      case 'native':
        if (navigator.share) {
          await navigator.share({
            title: draw.name,
            text: shareText,
            url: shareUrl,
          });
        }
        break;
    }
  };

  return (
    <div className="relative group">
      <button className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors duration-200">
        <Share2 className="w-4 h-4" />
        <span className="text-sm">Share</span>
      </button>
      
      {/* Dropdown */}
      <div className="absolute bottom-full right-0 mb-2 bg-white/10 backdrop-blur-md rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 min-w-[150px]">
        <button
          onClick={() => handleShare('twitter')}
          className="w-full flex items-center space-x-2 text-white hover:bg-white/10 px-3 py-2 rounded text-sm"
        >
          <Twitter className="w-4 h-4" />
          <span>Twitter</span>
        </button>
        <button
          onClick={() => handleShare('copy')}
          className="w-full flex items-center space-x-2 text-white hover:bg-white/10 px-3 py-2 rounded text-sm"
        >
          <Copy className="w-4 h-4" />
          <span>Copy Link</span>
        </button>
        {navigator.share && (
          <button
            onClick={() => handleShare('native')}
            className="w-full flex items-center space-x-2 text-white hover:bg-white/10 px-3 py-2 rounded text-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>More</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SocialShareButton;