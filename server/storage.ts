import { 
  users, type User, type UpsertUser,
  profiles, type Profile,
  tickets, type Ticket, type InsertTicket,
  ticketMessages, type TicketMessage, type InsertTicketMessage,
  articles, type Article, type InsertArticle
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth/storage";
import bcrypt from "bcrypt";

export interface IStorage {
  // Users (from Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;

  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(userId: string, role: string): Promise<Profile>;
  updateProfile(userId: string, updates: { role?: string }): Promise<Profile>;
  
  // Tickets
  getTickets(filters?: { status?: string, priority?: string, assignedToId?: string, customerId?: string }): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, updates: Partial<InsertTicket>): Promise<Ticket>;
  
  // Ticket Messages
  getTicketMessages(ticketId: number): Promise<TicketMessage[]>;
  createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;
  
  // Articles
  getArticles(): Promise<Article[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  
  // Technicians
  getTechnicians(): Promise<(User & { profile: Profile })[]>;
  createTechnician(userData: { email: string; password: string; firstName?: string; lastName?: string }): Promise<User>;
  deleteTechnician(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users (handled mainly by Auth module, but implemented here for completeness if needed)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Note: Replit Auth uses email/sub, but if we need username lookup:
    // This is a placeholder as Replit auth users table might not have username in the same way
    return undefined; 
  }

  async createUser(user: UpsertUser): Promise<User> {
    // This is usually handled by the Auth integration upsert
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Profiles
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile;
  }

  async createProfile(userId: string, role: string = "customer"): Promise<Profile> {
    const [profile] = await db.insert(profiles).values({ userId, role }).returning();
    return profile;
  }

  async updateProfile(userId: string, updates: { role?: string }): Promise<Profile> {
    // Check if profile exists
    let profile = await this.getProfile(userId);
    
    if (!profile) {
      // Create profile if it doesn't exist
      return await this.createProfile(userId, updates.role || "customer");
    }
    
    // Update existing profile
    const [updatedProfile] = await db
      .update(profiles)
      .set(updates)
      .where(eq(profiles.userId, userId))
      .returning();
    
    return updatedProfile;
  }

  // Tickets
  async getTickets(filters?: { status?: string, priority?: string, assignedToId?: string, customerId?: string }): Promise<Ticket[]> {
    let conditions = [];
    if (filters?.status) conditions.push(eq(tickets.status, filters.status));
    if (filters?.priority) conditions.push(eq(tickets.priority, filters.priority));
    if (filters?.assignedToId) conditions.push(eq(tickets.assignedToId, filters.assignedToId));
    if (filters?.customerId) conditions.push(eq(tickets.customerId, filters.customerId));

    return db.select()
      .from(tickets)
      .where(and(...conditions))
      .orderBy(desc(tickets.createdAt));
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [newTicket] = await db.insert(tickets).values(ticket).returning();
    return newTicket;
  }

  async updateTicket(id: number, updates: Partial<InsertTicket>): Promise<Ticket> {
    // Handle null assignment explicitly for assignedToId
    const updateData: any = { ...updates, updatedAt: new Date() };
    if ('assignedToId' in updates && updates.assignedToId === null || updates.assignedToId === undefined) {
      updateData.assignedToId = null;
    }
    
    const [updatedTicket] = await db.update(tickets)
      .set(updateData)
      .where(eq(tickets.id, id))
      .returning();
    return updatedTicket;
  }

  // Ticket Messages
  async getTicketMessages(ticketId: number): Promise<TicketMessage[]> {
    return db.select()
      .from(ticketMessages)
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(ticketMessages.createdAt);
  }

  async createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage> {
    const [newMessage] = await db.insert(ticketMessages).values(message).returning();
    return newMessage;
  }

  // Articles
  async getArticles(): Promise<Article[]> {
    return db.select().from(articles).orderBy(desc(articles.createdAt));
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const [newArticle] = await db.insert(articles).values(article).returning();
    return newArticle;
  }

  // Technicians
  async getTechnicians(): Promise<(User & { profile: Profile })[]> {
    // Get all users with role 'agent'
    const agentProfiles = await db
      .select()
      .from(profiles)
      .where(eq(profiles.role, 'agent'));
    
    if (agentProfiles.length === 0) {
      return [];
    }

    const userIds = agentProfiles.map(p => p.userId);
    const technicians = await db
      .select()
      .from(users)
      .where(inArray(users.id, userIds));

    // Combine users with their profiles
    return technicians.map(user => {
      const profile = agentProfiles.find(p => p.userId === user.id)!;
      return { ...user, profile };
    });
  }

  async createTechnician(userData: { email: string; password: string; firstName?: string; lastName?: string }): Promise<User> {
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const user = await authStorage.createUser({
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
    });

    // Create profile with role 'agent'
    await this.createProfile(user.id, 'agent');

    return user;
  }

  async deleteTechnician(userId: string): Promise<void> {
    // Delete profile first (foreign key constraint)
    await db.delete(profiles).where(eq(profiles.userId, userId));
    
    // Delete user
    await db.delete(users).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
