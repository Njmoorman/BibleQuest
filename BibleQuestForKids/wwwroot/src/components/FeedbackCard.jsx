import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

const ClayButton = ({ children, className, ...props }) => (
    <button className={`clay-button px-4 py-2 rounded-xl font-bold ${className}`} {...props}>
        {children}
    </button>
);

export default function FeedbackCard({
    isVisible,
    isCorrect,
    question,
    userAnswer,
    correctAnswer,
    explanation,
    scriptureRef,
    onNext,
    autoAdvanceDuration = 2000,
    showCorrectAnswer = true,
    autoAdvance = true
}) {
    const [timeRemaining, setTimeRemaining] = useState(autoAdvanceDuration / 1000);
    const [canSkip, setCanSkip] = useState(false);

    useEffect(() => {
        if (!isVisible) return;

        // Reset timer
        setTimeRemaining(autoAdvanceDuration / 1000);
        setCanSkip(false);

        // Play sound/haptic feedback
        try {
            if (isCorrect) {
                // Correct sound/haptic
                if (navigator.vibrate) navigator.vibrate(50);
                // Screen reader announcement
                if (window.speechSynthesis) {
                    const utterance = new SpeechSynthesisUtterance('Correct!');
                    utterance.volume = 0.3;
                    window.speechSynthesis.speak(utterance);
                }
            } else {
                // Incorrect sound/haptic
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                // Screen reader announcement
                if (window.speechSynthesis) {
                    const utterance = new SpeechSynthesisUtterance(`Incorrect. The correct answer is ${correctAnswer}`);
                    utterance.volume = 0.3;
                    window.speechSynthesis.speak(utterance);
                }
            }
        } catch (e) {
            // Fallback if sound/vibration not supported
            console.log('Sound/vibration not supported');
        }

        let interval;
        let timeout;

        if (autoAdvance) {
            // Allow skip after 800ms
            setTimeout(() => setCanSkip(true), 800);

            // Countdown timer
            interval = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 0.1) {
                        onNext();
                        return 0;
                    }
                    return prev - 0.1;
                });
            }, 100);

            // Auto advance
            timeout = setTimeout(() => {
                onNext();
            }, autoAdvanceDuration);
        } else {
            setCanSkip(true);
        }

        return () => {
            if (interval) clearInterval(interval);
            if (timeout) clearTimeout(timeout);
        };
    }, [isVisible, isCorrect, autoAdvance, autoAdvanceDuration, onNext, correctAnswer]);

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-labelledby="feedback-title"
            aria-describedby="feedback-content"
        >
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="clay-card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    {isCorrect ? (
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    ) : (
                        <XCircle className="w-8 h-8 text-red-500" />
                    )}
                    <h3 
                        id="feedback-title"
                        className={`text-2xl font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}
                    >
                        {isCorrect ? 'Correct!' : 'Not Quite!'}
                    </h3>
                </div>

                {/* Content */}
                <div id="feedback-content" className="space-y-4">
                    {/* Question */}
                    <div>
                        <h4 className="font-bold text-gray-700 mb-2">Question:</h4>
                        <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{question}</p>
                    </div>

                    {/* Answers */}
                    <div className="grid gap-3">
                        <div>
                            <h4 className="font-bold text-gray-700 mb-2">Your Answer:</h4>
                            <p className={`p-3 rounded-lg font-medium ${
                                isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                                {userAnswer}
                            </p>
                        </div>

                        {!isCorrect && showCorrectAnswer && (
                            <div>
                                <h4 className="font-bold text-gray-700 mb-2">Correct Answer:</h4>
                                <p className="bg-green-100 text-green-800 p-3 rounded-lg font-medium">
                                    {correctAnswer}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Explanation */}
                    {explanation && (
                        <div>
                            <h4 className="font-bold text-gray-700 mb-2">Explanation:</h4>
                            <p className="text-gray-600 bg-blue-50 p-3 rounded-lg">{explanation}</p>
                        </div>
                    )}

                    {/* Scripture Reference */}
                    {scriptureRef && (
                        <div>
                            <h4 className="font-bold text-gray-700 mb-2">Scripture Reference:</h4>
                            <p className="text-purple-700 bg-purple-50 p-3 rounded-lg font-medium">
                                {scriptureRef}
                            </p>
                        </div>
                    )}
                </div>

                {/* Progress Bar and Next Button */}
                <div className="mt-6 space-y-3">
                    {autoAdvance && (
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-100"
                                style={{ width: `${(timeRemaining / (autoAdvanceDuration / 1000)) * 100}%` }}
                            />
                        </div>
                    )}
                    
                    <ClayButton
                        onClick={onNext}
                        disabled={!canSkip}
                        className={`w-full py-3 bg-blue-200 text-blue-800 ${
                            !canSkip ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        aria-label={canSkip ? 'Next available' : 'Next will be available soon'}
                    >
                        <ArrowRight className="inline mr-2 w-5 h-5" />
                        {canSkip ? 'Next' : `Next (${Math.ceil(timeRemaining)}s)`}
                    </ClayButton>
                </div>
            </motion.div>
        </motion.div>
    );
}