
import React from 'react';
import { createPageUrl } from '@/utils';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Gamepad2, Puzzle, Image, Smile, Grid3X3, Book, Building, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const ClayCard = ({ children, className, ...props }) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ y: 1, scale: 0.98 }}
    className={`
      p-4 rounded-2xl text-center font-bold
      clay-card cursor-pointer
      ${className}
    `}
    {...props}
  >
    {children}
  </motion.div>
);

const minigames = [
    {
        title: "Verse Match",
        icon: <Puzzle className="w-12 h-12 text-white" />,
        gradient: "bg-gradient-to-br from-teal-300 to-teal-400",
        description: "Match verses with references!",
        link: createPageUrl('VerseMatch'),
        difficulty: "Easy"
    },
    {
        title: "Verse Jigsaw",
        icon: <Puzzle className="w-12 h-12 text-white" />,
        gradient: "bg-gradient-to-br from-blue-300 to-blue-400",
        description: "Piece together Bible verses!",
        link: createPageUrl('VerseJigsaw'),
        difficulty: "Medium"
    },
    {
        title: "Picture Match",
        icon: <Image className="w-12 h-12 text-white" />,
        gradient: "bg-gradient-to-br from-green-300 to-green-400",
        description: "Match characters with symbols!",
        link: createPageUrl('PictureMatch'),
        difficulty: "Easy"
    },
    {
        title: "Emoji Verse",
        icon: <Smile className="w-12 h-12 text-white" />,
        gradient: "bg-gradient-to-br from-yellow-300 to-yellow-400",
        description: "Guess words from emoji clues!",
        link: createPageUrl('EmojiVerse'),
        difficulty: "Medium"
    },
    {
        title: "Bible Bingo",
        icon: <Grid3X3 className="w-12 h-12 text-white" />,
        gradient: "bg-gradient-to-br from-purple-300 to-purple-400",
        description: "Mark off Bible items on your card!",
        link: createPageUrl('BibleBingo'),
        difficulty: "Easy"
    },
    {
        title: "Wise Wordle",
        icon: <Book className="w-12 h-12 text-white" />,
        gradient: "bg-gradient-to-br from-indigo-300 to-indigo-400",
        description: "Guess the secret Bible word!",
        link: createPageUrl('WiseWordle'),
        difficulty: "Hard"
    },
    {
        title: "Trivia Tower",
        icon: <Building className="w-12 h-12 text-white" />,
        gradient: "bg-gradient-to-br from-orange-300 to-orange-400",
        description: "Stack blocks with right answers!",
        link: createPageUrl('TriviaTower'),
        difficulty: "Medium"
    },
    {
        title: "Capture the Verse",
        icon: <Target className="w-12 h-12 text-white" />,
        gradient: "bg-gradient-to-br from-red-300 to-red-400",
        description: "Race to complete verses!",
        link: createPageUrl('CaptureVerseLobby'),
        difficulty: "Hard"
    }
];

const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
        case 'Easy': return 'text-green-600';
        case 'Medium': return 'text-yellow-600';
        case 'Hard': return 'text-red-600';
        default: return 'text-gray-600';
    }
};

export default function MinigamesPage() {
    const navigate = useNavigate();
    
    return (
        <div className="p-4">
            <button onClick={() => navigate(createPageUrl('Home'))} className="flex items-center gap-2 mb-6 clay-button p-2">
                <ArrowLeft />
                <span className="font-bold">Back</span>
            </button>
            
            <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <Gamepad2 className="w-10 h-10 text-purple-600" />
                    <h1 className="text-4xl font-bold text-gray-800">Minigames</h1>
                </div>
                <p className="text-lg text-gray-600">Fun Bible games to play and learn!</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
                {minigames.map((game, index) => (
                    <Link to={game.link} key={game.title}>
                        <ClayCard
                            style={{ animationDelay: `${index * 0.1}s` }}
                            className="h-full flex flex-col justify-between"
                        >
                            <div>
                                <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center clay-shadow-inset mb-3 ${game.gradient}`}>
                                    {game.icon}
                                </div>
                                <h3 className="text-lg text-gray-700 mb-2">{game.title}</h3>
                                <p className="text-xs font-normal text-gray-500 mb-3">{game.description}</p>
                            </div>
                            <div className={`text-xs font-bold ${getDifficultyColor(game.difficulty)}`}>
                                {game.difficulty}
                            </div>
                        </ClayCard>
                    </Link>
                ))}
            </div>
            
            <div className="mt-8 clay-card p-6 text-center bg-gradient-to-r from-blue-50 to-purple-50">
                <h3 className="text-xl font-bold text-gray-800 mb-2">🎮 Game Rules</h3>
                <p className="text-gray-600 text-sm">
                    All games are 1-3 minutes long • Earn coins and XP for playing • Kid-friendly and fun!
                </p>
            </div>
        </div>
    );
}
