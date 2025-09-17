
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MemoryVerse } from '@/api/entities';
import { MinigameScore } from '@/api/entities';
import { User } from '@/api/entities';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Star, Coins, Home, RefreshCw, Shuffle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import _ from 'lodash';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import Confetti from '../components/Confetti';

const ClayButton = ({ children, className, ...props }) => <button className={`clay-button px-4 py-2 rounded-xl font-bold ${className}`} {...props}>{children}</button>;

export default function VerseJigsawPage() {
    const navigate = useNavigate();
    const [currentVerse, setCurrentVerse] = useState(null);
    const [scrambledPieces, setScrambledPieces] = useState([]);
    const [playerOrder, setPlayerOrder] = useState([]);
    const [isComplete, setIsComplete] = useState(false);
    const [time, setTime] = useState(0);
    const [score, setScore] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);

    const startNewGame = async () => {
        setIsComplete(false);
        setTime(0);
        setScore(0);
        setGameStarted(true);

        const verses = await MemoryVerse.list();
        const selectedVerse = _.sample(verses);
        setCurrentVerse(selectedVerse);
        
        // Split verse into word pieces
        const words = selectedVerse.verse_text.split(' ');
        const pieces = words.map((word, index) => ({
            id: index,
            word: word,
            originalIndex: index
        }));
        
        const shuffled = _.shuffle(pieces);
        setScrambledPieces(shuffled);
        setPlayerOrder([...shuffled]);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            if (gameStarted && !isComplete) {
                setTime(prev => prev + 1);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [gameStarted, isComplete]);

    const checkCompletion = (newOrder) => {
        if (!currentVerse) return false;
        const correctOrder = currentVerse.verse_text.split(' ');
        const playerWords = newOrder.map(piece => piece.word);
        
        return _.isEqual(correctOrder, playerWords);
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        
        const items = Array.from(playerOrder);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        
        setPlayerOrder(items);
        
        if (checkCompletion(items)) {
            setIsComplete(true);
            setGameStarted(false);
            
            // Calculate score based on time
            const baseScore = 100;
            const timeBonus = Math.max(0, 60 - time) * 2; // Bonus for speed
            const finalScore = baseScore + timeBonus;
            setScore(finalScore);
            
            // Save score and update user
            User.me().then(user => {
                MinigameScore.create({
                    player_id: user.id,
                    game_type: 'verse_jigsaw',
                    score: finalScore,
                    completion_time: time,
                    difficulty: 'medium',
                    coins_earned: finalScore,
                    xp_earned: Math.floor(finalScore / 2)
                });
                
                User.updateMyUserData({
                    coins: (user.coins || 0) + finalScore,
                    xp_total: (user.xp_total || 0) + Math.floor(finalScore / 2)
                });
            }).catch(console.error);
        }
    };

    if (!gameStarted && !isComplete) {
        return (
            <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                <button onClick={() => navigate(createPageUrl('Minigames'))} className="flex items-center gap-2 mb-8 clay-button p-3 self-start">
                    <ArrowLeft /> Back to Minigames
                </button>
                <div className="clay-card p-8 max-w-md">
                    <div className="w-24 h-24 rounded-full clay-shadow-inset bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center mx-auto mb-6">
                        <Shuffle className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Verse Jigsaw</h1>
                    <p className="text-gray-600 mb-6">Drag and drop the word pieces to rebuild the Bible verse! The faster you complete it, the more points you earn!</p>
                    <ClayButton onClick={startNewGame} className="w-full bg-blue-200 text-blue-800">
                        Start Puzzle
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
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Puzzle Complete!</h2>
                    <div className="flex justify-around mb-6">
                        <div>
                            <p className="text-2xl font-bold">{time}s</p>
                            <p className="text-sm text-gray-600">Time</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{score}</p>
                            <p className="text-sm text-gray-600">Score</p>
                        </div>
                    </div>
                    <div className="clay-shadow-inset p-4 rounded-xl bg-blue-50 mb-6">
                        <p className="text-sm font-bold text-blue-800">"{currentVerse.verse_text}"</p>
                        <p className="text-xs text-blue-600 mt-1">- {currentVerse.verse_ref}</p>
                    </div>
                    <div className="flex gap-4">
                        <ClayButton onClick={() => {setGameStarted(false); setIsComplete(false);}} className="bg-blue-200">
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
                </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Verse Jigsaw</h1>
            
            <div className="clay-card p-6 mb-6 text-center">
                <p className="text-gray-600 mb-2">Reference: <span className="font-bold">{currentVerse?.verse_ref}</span></p>
                <p className="text-sm text-gray-500">Drag the words below to rebuild the verse!</p>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="word-pieces" direction="horizontal">
                    {(provided) => (
                        <div 
                            {...provided.droppableProps} 
                            ref={provided.innerRef}
                            className="flex flex-wrap gap-3 justify-center items-center clay-card p-4 md:p-8 min-h-[80px]"
                        >
                            {playerOrder.map((piece, index) => (
                                <Draggable key={piece.id} draggableId={piece.id.toString()} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.dragHandleProps}
                                            {...provided.draggableProps}
                                            className={`px-4 py-3 rounded-xl text-lg font-semibold clay-button bg-white transition-all ${
                                                snapshot.isDragging ? 'scale-105 shadow-2xl' : ''
                                            }`}
                                        >
                                            {piece.word}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
}
