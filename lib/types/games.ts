export interface GameScreenshot {
  src: string;
  alt: string;
}

export interface RobloxGame {
  /** Stable slug — also used as the section anchor */
  id: string;
  title: string;
  tagline: string;
  genre: string;
  /** e.g. "2026/09" */
  released: string;
  icon: string;
  cover: string;
  desc: string[];
  features: string[];
  tech: string[];
  /** Roblox experience page */
  playUrl: string;
  screenshots: GameScreenshot[];
}

export interface RobloxGamesData {
  intro: string[];
  /** What changed between the two games — rendered as a learning-path list */
  learnings: string[];
  games: RobloxGame[];
}
