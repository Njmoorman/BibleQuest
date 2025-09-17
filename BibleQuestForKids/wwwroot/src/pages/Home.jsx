
import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, ListOrdered, Zap, Calendar, Lock, Crown, Swords, Puzzle, Trophy, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { User } from '@/api/entities';

const ClayCard = ({ children, className, ...props }) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ y: 1, scale: 0.98 }}
    className={`
      p-4 md:p-6 rounded-3xl text-center font-bold
      clay-card cursor-pointer
      ${className}
    `}
    {...props}
  >
    {children}
  </motion.div>
);

const quizModes = [
    {
        title: "Commandments",
        icon: "⚖️",
        gradient: "bg-gradient-to-br from-blue-300 to-blue-400",
        description: "Learn the 10 Commandments",
        link: createPageUrl(`Quiz?mode=commandments&book=Commandments`)
    },
    {
        title: "Bible Books",
        icon: "📖",
        gradient: "bg-gradient-to-br from-green-300 to-green-400",
        description: "Explore books of the Bible",
        link: createPageUrl('BookSelection')
    },
    {
        title: "Minigames",
        icon: <Gamepad2/>,
        gradient: "bg-gradient-to-br from-pink-300 to-pink-400",
        description: "Fun Bible mini-games!",
        link: createPageUrl('Minigames')
    },
    {
        title: "Online Bible",
        icon: "📜",
        gradient: "bg-gradient-to-br from-amber-300 to-yellow-400",
        description: "Read and study Scripture!",
        link: createPageUrl('BibleReader')
    },
];

const secondaryModes = [
    {
        title: "Daily Challenge",
        icon: Calendar,
        gradient: "from-purple-300 to-purple-400",
        description: "A special mix of questions!",
        link: 'daily_challenge',
    },
    {
        title: "Leaderboards",
        icon: Crown,
        gradient: "from-yellow-300 to-amber-400",
        description: "See how you rank!",
        link: createPageUrl('Leaderboard')
    },
    {
        title: "Tournaments",
        icon: Trophy,
        gradient: "from-indigo-300 to-indigo-400",
        description: "Compete in daily brackets!",
        link: createPageUrl('TournamentLobby')
    },
    {
        title: "Duels",
        icon: Swords, // Changed from <Swords/> to Swords
        gradient: "from-red-300 to-red-400",
        description: "Challenge other players!",
        link: createPageUrl('DuelsLobby')
    }
];

export default function Home() {
    const navigate = useNavigate();
    const [dailyChallengeAvailable, setDailyChallengeAvailable] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkDailyChallenge = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                const lastPlayed = currentUser.last_daily_challenge;
                if (lastPlayed) {
                    const lastDate = new Date(lastPlayed);
                    const now = new Date();
                    const diffHours = (now - lastDate) / (1000 * 60 * 60);
                    if (diffHours < 24) {
                        setDailyChallengeAvailable(false);
                    }
                }
            } catch (e) {
                // Not logged in
            }
        };
        checkDailyChallenge();
    }, []);

    const handleSecondaryModeClick = (mode) => {
        if (mode.link === 'daily_challenge') {
            if (dailyChallengeAvailable) {
                navigate(createPageUrl('Quiz?mode=daily'));
            } else {
                alert("You've already completed the Daily Challenge today! Come back tomorrow.");
            }
        } else {
            navigate(mode.link);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            {user ? (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="clay-card p-4 text-center"
                >
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">Welcome, {user.nickname || user.full_name?.split(' ')[0] || 'Adventurer'}!</h2>
                    <p className="text-sm md:text-base text-gray-600 mt-1">Ready for your next quest?</p>
                </motion.div>
            ) : (
                 <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="clay-card p-4 text-center"
                >
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800">Welcome to Bible Quest!</h2>
                    <p className="text-sm md:text-base text-gray-600 mt-1">Log in to save your progress and compete!</p>
                </motion.div>
            )}

            <div className="grid grid-cols-2 gap-4">
                {quizModes.map((mode, index) => (
                    <Link to={mode.link} key={mode.title}>
                        <ClayCard
                            style={{ animationDelay: `${index * 0.1}s` }}
                            className="h-full flex flex-col justify-center items-center"
                        >
                            <div className={`mx-auto w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center clay-shadow-inset mb-3 ${mode.gradient}`}>
                                <span className="text-3xl md:text-4xl">{typeof mode.icon === 'string' ? mode.icon : React.cloneElement(mode.icon, { className: "w-10 h-10 md:w-12 md:h-12 text-white"})}</span>
                            </div>
                            <h3 className="text-base md:text-lg text-gray-700">{mode.title}</h3>
                            <p className="hidden md:block text-xs font-normal text-gray-500 mt-1">{mode.description}</p>
                        </ClayCard>
                    </Link>
                ))}
            </div>

            <div className="w-full">
                <h3 className="text-xl font-bold text-gray-700 mb-3 px-2">More Ways to Play</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
                    {secondaryModes.map(mode => {
                        const isDailyLocked = mode.link === 'daily_challenge' && !dailyChallengeAvailable;
                        return (
                            <div key={mode.title} className="flex-shrink-0 w-40" onClick={() => handleSecondaryModeClick(mode)}>
                                <ClayCard className={`h-full ${isDailyLocked ? 'opacity-60' : ''}`}>
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center clay-shadow-inset mb-3 mx-auto bg-gradient-to-br ${isDailyLocked ? 'from-gray-300 to-gray-400' : mode.gradient}`}>
                                        {isDailyLocked ? <Lock className="w-8 h-8 text-gray-600" /> : <mode.icon className="w-8 h-8 text-white" />}
                                    </div>
                                    <h3 className="text-base text-gray-800">{mode.title}</h3>
                                    <p className="text-xs font-normal text-gray-600">
                                        {isDailyLocked ? "Come back tomorrow!" : mode.description}
                                    </p>
                                </ClayCard>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
