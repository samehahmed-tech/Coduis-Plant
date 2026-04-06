import { create } from 'zustand';

export interface AIWidget {
    id: string;
    content: string;
    type: 'insight' | 'warning' | 'action';
    actionLabel?: string;
    onAction?: () => void;
    timestamp: number;
}

interface AIWidgetState {
    widgets: AIWidget[];
    addWidget: (widget: Omit<AIWidget, 'id' | 'timestamp'>) => void;
    removeWidget: (id: string) => void;
}

export const useAIWidgetStore = create<AIWidgetState>((set) => ({
    widgets: [],
    addWidget: (widget) => set((state) => {
        const newWidget: AIWidget = {
            ...widget,
            id: `ai-widget-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
        };
        // Keep max 2 widgets as per rules.md
        const newWidgets = [newWidget, ...state.widgets].slice(0, 2);
        return { widgets: newWidgets };
    }),
    removeWidget: (id) => set((state) => ({
        widgets: state.widgets.filter(w => w.id !== id)
    })),
}));
