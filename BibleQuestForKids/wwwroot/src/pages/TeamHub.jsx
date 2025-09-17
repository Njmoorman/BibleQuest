
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { Team } from '@/api/entities';
import { TeamInvite } from '@/api/entities';
import { TeamChatMessage } from '@/api/entities';
import { Friendship } from '@/api/entities';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, PlusCircle, Users, LogOut, Shield, Send, UserPlus, X, Check, Swords, Smile, Trophy } from 'lucide-react';
import { createPageUrl } from '@/utils';

const ClayCard = ({ children, className }) => <div className={`p-6 rounded-2xl clay-card ${className}`}>{children}</div>;
const TEAM_ICONS = ['⚔️', '🛡️', '👑', '🔥', '💧', '⚡', '🦁', '🦅', '🐺', '🐉', '🌟', '🌙', '🌊', '🌳', '👻', '🤖', '👾', '🚀', '🔮', '💎', '💡'];

// Component for when the user is NOT in a team
const NoTeamView = ({ onJoin }) => {
    const navigate = useNavigate();
    const [publicTeams, setPublicTeams] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTeams = async () => {
            setIsLoading(true);
            try {
                let teams;
                if (searchTerm) {
                    // Simple filter without regex for better compatibility
                    teams = await Team.filter({ privacy: 'public' }, '-member_count', 50);
                    teams = teams.filter(team => 
                        team.name.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                } else {
                    teams = await Team.filter({ privacy: 'public' }, '-member_count', 20);
                }
                setPublicTeams(teams);
            } catch (error) {
                console.error("Error fetching teams:", error);
                setPublicTeams([]);
            }
            setIsLoading(false);
        };
        fetchTeams();
    }, [searchTerm]);

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800">Join a Team</h2>
                <p className="text-gray-600">Find your community or create a new one!</p>
            </div>
            <ClayCard>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl">Find a Public Team</h3>
                    <Button onClick={() => navigate(createPageUrl('CreateTeam'))} className="clay-button bg-green-200">
                        <PlusCircle className="mr-2 h-5 w-5" /> Create Team
                    </Button>
                </div>
                <div className="flex gap-2 mb-4">
                    <Input
                        placeholder="Search by team name..."
                        className="clay-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button className="clay-button"><Search /></Button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {isLoading ? <Loader2 className="mx-auto animate-spin" /> :
                        publicTeams.map(team => (
                            <div key={team.id} className="flex items-center justify-between p-3 clay-shadow-inset rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{team.icon}</span>
                                    <div>
                                        <p className="font-bold">{team.name}</p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1"><Users className="w-4 h-4"/> {team.member_count}/50</p>
                                    </div>
                                </div>
                                <Button onClick={() => onJoin(team.id)} className="clay-button">Join</Button>
                            </div>
                        ))
                    }
                     {publicTeams.length === 0 && !isLoading && <p className="text-center text-gray-500 py-4">No public teams found.</p>}
                </div>
            </ClayCard>
        </div>
    );
};

// Component for when the user IS in a team
const TeamView = ({ team, members, onLeave, user, onKickMember, onUpdate }) => {
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [friends, setFriends] = useState([]);
    const [pendingInvites, setPendingInvites] = useState([]);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showBattleModal, setShowBattleModal] = useState(false);
    const [showIconModal, setShowIconModal] = useState(false);
    const [battleTeams, setBattleTeams] = useState([]);
    const [battleSearch, setBattleSearch] = useState('');

    const isLeader = team.leader_id === user.id;
    const canStartTournament = isLeader && team.member_count >= 4;
    const canBattle = isLeader && team.member_count >= 10;

    // Load chat messages
    useEffect(() => {
        const fetchChatMessages = async () => {
            try {
                const messages = await TeamChatMessage.filter({ team_id: team.id }, '-created_date', 50);
                setChatMessages(messages);
            } catch (error) {
                console.error("Error loading chat messages:", error);
                setChatMessages([]);
            }
        };
        fetchChatMessages();
        
        // Poll for new messages every 3 seconds
        const interval = setInterval(fetchChatMessages, 3000);
        return () => clearInterval(interval);
    }, [team.id]);

    // Load friends for invite modal
    useEffect(() => {
        const fetchFriends = async () => {
            if (!isLeader) return;
            
            try {
                const friendships = await Friendship.filter({ 
                    $or: [
                        { requester_id: user.id, status: 'accepted' },
                        { addressee_id: user.id, status: 'accepted' }
                    ]
                });
                
                const friendIds = friendships.map(f => 
                    f.requester_id === user.id ? f.addressee_id : f.requester_id
                ).filter(id => !team.member_ids.includes(id)); // Exclude current members
                
                if (friendIds.length > 0) {
                    const friendUsers = await User.filter({ id: { '$in': friendIds } });
                    setFriends(friendUsers);
                }
                
                // Load pending invites
                const invites = await TeamInvite.filter({ team_id: team.id, status: 'pending' });
                setPendingInvites(invites);
            } catch (error) {
                console.error("Error loading friends:", error);
                setFriends([]);
                setPendingInvites([]);
            }
        };
        fetchFriends();
    }, [team.id, user.id, isLeader, team.member_ids]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        
        try {
            await TeamChatMessage.create({
                team_id: team.id,
                sender_id: user.id,
                message_text: newMessage.trim()
            });
            
            setNewMessage('');
            // Refresh messages
            const messages = await TeamChatMessage.filter({ team_id: team.id }, '-created_date', 50);
            setChatMessages(messages);
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message. Please try again.");
        }
    };

    const handleInviteFriend = async (friendId) => {
        try {
            await TeamInvite.create({
                team_id: team.id,
                inviter_id: user.id,
                invitee_id: friendId,
                status: 'pending'
            });
            
            // Refresh pending invites
            const invites = await TeamInvite.filter({ team_id: team.id, status: 'pending' });
            setPendingInvites(invites);
            
            alert('Invite sent successfully!');
        } catch (error) {
            console.error("Error sending invite:", error);
            alert('Failed to send invite. Please try again.');
        }
    };

    const handleStartMiniTournament = async () => {
        if (!canStartTournament) {
            alert('You need at least 4 team members to start a mini tournament!');
            return;
        }
        
        if (confirm(`Start a mini tournament for ${team.name}? This will be for bragging rights only!`)) {
            try {
                // Send announcement message to chat
                await TeamChatMessage.create({
                    team_id: team.id,
                    sender_id: user.id,
                    message_text: `🏆 ${user.nickname} started a mini tournament! Who wants to compete for bragging rights? 🏆`
                });
                
                // Refresh messages to show the announcement
                const messages = await TeamChatMessage.filter({ team_id: team.id }, '-created_date', 50);
                setChatMessages(messages);
                
                alert('Mini tournament announced! Members can join by participating in team quizzes. The member with the highest score this week gets bragging rights!');
            } catch (error) {
                console.error("Error starting tournament:", error);
                alert('Failed to start tournament. Please try again.');
            }
        }
    };
    
    const handleOpenBattleModal = async () => {
        try {
            const allTeams = await Team.list('-member_count', 50);
            const battleEligibleTeams = allTeams.filter(t => 
                t.id !== team.id && t.member_count >= 10
            );
            setBattleTeams(battleEligibleTeams);
            setShowBattleModal(true);
        } catch (error) {
            console.error("Error loading teams:", error);
            alert('Failed to load teams for battle. Please try again.');
        }
    };

    const handleIconChange = async (newIcon) => {
        if (!isLeader) return;
        try {
            await Team.update(team.id, { icon: newIcon });
            onUpdate(); // Propagate update to parent to refresh team data
            setShowIconModal(false);
        } catch (error) {
            console.error("Error updating team icon:", error);
            alert('Failed to change team icon. Please try again.');
        }
    };

    const getSenderName = (senderId) => {
        const sender = members.find(m => m.id === senderId);
        return sender ? sender.nickname : 'Unknown';
    };

    return (
         <ClayCard>
            <div className="flex items-center gap-4 mb-6">
                <span className="text-5xl">{team.icon}</span>
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">{team.name}</h2>
                    <p className="text-gray-600 flex items-center gap-2"><Users /> {team.member_count}/50 Members <Shield className="text-yellow-600" /> {team.privacy}</p>
                </div>
            </div>

            {/* Team Battle Button - only for leaders with 10+ members */}
            {canBattle && (
                <div className="mb-6">
                    <Button 
                        onClick={handleOpenBattleModal} 
                        className="w-full clay-button bg-red-200 text-red-800 py-4"
                    >
                        <Swords className="mr-2 w-6 h-6" /> Team Battle
                    </Button>
                </div>
            )}

            <Tabs defaultValue="members" className="mb-6">
                <TabsList className="grid w-full grid-cols-3 clay-button p-1">
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                    {isLeader && <TabsTrigger value="manage">Manage</TabsTrigger>}
                </TabsList>

                <TabsContent value="members" className="mt-4">
                    <div className="space-y-2 max-h-60 overflow-y-auto clay-shadow-inset p-3 rounded-xl">
                        {members.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full clay-shadow-inset bg-gradient-to-br from-white to-gray-100 flex items-center justify-center text-lg">
                                        {member.avatar ? '👤' : '👤'}
                                    </div>
                                    <p className="font-bold">{member.nickname} {member.id === team.leader_id && <span className="text-xs text-yellow-600 font-bold">(Leader)</span>}</p>
                                </div>
                                {isLeader && member.id !== team.leader_id && (
                                    <Button size="sm" onClick={() => onKickMember(member.id)} className="clay-button bg-red-200 text-red-700">
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="chat" className="mt-4">
                    <div className="clay-shadow-inset p-3 rounded-xl bg-white/30 mb-4">
                        {/* Mini Tournament Button for Leaders */}
                        {isLeader && (
                            <div className="mb-4">
                                <Button 
                                    onClick={handleStartMiniTournament}
                                    disabled={!canStartTournament}
                                    className={`w-full clay-button ${canStartTournament ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-500'}`}
                                    title={!canStartTournament ? 'Need at least 4 members' : 'Start mini tournament'}
                                >
                                    🏆 Host Mini Tournament (Bragging Rights Only)
                                </Button>
                                {!canStartTournament && (
                                    <p className="text-xs text-gray-500 text-center mt-1">Need at least 4 members to start</p>
                                )}
                            </div>
                        )}
                        
                        <div className="h-48 overflow-y-auto mb-4 space-y-2">
                            {chatMessages.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No messages yet. Start the conversation!</p>
                            ) : (
                                chatMessages.reverse().map(msg => (
                                    <div key={msg.id} className="p-2 bg-white/50 rounded-lg">
                                        <p className="text-xs text-gray-600 font-bold">{getSenderName(msg.sender_id)}</p>
                                        <p className="text-gray-800">{msg.message_text}</p>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Type your message..."
                                className="clay-input flex-1"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                maxLength={200}
                            />
                            <Button onClick={handleSendMessage} className="clay-button bg-blue-200">
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {isLeader && (
                    <TabsContent value="manage" className="mt-4">
                        <div className="space-y-4">
                            <Button onClick={() => setShowIconModal(true)} className="clay-button bg-blue-200 w-full">
                                <Smile className="mr-2 w-4 h-4" /> Change Icon
                            </Button>
                            <Button onClick={() => setShowInviteModal(true)} className="clay-button bg-green-200 w-full">
                                <UserPlus className="mr-2 w-4 h-4" /> Invite Friends
                            </Button>
                            
                            {pendingInvites.length > 0 && (
                                <div>
                                    <h4 className="font-bold mb-2">Pending Invites ({pendingInvites.length})</h4>
                                    <div className="clay-shadow-inset p-3 rounded-xl">
                                        {pendingInvites.map(invite => (
                                            <div key={invite.id} className="flex items-center justify-between p-2 bg-white/50 rounded-lg mb-2">
                                                <p className="text-sm">Invite sent to user</p>
                                                <span className="text-xs text-yellow-600">Pending</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                )}
            </Tabs>

            <Button onClick={onLeave} variant="destructive" className="w-full clay-button bg-red-200 text-red-700">
                <LogOut className="mr-2 h-5 w-5" /> Leave Team
            </Button>

            {/* Invite Friends Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="clay-card p-6 mx-4 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Invite Friends</h3>
                            <Button onClick={() => setShowInviteModal(false)} className="clay-button p-2">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {friends.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No friends available to invite.</p>
                            ) : (
                                friends.map(friend => (
                                    <div key={friend.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                                        <p className="font-bold">{friend.nickname}</p>
                                        <Button 
                                            onClick={() => handleInviteFriend(friend.id)} 
                                            className="clay-button bg-blue-200"
                                            disabled={pendingInvites.some(invite => invite.invitee_id === friend.id)}
                                        >
                                            {pendingInvites.some(invite => invite.invitee_id === friend.id) ? 'Invited' : 'Invite'}
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Change Icon Modal */}
            {showIconModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="clay-card p-6 mx-4 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Change Team Icon</h3>
                            <Button onClick={() => setShowIconModal(false)} className="clay-button p-2"><X className="w-4 h-4" /></Button>
                        </div>
                        <div className="grid grid-cols-4 gap-4 max-h-60 overflow-y-auto">
                            {TEAM_ICONS.map(icon => (
                                <button 
                                    key={icon} 
                                    onClick={() => handleIconChange(icon)} 
                                    className={`p-4 text-4xl rounded-xl clay-button ${team.icon === icon ? 'bg-blue-300' : ''}`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Team Battle Modal */}
            {showBattleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="clay-card p-6 mx-4 max-w-lg w-full">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Challenge a Team</h3>
                            <Button onClick={() => setShowBattleModal(false)} className="clay-button p-2"><X className="w-4 h-4" /></Button>
                        </div>
                        <Input
                            placeholder="Search teams by name..."
                            value={battleSearch}
                            onChange={(e) => setBattleSearch(e.target.value)}
                            className="clay-input mb-4"
                        />
                         <div className="space-y-3 max-h-80 overflow-y-auto">
                            {battleTeams.filter(t => t.name.toLowerCase().includes(battleSearch.toLowerCase())).length === 0 && (
                                <p className="text-gray-500 text-center py-4">No eligible teams found.</p>
                            )}
                            {battleTeams.filter(t => t.name.toLowerCase().includes(battleSearch.toLowerCase())).map(t => (
                                <div key={t.id} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{t.icon}</span>
                                        <div>
                                            <p className="font-bold">{t.name}</p>
                                            <p className="text-sm text-gray-500 flex items-center gap-1"><Users className="w-4 h-4"/> {t.member_count}/50</p>
                                        </div>
                                    </div>
                                    <Button onClick={() => alert(`Battle initiated with ${t.name}! This is a placeholder for actual battle logic.`)} className="clay-button bg-red-200">
                                        <Swords className="w-4 h-4"/> Battle
                                    </Button>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            )}
        </ClayCard>
    );
};

export default function TeamHubPage() {
    const [user, setUser] = useState(null);
    const [team, setTeam] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const currentUser = await User.me();
            setUser(currentUser);

            if (currentUser.team_id) {
                try {
                    const currentTeam = await Team.get(currentUser.team_id);
                    setTeam(currentTeam);
                    if (currentTeam) {
                        const members = await User.filter({ id: { '$in': currentTeam.member_ids } });
                        setTeamMembers(members);
                    } else {
                        // Team ID exists on user, but team was deleted. Clean up.
                        await User.updateMyUserData({ team_id: null });
                        setTeam(null);
                        setTeamMembers([]);
                    }
                } catch (teamError) {
                    console.error("Error loading team:", teamError);
                    // Clean up invalid team reference
                    await User.updateMyUserData({ team_id: null });
                    setTeam(null);
                    setTeamMembers([]);
                }
            } else {
                setTeam(null);
                setTeamMembers([]);
            }
        } catch (e) {
            console.error("Error loading user and team data:", e);
            setUser(null);
            setTeam(null);
            setTeamMembers([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const handleJoinTeam = async (teamId) => {
        if (user && user.team_id) {
            alert("You are already in a team. Please leave your current team first to join another.");
            return;
        }
        try {
            const teamToJoin = await Team.get(teamId);
            if (teamToJoin.member_count >= 50) {
                alert("This team is full!");
                return;
            }

            await Team.update(teamToJoin.id, {
                member_ids: [...teamToJoin.member_ids, user.id],
                member_count: teamToJoin.member_count + 1
            });
            await User.updateMyUserData({ team_id: teamId });
            loadData();
        } catch (error) {
            console.error("Error joining team:", error);
            alert("Failed to join team. Please try again.");
        }
    };

    const handleKickMember = async (memberId) => {
        if (!team || !user || team.leader_id !== user.id) return;
        
        if (confirm('Are you sure you want to kick this member?')) {
            try {
                await Team.update(team.id, {
                    member_ids: team.member_ids.filter(id => id !== memberId),
                    member_count: team.member_count - 1
                });
                
                // Remove team_id from kicked user
                await User.update(memberId, { team_id: null });
                
                loadData();
            } catch (error) {
                console.error("Error kicking member:", error);
                alert("Failed to kick member. Please try again.");
            }
        }
    };
    
    const handleLeaveTeam = async () => {
        if (!team || !user) return;
        
        try {
            if (team.leader_id === user.id && team.member_count === 1) {
                // Last member is the leader, so delete the team
                if (confirm("You are the last member. Leaving will delete the team. Are you sure?")) {
                    await Team.delete(team.id);
                    await User.updateMyUserData({ team_id: null });
                    setTeam(null);
                    setTeamMembers([]);
                    loadData();
                }
                return;
            } else if (team.leader_id === user.id) {
                alert("Please transfer leadership before leaving the team.");
                // Future logic: Transfer leadership modal
                return;
            } else {
                 await Team.update(team.id, {
                    member_ids: team.member_ids.filter(id => id !== user.id),
                    member_count: team.member_count - 1
                });
            }
            await User.updateMyUserData({ team_id: null });
            setTeam(null);
            setTeamMembers([]);
            loadData();
        } catch (error) {
            console.error("Error leaving team:", error);
            alert("Failed to leave team. Please try again.");
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="w-12 h-12 animate-spin" /></div>;
    }

    return (
        <div className="p-4">
            {team ? <TeamView team={team} members={teamMembers} onLeave={handleLeaveTeam} user={user} onKickMember={handleKickMember} onUpdate={loadData} /> : <NoTeamView onJoin={handleJoinTeam} />}
        </div>
    );
}
