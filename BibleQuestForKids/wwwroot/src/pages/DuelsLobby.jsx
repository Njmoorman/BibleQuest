
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DuelsMatch } from '@/api/entities';
import { User } from '@/api/entities';
import { Swords, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

const ClayCard = ({ children, className, ...props }) => (
  <div className={`p-8 rounded-3xl text-center font-bold clay-card ${className}`} {...props}>
    {children}
  </div>
);

const ClayButton = ({ children, className, ...props }) => (
  <button className={`p-4 rounded-2xl font-bold text-lg text-gray-700 clay-button w-full ${className}`} {...props}>
    {children}
  </button>
);

export default function DuelsLobbyPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchFormat, setSearchFormat] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
            } catch (e) {
                navigate(createPageUrl('Home')); // Redirect if not logged in
            }
        };
        fetchUser();
    }, [navigate]);

    const handleFindMatch = async (format) => {
        if (!user || isSearching) return;

        setIsSearching(true);
        setSearchFormat(format);

        try {
            // Find an existing match waiting for players
            const waitingMatches = await DuelsMatch.filter({
                format: format,
                status: 'waiting'
            }, '-created_date', 1);

            let match;
            if (waitingMatches.length > 0) {
                // Join existing match
                match = waitingMatches[0];
                const requiredPlayers = format === '1v1' ? 2 : 4;
                if (match.player_ids.length < requiredPlayers && !match.player_ids.includes(user.id)) {
                    const newPlayerIds = [...match.player_ids, user.id];
                    const updatedData = { player_ids: newPlayerIds };

                    if (newPlayerIds.length === requiredPlayers) {
                       updatedData.status = 'in_progress';
                       // Assign teams
                       const teamA = [newPlayerIds[0]];
                       const teamB = [newPlayerIds[1]];
                       if (format === '2v2') {
                           teamA.push(newPlayerIds[2]);
                           teamB.push(newPlayerIds[3]);
                       }
                       updatedData.team_A_player_ids = teamA;
                       updatedData.team_B_player_ids = teamB;
                    }
                    
                    await DuelsMatch.update(match.id, updatedData);
                    match = { ...match, ...updatedData };
                }
            } else {
                // Create a new match
                match = await DuelsMatch.create({
                    format: format,
                    player_ids: [user.id],
                    last_activity_timestamps: { [user.id]: Date.now() },
                });
            }

            // Poll for match start
            const interval = setInterval(async () => {
                const updatedMatch = await DuelsMatch.get(match.id);
                if (updatedMatch.status === 'in_progress') {
                    clearInterval(interval);
                    setIsSearching(false);
                    navigate(createPageUrl(`Duel?matchId=${match.id}`));
                } else if (updatedMatch.status === 'cancelled') {
                    clearInterval(interval);
                    setIsSearching(false);
                    alert("Match cancelled.");
                }
            }, 3000);

            // Timeout after 60 seconds
            setTimeout(() => {
                clearInterval(interval);
                if (isSearching) {
                    setIsSearching(false);
                    alert("Could not find a match. Please try again.");
                    // Optionally cancel the match if we created it
                    // DuelsMatch.update(match.id, { status: 'cancelled' });
                }
            }, 60000);

        } catch (error) {
            console.error("Error finding match:", error);
            setIsSearching(false);
            alert("An error occurred while finding a match.");
        }
    };

    if (isSearching) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <ClayCard>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Searching for {searchFormat} match...</h2>
                    <Loader2 className="w-16 h-16 animate-spin text-purple-500 mx-auto" />
                    <p className="text-gray-600 mt-4">Please wait while we find opponents for you.</p>
                </ClayCard>
            </div>
        );
    }

    return (
        <div className="p-4 flex flex-col items-center">
             <button onClick={() => navigate(createPageUrl('Home'))} className="flex items-center gap-2 mb-8 clay-button p-3 self-start">
                <ArrowLeft />
                <span className="font-bold">Back</span>
            </button>
            <h1 className="text-4xl font-bold text-gray-800 text-center mb-8">Choose Your Duel</h1>
            <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
                <ClayCard>
                    <Swords className="w-20 h-20 mx-auto text-red-500 mb-4" />
                    <h2 className="text-3xl text-gray-800 mb-6">1 vs 1</h2>
                    <ClayButton onClick={() => handleFindMatch('1v1')}>Find Match</ClayButton>
                </ClayCard>
                <ClayCard>
                    <Users className="w-20 h-20 mx-auto text-blue-500 mb-4" />
                    <h2 className="text-3xl text-gray-800 mb-6">2 vs 2</h2>
                    <ClayButton onClick={() => handleFindMatch('2v2')}>Find Match</ClayButton>
                </ClayCard>
            </div>
        </div>
    );
}
