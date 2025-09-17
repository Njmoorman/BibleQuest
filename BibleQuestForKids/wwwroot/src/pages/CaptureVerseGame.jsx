import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Question } from '@/api/entities';
import { MemoryVerse } from '@/api/entities';
import _ from 'lodash';
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { createPageUrl } from '@/utils';

// This is a simplified, single-player proof-of-concept for the game mechanic.
// A full multiplayer implementation would require significant backend architecture.

export default function CaptureVerseGamePage() {
    const navigate = useNavigate();
    const [targetVerse, setTargetVerse] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [earnedWords, setEarnedWords] = useState([]);
    const [unscrambled, setUnscrambled] = useState([]);
    const [gameState, setGameState] = useState('answering'); // answering | unscrambling | complete

    useEffect(() => {
        const setupGame = async () => {
            const verse = _.sample(await MemoryVerse.list());
            setTargetVerse(verse);
            const words = verse.verse_text.split(' ');
            setUnscrambled(words); // Keep correct order for checking
            
            const allQuestions = _.shuffle(await Question.list());
            setQuestions(allQuestions.slice(0, words.length));
        };
        setupGame();
    }, []);

    const handleAnswer = (isCorrect) => {
        if (isCorrect) {
            const wordToEarn = unscrambled[earnedWords.length];
            setEarnedWords(prev => [...prev, { id: `word-${prev.length}`, content: wordToEarn }]);
        }
        
        if (currentQIndex + 1 >= questions.length) {
            setGameState('unscrambling');
        } else {
            setCurrentQIndex(prev => prev + 1);
        }
    };
    
    const onDragEnd = (result) => {
        if (!result.destination) return;
        const items = Array.from(earnedWords);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setEarnedWords(items);
    };

    const checkVerse = () => {
        const playerVerse = earnedWords.map(w => w.content).join(' ');
        if (playerVerse === targetVerse.verse_text) {
            setGameState('complete');
        } else {
            alert('Not quite! Keep trying.');
        }
    };

    if (!targetVerse) return <div>Loading Game...</div>;

    if (gameState === 'complete') {
        return (
            <div className="p-4 text-center">
                <h1 className="text-3xl font-bold">Verse Captured!</h1>
                <p>You correctly unscrambled: "{targetVerse.verse_text}"</p>
                <button onClick={() => navigate(createPageUrl('Minigames'))}>Back to Minigames</button>
            </div>
        );
    }
    
    if (gameState === 'unscrambling') {
        return (
            <div className="p-4 text-center">
                <h1 className="text-2xl font-bold mb-4">Unscramble the Verse!</h1>
                <p className="mb-4">Drag the words into the correct order.</p>
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="verse-words">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-wrap gap-2 justify-center p-4 clay-card mb-4">
                                {earnedWords.map((word, index) => (
                                    <Draggable key={word.id} draggableId={word.id} index={index}>
                                        {(provided) => (
                                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="p-2 rounded clay-button bg-white">
                                                {word.content}
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                <button onClick={checkVerse} className="clay-button bg-green-200">Check Verse</button>
            </div>
        );
    }

    const currentQuestion = questions[currentQIndex];
    return (
        <div className="p-4 text-center">
            <h1 className="text-xl font-bold mb-2">Answer to Earn Words!</h1>
            <p className="mb-4">Words Earned: {earnedWords.length} / {unscrambled.length}</p>
            {currentQuestion && (
                <div className="clay-card p-6">
                    <p className="font-bold text-lg mb-4">{currentQuestion.question}</p>
                    <div className="grid grid-cols-2 gap-2">
                        {currentQuestion.choices.map((choice, index) => (
                            <button key={index} onClick={() => handleAnswer(index === currentQuestion.answer_index)} className="clay-button">
                                {choice}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}