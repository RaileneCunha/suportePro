import { useTickets } from "@/hooks/use-tickets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Clock, Users, CheckCircle, Ticket, BarChart2, BookOpen } from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { data: response, isLoading } = useTickets();
  const tickets = response?.tickets || [];

  if (isLoading) {
    return <div className="p-8 animate-pulse">Loading dashboard...</div>;
  }

  const stats = [
    { label: "Total de Chamados", value: tickets.length || 0, icon: Activity, href: "/tickets" },
    { label: "Chamados Abertos", value: tickets.filter(t => t.status === "open").length || 0, icon: Clock, href: "/tickets?status=open" },
    { label: "Resolvidos", value: tickets.filter(t => t.status === "resolved").length || 0, icon: CheckCircle, href: "/tickets?status=resolved" },
    { label: "Não Atribuídos", value: tickets.filter(t => !t.assignedToId).length || 0, icon: Users, href: "/tickets?unassigned=true" },
  ];

  return (
    <div className="space-y-4 animate-slide-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Painel</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do desempenho do suporte e volume de chamados.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, i) => (
          <Link key={i} href={stat.href}>
            <Card className="border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary group">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <h3 className="text-xl font-bold mt-0.5 group-hover:text-primary transition-colors">{stat.value}</h3>
                </div>
                <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:scale-110 transition-transform">
                  <stat.icon className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="h-full shadow-sm border">
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {tickets.slice(0, 5).map((ticket) => (
                  <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                    <div className="flex items-start justify-between p-3 rounded-lg hover:bg-secondary border border-transparent hover:border-border transition-all cursor-pointer group">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {ticket.id}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{ticket.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ticket.description}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{formatDistanceToNow(new Date(ticket.createdAt || ""), { addSuffix: true })}</span>
                            <span>•</span>
                            <PriorityBadge priority={ticket.priority} />
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={ticket.status} />
                    </div>
                  </Link>
                ))}
                {tickets.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">Nenhum chamado recente</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full shadow-sm border bg-foreground text-background">
            <CardHeader className="p-4">
              <CardTitle className="text-lg text-background">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <Link href="/tickets">
                <Button variant="outline" className="w-full justify-start bg-background/10 hover:bg-background/20 text-background border-border/20 h-9 text-xs">
                  <Ticket className="mr-2 h-3.5 w-3.5" />
                  Ver Todos os Chamados
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" className="w-full justify-start bg-background/10 hover:bg-background/20 text-background border-border/20 h-9 text-xs">
                  <BarChart2 className="mr-2 h-3.5 w-3.5" />
                  Gerar Relatório
                </Button>
              </Link>
              <Link href="/knowledge-base">
                <Button variant="outline" className="w-full justify-start bg-background/10 hover:bg-background/20 text-background border-border/20 h-9 text-xs">
                  <BookOpen className="mr-2 h-3.5 w-3.5" />
                  Criar Artigo
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
