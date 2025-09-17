
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MemoryVerse } from '@/api/entities';
import { User } from '@/api/entities';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Clock, Star, Coins, Home, RefreshCw, X } from 'lucide-react';
import { createPageUrl } from '@/utils';
import _ from 'lodash';
import Confetti from '../components/Confetti';
import VerseCard from '../components/VerseCard';

const ClayButton = ({ children, className, ...props }) => <button className={`clay-button px-4 py-2 rounded-xl font-bold ${className}`} {...props}>{children}</button>;

const Modal = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="clay-card p-8 mx-4 max-w-md w-full"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Choose Difficulty</h2>
                    <button onClick={onClose} className="clay-button p-2">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-gray-600 mb-6">How many verse pairs would you like to match?</p>
                <div className="space-y-4">
                    <ClayButton 
                        onClick={() => onSelect(10)} 
                        className="w-full bg-green-200 text-green-800 p-4"
                    >
                        <div className="text-center">
                            <div className="text-2xl font-bold">10 Pairs</div>
                            <div className="text-sm">Easy - Perfect for beginners</div>
                        </div>
                    </ClayButton>
                    <ClayButton 
                        onClick={() => onSelect(25)} 
                        className="w-full bg-yellow-200 text-yellow-800 p-4"
                    >
                        <div className="text-center">
                            <div className="text-2xl font-bold">25 Pairs</div>
                            <div className="text-sm">Medium - Good challenge</div>
                        </div>
                    </ClayButton>
                    <ClayButton 
                        onClick={() => onSelect(50)} 
                        className="w-full bg-red-200 text-red-800 p-4"
                    >
                        <div className="text-center">
                            <div className="text-2xl font-bold">50 Pairs</div>
                            <div className="text-sm">Hard - For memory masters</div>
                        </div>
                    </ClayButton>
                </div>
            </motion.div>
        </div>
    );
};

export default function VerseMatchPage() {
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [flipped, setFlipped] = useState([]);
    const [solved, setSolved] = useState([]);
    const [isDisabled, setIsDisabled] = useState(false);
    const [time, setTime] = useState(0);
    const [flips, setFlips] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [showModal, setShowModal] = useState(true);
    const [selectedCount, setSelectedCount] = useState(null);

    const createNewGame = async (pairCount = 10) => {
        setIsComplete(false);
        setFlipped([]);
        setSolved([]);
        setFlips(0);
        setTime(0);

        const verses = await MemoryVerse.list();
        const selectedVerses = _.shuffle(verses).slice(0, pairCount);
        
        const gameCards = _.shuffle([
            ...selectedVerses.map(v => ({ type: 'text', content: v.verse_text, id: v.id, verse_ref: v.verse_ref })),
            ...selectedVerses.map(v => ({ type: 'ref', content: v.verse_ref, id: v.id, verse_ref: v.verse_ref }))
        ]).map((card, index) => ({ ...card, uniqueId: index }));
        
        setCards(gameCards);
    };

    const handleModalSelect = (count) => {
        setSelectedCount(count);
        setShowModal(false);
        createNewGame(count);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            if (!showModal && !isComplete) {
                setTime(prev => prev + 1);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [showModal, isComplete]);

    const handleFlip = (uniqueId) => {
        if (isDisabled || flipped.includes(uniqueId) || solved.includes(uniqueId)) return;

        const newFlipped = [...flipped, uniqueId];
        setFlipped(newFlipped);
        setFlips(f => f + 1);

        if (newFlipped.length === 2) {
            setIsDisabled(true);
            const [firstCard, secondCard] = newFlipped.map(uid => cards.find(c => c.uniqueId === uid));
            if (firstCard.id === secondCard.id) {
                setSolved(prev => [...prev, firstCard.uniqueId, secondCard.uniqueId]);
                setFlipped([]);
                setIsDisabled(false);
            } else {
                setTimeout(() => {
                    setFlipped([]);
                    setIsDisabled(false);
                }, 1200);
            }
        }
    };
    
    useEffect(() => {
        if (solved.length > 0 && solved.length === cards.length) {
            setIsComplete(true);
            
            // Calculate rewards based on performance
            let baseXP = selectedCount * 2; // 2 XP per pair
            let baseCoins = selectedCount * 5; // 5 coins per pair
            
            // Time bonus (faster = more rewards)
            const avgTimePerPair = time / selectedCount;
            if (avgTimePerPair < 3) baseCoins += selectedCount * 2; // Speed bonus
            
            // Efficiency bonus (fewer flips = better)
            const efficiency = (selectedCount * 2) / flips; // Perfect would be 1.0
            if (efficiency > 0.8) baseXP += selectedCount; // Efficiency bonus
            
            User.me().then(user => {
                User.updateMyUserData({
                    xp_total: (user.xp_total || 0) + baseXP,
                    coins: (user.coins || 0) + baseCoins,
                    stars: (user.stars || 0) + Math.floor(baseCoins / 20),
                });
            }).catch(console.error);
        }
    }, [solved, cards.length, time, flips, selectedCount]);

    const handlePlayAgain = () => {
        setShowModal(true);
        setSelectedCount(null);
    };

    return (
        <div className="p-4 text-center">
             <Modal 
                isOpen={showModal} 
                onClose={() => navigate(createPageUrl('Home'))}
                onSelect={handleModalSelect}
             />
             
             <h1 className="text-3xl font-bold text-gray-800 mb-4">Verse Match</h1>
             <AnimatePresence>
             {isComplete ? (
                 <motion.div initial={{scale:0.8, opacity:0}} animate={{scale:1, opacity:1}} className="clay-card p-8">
                     <Confetti />
                     <Award className="w-20 h-20 mx-auto text-yellow-400" />
                     <h2 className="text-2xl font-bold my-4">Grid Cleared!</h2>
                     <div className="flex justify-around mb-4">
                        <div><p className="text-xl font-bold">{time}s</p><p>Time</p></div>
                        <div><p className="text-xl font-bold">{flips}</p><p>Flips</p></div>
                        <div><p className="text-xl font-bold">{selectedCount}</p><p>Pairs</p></div>
                     </div>
                     <p className="text-gray-600 mb-6">
                        You earned {selectedCount * 2} XP and {selectedCount * 5} coins!
                     </p>
                     <div className="flex gap-4">
                        <ClayButton onClick={handlePlayAgain} className="bg-blue-200"><RefreshCw className="mr-2 w-4 h-4"/> Play Again</ClayButton>
                        <ClayButton onClick={() => navigate(createPageUrl('Home'))}><Home className="mr-2 w-4 h-4"/> Home</ClayButton>
                     </div>
                 </motion.div>
             ) : selectedCount && (
                <>
                 <div className="flex justify-around clay-card p-4 mb-6">
                     <div className="font-bold text-lg"><Clock className="inline mr-2"/> {time}s</div>
                     <div className="font-bold text-lg"><Star className="inline mr-2"/> {flips} Flips</div>
                     <div className="font-bold text-lg"><Coins className="inline mr-2"/> {selectedCount} Pairs</div>
                 </div>
                 <div className={`grid gap-2 md:gap-3 max-w-4xl mx-auto ${
                    selectedCount === 10 ? 'grid-cols-5' :
                    selectedCount === 25 ? 'grid-cols-7' :
                    'grid-cols-10'
                 }`}>
                     {cards.map(card => (
                         <VerseCard 
                            key={card.uniqueId} 
                            card={card} 
                            isFlipped={flipped.includes(card.uniqueId) || solved.includes(card.uniqueId)}
                            onClick={handleFlip}
                         />
                     ))}
                 </div>
                </>
             )}
             </AnimatePresence>
        </div>
    );
}
