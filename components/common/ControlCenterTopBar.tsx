import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

interface TopBarProps {
    onOpenCommandPalette: () => void;
}

const ControlCenterTopBar: React.FC<TopBarProps> = ({ onOpenCommandPalette }) => {
    const { settings } = useAuthStore();
    const user = settings.currentUser;

    return (
        <div className="flex items-center justify-between px-6 py-3 bg-card/60 backdrop-blur-3xl border-b border-border/20 sticky top-0 z-50">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/20 flex items-center justify-center text-white font-black text-sm">
                        R
                    </div>
                    <span className="font-black tracking-tight text-main hidden md:block">RestoFlow ERP</span>
                </div>
            </div>

            <div className="flex-1 max-w-xl px-8 hidden md:block">
                <button
                    onClick={onOpenCommandPalette}
                    className="w-full flex items-center justify-between px-4 py-2 bg-elevated/40 hover:bg-elevated border border-border/30 rounded-full text-sm text-muted transition-colors group cursor-text"
                >
                    <div className="flex items-center gap-2">
                        <Search size={16} className="text-muted group-hover:text-main transition-colors" />
                        <span>Search or jump to...</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <kbd className="px-2 py-0.5 text-[10px] font-bold bg-card border border-border/30 rounded shadow-sm text-muted">⌘</kbd>
                        <kbd className="px-2 py-0.5 text-[10px] font-bold bg-card border border-border/30 rounded shadow-sm text-muted">K</kbd>
                    </div>
                </button>
            </div>

            <div className="flex items-center gap-3">
                <button className="p-2 text-muted hover:text-main hover:bg-elevated/50 rounded-full transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-card" />
                </button>
                <div className="w-px h-6 bg-border/40 mx-1 hidden md:block" />
                <button className="flex items-center gap-2 p-1 pl-2 pr-3 bg-elevated/40 hover:bg-elevated/80 border border-border/20 rounded-full transition-colors">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-black uppercase shadow-inner">
                        {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
                    </div>
                    <Settings size={14} className="text-muted" />
                </button>
            </div>
        </div>
    );
};

export default ControlCenterTopBar;
