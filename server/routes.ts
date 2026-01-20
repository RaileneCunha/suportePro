import type { Express, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { openai } from "./replit_integrations/image/client"; // Reusing client from image module for now, or use openai directly
import { glpiClient } from "./glpi-client";

// Middleware to check if user is admin
const isAdmin: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;
  const userId = user.id;
  const profile = await storage.getProfile(userId);

  if (!profile || profile.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  next();
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Integrations
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);
  registerImageRoutes(app);

  // Profile route
  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let profile = await storage.getProfile(userId);
      
      if (!profile) {
        // Create default profile if doesn't exist
        profile = await storage.createProfile(userId, "customer");
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { role } = req.body;

      if (role && !['customer', 'agent', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'customer', 'agent', or 'admin'" });
      }

      const updatedProfile = await storage.updateProfile(userId, { role });
      res.json(updatedProfile);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile", error: error.message });
    }
  });

  // Temporary endpoint to make current user admin (for development)
  app.post("/api/profile/make-admin", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updatedProfile = await storage.updateProfile(userId, { role: 'admin' });
      console.log(`[Admin] User ${userId} promoted to admin`);
      res.json({ 
        message: "Perfil atualizado para administrador com sucesso!",
        profile: updatedProfile 
      });
    } catch (error: any) {
      console.error("Error making user admin:", error);
      res.status(500).json({ message: "Failed to update profile", error: error.message });
    }
  });

  // Tickets
  app.get(api.tickets.list.path, async (req, res) => {
    // Log todos os query params recebidos
    console.log(`[Routes] Query params recebidos:`, JSON.stringify(req.query));
    
    // In a real app, we'd check req.user to see if they are admin/agent or customer
    // For MVP, if assignedToMe is true, we filter by current user (if they are agent)
    // If they are customer, we might enforce filtering by their ID.
    
    // Quick hack for MVP: If no user, return 401? Or just empty?
    if (!req.isAuthenticated()) {
       return res.status(401).json({ message: "Unauthorized" });
    }
    const user = req.user as any;
    const userId = user.id;
    
    // Check profile
    let profile = await storage.getProfile(userId);
    if (!profile) {
      profile = await storage.createProfile(userId, "customer");
    }

    const filters: any = {};
    const requestedStatus = req.query.status ? String(req.query.status) : null;
    const requestedPriority = req.query.priority ? String(req.query.priority) : null;
    
    // Filtros para tickets locais
    if (requestedStatus) filters.status = requestedStatus;
    if (requestedPriority) filters.priority = requestedPriority;
    
    // If customer, only show their tickets
    if (profile.role === 'customer') {
      filters.customerId = userId;
    } else if (req.query.assignedToMe === 'true') {
      filters.assignedToId = userId;
    }

    // 1. Buscar tickets locais
    const localTickets = await storage.getTickets(filters);
    
    // 2. Buscar tickets GLPI (apenas para admin/agent)
    let glpiTickets: any[] = [];
    let totalGlpiTickets = 0;
    
    if (profile.role === 'admin' || profile.role === 'agent') {
      try {
        // Extrair parâmetros de paginação e busca da query string
        // Se não fornecidos, usar valores padrão: range=1-20 e order=DESC
        const range = req.query.range ? String(req.query.range) : '1-20';
        const order = req.query.order ? String(req.query.order) : 'DESC';
        const searchText = req.query.searchText ? String(req.query.searchText) : undefined;
        
        console.log(`[Routes] Parâmetros GLPI recebidos: range=${range}, order=${order}${searchText ? `, searchText=${searchText}` : ''}`);
        
        // Buscar o último ticket para obter o total (ID do último ticket = quantidade máxima)
        // Nota: Se há busca, o total pode não ser preciso, mas ainda buscamos para ter uma estimativa
        totalGlpiTickets = await glpiClient.getLastTicket();
        console.log(`[Routes] Total de tickets GLPI (último ID): ${totalGlpiTickets}`);
        
        glpiTickets = await glpiClient.getTickets(range, order, searchText);
        console.log(`[Routes] ${glpiTickets.length} tickets GLPI recuperados`);
      } catch (error) {
        console.error("[Routes] Erro ao buscar tickets GLPI:", error);
        // Continua sem tickets GLPI em caso de erro
      }
    }
    
    // 3. Marcar origem dos tickets locais
    const localTicketsWithSource = localTickets.map(t => ({ ...t, source: 'local' }));
    
    // 4. Mesclar tickets
    let allTickets = [...localTicketsWithSource, ...glpiTickets];
    
    // 5. Aplicar filtros nos tickets GLPI (já que eles não passaram pelos filtros do DB)
    if (requestedStatus) {
      allTickets = allTickets.filter(t => t.status === requestedStatus);
    }
    if (requestedPriority) {
      allTickets = allTickets.filter(t => t.priority === requestedPriority);
    }
    
    // 6. Ordenar por data de criação (mais recentes primeiro)
    allTickets.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    
    // Retornar tickets com metadados de paginação
    res.json({
      tickets: allTickets,
      pagination: {
        total: totalGlpiTickets,
        itemsPerPage: 20,
      },
    });
  });

  app.post(api.tickets.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as any;
    const userId = user.id;

    try {
      const input = api.tickets.create.input.parse({
        ...req.body,
        customerId: userId // Force customerId to be current user
      });
      const ticket = await storage.createTicket(input);
      res.status(201).json(ticket);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.tickets.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const id = Number(req.params.id);
    const source = req.query.source ? String(req.query.source) : undefined;
    
    // Se for ticket GLPI, buscar do GLPI
    if (source === 'glpi' || (!isNaN(id) && id > 1000)) { // Assumindo que IDs GLPI são > 1000
      try {
        const user = req.user as any;
        const userId = user.id;
        const profile = await storage.getProfile(userId);
        
        // Apenas admin/agent podem ver tickets GLPI
        if (profile?.role !== 'admin' && profile?.role !== 'agent') {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        const glpiTicket = await glpiClient.getTicketDetail(id);
        if (!glpiTicket) {
          return res.status(404).json({ message: "Ticket GLPI not found" });
        }
        
        const followups = await glpiClient.getTicketFollowups(id);
        
        // Transformar followups para formato de mensagens
        const messages = followups.map((f, index) => ({
          id: f.id || index + 1000000, // IDs temporários para followups
          ticketId: id,
          senderId: `glpi-user-${f.users_id || f.users_id_technician || 'unknown'}`,
          content: f.content,
          type: 'text',
          createdAt: new Date(f.date || f.date_creation || Date.now()),
          updatedAt: new Date(f.date || f.date_creation || Date.now()),
          source: 'glpi',
        }));
        
        res.json({ ...glpiTicket, messages, assignedTo: null });
        return;
      } catch (error) {
        console.error("[Routes] Erro ao buscar ticket GLPI:", error);
        return res.status(500).json({ message: "Error fetching GLPI ticket" });
      }
    }
    
    // Buscar ticket local
    const ticket = await storage.getTicket(id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    
    // Access control: if customer, must be theirs
    const user = req.user as any;
    const userId = user.id;
    const profile = await storage.getProfile(userId);
    
    if (profile?.role === 'customer' && ticket.customerId !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const messages = await storage.getTicketMessages(id);
    
    // Fetch assignedTo user if ticket is assigned
    let assignedTo = null;
    if (ticket.assignedToId) {
      const assignedUser = await storage.getUser(ticket.assignedToId);
      if (assignedUser) {
        // Return user data without password
        const { password, ...userWithoutPassword } = assignedUser;
        assignedTo = userWithoutPassword;
      }
    }
    
    res.json({ ...ticket, messages, assignedTo });
  });

  app.patch(api.tickets.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = Number(req.params.id);
    
    try {
      const input = api.tickets.update.input.parse(req.body);
      const ticket = await storage.updateTicket(id, input);
      res.json(ticket);
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Ticket Messages
  app.post(api.messages.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const ticketId = Number(req.params.ticketId);
    const user = req.user as any;
    const userId = user.id;

    try {
      const input = api.messages.create.input.parse(req.body);
      const message = await storage.createTicketMessage({
        ...input,
        ticketId,
        senderId: userId
      });
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Articles
  app.get(api.articles.list.path, async (req, res) => {
    const articles = await storage.getArticles();
    res.json(articles);
  });

  app.post(api.articles.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    // Check if admin/agent?
    
    try {
      const input = api.articles.create.input.parse(req.body);
      const article = await storage.createArticle(input);
      res.status(201).json(article);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // AI Analyze Ticket
  app.post(api.ai.analyzeTicket.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const input = api.ai.analyzeTicket.input.parse(req.body);
      const { ticketId, source } = input;
      
      let ticket: any;
      let messages: any[] = [];
      
      // Buscar ticket do GLPI ou local
      if (source === 'glpi' || (!isNaN(ticketId) && ticketId > 1000)) {
        const user = req.user as any;
        const userId = user.id;
        const profile = await storage.getProfile(userId);
        
        if (profile?.role !== 'admin' && profile?.role !== 'agent') {
          return res.status(403).json({ message: "Forbidden" });
        }
        
        ticket = await glpiClient.getTicketDetail(ticketId);
        if (!ticket) return res.status(404).json({ message: "Ticket GLPI not found" });
        
        const followups = await glpiClient.getTicketFollowups(ticketId);
        messages = followups.map((f, index) => ({
          content: f.content,
          date: f.date || f.date_creation,
        }));
      } else {
        ticket = await storage.getTicket(ticketId);
        if (!ticket) return res.status(404).json({ message: "Ticket not found" });
        
        const ticketMessages = await storage.getTicketMessages(ticketId);
        messages = ticketMessages.map(m => ({
          content: m.content,
          date: m.createdAt,
        }));
      }
      
      // Construir contexto completo do ticket
      const messagesText = messages
        .map((m, i) => `Acompanhamento ${i + 1} (${m.date ? new Date(m.date).toLocaleString('pt-BR') : 'Data não disponível'}):\n${m.content}`)
        .join('\n\n');
      
      const ticketContext = `
TÍTULO DO CHAMADO: ${ticket.title}

DESCRIÇÃO: ${ticket.description}

STATUS: ${ticket.status}
PRIORIDADE: ${ticket.priority}
CATEGORIA ATUAL: ${ticket.category || 'Não especificada'}

ACOMPANHAMENTOS:
${messagesText || 'Nenhum acompanhamento registrado.'}
`.trim();
      
      // Chamar Gemini 2.5 Flash
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return res.status(500).json({ message: "GEMINI_API_KEY não configurada" });
      }
      
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      // Usar gemini-2.0-flash-exp (equivalente ao 2.5 flash)
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      
      const prompt = `Você é um assistente especializado em análise de chamados de suporte técnico. 

Analise o seguinte chamado e forneça:

1. ANÁLISE: Uma análise detalhada do problema descrito, identificando a causa raiz e aspectos importantes.

2. CATEGORIA: Categorize o chamado em uma das seguintes opções (retorne apenas o nome da categoria):
   - Geral
   - Faturamento
   - Técnico
   - Recurso

3. INSTRUÇÕES PARA RESOLUÇÃO: Um passo a passo claro e objetivo de como resolver o problema. Seja específico e prático.

FORMATO DE RESPOSTA:
Use o formato JSON com as seguintes chaves:
{
  "analysis": "sua análise aqui",
  "category": "nome da categoria aqui",
  "resolutionInstructions": "instruções passo a passo aqui"
}

CHAMADO PARA ANÁLISE:
${ticketContext}`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // Tentar extrair JSON da resposta
      let analysisData;
      try {
        // Remover markdown code blocks se houver
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("JSON não encontrado na resposta");
        }
      } catch (parseError) {
        // Se não conseguir parsear como JSON, dividir a resposta
        const parts = text.split(/\n\n+/);
        analysisData = {
          analysis: parts[0] || text.substring(0, 500),
          category: parts.find(p => p.toLowerCase().includes('categoria'))?.split(':')[1]?.trim() || 'Geral',
          resolutionInstructions: parts.find(p => p.toLowerCase().includes('resolução') || p.toLowerCase().includes('instrução')) || parts[parts.length - 1] || text.substring(500),
        };
      }
      
      res.json({
        analysis: analysisData.analysis || text,
        category: analysisData.category || 'Geral',
        resolutionInstructions: analysisData.resolutionInstructions || text,
      });

    } catch (err: any) {
      console.error("[AI] Erro ao analisar ticket:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Erro ao analisar ticket", error: err.message });
    }
  });

  // AI Suggestion
  app.post(api.ai.suggestResponse.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const { ticketId } = req.body;
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) return res.status(404).json({ message: "Ticket not found" });

      const messages = await storage.getTicketMessages(ticketId);
      
      // Construct prompt
      const context = messages.map(m => `${m.senderId}: ${m.content}`).join("\n");
      const prompt = `You are a helpful support agent. Suggest a response for the following ticket conversation:\n\nTicket: ${ticket.title}\nDescription: ${ticket.description}\n\nConversation:\n${context}\n\nSuggested Response:`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
      });

      res.json({ suggestion: response.choices[0]?.message?.content || "Could not generate suggestion." });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "AI Error" });
    }
  });
  
  // Technicians
  app.get("/api/technicians", isAuthenticated, async (req, res) => {
    try {
      const technicians = await storage.getTechnicians();
      // Remove password from response
      const techniciansWithoutPassword = technicians.map((tech) => {
        const { password, ...userWithoutPassword } = tech;
        return {
          ...userWithoutPassword,
          profile: tech.profile,
        };
      });
      res.json(techniciansWithoutPassword);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      res.status(500).json({ message: "Failed to fetch technicians" });
    }
  });

  app.post("/api/technicians", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if user already exists
      const { authStorage } = await import("./replit_integrations/auth/storage");
      const existingUser = await authStorage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      const technician = await storage.createTechnician({
        email,
        password,
        firstName,
        lastName,
      });

      // Remove password from response
      const { password: _, ...technicianWithoutPassword } = technician;
      res.status(201).json(technicianWithoutPassword);
    } catch (error: any) {
      console.error("Error creating technician:", error);
      res.status(500).json({ message: "Failed to create technician", error: error.message });
    }
  });

  app.delete("/api/technicians/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTechnician(id);
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting technician:", error);
      res.status(500).json({ message: "Failed to delete technician", error: error.message });
    }
  });
  
  // Seed data function
  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const articles = await storage.getArticles();
  if (articles.length === 0) {
     // Create a dummy user ID for seeding (this might fail foreign key constraints if user doesn't exist, 
     // but Replit auth users are strings. We can't easily seed users without them logging in.
     // So we'll skip seeding dependent data until a user exists, or just seed articles with a placeholder if allowed.
     // Actually, articles require authorId. We can't seed them without a user.
     // Let's just log a message.
     console.log("Database empty. Log in to create initial data.");
  }
}
