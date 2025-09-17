import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FavoriteVerse } from '@/api/entities';
import { User } from '@/api/entities';
import { ArrowLeft, Heart, BookOpen, Trash2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

const ClayCard = ({ children, className, ...props }) => (
    <div className={`p-4 rounded-2xl clay-card ${className}`} {...props}>
        {children}
    </div>
);

const ClayButton = ({ children, className, ...props }) => (
    <button className={`clay-button px-3 py-2 rounded-lg font-medium ${className}`} {...props}>
        {children}
    </button>
);

export default function BibleFavoritesPage() {
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState([]);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadFavorites = async () => {
            setIsLoading(true);
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                const userFavorites = await FavoriteVerse.filter({ user_id: currentUser.id }, '-created_date');
                setFavorites(userFavorites);
            } catch (error) {
                console.error('Error loading favorites:', error);
                navigate(createPageUrl('BibleReader'));
            }
            setIsLoading(false);
        };

        loadFavorites();
    }, [navigate]);

    const removeFavorite = async (favoriteId) => {
        try {
            await FavoriteVerse.delete(favoriteId);
            setFavorites(prev => prev.filter(f => f.id !== favoriteId));
        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    };

    const goToVerse = (book, chapter) => {
        navigate(createPageUrl(`BibleChapter?book=${encodeURIComponent(book)}&chapter=${chapter}`));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading favorites...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(createPageUrl('BibleReader'))} className="clay-button p-2">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <Heart className="w-8 h-8 text-red-500" />
                    My Favorites
                </h1>
            </div>

            {favorites.length === 0 ? (
                <ClayCard className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-600 mb-2">No favorites yet</h2>
                    <p className="text-gray-500 mb-6">Start reading the Bible and tap the heart icon to save your favorite verses!</p>
                    <ClayButton 
                        onClick={() => navigate(createPageUrl('BibleReader'))}
                        className="bg-blue-200 text-blue-800"
                    >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Start Reading
                    </ClayButton>
                </ClayCard>
            ) : (
                <div className="space-y-4">
                    {favorites.map((favorite, index) => (
                        <motion.div
                            key={favorite.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <ClayCard className="bg-yellow-50 border-l-4 border-yellow-400">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold text-blue-800">
                                                {favorite.book} {favorite.chapter}:{favorite.verse}
                                            </span>
                                        </div>
                                        <p className="text-gray-800 leading-relaxed mb-3">
                                            {favorite.verse_text}
                                        </p>
                                        {favorite.notes && (
                                            <div className="bg-white/50 p-2 rounded-lg mb-3">
                                                <p className="text-sm text-gray-600 italic">{favorite.notes}</p>
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <ClayButton
                                                onClick={() => goToVerse(favorite.book, favorite.chapter)}
                                                className="bg-blue-200 text-blue-800 text-sm"
                                            >
                                                <BookOpen className="w-3 h-3 mr-1" />
                                                Read Chapter
                                            </ClayButton>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFavorite(favorite.id)}
                                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                                        title="Remove favorite"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </ClayCard>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}