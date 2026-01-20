import { useTechnicians, useCreateTechnician, useDeleteTechnician } from "@/hooks/use-technicians";
import { usePagination } from "@/hooks/use-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { Plus, Trash2, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const createTechnicianSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type CreateTechnicianForm = z.infer<typeof createTechnicianSchema>;

export default function Technicians() {
  const { data: technicians, isLoading } = useTechnicians();
  const createTechnician = useCreateTechnician();
  const deleteTechnician = useDeleteTechnician();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const techniciansList = technicians || [];

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedTechnicians,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    getPageNumbers,
  } = usePagination({
    items: techniciansList,
    itemsPerPage: 20,
    dependencies: [],
  });

  const form = useForm<CreateTechnicianForm>({
    resolver: zodResolver(createTechnicianSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = (data: CreateTechnicianForm) => {
    createTechnician.mutate(data, {
      onSuccess: () => {
        setIsCreateOpen(false);
        form.reset();
      },
    });
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteTechnician.mutate(deleteId, {
        onSuccess: () => {
          setDeleteId(null);
        },
      });
    }
  };

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Técnicos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os técnicos que podem receber atribuições de chamados.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Cadastrar Técnico
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Técnico</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do técnico" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sobrenome</FormLabel>
                        <FormControl>
                          <Input placeholder="Sobrenome do técnico" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="tecnico@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateOpen(false);
                      form.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createTechnician.isPending}>
                    {createTechnician.isPending ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-4 h-4" />
            Lista de Técnicos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="text-center py-6 text-muted-foreground">Carregando técnicos...</div>
          ) : technicians && technicians.length > 0 ? (
            <>
              <ScrollArea className="h-[calc(100vh-320px)]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-10">Técnico</TableHead>
                      <TableHead className="h-10">Email</TableHead>
                      <TableHead className="h-10">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTechnicians.map((technician) => (
                  <TableRow key={technician.id}>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={technician.profileImageUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {technician.firstName?.[0]?.toUpperCase() || 
                             technician.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {technician.firstName && technician.lastName
                              ? `${technician.firstName} ${technician.lastName}`
                              : technician.email}
                          </p>
                          {technician.firstName && (
                            <p className="text-xs text-muted-foreground">Técnico</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-sm text-muted-foreground">{technician.email}</TableCell>
                    <TableCell className="py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(technician.id)}
                        disabled={deleteTechnician.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {techniciansList.length > 0 && totalPages > 1 && (
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
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              Nenhum técnico cadastrado. Clique em "Cadastrar Técnico" para começar.
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este técnico? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
