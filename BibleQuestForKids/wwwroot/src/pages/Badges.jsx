
import React, { useState, useEffect } from 'react';
import { Badge as BadgeEntity } from '@/api/entities';
import { User } from '@/api/entities';
import { Award, Lock, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ClayBadge = ({ badge, isUnlocked, progress = 0, total = 10 }) => {
    const color = isUnlocked ? badge.color : 'bg-gray-200';
    const textColor = isUnlocked ? 'text-white' : 'text-gray-400';
    const iconColor = isUnlocked ? 'text-white' : 'text-gray-500';

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="p-4 rounded-2xl clay-button flex flex-col items-center text-center justify-between"
        >
            <div>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center clay-shadow-inset mb-4 mx-auto ${color}`}>
                    {isUnlocked ? (
                        <Star className={`w-12 h-12 text-yellow-300`} fill="currentColor" />
                    ) : (
                        <Lock className={`w-12 h-12 ${iconColor}`} />
                    )}
                </div>
                <h3 className={`text-lg font-bold ${isUnlocked ? 'text-gray-800' : 'text-gray-500'}`}>{badge.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{badge.description}</p>
            </div>
            {!isUnlocked && badge.book_required !== 'None' && (
                <div className="w-full mt-4">
                    <div className="h-2 bg-gray-300 rounded-full w-full">
                        <div className="h-2 bg-green-500 rounded-full" style={{width: `${(progress/total)*100}%`}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{progress} / {total} Correct</p>
                </div>
            )}
        </motion.div>
    );
};


export default function BadgesPage() {
    const [allBadges, setAllBadges] = useState([]);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const badges = await BadgeEntity.list();
            setAllBadges(badges);
            try {
                const currentUser = await User.me();
                setUser(currentUser);
            } catch (e) {
                // Not logged in
            }
            setIsLoading(false);
        };
        fetchData();
    }, []);

    if (isLoading) {
        return <div className="text-center p-8">Loading badges...</div>;
    }
    
    const unlockedBadges = allBadges.filter(b => user?.unlocked_badge_ids?.includes(b.id));
    const lockedBadges = allBadges.filter(b => !user?.unlocked_badge_ids?.includes(b.id));

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">My Trophies</h1>
            
            <Tabs defaultValue="unlocked" className="w-full">
              <TabsList className="grid w-full grid-cols-2 clay-button p-1 mb-6">
                <TabsTrigger value="unlocked" className="data-[state=active]:clay-button:active">Unlocked ({unlockedBadges.length})</TabsTrigger>
                <TabsTrigger value="locked" className="data-[state=active]:clay-button:active">Locked ({lockedBadges.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="unlocked">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {unlockedBadges.map(badge => (
                        <ClayBadge key={badge.id} badge={badge} isUnlocked={true} />
                    ))}
                </div>
                {unlockedBadges.length === 0 && <p className="text-center text-gray-500 p-8">No trophies unlocked yet. Keep playing!</p>}
              </TabsContent>
              <TabsContent value="locked">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {lockedBadges.map(badge => (
                        <ClayBadge 
                            key={badge.id} 
                            badge={badge} 
                            isUnlocked={false} 
                            progress={user?.progress?.[badge.book_required] || 0}
                            total={10} // Assuming 10 correct answers needed per badge
                        />
                    ))}
                </div>
              </TabsContent>
            </Tabs>
        </div>
    );
}
