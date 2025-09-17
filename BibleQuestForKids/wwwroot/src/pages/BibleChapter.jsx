import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BibleVerse } from '@/api/entities';
import { FavoriteVerse } from '@/api/entities';
import { User } from '@/api/entities';
import { ArrowLeft, ArrowRight, Play, Pause, Heart, HeartIcon, Volume2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';

const ClayButton = ({ children, className, ...props }) => (
    <button className={`clay-button px-4 py-2 rounded-xl font-bold ${className}`} {...props}>
        {children}
    </button>
);

export default function BibleChapterPage() {
    const navigate = useNavigate();
    const [verses, setVerses] = useState([]);
    const [favorites, setFavorites] = useState(new Set());
    const [isPlaying, setIsPlaying] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const audioRef = useRef(null);

    const urlParams = new URLSearchParams(window.location.search);
    const book = urlParams.get('book') || 'Genesis';
    const chapter = parseInt(urlParams.get('chapter')) || 1;

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const currentUser = await User.me();
                setUser(currentUser);

                // Load verses for this chapter
                const chapterVerses = await BibleVerse.filter({ book, chapter });
                
                // If no verses found, create sample verses
                if (chapterVerses.length === 0) {
                    await createSampleVerses(book, chapter);
                    const newVerses = await BibleVerse.filter({ book, chapter });
                    setVerses(newVerses);
                } else {
                    setVerses(chapterVerses);
                }

                // Load user's favorites for this chapter
                const userFavorites = await FavoriteVerse.filter({ 
                    user_id: currentUser.id, 
                    book, 
                    chapter 
                });
                setFavorites(new Set(userFavorites.map(f => f.verse)));

            } catch (error) {
                console.error('Error loading chapter data:', error);
                // Create sample data if user not logged in
                await createSampleVerses(book, chapter);
                const sampleVerses = await BibleVerse.filter({ book, chapter });
                setVerses(sampleVerses);
            }
            setIsLoading(false);
        };

        loadData();
    }, [book, chapter]);

    const createSampleVerses = async (bookName, chapterNum) => {
        // Create sample verses for demonstration
        const sampleVerses = [
            { book: bookName, chapter: chapterNum, verse: 1, text: "In the beginning God created the heavens and the earth.", testament: "OT" },
            { book: bookName, chapter: chapterNum, verse: 2, text: "Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.", testament: "OT" },
            { book: bookName, chapter: chapterNum, verse: 3, text: "And God said, 'Let there be light,' and there was light.", testament: "OT" },
            { book: bookName, chapter: chapterNum, verse: 4, text: "God saw that the light was good, and he separated the light from the darkness.", testament: "OT" },
            { book: bookName, chapter: chapterNum, verse: 5, text: "God called the light 'day,' and the darkness he called 'night.' And there was evening, and there was morning—the first day.", testament: "OT" }
        ];

        for (const verse of sampleVerses) {
            try {
                await BibleVerse.create(verse);
            } catch (e) {
                // Verse might already exist
            }
        }
    };

    const toggleFavorite = async (verseNum, verseText) => {
        if (!user) return;

        try {
            if (favorites.has(verseNum)) {
                // Remove from favorites
                const existing = await FavoriteVerse.filter({
                    user_id: user.id,
                    book,
                    chapter,
                    verse: verseNum
                });
                if (existing.length > 0) {
                    await FavoriteVerse.delete(existing[0].id);
                }
                setFavorites(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(verseNum);
                    return newSet;
                });
            } else {
                // Add to favorites
                await FavoriteVerse.create({
                    user_id: user.id,
                    book,
                    chapter,
                    verse: verseNum,
                    verse_text: verseText
                });
                setFavorites(prev => new Set([...prev, verseNum]));
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    };

    const toggleAudio = () => {
        if (isPlaying) {
            // Pause audio
            if (audioRef.current) {
                audioRef.current.pause();
            }
            setIsPlaying(false);
        } else {
            // Play audio (simulated - in real app would use actual audio API)
            setIsPlaying(true);
            // Simulate audio playing
            setTimeout(() => {
                setIsPlaying(false);
            }, 10000); // 10 second sample
        }
    };

    const navigateChapter = (direction) => {
        const newChapter = chapter + direction;
        if (newChapter >= 1) {
            navigate(createPageUrl(`BibleChapter?book=${encodeURIComponent(book)}&chapter=${newChapter}`));
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading chapter...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6 pb-32 md:pb-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(createPageUrl('BibleReader'))} className="clay-button p-2">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-800">{book} {chapter}</h1>
                </div>
                <ClayButton onClick={toggleAudio} className={`${isPlaying ? 'bg-red-200' : 'bg-blue-200'}`}>
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    <Volume2 className="w-4 h-4 ml-2" />
                </ClayButton>
            </div>

            {/* Audio Player */}
            <audio ref={audioRef} style={{ display: 'none' }}>
                {/* In a real app, this would be the actual audio URL */}
                <source src={`/audio/${book}_${chapter}.mp3`} type="audio/mpeg" />
            </audio>

            {/* Navigation */}
            <div className="flex justify-between items-center clay-card p-4">
                <ClayButton 
                    onClick={() => navigateChapter(-1)}
                    disabled={chapter <= 1}
                    className="bg-gray-200"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                </ClayButton>
                <span className="font-bold text-gray-700">Chapter {chapter}</span>
                <ClayButton 
                    onClick={() => navigateChapter(1)}
                    className="bg-gray-200"
                >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                </ClayButton>
            </div>

            {/* Verses */}
            <div className="space-y-4">
                {verses.map(verse => (
                    <motion.div
                        key={verse.verse}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: verse.verse * 0.1 }}
                        className={`p-4 rounded-xl clay-card relative ${
                            favorites.has(verse.verse) ? 'bg-yellow-100 border-2 border-yellow-300' : ''
                        }`}
                    >
                        <div className="flex gap-4">
                            <div className="flex-shrink-0">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-bold">
                                    {verse.verse}
                                </span>
                            </div>
                            <div className="flex-1">
                                <p className="text-lg leading-relaxed text-gray-800 mb-2">
                                    {verse.text}
                                </p>
                                {user && (
                                    <button
                                        onClick={() => toggleFavorite(verse.verse, verse.text)}
                                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                                            favorites.has(verse.verse) 
                                                ? 'text-red-600 hover:text-red-700' 
                                                : 'text-gray-500 hover:text-red-500'
                                        }`}
                                    >
                                        <Heart 
                                            className={`w-4 h-4 ${favorites.has(verse.verse) ? 'fill-current' : ''}`}
                                        />
                                        {favorites.has(verse.verse) ? 'Remove from favorites' : 'Add to favorites'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {verses.length === 0 && (
                <div className="text-center py-8 clay-card">
                    <p className="text-gray-500 text-lg">No verses found for this chapter.</p>
                    <p className="text-sm text-gray-400 mt-2">This chapter may not be available yet.</p>
                </div>
            )}
        </div>
    );
}