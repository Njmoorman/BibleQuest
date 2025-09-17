import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const AVATAR_CHARACTERS = {
    knight: '🛡️', wizard: '🧙‍♂️', angel: '👼', shepherd: '🧑‍🌾', scholar: '👨‍🎓', 
    explorer: '🧑‍💼', crown: '👑', dove: '🕊️', lion: '🦁', eagle: '🦅', 
    lamb: '🐑', fish: '🐟', star: '⭐', cross: '✝️', heart: '❤️', peace: '☮️',
    User: '👤'
};

const ClayCard = ({ children, className }) => (
    <div className={`p-4 rounded-2xl clay-card ${className}`}>
        {children}
    </div>
);

const getRankIcon = (position) => {
    if (position === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (position === 2) return <Trophy className="w-6 h-6 text-gray-400" />;
    if (position === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">#{position}</span>;
};

export default function LeaderboardPage() {
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [scope, setScope] = useState('all-time');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const user = await User.me();
                setCurrentUser(user);
            } catch (e) {
                // Not logged in
            }
            
            const sortKey = scope === 'season' ? '-season_xp' : '-xp_total';
            const allUsers = await User.list(sortKey, 100);
            
            setUsers(allUsers);
            setIsLoading(false);
        };
        fetchData();
    }, [scope]);

    return (
        <div className="p-4 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">🏆 Leaderboard</h1>
                <p className="text-gray-600">See how you rank based on Experience Points!</p>
            </div>

            <ClayCard>
                <Tabs value={scope} onValueChange={setScope}>
                    <TabsList className="grid w-full grid-cols-2 clay-button p-1 mb-4">
                        <TabsTrigger value="all-time">All-Time</TabsTrigger>
                        <TabsTrigger value="season">This Season</TabsTrigger>
                    </TabsList>

                    <TabsContent value={scope}>
                        {isLoading ? (
                            <div className="text-center py-8">Loading rankings...</div>
                        ) : (
                            <div className="space-y-3">
                                {users.slice(0, 50).map((user, index) => (
                                    <motion.div
                                        key={user.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`flex items-center gap-4 p-3 rounded-xl clay-shadow-inset ${
                                            user.id === currentUser?.id ? 'bg-blue-100 border-2 border-blue-300' : 'bg-white/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            {getRankIcon(index + 1)}
                                            <div className="w-10 h-10 rounded-full clay-shadow-inset bg-gradient-to-br from-white to-gray-100 flex items-center justify-center text-lg">
                                                {AVATAR_CHARACTERS[user.avatar] || '👤'}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-gray-800 truncate">{user.nickname}</p>
                                                <p className="text-xs text-gray-500">{user.rank_tier}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-indigo-600">{scope === 'season' ? user.season_xp : user.xp_total}</p>
                                            <p className="text-xs text-gray-500">XP</p>
                                        </div>
                                    </motion.div>
                                ))}
                                
                                {users.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        No players found. Be the first!
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </ClayCard>

            {currentUser && (
                <ClayCard className="bg-blue-50">
                    <h3 className="font-bold text-center mb-2">Your Standing</h3>
                    <div className="flex justify-around items-center gap-4">
                        <div className="text-center clay-shadow-inset p-3 rounded-xl bg-white">
                            <p className="text-2xl font-bold text-blue-600">
                               {scope === 'season' ? currentUser.season_xp : currentUser.xp_total} XP
                            </p>
                            <p className="text-sm text-gray-600">{scope === 'season' ? 'Season' : 'All-Time'}</p>
                        </div>
                        <div className="text-center clay-shadow-inset p-3 rounded-xl bg-white">
                            <p className="text-2xl font-bold text-green-600">
                                {currentUser.rank_tier}
                            </p>
                            <p className="text-sm text-gray-600">Current Rank</p>
                        </div>
                    </div>
                </ClayCard>
            )}
        </div>
    );
}