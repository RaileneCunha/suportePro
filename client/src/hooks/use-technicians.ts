import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/models/auth";
import type { Profile } from "@shared/schema";

export type Technician = Omit<User, 'password'> & { profile: Profile };

export function useTechnicians() {
  return useQuery<Technician[]>({
    queryKey: [api.technicians.list.path],
    queryFn: async () => {
      const res = await fetch(api.technicians.list.path, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch technicians");
      return api.technicians.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateTechnician() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => {
      const res = await fetch(api.technicians.create.path, {
        method: api.technicians.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create technician");
      }
      
      return api.technicians.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.technicians.list.path] });
      toast({ 
        title: "Sucesso", 
        description: "Técnico criado com sucesso" 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });
}

export function useDeleteTechnician() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.technicians.delete.path, { id });
      const res = await fetch(url, {
        method: api.technicians.delete.method,
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete technician");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.technicians.list.path] });
      toast({ 
        title: "Sucesso", 
        description: "Técnico removido com sucesso" 
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });
}
