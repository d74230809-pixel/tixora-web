import { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  icon?: string;
  color?: string;
  description?: string;
};

interface SearchableSelectProps {
  options: SelectOption[];
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  nullable?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  options, value, onChange, placeholder = "Select...",
  nullable, disabled, className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  );

  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn("w-full justify-between font-normal border-[hsl(var(--input))] bg-[hsl(var(--card))]", className)}
        >
          <span className={cn("truncate", !selected && "text-[hsl(var(--muted-foreground))]")}>
            {selected ? (
              <span className="flex items-center gap-2">
                {selected.color && (
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: selected.color }} />
                )}
                {selected.icon && <span>{selected.icon}</span>}
                {selected.label}
              </span>
            ) : placeholder}
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
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {nullable && (
            <button
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-[hsl(var(--accent))] transition-colors text-[hsl(var(--muted-foreground))]"
              onClick={() => { onChange(null); setOpen(false); setSearch(""); }}
            >
              None
            </button>
          )}
          {filtered.length === 0 && (
            <p className="text-center text-sm text-[hsl(var(--muted-foreground))] py-4">No results.</p>
          )}
          {filtered.map((o) => (
            <button
              key={o.value}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-[hsl(var(--accent))] transition-colors"
              onClick={() => { onChange(o.value); setOpen(false); setSearch(""); }}
            >
              {o.color && <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: o.color }} />}
              {o.icon && <span>{o.icon}</span>}
              <span className="flex-1 text-left truncate">{o.label}</span>
              {value === o.value && <Check className="w-3.5 h-3.5 flex-shrink-0 text-[hsl(var(--primary))]" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
