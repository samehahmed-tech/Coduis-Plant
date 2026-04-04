import React, { useEffect } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { Search, Palette, Moon, Sun, Globe, Hand, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useFinanceStore } from '../../stores/useFinanceStore';
import { NAV_SECTIONS } from './navigation';
import { UserRole } from '../../types';

interface CommandPaletteProps {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ open, setOpen }) => {
    const navigate = useNavigate();
    const { settings, updateSettings, hasPermission, logout } = useAuthStore();
    const setIsCloseShiftModalOpen = useFinanceStore(s => s.setIsCloseShiftModalOpen);
    const lang = (settings.language || 'en') as 'en' | 'ar';
    const isDarkMode = settings.isDarkMode;
    const isTouchMode = settings.isTouchMode;
    const isAdmin = settings.currentUser?.role === UserRole.SUPER_ADMIN;

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [setOpen]);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-28 sm:pt-36 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className="fixed inset-0"
                onClick={() => setOpen(false)}
            />
            <Command
                className="w-full max-w-3xl relative z-10 bg-card/95 rounded-[1.6rem] shadow-[0_30px_80px_rgba(0,0,0,0.28)] border border-border/20 overflow-hidden flex flex-col mx-4 animate-in zoom-in-95 duration-200"
                onKeyDown={(e) => {
                    if (e.key === 'Escape') setOpen(false);
                }}
            >
                <div className="flex items-center px-5 py-4 border-b border-border/10 bg-elevated/30">
                    <Search className="w-5 h-5 text-muted mr-3 shrink-0" />
                    <Command.Input
                        autoFocus
                        placeholder={lang === 'ar' ? 'ابحث عن صفحة أو نفّذ أمر...' : 'Search pages or run a command...'}
                        className="w-full bg-transparent text-main placeholder-muted text-base md:text-lg outline-none border-none focus:ring-0 p-0 h-auto"
                    />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted/50">Ctrl / Cmd + K</span>
                </div>

                <Command.List className="max-h-[360px] overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-border/50 hover:scrollbar-thumb-border">
                    <Command.Empty className="py-6 text-center text-sm text-muted">
                        {lang === 'ar' ? 'لا توجد نتائج' : 'No results found.'}
                    </Command.Empty>

                    {NAV_SECTIONS.map(section => {
                        const items = section.items.filter(item => hasPermission(item.permission));
                        if (items.length === 0) return null;
                        return (
                            <Command.Group
                                key={section.id}
                                heading={lang === 'ar' ? section.labelAr : section.label}
                                className="px-2 py-1 text-[10px] text-muted/70 font-black uppercase tracking-widest mb-2"
                            >
                                {items.map(item => {
                                    const Icon = item.icon;
                                    return (
                                        <Command.Item
                                            key={item.id}
                                            onSelect={() => runCommand(() => navigate(item.path))}
                                            className="cursor-pointer flex items-center px-4 py-3 text-sm text-main hover:bg-elevated/50 rounded-xl aria-selected:bg-elevated/50 transition-colors my-1"
                                        >
                                            <Icon className="w-4 h-4 mr-3 text-primary/70" />
                                            {lang === 'ar' ? item.labelAr : item.label}
                                        </Command.Item>
                                    );
                                })}
                            </Command.Group>
                        );
                    })}

                    <Command.Group heading={lang === 'ar' ? 'إجراءات' : 'Actions'} className="px-2 py-1 text-[10px] text-muted/70 font-black uppercase tracking-widest mt-4 border-t border-border/10 pt-3">
                        <Command.Item onSelect={() => runCommand(() => updateSettings({ isDarkMode: !isDarkMode }))} className="cursor-pointer flex items-center px-4 py-3 text-sm text-main hover:bg-elevated/50 rounded-xl aria-selected:bg-elevated/50 transition-colors my-1">
                            {isDarkMode ? <Sun className="w-4 h-4 mr-3 text-amber-500" /> : <Moon className="w-4 h-4 mr-3 text-slate-500" />}
                            {isDarkMode ? (lang === 'ar' ? 'وضع النهار' : 'Light Mode') : (lang === 'ar' ? 'وضع الليل' : 'Dark Mode')}
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => updateSettings({ language: lang === 'en' ? 'ar' : 'en' }))} className="cursor-pointer flex items-center px-4 py-3 text-sm text-main hover:bg-elevated/50 rounded-xl aria-selected:bg-elevated/50 transition-colors my-1">
                            <Globe className="w-4 h-4 mr-3 text-primary/70" />
                            {lang === 'ar' ? 'English' : 'العربية'}
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => updateSettings({ isTouchMode: !isTouchMode }))} className="cursor-pointer flex items-center px-4 py-3 text-sm text-main hover:bg-elevated/50 rounded-xl aria-selected:bg-elevated/50 transition-colors my-1">
                            <Hand className="w-4 h-4 mr-3 text-emerald-500" />
                            {isTouchMode ? (lang === 'ar' ? 'تعطيل اللمس' : 'Disable Touch') : (lang === 'ar' ? 'تفعيل اللمس' : 'Enable Touch')}
                        </Command.Item>
                        <Command.Item onSelect={() => runCommand(() => setIsCloseShiftModalOpen(true))} className="cursor-pointer flex items-center px-4 py-3 text-sm text-main hover:bg-elevated/50 rounded-xl aria-selected:bg-elevated/50 transition-colors my-1">
                            <LogOut className="w-4 h-4 mr-3 text-rose-500" />
                            {lang === 'ar' ? 'إغلاق الوردية' : 'Close Shift'}
                        </Command.Item>
                        {isAdmin && (
                            <Command.Item onSelect={() => runCommand(() => updateSettings({ theme: 'modern' }))} className="cursor-pointer flex items-center px-4 py-3 text-sm text-main hover:bg-elevated/50 rounded-xl aria-selected:bg-elevated/50 transition-colors my-1">
                                <Palette className="w-4 h-4 mr-3 text-primary/70" />
                                {lang === 'ar' ? 'تطبيق سمة أساسية' : 'Apply Base Theme'}
                            </Command.Item>
                        )}
                        <Command.Item onSelect={() => runCommand(() => { logout(); navigate('/login'); })} className="cursor-pointer flex items-center px-4 py-3 text-sm text-main hover:bg-elevated/50 rounded-xl aria-selected:bg-elevated/50 transition-colors my-1">
                            <LogOut className="w-4 h-4 mr-3 text-muted" />
                            {lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                        </Command.Item>
                    </Command.Group>
                </Command.List>
            </Command>
        </div>
    );
};

export default CommandPalette;
