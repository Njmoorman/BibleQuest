
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DuelsMatch } from '@/api/entities';
import { DuelsTurn } from '@/api/entities';
import { User } from '@/api/entities';
import { TournamentBracket } from '@/api/entities';
import { Badge } from '@/api/entities';
import { Tournament } from '@/api/entities'; // Added for tournament updates
import { Home, RefreshCw, Trophy } from 'lucide-react'; // Replaced Crown with Trophy
import { createPageUrl } from '@/utils';
import Confetti from '../components/Confetti';
import { motion } from 'framer-motion';
import _ from 'lodash'; // Added for groupBy and shuffle

const ClayCard = ({ children, className }) => (
    <div className={`p-6 rounded-2xl clay-card ${className}`}>
        {children}
    </div>
);

const PlayerStatCard = ({ nickname, stats }) => (
    <div className="clay-shadow-inset p-4 rounded-xl bg-white/50">
        <h4 className="font-bold text-lg text-gray-800">{nickname}</h4>
        <div className="flex justify-around text-center mt-2">
            <div>
                <p className="font-bold text-xl">{stats.attempted}</p>
                <p className="text-xs text-gray-600">Answered</p>
            </div>
            <div>
                <p className="font-bold text-xl">{stats.accuracy}%</p>
                <p className="text-xs text-gray-600">Accuracy</p>
            </div>
            <div>
                <p className="font-bold text-xl">{stats.contribution}%</p>
                <p className="text-xs text-gray-600">Win Rate</p>
            </div>
        </div>
    </div>
);

export default function DuelResultsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const matchId = new URLSearchParams(location.search).get('matchId');
    const [user, setUser] = useState(null);
    const [match, setMatch] = useState(null);
    const [stats, setStats] = useState({});
    const [playerNicks, setPlayerNicks] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            if (!matchId) return;
            try {
                const currentUser = await User.me();
                setUser(currentUser);

                const matchData = await DuelsMatch.get(matchId);
                setMatch(matchData);

                // If it's a tournament match, handle advancement
                if (matchData.format === 'tournament' && matchData.tournament_bracket_id) {
                    await handleTournamentAdvancement(matchData, currentUser);
                }

                const turns = await DuelsTurn.filter({ match_id: matchId });
                
                const playerIds = matchData.player_ids;
                const fetchedUsers = await User.filter({ id: { '$in': playerIds } });
                const nicknames = fetchedUsers.reduce((acc, u) => ({ ...acc, [u.id]: u.nickname }), {});
                setPlayerNicks(nicknames);

                // Calculate stats
                const playerStats = playerIds.reduce((acc, id) => ({ ...acc, [id]: { attempted: 0, correct: 0 } }), {});
                let teamACorrect = 0;
                let teamBCorrect = 0;

                turns.forEach(turn => {
                    if (playerStats[turn.player_id]) {
                        playerStats[turn.player_id].attempted++;
                        if (turn.answered_correctly) {
                            playerStats[turn.player_id].correct++;
                            if (turn.team === 'A') teamACorrect++;
                            else teamBCorrect++;
                        }
                    }
                });

                const totalCorrect = teamACorrect + teamBCorrect;
                const finalStats = Object.entries(playerStats).reduce((acc, [id, data]) => {
                    const accuracy = data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0;
                    // Contribution is based on how many correct answers they provided towards total correct answers
                    const contribution = totalCorrect > 0 ? Math.round((data.correct / totalCorrect) * 100) : 0;
                    return { ...acc, [id]: { ...data, accuracy, contribution } };
                }, {});
                setStats(finalStats);

            } catch (error) {
                console.error("Error loading results:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const handleTournamentAdvancement = async (matchData, currentUser) => {
            const bracketEntry = await TournamentBracket.get(matchData.tournament_bracket_id);
            if(bracketEntry.winner_id) return; // Already processed

            const winningTeam = matchData.winner_team;
            // Determine the actual winner ID based on which team won and who was on that team in the bracket
            const winnerId = winningTeam === 'A' ? bracketEntry.player_A_id : bracketEntry.player_B_id;

            await TournamentBracket.update(bracketEntry.id, { winner_id: winnerId });

            const allBrackets = await TournamentBracket.filter({ tournament_id: bracketEntry.tournament_id });
            const bracketsByRound = _.groupBy(allBrackets, 'round');
            const currentRoundBrackets = bracketsByRound[bracketEntry.round];

            // Check if this was the final match of the round
            if (currentRoundBrackets.every(b => b.winner_id)) {
                // If it's the final match of the whole tournament
                if (currentRoundBrackets.length === 1) {
                    await Tournament.update(bracketEntry.tournament_id, { status: 'completed', winner_id: winnerId });
                    const badges = await Badge.filter({ name: { '$in': ['Tournament Champion', 'Finalist'] }});
                    const champBadge = badges.find(b => b.name === 'Tournament Champion');
                    const finalistBadge = badges.find(b => b.name === 'Finalist');
                    
                    // Determine the loser of this final match for the Finalist badge
                    const loserId = winnerId === bracketEntry.player_A_id ? bracketEntry.player_B_id : bracketEntry.player_A_id;

                    // Award badges
                    if(champBadge) await User.update(winnerId, { $push: { unlocked_badge_ids: champBadge.id }});
                    if(finalistBadge) await User.update(loserId, { $push: { unlocked_badge_ids: finalistBadge.id }});

                } else {
                    // Create next round
                    // Shuffle winners to ensure fair matchups in the next round
                    const winners = _.shuffle(currentRoundBrackets.map(b => b.winner_id));
                    for (let i = 0; i < winners.length; i += 2) {
                        await TournamentBracket.create({
                            tournament_id: bracketEntry.tournament_id,
                            round: bracketEntry.round + 1,
                            match_in_round: (i/2) + 1, // Matches are numbered per round
                            player_A_id: winners[i],
                            player_B_id: winners[i+1],
                        });
                    }
                }
            }
        };

        fetchResults();
    }, [matchId]);

    if (isLoading || !match || !user) {
        return <div className="flex items-center justify-center h-full">Loading results...</div>;
    }

    const myTeam = match.team_A_player_ids.includes(user.id) ? 'A' : 'B';
    const isWinner = match.winner_team === myTeam;
    
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            {isWinner && <Confetti />}
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-2xl"
            >
                <ClayCard>
                    <Trophy className={`w-24 h-24 mx-auto mb-4 ${isWinner ? 'text-yellow-400' : 'text-gray-400'}`} />
                    <h1 className="text-4xl font-bold text-gray-800">{isWinner ? "Victory!" : "Defeat"}</h1>
                    <p className="text-lg text-gray-600 mt-2">Team {match.winner_team} is the winner!</p>
                </ClayCard>

                <div className="space-y-4 mt-6">
                   <ClayCard>
                      <h3 className="font-bold text-xl mb-4 text-left">Your Team</h3>
                      {(myTeam === 'A' ? match.team_A_player_ids : match.team_B_player_ids).map(id => stats[id] && (
                        <PlayerStatCard key={id} nickname={playerNicks[id] || 'Player'} stats={stats[id]}/>
                      ))}
                   </ClayCard>
                   <ClayCard>
                      <h3 className="font-bold text-xl mb-4 text-left">Opponent Team</h3>
                      {(myTeam === 'B' ? match.team_A_player_ids : match.team_B_player_ids).map(id => stats[id] && (
                         <PlayerStatCard key={id} nickname={playerNicks[id] || 'Player'} stats={stats[id]}/>
                      ))}
                   </ClayCard>
                </div>

                <div className="flex gap-4 mt-8">
                    <button onClick={() => navigate(createPageUrl('DuelsLobby'))} className="flex-1 clay-button bg-blue-200">
                        <RefreshCw className="inline mr-2 w-5 h-5"/>
                        New Duel
                    </button>
                    <button onClick={() => navigate(createPageUrl('Home'))} className="flex-1 clay-button">
                        <Home className="inline mr-2 w-5 h-5"/>
                        Return Home
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
