export type GameMode = "classic" | "timeAttack" | "endless";

export type Screen = "menu" | "modeSelect" | "loading" | "playing" | "result" | "gameOver" | "leaderboard";

export type RoundResult = {
  correct: number;
  playerAnswer: number;
  aiGuess: number;
  dog: number;
  cat: number;
  annotatedImage: string;
};

export type HighScore = {
  mode: GameMode;
  score: number;
  rounds: number;
  date: string;
  streak?: number;
};

export const GAME_MODE_CONFIG = {
  classic: {
    name: "Kinh Điển",
    description: "3 vòng đấu với AI",
    rounds: 3,
    timeLimit: 0,
    icon: "trophy",
  },
  timeAttack: {
    name: "Chạy Đua Thời Gian",
    description: "60 giây - Đếm càng nhiều càng tốt",
    rounds: Infinity,
    timeLimit: 60,
    icon: "clock",
  },
  endless: {
    name: "Vô Tận",
    description: "Chơi đến khi sai - Streak bonus",
    rounds: Infinity,
    timeLimit: 0,
    icon: "infinity",
  },
} as const;
