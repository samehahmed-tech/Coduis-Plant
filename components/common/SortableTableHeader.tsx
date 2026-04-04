import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Column<T> {
    key: keyof T;
    label: string;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
}

interface SortableTableHeaderProps<T> {
    columns: Column<T>[];
    sortKey: keyof T | null;
    sortDir: 'asc' | 'desc';
    onSort: (key: keyof T) => void;
}

/**
 * Reusable sortable table header row.
 *
 * Usage:
 *   <table><SortableTableHeader columns={cols} sortKey={sortConfig.key}
 *     sortDir={sortConfig.direction} onSort={requestSort} /></table>
 */
function SortableTableHeader<T>({ columns, sortKey, sortDir, onSort }: SortableTableHeaderProps<T>) {
    return (
        <thead>
            <tr className="border-b border-border/50">
                {columns.map(col => (
                    <th key={String(col.key)}
                        className={`px-4 py-3 text-[8px] font-black uppercase tracking-[0.2em] text-muted ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                        style={col.width ? { width: col.width } : undefined}>
                        {col.sortable !== false ? (
                            <button onClick={() => onSort(col.key)}
                                className="inline-flex items-center gap-1 hover:text-primary transition-colors group">
                                {col.label}
                                {sortKey === col.key
                                    ? sortDir === 'asc' ? <ArrowUp size={10} className="text-primary" /> : <ArrowDown size={10} className="text-primary" />
                                    : <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-50 transition-opacity" />}
                            </button>
                        ) : col.label}
                    </th>
                ))}
            </tr>
        </thead>
    );
}

export default SortableTableHeader;
