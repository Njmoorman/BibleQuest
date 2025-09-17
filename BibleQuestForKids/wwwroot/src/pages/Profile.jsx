
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Award, BarChart, Calendar, Coins, Edit, Shield, Star, User as UserIcon, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import RankBadge from '../components/ranking/RankBadge';
import XPProgressBar from '../components/ranking/XPProgressBar';
import { useNavigate } from 'react-router-dom'; // Assuming react-router-dom for navigation

const AVATAR_CHARACTERS = [
  { id: 'knight', emoji: '🛡️', name: 'Knight' },
  { id: 'wizard', emoji: '🧙‍♂️', name: 'Wizard' },
  { id: 'angel', emoji: '👼', name: 'Angel' },
  { id: 'shepherd', emoji: '🧑‍🌾', name: 'Shepherd' },
  { id: 'scholar', emoji: '👨‍🎓', name: 'Scholar' },
  { id: 'explorer', emoji: '🧑‍💼', name: 'Explorer' },
  { id: 'crown', emoji: '👑', name: 'Royal' },
  { id: 'dove', emoji: '🕊️', name: 'Dove' },
  { id: 'lion', emoji: '🦁', name: 'Lion' },
  { id: 'eagle', emoji: '🦅', name: 'Eagle' },
  { id: 'lamb', emoji: '🐑', name: 'Lamb' },
  { id: 'fish', emoji: '🐟', name: 'Fish' },
  { id: 'star', emoji: '⭐', name: 'Star' },
  { id: 'cross', emoji: '✝️', name: 'Cross' },
  { id: 'heart', emoji: '❤️', name: 'Heart' },
  { id: 'peace', emoji: '☮️', name: 'Peace' }
];

const PREMIUM_AVATARS = [
  { id: 'premium_crown', emoji: '👑', name: 'Golden Crown' },
  { id: 'premium_fire', emoji: '🔥', name: 'Holy Fire' },
  { id: 'premium_diamond', emoji: '💎', name: 'Diamond Light' },
  { id: 'premium_rainbow', emoji: '🌈', name: 'Promise Rainbow' },
  { id: 'premium_mountain', emoji: '⛰️', name: 'Mountain Mover' },
  { id: 'premium_sunrise', emoji: '🌅', name: 'New Dawn' },
  { id: 'premium_olive', emoji: '🕊️', name: 'Peace Dove' },
  { id: 'premium_anchor', emoji: '⚓', name: 'Hope Anchor' },
  { id: 'premium_lighthouse', emoji: '🗼', name: 'Lighthouse' },
  { id: 'premium_golden_fish', emoji: '🐠', name: 'Golden Fish' },
  { id: 'premium_wheat', emoji: '🌾', name: 'Harvest Field' },
  { id: 'premium_grapes', emoji: '🍇', name: 'True Vine' }
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

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [isEditingAvatar, setIsEditingAvatar] = useState(false);
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [newNickname, setNewNickname] = useState('');
    const navigate = useNavigate(); // Initialize useNavigate hook

    // Dummy function for createPageUrl - replace with actual routing logic if it exists elsewhere
    const createPageUrl = (pageName) => {
        switch (pageName) {
            case 'BibleFavorites':
                return '/bible/favorites';
            case 'BibleReader':
                return '/bible/reader';
            default:
                return '/';
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                setNewNickname(currentUser.nickname || currentUser.full_name?.split(' ')[0] || 'Anonymous');
            } catch (e) {
                // Not logged in
            }
        };
        fetchUser();
    }, []);

    const handleAvatarChange = async (avatarId) => {
        if (!user) return;
        try {
            await User.updateMyUserData({ avatar: avatarId });
            setUser(prev => ({ ...prev, avatar: avatarId }));
            setIsEditingAvatar(false);
        } catch (error) {
            console.error("Failed to update avatar", error);
        }
    };

    const handleNicknameChange = async () => {
        if (!user || !newNickname.trim()) return;
        try {
            await User.updateMyUserData({ nickname: newNickname.trim() });
            setUser(prev => ({ ...prev, nickname: newNickname.trim() }));
            setIsEditingNickname(false);
        } catch (error) {
            console.error("Failed to update nickname", error);
        }
    };

    const cancelNicknameEdit = () => {
        setNewNickname(user.nickname || user.full_name?.split(' ')[0] || 'Anonymous');
        setIsEditingNickname(false);
    };

    // Combine free avatars with owned premium avatars
    const getAvailableAvatars = () => {
        const freeAvatars = AVATAR_CHARACTERS;
        const ownedPremiumAvatars = PREMIUM_AVATARS.filter(avatar => 
            user?.owned_avatars?.includes(avatar.id)
        );
        return [...freeAvatars, ...ownedPremiumAvatars];
    };

    const currentAvatar = [...AVATAR_CHARACTERS, ...PREMIUM_AVATARS].find(a => a.id === user?.avatar) || AVATAR_CHARACTERS[0];
    
    if (!user) {
        return <div className="text-center p-8">Loading profile...</div>;
    }

    const availableAvatars = getAvailableAvatars();

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 text-center">My Profile</h1>

            <ClayCard>
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full clay-shadow-inset bg-gradient-to-br from-white to-gray-100 flex items-center justify-center text-4xl">
                            {currentAvatar.emoji}
                        </div>
                        <button 
                            onClick={() => setIsEditingAvatar(!isEditingAvatar)} 
                            className="absolute bottom-0 right-0 p-2 rounded-full clay-button bg-blue-200"
                        >
                            <Edit className="w-4 h-4 text-blue-600"/>
                        </button>
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                            {isEditingNickname ? (
                                <div className="flex items-center gap-2">
                                    <Input 
                                        value={newNickname}
                                        onChange={(e) => setNewNickname(e.target.value)}
                                        className="clay-input text-xl font-bold"
                                        placeholder="Enter nickname"
                                        maxLength={20}
                                    />
                                    <ClayButton onClick={handleNicknameChange} className="bg-green-200">
                                        <Check className="w-4 h-4"/>
                                    </ClayButton>
                                    <ClayButton onClick={cancelNicknameEdit} className="bg-red-200">
                                        <X className="w-4 h-4"/>
                                    </ClayButton>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-gray-800">{user.nickname || user.full_name?.split(' ')[0] || 'Anonymous'}</h2>
                                    <button 
                                        onClick={() => setIsEditingNickname(true)} 
                                        className="p-1 rounded-lg clay-button bg-gray-200"
                                    >
                                        <Edit className="w-4 h-4 text-gray-600"/>
                                    </button>
                                </>
                            )}
                        </div>
                        <p className="text-gray-600 mb-3">{user.email}</p>
                        <RankBadge rank={user.rank_tier || 'Seedling'} />
                    </div>
                </div>
            </ClayCard>

            <AnimatePresence>
                {isEditingAvatar && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <ClayCard>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-center">Choose Your Character</h3>
                                <ClayButton onClick={() => setIsEditingAvatar(false)} className="bg-gray-200">
                                    <X className="w-4 h-4"/>
                                </ClayButton>
                            </div>
                            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                                {availableAvatars.map(character => (
                                    <button 
                                        key={character.id} 
                                        onClick={() => handleAvatarChange(character.id)}
                                        className={`w-16 h-16 rounded-2xl clay-button flex flex-col items-center justify-center text-2xl transition-all relative ${
                                            user.avatar === character.id ? 'clay-button active bg-blue-200' : ''
                                        }`}
                                        title={character.name}
                                    >
                                        {character.emoji}
                                        {character.id.startsWith('premium_') && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-white">
                                                <Star className="w-2 h-2 text-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-4">
                                Click on a character to select it. ⭐ Premium avatars purchased from shop
                            </p>
                        </ClayCard>
                    </motion.div>
                )}
            </AnimatePresence>

            <ClayCard>
                <h3 className="text-lg font-bold mb-4 text-center">Rank Progress</h3>
                <XPProgressBar currentXP={user.xp_total || 0} currentRank={user.rank_tier || 'Seedling'} />
            </ClayCard>

            <ClayCard>
                <h3 className="text-lg font-bold mb-4 text-center">My Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 rounded-lg clay-shadow-inset bg-blue-100">
                        <Coins className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{user.coins || 0}</p>
                        <p className="text-sm text-gray-600">Coins</p>
                    </div>
                    <div className="p-4 rounded-lg clay-shadow-inset bg-yellow-100">
                        <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{user.stars || 0}</p>
                        <p className="text-sm text-gray-600">Stars</p>
                    </div>
                     <div className="p-4 rounded-lg clay-shadow-inset bg-green-100">
                        <BarChart className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{user.quizzes_completed || 0}</p>
                        <p className="text-sm text-gray-600">Quizzes</p>
                    </div>
                    <div className="p-4 rounded-lg clay-shadow-inset bg-red-100">
                        <Calendar className="w-8 h-8 text-red-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{user.daily_streak || 0}</p>
                        <p className="text-sm text-gray-600">Streak</p>
                    </div>
                </div>
            </ClayCard>
            
            <ClayCard>
                <h3 className="text-lg font-bold mb-4 text-center">Season Stats</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 rounded-lg clay-shadow-inset bg-purple-100">
                        <Star className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{user.season_xp || 0}</p>
                        <p className="text-sm text-gray-600">Season XP</p>
                    </div>
                    <div className="p-4 rounded-lg clay-shadow-inset bg-indigo-100">
                        <Award className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{user.xp_total || 0}</p>
                        <p className="text-sm text-gray-600">Total XP</p>
                    </div>
                </div>
            </ClayCard>

            <ClayCard className="bg-yellow-50">
                <h3 className="text-lg font-bold mb-4 text-center flex items-center justify-center gap-2">
                    <Shield className="w-6 h-6 text-yellow-600" />
                    Bible Study
                </h3>
                <ClayButton 
                    onClick={() => navigate(createPageUrl('BibleFavorites'))}
                    className="w-full bg-yellow-200 text-yellow-800 mb-2"
                >
                    View My Favorite Verses
                </ClayButton>
                <ClayButton 
                    onClick={() => navigate(createPageUrl('BibleReader'))}
                    className="w-full bg-blue-200 text-blue-800"
                >
                    Continue Reading
                </ClayButton>
            </ClayCard>
        </div>
    );
}
