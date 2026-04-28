import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, BarChart2, HelpCircle, RefreshCcw, Lightbulb, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { WORD_LISTS, CATEGORIES, MAX_CHANCES, HARD_MODE_CHANCES, WORD_LENGTH, KEYBOARD_ROWS, type LeaderboardEntry } from './constants';
import { cn, getDailyWord } from './lib/utils';

// Types
type Status = 'correct' | 'present' | 'absent' | 'unused';
type GameState = 'playing' | 'won' | 'lost';

interface Guess {
  word: string;
  statuses: Status[];
}

export default function App() {
  // Game Configuration
  const [category, setCategory] = useState<string>('GENERAL');
  const [isDaily, setIsDaily] = useState(false);
  const [hardMode, setHardMode] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [targetWord, setTargetWord] = useState('');
  
  // Game Session State
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameState, setGameState] = useState<GameState>('playing');
  const [message, setMessage] = useState<string | null>(null);
  const [usedHint, setUsedHint] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [hasAddedToLeaderboard, setHasAddedToLeaderboard] = useState(false);
  
  // Persistence State
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('wordle-stats');
    return saved ? JSON.parse(saved) : { played: 0, wins: 0, streak: 0, maxStreak: 0, guesses: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } };
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    const saved = localStorage.getItem('wordle-leaderboard');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('wordle-stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('wordle-leaderboard', JSON.stringify(leaderboard));
  }, [leaderboard]);

  // Update Stats when game ends
  useEffect(() => {
    if (gameState === 'won') {
      setStats((prev: any) => ({
        ...prev,
        played: prev.played + 1,
        wins: prev.wins + 1,
        streak: prev.streak + 1,
        maxStreak: Math.max(prev.maxStreak, prev.streak + 1),
        guesses: {
          ...prev.guesses,
          [guesses.length]: (prev.guesses[guesses.length] || 0) + 1
        }
      }));
    } else if (gameState === 'lost') {
      setStats((prev: any) => ({
        ...prev,
        played: prev.played + 1,
        streak: 0
      }));
    }
  }, [gameState]);

  // UI State
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Initialize Word
  const initGame = useCallback((cat: string = category, daily: boolean = isDaily) => {
    const list = WORD_LISTS[cat] || WORD_LISTS.GENERAL;
    const word = daily ? getDailyWord(cat, list) : list[Math.floor(Math.random() * list.length)];
    setTargetWord(word);
    setGuesses([]);
    setCurrentGuess('');
    setGameState('playing');
    setMessage(null);
    setUsedHint(false);
    setPlayerName('');
    setHasAddedToLeaderboard(false);
  }, [category, isDaily]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Dark Mode Toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const maxAttempts = hardMode ? HARD_MODE_CHANCES : MAX_CHANCES;

  const getLetterStatus = (word: string): Status[] => {
    const statuses = Array(WORD_LENGTH).fill('absent') as Status[];
    const targetArr = targetWord.split('');
    const guessArr = word.split('');

    // First pass: Correct positions
    guessArr.forEach((letter, i) => {
      if (letter === targetArr[i]) {
        statuses[i] = 'correct';
        targetArr[i] = '#'; // Mark as used
      }
    });

    // Second pass: Present elsewhere
    guessArr.forEach((letter, i) => {
      if (statuses[i] !== 'correct') {
        const index = targetArr.indexOf(letter);
        if (index !== -1) {
          statuses[i] = 'present';
          targetArr[index] = '#';
        }
      }
    });

    return statuses;
  };

  const onKeyPress = useCallback((key: string) => {
    if (gameState !== 'playing') return;

    if (key === 'ENTER') {
      if (currentGuess.length !== WORD_LENGTH) {
        setMessage('Not enough letters');
        setTimeout(() => setMessage(null), 2000);
        return;
      }

      const statuses = getLetterStatus(currentGuess);
      const newGuesses = [...guesses, { word: currentGuess, statuses }];
      setGuesses(newGuesses);
      setCurrentGuess('');

      if (currentGuess === targetWord) {
        setGameState('won');
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
        setMessage('Splendid!');
        setTimeout(() => setShowStats(true), 1500);
      } else if (newGuesses.length >= maxAttempts) {
        setGameState('lost');
        setMessage(targetWord);
        setTimeout(() => setShowStats(true), 1500);
      }
    } else if (key === 'DELETE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < WORD_LENGTH && key.length === 1 && /^[A-Z]$/.test(key)) {
      setCurrentGuess(prev => prev + key);
    }
  }, [currentGuess, guesses, gameState, targetWord, maxAttempts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === 'BACKSPACE') onKeyPress('DELETE');
      else if (key === 'ENTER') onKeyPress('ENTER');
      else if (/^[A-Z]$/.test(key)) onKeyPress(key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKeyPress]);

  const useHint = () => {
    if (usedHint || gameState !== 'playing') return;
    
    // Find a letter the user hasn't correctly guessed yet
    const correctIndices = guesses.flatMap(g => 
      g.statuses.map((s, i) => s === 'correct' ? i : -1)
    ).filter(i => i !== -1);
    
    const availableIndices = Array.from({ length: WORD_LENGTH }).map((_, i) => i)
      .filter(i => !correctIndices.includes(i));
    
    if (availableIndices.length === 0) return;
    
    const revealIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const letter = targetWord[revealIndex];
    
    setMessage(`Hint: letter at position ${revealIndex + 1} is ${letter}`);
    setUsedHint(true);
    setTimeout(() => setMessage(null), 3000);
  };

  const addToLeaderboard = () => {
    if (!playerName.trim() || hasAddedToLeaderboard) return;
    
    const newEntry: LeaderboardEntry = {
      name: playerName.trim(),
      attempts: guesses.length,
      word: targetWord,
      category,
      date: new Date().toLocaleDateString()
    };
    
    const newLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => a.attempts - b.attempts)
      .slice(0, 10);
      
    setLeaderboard(newLeaderboard);
    setHasAddedToLeaderboard(true);
    setMessage('Score added to leaderboard!');
    setTimeout(() => setMessage(null), 2000);
  };

  // Keyboard map
  const keyStatuses: Record<string, Status> = {};
  guesses.forEach(g => {
    g.word.split('').forEach((letter, i) => {
      const status = g.statuses[i];
      if (status === 'correct' || (status === 'present' && keyStatuses[letter] !== 'correct')) {
        keyStatuses[letter] = status;
      } else if (!keyStatuses[letter]) {
        keyStatuses[letter] = 'absent';
      }
    });
  });

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#121213] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#121213]/80 backdrop-blur-md z-10">
        <div className="flex gap-2">
          <button onClick={() => setShowHelp(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <HelpCircle size={24} />
          </button>
          <button onClick={() => setCategory(prev => CATEGORIES[(CATEGORIES.indexOf(prev) + 1) % CATEGORIES.length])} className="text-xs font-bold px-2 py-1 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors hidden sm:block">
            {category}
          </button>
        </div>
        
        <h1 className="text-3xl font-bold tracking-tighter uppercase">Wordle</h1>
        
        <div className="flex gap-2">
          <button onClick={useHint} disabled={usedHint || gameState !== 'playing'} className={cn("p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors", usedHint && "opacity-20 cursor-not-allowed")}>
            <Lightbulb size={24} />
          </button>
          <button onClick={() => setShowStats(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <BarChart2 size={24} />
          </button>
          <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <Settings size={24} />
          </button>
        </div>
      </header>

      {/* Game Board */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
        <div className="grid grid-rows-6 gap-2 mb-8">
          {Array.from({ length: maxAttempts }).map((_, rowIndex) => {
            const guess = guesses[rowIndex];
            const isCurrent = rowIndex === guesses.length;
            
            return (
              <motion.div key={rowIndex} animate={message === 'Not enough letters' && isCurrent ? { x: [-5, 5, -5, 5, 0] } : {}} className="flex gap-2">
                {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
                  let letter = '';
                  let status: Status = 'unused';
                  
                  if (guess) {
                    letter = guess.word[colIndex];
                    status = guess.statuses[colIndex];
                  } else if (isCurrent) {
                    letter = currentGuess[colIndex] || '';
                  }

                  return (
                    <motion.div
                      key={colIndex}
                      initial={false}
                      animate={status !== 'unused' ? { rotateY: 180 } : letter ? { scale: [1, 1.1, 1] } : {}}
                      className={cn(
                        "w-14 h-14 sm:w-16 sm:h-16 border-2 flex items-center justify-center text-3xl font-bold rounded-sm transition-all duration-300",
                        status === 'unused' ? (letter ? "border-gray-500 dark:border-gray-400" : "border-gray-200 dark:border-gray-800") : "",
                        status === 'correct' && "bg-[#6aaa64] border-[#6aaa64] text-white",
                        status === 'present' && "bg-[#c9b458] border-[#c9b458] text-white",
                        status === 'absent' && "bg-[#787c7e] border-[#787c7e] text-white"
                      )}
                      style={{ 
                        transitionDelay: status !== 'unused' ? `${colIndex * 150}ms` : '0ms',
                        transformStyle: 'preserve-3d'
                      }}
                    >
                      <span style={{ transform: status !== 'unused' ? 'rotateY(180deg)' : 'none' }}>
                        {letter}
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>
            );
          })}
        </div>

        {/* Message Toast */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed top-24 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded font-bold shadow-xl z-50 text-sm uppercase tracking-widest"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyboard */}
        <div className="w-full max-w-lg">
          {KEYBOARD_ROWS.map((row, rowIndex) => (
            <motion.div 
              key={rowIndex} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rowIndex * 0.1 + 0.5 }}
              className="flex justify-center gap-1.5 mb-2"
            >
              {row.map(key => {
                const status = keyStatuses[key];
                const isAction = key === 'ENTER' || key === 'DELETE';
                
                return (
                  <button
                    key={key}
                    onClick={() => onKeyPress(key)}
                    className={cn(
                      "flex-1 h-14 rounded font-bold text-sm transition-all duration-200 uppercase select-none outline-none active:scale-95",
                      isAction ? "px-3 grow-[1.5]" : "",
                      !status ? "bg-gray-200 dark:bg-[#818384] hover:bg-gray-300 dark:hover:bg-gray-600" : "",
                      status === 'correct' && "bg-[#6aaa64] text-white",
                      status === 'present' && "bg-[#c9b458] text-white",
                      status === 'absent' && "bg-[#3a3a3c] text-white opacity-50"
                    )}
                  >
                    {key === 'DELETE' ? 'Del' : key}
                  </button>
                );
              })}
            </motion.div>
          ))}
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showStats && (
          <Modal title="Statistics" onClose={() => setShowStats(false)}>
            <div className="text-center">
              <div className="flex justify-around mb-8">
                <StatItem label="Played" value={stats.played} />
                <StatItem label="Win %" value={stats.played ? Math.round((stats.wins / stats.played) * 100) : 0} />
                <StatItem label="Streak" value={stats.streak} />
                <StatItem label="Max" value={stats.maxStreak} />
              </div>

              <div className="mb-8 text-left">
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3 opacity-60">Guess Distribution</h3>
                <div className="space-y-1">
                  {Array.from({ length: 6 }).map((_, i) => {
                    const count = stats.guesses[i + 1] || 0;
                    const maxCount = Math.max(...Object.values(stats.guesses) as number[], 1);
                    const width = `${Math.max((count / maxCount) * 100, 7)}%`;
                    const isCurrent = gameState === 'won' && guesses.length === i + 1;
                    
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs font-bold">
                        <div className="w-2">{i + 1}</div>
                        <div className="flex-1">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width }}
                            className={cn(
                              "h-5 flex items-center justify-end px-2 text-white transition-colors",
                              isCurrent ? "bg-[#6aaa64]" : "bg-[#787c7e]"
                            )}
                          >
                            {count}
                          </motion.div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {gameState !== 'playing' && (
                <div className="flex flex-col items-center gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <div className="text-sm font-bold uppercase tracking-widest opacity-60">
                    {gameState === 'won' ? 'The Word was' : 'Next Word in'}
                  </div>
                  <div className="text-4xl font-bold tracking-tighter text-[#6aaa64]">
                    {targetWord}
                  </div>

                  {gameState === 'won' && !hasAddedToLeaderboard && (
                    <div className="w-full mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs font-bold uppercase mb-2 opacity-60">Add to Leaderboard</p>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Your Name"
                          maxLength={10}
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                          className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded text-sm outline-none focus:border-[#6aaa64] transition-colors"
                        />
                        <button 
                          onClick={addToLeaderboard}
                          className="bg-[#6aaa64] text-white px-4 py-2 rounded font-bold text-sm hover:bg-[#5a9355] transition-colors active:scale-95"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 w-full mt-4">
                    <button 
                      onClick={() => {initGame(); setShowStats(false);}}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#6aaa64] hover:bg-[#5a9355] text-white py-3 rounded-md font-bold transition-transform active:scale-95 shadow-lg"
                    >
                      <RefreshCcw size={18} /> Play Again
                    </button>
                  </div>
                </div>
              )}

              {leaderboard.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-left">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy size={16} className="text-[#c9b458]" />
                    <h3 className="text-xs font-bold uppercase tracking-widest opacity-60">Local Leaderboard</h3>
                  </div>
                  <div className="space-y-2">
                    {leaderboard.map((entry, i) => (
                      <div key={i} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-800/50 rounded">
                        <div className="flex gap-3 items-center">
                          <span className="font-bold opacity-30 w-4">{i + 1}</span>
                          <span className="font-semibold">{entry.name}</span>
                        </div>
                        <div className="flex gap-4 items-center">
                          <span className="text-xs opacity-50">{entry.category}</span>
                          <span className="font-bold text-[#6aaa64]">{entry.attempts}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}

        {showSettings && (
          <Modal title="Settings" onClose={() => setShowSettings(false)}>
            <div className="space-y-6">
              <SettingRow 
                title="Hard Mode" 
                description={`Only ${HARD_MODE_CHANCES} attempts instead of ${MAX_CHANCES}`} 
                active={hardMode}
                onToggle={() => {
                  setHardMode(!hardMode);
                  if (guesses.length === 0) initGame(category, isDaily);
                }}
              />
              <SettingRow 
                title="Dark Theme" 
                description="Switch to a dark UI" 
                active={isDarkMode}
                onToggle={() => setIsDarkMode(!isDarkMode)}
              />
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <label className="text-sm font-bold uppercase tracking-widest block mb-3">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        setCategory(cat);
                        initGame(cat, isDaily);
                      }}
                      className={cn(
                        "py-2 px-4 rounded border text-sm font-bold transition-colors",
                        category === cat 
                          ? "bg-[#6aaa64] border-[#6aaa64] text-white" 
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <SettingRow 
                title="Daily Challenge" 
                description="Same word for everyone today" 
                active={isDaily}
                onToggle={() => {
                  setIsDaily(!isDaily);
                  initGame(category, !isDaily);
                }}
              />
            </div>
          </Modal>
        )}

        {showHelp && (
          <Modal title="How To Play" onClose={() => setShowHelp(false)}>
            <div className="space-y-4 text-sm leading-relaxed">
              <p>Guess the word in {maxAttempts} tries.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Each guess must be a valid 5-letter word.</li>
                <li>The color of the tiles will change to show how close your guess was.</li>
              </ul>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-1">
                    <div className="w-8 h-8 flex items-center justify-center bg-[#6aaa64] text-white font-bold rounded-sm">W</div>
                    <div className="w-8 h-8 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 font-bold rounded-sm">E</div>
                    <div className="w-8 h-8 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 font-bold rounded-sm">A</div>
                    <div className="w-8 h-8 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 font-bold rounded-sm">R</div>
                    <div className="w-8 h-8 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 font-bold rounded-sm">Y</div>
                  </div>
                  <p><strong>W</strong> is in the word and in the correct spot.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-1">
                    <div className="w-8 h-8 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 font-bold rounded-sm">P</div>
                    <div className="w-8 h-8 flex items-center justify-center bg-[#c9b458] text-white font-bold rounded-sm">I</div>
                    <div className="w-8 h-8 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 font-bold rounded-sm">L</div>
                    <div className="w-8 h-8 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 font-bold rounded-sm">O</div>
                    <div className="w-8 h-8 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 font-bold rounded-sm">T</div>
                  </div>
                  <p><strong>I</strong> is in the word but in the wrong spot.</p>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white dark:bg-[#121213] flex flex-col w-full max-w-sm rounded-xl shadow-2xl p-6 relative border border-gray-100 dark:border-gray-800"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <RefreshCcw className="rotate-45" size={20} />
        </button>
        <h2 className="text-xl font-bold mb-6 text-center uppercase tracking-widest">{title}</h2>
        {children}
      </motion.div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-3xl font-medium">{value}</div>
      <div className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider mt-1">{label}</div>
    </div>
  );
}

function SettingRow({ title, description, active, onToggle }: { title: string; description: string; active: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <button 
        onClick={onToggle}
        className={cn(
          "w-10 h-5 rounded-full transition-colors relative flex items-center px-1",
          active ? "bg-[#6aaa64]" : "bg-gray-300 dark:bg-gray-600"
        )}
      >
        <motion.div 
          animate={{ x: active ? 20 : 0 }}
          className="w-3 h-3 bg-white rounded-full shadow-sm"
        />
      </button>
    </div>
  );
}

