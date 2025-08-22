const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3001 });

// Game state storage
const rooms = new Map();
const players = new Map();

class GameRoom {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = [];
    this.board = Array(9).fill(null);
    this.currentPlayer = "X";
    this.winner = null;
    this.gameOver = false;
  }

  addPlayer(playerId, username, isOwner) {
    const symbol = this.players.length === 0 ? "X" : "O";
    const player = {
      id: playerId,
      username,
      symbol,
      losses: 0,
      isOwner: isOwner || false,
    };
    this.players.push(player);
    return player;
  }

  makeMove(playerId, position) {
    const player = this.players.find((p) => p.id === playerId);
    if (
      !player ||
      player.symbol !== this.currentPlayer ||
      this.board[position] ||
      this.gameOver
    ) {
      return false;
    }

    this.board[position] = this.currentPlayer;

    // Check for winner
    const winner = this.checkWinner();
    if (winner) {
      this.winner = winner;
      this.gameOver = true;

      // Increment losses for the losing player
      const losingPlayer = this.players.find((p) => p.symbol !== winner);
      if (losingPlayer) {
        losingPlayer.losses++;

        if (losingPlayer.losses >= 3) {
          const matchWinner = this.players.find((p) => p.symbol === winner);
          return { type: "match_over", winner: matchWinner };
        }
      }
    } else if (this.board.every((cell) => cell !== null)) {
      // Draw
      this.gameOver = true;
    } else {
      // Switch turns
      this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
    }

    return true;
  }

  checkWinner() {
    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // columns
      [0, 4, 8],
      [2, 4, 6], // diagonals
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (
        this.board[a] &&
        this.board[a] === this.board[b] &&
        this.board[a] === this.board[c]
      ) {
        return this.board[a];
      }
    }

    return null;
  }

  reset() {
    this.board = Array(9).fill(null);
    this.currentPlayer = "X";
    this.winner = null;
    this.gameOver = false;
  }

  getGameState() {
    const matchWinner = this.players.find((p) => {
      const opponent = this.players.find((opp) => opp.id !== p.id);
      return opponent && opponent.losses >= 3;
    });

    return {
      board: this.board,
      currentPlayer: this.currentPlayer,
      winner: this.winner,
      gameOver: this.gameOver,
      players: this.players,
      roomId: this.roomId,
      matchWinner: matchWinner || null,
      matchOver: !!matchWinner,
    };
  }
}

function generatePlayerId() {
  return Math.random().toString(36).substring(2, 15);
}

function broadcastToRoom(roomId, message) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.players.forEach((player) => {
    const ws = players.get(player.id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

wss.on("connection", (ws) => {
  console.log("New WebSocket connection");

  let playerId = null;
  let currentRoomId = null;

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case "join_room":
          playerId = generatePlayerId();
          currentRoomId = data.roomId;

          // Create room if it doesn't exist
          if (!rooms.has(currentRoomId)) {
            rooms.set(currentRoomId, new GameRoom(currentRoomId));
          }

          const room = rooms.get(currentRoomId);

          // Check if room is full
          if (room.players.length >= 2) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Room is full",
              })
            );
            return;
          }

          // Add player to room
          const player = room.addPlayer(playerId, data.username, data.isOwner);
          players.set(playerId, ws);

          // Send player joined confirmation
          ws.send(
            JSON.stringify({
              type: "player_joined",
              playerId,
              gameState: room.getGameState(),
            })
          );

          // Broadcast to all players in room
          broadcastToRoom(currentRoomId, {
            type: "game_state_update",
            gameState: room.getGameState(),
          });

          console.log(`Player ${data.username} joined room ${currentRoomId}`);
          break;

        case "make_move":
          if (!currentRoomId || !playerId) return;

          const gameRoom = rooms.get(currentRoomId);
          if (!gameRoom) return;

          const moveResult = gameRoom.makeMove(playerId, data.position);
          if (moveResult) {
            if (moveResult.type === "match_over") {
              broadcastToRoom(currentRoomId, {
                type: "match_over",
                gameState: gameRoom.getGameState(),
                matchWinner: moveResult.winner,
              });
            } else {
              broadcastToRoom(currentRoomId, {
                type: "move_made",
                gameState: gameRoom.getGameState(),
              });

              if (gameRoom.gameOver) {
                broadcastToRoom(currentRoomId, {
                  type: "game_over",
                  gameState: gameRoom.getGameState(),
                });
              }
            }
          }
          break;

        case "reset_game":
          if (!currentRoomId) return;

          const roomToReset = rooms.get(currentRoomId);
          if (!roomToReset) return;

          roomToReset.reset();
          broadcastToRoom(currentRoomId, {
            type: "game_reset",
            gameState: roomToReset.getGameState(),
          });
          break;

        case "reset_match":
          if (!currentRoomId) return;

          const roomToResetMatch = rooms.get(currentRoomId);
          if (!roomToResetMatch) return;

          roomToResetMatch.reset();
          // Reset all player losses
          roomToResetMatch.players.forEach((player) => {
            player.losses = 0;
          });

          broadcastToRoom(currentRoomId, {
            type: "match_reset",
            gameState: roomToResetMatch.getGameState(),
          });
          break;
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed");

    if (playerId) {
      players.delete(playerId);

      // Remove player from room
      if (currentRoomId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          room.players = room.players.filter((p) => p.id !== playerId);

          // If room is empty, delete it
          if (room.players.length === 0) {
            rooms.delete(currentRoomId);
          } else {
            // Broadcast updated game state
            broadcastToRoom(currentRoomId, {
              type: "game_state_update",
              gameState: room.getGameState(),
            });
          }
        }
      }
    }
  });
});

console.log("WebSocket server running on port 3001");
