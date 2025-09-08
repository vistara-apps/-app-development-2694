import { useContract, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useState, useCallback } from 'react';
import FairDrawABI from '../contracts/FairDrawABI.json';
import deployment from '../contracts/deployment.json';

const CONTRACT_ADDRESS = deployment.contractAddress;

export function useFairDrawContract() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Contract instance
  const contract = useContract({
    address: CONTRACT_ADDRESS,
    abi: FairDrawABI,
  });

  // Read functions
  const { data: totalDraws } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: FairDrawABI,
    functionName: 'getTotalDraws',
  });

  const { data: platformFee } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: FairDrawABI,
    functionName: 'platformFee',
  });

  // Get draw details
  const getDraw = useCallback(async (drawId) => {
    try {
      const draw = await contract.read.getDraw([drawId]);
      return {
        drawId: Number(draw.drawId),
        creator: draw.creator,
        name: draw.name,
        description: draw.description,
        startTime: Number(draw.startTime) * 1000, // Convert to milliseconds
        endTime: Number(draw.endTime) * 1000,
        isEnded: draw.isEnded,
        winnerCount: Number(draw.winnerCount),
        entryFee: formatEther(draw.entryFee),
        participants: draw.participants,
        winners: draw.winners,
        winnersSelected: draw.winnersSelected,
        participantCount: draw.participants.length,
      };
    } catch (err) {
      console.error('Error fetching draw:', err);
      throw err;
    }
  }, [contract]);

  // Get multiple draws
  const getDraws = useCallback(async (startId = 1, count = 10) => {
    try {
      const draws = [];
      const total = Number(totalDraws) || 0;
      const endId = Math.min(startId + count - 1, total);
      
      for (let i = startId; i <= endId; i++) {
        try {
          const draw = await getDraw(i);
          draws.push(draw);
        } catch (err) {
          console.warn(`Failed to fetch draw ${i}:`, err);
        }
      }
      
      return draws.reverse(); // Show newest first
    } catch (err) {
      console.error('Error fetching draws:', err);
      throw err;
    }
  }, [getDraw, totalDraws]);

  // Get user's draws
  const getUserDraws = useCallback(async (userAddress) => {
    try {
      const drawIds = await contract.read.getUserDraws([userAddress]);
      const draws = [];
      
      for (const drawId of drawIds) {
        try {
          const draw = await getDraw(Number(drawId));
          draws.push(draw);
        } catch (err) {
          console.warn(`Failed to fetch user draw ${drawId}:`, err);
        }
      }
      
      return draws.reverse();
    } catch (err) {
      console.error('Error fetching user draws:', err);
      throw err;
    }
  }, [contract, getDraw]);

  // Get user's participations
  const getUserParticipations = useCallback(async (userAddress) => {
    try {
      const drawIds = await contract.read.getUserParticipations([userAddress]);
      const draws = [];
      
      for (const drawId of drawIds) {
        try {
          const draw = await getDraw(Number(drawId));
          draws.push(draw);
        } catch (err) {
          console.warn(`Failed to fetch participation draw ${drawId}:`, err);
        }
      }
      
      return draws.reverse();
    } catch (err) {
      console.error('Error fetching user participations:', err);
      throw err;
    }
  }, [contract, getDraw]);

  // Create draw
  const { config: createDrawConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: FairDrawABI,
    functionName: 'createDraw',
  });

  const { write: createDrawWrite, data: createDrawData } = useContractWrite(createDrawConfig);
  const { isLoading: isCreateDrawLoading } = useWaitForTransaction({
    hash: createDrawData?.hash,
  });

  const createDraw = useCallback(async (drawData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { name, description, endTime, winnerCount, entryFee } = drawData;
      const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);
      const entryFeeWei = parseEther(entryFee.toString());
      const platformFeeWei = parseEther('0.001'); // Platform fee

      if (!createDrawWrite) {
        throw new Error('Contract write not prepared');
      }

      await createDrawWrite({
        args: [name, description, endTimestamp, winnerCount, entryFeeWei],
        value: platformFeeWei,
      });

      return createDrawData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [createDrawWrite, createDrawData]);

  // Enter draw
  const { config: enterDrawConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: FairDrawABI,
    functionName: 'enterDraw',
  });

  const { write: enterDrawWrite, data: enterDrawData } = useContractWrite(enterDrawConfig);
  const { isLoading: isEnterDrawLoading } = useWaitForTransaction({
    hash: enterDrawData?.hash,
  });

  const enterDraw = useCallback(async (drawId, entryFee) => {
    try {
      setIsLoading(true);
      setError(null);

      const entryFeeWei = parseEther(entryFee.toString());

      if (!enterDrawWrite) {
        throw new Error('Contract write not prepared');
      }

      await enterDrawWrite({
        args: [drawId],
        value: entryFeeWei,
      });

      return enterDrawData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [enterDrawWrite, enterDrawData]);

  // End draw
  const { config: endDrawConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS,
    abi: FairDrawABI,
    functionName: 'endDraw',
  });

  const { write: endDrawWrite, data: endDrawData } = useContractWrite(endDrawConfig);
  const { isLoading: isEndDrawLoading } = useWaitForTransaction({
    hash: endDrawData?.hash,
  });

  const endDraw = useCallback(async (drawId) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!endDrawWrite) {
        throw new Error('Contract write not prepared');
      }

      await endDrawWrite({
        args: [drawId],
      });

      return endDrawData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [endDrawWrite, endDrawData]);

  // Check if draw can be ended
  const canEndDraw = useCallback(async (drawId) => {
    try {
      return await contract.read.canEndDraw([drawId]);
    } catch (err) {
      console.error('Error checking if draw can be ended:', err);
      return false;
    }
  }, [contract]);

  return {
    // Contract info
    contractAddress: CONTRACT_ADDRESS,
    totalDraws: Number(totalDraws) || 0,
    platformFee: platformFee ? formatEther(platformFee) : '0.001',
    
    // Read functions
    getDraw,
    getDraws,
    getUserDraws,
    getUserParticipations,
    canEndDraw,
    
    // Write functions
    createDraw,
    enterDraw,
    endDraw,
    
    // Loading states
    isLoading: isLoading || isCreateDrawLoading || isEnterDrawLoading || isEndDrawLoading,
    error,
    
    // Transaction data
    createDrawData,
    enterDrawData,
    endDrawData,
  };
}
