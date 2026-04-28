// Word lists for various categories
export const WORD_LISTS: Record<string, string[]> = {
  GENERAL: [
    "APPLE", "BEACH", "CHASE", "DREAM", "EAGLE", "FLAME", "GRAPE", "HOUSE", "IMAGE", "JOKER",
    "KNIFE", "LEMON", "MAGIC", "NIGHT", "OCEAN", "PARTY", "QUEEN", "RIVER", "SNAKE", "TABLE",
    "UNCLE", "VOICE", "WATER", "YOUNG", "ZEBRA", "BREAD", "CLOUD", "DANCE", "EARTH", "FRUIT",
    "GLASS", "HEART", "LIGHT", "MUSIC", "PIANO", "SMILE", "TRAIN", "WORLD", "SPACE", "STORM",
    "GHOST", "SHARK", "PHONE", "PLANE", "CLOCK", "POWER", "CANDY", "BRAIN", "SOUTH", "NORTH"
  ],
  MOVIES: [
    "SHREK", "JOKER", "MULAN", "ROCKY", "UPPED", "ALIEN", "SEVEN", "SPEED", "FARGO", "TWIST",
    "GHOST", "SCRUB", "DREDD", "BONDS", "FORCE", "TITAN", "AVATAR", "GLORY", "PLATO", "SAWVI",
    "HULKS", "THORS", "BATTY", "CAPES", "SHINE", "THING", "SIGNS", "DRIVE", "BRAVE", "CLONE"
  ],
  SPORTS: [
    "SCOOP", "PITCH", "COURT", "TRACK", "FIELD", "SURFS", "GOALS", "POINT", "FOULS", "MATCH",
    "DRIVE", "SWING", "KNOCK", "PUNCH", "SPORT", "RIDER", "COACH", "SQUAD", "REEDS", "CLUBS",
    "GAMES", "JUMPS", "BATHS", "RUNNS", "RACES", "SCORED", "WIFES", "KICKS", "PLAYS", "HEATS"
  ],
  TECH: [
    "APPLE", "INTEL", "ADOBE", "NODES", "PIXEL", "CYBER", "ROBOT", "CLOUD", "LOGIC", "QUERY",
    "CACHE", "CLICK", "STACK", "QUEUE", "BUILD", "DEBUG", "FRAME", "LINUX", "MOUSE", "SHIFT",
    "TOUCH", "ARRAY", "PROXY", "WEAVE", "PATCH", "ENTRY", "MICRO", "SERVO", "SCOPE", "PROTO"
  ]
};

export const CATEGORIES = Object.keys(WORD_LISTS);

export const MAX_CHANCES = 6;
export const HARD_MODE_CHANCES = 4;
export const WORD_LENGTH = 5;

export interface LeaderboardEntry {
  name: string;
  attempts: number;
  word: string;
  category: string;
  date: string;
}

export const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "DELETE"],
];
