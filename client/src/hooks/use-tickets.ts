import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Ticket, type TicketMessage, type InsertTicket, type InsertTicketMessage } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// --- Tickets ---

export function useTickets(filters?: { status?: string; priority?: string; assignedToMe?: string; range?: string; order?: string; searchText?: string }) {
  const queryKey = [api.tickets.list.path, filters];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = filters 
        ? `${api.tickets.list.path}?${new URLSearchParams(filters as any).toString()}` 
        : api.tickets.list.path;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tickets");
      return api.tickets.list.responses[200].parse(await res.json());
    },
  });
}

export function useTicket(id: number, source?: string) {
  return useQuery({
    queryKey: [api.tickets.get.path, id, source],
    queryFn: async () => {
      let url = buildUrl(api.tickets.get.path, { id });
      if (source === 'glpi') {
        url += '?source=glpi';
      }
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch ticket");
      return api.tickets.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertTicket) => {
      const res = await fetch(api.tickets.create.path, {
        method: api.tickets.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create ticket");
      }
      return api.tickets.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tickets.list.path] });
      toast({ title: "Success", description: "Ticket created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<InsertTicket> }) => {
      const url = buildUrl(api.tickets.update.path, { id });
      const res = await fetch(url, {
        method: api.tickets.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update ticket");
      return api.tickets.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.tickets.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tickets.get.path, data.id] });
      toast({ title: "Success", description: "Ticket updated" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// --- Messages ---

export function useCreateMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ ticketId, content, type = "text" }: { ticketId: number; content: string; type?: string }) => {
      const url = buildUrl(api.messages.create.path, { ticketId });
      const res = await fetch(url, {
        method: api.messages.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to send message");
      return api.messages.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.tickets.get.path, variables.ticketId] });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

// --- AI Suggestion ---

export function useAiSuggestion() {
  return useMutation({
    mutationFn: async ({ ticketId }: { ticketId: number }) => {
      const res = await fetch(api.ai.suggestResponse.path, {
        method: api.ai.suggestResponse.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to get AI suggestion");
      return api.ai.suggestResponse.responses[200].parse(await res.json());
    },
  });
}

// --- AI Analyze Ticket ---

export function useAnalyzeTicket() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ ticketId, source }: { ticketId: number; source?: string }) => {
      const res = await fetch(api.ai.analyzeTicket.path, {
        method: api.ai.analyzeTicket.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, source }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: "Failed to analyze ticket" }));
        throw new Error(error.message || "Failed to analyze ticket");
      }
      return api.ai.analyzeTicket.responses[200].parse(await res.json());
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
}
