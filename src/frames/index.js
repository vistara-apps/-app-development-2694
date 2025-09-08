// Farcaster Frame Integration for FairDraw Protocol

export const FRAME_ACTIONS = {
  VIEW_DRAWS: 'view_draws',
  JOIN_DRAW: 'join_draw',
  CREATE_DRAW: 'create_draw',
  VIEW_RESULTS: 'view_results',
};

/**
 * Generate Frame metadata for HTML head
 */
export function generateFrameMetadata(action, data = {}) {
  const baseUrl = process.env.VITE_APP_URL || 'https://fairdraw.vistara.dev';
  
  const metadata = {
    'fc:frame': 'vNext',
    'fc:frame:image': `${baseUrl}/api/frames/image/${action}`,
    'fc:frame:post_url': `${baseUrl}/api/frames/action`,
    'fc:frame:image:aspect_ratio': '1.91:1',
  };

  switch (action) {
    case FRAME_ACTIONS.VIEW_DRAWS:
      return {
        ...metadata,
        'fc:frame:button:1': 'View Active Draws',
        'fc:frame:button:1:action': 'post',
        'fc:frame:button:2': 'Create Draw',
        'fc:frame:button:2:action': 'post',
        'fc:frame:button:3': 'View Results',
        'fc:frame:button:3:action': 'post',
        'fc:frame:state': JSON.stringify({ action: FRAME_ACTIONS.VIEW_DRAWS }),
      };

    case FRAME_ACTIONS.JOIN_DRAW:
      return {
        ...metadata,
        'fc:frame:image': `${baseUrl}/api/frames/image/draw/${data.drawId}`,
        'fc:frame:button:1': `Join Draw (${data.entryFee} ETH)`,
        'fc:frame:button:1:action': 'post',
        'fc:frame:button:2': 'View Details',
        'fc:frame:button:2:action': 'link',
        'fc:frame:button:2:target': `${baseUrl}/draw/${data.drawId}`,
        'fc:frame:button:3': 'Share',
        'fc:frame:button:3:action': 'post',
        'fc:frame:state': JSON.stringify({ 
          action: FRAME_ACTIONS.JOIN_DRAW, 
          drawId: data.drawId 
        }),
      };

    case FRAME_ACTIONS.CREATE_DRAW:
      return {
        ...metadata,
        'fc:frame:button:1': 'Create New Draw',
        'fc:frame:button:1:action': 'link',
        'fc:frame:button:1:target': `${baseUrl}/create`,
        'fc:frame:button:2': 'Learn More',
        'fc:frame:button:2:action': 'link',
        'fc:frame:button:2:target': `${baseUrl}`,
        'fc:frame:state': JSON.stringify({ action: FRAME_ACTIONS.CREATE_DRAW }),
      };

    case FRAME_ACTIONS.VIEW_RESULTS:
      return {
        ...metadata,
        'fc:frame:image': `${baseUrl}/api/frames/image/results/${data.drawId}`,
        'fc:frame:button:1': 'View on Basescan',
        'fc:frame:button:1:action': 'link',
        'fc:frame:button:1:target': `https://basescan.org/address/${data.contractAddress}`,
        'fc:frame:button:2': 'Create New Draw',
        'fc:frame:button:2:action': 'link',
        'fc:frame:button:2:target': `${baseUrl}/create`,
        'fc:frame:state': JSON.stringify({ 
          action: FRAME_ACTIONS.VIEW_RESULTS, 
          drawId: data.drawId 
        }),
      };

    default:
      return metadata;
  }
}

/**
 * Handle Frame action requests
 */
export async function handleFrameAction(request) {
  try {
    const body = await request.json();
    const { untrustedData, trustedData } = body;
    
    // Verify the frame message (in production, verify with Farcaster Hub)
    const buttonIndex = untrustedData.buttonIndex;
    const fid = untrustedData.fid;
    const state = JSON.parse(untrustedData.state || '{}');
    
    switch (state.action) {
      case FRAME_ACTIONS.VIEW_DRAWS:
        return handleViewDrawsAction(buttonIndex, fid);
        
      case FRAME_ACTIONS.JOIN_DRAW:
        return handleJoinDrawAction(buttonIndex, fid, state.drawId);
        
      case FRAME_ACTIONS.CREATE_DRAW:
        return handleCreateDrawAction(buttonIndex, fid);
        
      default:
        return generateDefaultResponse();
    }
  } catch (error) {
    console.error('Frame action error:', error);
    return generateErrorResponse();
  }
}

async function handleViewDrawsAction(buttonIndex, fid) {
  switch (buttonIndex) {
    case 1: // View Active Draws
      // Fetch active draws and return frame with draw list
      return generateFrameResponse(FRAME_ACTIONS.VIEW_DRAWS, {
        message: 'Active draws loaded',
      });
      
    case 2: // Create Draw
      return generateFrameResponse(FRAME_ACTIONS.CREATE_DRAW);
      
    case 3: // View Results
      return generateFrameResponse(FRAME_ACTIONS.VIEW_RESULTS);
      
    default:
      return generateDefaultResponse();
  }
}

async function handleJoinDrawAction(buttonIndex, fid, drawId) {
  switch (buttonIndex) {
    case 1: // Join Draw
      // In a real implementation, this would interact with the smart contract
      // For now, return a success message
      return generateFrameResponse(FRAME_ACTIONS.JOIN_DRAW, {
        drawId,
        message: 'Draw joined successfully! Transaction pending...',
      });
      
    case 3: // Share
      return generateFrameResponse(FRAME_ACTIONS.JOIN_DRAW, {
        drawId,
        message: 'Share this draw with your friends!',
      });
      
    default:
      return generateDefaultResponse();
  }
}

async function handleCreateDrawAction(buttonIndex, fid) {
  // Redirect to the main app for draw creation
  return generateFrameResponse(FRAME_ACTIONS.CREATE_DRAW);
}

function generateFrameResponse(action, data = {}) {
  const metadata = generateFrameMetadata(action, data);
  
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        ${Object.entries(metadata)
          .map(([key, value]) => `<meta property="${key}" content="${value}" />`)
          .join('\n        ')}
      </head>
      <body>
        <h1>FairDraw Protocol</h1>
        <p>Verifiably fair draws on Base</p>
      </body>
    </html>`,
    {
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}

function generateDefaultResponse() {
  return generateFrameResponse(FRAME_ACTIONS.VIEW_DRAWS);
}

function generateErrorResponse() {
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://fairdraw.vistara.dev/error.png" />
        <meta property="fc:frame:button:1" content="Try Again" />
        <meta property="fc:frame:button:1:action" content="post" />
        <meta property="fc:frame:post_url" content="https://fairdraw.vistara.dev/api/frames/action" />
      </head>
      <body>
        <h1>Error</h1>
        <p>Something went wrong. Please try again.</p>
      </body>
    </html>`,
    {
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}

/**
 * Generate share URL for a draw
 */
export function generateDrawShareUrl(drawId, baseUrl = 'https://fairdraw.vistara.dev') {
  return `${baseUrl}/frame/draw/${drawId}`;
}

/**
 * Generate Farcaster cast text for sharing a draw
 */
export function generateDrawCastText(draw) {
  const shareUrl = generateDrawShareUrl(draw.drawId);
  
  return `🎲 Join "${draw.name}" on FairDraw Protocol!

💰 Entry Fee: ${draw.entryFee} ETH
🏆 Winners: ${draw.winnerCount}
⏰ Ends: ${new Date(draw.endTime).toLocaleDateString()}

Verifiably fair draws powered by Base & Chainlink VRF ⚡

${shareUrl}`;
}

/**
 * Validate Frame signature (simplified version)
 * In production, use Farcaster Hub API for proper validation
 */
export function validateFrameSignature(trustedData) {
  // This is a simplified validation
  // In production, verify with Farcaster Hub API
  return trustedData && trustedData.messageBytes;
}
