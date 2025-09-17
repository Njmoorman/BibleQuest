import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BibleCharacter } from '@/api/entities';
import { MinigameScore } from '@/api/entities';
import { User } from '@/api/entities';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Star, Coins, Home, RefreshCw, Users } from 'lucide-react';
import { createPageUrl } from '@/utils';
import _ from 'lodash';
import Confetti from '../components/Confetti';

const ClayButton = ({ children, className, ...props }) => <button className={`clay-button px-4 py-2 rounded-xl font-bold ${className}`} {...props}>{children}</button>;

export default function PictureMatchPage() {
    const navigate = useNavigate();
    const [characters, setCharacters] = useState([]);
    const [symbols, setSymbols] = useState([]);
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const [selectedSymbol, setSelectedSymbol] = useState(null);
    const [matches, setMatches] = useState([]);
    const [time, setTime] = useState(0);
    const [score, setScore] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);

    const startNewGame = async () => {
        setIsComplete(false);
        setTime(0);
        setScore(0);
        setMatches([]);
        setSelectedCharacter(null);
        setSelectedSymbol(null);
        setGameStarted(true);

        // Create sample characters if none exist
        const allCharacters = await BibleCharacter.list();
        if (allCharacters.length === 0) {
            // Create some default characters for the game
            const defaultCharacters = [
                { name: "David", symbol: "Sling", emoji: "🎯", description: "Defeated Goliath with a sling" },
                { name: "Noah", symbol: "Ark", emoji: "🛶", description: "Built the ark to save animals" },
                { name: "Moses", symbol: "Staff", emoji: "🐍", description: "Led Israel out of Egypt" },
                { name: "Jonah", symbol: "Whale", emoji: "🐋", description: "Swallowed by a great fish" },
                { name: "Daniel", symbol: "Lions", emoji: "🦁", description: "Survived the lions' den" },
                { name: "Abraham", symbol: "Stars", emoji: "⭐", description: "Promised descendants like stars" }
            ];
            
            for (const char of defaultCharacters) {
                await BibleCharacter.create(char);
            }
        }
        
        const gameCharacters = await BibleCharacter.list();
        const selectedChars = _.shuffle(gameCharacters).slice(0, 6);
        
        setCharacters(_.shuffle(selectedChars));
        setSymbols(_.shuffle([...selectedChars]));
    };

    useEffect(() => {
        const timer = setInterval(() => {
            if (gameStarted && !isComplete) {
                setTime(prev => prev + 1);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [gameStarted, isComplete]);

    const handleCharacterClick = (character) => {
        if (matches.some(m => m.id === character.id)) return;
        setSelectedCharacter(character);
        
        if (selectedSymbol && selectedSymbol.id === character.id) {
            // Match found!
            setMatches(prev => [...prev, character]);
            setSelectedCharacter(null);
            setSelectedSymbol(null);
            setScore(prev => prev + 100);
            
            if (matches.length + 1 === characters.length) {
                // Game complete!
                setIsComplete(true);
                setGameStarted(false);
                
                const timeBonus = Math.max(0, 120 - time) * 5;
                const finalScore = score + 100 + timeBonus;
                setScore(finalScore);
                
                // Save score
                User.me().then(user => {
                    MinigameScore.create({
                        player_id: user.id,
                        game_type: 'picture_match',
                        score: finalScore,
                        completion_time: time,
                        difficulty: 'easy',
                        coins_earned: finalScore,
                        xp_earned: Math.floor(finalScore / 3)
                    });
                    
                    User.updateMyUserData({
                        coins: (user.coins || 0) + finalScore,
                        xp_total: (user.xp_total || 0) + Math.floor(finalScore / 3)
                    });
                }).catch(console.error);
            }
        }
    };

    const handleSymbolClick = (symbol) => {
        if (matches.some(m => m.id === symbol.id)) return;
        setSelectedSymbol(symbol);
        
        if (selectedCharacter && selectedCharacter.id === symbol.id) {
            // Match found!
            setMatches(prev => [...prev, symbol]);
            setSelectedCharacter(null);
            setSelectedSymbol(null);
            setScore(prev => prev + 100);
            
            if (matches.length + 1 === characters.length) {
                // Game complete!
                setIsComplete(true);
                setGameStarted(false);
                
                const timeBonus = Math.max(0, 120 - time) * 5;
                const finalScore = score + 100 + timeBonus;
                setScore(finalScore);
            }
        }
    };

    if (!gameStarted && !isComplete) {
        return (
            <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                <button onClick={() => navigate(createPageUrl('Minigames'))} className="flex items-center gap-2 mb-8 clay-button p-3 self-start">
                    <ArrowLeft /> Back to Minigames
                </button>
                <div className="clay-card p-8 max-w-md">
                    <div className="w-24 h-24 rounded-full clay-shadow-inset bg-gradient-to-br from-green-200 to-green-400 flex items-center justify-center mx-auto mb-6">
                        <Users className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Picture Match</h1>
                    <p className="text-gray-600 mb-6">Match Bible characters with their symbols! Click on a character, then click on their matching symbol.</p>
                    <ClayButton onClick={startNewGame} className="w-full bg-green-200 text-green-800">
                        Start Matching
                    </ClayButton>
                </div>
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                <Confetti />
                <div className="clay-card p-8 max-w-md">
                    <Star className="w-20 h-20 mx-auto text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">All Matched!</h2>
                    <div className="flex justify-around mb-6">
                        <div>
                            <p className="text-2xl font-bold">{time}s</p>
                            <p className="text-sm text-gray-600">Time</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{matches.length}/{characters.length}</p>
                            <p className="text-sm text-gray-600">Matches</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{score}</p>
                            <p className="text-sm text-gray-600">Score</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <ClayButton onClick={() => {setGameStarted(false); setIsComplete(false);}} className="bg-green-200">
                            <RefreshCw className="mr-2 w-4 h-4"/> Play Again
                        </ClayButton>
                        <ClayButton onClick={() => navigate(createPageUrl('Minigames'))}>
                            <Home className="mr-2 w-4 h-4"/> Minigames
                        </ClayButton>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate(createPageUrl('Minigames'))} className="flex items-center gap-2 clay-button p-2">
                    <ArrowLeft /> Back
                </button>
                <div className="flex items-center gap-4">
                    <div className="clay-button px-4 py-2">
                        <Clock className="inline mr-2 w-4 h-4" />
                        {time}s
                    </div>
                    <div className="clay-button px-4 py-2">
                        <Star className="inline mr-2 w-4 h-4" />
                        {score}
                    </div>
                </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Picture Match</h1>
            
            <div className="clay-card p-4 mb-6 text-center">
                <p className="text-gray-600">Match {matches.length}/{characters.length} pairs • Click character → symbol</p>
            </div>

            <div className="grid grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Characters Column */}
                <div className="space-y-3">
                    <h3 className="text-xl font-bold text-center text-gray-800">Characters</h3>
                    {characters.map(character => (
                        <motion.div
                            key={character.id}
                            onClick={() => handleCharacterClick(character)}
                            className={`p-4 rounded-2xl clay-button text-center cursor-pointer transition-all ${
                                matches.some(m => m.id === character.id) 
                                    ? 'bg-green-200 opacity-50' 
                                    : selectedCharacter?.id === character.id 
                                    ? 'bg-blue-200' 
                                    : 'bg-white hover:bg-gray-50'
                            }`}
                            whileHover={{ scale: matches.some(m => m.id === character.id) ? 1 : 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="text-4xl mb-2">{character.emoji}</div>
                            <p className="font-bold text-gray-800">{character.name}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Symbols Column */}
                <div className="space-y-3">
                    <h3 className="text-xl font-bold text-center text-gray-800">Symbols</h3>
                    {symbols.map(symbol => (
                        <motion.div
                            key={symbol.id}
                            onClick={() => handleSymbolClick(symbol)}
                            className={`p-4 rounded-2xl clay-button text-center cursor-pointer transition-all ${
                                matches.some(m => m.id === symbol.id) 
                                    ? 'bg-green-200 opacity-50' 
                                    : selectedSymbol?.id === symbol.id 
                                    ? 'bg-blue-200' 
                                    : 'bg-white hover:bg-gray-50'
                            }`}
                            whileHover={{ scale: matches.some(m => m.id === symbol.id) ? 1 : 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <p className="font-bold text-gray-800 text-lg">{symbol.symbol}</p>
                            <p className="text-xs text-gray-600 mt-1">{symbol.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}