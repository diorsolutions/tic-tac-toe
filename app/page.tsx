"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus } from "lucide-react";

function HomePageContent() {
  const searchParams = useSearchParams();
  const [selectedOption, setSelectedOption] = useState<
    "create" | "join" | null
  >(null);
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    const joinRoomId = searchParams.get("join");
    if (joinRoomId) {
      setSelectedOption("join");
      setRoomId(joinRoomId.toUpperCase());
    }
  }, [searchParams]);

  const handleCreateRoom = () => {
    if (!username.trim()) return;
    // Generate random room ID
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    window.location.href = `/game/${newRoomId}?username=${encodeURIComponent(
      username
    )}&owner=true`;
  };

  const handleJoinRoom = () => {
    if (!username.trim() || !roomId.trim()) return;
    window.location.href = `/game/${roomId}?username=${encodeURIComponent(
      username
    )}&owner=false`;
  };

  if (!selectedOption) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold my-3 text-white">
              ✨ Tic Tac Toc Tec 🤪✨
            </h1>
            <p className="text-purple-200">Bo'limni tanlang..!</p>
          </div>

          <div className="space-y-4">
            <Card
              className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-colors cursor-pointer"
              onClick={() => setSelectedOption("create")}
            >
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-2">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white">
                  Yangi xona yaratish
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Yangi o'yinni boshlang va do'stlaringizni taklif qiling
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-colors cursor-pointer"
              onClick={() => setSelectedOption("join")}
            >
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mb-2">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white">
                  Mavjud xonaga kirish
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Oʻyinga qoʻshilish uchun xona kodini kiriting
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 border-white/20 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-white">
            {selectedOption === "create"
              ? "Yangi Hona yaratish"
              : "Xonaga qo'shilish"}
          </CardTitle>
          <CardDescription className="text-purple-200">
            {selectedOption === "create"
              ? "Xona yaratish uchun foydalanuvchi nomingizni kiriting"
              : "Foydalanuvchi nomingiz va xona kodingizni kiriting"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white">
              Username kriting:
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username kiriting"
              className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
            />
          </div>

          {selectedOption === "join" && (
            <div className="space-y-2">
              <Label htmlFor="roomId" className="text-white">
                Roomning Kodi
              </Label>
              <Input
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Xona kodini kiriting"
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedOption(null)}
              className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              Back
            </Button>
            <Button
              onClick={
                selectedOption === "create" ? handleCreateRoom : handleJoinRoom
              }
              disabled={
                !username.trim() ||
                (selectedOption === "join" && !roomId.trim())
              }
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {selectedOption === "create" ? "Xona yaratish" : "Xonaga kirish"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">
            ✨ Tic Tac Toc Tec 🤪✨
          </h1>
          <p className="text-purple-200">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomePageContent />
    </Suspense>
  );
}
