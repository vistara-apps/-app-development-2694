// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";

/**
 * @title FairDraw
 * @dev A verifiably fair draw contract using Chainlink VRF
 */
contract FairDraw is VRFConsumerBaseV2, ConfirmedOwner {
    event DrawCreated(
        uint256 indexed drawId,
        address indexed creator,
        uint256 endTime,
        uint256 winnerCount,
        uint256 entryFee
    );
    
    event ParticipantEntered(
        uint256 indexed drawId,
        address indexed participant,
        uint256 timestamp
    );
    
    event WinnersSelected(
        uint256 indexed drawId,
        address[] winners,
        uint256 timestamp
    );
    
    event DrawEnded(uint256 indexed drawId, uint256 timestamp);

    struct Draw {
        uint256 drawId;
        address creator;
        uint256 startTime;
        uint256 endTime;
        bool isEnded;
        uint256 winnerCount;
        uint256 entryFee;
        address[] participants;
        address[] winners;
        bool winnersSelected;
        uint256 vrfRequestId;
        string name;
        string description;
    }

    struct Participation {
        uint256 drawId;
        address participant;
        uint256 timestamp;
        bool isWinner;
    }

    // Chainlink VRF Configuration
    VRFCoordinatorV2Interface COORDINATOR;
    uint64 s_subscriptionId;
    bytes32 keyHash = 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c; // Base mainnet
    uint32 callbackGasLimit = 100000;
    uint16 requestConfirmations = 3;
    uint32 numWords = 1;

    // State variables
    uint256 public drawCounter;
    uint256 public platformFee = 0.001 ether; // Platform fee for creating draws
    
    mapping(uint256 => Draw) public draws;
    mapping(uint256 => Participation[]) public drawParticipations;
    mapping(uint256 => uint256) public vrfRequestToDrawId;
    mapping(address => uint256[]) public userDraws;
    mapping(address => uint256[]) public userParticipations;

    constructor(uint64 subscriptionId, address vrfCoordinator) 
        VRFConsumerBaseV2(vrfCoordinator)
        ConfirmedOwner(msg.sender)
    {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_subscriptionId = subscriptionId;
    }

    /**
     * @dev Create a new draw
     */
    function createDraw(
        string memory name,
        string memory description,
        uint256 endTime,
        uint256 winnerCount,
        uint256 entryFee
    ) external payable returns (uint256) {
        require(msg.value >= platformFee, "Insufficient platform fee");
        require(endTime > block.timestamp, "End time must be in the future");
        require(winnerCount > 0, "Winner count must be greater than 0");
        require(bytes(name).length > 0, "Name cannot be empty");

        drawCounter++;
        uint256 drawId = drawCounter;

        draws[drawId] = Draw({
            drawId: drawId,
            creator: msg.sender,
            startTime: block.timestamp,
            endTime: endTime,
            isEnded: false,
            winnerCount: winnerCount,
            entryFee: entryFee,
            participants: new address[](0),
            winners: new address[](0),
            winnersSelected: false,
            vrfRequestId: 0,
            name: name,
            description: description
        });

        userDraws[msg.sender].push(drawId);

        emit DrawCreated(drawId, msg.sender, endTime, winnerCount, entryFee);
        
        return drawId;
    }

    /**
     * @dev Enter a draw
     */
    function enterDraw(uint256 drawId) external payable {
        Draw storage draw = draws[drawId];
        require(draw.drawId != 0, "Draw does not exist");
        require(!draw.isEnded, "Draw has ended");
        require(block.timestamp < draw.endTime, "Draw entry period has ended");
        require(msg.value >= draw.entryFee, "Insufficient entry fee");
        
        // Check if user already participated
        for (uint256 i = 0; i < draw.participants.length; i++) {
            require(draw.participants[i] != msg.sender, "Already participated");
        }

        draw.participants.push(msg.sender);
        
        Participation memory participation = Participation({
            drawId: drawId,
            participant: msg.sender,
            timestamp: block.timestamp,
            isWinner: false
        });
        
        drawParticipations[drawId].push(participation);
        userParticipations[msg.sender].push(drawId);

        emit ParticipantEntered(drawId, msg.sender, block.timestamp);
    }

    /**
     * @dev End a draw and request random numbers for winner selection
     */
    function endDraw(uint256 drawId) external {
        Draw storage draw = draws[drawId];
        require(draw.drawId != 0, "Draw does not exist");
        require(!draw.isEnded, "Draw already ended");
        require(
            block.timestamp >= draw.endTime || msg.sender == draw.creator,
            "Draw cannot be ended yet"
        );
        require(draw.participants.length > 0, "No participants");

        draw.isEnded = true;

        // Request random number from Chainlink VRF
        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        draw.vrfRequestId = requestId;
        vrfRequestToDrawId[requestId] = drawId;

        emit DrawEnded(drawId, block.timestamp);
    }

    /**
     * @dev Callback function used by VRF Coordinator
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        uint256 drawId = vrfRequestToDrawId[requestId];
        Draw storage draw = draws[drawId];
        
        require(draw.drawId != 0, "Draw does not exist");
        require(!draw.winnersSelected, "Winners already selected");

        uint256 participantCount = draw.participants.length;
        uint256 winnersToSelect = draw.winnerCount > participantCount 
            ? participantCount 
            : draw.winnerCount;

        // Use Fisher-Yates shuffle algorithm for fair selection
        address[] memory shuffledParticipants = new address[](participantCount);
        for (uint256 i = 0; i < participantCount; i++) {
            shuffledParticipants[i] = draw.participants[i];
        }

        uint256 randomSeed = randomWords[0];
        for (uint256 i = participantCount - 1; i > 0; i--) {
            uint256 j = uint256(keccak256(abi.encode(randomSeed, i))) % (i + 1);
            address temp = shuffledParticipants[i];
            shuffledParticipants[i] = shuffledParticipants[j];
            shuffledParticipants[j] = temp;
        }

        // Select winners
        for (uint256 i = 0; i < winnersToSelect; i++) {
            draw.winners.push(shuffledParticipants[i]);
            
            // Update participation records
            Participation[] storage participations = drawParticipations[drawId];
            for (uint256 j = 0; j < participations.length; j++) {
                if (participations[j].participant == shuffledParticipants[i]) {
                    participations[j].isWinner = true;
                    break;
                }
            }
        }

        draw.winnersSelected = true;

        emit WinnersSelected(drawId, draw.winners, block.timestamp);
    }

    /**
     * @dev Get draw details
     */
    function getDraw(uint256 drawId) external view returns (Draw memory) {
        return draws[drawId];
    }

    /**
     * @dev Get draw participants
     */
    function getDrawParticipants(uint256 drawId) external view returns (address[] memory) {
        return draws[drawId].participants;
    }

    /**
     * @dev Get draw winners
     */
    function getDrawWinners(uint256 drawId) external view returns (address[] memory) {
        return draws[drawId].winners;
    }

    /**
     * @dev Get user's created draws
     */
    function getUserDraws(address user) external view returns (uint256[] memory) {
        return userDraws[user];
    }

    /**
     * @dev Get user's participations
     */
    function getUserParticipations(address user) external view returns (uint256[] memory) {
        return userParticipations[user];
    }

    /**
     * @dev Get draw participations with details
     */
    function getDrawParticipations(uint256 drawId) external view returns (Participation[] memory) {
        return drawParticipations[drawId];
    }

    /**
     * @dev Withdraw platform fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Update platform fee (owner only)
     */
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        platformFee = newFee;
    }

    /**
     * @dev Get total number of draws
     */
    function getTotalDraws() external view returns (uint256) {
        return drawCounter;
    }

    /**
     * @dev Check if draw can be ended
     */
    function canEndDraw(uint256 drawId) external view returns (bool) {
        Draw memory draw = draws[drawId];
        return draw.drawId != 0 && 
               !draw.isEnded && 
               (block.timestamp >= draw.endTime || msg.sender == draw.creator) &&
               draw.participants.length > 0;
    }
}
