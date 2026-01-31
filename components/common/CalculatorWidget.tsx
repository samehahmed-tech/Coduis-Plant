import React, { useState } from 'react';

interface CalculatorWidgetProps {
    onClose?: () => void;
    isCompact?: boolean;
}

const CalculatorWidget: React.FC<CalculatorWidgetProps> = ({ onClose, isCompact }) => {
    const [display, setDisplay] = useState('0');
    const [equation, setEquation] = useState('');

    const handleInput = (char: string) => {
        if (char === 'C') {
            setDisplay('0');
            setEquation('');
        } else if (char === '=') {
            try {
                // Safely evaluate simple arithmetic
                // eslint-disable-next-line no-eval
                const result = eval(equation).toString();
                setDisplay(result);
                setEquation(result);
            } catch {
                setDisplay('Error');
                setEquation('');
            }
        } else {
            const newEquation = equation === '0' || display === 'Error' ? char : equation + char;
            setEquation(newEquation);
            setDisplay(newEquation);
        }
    };

    const keys = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', 'C', '=', '+'];

    return (
        <div className={`${isCompact ? 'p-2' : 'p-6'} bg-elevated border border-border rounded-[1.5rem] shadow-2xl w-full backdrop-blur-xl bg-opacity-90 animate-in zoom-in duration-300`}>
            {onClose && (
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">Scientific Terminal</span>
                    <button onClick={onClose} className="text-muted hover:text-primary transition-colors text-xs font-black uppercase">Close</button>
                </div>
            )}
            <div className={`${isCompact ? 'p-3 mb-3' : 'p-6 mb-6'} bg-app/50 rounded-xl text-right overflow-hidden border border-border shadow-inner`}>
                <p className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} text-primary font-bold uppercase tracking-widest mb-0.5 opacity-70`}>{equation || '0'}</p>
                <p className={`${isCompact ? 'text-xl' : 'text-4xl'} font-black text-main truncate font-mono tracking-tighter`}>{display}</p>
            </div>
            <div className={`grid grid-cols-4 ${isCompact ? 'gap-1.5' : 'gap-4'}`}>
                {keys.map(k => (
                    <button
                        key={k}
                        onClick={() => handleInput(k)}
                        className={`
              ${isCompact ? 'h-10 text-sm rounded-xl' : 'h-16 text-lg rounded-2xl'} flex items-center justify-center font-black transition-all active:scale-90
              ${k === '=' ? 'bg-primary text-white col-span-1 shadow-lg shadow-primary/20 ring-1 ring-white/10' :
                                k === 'C' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20' :
                                    ['/', '*', '-', '+'].includes(k) ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20' :
                                        'bg-card text-main border border-border hover:border-primary/50 shadow-sm'}
            `}
                    >
                        {k}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CalculatorWidget;
