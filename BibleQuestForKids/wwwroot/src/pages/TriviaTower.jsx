import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Question } from '@/api/entities';
import { TriviaTowerRound } from '@/api/entities';
import { User } from '@/api/entities';
import { Home, RefreshCw, Star, Loader2, ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import _ from 'lodash';
import Confetti from '../components/Confetti';

const ClayButton = ({ children, className, ...props }) => <button className={`clay-button p-3 rounded-xl font-bold ${className}`} {...props}>{children}</button>;

const blockColors = ['bg-orange-300', 'bg-red-300', 'bg-yellow-300', 'bg-teal-300', 'bg-purple-300', 'bg-indigo-300', 'bg-pink-300'];
const AVATAR_CHARACTERS = { knight: '🛡️', wizard: '🧙‍♂️', angel: '👼', shepherd: '🧑‍🌾', scholar: '👨‍🎓', explorer: '🧑‍💼', crown: '👑', dove: '🕊️', lion: '🦁', eagle: '🦅', lamb: '🐑', fish: '🐟', star: '⭐', cross: '✝️', heart: '❤️', peace: '☮️', User: '👤' };

export default function TriviaTowerPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [gameState, setGameState] = useState('joining'); // joining, waiting, playing, results
    const [round, setRound] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);

    const findOrCreateRound = useCallback(async (currentUser) => {
        if (!currentUser) return;
        setGameState('joining');
        const roundId = `round-${Math.floor(Date.now() / 60000)}`; // New round every minute
        let availableRounds = await TriviaTowerRound.filter({ round_id: roundId, status: 'waiting' });

        let targetRound = availableRounds.find(r => r.players.length < 10);

        if (!targetRound) {
            const nextMinute = new Date(Math.ceil(Date.now() / 60000) * 60000);
            targetRound = await TriviaTowerRound.create({
                round_id: roundId,
                lobby_index: availableRounds.length,
                status: 'waiting',
                start_time: nextMinute.toISOString(),
                players: []
            });
        }
        
        // Add player if not already in
        if (!targetRound.players.some(p => p.player_id === currentUser.id)) {
            const newPlayer = { 
                player_id: currentUser.id, 
                nickname: currentUser.nickname, 
                avatar: currentUser.avatar || 'User',
                towerHeight: 0 
            };
            await TriviaTowerRound.update(targetRound.id, { players: [...targetRound.players, newPlayer] });
            setRound({ ...targetRound, players: [...targetRound.players, newPlayer] });
        } else {
            setRound(targetRound);
        }
        setGameState('waiting');
    }, []);

    useEffect(() => {
        User.me().then(u => {
            setUser(u);
            findOrCreateRound(u);
        }).catch(() => navigate(createPageUrl('Home')));
    }, [navigate, findOrCreateRound]);
    
    // Timer and state management effect
    useEffect(() => {
        if (gameState !== 'waiting' && gameState !== 'playing') return;

        const interval = setInterval(async () => {
            if (!round) return;

            const now = Date.now();
            const startTime = new Date(round.start_time).getTime();
            
            if (now >= startTime && gameState === 'waiting') {
                const allQuestions = await Question.list();
                setQuestions(_.shuffle(allQuestions));
                setGameState('playing');
            }

            if (gameState === 'playing') {
                const endTime = startTime + 45000; // 45 second round
                if (now >= endTime) {
                    setGameState('results');
                } else {
                    setTimeRemaining(Math.ceil((endTime - now) / 1000));
                }
            } else if (gameState === 'waiting') {
                setTimeRemaining(Math.ceil((startTime - now) / 1000));
            }
            
            // Poll for updates
            const updatedRound = await TriviaTowerRound.get(round.id);
            setRound(updatedRound);

        }, 1000);

        return () => clearInterval(interval);
    }, [gameState, round]);
    
    const handleAnswer = async (isCorrect) => {
        if (selectedAnswer !== null || !round || !user) return;
        
        setSelectedAnswer(isCorrect);
        let newHeight = round.players.find(p => p.player_id === user.id)?.towerHeight || 0;

        if (isCorrect) {
            newHeight++;
            const updatedPlayers = round.players.map(p => p.player_id === user.id ? { ...p, towerHeight: newHeight } : p);
            await TriviaTowerRound.update(round.id, { players: updatedPlayers });
        }

        setTimeout(() => {
            setSelectedAnswer(null);
            setCurrentQIndex(prev => (prev + 1) % questions.length);
        }, 500); // quick transition
    };

    const renderTowers = () => (
        <div className="relative flex-1 flex justify-center items-end bg-blue-100 rounded-2xl overflow-hidden p-4 mb-6">
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-green-400 rounded-t-full" />
            <div className="flex justify-around items-end w-full h-full">
                {round?.players.map(player => (
                    <div key={player.player_id} className="relative flex flex-col-reverse items-center h-full">
                         <AnimatePresence>
                            {Array.from({ length: player.towerHeight }).map((_, i) => (
                                <motion.div
                                    key={`${player.player_id}-${i}`}
                                    layout
                                    initial={{ y: -200, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className={`w-12 h-6 md:w-16 md:h-8 rounded-md border-2 border-black/20 shadow-md ${blockColors[i % blockColors.length]}`}
                                />
                            ))}
                         </AnimatePresence>
                         <div className="absolute -bottom-5 text-center">
                            <div className="text-2xl">{AVATAR_CHARACTERS[player.avatar] || '👤'}</div>
                            <div className="text-xs font-bold text-white bg-black/50 px-1 rounded">{player.nickname}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
    
    if (gameState === 'joining' || !round) {
        return <div className="flex flex-col items-center justify-center h-full"><Loader2 className="animate-spin w-12 h-12 text-orange-500" /><p className="mt-4 font-bold text-gray-600">Finding a round...</p></div>;
    }

    if (gameState === 'waiting') {
        return (
            <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Get Ready!</h1>
                <p className="text-gray-600">The next round starts in...</p>
                <p className="text-6xl font-bold my-4 text-orange-500">{timeRemaining > 0 ? timeRemaining : '...'}</p>
                <div className="clay-card p-4 w-full max-w-sm">
                    <h3 className="font-bold mb-2">Players Joined: {round.players.length}</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                        {round.players.map(p => <span key={p.player_id} className="bg-white/50 px-2 py-1 rounded font-semibold">{p.nickname}</span>)}
                    </div>
                </div>
            </div>
        );
    }
    
    if (gameState === 'results') {
        const winner = _.maxBy(round.players, 'towerHeight');
        return (
            <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                {winner?.player_id === user?.id && <Confetti />}
                <div className="clay-card p-8 max-w-md w-full">
                    <Star className="w-20 h-20 mx-auto text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Round Over!</h2>
                    <h3 className="text-xl font-bold text-gray-700 mb-4">Winner: {winner ? winner.nickname : 'Nobody!'}</h3>
                    <div className="space-y-2">
                        {_.orderBy(round.players, ['towerHeight'], ['desc']).map(p => (
                            <div key={p.player_id} className={`p-2 rounded-lg flex justify-between items-center ${p.player_id === winner.player_id ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                                <span className="font-bold">{p.nickname}</span>
                                <span className="font-bold">{p.towerHeight} blocks</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4 justify-center mt-6">
                        <ClayButton onClick={() => findOrCreateRound(user)} className="bg-orange-200">Play Again</ClayButton>
                        <ClayButton onClick={() => navigate(createPageUrl('Minigames'))}>Minigames</ClayButton>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQIndex];
    return (
        <div className="p-4 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => navigate(createPageUrl('Minigames'))} className="flex items-center gap-2 clay-button">
                    <ArrowLeft />
                </button>
                <div className="font-bold text-xl text-red-500 clay-button px-4 py-2">{timeRemaining}s</div>
            </div>
            {renderTowers()}
            {currentQuestion ? (
                <div className="clay-card p-4">
                    <p className="text-base md:text-lg font-bold text-center mb-4">{currentQuestion.question}</p>
                    <div className="grid grid-cols-2 gap-3">
                        {currentQuestion.choices.map((choice, i) => (
                             <ClayButton
                                key={i}
                                onClick={() => handleAnswer(i === currentQuestion.answer_index)}
                                disabled={selectedAnswer !== null}
                                className={selectedAnswer !== null && i === currentQuestion.answer_index ? 'bg-green-300' : 
                                           selectedAnswer !== null && selectedAnswer === false ? 'bg-red-300' : 'bg-white'}
                            >
                                {choice}
                            </ClayButton>
                        ))}
                    </div>
                </div>
            ) : <Loader2 className="animate-spin mx-auto w-8 h-8" />}
        </div>
    );
}