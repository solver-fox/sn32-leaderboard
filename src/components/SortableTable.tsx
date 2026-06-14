'use client';

import { ReactNode, useState } from 'react';
import { useColumnOrder } from '@/hooks/useColumnOrder';

export interface SortableColumn<T> {
  id: string;
  label: ReactNode;
  sortField?: string;
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T) => ReactNode;
}

interface SortableTableProps<T> {
  tableId: string;
  columns: SortableColumn<T>[];
  defaultOrder: string[];
  data: T[];
  getRowKey: (row: T) => string;
  minWidth?: string;
  className?: string;
  theadClassName?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  emptyRow?: ReactNode;
}

function DragHandle() {
  return (
    <span
      className="mr-1.5 inline-flex cursor-grab text-slate-400 active:cursor-grabbing dark:text-slate-600"
      aria-hidden
    >
      <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5" cy="4" r="1.2" />
        <circle cx="11" cy="4" r="1.2" />
        <circle cx="5" cy="8" r="1.2" />
        <circle cx="11" cy="8" r="1.2" />
        <circle cx="5" cy="12" r="1.2" />
        <circle cx="11" cy="12" r="1.2" />
      </svg>
    </span>
  );
}

export function SortableTable<T>({
  tableId,
  columns,
  defaultOrder,
  data,
  getRowKey,
  minWidth,
  className = 'w-full',
  theadClassName,
  sortBy,
  sortOrder,
  onSort,
  emptyRow,
}: SortableTableProps<T>) {
  const { order, moveColumn } = useColumnOrder(tableId, defaultOrder);
  const [dragColumnId, setDragColumnId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const columnMap = new Map(columns.map((column) => [column.id, column]));
  const orderedColumns = order
    .map((id) => columnMap.get(id))
    .filter((column): column is SortableColumn<T> => column != null);

  return (
    <table className={className} style={minWidth ? { minWidth } : undefined}>
      <thead className={theadClassName}>
        <tr>
          {orderedColumns.map((column) => {
            const sortable = Boolean(column.sortField && onSort);
            const isActiveSort = sortable && sortBy === column.sortField;

            return (
              <th
                key={column.id}
                className={`table-head ${column.headerClassName ?? ''} ${
                  overColumnId === column.id && dragColumnId !== column.id
                    ? 'bg-brand-600/10 ring-1 ring-inset ring-brand-500/30'
                    : ''
                } ${dragColumnId === column.id ? 'opacity-60' : ''}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (dragColumnId && dragColumnId !== column.id) {
                    setOverColumnId(column.id);
                  }
                }}
                onDragLeave={() => {
                  if (overColumnId === column.id) setOverColumnId(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragColumnId) moveColumn(dragColumnId, column.id);
                  setDragColumnId(null);
                  setOverColumnId(null);
                }}
              >
                <div className="flex items-center gap-0.5">
                  <span
                    draggable
                    onDragStart={(event) => {
                      setDragColumnId(column.id);
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', column.id);
                    }}
                    onDragEnd={() => {
                      setDragColumnId(null);
                      setOverColumnId(null);
                    }}
                    className="inline-flex shrink-0 touch-none"
                    title="Drag to reorder column"
                  >
                    <DragHandle />
                  </span>
                  {sortable ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-left transition hover:text-slate-700 dark:hover:text-slate-300"
                      onClick={() => onSort?.(column.sortField!)}
                    >
                      {column.label}
                      {isActiveSort && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </button>
                  ) : (
                    <span>{column.label}</span>
                  )}
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 && emptyRow ? (
          emptyRow
        ) : (
          data.map((row) => (
            <tr key={getRowKey(row)} className="transition hover:bg-slate-100 dark:hover:bg-slate-800/25">
              {orderedColumns.map((column) => (
                <td key={column.id} className={`table-cell ${column.cellClassName ?? ''}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
