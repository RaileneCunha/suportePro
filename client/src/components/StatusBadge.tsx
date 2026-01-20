import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "open" | "in_progress" | "resolved" | "closed";

const variants: Record<Status, string> = {
  open: "bg-muted text-muted-foreground border-border hover:bg-accent",
  in_progress: "bg-secondary text-foreground border-border hover:bg-muted",
  resolved: "bg-muted text-muted-foreground border-border hover:bg-accent",
  closed: "bg-secondary text-muted-foreground border-border hover:bg-muted",
};

const labels: Record<Status, string> = {
  open: "Aberto",
  in_progress: "Em Andamento",
  resolved: "Resolvido",
  closed: "Fechado",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const normalizedStatus = (status as Status) || "open";
  return (
    <Badge variant="outline" className={cn("font-medium", variants[normalizedStatus], className)}>
      {labels[normalizedStatus]}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    low: "text-muted-foreground bg-muted",
    medium: "text-foreground bg-secondary",
    high: "text-foreground bg-muted",
    critical: "text-background bg-foreground font-bold",
  };

  const labels: Record<string, string> = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    critical: "Crítica",
  };

  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold", colors[priority] || colors.medium)}>
      {labels[priority] || priority}
    </span>
  );
}
