import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Store, Package, Wallet, Users } from 'lucide-react';

export const workspaces = [
    { id: 'dashboard', label: 'Overview', icon: Compass, path: '/' },
    { id: 'pos', label: 'Sales', icon: Store, path: '/pos' },
    { id: 'inventory', label: 'Inventory', icon: Package, path: '/inventory' },
    { id: 'finance', label: 'Finance', icon: Wallet, path: '/reports' },
    { id: 'hr', label: 'HR', icon: Users, path: '/hr' },
];

interface WorkspaceSwitcherProps {
    activeId: string;
    onChange: (id: string, path: string) => void;
}

const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({ activeId, onChange }) => {
    return (
        <div className="px-6 py-2 bg-card/40 backdrop-blur-xl border-b border-border/10 relative z-40">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {workspaces.map((ws) => {
                    const isActive = activeId === ws.id;
                    return (
                        <button
                            key={ws.id}
                            onClick={() => onChange(ws.id, ws.path)}
                            className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${isActive ? 'text-main' : 'text-muted hover:text-main'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="workspace-active-bg"
                                    className="absolute inset-0 bg-elevated rounded-full border border-border/20 shadow-sm"
                                    initial={false}
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2">
                                <ws.icon size={16} className={isActive ? 'text-indigo-400' : ''} />
                                {ws.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default WorkspaceSwitcher;
