const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Constants for characters
const PLAYER_A_CHARACTERS = ['P1', 'P2', 'H1', 'H2', 'P3'];
const PLAYER_B_CHARACTERS = ['P1', 'P2', 'H1', 'H2', 'P3'];

// Store game state by room ID
const rooms = {};

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const roomId = urlParams.get('roomId');

    if (!roomId) {
        ws.send(JSON.stringify({ error: 'Room ID is required' }));
        ws.close();
        return;
    }

    // Create room if it doesn't exist
    if (!rooms[roomId]) {
        rooms[roomId] = {
            players: [],
            boardState: Array.from({ length: 5 }, () => Array(5).fill(null)),
            currentPlayer: 'A'
        };

        // Setup initial board state
        PLAYER_A_CHARACTERS.forEach((char, index) => {
            rooms[roomId].boardState[0][index] = `A${char}`;
        });

        PLAYER_B_CHARACTERS.forEach((char, index) => {
            rooms[roomId].boardState[4][index] = `B${char}`;
        });
    }

    const room = rooms[roomId];

    // Add player to room
    const playerId = room.players.length === 0 ? 'A' : 'B';
    room.players.push({ ws, playerId });

    // Close connection if room is full (more than 2 players)
    if (room.players.length > 2) {
        ws.send(JSON.stringify({ error: 'Room is full' }));
        ws.close();
        return;
    }

    // Send the current board state to the new player
    ws.send(JSON.stringify({
        type: 'boardState',
        boardState: room.boardState,
        currentPlayer: room.currentPlayer
    }));

    console.log(`Player ${playerId} connected to room ${roomId}`);
    
    // Handle incoming messages
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            const player = room.players.find(p => p.ws === ws);

            if (data.type === 'move') {
                if (player.playerId !== room.currentPlayer) {
                    ws.send(JSON.stringify({ error: 'Not your turn' }));
                    return;
                }

                // Validate move
                const fromCell = room.boardState[data.fromX][data.fromY];
                if (fromCell !== data.character) {
                    ws.send(JSON.stringify({ error: 'Invalid move: Character mismatch' }));
                    return;
                }

                if (!isValidMove(data.character, data.fromX, data.fromY, data.toX, data.toY, room.boardState)) {
                    ws.send(JSON.stringify({ error: 'Invalid move' }));
                    return;
                }

                // Update board state
                room.boardState[data.fromX][data.fromY] = null;
                room.boardState[data.toX][data.toY] = data.character;
                room.currentPlayer = room.currentPlayer === 'A' ? 'B' : 'A';

                // Broadcast the move to all players in the room
                room.players.forEach(p => {
                    if (p.ws.readyState === WebSocket.OPEN) {
                        p.ws.send(JSON.stringify({
                            type: 'move',
                            character: data.character,
                            fromX: data.fromX,
                            fromY: data.fromY,
                            toX: data.toX,
                            toY: data.toY,
                            boardState: room.boardState,
                            currentPlayer: room.currentPlayer,
                        }));
                    }
                });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            ws.send(JSON.stringify({ error: 'Server error' }));
        }
    });

    // Handle player disconnect
    ws.on('close', () => {
        console.log(`Player disconnected from room: ${roomId}`);
        room.players = room.players.filter(p => p.ws !== ws);

        // If the room is empty, delete it
        if (room.players.length === 0) {
            console.log(`Room ${roomId} is now empty and will be deleted.`);
            delete rooms[roomId];
        }
    });
});

// Helper function to validate moves
const isValidMove = (character, fromX, fromY, toX, toY, boardState) => {
    const deltaX = Math.abs(toX - fromX);
    const deltaY = Math.abs(toY - fromY);

    switch (character.slice(1)) {
        case 'P1':
        case 'P2':
        case 'P3':
            return (deltaX === 1 && deltaY === 0) || (deltaX === 0 && deltaY === 1);
        case 'H1':
            return (deltaX === 2 && deltaY === 0) || (deltaX === 0 && deltaY === 2);
        case 'H2':
            return deltaX === 1 && deltaY === 1;
        default:
            return false;
    }
};

// Start the server
const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
