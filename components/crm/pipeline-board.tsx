"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import { updateDealStageAction } from "@/lib/actions/deals";
import {
  PIPELINE_STAGE_IDS,
  PIPELINE_STAGES,
  isPipelineStage,
  stageLabel,
  type PipelineStageId,
} from "@/lib/crm/pipeline-stages";
import { formatDate, formatMoney } from "@/lib/format";
import type { DealWithClient } from "@/lib/types";
import { cn } from "@/lib/utils";

function groupByStage(
  deals: DealWithClient[]
): Record<PipelineStageId, DealWithClient[]> {
  const buckets = Object.fromEntries(
    PIPELINE_STAGE_IDS.map((id) => [id, [] as DealWithClient[]])
  ) as Record<PipelineStageId, DealWithClient[]>;
  for (const d of deals) {
    if (isPipelineStage(d.stage)) {
      buckets[d.stage].push(d);
    }
  }
  return buckets;
}

function DealCardContent({
  deal,
  className,
}: {
  deal: DealWithClient;
  className?: string;
}) {
  const clientName = deal.clients?.name ?? "Unknown client";
  return (
    <div
      className={cn(
        "bg-card border-border rounded-lg border p-3 shadow-sm",
        className
      )}
    >
      <p className="text-sm font-medium leading-snug">{deal.title}</p>
      <p className="text-muted-foreground mt-1 text-xs">{clientName}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="font-medium tabular-nums">
          {formatMoney(Number(deal.value ?? 0), deal.currency || "USD")}
        </span>
        <span className="text-muted-foreground">
          {Number(deal.probability ?? 0)}%
        </span>
        {deal.expected_close ? (
          <span className="text-muted-foreground">
            · {formatDate(deal.expected_close)}
          </span>
        ) : null}
      </div>
      <Link
        href={`/clients/${deal.client_id}`}
        className="text-primary mt-2 inline-block text-xs font-medium hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        View client
      </Link>
    </div>
  );
}

function DealCard({ deal }: { deal: DealWithClient }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: deal.id,
      data: { deal },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-none cursor-grab active:cursor-grabbing",
        isDragging && "opacity-0"
      )}
      {...listeners}
      {...attributes}
    >
      <DealCardContent deal={deal} />
    </div>
  );
}

function KanbanColumn({
  stage,
  deals,
}: {
  stage: PipelineStageId;
  deals: DealWithClient[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const label = stageLabel(stage);
  const isClosed = stage === "won" || stage === "lost";

  return (
    <div
      className={cn(
        "bg-muted/40 flex w-[min(100%,300px)] shrink-0 flex-col rounded-xl border",
        isClosed ? "border-muted" : "border-border",
        isOver && "ring-primary ring-2 ring-offset-2 ring-offset-background"
      )}
    >
      <div className="border-border flex items-center justify-between border-b px-3 py-2.5">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {deals.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className="flex min-h-[min(280px,45vh)] flex-1 flex-col gap-2 overflow-y-auto p-2"
      >
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  );
}

export function PipelineBoard({ deals }: { deals: DealWithClient[] }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  const byStage = useMemo(() => groupByStage(deals), [deals]);
  const activeDeal = activeId
    ? deals.find((d) => d.id === activeId)
    : undefined;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  );

  function onDragStart(event: DragStartEvent) {
    setMoveError(null);
    setActiveId(String(event.active.id));
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const dealId = String(active.id);
    const overId = String(over.id);
    if (!isPipelineStage(overId)) return;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === overId) return;

    try {
      await updateDealStageAction(dealId, overId);
      router.refresh();
    } catch (e) {
      setMoveError(e instanceof Error ? e.message : "Could not move deal.");
    }
  }

  function onDragCancel() {
    setActiveId(null);
  }

  return (
    <div>
      {moveError ? (
        <p className="text-destructive mb-4 text-sm" role="alert">
          {moveError}
        </p>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="flex gap-4 overflow-x-auto pb-2 md:pb-4">
          {PIPELINE_STAGES.map(({ id }) => (
            <KanbanColumn key={id} stage={id} deals={byStage[id]} />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDeal ? (
            <DealCardContent
              deal={activeDeal}
              className="shadow-lg ring-primary/20 cursor-grabbing ring-2"
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
