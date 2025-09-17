import React from 'react';
import { motion } from 'framer-motion';

export default function VerseCard({ card, isFlipped, onClick }) {
    return (
        <div className="w-full aspect-square perspective-1000" onClick={() => onClick(card.uniqueId)}>
            <motion.div 
                className="relative w-full h-full preserve-3d"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Back of Card */}
                <div className="absolute w-full h-full backface-hidden clay-button flex items-center justify-center">
                    <span className="text-3xl md:text-4xl">?</span>
                </div>
                {/* Front of Card */}
                <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg flex flex-col items-center justify-center p-1 text-center">
                    <p className="font-bold text-xs text-indigo-800 flex-1 flex items-center leading-tight">{card.content}</p>
                    <p className="text-[10px] text-indigo-600 font-semibold mt-auto pb-1">{card.verse_ref}</p>
                </div>
            </motion.div>
        </div>
    );
}