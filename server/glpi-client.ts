import { Ticket } from "@shared/schema";

interface GLPITicket {
  id: number;
  entities_id: number;
  name: string;
  date: string;
  closedate: string | null;
  solvedate: string | null;
  date_mod: string;
  status: number;
  content: string;
  urgency: number;
  impact: number;
  priority: number;
  itilcategories_id: number;
  type: number;
  requesttypes_id: number;
  users_id_recipient: number;
  users_id_lastupdater: number;
  [key: string]: any;
}

interface GLPISessionResponse {
  session_token: string;
}

interface SessionCache {
  token: string;
  expiresAt: number;
}

export class GLPIClient {
  private baseUrl: string;
  private appToken: string;
  private authToken: string;
  private sessionCache: SessionCache | null = null;
  private readonly SESSION_DURATION = 3600000; // 1 hora em ms
  private readonly REQUEST_TIMEOUT = 5000; // 5 segundos

  constructor() {
    this.baseUrl = process.env.GLPI_API_URL || "";
    this.appToken = process.env.GLPI_APP_TOKEN || "";
    this.authToken = process.env.GLPI_AUTH_TOKEN || "";

    if (!this.baseUrl || !this.appToken || !this.authToken) {
      console.warn("[GLPI] Configuração incompleta. Variáveis de ambiente necessárias: GLPI_API_URL, GLPI_APP_TOKEN, GLPI_AUTH_TOKEN");
    }
  }

  /**
   * Verifica se o cliente está configurado corretamente
   */
  isConfigured(): boolean {
    return !!(this.baseUrl && this.appToken && this.authToken);
  }

  /**
   * Obtém session token válido (reutiliza cache se disponível)
   */
  private async getSessionToken(): Promise<string> {
    // Verifica se tem token em cache válido
    if (this.sessionCache && this.sessionCache.expiresAt > Date.now()) {
      return this.sessionCache.token;
    }

    // Inicia nova sessão
    return await this.initSession();
  }

  /**
   * Autentica e obtém session token do GLPI
   */
  private async initSession(): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      const url = `${this.baseUrl}initSession`;
      const startTime = Date.now();
      
      console.log(`[GLPI] Requisição: GET ${url}`);
      console.log(`[GLPI] Headers: App-Token=${this.appToken ? '***' : 'não definido'}, Authorization=user_token ***`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "App-Token": this.appToken,
          "Authorization": `user_token ${this.authToken}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      console.log(`[GLPI] Resposta: ${response.status} ${response.statusText} (${duration}ms)`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`[GLPI] Erro de autenticação ${response.status}:`, errorText || response.statusText);
        throw new Error(`GLPI Auth failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }

      const data: GLPISessionResponse = await response.json();
      
      // Armazena em cache
      this.sessionCache = {
        token: data.session_token,
        expiresAt: Date.now() + this.SESSION_DURATION,
      };

      console.log("[GLPI] Sessão iniciada com sucesso");
      return data.session_token;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("[GLPI] Timeout na requisição de autenticação");
        throw new Error("GLPI request timeout");
      }
      console.error("[GLPI] Erro ao iniciar sessão:", error);
      throw error;
    }
  }

  /**
   * Mapeia status GLPI (numérico) para status local (string)
   */
  private mapGLPIStatus(glpiStatus: number): string {
    const statusMap: Record<number, string> = {
      1: "open",          // New
      2: "in_progress",   // Processing/Assigned
      3: "in_progress",   // Planning
      4: "in_progress",   // Pending
      5: "resolved",      // Solved
      6: "closed",        // Closed
    };

    return statusMap[glpiStatus] || "open";
  }

  /**
   * Mapeia prioridade GLPI (1-5) para prioridade local
   */
  private mapGLPIPriority(glpiPriority: number): string {
    const priorityMap: Record<number, string> = {
      1: "low",       // Very low
      2: "low",       // Low
      3: "medium",    // Medium
      4: "high",      // High
      5: "critical",  // Very high/Critical
    };

    return priorityMap[glpiPriority] || "medium";
  }

  /**
   * Decodifica entidades HTML do conteúdo GLPI
   */
  private decodeHTML(html: string): string {
    if (!html) return "";
    
    return html
      .replace(/&#60;/g, "<")
      .replace(/&#62;/g, ">")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/<[^>]*>/g, " ") // Remove tags HTML
      .replace(/\s+/g, " ")      // Normaliza espaços
      .trim();
  }

  /**
   * Transforma ticket GLPI para formato do sistema local
   */
  private transformGLPITicket(glpiTicket: GLPITicket): Partial<Ticket> & { source: string; glpiData?: any } {
    return {
      id: glpiTicket.id,
      title: glpiTicket.name || "Sem título",
      description: this.decodeHTML(glpiTicket.content),
      status: this.mapGLPIStatus(glpiTicket.status),
      priority: this.mapGLPIPriority(glpiTicket.priority),
      category: "general",
      channel: "glpi",
      source: "glpi",
      createdAt: new Date(glpiTicket.date),
      updatedAt: new Date(glpiTicket.date_mod),
      customerId: `glpi-user-${glpiTicket.users_id_recipient}`,
      assignedToId: null,
      tags: [],
      glpiData: {
        entities_id: glpiTicket.entities_id,
        requesttypes_id: glpiTicket.requesttypes_id,
        itilcategories_id: glpiTicket.itilcategories_id,
        urgency: glpiTicket.urgency,
        impact: glpiTicket.impact,
        closedate: glpiTicket.closedate,
        solvedate: glpiTicket.solvedate,
      },
    };
  }

  /**
   * Busca o último ticket (maior ID) do GLPI para obter o total de tickets
   */
  async getLastTicket(): Promise<number> {
    if (!this.isConfigured()) {
      console.warn("[GLPI] Cliente não configurado. Retornando 0.");
      return 0;
    }

    try {
      const sessionToken = await this.getSessionToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      const url = `${this.baseUrl}Ticket/?range=0-0&order=DESC`;
      const startTime = Date.now();

      console.log(`[GLPI] Requisição: GET ${url} (buscar último ticket)`);
      console.log(`[GLPI] Headers: Session-Token=${sessionToken ? '***' : 'não definido'}, App-Token=${this.appToken ? '***' : 'não definido'}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Session-Token": sessionToken,
          "App-Token": this.appToken,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      console.log(`[GLPI] Resposta: ${response.status} ${response.statusText} (${duration}ms)`);

      if (!response.ok) {
        if (response.status === 401) {
          console.log("[GLPI] Session expirada ao buscar último ticket, renovando...");
          this.sessionCache = null;
          return await this.getLastTicket();
        }
        throw new Error(`GLPI API error: ${response.status} ${response.statusText}`);
      }

      const glpiTickets: GLPITicket[] = await response.json();
      const lastTicketId = glpiTickets.length > 0 ? glpiTickets[0].id : 0;
      
      console.log(`[GLPI] Último ticket ID: ${lastTicketId}`);
      
      return lastTicketId;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("[GLPI] Timeout ao buscar último ticket");
      } else {
        console.error("[GLPI] Erro ao buscar último ticket:", error.message);
      }
      return 0;
    }
  }

  /**
   * Busca tickets do GLPI
   * @param range - Intervalo de paginação no formato "inicio-fim" (ex: "1-20", "21-40")
   * @param order - Ordem de classificação (ex: "DESC", "ASC")
   * @param searchText - Texto para busca nos tickets
   */
  async getTickets(range?: string, order?: string, searchText?: string): Promise<Array<Partial<Ticket> & { source: string }>> {
    if (!this.isConfigured()) {
      console.warn("[GLPI] Cliente não configurado. Retornando lista vazia.");
      return [];
    }

    try {
      const sessionToken = await this.getSessionToken();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      // Construir query string com parâmetros de paginação e busca
      // Formato: /Ticket/?range=1-20&order=DESC&searchText=texto
      console.log(`[GLPI] Parâmetros recebidos - range: ${range || 'não fornecido'}, order: ${order || 'não fornecido'}${searchText ? `, searchText: ${searchText}` : ''}`);
      
      const queryParams = new URLSearchParams();
      if (range) {
        queryParams.append('range', range);
      }
      if (order) {
        queryParams.append('order', order);
      }
      if (searchText) {
        queryParams.append('searchText', searchText);
      }

      const queryString = queryParams.toString();
      const url = `${this.baseUrl}Ticket/${queryString ? `?${queryString}` : ''}`;
      const startTime = Date.now();

      console.log(`[GLPI] Requisição: GET ${url}`);
      console.log(`[GLPI] Headers: Session-Token=${sessionToken ? '***' : 'não definido'}, App-Token=${this.appToken ? '***' : 'não definido'}`);
      if (queryString) {
        console.log(`[GLPI] Query params: ${queryString}`);
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Session-Token": sessionToken,
          "App-Token": this.appToken,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      console.log(`[GLPI] Resposta: ${response.status} ${response.statusText} (${duration}ms)`);

      if (!response.ok) {
        // Se session expirou, limpa cache e tenta novamente
        if (response.status === 401) {
          console.log("[GLPI] Session expirada, renovando...");
          this.sessionCache = null;
          return await this.getTickets(range, order, searchText); // Retry recursivo com mesmos parâmetros
        }
        const errorText = await response.text().catch(() => '');
        console.error(`[GLPI] Erro na resposta: ${response.status} - ${errorText || response.statusText}`);
        throw new Error(`GLPI API error: ${response.status} ${response.statusText}`);
      }

      const glpiTickets: GLPITicket[] = await response.json();
      
      console.log(`[GLPI] ${glpiTickets.length} tickets recuperados com sucesso${range ? ` (range: ${range})` : ''}${order ? ` (order: ${order})` : ''}`);
      
      return glpiTickets.map(ticket => this.transformGLPITicket(ticket));
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("[GLPI] Timeout ao buscar tickets");
      } else {
        console.error("[GLPI] Erro ao buscar tickets:", error.message);
      }
      // Retorna array vazio em caso de erro para não quebrar a listagem
      return [];
    }
  }

  /**
   * Busca detalhes de um ticket específico do GLPI
   * @param ticketId - ID do ticket no GLPI
   */
  async getTicketDetail(ticketId: number): Promise<Partial<Ticket> & { source: string; glpiData?: any } | null> {
    if (!this.isConfigured()) {
      console.warn("[GLPI] Cliente não configurado. Retornando null.");
      return null;
    }

    try {
      const sessionToken = await this.getSessionToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      const url = `${this.baseUrl}Ticket/${ticketId}`;
      const startTime = Date.now();

      console.log(`[GLPI] Requisição: GET ${url} (detalhes do ticket)`);
      console.log(`[GLPI] Headers: Session-Token=${sessionToken ? '***' : 'não definido'}, App-Token=${this.appToken ? '***' : 'não definido'}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Session-Token": sessionToken,
          "App-Token": this.appToken,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      console.log(`[GLPI] Resposta: ${response.status} ${response.statusText} (${duration}ms)`);

      if (!response.ok) {
        if (response.status === 401) {
          console.log("[GLPI] Session expirada ao buscar detalhes, renovando...");
          this.sessionCache = null;
          return await this.getTicketDetail(ticketId);
        }
        if (response.status === 404) {
          console.log(`[GLPI] Ticket ${ticketId} não encontrado`);
          return null;
        }
        throw new Error(`GLPI API error: ${response.status} ${response.statusText}`);
      }

      const glpiTicket: GLPITicket = await response.json();
      
      const transformed = this.transformGLPITicket(glpiTicket);
      return {
        ...transformed,
        glpiData: {
          entities_id: glpiTicket.entities_id,
          requesttypes_id: glpiTicket.requesttypes_id,
          itilcategories_id: glpiTicket.itilcategories_id,
          urgency: glpiTicket.urgency,
          impact: glpiTicket.impact,
          closedate: glpiTicket.closedate,
          solvedate: glpiTicket.solvedate,
          users_id_recipient: glpiTicket.users_id_recipient,
          users_id_lastupdater: glpiTicket.users_id_lastupdater,
        },
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("[GLPI] Timeout ao buscar detalhes do ticket");
      } else {
        console.error("[GLPI] Erro ao buscar detalhes do ticket:", error.message);
      }
      return null;
    }
  }

  /**
   * Busca followups de um ticket do GLPI
   * @param ticketId - ID do ticket no GLPI
   */
  async getTicketFollowups(ticketId: number): Promise<Array<{ id: number; content: string; date: string; [key: string]: any }>> {
    if (!this.isConfigured()) {
      console.warn("[GLPI] Cliente não configurado. Retornando array vazio.");
      return [];
    }

    try {
      const sessionToken = await this.getSessionToken();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      const url = `${this.baseUrl}Ticket/${ticketId}/TicketFollowup`;
      const startTime = Date.now();

      console.log(`[GLPI] Requisição: GET ${url} (followups do ticket)`);
      console.log(`[GLPI] Headers: Session-Token=${sessionToken ? '***' : 'não definido'}, App-Token=${this.appToken ? '***' : 'não definido'}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Session-Token": sessionToken,
          "App-Token": this.appToken,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      console.log(`[GLPI] Resposta: ${response.status} ${response.statusText} (${duration}ms)`);

      if (!response.ok) {
        if (response.status === 401) {
          console.log("[GLPI] Session expirada ao buscar followups, renovando...");
          this.sessionCache = null;
          return await this.getTicketFollowups(ticketId);
        }
        if (response.status === 404) {
          console.log(`[GLPI] Followups do ticket ${ticketId} não encontrados`);
          return [];
        }
        throw new Error(`GLPI API error: ${response.status} ${response.statusText}`);
      }

      const followups: Array<{ id: number; content: string; date: string; [key: string]: any }> = await response.json();
      
      console.log(`[GLPI] ${followups.length} followups recuperados para ticket ${ticketId}`);
      
      // Transformar followups para formato compatível com mensagens locais
      return followups.map(f => ({
        ...f,
        content: this.decodeHTML(f.content),
      }));
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error("[GLPI] Timeout ao buscar followups");
      } else {
        console.error("[GLPI] Erro ao buscar followups:", error.message);
      }
      return [];
    }
  }

  /**
   * Encerra sessão GLPI (cleanup)
   */
  async killSession(): Promise<void> {
    if (!this.sessionCache) return;

    try {
      const url = `${this.baseUrl}killSession`;
      const startTime = Date.now();
      
      console.log(`[GLPI] Requisição: GET ${url}`);
      console.log(`[GLPI] Headers: Session-Token=***, App-Token=${this.appToken ? '***' : 'não definido'}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Session-Token": this.sessionCache.token,
          "App-Token": this.appToken,
        },
      });

      const duration = Date.now() - startTime;
      console.log(`[GLPI] Resposta: ${response.status} ${response.statusText} (${duration}ms)`);
      
      this.sessionCache = null;
      console.log("[GLPI] Sessão encerrada");
    } catch (error) {
      console.error("[GLPI] Erro ao encerrar sessão:", error);
    }
  }
}

// Instância singleton
export const glpiClient = new GLPIClient();
