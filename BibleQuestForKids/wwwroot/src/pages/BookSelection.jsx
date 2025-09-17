
import React from 'react';
import { createPageUrl } from '@/utils';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const ClayCard = ({ children, className, ...props }) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ y: 1, scale: 0.98 }}
    className={`
      p-3 rounded-2xl text-center font-bold
      transition-all duration-200
      clay-button cursor-pointer
      ${className}
    `}
    {...props}
  >
    {children}
  </motion.div>
);

const OLD_TESTAMENT = [
    // Torah/Law
    { name: "Genesis", icon: "🌟", bgColor: "bg-green-100" },
    { name: "Exodus", icon: "⚡", bgColor: "bg-orange-100" },
    { name: "Leviticus", icon: "🕊️", bgColor: "bg-purple-100" },
    { name: "Numbers", icon: "🔢", bgColor: "bg-blue-100" },
    { name: "Deuteronomy", icon: "📜", bgColor: "bg-yellow-100" },
    
    // Historical Books
    { name: "Joshua", icon: "⚔️", bgColor: "bg-red-100" },
    { name: "Judges", icon: "🏛️", bgColor: "bg-indigo-100" },
    { name: "Ruth", icon: "🌾", bgColor: "bg-amber-100" },
    { name: "1 Samuel", icon: "👑", bgColor: "bg-pink-100" },
    { name: "2 Samuel", icon: "🛡️", bgColor: "bg-teal-100" },
    { name: "1 Kings", icon: "🏰", bgColor: "bg-cyan-100" },
    { name: "2 Kings", icon: "🔥", bgColor: "bg-rose-100" },
    { name: "1 Chronicles", icon: "📖", bgColor: "bg-lime-100" },
    { name: "2 Chronicles", icon: "📚", bgColor: "bg-emerald-100" },
    { name: "Ezra", icon: "🔨", bgColor: "bg-violet-100" },
    { name: "Nehemiah", icon: "🧱", bgColor: "bg-fuchsia-100" },
    { name: "Esther", icon: "👸", bgColor: "bg-sky-100" },
    
    // Wisdom Literature
    { name: "Job", icon: "🤔", bgColor: "bg-slate-100" },
    { name: "Psalms", icon: "🎵", bgColor: "bg-purple-100" },
    { name: "Proverbs", icon: "💡", bgColor: "bg-indigo-100" },
    { name: "Ecclesiastes", icon: "⏰", bgColor: "bg-gray-100" },
    { name: "Song of Solomon", icon: "❤️", bgColor: "bg-pink-100" },
    
    // Major Prophets
    { name: "Isaiah", icon: "🌅", bgColor: "bg-orange-100" },
    { name: "Jeremiah", icon: "😢", bgColor: "bg-blue-100" },
    { name: "Lamentations", icon: "💧", bgColor: "bg-cyan-100" },
    { name: "Ezekiel", icon: "👁️", bgColor: "bg-green-100" },
    { name: "Daniel", icon: "🦁", bgColor: "bg-yellow-100" },
    
    // Minor Prophets
    { name: "Hosea", icon: "💕", bgColor: "bg-red-100" },
    { name: "Joel", icon: "🦗", bgColor: "bg-lime-100" },
    { name: "Amos", icon: "⚖️", bgColor: "bg-amber-100" },
    { name: "Obadiah", icon: "📢", bgColor: "bg-teal-100" },
    { name: "Jonah", icon: "🐋", bgColor: "bg-blue-100" },
    { name: "Micah", icon: "🏔️", bgColor: "bg-stone-100" },
    { name: "Nahum", icon: "⚡", bgColor: "bg-orange-100" },
    { name: "Habakkuk", icon: "❓", bgColor: "bg-purple-100" },
    { name: "Zephaniah", icon: "🔥", bgColor: "bg-red-100" },
    { name: "Haggai", icon: "🏗️", bgColor: "bg-yellow-100" },
    { name: "Zechariah", icon: "🌟", bgColor: "bg-emerald-100" },
    { name: "Malachi", icon: "📬", bgColor: "bg-indigo-100" }
];

const NEW_TESTAMENT = [
    // Gospels
    { name: "Matthew", icon: "📖", bgColor: "bg-blue-100" },
    { name: "Mark", icon: "🦁", bgColor: "bg-orange-100" },
    { name: "Luke", icon: "👨‍⚕️", bgColor: "bg-green-100" },
    { name: "John", icon: "🦅", bgColor: "bg-purple-100" },
    
    // History
    { name: "Acts", icon: "🔥", bgColor: "bg-red-100" },
    
    // Paul's Letters
    { name: "Romans", icon: "🏛️", bgColor: "bg-indigo-100" },
    { name: "1 Corinthians", icon: "⛪", bgColor: "bg-teal-100" },
    { name: "2 Corinthians", icon: "💌", bgColor: "bg-pink-100" },
    { name: "Galatians", icon: "🗝️", bgColor: "bg-amber-100" },
    { name: "Ephesians", icon: "🛡️", bgColor: "bg-cyan-100" },
    { name: "Philippians", icon: "😊", bgColor: "bg-yellow-100" },
    { name: "Colossians", icon: "👑", bgColor: "bg-purple-100" },
    { name: "1 Thessalonians", icon: "📯", bgColor: "bg-lime-100" },
    { name: "2 Thessalonians", icon: "⏰", bgColor: "bg-orange-100" },
    { name: "1 Timothy", icon: "👨‍🏫", bgColor: "bg-emerald-100" },
    { name: "2 Timothy", icon: "🔥", bgColor: "bg-red-100" },
    { name: "Titus", icon: "🏝️", bgColor: "bg-blue-100" },
    { name: "Philemon", icon: "🤝", bgColor: "bg-rose-100" },
    
    // General Letters
    { name: "Hebrews", icon: "🎪", bgColor: "bg-violet-100" },
    { name: "James", icon: "⚖️", bgColor: "bg-stone-100" },
    { name: "1 Peter", icon: "🪨", bgColor: "bg-gray-100" },
    { name: "2 Peter", icon: "⚠️", bgColor: "bg-orange-100" },
    { name: "1 John", icon: "❤️", bgColor: "bg-pink-100" },
    { name: "2 John", icon: "💕", bgColor: "bg-rose-100" },
    { name: "3 John", icon: "🤗", bgColor: "bg-fuchsia-100" },
    { name: "Jude", icon: "⚔️", bgColor: "bg-red-100" },
    
    // Prophecy
    { name: "Revelation", icon: "👁️", bgColor: "bg-yellow-100" }
];

export default function BookSelectionPage() {
    const navigate = useNavigate();
    
    return (
        <div className="p-4">
            <button onClick={() => navigate(createPageUrl('Home'))} className="flex items-center gap-2 mb-6 clay-button p-2">
                <ArrowLeft />
                <span className="font-bold">Back</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Select a Book</h1>
            
            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">Old Testament</h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {OLD_TESTAMENT.map(book => (
                            <Link to={createPageUrl(`Quiz?mode=books&book=${encodeURIComponent(book.name)}`)} key={book.name}>
                                <ClayCard className="h-full">
                                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center clay-shadow-inset mb-2 ${book.bgColor}`}>
                                        <span className="text-xl">{book.icon}</span>
                                    </div>
                                    <h3 className="text-xs sm:text-sm text-gray-700 leading-tight">{book.name}</h3>
                                </ClayCard>
                            </Link>
                        ))}
                    </div>
                </div>
                
                <div>
                    <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">New Testament</h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {NEW_TESTAMENT.map(book => (
                            <Link to={createPageUrl(`Quiz?mode=books&book=${encodeURIComponent(book.name)}`)} key={book.name}>
                                <ClayCard className="h-full">
                                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center clay-shadow-inset mb-2 ${book.bgColor}`}>
                                        <span className="text-xl">{book.icon}</span>
                                    </div>
                                    <h3 className="text-xs sm:text-sm text-gray-700 leading-tight">{book.name}</h3>
                                </ClayCard>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
