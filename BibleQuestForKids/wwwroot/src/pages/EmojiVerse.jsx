import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmojiVerse } from '@/api/entities';
import { MinigameScore } from '@/api/entities';
import { User } from '@/api/entities';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Star, Home, RefreshCw, Smile, Check } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import _ from 'lodash';
import Confetti from '../components/Confetti';

const ClayButton = ({ children, className, ...props }) => <button className={`clay-button px-4 py-2 rounded-xl font-bold ${className}`} {...props}>{children}</button>;

export default function EmojiVersePage() {
    const navigate = useNavigate();
    const [currentVerse, setCurrentVerse] = useState(null);
    const [userAnswers, setUserAnswers] = useState([]);
    const [time, setTime] = useState(0);
    const [score, setScore] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [correctAnswers, setCorrectAnswers] = useState(0);

    const startNewGame = async () => {
        setIsComplete(false);
        setTime(0);
        setScore(0);
        setCorrectAnswers(0);
        setGameStarted(true);

        // Create sample verses if none exist
        const allVerses = await EmojiVerse.list();
        if (allVerses.length === 0) {
            const sampleVerses = [
                {
                    verse_text: "For God so loved the world that he gave his one and only Son",
                    verse_ref: "John 3:16",
                    emoji_version: "For 🙏 so ❤️ the 🌍 that he gave his one and only 👶",
                    missing_words: ["God", "loved", "world", "Son"],
                    difficulty: "medium"
                },
                {
                    verse_text: "The Lord is my shepherd I shall not want",
                    verse_ref: "Psalm 23:1",
                    emoji_version: "The 🙏 is my 🐑 I shall not want",
                    missing_words: ["Lord", "shepherd"],
                    difficulty: "easy"
                },
                {
                    verse_text: "I can do all things through Christ who strengthens me",
                    verse_ref: "Philippians 4:13",
                    emoji_version: "I can do all things through ✝️ who 💪 me",
                    missing_words: ["Christ", "strengthens"],
                    difficulty: "medium"
                }
            ];
            
            for (const verse of sampleVerses) {
                await EmojiVerse.create(verse);
            }
        }
        
        const verses = await EmojiVerse.list();
        const selectedVerse = _.sample(verses);
        setCurrentVerse(selectedVerse);
        setUserAnswers(new Array(selectedVerse.missing_words.length).fill(''));
    };

    useEffect(() => {
        const timer = setInterval(() => {
            if (gameStarted && !isComplete) {
                setTime(prev => prev + 1);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [gameStarted, isComplete]);

    const handleAnswerChange = (index, value) => {
        const newAnswers = [...userAnswers];
        newAnswers[index] = value;
        setUserAnswers(newAnswers);
    };

    const checkAnswers = () => {
        if (!currentVerse) return;
        
        let correct = 0;
        userAnswers.forEach((answer, index) => {
            if (answer.toLowerCase().trim() === currentVerse.missing_words[index].toLowerCase()) {
                correct++;
            }
        });
        
        setCorrectAnswers(correct);
        setIsComplete(true);
        setGameStarted(false);
        
        const baseScore = correct * 50;
        const timeBonus = Math.max(0, 90 - time) * 2;
        const finalScore = baseScore + timeBonus;
        setScore(finalScore);
        
        // Save score
        User.me().then(user => {
            MinigameScore.create({
                player_id: user.id,
                game_type: 'emoji_verse',
                score: finalScore,
                completion_time: time,
                difficulty: currentVerse.difficulty || 'medium',
                coins_earned: finalScore,
                xp_earned: Math.floor(finalScore / 2)
            });
            
            User.updateMyUserData({
                coins: (user.coins || 0) + finalScore,
                xp_total: (user.xp_total || 0) + Math.floor(finalScore / 2)
            });
        }).catch(console.error);
    };

    if (!gameStarted && !isComplete) {
        return (
            <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                <button onClick={() => navigate(createPageUrl('Minigames'))} className="flex items-center gap-2 mb-8 clay-button p-3 self-start">
                    <ArrowLeft /> Back to Minigames
                </button>
                <div className="clay-card p-8 max-w-md">
                    <div className="w-24 h-24 rounded-full clay-shadow-inset bg-gradient-to-br from-yellow-200 to-yellow-400 flex items-center justify-center mx-auto mb-6">
                        <Smile className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Emoji Verse</h1>
                    <p className="text-gray-600 mb-6">Look at the emoji clues and guess the missing words from the Bible verse! 😇📖✨</p>
                    <ClayButton onClick={startNewGame} className="w-full bg-yellow-200 text-yellow-800">
                        Start Game
                    </ClayButton>
                </div>
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                {correctAnswers === currentVerse?.missing_words.length && <Confetti />}
                <div className="clay-card p-8 max-w-md">
                    <Star className="w-20 h-20 mx-auto text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Game Complete!</h2>
                    <div className="flex justify-around mb-6">
                        <div>
                            <p className="text-2xl font-bold">{correctAnswers}/{currentVerse?.missing_words.length}</p>
                            <p className="text-sm text-gray-600">Correct</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{time}s</p>
                            <p className="text-sm text-gray-600">Time</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{score}</p>
                            <p className="text-sm text-gray-600">Score</p>
                        </div>
                    </div>
                    <div className="clay-shadow-inset p-4 rounded-xl bg-yellow-50 mb-6">
                        <p className="text-sm font-bold text-yellow-800">"{currentVerse?.verse_text}"</p>
                        <p className="text-xs text-yellow-600 mt-1">- {currentVerse?.verse_ref}</p>
                    </div>
                    <div className="flex gap-4">
                        <ClayButton onClick={() => {setGameStarted(false); setIsComplete(false);}} className="bg-yellow-200">
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
                <div className="clay-button px-4 py-2">
                    <Clock className="inline mr-2 w-4 h-4" />
                    {time}s
                </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Emoji Verse</h1>
            
            <div className="clay-card p-6 mb-6 text-center">
                <p className="text-gray-600 mb-2">Verse: <span className="font-bold">{currentVerse?.verse_ref}</span></p>
                <div className="text-2xl leading-relaxed mb-4">
                    {currentVerse?.emoji_version}
                </div>
                <p className="text-sm text-gray-500">Fill in the missing words below:</p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto">
                {currentVerse?.missing_words.map((word, index) => (
                    <div key={index} className="clay-card p-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Missing word #{index + 1}:
                        </label>
                        <Input
                            type="text"
                            value={userAnswers[index]}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                            className="clay-input text-lg text-center"
                            placeholder="Type the missing word..."
                        />
                    </div>
                ))}
                
                <ClayButton 
                    onClick={checkAnswers} 
                    className="w-full bg-yellow-200 text-yellow-800 py-4"
                    disabled={userAnswers.some(answer => !answer.trim())}
                >
                    <Check className="mr-2 w-5 h-5" />
                    Check Answers
                </ClayButton>
            </div>
        </div>
    );
}