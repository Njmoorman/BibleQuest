import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Coins, Crown, Star, CheckCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SHOP_AVATARS = [
  { id: 'premium_crown', emoji: '👑', name: 'Golden Crown', price: 500, description: 'Reign with majesty' },
  { id: 'premium_fire', emoji: '🔥', name: 'Holy Fire', price: 300, description: 'Burn bright for God' },
  { id: 'premium_diamond', emoji: '💎', name: 'Diamond Light', price: 800, description: 'Shine like a jewel' },
  { id: 'premium_rainbow', emoji: '🌈', name: 'Promise Rainbow', price: 400, description: 'God\'s covenant sign' },
  { id: 'premium_mountain', emoji: '⛰️', name: 'Mountain Mover', price: 600, description: 'Faith moves mountains' },
  { id: 'premium_sunrise', emoji: '🌅', name: 'New Dawn', price: 350, description: 'His mercies are new' },
  { id: 'premium_olive', emoji: '🕊️', name: 'Peace Dove', price: 250, description: 'Brings hope and peace' },
  { id: 'premium_anchor', emoji: '⚓', name: 'Hope Anchor', price: 450, description: 'Steadfast faith' },
  { id: 'premium_lighthouse', emoji: '🗼', name: 'Lighthouse', price: 700, description: 'Guide others to truth' },
  { id: 'premium_golden_fish', emoji: '🐠', name: 'Golden Fish', price: 550, description: 'Fisher of souls' },
  { id: 'premium_wheat', emoji: '🌾', name: 'Harvest Field', price: 400, description: 'Ready for harvest' },
  { id: 'premium_grapes', emoji: '🍇', name: 'True Vine', price: 375, description: 'Bear much fruit' }
];

const ClayCard = ({ children, className }) => (
    <div className={`p-6 rounded-2xl clay-card ${className}`}>
        {children}
    </div>
);

const ClayButton = ({ children, className, ...props }) => (
    <button className={`clay-button px-4 py-2 rounded-xl font-bold ${className}`} {...props}>
        {children}
    </button>
);

const AvatarCard = ({ avatar, isOwned, onPurchase, canAfford }) => (
    <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="clay-card p-4 text-center"
    >
        <div className="w-20 h-20 rounded-full clay-shadow-inset bg-gradient-to-br from-white to-gray-100 flex items-center justify-center text-4xl mx-auto mb-3">
            {avatar.emoji}
        </div>
        <h3 className="font-bold text-lg text-gray-800 mb-2">{avatar.name}</h3>
        <p className="text-sm text-gray-600 mb-3">{avatar.description}</p>
        
        {isOwned ? (
            <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
                <CheckCircle className="w-5 h-5" />
                <span>Owned</span>
            </div>
        ) : (
            <ClayButton 
                onClick={() => onPurchase(avatar)}
                disabled={!canAfford}
                className={`w-full ${canAfford ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'}`}
            >
                <div className="flex items-center justify-center gap-2">
                    {canAfford ? <Coins className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    <span>{avatar.price}</span>
                </div>
            </ClayButton>
        )}
    </motion.div>
);

export default function ShopPage() {
    const [user, setUser] = useState(null);
    const [ownedAvatars, setOwnedAvatars] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                setOwnedAvatars(currentUser.owned_avatars || []);
            } catch (e) {
                // Not logged in
            }
            setIsLoading(false);
        };
        fetchUser();
    }, []);

    const handlePurchase = async (avatar) => {
        if (!user || user.coins < avatar.price || ownedAvatars.includes(avatar.id)) return;

        try {
            const newCoins = user.coins - avatar.price;
            const newOwnedAvatars = [...ownedAvatars, avatar.id];
            
            await User.updateMyUserData({
                coins: newCoins,
                owned_avatars: newOwnedAvatars,
                avatar: avatar.id
            });
            
            setUser(prev => ({
                ...prev,
                coins: newCoins,
                owned_avatars: newOwnedAvatars,
                avatar: avatar.id
            }));
            setOwnedAvatars(newOwnedAvatars);
            
            alert(`You've purchased and equipped ${avatar.name}!`);
        } catch (error) {
            console.error('Purchase failed:', error);
            alert('Purchase failed. Please try again.');
        }
    };

    if (isLoading) {
        return <div className="text-center p-8">Loading shop...</div>;
    }

    return (
        <div className="p-4 space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">🛍️ Avatar Shop</h1>
                <p className="text-gray-600">Purchase special avatars with your coins!</p>
            </div>

            {user && (
                <ClayCard className="text-center bg-gradient-to-br from-yellow-50 to-amber-50">
                    <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                            <Coins className="w-8 h-8 text-yellow-500" />
                            <span className="text-2xl font-bold text-gray-800">{user.coins}</span>
                            <span className="text-gray-600">Coins</span>
                        </div>
                    </div>
                </ClayCard>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {SHOP_AVATARS.map(avatar => (
                    <AvatarCard
                        key={avatar.id}
                        avatar={avatar}
                        isOwned={ownedAvatars.includes(avatar.id)}
                        onPurchase={handlePurchase}
                        canAfford={user && user.coins >= avatar.price}
                    />
                ))}
            </div>

            <ClayCard className="text-center bg-gradient-to-br from-blue-50 to-indigo-50">
                <h3 className="font-bold text-lg mb-2">💡 Earn More Coins</h3>
                <p className="text-gray-600">Complete quizzes, daily challenges, and tournaments to earn coins!</p>
            </ClayCard>
        </div>
    );
}