"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { computeInvoiceTotals } from "@/lib/invoice/compute-totals";
import type { InvoiceLineItem } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function emptyLine(): InvoiceLineItem {
  return { description: "", quantity: 1, unit_price: 0 };
}

export function InvoiceLineEditor({
  initialLines,
  taxRate,
  currency,
  name = "line_items",
}: {
  initialLines: InvoiceLineItem[];
  taxRate: number;
  currency: string;
  name?: string;
}) {
  const [lines, setLines] = useState<InvoiceLineItem[]>(() =>
    initialLines.length > 0 ? initialLines : [emptyLine()]
  );

  const json = useMemo(() => JSON.stringify(lines), [lines]);

  const { subtotal, total } = useMemo(
    () => computeInvoiceTotals(lines, taxRate),
    [lines, taxRate]
  );

  function updateLine(
    index: number,
    patch: Partial<InvoiceLineItem>
  ) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line))
    );
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name={name} value={json} readOnly />

      <div className="space-y-2">
        <Label>Line items</Label>
        <div className="space-y-2">
          {lines.map((line, index) => (
            <div
              key={index}
              className="border-border flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-end"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <span className="text-muted-foreground text-xs">Description</span>
                <Input
                  value={line.description}
                  onChange={(e) =>
                    updateLine(index, { description: e.target.value })
                  }
                  placeholder="e.g. Discovery workshop"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:w-40">
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">Qty</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.quantity || ""}
                    onChange={(e) =>
                      updateLine(index, {
                        quantity: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-xs">Unit</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unit_price || ""}
                    onChange={(e) =>
                      updateLine(index, {
                        unit_price: Number.parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              {lines.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() =>
                    setLines((prev) => prev.filter((_, i) => i !== index))
                  }
                  aria-label="Remove line"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => setLines((prev) => [...prev, emptyLine()])}
        >
          <Plus className="h-4 w-4" />
          Add line
        </Button>
      </div>

      <div className="bg-muted/50 space-y-1 rounded-lg p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">{formatMoney(subtotal, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax ({taxRate}%)</span>
          <span className="tabular-nums">
            {formatMoney(total - subtotal, currency)}
          </span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span className="tabular-nums">{formatMoney(total, currency)}</span>
        </div>
      </div>
    </div>
  );
}
