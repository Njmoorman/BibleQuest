import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Question } from '@/api/entities';
import { Badge } from '@/api/entities';
import { User } from '@/api/entities';
import { GameSettings } from '@/api/entities';
import { ArrowLeft, Clock, Star, Coins } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { AnimatePresence, motion } from 'framer-motion';
import _ from 'lodash';
import Confetti from '../components/Confetti';
import FeedbackCard from '../components/FeedbackCard';

const ClayButton = ({ children, className, ...props }) => <button className={`clay-button px-4 py-2 rounded-xl font-bold ${className}`} {...props}>{children}</button>;

const ProgressBar = ({ value, theme }) => {
    const themeColors = {
        fire: 'clay-progress-fill bg-gradient-to-r from-red-400 to-orange-400',
        water: 'clay-progress-fill bg-gradient-to-r from-blue-400 to-cyan-400',
        earth: 'clay-progress-fill bg-gradient-to-r from-green-400 to-emerald-400',
        light: 'clay-progress-fill bg-gradient-to-r from-yellow-400 to-amber-400'
    };
    return (
        <div className="w-full clay-progress rounded-full h-4 flex-1">
            <div className={`h-full rounded-full transition-all duration-300 ${themeColors[theme] || themeColors.light}`} style={{ width: `${value}%` }} />
        </div>
    );
};

export default function QuizPage() {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [usedQuestionIds, setUsedQuestionIds] = useState(new Set());
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showResults, setShowResults] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackData, setFeedbackData] = useState({});
    const [timer, setTimer] = useState(60);
    const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState([]);
    const [isPackComplete, setIsPackComplete] = useState(false);
    const [gameSettings, setGameSettings] = useState({
        show_correct_answer: true,
        auto_advance: true,
        feedback_duration: 2.0,
        sound_enabled: true,
        haptic_enabled: true
    });

    const urlParams = new URLSearchParams(window.location.search);
    const quizMode = urlParams.get('mode') || 'commandments';
    const bookFilter = urlParams.get('book');
    const theme = urlParams.get('theme') || 'light';

    // Load user settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const user = await User.me();
                const settings = await GameSettings.filter({ user_id: user.id });
                if (settings.length > 0) {
                    setGameSettings(prevSettings => ({ ...prevSettings, ...settings[0] }));
                }
            } catch (error) {
                console.log('Using default settings');
            }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        const loadQuestions = async () => {
            setIsLoading(true);
            let loadedQuestions = [];

            try {
                if (quizMode === 'daily') {
                    loadedQuestions = await Question.list();
                } else if (quizMode === 'speed') {
                    loadedQuestions = await Question.list();
                } else if (quizMode === 'books' && bookFilter) {
                    loadedQuestions = await Question.filter({ book: bookFilter });
                } else if (quizMode === 'commandments') {
                    loadedQuestions = await Question.filter({ mode: 'commandments' });
                }

                // Filter to only multiple choice questions and exclude already used questions
                loadedQuestions = loadedQuestions.filter(q => 
                    q.question_type === 'mcq' && 
                    q.choices && 
                    q.choices.length > 0 &&
                    !usedQuestionIds.has(q.id)
                );

                // Check if we have any questions left
                if (loadedQuestions.length === 0) {
                    setIsPackComplete(true);
                    setShowResults(true);
                    setIsLoading(false);
                    return;
                }

                // Determine how many questions to use for this round
                let questionsToUse;
                if (quizMode === 'daily') {
                    questionsToUse = Math.min(10, loadedQuestions.length);
                } else if (quizMode === 'speed') {
                    questionsToUse = Math.min(20, loadedQuestions.length);
                } else {
                    questionsToUse = Math.min(10, loadedQuestions.length);
                }

                const selectedQuestions = _.shuffle(loadedQuestions).slice(0, questionsToUse);
                setQuestions(selectedQuestions);

                // Add these question IDs to the used set
                const newUsedIds = new Set(usedQuestionIds);
                selectedQuestions.forEach(q => newUsedIds.add(q.id));
                setUsedQuestionIds(newUsedIds);

            } catch (error) {
                console.error("Error loading questions:", error);
                setQuestions([]);
            }
            setIsLoading(false);
        };

        loadQuestions();
    }, [quizMode, bookFilter, usedQuestionIds]);

    useEffect(() => {
        if (quizMode === 'speed' && !showResults && !showFeedback && timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        } else if (timer === 0 && quizMode === 'speed') {
            setShowResults(true);
        }
    }, [timer, quizMode, showResults, showFeedback]);

    const logAnalytics = (eventType, data) => {
        // Analytics logging would go here
        console.log(`Analytics: ${eventType}`, {
            mode: quizMode,
            book: bookFilter,
            timestamp: new Date().toISOString(),
            ...data
        });
    };

    const handleAnswer = async (answerIndex) => {
        if (selectedAnswer !== null) return;
        
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = answerIndex === currentQuestion.answer_index;
        const userAnswer = currentQuestion.choices[answerIndex];
        const correctAnswer = currentQuestion.choices[currentQuestion.answer_index];
        
        setSelectedAnswer(answerIndex);

        // Log analytics
        logAnalytics('answer_submitted', {
            question_id: currentQuestion.id,
            difficulty: currentQuestion.difficulty,
            correct: isCorrect,
            user_answer: userAnswer,
            correct_answer: correctAnswer
        });

        // Update score and streak
        if (isCorrect) {
            setScore(prev => prev + 10);
            setStreak(prev => prev + 1);
        } else {
            setStreak(0);
        }

        // Prepare feedback data
        const feedback = {
            isCorrect,
            question: currentQuestion.question,
            userAnswer,
            correctAnswer,
            explanation: currentQuestion.explanation || (currentQuestion.scripture_ref ? `See ${currentQuestion.scripture_ref}` : ''),
            scriptureRef: currentQuestion.scripture_ref
        };

        setFeedbackData(feedback);
        setShowFeedback(true);
    };

    const handleFeedbackNext = () => {
        setShowFeedback(false);
        
        logAnalytics('next_question', {
            question_index: currentQuestionIndex,
            feedback_shown: true
        });

        setTimeout(() => {
            if (currentQuestionIndex + 1 >= questions.length || (quizMode === 'speed' && timer <= 0)) {
                finishQuiz();
            } else {
                setCurrentQuestionIndex(prev => prev + 1);
                setSelectedAnswer(null);
            }
        }, 100);
    };

    const finishQuiz = async () => {
        setShowResults(true);

        try {
            const user = await User.me();
            const badges = await Badge.list();
            const unlockedBadges = [];

            // Check for new badge unlocks
            for (const badge of badges) {
                if (!user.unlocked_badge_ids?.includes(badge.id)) {
                    let shouldUnlock = false;
                    if (badge.mode_required === quizMode || badge.mode_required === 'None') {
                        if (badge.book_required === bookFilter || badge.book_required === 'None') {
                            shouldUnlock = true;
                        }
                    }
                    if (shouldUnlock) unlockedBadges.push(badge);
                }
            }

            setNewlyUnlockedBadges(unlockedBadges);

            const updatedData = {
                coins: (user.coins || 0) + score,
                xp_total: (user.xp_total || 0) + score,
                stars: (user.stars || 0) + Math.floor(score / 20),
                quizzes_completed: (user.quizzes_completed || 0) + 1,
                unlocked_badge_ids: [...(user.unlocked_badge_ids || []), ...unlockedBadges.map(b => b.id)]
            };

            if (quizMode === 'daily') {
                updatedData.last_daily_challenge = new Date().toISOString();
            }

            await User.updateMyUserData(updatedData);
        } catch (error) {
            console.error("Error updating user data:", error);
        }
    };

    const startNewRound = () => {
        // Reset for new round but keep used question tracking
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setScore(0);
        setStreak(0);
        setShowResults(false);
        setShowFeedback(false);
        setFeedbackData({});
        setIsPackComplete(false);
        setNewlyUnlockedBadges([]);
        if (quizMode === 'speed') {
            setTimer(60);
        }
        
        // Trigger question reload
        setIsLoading(true);
    };

    const resetSession = () => {
        // Clear used questions and start fresh
        setUsedQuestionIds(new Set());
        startNewRound();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="clay-card p-8 text-center">
                    <div className="text-2xl font-bold text-gray-600">Loading Quest...</div>
                </div>
            </div>
        );
    }
    
    if (showResults) {
        return (
            <div className="relative flex flex-col items-center justify-center h-full text-center p-4 pb-32 md:pb-4">
                 {newlyUnlockedBadges.length > 0 && <Confetti />}
                 <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="clay-card p-8 w-full max-w-md space-y-6">
                    {isPackComplete ? (
                        <>
                            <h2 className="text-3xl font-bold text-gray-800">Pack Complete!</h2>
                            <p className="text-xl text-gray-600">You've completed all available questions in this pack!</p>
                            <p className="text-lg text-purple-600">Total score: {score} points!</p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-3xl font-bold text-gray-800">Quest Complete!</h2>
                            {quizMode === 'speed' && <p className="text-xl text-gray-600">Time's up!</p>}
                            <p className="text-xl text-gray-600">You scored {score} points!</p>
                            <p className="text-lg text-purple-600">Best streak: {streak} in a row!</p>
                        </>
                    )}
                     <div className="flex justify-center gap-6">
                        <div className="flex items-center gap-2 clay-button p-4">
                           <Coins className="w-8 h-8 text-yellow-500" />
                           <span className="text-2xl font-bold">+{score}</span>
                        </div>
                        <div className="flex items-center gap-2 clay-button p-4">
                           <Star className="w-8 h-8 text-yellow-400" />
                           <span className="text-2xl font-bold">+{Math.floor(score / 20)}</span>
                        </div>
                    </div>
                    {newlyUnlockedBadges.length > 0 && (
                        <div className="clay-shadow-inset bg-gradient-to-br from-yellow-100 to-amber-200 p-4 rounded-xl">
                            <h3 className="font-bold text-yellow-800 text-lg">New Trophy Unlocked!</h3>
                            {newlyUnlockedBadges.map(b => <p key={b.id} className="text-yellow-700">{b.name}</p>)}
                        </div>
                    )}
                    <div className="space-y-3">
                        {isPackComplete ? (
                            <ClayButton onClick={resetSession} className="bg-gradient-to-r from-green-200 to-green-300 w-full">
                                Start Fresh Session
                            </ClayButton>
                        ) : (
                            <ClayButton onClick={startNewRound} className="bg-gradient-to-r from-green-200 to-green-300 w-full">
                                Continue Quest
                            </ClayButton>
                        )}
                        <ClayButton onClick={() => navigate(createPageUrl('Home'))} className="bg-gradient-to-r from-blue-200 to-blue-300 w-full">
                            Back to Home
                        </ClayButton>
                    </div>
                </motion.div>
            </div>
        )
    }

    if (!isLoading && questions.length < 5 && (quizMode === 'books' || quizMode === 'commandments')) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="clay-card p-8 text-center">
                    <div className="text-2xl font-bold text-gray-600 mb-4">Not enough questions!</div>
                    <p className="text-gray-500">This quest requires at least 5 questions to begin. Please try another book or check back later.</p>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="clay-card p-8 text-center">
                    <div className="text-2xl font-bold text-gray-600 mb-4">No questions found for this quest!</div>
                    <p className="text-gray-500">This book needs more questions. Try another book or check back later!</p>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    // Calculate feedback duration based on mode
    const getFeedbackDuration = () => {
        if (quizMode === 'speed') return 1200; // 1.2s for speed mode
        return gameSettings.feedback_duration * 1000; // Convert to milliseconds
    };

    return (
        <div className="flex flex-col h-full p-4 pb-32 md:pb-4">
            <div className="mb-6 flex items-center gap-4">
                 <ProgressBar value={progress} theme={theme} />
                 {quizMode === 'speed' ? (
                    <div className="flex items-center gap-2 font-bold text-red-500 text-lg whitespace-nowrap clay-button p-3">
                        <Clock className="w-5 h-5" />
                        <span>{timer}</span>
                    </div>
                 ) : (
                    <div className="font-bold text-gray-600 text-lg whitespace-nowrap clay-button p-3">{currentQuestionIndex + 1} / {questions.length}</div>
                 )}
                 {streak > 0 && (
                    <div className="font-bold text-purple-600 text-sm whitespace-nowrap clay-button p-2">
                        🔥 {streak}
                    </div>
                 )}
            </div>
           
            <AnimatePresence mode="wait">
                <motion.div 
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="space-y-6 flex-1"
                >
                    <div className="clay-card p-6 text-center">
                        <p className="text-lg md:text-xl font-bold text-gray-800 leading-relaxed">
                            {currentQuestion.question}
                        </p>
                        {currentQuestion.scripture_ref && (
                            <p className="text-sm text-gray-500 mt-3 font-medium">
                                Reference: {currentQuestion.scripture_ref}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
                        {currentQuestion.choices?.map((choice, index) => (
                            <ClayButton
                                key={index}
                                onClick={() => handleAnswer(index)}
                                disabled={selectedAnswer !== null}
                                className={`p-4 text-left text-base transition-all duration-300 ${
                                    selectedAnswer !== null && index === currentQuestion.answer_index
                                        ? 'bg-green-300 text-green-800 shadow-lg'
                                        : selectedAnswer !== null && selectedAnswer === index && index !== currentQuestion.answer_index
                                        ? 'bg-red-300 text-red-800'
                                        : selectedAnswer === null
                                        ? 'hover:bg-blue-100 hover:shadow-lg'
                                        : 'opacity-60'
                                }`}
                            >
                                {choice}
                            </ClayButton>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            <FeedbackCard
                isVisible={showFeedback}
                isCorrect={feedbackData.isCorrect}
                question={feedbackData.question}
                userAnswer={feedbackData.userAnswer}
                correctAnswer={feedbackData.correctAnswer}
                explanation={feedbackData.explanation}
                scriptureRef={feedbackData.scriptureRef}
                onNext={handleFeedbackNext}
                autoAdvanceDuration={getFeedbackDuration()}
                showCorrectAnswer={gameSettings.show_correct_answer}
                autoAdvance={gameSettings.auto_advance}
            />
        </div>
    );
}