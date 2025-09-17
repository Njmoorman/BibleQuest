import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';

// NOTE: This is a placeholder for a real matchmaking system.
// In a real-world app, this would involve WebSockets or a more robust
// polling system against a dedicated matchmaking service or entity.

export default function CaptureVerseLobbyPage() {
    const navigate = useNavigate();
    const [status, setStatus] = useState('Searching for an opponent...');

    useEffect(() => {
        // Simulate finding a match after a delay
        const timeout = setTimeout(() => {
            setStatus('Opponent found! Starting game...');
            // In a real app, you would navigate to a specific match ID
            setTimeout(() => navigate(createPageUrl('CaptureVerseGame')), 1500);
        }, 5000);
        
        return () => clearTimeout(timeout);
    }, [navigate]);

    return (
        <div className="p-4 flex flex-col items-center justify-center h-full text-center">
            <button onClick={() => navigate(createPageUrl('Minigames'))} className="flex items-center gap-2 mb-8 clay-button p-3 self-start">
                <ArrowLeft /> Back
            </button>
            <div className="clay-card p-8 max-w-md">
                <Loader2 className="w-16 h-16 animate-spin text-red-500 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Capture the Verse</h1>
                <p className="text-gray-600">{status}</p>
            </div>
        </div>
    );
}