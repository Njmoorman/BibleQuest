import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WordleWord } from '@/api/entities';
import { Home, RefreshCw } from 'lucide-react';
import { createPageUrl } from '@/utils';
import _ from 'lodash';
import Confetti from '../components/Confetti';

const ClayButton = ({ children, className, ...props }) => <button className={`clay-button px-4 py-2 rounded-xl font-bold ${className}`} {...props}>{children}</button>;

const ROWS = 6;
const COLS = 5;

// Common 5-letter words for validation (subset for performance)
const VALID_WORDS = new Set([
    "ABOUT", "ABOVE", "ABUSE", "ACTOR", "ACUTE", "ADMIT", "ADOPT", "ADULT", "AFTER", "AGAIN",
    "AGENT", "AGREE", "AHEAD", "ALARM", "ALBUM", "ALERT", "ALIEN", "ALIGN", "ALIKE", "ALIVE",
    "ALLOW", "ALONE", "ALONG", "ALTER", "ANGEL", "ANGER", "ANGLE", "ANGRY", "APART", "APPLE",
    "APPLY", "ARENA", "ARGUE", "ARISE", "ARRAY", "ARROW", "ASIDE", "ASSET", "AVOID", "AWAKE",
    "AWARD", "AWARE", "BADLY", "BASIC", "BEACH", "BEGAN", "BEGIN", "BEING", "BELOW", "BENCH",
    "BILLY", "BIRTH", "BLACK", "BLAME", "BLANK", "BLAST", "BLIND", "BLOCK", "BLOOD", "BOARD",
    "BOAST", "BOBBY", "BOOST", "BOOTH", "BOUND", "BRAIN", "BRAND", "BRASS", "BRAVE", "BREAD",
    "BREAK", "BREED", "BRIEF", "BRING", "BROAD", "BROKE", "BROWN", "BUILD", "BUILT", "BUYER",
    "CABLE", "CALIF", "CARRY", "CATCH", "CAUSE", "CHAIN", "CHAIR", "CHAOS", "CHARM", "CHART",
    "CHASE", "CHEAP", "CHECK", "CHEST", "CHILD", "CHINA", "CHOSE", "CIVIL", "CLAIM", "CLASS",
    "CLEAN", "CLEAR", "CLICK", "CLIMB", "CLOCK", "CLOSE", "CLOUD", "COACH", "COAST", "COULD",
    "COUNT", "COURT", "COVER", "CRAFT", "CRASH", "CRAZY", "CREAM", "CRIME", "CROSS", "CROWD",
    "CROWN", "CRUDE", "CURVE", "CYCLE", "DAILY", "DANCE", "DATED", "DEALT", "DEATH", "DEBUT",
    "DELAY", "DEPTH", "DOING", "DOUBT", "DOZEN", "DRAFT", "DRAMA", "DRANK", "DREAM", "DRESS",
    "DRILL", "DRINK", "DRIVE", "DROVE", "DYING", "EAGER", "EARLY", "EARTH", "EIGHT", "ELITE",
    "EMPTY", "ENEMY", "ENJOY", "ENTER", "ENTRY", "EQUAL", "ERROR", "EVENT", "EVERY", "EXACT",
    "EXIST", "EXTRA", "FAITH", "FALSE", "FAULT", "FIBER", "FIELD", "FIFTH", "FIFTY", "FIGHT",
    "FINAL", "FIRST", "FIXED", "FLASH", "FLEET", "FLOOR", "FLUID", "FOCUS", "FORCE", "FORTH",
    "FORTY", "FORUM", "FOUND", "FRAME", "FRANK", "FRAUD", "FRESH", "FRONT", "FRUIT", "FULLY",
    "FUNNY", "GIANT", "GIVEN", "GLASS", "GLOBE", "GOING", "GRACE", "GRADE", "GRAND", "GRANT",
    "GRASS", "GRAVE", "GREAT", "GREEN", "GROSS", "GROUP", "GROWN", "GUARD", "GUESS", "GUEST",
    "GUIDE", "HAPPY", "HARRY", "HEART", "HEAVY", "HENRY", "HORSE", "HOTEL", "HOUSE", "HUMAN",
    "HURRY", "IMAGE", "INDEX", "INNER", "INPUT", "ISSUE", "JAPAN", "JIMMY", "JOINT", "JONES",
    "JUDGE", "KNOWN", "LABEL", "LARGE", "LASER", "LATER", "LAUGH", "LAYER", "LEARN", "LEASE",
    "LEAST", "LEAVE", "LEGAL", "LEVEL", "LEWIS", "LIGHT", "LIMIT", "LINKS", "LIVES", "LOCAL",
    "LOOSE", "LOWER", "LUCKY", "LUNCH", "LYING", "MAGIC", "MAJOR", "MAKER", "MARCH", "MARIA",
    "MATCH", "MAYBE", "MAYOR", "MEANT", "MEDIA", "METAL", "MIGHT", "MINOR", "MINUS", "MIXED",
    "MODEL", "MONEY", "MONTH", "MORAL", "MOTOR", "MOUNT", "MOUSE", "MOUTH", "MOVED", "MOVIE",
    "MUSIC", "NEEDS", "NEVER", "NEWLY", "NIGHT", "NOISE", "NORTH", "NOTED", "NOVEL", "NURSE",
    "OCCUR", "OCEAN", "OFFER", "OFTEN", "ORDER", "OTHER", "OUGHT", "PAINT", "PANEL", "PAPER",
    "PARTY", "PEACE", "PETER", "PHASE", "PHONE", "PHOTO", "PIANO", "PIECE", "PILOT", "PITCH",
    "PLACE", "PLAIN", "PLANE", "PLANT", "PLATE", "POINT", "POUND", "POWER", "PRESS", "PRICE",
    "PRIDE", "PRIME", "PRINT", "PRIOR", "PRIZE", "PROOF", "PROUD", "PROVE", "QUEEN", "QUICK",
    "QUIET", "QUITE", "RADIO", "RAISE", "RANGE", "RAPID", "RATIO", "REACH", "READY", "REALM",
    "REBEL", "REFER", "RELAX", "RELAY", "REPLY", "RIGHT", "RIGID", "RIVAL", "RIVER", "ROBIN",
    "ROGER", "ROMAN", "ROUGH", "ROUND", "ROUTE", "ROYAL", "RURAL", "SCALE", "SCENE", "SCOPE",
    "SCORE", "SENSE", "SERVE", "SEVEN", "SHALL", "SHAPE", "SHARE", "SHARP", "SHEET", "SHELF",
    "SHELL", "SHIFT", "SHIRT", "SHOCK", "SHOOT", "SHORT", "SHOWN", "SIDES", "SIGHT", "SIMON",
    "SINCE", "SIXTH", "SIXTY", "SIZED", "SKILL", "SLEEP", "SLIDE", "SMALL", "SMART", "SMILE",
    "SMITH", "SMOKE", "SNAKE", "SNOW", "SOLID", "SOLVE", "SORRY", "SOUND", "SOUTH", "SPACE",
    "SPARE", "SPEAK", "SPEED", "SPEND", "SPENT", "SPLIT", "SPOKE", "SPORT", "STAFF", "STAGE",
    "STAKE", "STAND", "START", "STATE", "STAYS", "STEAM", "STEEL", "STEEP", "STEER", "STEVE",
    "STICK", "STILL", "STOCK", "STONE", "STOOD", "STORE", "STORM", "STORY", "STRIP", "STUCK",
    "STUDY", "STUFF", "STYLE", "SUGAR", "SUITE", "SUPER", "SWEET", "TABLE", "TAKEN", "TASTE",
    "TAXES", "TEACH", "TELLS", "TERRY", "TEXAS", "THANK", "THEFT", "THEIR", "THEME", "THERE",
    "THESE", "THICK", "THING", "THINK", "THIRD", "THOSE", "THREE", "THREW", "THROW", "THUMB",
    "TIGER", "TIGHT", "TIMES", "TIRED", "TITLE", "TODAY", "TOKEN", "TOTAL", "TOUCH", "TOUGH",
    "TOWER", "TRACK", "TRADE", "TRAIN", "TREAT", "TREND", "TRIAL", "TRIBE", "TRICK", "TRIED",
    "TRIES", "TRUCK", "TRULY", "TRUNK", "TRUST", "TRUTH", "TWICE", "TWIST", "TYLER", "TYPES",
    "UNCLE", "UNDER", "UNDUE", "UNION", "UNITY", "UNTIL", "UPPER", "UPSET", "URBAN", "USAGE",
    "USUAL", "VALID", "VALUE", "VIDEO", "VIRUS", "VISIT", "VITAL", "VOCAL", "VOICE", "WASTE",
    "WATCH", "WATER", "WAVES", "WAYS", "WEIRD", "WELSH", "WHEEL", "WHERE", "WHICH", "WHILE",
    "WHITE", "WHOLE", "WHOSE", "WIDOW", "WIDTH", "WOMAN", "WOMEN", "WORLD", "WORRY", "WORSE",
    "WORST", "WORTH", "WOULD", "WRITE", "WRONG", "WROTE", "YIELD", "YOUNG", "YOURS", "YOUTH",
    // Biblical words
    "FAITH", "GRACE", "PEACE", "LIGHT", "TRUTH", "ANGEL", "CROSS", "GLORY", "MERCY", "DAVID",
    "MOSES", "JESUS", "PETER", "JAMES", "CROWN", "ALTAR", "PEACE", "BREAD", "SWORD", "SHEEP"
]);

const Keyboard = ({ onKeyPress, letterStatuses, isValidWord, currentGuess }) => {
    const keys = [
        "QWERTYUIOP".split(''),
        "ASDFGHJKL".split(''),
        ["Enter", ..."ZXCVBNM".split(''), "Backspace"]
    ];

    return (
        <div className="space-y-2 mt-8">
            {keys.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-1">
                    {row.map(key => {
                        const statusClass = letterStatuses[key] || 'bg-gray-200';
                        const isEnterDisabled = key === 'Enter' && (!isValidWord || currentGuess.length !== COLS);
                        return (
                            <button
                                key={key}
                                onClick={() => onKeyPress(key)}
                                disabled={isEnterDisabled}
                                className={`h-12 rounded-lg font-bold uppercase transition-all flex items-center justify-center
                                ${key.length > 1 ? 'px-4 text-xs' : 'w-8 md:w-10'} 
                                ${isEnterDisabled ? 'bg-gray-300 text-gray-500' : statusClass}`}
                            >
                                {key === 'Backspace' ? '⌫' : key}
                            </button>
                        );
                    })}
                </div>
            ))}
            {!isValidWord && currentGuess.length === COLS && (
                <p className="text-red-500 text-sm text-center mt-2">Not a valid word!</p>
            )}
        </div>
    );
};

export default function WiseWordlePage() {
    const navigate = useNavigate();
    const [solution, setSolution] = useState('');
    const [guesses, setGuesses] = useState(Array(ROWS).fill(''));
    const [currentRow, setCurrentRow] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [letterStatuses, setLetterStatuses] = useState({});

    const startNewGame = async () => {
        let words = await WordleWord.list();
        // Filter for exactly 5-letter words
        words = words.filter(w => w.word && w.word.length === 5);

        if (words.length === 0) {
            // Seed with some words if empty
            const seedWords = ["MOSES", "DAVID", "JESUS", "ANGEL", "GRACE", "FAITH", "GOSPEL", "PRAYER", "LIGHT", "CROSS"];
            for (const word of seedWords) { await WordleWord.create({ word }); }
            const newWords = await WordleWord.list();
            setSolution(_.sample(newWords.filter(w => w.word && w.word.length === 5)).word.toUpperCase());
        } else {
            setSolution(_.sample(words).word.toUpperCase());
        }
        
        setGuesses(Array(ROWS).fill(''));
        setCurrentRow(0);
        setIsGameOver(false);
        setLetterStatuses({});
    };

    useEffect(() => {
        startNewGame();
    }, []);

    const currentGuess = guesses[currentRow] || '';
    const isValidWord = currentGuess.length === COLS ? VALID_WORDS.has(currentGuess) : true;

    const handleKeyPress = (key) => {
        if (isGameOver) return;

        if (key === 'Enter') {
            if (guesses[currentRow].length === COLS && isValidWord) {
                // Submit guess
                const newGuesses = [...guesses];
                const guess = newGuesses[currentRow];
                
                // Update letter statuses
                const newStatuses = { ...letterStatuses };
                for (let i = 0; i < guess.length; i++) {
                    if (solution[i] === guess[i]) {
                        newStatuses[guess[i]] = 'bg-green-400';
                    } else if (solution.includes(guess[i])) {
                        if (newStatuses[guess[i]] !== 'bg-green-400') {
                            newStatuses[guess[i]] = 'bg-yellow-400';
                        }
                    } else {
                        newStatuses[guess[i]] = 'bg-gray-500 text-white';
                    }
                }
                setLetterStatuses(newStatuses);

                if (guess === solution || currentRow === ROWS - 1) {
                    setIsGameOver(true);
                }
                setCurrentRow(prev => prev + 1);
            }
        } else if (key === 'Backspace') {
            const newGuesses = [...guesses];
            newGuesses[currentRow] = newGuesses[currentRow].slice(0, -1);
            setGuesses(newGuesses);
        } else if (guesses[currentRow].length < COLS && /^[A-Z]$/.test(key)) {
            const newGuesses = [...guesses];
            newGuesses[currentRow] += key;
            setGuesses(newGuesses);
        }
    };
    
    const hasWon = guesses.includes(solution);

    return (
        <div className="p-4 text-center">
            {isGameOver && hasWon && <Confetti />}
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Wise Wordle</h1>
            
            <div className="grid gap-2 max-w-sm mx-auto mb-8" style={{ gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>
                {guesses.map((guess, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-5 gap-2">
                        {Array.from({ length: COLS }).map((_, colIndex) => {
                            const letter = guess[colIndex];
                            let tileClass = 'border-gray-300';
                            if (rowIndex < currentRow) {
                                if (solution[colIndex] === letter) tileClass = 'bg-green-400 text-white border-green-400';
                                else if (solution.includes(letter)) tileClass = 'bg-yellow-400 text-white border-yellow-400';
                                else tileClass = 'bg-gray-500 text-white border-gray-500';
                            }
                            return (
                                <div key={colIndex} className={`w-12 h-12 md:w-14 md:h-14 border-2 rounded-lg flex items-center justify-center text-2xl font-bold uppercase ${tileClass}`}>
                                    {letter}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {isGameOver ? (
                <div className="clay-card p-6">
                    <h2 className="text-2xl font-bold mb-2">{hasWon ? "You got it!" : "Nice try!"}</h2>
                    <p className="text-lg mb-4">The word was: <span className="font-bold text-green-600">{solution}</span></p>
                    <ClayButton onClick={startNewGame} className="bg-indigo-200">Play Again</ClayButton>
                </div>
            ) : (
                <Keyboard onKeyPress={handleKeyPress} letterStatuses={letterStatuses} isValidWord={isValidWord} currentGuess={currentGuess} />
            )}
        </div>
    );
}