import React from 'react';
import { motion } from 'framer-motion';

const RANK_THRESHOLDS = {
    "Seedling": 0, "Explorer": 100, "Pathfinder": 250, "Apprentice": 450, "Storyteller": 700,
    "Psalm Singer": 1000, "Light Bearer": 1350, "Ark Builder": 1750, "Shepherd": 2200, "Messenger": 2700,
    "Disciple": 3250, "Fisher of Men": 3850, "Peacemaker": 4500, "Scribe": 5200, "Overcomer": 5950,
    "Elder": 6750, "Gatekeeper": 7600, "Prophet": 8500, "Teacher": 9450, "Luminary": 10500
};

const RANK_ORDER = [
    "Seedling", "Explorer", "Pathfinder", "Apprentice", "Storyteller",
    "Psalm Singer", "Light Bearer", "Ark Builder", "Shepherd", "Messenger", 
    "Disciple", "Fisher of Men", "Peacemaker", "Scribe", "Overcomer",
    "Elder", "Gatekeeper", "Prophet", "Teacher", "Luminary"
];

export default function XPProgressBar({ currentXP, currentRank }) {
    const currentRankIndex = RANK_ORDER.indexOf(currentRank);
    const isMaxRank = currentRankIndex === RANK_ORDER.length - 1;
    
    if (isMaxRank) {
        return (
            <div className="text-center">
                <div className="w-full h-6 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full overflow-hidden clay-shadow-inset flex items-center justify-center">
                    <span className="text-white font-bold text-sm">MAX RANK ✨</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">You've reached the highest rank!</p>
            </div>
        );
    }
    
    const nextRank = RANK_ORDER[currentRankIndex + 1];
    const currentThreshold = RANK_THRESHOLDS[currentRank];
    const nextThreshold = RANK_THRESHOLDS[nextRank];
    
    const progress = ((currentXP - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    const xpNeeded = nextThreshold - currentXP;
    
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
                <span>{currentRank}</span>
                <span>{nextRank}</span>
            </div>
            <div className="w-full h-6 clay-progress rounded-full overflow-hidden">
                <motion.div 
                    className="h-full clay-progress-fill rounded-full flex items-center justify-end pr-2"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(5, progress)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                >
                    <span className="text-white text-xs font-bold">{Math.round(progress)}%</span>
                </motion.div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
                <span>{currentXP} XP</span>
                <span>{xpNeeded > 0 ? `${xpNeeded} XP to go` : 'Ready to advance!'}</span>
            </div>
        </div>
    );
}