
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DuelsMatch } from '@/api/entities';
import { DuelsTurn } from '@/api/entities';
import { Question } from '@/api/entities';
import { User } from '@/api/entities';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Swords, Shield, X, Check, Flame } from 'lucide-react';
import { createPageUrl } from '@/utils';

const choiceColors = [
    'from-teal-200 to-teal-400',
    'from-green-200 to-green-400',
    'from-purple-200 to-purple-400',
    'from-pink-200 to-pink-400'
];

const ClayButton = ({ children, className = '', ...props }) => (
  <button
    className={`p-4 rounded-3xl font-bold text-lg text-gray-700 clay-button transition-all duration-200 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const StreakBar = ({ streak, isMyTeam, targetStreak }) => {
    // Ensure targetStreak is a number and not zero to prevent division by zero
    const effectiveTargetStreak = typeof targetStreak === 'number' && targetStreak > 0 ? targetStreak : 8; // Default to 8 if not valid
    const progress = (streak / effectiveTargetStreak) * 100;
    const color = isMyTeam ? 'from-blue-400 to-purple-500' : 'from-red-400 to-orange-500';
    return (
        <div className="w-full h-6 bg-gray-300 rounded-full overflow-hidden clay-shadow-inset">
            <motion.div
                className={`h-full bg-gradient-to-r ${color} flex items-center justify-end pr-2`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <Flame className="w-4 h-4 text-white" />
            </motion.div>
        </div>
    );
};


export default function DuelPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [match, setMatch] = useState(null);
    const [localQuestions, setLocalQuestions] = useState([]);
    const [localQuestionIndex, setLocalQuestionIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);

    const params = new URLSearchParams(location.search);
    const matchId = params.get('matchId');
    const targetStreak = parseInt(params.get('targetStreak') || '8', 10); // Default to 8 if not provided or invalid

    const fetchMatchState = useCallback(async (currentUser) => {
        if (!matchId) return;
        try {
            const matchData = await DuelsMatch.get(matchId);
            setMatch(matchData);

            if (matchData.status === 'completed' || matchData.status === 'cancelled') {
                navigate(createPageUrl(`DuelResults?matchId=${matchId}`));
                return;
            }

            // Handle disconnects
            const now = Date.now();
            const allPlayerIds = matchData.player_ids || [];
            const opponentIds = allPlayerIds.filter(p => p !== currentUser?.id);

            for(const opponentId of opponentIds) {
                if(opponentId && matchData.last_activity_timestamps?.[opponentId] && (now - matchData.last_activity_timestamps[opponentId] > 60000)){
                    const myTeam = matchData.team_A_player_ids.includes(currentUser.id) ? 'A' : 'B';
                    await DuelsMatch.update(matchId, { status: 'completed', winner_team: myTeam });
                    break; // End loop after first detected disconnect
                }
            }

        } catch (error) {
            console.error("Error fetching match state:", error);
        }
    }, [matchId, navigate]);

    useEffect(() => {
        const setupDuel = async () => {
            setIsLoading(true);
            try {
                const currentUser = await User.me();
                setUser(currentUser);

                // Fetch a batch of questions for the local player
                const allQuestions = await Question.list();
                setLocalQuestions(allQuestions.sort(() => 0.5 - Math.random()).slice(0, 20));

                await fetchMatchState(currentUser);

                const interval = setInterval(() => fetchMatchState(currentUser), 2500);
                setIsLoading(false);
                return () => clearInterval(interval);

            } catch {
                navigate(createPageUrl('Home'));
            }
        };
        setupDuel();
    }, [matchId, navigate, fetchMatchState]);

    const handleAnswer = async (choiceIndex) => {
        if (selectedAnswer !== null || !match || !localQuestions.length || !user) return;

        const currentQuestion = localQuestions[localQuestionIndex];
        setSelectedAnswer(choiceIndex);
        const correct = choiceIndex === currentQuestion.answer_index;
        setIsCorrect(correct);

        const myTeam = match.team_A_player_ids.includes(user.id) ? 'A' : 'B';

        await DuelsTurn.create({
            match_id: match.id,
            question_id: currentQuestion.id,
            player_id: user.id,
            team: myTeam,
            answered_correctly: correct,
        });

        try {
            const latestMatch = await DuelsMatch.get(match.id);
            if (latestMatch.status !== 'in_progress') return; // Don't update if match already ended

            const streakKey = `team_${myTeam}_streak`;
            let newStreak;
            if (correct) {
                newStreak = (latestMatch[streakKey] || 0) + 1;
            } else {
                newStreak = 0;
            }

            let updatePayload = {
                last_activity_timestamps: { ...latestMatch.last_activity_timestamps, [user.id]: Date.now() },
                [streakKey]: newStreak,
            };

            if (newStreak >= targetStreak) { // Use targetStreak for win condition
                updatePayload.status = 'completed';
                updatePayload.winner_team = myTeam;
            }

            await DuelsMatch.update(match.id, updatePayload);

        } catch (error) {
            console.error("Error updating match state:", error);
        }

        setTimeout(() => {
            if (localQuestionIndex < localQuestions.length - 1) {
                setLocalQuestionIndex(prev => prev + 1);
                setSelectedAnswer(null);
                setIsCorrect(null);
            } else {
                // Out of questions, fetch more
                Question.list().then(newQs => {
                    setLocalQuestions(prev => [...prev, ...newQs.sort(() => 0.5 - Math.random()).slice(0, 20)]);
                    setLocalQuestionIndex(prev => prev + 1);
                    setSelectedAnswer(null);
                    setIsCorrect(null);
                });
            }
        }, 1500);
    };

    if (isLoading || !match || !user) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="w-16 h-16 animate-spin text-purple-500" /></div>;
    }

    const myTeamId = match.team_A_player_ids.includes(user.id) ? 'A' : 'B';
    const myStreak = match[`team_${myTeamId}_streak`];
    const opponentStreak = match[`team_${myTeamId === 'A' ? 'B' : 'A'}_streak`];
    const currentQuestion = localQuestions[localQuestionIndex];

    const getButtonClass = (index) => {
        if (selectedAnswer === null) return `bg-gradient-to-br ${choiceColors[index % 4]}`;
        if (index === currentQuestion?.answer_index) return "bg-gradient-to-br from-green-500 to-green-700 text-white font-bold";
        if (index === selectedAnswer && !isCorrect) return "bg-gradient-to-br from-red-500 to-red-700 text-white font-bold";
        return "bg-gradient-to-br from-gray-100 to-gray-200 opacity-50";
    };

    return (
        <div className="flex flex-col h-full p-4">
            <div className="space-y-4 mb-6">
                <div className="clay-card p-4 text-center">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="font-bold text-lg text-blue-600">Your Team <Shield className="inline w-5 h-5"/></h2>
                        <span className="font-bold text-xl">{myStreak} / {targetStreak}</span>
                    </div>
                    <StreakBar streak={myStreak} isMyTeam={true} targetStreak={targetStreak} />
                </div>
                 <div className="clay-card p-4 text-center">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="font-bold text-lg text-red-600">Opponent <Swords className="inline w-5 h-5"/></h2>
                         <span className="font-bold text-xl">{opponentStreak} / {targetStreak}</span>
                    </div>
                    <StreakBar streak={opponentStreak} isMyTeam={false} targetStreak={targetStreak} />
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestion?.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="flex-1 flex flex-col items-center"
                >
                    <div className="clay-card p-4 w-full max-w-2xl mb-6 text-center">
                        <p className="text-2xl md:text-3xl font-bold text-gray-800">{currentQuestion?.question}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                        {currentQuestion?.choices?.map((choice, index) => (
                            <ClayButton
                                key={index}
                                onClick={() => handleAnswer(index)}
                                disabled={selectedAnswer !== null}
                                className={getButtonClass(index)}
                            >
                                <span className="flex-1 pr-4">{choice}</span>
                                {selectedAnswer === index && (
                                    <div className="clay-shadow-inset rounded-full p-2 bg-black/10">
                                        {isCorrect ? <Check className="text-white w-6 h-6"/> : <X className="text-white w-6 h-6"/>}
                                    </div>
                                )}
                            </ClayButton>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
