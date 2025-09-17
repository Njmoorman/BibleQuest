import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tournament } from '@/api/entities';
import { TournamentParticipant } from '@/api/entities';
import { TournamentBracket } from '@/api/entities';
import { User } from '@/api/entities';
import { Trophy, ArrowLeft, Loader2, Users, Calendar, Play } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { format, isToday } from 'date-fns';
import _ from 'lodash';

const ClayCard = ({ children, className }) => <div className={`p-6 rounded-2xl clay-card ${className}`}>{children}</div>;
const ClayButton = ({ children, className, ...props }) => <button className={`clay-button px-4 py-2 rounded-xl font-bold ${className}`} {...props}>{children}</button>;

export default function TournamentLobbyPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [tournament, setTournament] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const loadTournamentData = useCallback(async () => {
        setIsLoading(true);
        
        // Create today's tournament if it doesn't exist and it's past 7 PM Central
        const now = new Date();
        const centralTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}));
        const tournamentTime = new Date(centralTime);
        tournamentTime.setHours(19, 0, 0, 0); // 7:00 PM Central
        
        const tournaments = await Tournament.list('-created_date', 1);
        let currentTournament = tournaments.find(t => isToday(new Date(t.start_date)));

        if (!currentTournament && centralTime >= tournamentTime) {
            // No tournament today and it's past 7 PM, create one
            currentTournament = await Tournament.create({
                name: `Daily Bracket - ${format(now, 'MMM do')}`,
                start_date: tournamentTime.toISOString(),
                status: 'registering',
                size: 0,
            });
        }
        
        if (currentTournament) {
            setTournament(currentTournament);
            const allParticipants = await TournamentParticipant.filter({ tournament_id: currentTournament.id });
            setParticipants(allParticipants);

            if (user) {
                setIsRegistered(allParticipants.some(p => p.player_id === user.id));
            }
        }
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        User.me().then(currentUser => {
            setUser(currentUser);
        }).catch(() => navigate(createPageUrl('Home')));
    }, [navigate]);

    useEffect(() => {
        if(user) {
            loadTournamentData();
        }
    }, [user, loadTournamentData]);

    const handleJoinTournament = async () => {
        if (!user || !tournament || isRegistered) return;
        
        await TournamentParticipant.create({ tournament_id: tournament.id, player_id: user.id });
        const newParticipants = [...participants, { player_id: user.id }];
        setParticipants(newParticipants);
        setIsRegistered(true);

        // Check if we have enough players to start (powers of 2)
        const requiredPlayers = [4, 8, 16]; // Valid tournament sizes
        if (requiredPlayers.includes(newParticipants.length) && tournament.status === 'registering') {
            await startTournament(tournament, newParticipants);
        }
    };
    
    const startTournament = async (tourney, currentParticipants) => {
        const participantIds = _.shuffle(currentParticipants.map(p => p.player_id));
        
        // Create Round 1
        for (let i = 0; i < participantIds.length; i += 2) {
            await TournamentBracket.create({
                tournament_id: tourney.id,
                round: 1,
                match_in_round: (i / 2) + 1,
                player_A_id: participantIds[i],
                player_B_id: participantIds[i+1],
            });
        }
        
        await Tournament.update(tourney.id, { status: 'in_progress', size: participantIds.length });
        loadTournamentData(); // Refresh state
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin w-12 h-12"/></div>
    }

    if (!tournament) {
        return (
            <div className="p-4 space-y-6">
                <button onClick={() => navigate(createPageUrl('Home'))} className="flex items-center gap-2 clay-button">
                    <ArrowLeft /> Back
                </button>
                <ClayCard className="text-center">
                    <Trophy className="w-16 h-16 mx-auto text-gray-400 mb-4"/>
                    <h1 className="text-3xl font-bold text-gray-800">No Tournament Today</h1>
                    <p className="text-gray-600">Tournaments start daily at 7:00 PM Central Time.</p>
                    <p className="text-sm text-gray-500 mt-2">Check back later!</p>
                </ClayCard>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            <button onClick={() => navigate(createPageUrl('Home'))} className="flex items-center gap-2 clay-button">
                <ArrowLeft /> Back
            </button>
            <ClayCard className="text-center">
                <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4"/>
                <h1 className="text-3xl font-bold text-gray-800">{tournament?.name || "Daily Tournament"}</h1>
                <p className="text-gray-600">Status: <span className="font-bold">{tournament?.status}</span></p>
            </ClayCard>
            
            <ClayCard>
                <div className="flex justify-around items-center">
                    <div className="text-center">
                        <Users className="w-10 h-10 mx-auto text-blue-500"/>
                        <p className="text-2xl font-bold mt-2">{participants.length}</p>
                        <p className="text-sm text-gray-500">Players Joined</p>
                    </div>
                     <div className="text-center">
                        <Calendar className="w-10 h-10 mx-auto text-green-500"/>
                        <p className="text-2xl font-bold mt-2">{format(new Date(tournament?.start_date || Date.now()), 'MMM do')}</p>
                        <p className="text-sm text-gray-500">Date</p>
                    </div>
                </div>
            </ClayCard>
            
            <div className="space-y-4">
                {tournament?.status === 'registering' && !isRegistered && (
                    <ClayButton onClick={handleJoinTournament} className="w-full bg-green-200 text-green-800 py-4">
                        <Play className="inline mr-2"/> Join Tournament
                    </ClayButton>
                )}
                 {isRegistered && (
                     <p className="text-center font-bold text-green-600 clay-card">You are registered! Waiting for more players...</p>
                 )}
                <ClayButton onClick={() => navigate(createPageUrl(`TournamentBracket?id=${tournament?.id}`))} className="w-full">
                    View Bracket
                </ClayButton>
            </div>
        </div>
    );
}