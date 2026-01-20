import { useTicket, useUpdateTicket, useCreateMessage, useAiSuggestion, useAnalyzeTicket } from "@/hooks/use-tickets";
import { useAuth } from "@/hooks/use-auth";
import { useTechnicians } from "@/hooks/use-technicians";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, Sparkles, CheckCircle, XCircle, Clock, Brain } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

export default function TicketDetail() {
  const { id } = useParams();
  const [location] = useLocation();
  const ticketId = parseInt(id || "0");
  const { user } = useAuth();
  
  // Verificar se é ticket GLPI através do query param ou pelo ID (IDs GLPI geralmente são > 1000)
  const url = new URL(window.location.href);
  const source = url.searchParams.get("source") || (ticketId > 1000 ? "glpi" : undefined);
  
  const { data: ticket, isLoading } = useTicket(ticketId, source);
  const { data: technicians } = useTechnicians();
  const updateTicket = useUpdateTicket();
  const createMessage = useCreateMessage();
  const aiSuggestion = useAiSuggestion();
  const analyzeTicket = useAnalyzeTicket();
  
  const [replyContent, setReplyContent] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<{
    analysis: string;
    category: string;
    resolutionInstructions: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.messages]);

  const handleStatusChange = (status: string) => {
    updateTicket.mutate({ id: ticketId, updates: { status } });
  };

  const handleSendMessage = () => {
    if (!replyContent.trim()) return;
    createMessage.mutate({ ticketId, content: replyContent }, {
      onSuccess: () => setReplyContent("")
    });
  };

  const handleGetAiSuggestion = () => {
    aiSuggestion.mutate({ ticketId }, {
      onSuccess: (data) => {
        setReplyContent(prev => prev + (prev ? "\n\n" : "") + data.suggestion);
      }
    });
  };

  const handleAssignChange = (value: string) => {
    if (value === "none") {
      updateTicket.mutate({ 
        id: ticketId, 
        updates: { assignedToId: null as any } 
      });
    } else {
      updateTicket.mutate({ 
        id: ticketId, 
        updates: { assignedToId: value } 
      });
    }
  };

  const handleAnalyzeTicket = () => {
    analyzeTicket.mutate({ ticketId, source }, {
      onSuccess: (data) => {
        setAiAnalysis(data);
      }
    });
  };

  if (isLoading) return <div className="p-8">Carregando detalhes do chamado...</div>;
  if (!ticket) return <div className="p-8">Chamado não encontrado</div>;

  // Verificar se é ticket GLPI (readonly)
  const isGLPITicket = ticket.source === 'glpi' || source === 'glpi';

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-2rem)] flex flex-col gap-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-4 shrink-0">
        <Link href="/tickets">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">#{ticket.id} - {ticket.title}</h1>
            <StatusBadge status={ticket.status} />
            {isGLPITicket && (
              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded border border-orange-200">
                GLPI (Somente Leitura)
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
            onClick={handleAnalyzeTicket}
            disabled={analyzeTicket.isPending}
          >
            <Brain className="w-4 h-4 mr-2" />
            {analyzeTicket.isPending ? "Analisando..." : "Analisar Chamado"}
          </Button>
          {!isGLPITicket && (
            <>
              {ticket.status !== 'resolved' && (
                <Button 
                  variant="outline" 
                  className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                  onClick={() => handleStatusChange("resolved")}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Resolver
                </Button>
              )}
              {ticket.status !== 'closed' && (
                <Button 
                  variant="outline"
                  className="border-border hover:bg-secondary"
                  onClick={() => handleStatusChange("closed")}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Fechar
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Análise da IA */}
      {aiAnalysis && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-700" />
              Análise da IA - Categoria: {aiAnalysis.category}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-2 text-purple-900">Análise do Problema:</h3>
              <p className="text-sm text-foreground whitespace-pre-wrap">{aiAnalysis.analysis}</p>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold text-sm mb-2 text-purple-900">Instruções para Resolução:</h3>
              <p className="text-sm text-foreground whitespace-pre-wrap">{aiAnalysis.resolutionInstructions}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Main Conversation Area */}
        <div className="lg:col-span-2 flex flex-col gap-4 h-full min-h-0">
          <Card className="flex-1 flex flex-col border-border/60 shadow-md overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[hsl(217,28%,88%)]/50">
              {/* Original Description */}
              <div className="flex gap-4">
                <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-[hsl(217,85%,45%)]/20 text-[hsl(217,85%,45%)] font-bold">C</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-[hsl(217,40%,15%)]">Cliente</span>
                    <span className="text-xs text-slate-400">
                      {format(new Date(ticket.createdAt || ""), "dd MMM, HH:mm")}
                    </span>
                  </div>
                  <div className="bg-[hsl(217,28%,90%)] p-4 rounded-2xl rounded-tl-none shadow-sm border border-[hsl(217,25%,78%)] text-[hsl(217,40%,15%)]">
                    {ticket.description}
                  </div>
                </div>
              </div>

              {/* Messages */}
              {ticket.messages?.map((msg) => {
                const isMe = msg.senderId === user?.id; // Simplified logic for demonstration
                return (
                  <div key={msg.id} className={`flex gap-4 ${isMe ? "flex-row-reverse" : ""}`}>
                    <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                      <AvatarImage src={isMe ? user?.profileImageUrl || "" : ""} />
                      <AvatarFallback className={isMe ? "bg-primary text-white" : "bg-slate-200"}>
                        {isMe ? "Eu" : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 space-y-2 ${isMe ? "items-end flex flex-col" : ""}`}>
                      <div className="flex items-baseline justify-between w-full">
                        <span className="font-semibold text-[hsl(217,40%,15%)]">{isMe ? "Você" : "Usuário"}</span>
                        <span className="text-xs text-slate-400">
                          {format(new Date(msg.createdAt || ""), "dd MMM, HH:mm")}
                        </span>
                      </div>
                      <div 
                        className={`p-4 rounded-2xl shadow-sm border text-sm leading-relaxed whitespace-pre-wrap
                          ${isMe 
                            ? "bg-primary text-white rounded-tr-none border-primary" 
                            : "bg-card text-foreground rounded-tl-none border-border"
                          }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input */}
            <div className="p-4 bg-[hsl(217,28%,90%)] border-t border-[hsl(217,25%,78%)]">
              <div className="relative">
                <Textarea 
                  placeholder={isGLPITicket ? "Tickets GLPI são somente leitura" : "Digite sua resposta aqui..."} 
                  className="min-h-[120px] pr-32 resize-none bg-[hsl(217,30%,88%)] border-[hsl(217,25%,78%)] focus:bg-[hsl(217,28%,90%)] transition-all"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  disabled={isGLPITicket}
                />
                {!isGLPITicket && (
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-purple-600 hover:bg-purple-50 hover:text-purple-700"
                      onClick={handleGetAiSuggestion}
                      disabled={aiSuggestion.isPending}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {aiSuggestion.isPending ? "Pensando..." : "Sugestão IA"}
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-primary hover:bg-primary/90"
                      onClick={handleSendMessage}
                      disabled={createMessage.isPending || !replyContent.trim()}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Enviar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Details */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Detalhes do Chamado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase">Prioridade</label>
                  <div className="mt-1">
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase">Canal</label>
                  <div className="mt-1 text-sm font-medium capitalize flex items-center gap-2">
                    {ticket.channel}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-xs font-medium text-slate-400 uppercase">Responsável</label>
                <div className="mt-2">
                  <Select
                    value={ticket.assignedToId || "none"}
                    onValueChange={handleAssignChange}
                    disabled={updateTicket.isPending || isGLPITicket}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um técnico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[hsl(217,30%,88%)] flex items-center justify-center text-xs font-bold text-[hsl(217,20%,45%)]">
                            NA
                          </div>
                          <span>Não Atribuído</span>
                        </div>
                      </SelectItem>
                      {user && (
                        <SelectItem value={user.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[hsl(217,85%,45%)]/20 flex items-center justify-center text-xs font-bold text-[hsl(217,85%,45%)]">
                              {user.firstName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                            </div>
                            <span>
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : user.email} (Você)
                            </span>
                          </div>
                        </SelectItem>
                      )}
                      {technicians?.map((technician) => (
                        <SelectItem key={technician.id} value={technician.id}>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[hsl(217,85%,45%)]/20 flex items-center justify-center text-xs font-bold text-[hsl(217,85%,45%)]">
                              {technician.firstName?.[0]?.toUpperCase() || technician.email[0].toUpperCase()}
                            </div>
                            <span>
                              {technician.firstName && technician.lastName
                                ? `${technician.firstName} ${technician.lastName}`
                                : technician.email}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {ticket.assignedTo && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                        {ticket.assignedTo.firstName?.[0]?.toUpperCase() || 
                         ticket.assignedTo.email?.[0]?.toUpperCase() || 
                         "U"}
                      </div>
                      <span>
                        {ticket.assignedTo.firstName && ticket.assignedTo.lastName
                          ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
                          : ticket.assignedTo.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-xs font-medium text-slate-400 uppercase">Cliente</label>
                <div className="mt-2 flex items-center gap-3 p-3 bg-[hsl(217,30%,88%)] rounded-lg border border-[hsl(217,25%,78%)]">
                  <div className="w-8 h-8 rounded-full bg-[hsl(217,85%,45%)]/20 flex items-center justify-center text-xs font-bold text-[hsl(217,85%,45%)]">
                    C
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate text-[hsl(217,40%,15%)]">Nome do Cliente</p>
                    <p className="text-xs text-[hsl(217,20%,45%)] truncate">cliente@exemplo.com</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
