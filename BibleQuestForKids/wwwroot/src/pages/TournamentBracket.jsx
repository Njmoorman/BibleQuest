import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Tournament } from '@/api/entities';
import { TournamentBracket as BracketEntity } from '@/api/entities';
import { TournamentParticipant } from '@/api/entities';
import { User } from '@/api/entities';
import _ from 'lodash';
import { Loader2, ArrowLeft, Trophy } from 'lucide-react';
import { createPageUrl } from '@/utils';

const PlayerCard = ({ player, isWinner }) => {
    if (!player) return <div className="h-10 bg-gray-200 rounded-lg clay-shadow-inset" />;
    return (
        <div className={`h-10 flex items-center px-3 rounded-lg ${isWinner ? 'font-bold bg-yellow-200' : 'bg-white'}`}>
             {player.nickname}
        </div>
    )
};

export default function TournamentBracketPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const tournamentId = new URLSearchParams(location.search).get('id');
    const [bracketData, setBracketData] = useState([]);
    const [players, setPlayers] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!tournamentId) return;
            const [brackets, participants] = await Promise.all([
                BracketEntity.filter({ tournament_id: tournamentId }),
                TournamentParticipant.filter({ tournament_id: tournamentId })
            ]);
            const playerIds = _.uniq(participants.map(p => p.player_id));
            const users = await User.filter({ id: { '$in': playerIds }});
            const userMap = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
            
            setBracketData(_.groupBy(brackets, 'round'));
            setPlayers(userMap);
            setIsLoading(false);
        };
        fetchData();
    }, [tournamentId]);

    if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin w-12 h-12"/></div>

    return (
        <div className="p-4">
             <button onClick={() => navigate(createPageUrl('TournamentLobby'))} className="flex items-center gap-2 clay-button mb-4">
                <ArrowLeft /> Back to Lobby
            </button>
            <h1 className="text-3xl font-bold text-center mb-8">Tournament Bracket</h1>
            <div className="flex gap-4 overflow-x-auto p-4">
                {Object.entries(bracketData).map(([round, matches]) => (
                    <div key={round} className="flex flex-col gap-8 flex-shrink-0">
                        <h2 className="text-xl font-bold text-center">Round {round}</h2>
                        <div className="space-y-12">
                            {matches.map(match => (
                                <div key={match.id} className="relative">
                                    <div className="space-y-2">
                                       <PlayerCard player={players[match.player_A_id]} isWinner={match.winner_id === match.player_A_id} />
                                       <PlayerCard player={players[match.player_B_id]} isWinner={match.winner_id === match.player_B_id} />
                                    </div>
                                    <div className="absolute top-1/2 -right-6 w-5 h-px bg-gray-400 -translate-y-1/2" />
                                    {match.winner_id && <div className="absolute top-1/2 -right-10 w-5 h-px bg-gray-400 -translate-y-1/2"><Trophy className="w-4 h-4 text-yellow-500 absolute -top-2 -left-2"/></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}