'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  id: string;
  children: React.ReactNode;
  editMode: boolean;
}

export default function SortableSection({ id, children, editMode }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {editMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-1/2 z-10 flex h-8 w-8 -translate-x-full -translate-y-1/2 cursor-grab items-center justify-center rounded-lg bg-cyan/10 text-cyan opacity-0 transition-opacity group-hover:opacity-100 hover:bg-cyan/20 active:cursor-grabbing"
          style={{ opacity: 1 }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="5" r="1" />
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
        </div>
      )}
      {editMode && (
        <div
          className={`pointer-events-none absolute inset-0 rounded-xl border-2 border-dashed transition-colors ${
            isDragging ? 'border-cyan/40' : 'border-cyan/15'
          }`}
        />
      )}
      {children}
    </div>
  );
}
