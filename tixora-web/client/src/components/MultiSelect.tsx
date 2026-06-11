import { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type MultiSelectOption = {
  value: string;
  label: string;
  color?: string;
};

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  max?: number;
}

export function MultiSelect({ options, value, onChange, placeholder = "Select...", disabled, className, max }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  );

  const selectedOptions = options.filter((o) => value.includes(o.value));

  function toggle(val: string) {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      if (max && value.length >= max) return;
      onChange([...value, val]);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="w-full justify-between font-normal border-[hsl(var(--input))] bg-[hsl(var(--card))]"
          >
            <span className={cn("truncate", selectedOptions.length === 0 && "text-[hsl(var(--muted-foreground))]")}>
              {selectedOptions.length === 0
                ? placeholder
                : `${selectedOptions.length} selected`}
            </span>
            <ChevronDown className="w-4 h-4 flex-shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[--radix-popover-trigger-width] border-[hsl(var(--border))]" align="start">
          <div className="p-2 border-b border-[hsl(var(--border))]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
              <Input
                className="pl-7 h-8 text-sm bg-transparent border-[hsl(var(--input))]"
                placeholder="Search roles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="text-center text-sm text-[hsl(var(--muted-foreground))] py-4">No results.</p>
            )}
            {filtered.map((o) => {
              const selected = value.includes(o.value);
              return (
                <button
                  key={o.value}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-[hsl(var(--accent))] transition-colors",
                    selected && "bg-[hsl(var(--accent))]/50"
                  )}
                  onClick={() => toggle(o.value)}
                >
                  {o.color && (
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-white/10"
                      style={{ background: o.color === "#000000" ? "#99AAB5" : o.color }}
                    />
                  )}
                  <span className="flex-1 text-left truncate">{o.label}</span>
                  {selected && <Check className="w-3.5 h-3.5 flex-shrink-0 text-[hsl(var(--primary))]" />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((o) => (
            <Badge
              key={o.value}
              variant="secondary"
              className="gap-1 pr-1 text-xs"
              style={o.color && o.color !== "#000000" ? { borderColor: o.color + "60", backgroundColor: o.color + "20" } : undefined}
            >
              {o.color && (
                <span className="w-2 h-2 rounded-full" style={{ background: o.color === "#000000" ? "#99AAB5" : o.color }} />
              )}
              {o.label}
              <button
                className="ml-0.5 rounded hover:bg-[hsl(var(--muted))] p-0.5"
                onClick={(e) => { e.stopPropagation(); toggle(o.value); }}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
