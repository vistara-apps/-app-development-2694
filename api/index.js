// Backend API for FairDraw Protocol
import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import { handleFrameAction } from '../src/frames/index.js';
import FairDrawABI from '../src/contracts/FairDrawABI.json' assert { type: 'json' };
import deployment from '../src/contracts/deployment.json' assert { type: 'json' };

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup (Supabase)
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'your-anon-key'
);

// Blockchain setup
const provider = new ethers.JsonRpcProvider(
  process.env.BASE_RPC_URL || 'https://mainnet.base.org'
);

const contract = new ethers.Contract(
  deployment.contractAddress,
  FairDrawABI,
  provider
);

// Routes

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Get all draws with pagination
 */
app.get('/api/draws', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('draws')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status === 'active') {
      query = query.eq('is_ended', false);
    } else if (status === 'ended') {
      query = query.eq('is_ended', true);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      draws: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching draws:', error);
    res.status(500).json({ error: 'Failed to fetch draws' });
  }
});

/**
 * Get specific draw by ID
 */
app.get('/api/draws/:drawId', async (req, res) => {
  try {
    const { drawId } = req.params;

    // Fetch from database
    const { data: dbDraw, error: dbError } = await supabase
      .from('draws')
      .select('*')
      .eq('draw_id', drawId)
      .single();

    if (dbError && dbError.code !== 'PGRST116') throw dbError;

    // Fetch from blockchain
    const blockchainDraw = await contract.getDraw(drawId);
    
    const draw = {
      drawId: Number(blockchainDraw.drawId),
      creator: blockchainDraw.creator,
      name: blockchainDraw.name,
      description: blockchainDraw.description,
      startTime: Number(blockchainDraw.startTime) * 1000,
      endTime: Number(blockchainDraw.endTime) * 1000,
      isEnded: blockchainDraw.isEnded,
      winnerCount: Number(blockchainDraw.winnerCount),
      entryFee: ethers.formatEther(blockchainDraw.entryFee),
      participants: blockchainDraw.participants,
      winners: blockchainDraw.winners,
      winnersSelected: blockchainDraw.winnersSelected,
      participantCount: blockchainDraw.participants.length,
      contractAddress: deployment.contractAddress,
      // Merge with database data if available
      ...dbDraw,
    };

    res.json(draw);
  } catch (error) {
    console.error('Error fetching draw:', error);
    res.status(500).json({ error: 'Failed to fetch draw' });
  }
});

/**
 * Get draw participants
 */
app.get('/api/draws/:drawId/participants', async (req, res) => {
  try {
    const { drawId } = req.params;

    const participants = await contract.getDrawParticipants(drawId);
    const participations = await contract.getDrawParticipations(drawId);

    const participantDetails = participations.map(p => ({
      drawId: Number(p.drawId),
      participant: p.participant,
      timestamp: Number(p.timestamp) * 1000,
      isWinner: p.isWinner,
    }));

    res.json({
      participants,
      participations: participantDetails,
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

/**
 * Get user's draws
 */
app.get('/api/users/:address/draws', async (req, res) => {
  try {
    const { address } = req.params;

    const drawIds = await contract.getUserDraws(address);
    const draws = [];

    for (const drawId of drawIds) {
      try {
        const draw = await contract.getDraw(Number(drawId));
        draws.push({
          drawId: Number(draw.drawId),
          creator: draw.creator,
          name: draw.name,
          description: draw.description,
          startTime: Number(draw.startTime) * 1000,
          endTime: Number(draw.endTime) * 1000,
          isEnded: draw.isEnded,
          winnerCount: Number(draw.winnerCount),
          entryFee: ethers.formatEther(draw.entryFee),
          participantCount: draw.participants.length,
          winnersSelected: draw.winnersSelected,
        });
      } catch (err) {
        console.warn(`Failed to fetch draw ${drawId}:`, err);
      }
    }

    res.json(draws);
  } catch (error) {
    console.error('Error fetching user draws:', error);
    res.status(500).json({ error: 'Failed to fetch user draws' });
  }
});

/**
 * Get user's participations
 */
app.get('/api/users/:address/participations', async (req, res) => {
  try {
    const { address } = req.params;

    const drawIds = await contract.getUserParticipations(address);
    const participations = [];

    for (const drawId of drawIds) {
      try {
        const draw = await contract.getDraw(Number(drawId));
        const isWinner = draw.winners.includes(address);
        
        participations.push({
          drawId: Number(draw.drawId),
          name: draw.name,
          description: draw.description,
          endTime: Number(draw.endTime) * 1000,
          isEnded: draw.isEnded,
          entryFee: ethers.formatEther(draw.entryFee),
          isWinner,
          winnersSelected: draw.winnersSelected,
        });
      } catch (err) {
        console.warn(`Failed to fetch participation draw ${drawId}:`, err);
      }
    }

    res.json(participations);
  } catch (error) {
    console.error('Error fetching user participations:', error);
    res.status(500).json({ error: 'Failed to fetch user participations' });
  }
});

/**
 * Farcaster Frame endpoints
 */
app.post('/api/frames/action', async (req, res) => {
  try {
    const response = await handleFrameAction(req);
    return response;
  } catch (error) {
    console.error('Frame action error:', error);
    res.status(500).json({ error: 'Frame action failed' });
  }
});

/**
 * Generate Frame images
 */
app.get('/api/frames/image/:action', async (req, res) => {
  try {
    const { action } = req.params;
    
    // In a real implementation, generate dynamic images based on action
    // For now, return a placeholder
    const imageUrl = `https://via.placeholder.com/1200x630/1e1b4b/ffffff?text=FairDraw+Protocol+-+${action}`;
    
    res.redirect(imageUrl);
  } catch (error) {
    console.error('Error generating frame image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

/**
 * Generate Frame image for specific draw
 */
app.get('/api/frames/image/draw/:drawId', async (req, res) => {
  try {
    const { drawId } = req.params;
    
    // Fetch draw details
    const draw = await contract.getDraw(drawId);
    
    // In a real implementation, generate a dynamic image with draw details
    const imageUrl = `https://via.placeholder.com/1200x630/1e1b4b/ffffff?text=${encodeURIComponent(draw.name)}`;
    
    res.redirect(imageUrl);
  } catch (error) {
    console.error('Error generating draw image:', error);
    res.status(500).json({ error: 'Failed to generate draw image' });
  }
});

/**
 * Webhook for blockchain events
 */
app.post('/api/webhooks/blockchain', async (req, res) => {
  try {
    const { event, data } = req.body;

    switch (event) {
      case 'DrawCreated':
        await handleDrawCreated(data);
        break;
      case 'ParticipantEntered':
        await handleParticipantEntered(data);
        break;
      case 'WinnersSelected':
        await handleWinnersSelected(data);
        break;
      case 'DrawEnded':
        await handleDrawEnded(data);
        break;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Event handlers
async function handleDrawCreated(data) {
  const { drawId, creator, endTime, winnerCount, entryFee } = data;
  
  // Store in database
  await supabase.from('draws').insert({
    draw_id: drawId,
    creator,
    end_time: new Date(endTime * 1000),
    winner_count: winnerCount,
    entry_fee: ethers.formatEther(entryFee),
    is_ended: false,
    winners_selected: false,
    created_at: new Date(),
  });
}

async function handleParticipantEntered(data) {
  const { drawId, participant, timestamp } = data;
  
  // Store participation
  await supabase.from('participations').insert({
    draw_id: drawId,
    participant,
    timestamp: new Date(timestamp * 1000),
    is_winner: false,
  });
}

async function handleWinnersSelected(data) {
  const { drawId, winners } = data;
  
  // Update draw
  await supabase
    .from('draws')
    .update({ winners_selected: true })
    .eq('draw_id', drawId);

  // Update participations
  for (const winner of winners) {
    await supabase
      .from('participations')
      .update({ is_winner: true })
      .eq('draw_id', drawId)
      .eq('participant', winner);
  }
}

async function handleDrawEnded(data) {
  const { drawId } = data;
  
  await supabase
    .from('draws')
    .update({ is_ended: true })
    .eq('draw_id', drawId);
}

/**
 * Statistics endpoint
 */
app.get('/api/stats', async (req, res) => {
  try {
    const totalDraws = await contract.getTotalDraws();
    
    const { data: stats } = await supabase
      .from('draws')
      .select('*');

    const activeDraws = stats?.filter(d => !d.is_ended).length || 0;
    const totalParticipants = stats?.reduce((sum, d) => sum + (d.participant_count || 0), 0) || 0;
    const totalPrizePool = stats?.reduce((sum, d) => sum + parseFloat(d.entry_fee || 0) * (d.participant_count || 0), 0) || 0;

    res.json({
      totalDraws: Number(totalDraws),
      activeDraws,
      totalParticipants,
      totalPrizePool: totalPrizePool.toFixed(4),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`FairDraw Protocol API running on port ${PORT}`);
  console.log(`Contract address: ${deployment.contractAddress}`);
  console.log(`Network: ${deployment.network}`);
});
