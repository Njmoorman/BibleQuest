import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { Team } from '@/api/entities';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Lock } from 'lucide-react';
import { createPageUrl } from '@/utils';

const TEAM_ICONS = ['🛡️', '⚔️', '🏰', '🕊️', '🔥', '💧', '🦁', '🦅', '⚓', '👑', '✝️', '❤️'];

const ClayCard = ({ children, className }) => <div className={`p-6 rounded-2xl clay-card ${className}`}>{children}</div>;

export default function CreateTeamPage() {
    const navigate = useNavigate();
    const [teamName, setTeamName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(TEAM_ICONS[0]);
    const [privacy, setPrivacy] = useState('public');
    const [error, setError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateTeam = async () => {
        if (!teamName.trim()) {
            setError('Team name is required.');
            return;
        }
        setIsCreating(true);
        try {
            const user = await User.me();
            const newTeam = await Team.create({
                name: teamName,
                icon: selectedIcon,
                privacy: privacy,
                leader_id: user.id,
                member_ids: [user.id],
                member_count: 1
            });
            await User.updateMyUserData({ team_id: newTeam.id });
            navigate(createPageUrl('TeamHub'));
        } catch (err) {
            console.error("Error creating team:", err);
            setError('Failed to create team. Please try again.');
            setIsCreating(false);
        }
    };

    return (
        <div className="p-4 max-w-2xl mx-auto">
            <button onClick={() => navigate(createPageUrl('TeamHub'))} className="flex items-center gap-2 clay-button mb-6">
                <ArrowLeft /> Back
            </button>
            <ClayCard>
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Create a New Team</h1>
                
                <div className="space-y-6">
                    <div>
                        <label className="font-bold text-gray-700 mb-2 block">Team Name</label>
                        <Input
                            placeholder="The Crusaders"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="clay-input"
                            maxLength={30}
                        />
                    </div>

                    <div>
                        <label className="font-bold text-gray-700 mb-2 block">Choose an Icon</label>
                        <div className="grid grid-cols-6 gap-3">
                            {TEAM_ICONS.map(icon => (
                                <button
                                    key={icon}
                                    onClick={() => setSelectedIcon(icon)}
                                    className={`w-16 h-16 rounded-2xl clay-button flex items-center justify-center text-3xl transition-all ${selectedIcon === icon ? 'clay-button active' : ''}`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="font-bold text-gray-700 mb-2 block">Privacy</label>
                        <div className="flex gap-4">
                            <button onClick={() => setPrivacy('public')} className={`flex-1 clay-button p-4 flex items-center justify-center gap-2 ${privacy === 'public' ? 'active' : ''}`}>
                                <ShieldCheck /> Public
                            </button>
                            <button onClick={() => setPrivacy('invite-only')} className={`flex-1 clay-button p-4 flex items-center justify-center gap-2 ${privacy === 'invite-only' ? 'active' : ''}`}>
                                <Lock /> Invite-Only
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            {privacy === 'public' ? 'Anyone can find and join your team.' : 'Players can only join if invited by the leader.'}
                        </p>
                    </div>
                </div>

                {error && <p className="text-red-500 text-center mt-4">{error}</p>}

                <Button onClick={handleCreateTeam} disabled={isCreating} className="w-full clay-button bg-green-200 text-green-800 mt-8 py-4 text-xl">
                    {isCreating ? 'Creating...' : 'Create Team'}
                </Button>
            </ClayCard>
        </div>
    );
}