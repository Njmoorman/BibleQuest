
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const ConfettiPiece = ({ x, y, rotation, color }) => {
    const variants = {
        initial: { y: -10, opacity: 1 },
        animate: { 
            y: y + Math.random() * 100, 
            x: x + (Math.random() - 0.5) * 200,
            opacity: 0,
            rotate: rotation + (Math.random() - 0.5) * 360,
        },
    };

    return (
        <motion.div
            style={{ 
                position: 'absolute', 
                left: '50%', 
                top: '50%',
                width: '10px',
                height: '10px',
                backgroundColor: color,
            }}
            variants={variants}
            initial="initial"
            animate="animate"
            transition={{ duration: 2 + Math.random() * 2, ease: "easeOut" }}
        />
    );
};

export default function Confetti({ count = 100 }) {
    const [pieces, setPieces] = useState([]);
    const colors = ['#fde68a', '#86efac', '#93c5fd', '#f9a8d4', '#a78bfa'];

    useEffect(() => {
        const newPieces = Array.from({ length: count }).map((_, i) => ({
            id: i,
            x: 0,
            y: 0,
            rotation: Math.random() * 360,
            color: colors[Math.floor(Math.random() * colors.length)],
        }));
        setPieces(newPieces);
    }, [count, colors]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
            {pieces.map(piece => <ConfettiPiece key={piece.id} {...piece} />)}
        </div>
    );
}
