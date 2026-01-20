import { useArticles, useCreateArticle } from "@/hooks/use-articles";
import { usePagination } from "@/hooks/use-pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { Search, Plus, Book, ChevronRight, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertArticleSchema, type InsertArticle } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";

export default function KnowledgeBase() {
  const { user } = useAuth();
  const { data: articles, isLoading } = useArticles();
  const createArticle = useCreateArticle();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const form = useForm<InsertArticle>({
    resolver: zodResolver(insertArticleSchema),
    defaultValues: {
      title: "",
      content: "",
      isPublic: true,
      authorId: user?.id || "",
    },
  });

  const onSubmit = (data: InsertArticle) => {
    createArticle.mutate({ ...data, authorId: user?.id || "unknown" }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        form.reset();
      }
    });
  };

  const filteredArticles = (articles?.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    a.content.toLowerCase().includes(search.toLowerCase())
  ) || []);

  const {
    currentPage,
    setCurrentPage,
    paginatedItems: paginatedArticles,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    goToPage,
    getPageNumbers,
  } = usePagination({
    items: filteredArticles,
    itemsPerPage: 20,
    dependencies: [search],
  });

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="text-center py-6 bg-foreground rounded-2xl text-background relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <h1 className="text-2xl font-display font-bold mb-3">Como podemos te ajudar?</h1>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Procure por respostas..." 
              className="pl-10 h-9 bg-background border-border text-foreground placeholder:text-muted-foreground rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Artigos Recentes</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Novo Artigo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Artigo na Base de Conhecimento</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título do artigo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conteúdo</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Escreva seu artigo em markdown..." className="min-h-[300px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createArticle.isPending}>
                    {createArticle.isPending ? "Publicando..." : "Publicar Artigo"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div>Carregando artigos...</div>
      ) : (
        <>
          <ScrollArea className="h-[calc(100vh-300px)] pr-4">
            <div className="grid gap-2">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Nenhum artigo encontrado para sua busca.</div>
              ) : (
                paginatedArticles.map((article) => (
                  <Card key={article.id} className="hover:shadow-sm transition-all cursor-pointer group border">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-lg group-hover:bg-accent transition-colors">
                          <Book className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 max-w-2xl">
                            {article.content}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          {filteredArticles.length > 0 && totalPages > 1 && (
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
