import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/api/entities';
import { Question } from '@/api/entities';
import { BibleCharacter } from '@/api/entities';
import { ArrowLeft, Home, RefreshCw, Star } from 'lucide-react';
import { createPageUrl } from '@/utils';
import _ from 'lodash';
import Confetti from '../components/Confetti';

const ClayButton = ({ children, className, ...props }) => <button className={`clay-button px-4 py-2 rounded-xl font-bold ${className}`} {...props}>{children}</button>;

const BINGO_SIZE = 5;

const generateBingoItems = async () => {
    let combinedItems = [];
    try {
        const books = _.uniq((await Question.filter({}, null, null, ['book'])).map(q => q.book));
        const characters = (await BibleCharacter.list()).map(c => c.name);
        combinedItems = [...new Set([...books, ...characters])];
    } catch (e) {
        console.error("Error fetching bingo items from DB, using defaults:", e);
    }

    const requiredItems = BINGO_SIZE * BINGO_SIZE;
    if (combinedItems.length < requiredItems) {
        const placeholderItems = [
            "Faith", "Hope", "Love", "Grace", "Mercy", "Prayer", "Angel", "Miracle",
            "Prophet", "King", "Queen", "Temple", "Sabbath", "Covenant", "Disciple",
            "Apostle", "Shepherd", "Lamb", "Dove", "Cross", "Altar", "Ark", "Manna",
            "Zion", "Sinai", "Jordan", "Nile", "Eden", "Goliath", "Samson", "Creation",
            "Exodus", "Gospel", "Testament", "Wisdom", "Genesis", "David", "Moses",
            "Noah", "Abraham", "Jesus", "Mary", "Peter", "Paul", "John"
        ];

        const currentItemSet = new Set(combinedItems);
        for (const placeholder of _.shuffle(placeholderItems)) {
            if (currentItemSet.size >= requiredItems) break;
            if (!currentItemSet.has(placeholder)) {
                combinedItems.push(placeholder);
                currentItemSet.add(placeholder);
            }
        }
    }
    
    return _.shuffle(combinedItems);
};

export default function BibleBingoPage() {
    const navigate = useNavigate();
    const [board, setBoard] = useState([]);
    const [calledItems, setCalledItems] = useState([]);
    const [marked, setMarked] = useState(new Set());
    const [isBingo, setIsBingo] = useState(false);
    const [allItems, setAllItems] = useState([]);
    const [callingOrder, setCallingOrder] = useState([]);

    const startNewGame = async () => {
        setIsBingo(false);
        setMarked(new Set());
        setCalledItems([]);
        const items = await generateBingoItems();
        setAllItems(items);
        
        const boardItems = items.slice(0, BINGO_SIZE * BINGO_SIZE);
        const newBoard = _.chunk(boardItems, BINGO_SIZE);

        if (BINGO_SIZE === 5 && newBoard.length === BINGO_SIZE && newBoard[2]?.length === BINGO_SIZE) {
            newBoard[2][2] = 'Free Space';
            setMarked(new Set(['Free Space']));
        }
        setBoard(newBoard);

        // Create randomized calling order
        const randomOrder = _.shuffle(items);
        setCallingOrder(randomOrder);

        // Start calling items in random order
        let callIndex = 0;
        const interval = setInterval(() => {
            if (callIndex >= randomOrder.length) {
                clearInterval(interval);
                return;
            }
            setCalledItems(prev => [...prev, randomOrder[callIndex]]);
            callIndex++;
        }, 3000);
        
        return () => clearInterval(interval);
    };

    useEffect(() => {
        startNewGame();
    }, []);

    const handleMark = (item) => {
        if (calledItems.includes(item) && !marked.has(item)) {
            const newMarked = new Set(marked);
            newMarked.add(item);
            setMarked(newMarked);
            checkBingo(item, newMarked);
        }
    };
    
    const checkBingo = (lastMarked, currentMarked) => {
        // Check rows
        for (let row = 0; row < BINGO_SIZE; row++) {
            if (board[row] && board[row].every(item => currentMarked.has(item))) {
                setIsBingo(true);
                return;
            }
        }
        
        // Check columns
        for (let col = 0; col < BINGO_SIZE; col++) {
            let columnComplete = true;
            for (let row = 0; row < BINGO_SIZE; row++) {
                if (!board[row] || !currentMarked.has(board[row][col])) {
                    columnComplete = false;
                    break;
                }
            }
            if (columnComplete) {
                setIsBingo(true);
                return;
            }
        }
        
        // Check diagonals
        let diagonal1Complete = true;
        let diagonal2Complete = true;
        for (let i = 0; i < BINGO_SIZE; i++) {
            if (!board[i] || !currentMarked.has(board[i][i])) {
                diagonal1Complete = false;
            }
            if (!board[i] || !currentMarked.has(board[i][BINGO_SIZE - 1 - i])) {
                diagonal2Complete = false;
            }
        }
        if (diagonal1Complete || diagonal2Complete) {
            setIsBingo(true);
        }
    };

    if (isBingo) {
        return (
             <div className="p-4 flex flex-col items-center justify-center h-full text-center">
                <Confetti />
                <div className="clay-card p-8 max-w-md">
                    <Star className="w-20 h-20 mx-auto text-yellow-400 mb-4" />
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">BINGO!</h2>
                     <div className="flex gap-4 justify-center">
                        <ClayButton onClick={startNewGame} className="bg-purple-200">
                            <RefreshCw className="mr-2 w-4 h-4"/> Play Again
                        </ClayButton>
                        <ClayButton onClick={() => navigate(createPageUrl('Minigames'))}>
                            <Home className="mr-2 w-4 h-4"/> Minigames
                        </ClayButton>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="p-4 text-center">
            <button onClick={() => navigate(createPageUrl('Minigames'))} className="flex items-center gap-2 mb-6 clay-button p-2">
                <ArrowLeft />
                <span className="font-bold">Back</span>
            </button>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Bible Bingo</h1>
            <div className="clay-card p-4 mb-4">
                <p className="font-bold">Called Item:</p>
                <p className="text-2xl text-purple-600">{calledItems[calledItems.length - 1] || 'Waiting...'}</p>
                <p className="text-sm text-gray-500 mt-2">Items called: {calledItems.length}</p>
            </div>
            
            <div className="grid grid-cols-5 gap-2 aspect-square max-w-md mx-auto">
                {board.flat().map((item, index) => (
                    <div 
                        key={index} 
                        onClick={() => handleMark(item)}
                        className={`flex items-center justify-center text-center p-1 rounded-lg font-bold text-xs cursor-pointer transition-all
                            ${marked.has(item) ? 'bg-purple-300 text-white' : 
                              calledItems.includes(item) ? 'bg-yellow-100 border-2 border-yellow-400' : 'clay-button'}`
                        }
                    >
                       {item}
                    </div>
                ))}
            </div>
            
            <div className="mt-4 clay-card p-4">
                <h3 className="font-bold mb-2">Recently Called:</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                    {calledItems.slice(-8).map((item, index) => (
                        <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}