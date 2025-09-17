import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { GameSettings } from '@/api/entities';
import { ArrowLeft, Volume2, VolumeX, Smartphone, Settings as SettingsIcon } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Slider } from '@/components/ui/slider';

const ClayCard = ({ children, className }) => <div className={`p-6 rounded-2xl clay-card ${className}`}>{children}</div>;
const ClayButton = ({ children, className, ...props }) => <button className={`clay-button px-4 py-2 rounded-xl font-bold ${className}`} {...props}>{children}</button>;

export default function SettingsPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [settings, setSettings] = useState({
        show_correct_answer: true,
        auto_advance: true,
        feedback_duration: 2.0,
        sound_enabled: true,
        haptic_enabled: true
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                
                const userSettings = await GameSettings.filter({ user_id: currentUser.id });
                if (userSettings.length > 0) {
                    setSettings(userSettings[0]);
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            }
            setIsLoading(false);
        };
        loadData();
    }, []);

    const handleSave = async () => {
        if (!user) return;
        
        setIsSaving(true);
        try {
            const existing = await GameSettings.filter({ user_id: user.id });
            if (existing.length > 0) {
                await GameSettings.update(existing[0].id, settings);
            } else {
                await GameSettings.create({ user_id: user.id, ...settings });
            }
        } catch (error) {
            console.error('Error saving settings:', error);
        }
        setIsSaving(false);
    };

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSliderChange = (value) => {
        setSettings(prev => ({ ...prev, feedback_duration: value[0] }));
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full">Loading...</div>;
    }

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(createPageUrl('Profile'))} className="clay-button p-2">
                    <ArrowLeft />
                </button>
                <h1 className="text-3xl font-bold text-gray-800">Game Settings</h1>
            </div>

            <ClayCard>
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <SettingsIcon className="w-6 h-6" />
                    Feedback Settings
                </h3>

                <div className="space-y-6">
                    {/* Show Correct Answer Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-700">Show Correct Answer</p>
                            <p className="text-sm text-gray-500">Display the correct answer when you get it wrong</p>
                        </div>
                        <ClayButton
                            onClick={() => handleToggle('show_correct_answer')}
                            className={`w-16 h-8 ${settings.show_correct_answer ? 'bg-green-200' : 'bg-gray-200'}`}
                        >
                            {settings.show_correct_answer ? 'ON' : 'OFF'}
                        </ClayButton>
                    </div>

                    {/* Auto Advance Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-700">Auto Advance</p>
                            <p className="text-sm text-gray-500">Automatically move to next question after feedback</p>
                        </div>
                        <ClayButton
                            onClick={() => handleToggle('auto_advance')}
                            className={`w-16 h-8 ${settings.auto_advance ? 'bg-green-200' : 'bg-gray-200'}`}
                        >
                            {settings.auto_advance ? 'ON' : 'OFF'}
                        </ClayButton>
                    </div>

                    {/* Feedback Duration Slider */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="font-bold text-gray-700">Feedback Duration</p>
                            <span className="text-sm font-medium text-gray-600">{settings.feedback_duration}s</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">How long to show answer feedback</p>
                        <Slider
                            value={[settings.feedback_duration]}
                            onValueChange={handleSliderChange}
                            min={0.8}
                            max={3.0}
                            step={0.1}
                            className="w-full"
                        />
                    </div>
                </div>
            </ClayCard>

            <ClayCard>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Audio & Haptics</h3>

                <div className="space-y-6">
                    {/* Sound Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {settings.sound_enabled ? <Volume2 className="w-6 h-6 text-blue-600" /> : <VolumeX className="w-6 h-6 text-gray-400" />}
                            <div>
                                <p className="font-bold text-gray-700">Sound Feedback</p>
                                <p className="text-sm text-gray-500">Play sounds for correct/incorrect answers</p>
                            </div>
                        </div>
                        <ClayButton
                            onClick={() => handleToggle('sound_enabled')}
                            className={`w-16 h-8 ${settings.sound_enabled ? 'bg-green-200' : 'bg-gray-200'}`}
                        >
                            {settings.sound_enabled ? 'ON' : 'OFF'}
                        </ClayButton>
                    </div>

                    {/* Haptic Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Smartphone className="w-6 h-6 text-purple-600" />
                            <div>
                                <p className="font-bold text-gray-700">Haptic Feedback</p>
                                <p className="text-sm text-gray-500">Vibrate device for answer feedback</p>
                            </div>
                        </div>
                        <ClayButton
                            onClick={() => handleToggle('haptic_enabled')}
                            className={`w-16 h-8 ${settings.haptic_enabled ? 'bg-green-200' : 'bg-gray-200'}`}
                        >
                            {settings.haptic_enabled ? 'ON' : 'OFF'}
                        </ClayButton>
                    </div>
                </div>
            </ClayCard>

            <ClayButton
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 bg-blue-200 text-blue-800"
            >
                {isSaving ? 'Saving...' : 'Save Settings'}
            </ClayButton>
        </div>
    );
}