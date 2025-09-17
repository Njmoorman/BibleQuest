
import React from 'react';
import { Crown, Star, Shield, Gem, Flame, Scroll, Mountain, Sun, Compass, User, Book, Music, Flashlight, Sailboat, PersonStanding, Bird, Cross, Fish, HandHeart, Feather, Users, Castle, Zap, BookOpen, Sparkles } from 'lucide-react';

const RANK_CONFIG = {
    "Seedling": { icon: Sun, color: 'text-green-500', bg: 'bg-green-100', threshold: 0 },
    "Explorer": { icon: Compass, color: 'text-blue-500', bg: 'bg-blue-100', threshold: 100 },
    "Pathfinder": { icon: User, color: 'text-indigo-500', bg: 'bg-indigo-100', threshold: 250 },
    "Apprentice": { icon: Book, color: 'text-purple-500', bg: 'bg-purple-100', threshold: 450 },
    "Storyteller": { icon: BookOpen, color: 'text-pink-500', bg: 'bg-pink-100', threshold: 700 },
    "Psalm Singer": { icon: Music, color: 'text-violet-500', bg: 'bg-violet-100', threshold: 1000 },
    "Light Bearer": { icon: Flashlight, color: 'text-yellow-500', bg: 'bg-yellow-100', threshold: 1350 },
    "Ark Builder": { icon: Sailboat, color: 'text-cyan-500', bg: 'bg-cyan-100', threshold: 1750 },
    "Shepherd": { icon: PersonStanding, color: 'text-emerald-500', bg: 'bg-emerald-100', threshold: 2200 },
    "Messenger": { icon: Bird, color: 'text-sky-500', bg: 'bg-sky-100', threshold: 2700 },
    "Disciple": { icon: Cross, color: 'text-red-500', bg: 'bg-red-100', threshold: 3250 },
    "Fisher of Men": { icon: Fish, color: 'text-teal-500', bg: 'bg-teal-100', threshold: 3850 },
    "Peacemaker": { icon: HandHeart, color: 'text-rose-500', bg: 'bg-rose-100', threshold: 4500 },
    "Scribe": { icon: Feather, color: 'text-amber-500', bg: 'bg-amber-100', threshold: 5200 },
    "Overcomer": { icon: Mountain, color: 'text-orange-500', bg: 'bg-orange-100', threshold: 5950 },
    "Elder": { icon: Users, color: 'text-gray-600', bg: 'bg-gray-100', threshold: 6750 },
    "Gatekeeper": { icon: Castle, color: 'text-slate-600', bg: 'bg-slate-100', threshold: 7600 },
    "Prophet": { icon: Zap, color: 'text-red-600', bg: 'bg-red-200', threshold: 8500 },
    "Teacher": { icon: Scroll, color: 'text-indigo-600', bg: 'bg-indigo-200', threshold: 9450 },
    "Luminary": { icon: Sparkles, color: 'text-yellow-600', bg: 'bg-yellow-200', threshold: 10500 }
};

export default function RankBadge({ rank, size = 'normal' }) {
    const config = RANK_CONFIG[rank] || RANK_CONFIG.Seedling;
    const Icon = config.icon;
    
    const sizeClasses = {
        small: 'w-6 h-6',
        normal: 'w-8 h-8', 
        large: 'w-12 h-12'
    };

    return (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
            <Icon className={`${sizeClasses[size]} ${config.color}`} />
            <span className={`font-bold ${config.color}`}>{rank}</span>
        </div>
    );
}
