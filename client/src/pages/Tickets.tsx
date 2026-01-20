import { useTickets, useCreateTicket } from "@/hooks/use-tickets";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Link, useLocation } from "wouter";
import { Plus, Search, Filter, Ticket, ArrowLeft, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTicketSchema, type InsertTicket } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { format } from "date-fns";

export default function Tickets() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchText, setSearchText] = useState<string>("");
  const itemsPerPage = 20;
  
  // Calcular range baseado na página atual
  const calculateRange = (page: number): string => {
    const start = (page - 1) * itemsPerPage + 1;
    const end = page * itemsPerPage;
    return `${start}-${end}`;
  };

  const range = calculateRange(currentPage);
  const order = 'DESC';
  
  // Resetar para primeira página quando searchText mudar
  useEffect(() => {
    if (searchText) {
      setCurrentPage(1);
    }
  }, [searchText]);
  
  const { data: response, isLoading } = useTickets({ 
    range, 
    order, 
    searchText: searchText.trim() || undefined 
  });
  const createTicket = useCreateTicket();

  // Extrair tickets e paginação da resposta
  const tickets = response?.tickets || [];
  const totalTickets = response?.pagination?.total || 0;
  const itemsPerPageFromResponse = response?.pagination?.itemsPerPage || itemsPerPage;

  // Read query params from URL and apply filters
  useEffect(() => {
    const url = new URL(window.location.href);
    const statusParam = url.searchParams.get("status");
    const unassignedParam = url.searchParams.get("unassigned");
    const pageParam = url.searchParams.get("page");

    if (statusParam) {
      setFilterStatus(statusParam);
    } else if (unassignedParam === "true") {
      setFilterStatus("unassigned");
    } else {
      setFilterStatus("all");
    }

    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (!isNaN(page) && page > 0) {
        setCurrentPage(page);
      }
    }
  }, [location]);

  const form = useForm<InsertTicket>({
    resolver: zodResolver(insertTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      category: "general",
      channel: "web",
      status: "open",
      customerId: user?.id || "",
    },
  });

  const onSubmit = (data: InsertTicket) => {
    createTicket.mutate({ ...data, customerId: user?.id || "unknown" }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        form.reset();
      }
    });
  };

  const filteredTickets = tickets.filter(t => {
    if (filterStatus === "all") return true;
    if (filterStatus === "unassigned") return !t.assignedToId;
    return t.status === filterStatus;
  });

  // Usar os tickets diretamente sem paginação local (já vem paginado do backend)
  const paginatedTickets = filteredTickets;
  
  // Calcular total de páginas baseado no total de tickets retornado pelo GLPI
  const totalPages = Math.ceil(totalTickets / itemsPerPageFromResponse);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const goToNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Chamados</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie e acompanhe as solicitações de suporte.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Novo Chamado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Chamado</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assunto</FormLabel>
                      <FormControl>
                        <Input placeholder="Resumo breve do problema" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a prioridade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="critical">Crítica</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">Geral</SelectItem>
                            <SelectItem value="billing">Faturamento</SelectItem>
                            <SelectItem value="technical">Técnico</SelectItem>
                            <SelectItem value="feature">Solicitação de Recurso</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Explicação detalhada..." className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createTicket.isPending}>
                    {createTicket.isPending ? "Criando..." : "Criar Chamado"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Pesquisar chamados por título ou descrição..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      <div className="flex gap-2 pb-2 overflow-x-auto">
        {["all", "open", "in_progress", "resolved", "closed", "unassigned"].map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? "default" : "outline"}
            size="sm"
            className="rounded-full px-4 text-xs h-8"
            onClick={() => {
              setFilterStatus(status);
              // Update URL without reload
              const url = new URL(window.location.href);
              if (status === "all") {
                url.searchParams.delete("status");
                url.searchParams.delete("unassigned");
              } else if (status === "unassigned") {
                url.searchParams.delete("status");
                url.searchParams.set("unassigned", "true");
              } else {
                url.searchParams.delete("unassigned");
                url.searchParams.set("status", status);
              }
              window.history.pushState({}, "", url.toString());
            }}
          >
            {status === "all" ? "Todos" : 
             status === "open" ? "Aberto" : 
             status === "in_progress" ? "Em Andamento" : 
             status === "resolved" ? "Resolvido" : 
             status === "closed" ? "Fechado" : "Não Atribuídos"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-secondary animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <>
          <ScrollArea className="h-[calc(100vh-280px)] pr-4">
            <div className="space-y-2">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12 bg-secondary rounded-xl border border-dashed border-border">
                  <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-base font-medium text-foreground">Nenhum chamado encontrado</h3>
                  <p className="text-sm text-muted-foreground">Crie um novo chamado para começar.</p>
                </div>
              ) : paginatedTickets.map((ticket) => {
            const isGLPI = ticket.source === 'glpi';
            const ticketCard = (
              <Card className={`transition-all duration-200 border ${!isGLPI ? 'hover:shadow-md cursor-pointer group hover:border-primary' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                    <div className="flex gap-3 items-start flex-1">
                      <div className="mt-0.5 hidden sm:block">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-sm ${
                          isGLPI 
                            ? 'bg-muted text-muted-foreground' 
                            : 'bg-primary/10 text-primary'
                        }`}>
                          #{isGLPI ? `G${ticket.id}` : ticket.id}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className={`text-base font-bold text-foreground truncate ${!isGLPI && 'group-hover:text-primary'} transition-colors`}>
                            {ticket.title}
                          </h3>
                          {isGLPI && (
                            <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[9px] px-1.5 py-0">
                              <ExternalLink className="w-2.5 h-2.5 mr-0.5" />
                              GLPI
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 max-w-xl">{ticket.description}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                          <span className="font-medium px-1.5 py-0.5 bg-secondary rounded text-foreground uppercase tracking-wide text-[9px]">
                            {ticket.category === 'general' ? 'Geral' : 
                             ticket.category === 'billing' ? 'Faturamento' :
                             ticket.category === 'technical' ? 'Técnico' : 'Recurso'}
                          </span>
                          <span>Criado em {format(new Date(ticket.createdAt || ""), "dd/MM/yyyy")}</span>
                          <span>•</span>
                          <span className="capitalize">{ticket.channel === 'glpi' ? 'GLPI' : ticket.channel}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pl-12 sm:pl-0">
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );

            // Tickets GLPI e locais são clicáveis
            return (
              <Link key={isGLPI ? `glpi-${ticket.id}` : ticket.id} href={`/tickets/${ticket.id}${isGLPI ? '?source=glpi' : ''}`}>
                {ticketCard}
              </Link>
            );
          })}
            </div>
          </ScrollArea>
          
          {filteredTickets.length > 0 && totalPages > 1 && (
            <Pagination className="mt-3">
              <PaginationContent>
                {hasPreviousPage && (
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      className="gap-1 h-8 text-xs px-2"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span>Anterior</span>
                    </Button>
                  </PaginationItem>
                )}
                
                {getPageNumbers().map((page, index) => (
                  <PaginationItem key={index}>
                    {page === 'ellipsis' ? (
                      <PaginationEllipsis />
                    ) : (
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className="h-8 w-8 text-xs"
                      >
                        {page}
                      </Button>
                    )}
                  </PaginationItem>
                ))}
                
                {hasNextPage && (
                  <PaginationItem>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      className="gap-1 h-8 text-xs px-2"
                    >
                      <span>Próxima</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
}
