import { z } from 'zod';
import { insertTicketSchema, insertTicketMessageSchema, insertArticleSchema, tickets, ticketMessages, articles, profiles, users } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  tickets: {
    list: {
      method: 'GET' as const,
      path: '/api/tickets',
      input: z.object({
        status: z.string().optional(),
        priority: z.string().optional(),
        assignedToMe: z.string().optional(), // "true" or "false"
        range: z.string().optional(), // "1-20", "21-40", etc.
        order: z.string().optional(), // "DESC", "ASC"
        searchText: z.string().optional(), // Texto para busca
      }).optional(),
      responses: {
        200: z.object({
          tickets: z.array(z.custom<typeof tickets.$inferSelect>()),
          pagination: z.object({
            total: z.number(),
            itemsPerPage: z.number(),
          }),
        }),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tickets',
      input: insertTicketSchema,
      responses: {
        201: z.custom<typeof tickets.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/tickets/:id',
      responses: {
        200: z.custom<typeof tickets.$inferSelect & { 
          messages: typeof ticketMessages.$inferSelect[];
          assignedTo: (Omit<typeof users.$inferSelect, 'password'> | null);
        }>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/tickets/:id',
      input: insertTicketSchema.partial(),
      responses: {
        200: z.custom<typeof tickets.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  messages: {
    create: {
      method: 'POST' as const,
      path: '/api/tickets/:ticketId/messages',
      input: insertTicketMessageSchema.omit({ ticketId: true, senderId: true }), // ticketId from param, senderId from session
      responses: {
        201: z.custom<typeof ticketMessages.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  articles: {
    list: {
      method: 'GET' as const,
      path: '/api/articles',
      responses: {
        200: z.array(z.custom<typeof articles.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/articles',
      input: insertArticleSchema,
      responses: {
        201: z.custom<typeof articles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  ai: {
    suggestResponse: {
      method: 'POST' as const,
      path: '/api/ai/suggest',
      input: z.object({
        ticketId: z.number(),
      }),
      responses: {
        200: z.object({ suggestion: z.string() }),
        400: errorSchemas.validation,
      },
    },
    analyzeTicket: {
      method: 'POST' as const,
      path: '/api/ai/analyze-ticket',
      input: z.object({
        ticketId: z.number(),
        source: z.string().optional(), // 'glpi' ou undefined para local
      }),
      responses: {
        200: z.object({
          analysis: z.string(),
          category: z.string(),
          resolutionInstructions: z.string(),
        }),
        400: errorSchemas.validation,
      },
    },
  },
  technicians: {
    list: {
      method: 'GET' as const,
      path: '/api/technicians',
      responses: {
        200: z.array(z.custom<Omit<typeof users.$inferSelect, 'password'> & { profile: typeof profiles.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/technicians',
      input: z.object({
        email: z.string().email(),
        password: z.string().min(6),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      }),
      responses: {
        201: z.custom<Omit<typeof users.$inferSelect, 'password'>>(),
        400: errorSchemas.validation,
        409: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/technicians/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
