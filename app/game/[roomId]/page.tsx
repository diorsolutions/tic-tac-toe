"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Copy,
  Check,
  Crown,
  Zap,
  Star,
  Trophy,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type Player = {
  id: string;
  username: string;
  symbol: "X" | "O";
  losses: number;
  isOwner: boolean;
};

type GameState = {
  board: (string | null)[];
  currentPlayer: "X" | "O";
  winner: string | null;
  gameOver: boolean;
  players: Player[];
  roomId: string;
  matchWinner?: Player | null;
  matchOver?: boolean;
};

export default function GamePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const roomId = params.roomId as string;
  const username = searchParams.get("username") || "Anonymous";
  const isOwner = searchParams.get("owner") === "true";

  const [gameState, setGameState] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: "X",
    winner: null,
    gameOver: false,
    players: [],
    roomId,
  });

  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [celebrationAnimation, setCelebrationAnimation] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const playerIdRef = useRef<string>("");

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      // Join room
      ws.send(
        JSON.stringify({
          type: "join_room",
          roomId,
          username,
          isOwner,
        })
      );
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "player_joined":
          playerIdRef.current = data.playerId;
          setGameState((prev) => ({ ...prev, ...data.gameState }));
          break;
        case "game_state_update":
          setGameState((prev) => ({ ...prev, ...data.gameState }));
          break;
        case "move_made":
          setGameState((prev) => ({ ...prev, ...data.gameState }));
          break;
        case "game_over":
          setGameState((prev) => ({ ...prev, ...data.gameState }));
          break;
        case "game_reset":
          setGameState((prev) => ({ ...prev, ...data.gameState }));
          break;
        case "match_over":
          setGameState((prev) => ({ ...prev, ...data.gameState }));
          break;
        case "match_reset":
          setGameState((prev) => ({ ...prev, ...data.gameState }));
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // WebSocket connection closed, attempting to reconnect...
      console.log(
        "[v0] WebSocket connection closed, attempting to reconnect..."
      );
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          // Reconnect logic can be added here if needed
          console.log("[v0] Connection lost, please refresh the page");
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      // WebSocket error handling
      console.log("[v0] WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [roomId, username, isOwner]);

  useEffect(() => {
    if (gameState.winner && !gameState.matchOver) {
      setPulseAnimation(true);
      setTimeout(() => setPulseAnimation(false), 2000);
    }
    if (gameState.matchOver) {
      setCelebrationAnimation(true);
      setTimeout(() => setCelebrationAnimation(false), 3000);
    }
  }, [gameState.winner, gameState.matchOver]);

  const makeMove = (index: number) => {
    if (
      !wsRef.current ||
      gameState.board[index] ||
      gameState.gameOver ||
      gameState.matchOver
    )
      return;

    const currentPlayerData = gameState.players.find(
      (p) => p.id === playerIdRef.current
    );
    if (
      !currentPlayerData ||
      currentPlayerData.symbol !== gameState.currentPlayer
    )
      return;

    wsRef.current.send(
      JSON.stringify({
        type: "make_move",
        roomId,
        playerId: playerIdRef.current,
        position: index,
      })
    );
  };

  const resetGame = () => {
    if (!wsRef.current) return;

    wsRef.current.send(
      JSON.stringify({
        type: "reset_game",
        roomId,
      })
    );
  };

  const resetMatch = () => {
    if (!wsRef.current) return;

    wsRef.current.send(
      JSON.stringify({
        type: "reset_match",
        roomId,
      })
    );
  };

  const copyRoomLink = async () => {
    const link = `${
      window.location.origin
    }/game/${roomId}?username=${encodeURIComponent("Friend")}&owner=false`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast({
      title: "Room link copied!",
      description: "Share this link with your friend to join the game.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const getCurrentPlayerDisplay = () => {
    if (!gameState.players.find((p) => p.id === playerIdRef.current))
      return "You";
    return (
      gameState.players.find((p) => p.id === playerIdRef.current)?.username ||
      "You"
    );
  };

  const getOpponentDisplay = () => {
    if (!gameState.players.find((p) => p.id !== playerIdRef.current))
      return "Waiting...";
    return (
      gameState.players.find((p) => p.id !== playerIdRef.current)?.username ||
      "Waiting..."
    );
  };

  const currentPlayerData = gameState.players.find(
    (p) => p.id === playerIdRef.current
  );
  const opponentData = gameState.players.find(
    (p) => p.id !== playerIdRef.current
  );
  const canPlay =
    gameState.players.length === 2 &&
    !gameState.gameOver &&
    !gameState.matchOver;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400/20 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-pink-400/20 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute bottom-20 left-32 w-12 h-12 bg-blue-400/20 rounded-full animate-ping delay-2000"></div>
        <div className="absolute bottom-40 right-10 w-24 h-24 bg-green-400/20 rounded-full animate-pulse delay-500"></div>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative inline-block">
            <h1 className="text-5xl font-bold text-white mb-2 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text  animate-gradient">
              ✨ Tic Tac Tangle ✨
            </h1>
            <div className="absolute -top-2 -right-2 animate-spin-slow">
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-purple-200 text-lg font-semibold">
              Room: {roomId}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={copyRoomLink}
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 hover:scale-105 transition-all duration-200 group"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400 animate-bounce" />
              ) : (
                <Copy className="w-4 h-4 group-hover:animate-pulse" />
              )}
            </Button>
          </div>
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className={`text-sm px-4 py-1 ${
              isConnected
                ? "animate-pulse bg-green-500"
                : "animate-bounce bg-red-500"
            }`}
          >
            {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card
            className={`bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20 ${
              currentPlayerData?.symbol === gameState.currentPlayer && canPlay
                ? "ring-2 ring-yellow-400 animate-pulse"
                : ""
            }`}
          >
            <CardHeader className="text-center relative">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mb-2 relative hover:rotate-12 transition-transform duration-300 group">
                <User className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                {currentPlayerData?.isOwner && (
                  <Crown className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-bounce" />
                )}
                {currentPlayerData?.symbol === gameState.currentPlayer &&
                  canPlay && (
                    <div className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-ping"></div>
                  )}
              </div>
              <CardTitle className="text-white text-xl font-bold">
                {getCurrentPlayerDisplay()}
                {currentPlayerData?.isOwner && (
                  <Badge className="ml-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black animate-shimmer">
                    <Crown className="w-3 h-3 mr-1" />
                    Owner
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center hover:rotate-180 transition-transform duration-500 shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {currentPlayerData?.symbol || "X"}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-purple-200 mb-3 font-semibold">Losses</p>
              <div className="flex justify-center gap-2 mb-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-300 hover:scale-125 ${
                      i < (currentPlayerData?.losses || 0)
                        ? "bg-red-500 border-red-500 animate-pulse shadow-lg shadow-red-500/50"
                        : "border-white/30 hover:border-white/60"
                    }`}
                  />
                ))}
              </div>
              <div
                className={`p-3 rounded-lg ${
                  currentPlayerData?.symbol === gameState.currentPlayer &&
                  canPlay
                    ? "bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/50"
                    : "bg-white/5"
                }`}
              >
                <p
                  className={`font-bold text-lg ${
                    currentPlayerData?.symbol === gameState.currentPlayer &&
                    canPlay
                      ? "text-yellow-400 animate-pulse"
                      : canPlay
                      ? "text-purple-200"
                      : gameState.players.length < 2
                      ? "text-blue-400 animate-bounce"
                      : gameState.matchOver
                      ? "text-red-400"
                      : "text-gray-400"
                  }`}
                >
                  {currentPlayerData?.symbol === gameState.currentPlayer &&
                  canPlay
                    ? "⚡ Your Turn"
                    : canPlay
                    ? "⏳ Waiting..."
                    : gameState.players.length < 2
                    ? "🔍 Waiting for opponent..."
                    : gameState.matchOver
                    ? "🏁 Match Over"
                    : "🎮 Game Over"}
                </p>
              </div>
            </CardContent>
          </Card>

          {gameState.matchOver && gameState.matchWinner ? (
            <Card
              className={`bg-gradient-to-br from-yellow-400/20 to-purple-400/20 border-yellow-400/50 backdrop-blur-sm shadow-2xl shadow-yellow-400/30 ${
                celebrationAnimation ? "animate-bounce" : "hover:scale-105"
              } transition-all duration-500`}
            >
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="text-9xl mb-4 animate-bounce">🎉</div>
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 animate-ping">
                      <Star className="w-8 h-8 text-yellow-400" />
                    </div>
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient mb-4">
                    🏆 {gameState.matchWinner.username.replace(/'/g, "&#39;")}{" "}
                    Wins! 🏆
                  </h2>
                  <p className="text-white text-xl mb-6 animate-fade-in">
                    🎊 Congratulations! Champion of the Tournament! 🎊
                  </p>
                  <div className="relative">
                    <div className="text-8xl mb-6 animate-spin-slow">🏆</div>
                    <div className="absolute inset-0 animate-ping">
                      <Trophy className="w-full h-full text-yellow-400/30" />
                    </div>
                  </div>
                  <Button
                    onClick={resetMatch}
                    className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white text-xl px-10 py-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group"
                  >
                    <Zap className="w-5 h-5 mr-2 group-hover:animate-spin" />
                    Start New Tournament
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 hover:shadow-2xl">
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-white/5 rounded-xl">
                  {gameState.board.map((cell, index) => (
                    <button
                      key={index}
                      onClick={() => makeMove(index)}
                      onMouseEnter={() => setHoveredCell(index)}
                      onMouseLeave={() => setHoveredCell(null)}
                      disabled={
                        !canPlay ||
                        cell !== null ||
                        currentPlayerData?.symbol !== gameState.currentPlayer ||
                        gameState.matchOver
                      }
                      className={`aspect-square bg-white/20 border-2 border-white/30 rounded-xl flex items-center justify-center text-3xl font-bold text-white transition-all duration-300 relative overflow-hidden group ${
                        !cell &&
                        canPlay &&
                        currentPlayerData?.symbol === gameState.currentPlayer
                          ? "hover:bg-white/40 hover:border-yellow-400/70 hover:scale-105 hover:shadow-lg cursor-pointer"
                          : "disabled:opacity-50 disabled:cursor-not-allowed"
                      } ${
                        hoveredCell === index &&
                        !cell &&
                        canPlay &&
                        currentPlayerData?.symbol === gameState.currentPlayer
                          ? "ring-2 ring-yellow-400 animate-pulse"
                          : ""
                      }`}
                    >
                      {cell && (
                        <span
                          className={`${
                            cell === "X"
                              ? "text-red-500 drop-shadow-lg animate-scale-in"
                              : "text-blue-500 drop-shadow-lg animate-scale-in"
                          } hover:scale-110 transition-transform`}
                        >
                          {cell}
                        </span>
                      )}
                      {!cell &&
                        hoveredCell === index &&
                        canPlay &&
                        currentPlayerData?.symbol ===
                          gameState.currentPlayer && (
                          <span
                            className={`${
                              currentPlayerData.symbol === "X"
                                ? "text-red-400"
                                : "text-blue-400"
                            } opacity-50 animate-pulse text-2xl`}
                          >
                            {currentPlayerData.symbol}
                          </span>
                        )}
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  ))}
                </div>

                <div className="text-center space-y-4">
                  <div className="flex justify-center gap-6 text-lg bg-white/10 rounded-lg p-3">
                    <span className="flex items-center gap-2 hover:scale-105 transition-transform">
                      <span className="text-red-500 text-2xl animate-pulse">
                        ✕
                      </span>
                      <span className="text-white font-semibold">Player X</span>
                    </span>
                    <span className="flex items-center gap-2 hover:scale-105 transition-transform">
                      <span className="text-blue-500 text-2xl animate-pulse">
                        ○
                      </span>
                      <span className="text-white font-semibold">Player O</span>
                    </span>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      gameState.winner
                        ? "bg-gradient-to-r from-green-400/20 to-blue-400/20 border border-green-400/50"
                        : "bg-white/10"
                    }`}
                  >
                    <p
                      className={`font-bold text-xl ${
                        gameState.winner
                          ? "text-green-400 animate-bounce"
                          : "text-white"
                      } ${pulseAnimation ? "animate-pulse" : ""}`}
                    >
                      {gameState.winner ? (
                        <span className="flex items-center justify-center gap-2">
                          🎉 {gameState.winner} Wins This Round! 🎉
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Zap className="w-5 h-5 text-yellow-400 animate-spin" />
                          {gameState.currentPlayer}&apos;s Turn
                        </span>
                      )}
                    </p>
                  </div>

                  {gameState.gameOver && !gameState.matchOver && (
                    <Button
                      onClick={resetGame}
                      className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white text-lg px-8 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group"
                    >
                      <Star className="w-5 h-5 mr-2 group-hover:animate-spin" />
                      Play Next Round
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card
            className={`bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20 ${
              opponentData?.symbol === gameState.currentPlayer && canPlay
                ? "ring-2 ring-blue-400 animate-pulse"
                : ""
            }`}
          >
            <CardHeader className="text-center relative">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center mb-2 relative hover:rotate-12 transition-transform duration-300 group">
                <User className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                {opponentData?.symbol === gameState.currentPlayer &&
                  canPlay && (
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping"></div>
                  )}
              </div>
              <CardTitle className="text-white text-xl font-bold">
                {getOpponentDisplay()}
              </CardTitle>
              <div className="flex items-center justify-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center hover:rotate-180 transition-transform duration-500 shadow-lg">
                  <span className="text-white font-bold text-lg">
                    {opponentData?.symbol || "O"}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-purple-200 mb-3 font-semibold">Losses</p>
              <div className="flex justify-center gap-2 mb-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-300 hover:scale-125 ${
                      i < (opponentData?.losses || 0)
                        ? "bg-red-500 border-red-500 animate-pulse shadow-lg shadow-red-500/50"
                        : "border-white/30 hover:border-white/60"
                    }`}
                  />
                ))}
              </div>
              <div
                className={`p-3 rounded-lg ${
                  opponentData?.symbol === gameState.currentPlayer && canPlay
                    ? "bg-gradient-to-r from-blue-400/20 to-purple-400/20 border border-blue-400/50"
                    : "bg-white/5"
                }`}
              >
                <p
                  className={`font-bold text-lg ${
                    !opponentData
                      ? "text-blue-400 animate-bounce"
                      : gameState.matchOver
                      ? "text-red-400"
                      : opponentData.symbol === gameState.currentPlayer &&
                        canPlay
                      ? "text-blue-400 animate-pulse"
                      : "text-purple-200"
                  }`}
                >
                  {!opponentData ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                      Waiting for player...
                    </span>
                  ) : gameState.matchOver ? (
                    "🏁 Match Over"
                  ) : opponentData.symbol === gameState.currentPlayer &&
                    canPlay ? (
                    "⚡ Their Turn"
                  ) : (
                    "🎮 Ready to play!"
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
