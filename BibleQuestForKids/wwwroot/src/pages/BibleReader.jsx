import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BibleVerse } from '@/api/entities';
import { User } from '@/api/entities';
import { Search, BookOpen, ArrowLeft, Heart } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

const ClayCard = ({ children, className, ...props }) => (
    <div className={`p-4 rounded-2xl clay-card ${className}`} {...props}>
        {children}
    </div>
);

const ClayButton = ({ children, className, ...props }) => (
    <button className={`clay-button px-4 py-2 rounded-xl font-bold ${className}`} {...props}>
        {children}
    </button>
);

const BIBLE_BOOKS = {
    "Old Testament": [
        "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
        "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings",
        "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther",
        "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon",
        "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel",
        "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
        "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"
    ],
    "New Testament": [
        "Matthew", "Mark", "Luke", "John", "Acts",
        "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
        "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
        "1 Timothy", "2 Timothy", "Titus", "Philemon",
        "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude",
        "Revelation"
    ]
};

// Sample chapter counts for each book (simplified)
const CHAPTER_COUNTS = {
    "Genesis": 50, "Exodus": 40, "Matthew": 28, "Mark": 16, "Luke": 24, "John": 21,
    "Psalms": 150, "Proverbs": 31, "Isaiah": 66, "Jeremiah": 52, "Acts": 28,
    "Romans": 16, "1 Corinthians": 16, "Revelation": 22
    // Add more as needed
};

export default function BibleReaderPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        User.me().then(setUser).catch(() => {});
    }, []);

    const filteredBooks = searchTerm 
        ? Object.entries(BIBLE_BOOKS).reduce((acc, [testament, books]) => {
            const filtered = books.filter(book => 
                book.toLowerCase().includes(searchTerm.toLowerCase())
            );
            if (filtered.length > 0) {
                acc[testament] = filtered;
            }
            return acc;
        }, {})
        : BIBLE_BOOKS;

    const handleBookSelect = (book) => {
        navigate(createPageUrl(`BibleChapter?book=${encodeURIComponent(book)}&chapter=1`));
    };

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(createPageUrl('Home'))} className="clay-button p-2">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-amber-600" />
                    Online Bible
                </h1>
            </div>

            <ClayCard>
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                        type="text"
                        placeholder="Search for a book..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 clay-input text-lg"
                    />
                </div>
            </ClayCard>

            {user && (
                <ClayCard className="bg-yellow-50">
                    <div className="flex items-center gap-3 mb-2">
                        <Heart className="w-6 h-6 text-red-500" />
                        <h3 className="text-lg font-bold text-gray-800">My Favorites</h3>
                    </div>
                    <ClayButton 
                        onClick={() => navigate(createPageUrl('BibleFavorites'))}
                        className="w-full bg-yellow-200 text-yellow-800"
                    >
                        View Favorite Verses
                    </ClayButton>
                </ClayCard>
            )}

            {Object.entries(filteredBooks).map(([testament, books]) => (
                <ClayCard key={testament}>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                        {testament}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {books.map(book => (
                            <motion.button
                                key={book}
                                onClick={() => handleBookSelect(book)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="p-3 rounded-xl clay-button text-left"
                            >
                                <div className="font-bold text-gray-800">{book}</div>
                                <div className="text-sm text-gray-500">
                                    {CHAPTER_COUNTS[book] || '??'} chapters
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </ClayCard>
            ))}

            {Object.keys(filteredBooks).length === 0 && (
                <ClayCard className="text-center py-8">
                    <p className="text-gray-500 text-lg">No books found matching "{searchTerm}"</p>
                </ClayCard>
            )}
        </div>
    );
}