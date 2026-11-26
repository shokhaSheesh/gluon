import { useState, type DragEvent } from 'react';

/**
 * Drag-and-drop reordering for list / table rows.
 * Spread `rowProps(i)` on each row; `onMove(from, to)` gets called on drop.
 */
export function useDragList(onMove: (from: number, to: number) => void) {
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const reset = () => { setDrag(null); setOver(null); };
  const rowProps = (i: number) => ({
    draggable: true,
    onDragStart: () => setDrag(i),
    onDragOver: (e: DragEvent) => { e.preventDefault(); setOver(i); },
    onDrop: () => { if (drag !== null && drag !== i) onMove(drag, i); reset(); },
    onDragEnd: reset,
    'data-drag': drag === i ? 'dragging' : over === i && drag !== null ? 'over' : undefined,
  });
  return { rowProps };
}

/** Move an item inside a copy of the array. */
export const moveItem = <T,>(list: T[], from: number, to: number) => {
  const next = [...list];
  const [m] = next.splice(from, 1);
  next.splice(to, 0, m);
  return next;
};
