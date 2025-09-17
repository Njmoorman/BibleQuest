import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { Friendship } from '@/api/entities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, Check, X, Loader2 } from 'lucide-react';
import RankBadge from '../components/ranking/RankBadge';

const AVATAR_CHARACTERS = {
    knight: '🛡️', wizard: '🧙‍♂️', angel: '👼', shepherd: '🧑‍🌾', scholar: '👨‍🎓', 
    explorer: '🧑‍💼', crown: '👑', dove: '🕊️', lion: '🦁', eagle: '🦅', 
    lamb: '🐑', fish: '🐟', star: '⭐', cross: '✝️', heart: '❤️', peace: '☮️',
    User: '👤'
};

const ClayCard = ({ children, className }) => <div className={`p-4 rounded-2xl clay-card ${className}`}>{children}</div>;

const FriendCard = ({ friend, onRemove }) => (
    <ClayCard className="bg-white/50">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full clay-shadow-inset bg-gradient-to-br from-white to-gray-100 flex items-center justify-center text-2xl">
                {AVATAR_CHARACTERS[friend.avatar] || '👤'}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">{friend.nickname}</p>
                <RankBadge rank={friend.rank_tier} size="small" />
            </div>
            <Button size="icon" variant="ghost" onClick={() => onRemove(friend.friendship_id)} className="clay-button bg-red-100 text-red-600">
                <X className="w-4 h-4" />
            </Button>
        </div>
    </ClayCard>
);

const RequestCard = ({ request, onAccept, onDecline }) => (
     <ClayCard className="bg-white/50">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full clay-shadow-inset bg-gradient-to-br from-white to-gray-100 flex items-center justify-center text-2xl">
                {AVATAR_CHARACTERS[request.avatar] || '👤'}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">{request.nickname}</p>
                <p className="text-sm text-gray-600">wants to be your friend.</p>
            </div>
            <div className="flex gap-2">
                 <Button size="icon" onClick={() => onAccept(request.id)} className="clay-button bg-green-200 text-green-700">
                    <Check className="w-5 h-5" />
                </Button>
                <Button size="icon" onClick={() => onDecline(request.id)} className="clay-button bg-red-200 text-red-700">
                    <X className="w-5 h-5" />
                </Button>
            </div>
        </div>
    </ClayCard>
);

const SearchResultCard = ({ result, onAdd, isPending, isFriend }) => (
    <ClayCard className="bg-white/50">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full clay-shadow-inset flex items-center justify-center text-2xl">
                {AVATAR_CHARACTERS[result.avatar] || '👤'}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">{result.nickname}</p>
                <RankBadge rank={result.rank_tier} size="small" />
            </div>
            <Button onClick={() => onAdd(result.id)} disabled={isPending || isFriend} className="clay-button">
                {isFriend ? 'Friends' : isPending ? 'Pending' : <><UserPlus className="w-4 h-4 mr-2"/> Add</>}
            </Button>
        </div>
    </ClayCard>
);

export default function FriendsPage() {
    const [user, setUser] = useState(null);
    const [friends, setFriends] = useState([]);
    const [requests, setRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [existingRelations, setExistingRelations] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async (currentUser) => {
        if (!currentUser) return;
        setIsLoading(true);

        const friendships = await Friendship.list();
        const userIds = new Set([currentUser.id]);
        friendships.forEach(f => {
            userIds.add(f.requester_id);
            userIds.add(f.addressee_id);
        });

        const allUsers = await User.filter({ id: { '$in': Array.from(userIds) } });
        const userMap = allUsers.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});

        const myFriends = [];
        const myRequests = [];
        const relations = {};

        friendships.forEach(f => {
            if (f.requester_id === currentUser.id) relations[f.addressee_id] = { status: f.status, id: f.id };
            if (f.addressee_id === currentUser.id) relations[f.requester_id] = { status: f.status, id: f.id };

            if (f.status === 'accepted') {
                const friendId = f.requester_id === currentUser.id ? f.addressee_id : f.requester_id;
                if(userMap[friendId]) myFriends.push({ ...userMap[friendId], friendship_id: f.id });
            } else if (f.status === 'pending' && f.addressee_id === currentUser.id) {
                if(userMap[f.requester_id]) myRequests.push({ ...userMap[f.requester_id], id: f.id });
            }
        });

        setFriends(myFriends);
        setRequests(myRequests);
        setExistingRelations(relations);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        User.me().then(currentUser => {
            setUser(currentUser);
            fetchData(currentUser);
        }).catch(() => {
            setIsLoading(false);
        });
    }, [fetchData]);

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        const results = await User.filter({ nickname: { $regex: searchTerm, $options: 'i' } }, null, 10);
        setSearchResults(results.filter(u => u.id !== user.id));
    };

    const handleAddFriend = async (addresseeId) => {
        await Friendship.create({ requester_id: user.id, addressee_id: addresseeId, status: 'pending' });
        fetchData(user);
    };
    
    const handleAcceptRequest = async (friendshipId) => {
        await Friendship.update(friendshipId, { status: 'accepted' });
        fetchData(user);
    };

    const handleDeclineRequest = async (friendshipId) => {
        await Friendship.delete(friendshipId);
        fetchData(user);
    };

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Friends Hub</h1>
            <Tabs defaultValue="friends" className="w-full max-w-2xl mx-auto">
                <TabsList className="grid w-full grid-cols-3 clay-button p-1 mb-6">
                    <TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
                    <TabsTrigger value="requests">Requests ({requests.length})</TabsTrigger>
                    <TabsTrigger value="add">Add Friend</TabsTrigger>
                </TabsList>

                {isLoading ? <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin"/></div> : (
                    <>
                        <TabsContent value="friends">
                            <div className="space-y-3">
                                {friends.length > 0 ? friends.map(friend => (
                                    <FriendCard key={friend.id} friend={friend} onRemove={handleDeclineRequest} />
                                )) : <p className="text-center text-gray-500 py-8">Your friends list is empty. Add some friends!</p>}
                            </div>
                        </TabsContent>
                        <TabsContent value="requests">
                             <div className="space-y-3">
                                {requests.length > 0 ? requests.map(req => (
                                    <RequestCard key={req.id} request={req} onAccept={handleAcceptRequest} onDecline={handleDeclineRequest} />
                                )) : <p className="text-center text-gray-500 py-8">No pending friend requests.</p>}
                            </div>
                        </TabsContent>
                        <TabsContent value="add">
                            <div className="flex gap-2 mb-4">
                                <Input 
                                    placeholder="Search by nickname..." 
                                    className="clay-input" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <Button onClick={handleSearch} className="clay-button"><Search /></Button>
                            </div>
                            <div className="space-y-3">
                                {searchResults.map(res => {
                                    const relation = existingRelations[res.id];
                                    return (
                                        <SearchResultCard 
                                            key={res.id} 
                                            result={res}
                                            onAdd={handleAddFriend}
                                            isPending={relation?.status === 'pending'}
                                            isFriend={relation?.status === 'accepted'}
                                        />
                                    );
                                })}
                            </div>
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
}