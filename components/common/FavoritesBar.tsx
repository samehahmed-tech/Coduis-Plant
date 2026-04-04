import React from 'react';
import { Star } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface FavoritesBarProps {
    favorites: string[];
    navItems: Array<{ path: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }>;
    isCollapsed?: boolean;
}

const FavoritesBar: React.FC<FavoritesBarProps> = ({ favorites, navItems, isCollapsed }) => {
    if (favorites.length === 0) return null;

    const favItems = favorites
        .map(path => navItems.find(n => n.path === path))
        .filter(Boolean) as Array<{ path: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }>;

    if (favItems.length === 0) return null;

    return (
        <div className="mb-4 px-1">
            {!isCollapsed && (
                <div className="flex items-center gap-1.5 px-3 mb-2">
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                    <span className="text-[8px] font-black text-amber-500/70 uppercase tracking-[0.2em]">Favorites</span>
                </div>
            )}
            <div className={`flex ${isCollapsed ? 'flex-col items-center' : 'flex-wrap'} gap-1.5`}>
                {favItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center gap-2 rounded-xl transition-all duration-300 group
              ${isCollapsed ? 'p-2.5 justify-center' : 'px-3 py-2'}
              ${isActive
                                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30 shadow-sm'
                                : 'bg-elevated/30 text-muted hover:text-amber-500 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20'
                            }
            `}
                    >
                        <item.icon size={14} />
                        {!isCollapsed && (
                            <span className="text-[9px] font-black uppercase tracking-wider">{item.label}</span>
                        )}
                    </NavLink>
                ))}
            </div>
        </div>
    );
};

export default FavoritesBar;
