'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableSection from '@/components/sortable-section';
import { buildSections } from '@/components/dashboard-sections';
import { Button, Card, Spinner } from '@/components/ui';
import { useDashboardData } from '@/lib/use-dashboard-data';
import { SECTION_LABELS, useSectionOrder } from '@/lib/use-section-order';

export default function DashboardPage() {
  const router = useRouter();
  const {
    accounts,
    selectedAccount,
    selectAccount,
    summary,
    positions,
    snapshots,
    llmSettings,
    overview,
    loading,
    error,
    asOf,
  } = useDashboardData();

  const { order, setOrder, reset } = useSectionOrder();
  const [editMode, setEditMode] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sections = useMemo(
    () =>
      buildSections({
        summary,
        positions,
        snapshots,
        selectedAccount,
        llmSettings,
        overview,
        asOf,
      }),
    [
      summary,
      positions,
      snapshots,
      selectedAccount,
      llmSettings,
      overview,
      asOf,
    ],
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = order.indexOf(active.id as string);
    const newIndex = order.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    setOrder(arrayMove(order, oldIndex, newIndex));
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-sm text-text-muted">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card glow="cyan" className="max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan/10">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-cyan)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
              <polyline points="16,7 22,7 22,13" />
            </svg>
          </div>
          <h2 className="mb-2 font-heading text-xl font-bold">
            Connect Your Portfolio
          </h2>
          <p className="mb-6 text-sm text-text-secondary">
            Connect your Trading212 account to start tracking your portfolio
            performance.
          </p>
          <Button size="lg" onClick={() => router.push('/settings')}>
            Go to Settings
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {accounts.length > 1 && (
            <>
              <label
                htmlFor="account-select"
                className="text-sm font-medium text-text-secondary"
              >
                Account:
              </label>
              <select
                id="account-select"
                value={selectedAccount}
                onChange={(e) => selectAccount(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.label}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editMode && (
            <Button variant="ghost" size="sm" onClick={reset}>
              Reset Order
            </Button>
          )}
          <Button
            variant={editMode ? 'subtle' : 'ghost'}
            size="sm"
            onClick={() => setEditMode(!editMode)}
            className={
              editMode
                ? 'ring-1 ring-cyan/30'
                : 'bg-bg-card text-text-secondary hover:text-text-primary'
            }
          >
            {editMode ? 'Done' : 'Customize Layout'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose/20 bg-rose-glow px-4 py-3 text-sm text-rose">
          {error}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className={`space-y-6 ${editMode ? 'pl-10' : ''}`}>
            {order.map((sectionId) => {
              const content = sections[sectionId];
              if (!content) return null;
              return (
                <SortableSection
                  key={sectionId}
                  id={sectionId}
                  editMode={editMode}
                >
                  {editMode && (
                    <div className="pointer-events-none absolute -top-2 left-3 z-10 rounded bg-cyan/20 px-2 py-0.5 text-[10px] font-semibold text-cyan">
                      {SECTION_LABELS[sectionId] || sectionId}
                    </div>
                  )}
                  {content}
                </SortableSection>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
