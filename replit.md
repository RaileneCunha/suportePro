# SupportPro - Help Desk / Service Desk System

## Overview

SupportPro is a customer support ticket management system (Help Desk / Service Desk) built with a modern full-stack architecture. The application enables customers to submit support tickets, agents to manage and resolve them, and provides AI-powered response suggestions. Key features include:

- Ticket creation, categorization, and priority management
- Status workflow (open → in_progress → resolved → closed)
- Knowledge base for self-service articles
- Dashboard with analytics and reporting
- AI-powered response suggestions via OpenAI integration
- Role-based access (customer, agent, admin)
- Omnichannel support tracking (web, email, WhatsApp)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state, local React state for UI
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool**: Vite with custom plugins for Replit integration
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ES modules)
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` for app tables, `shared/models/auth.ts` for auth tables
- **Migrations**: Drizzle Kit with `db:push` command

### Key Design Patterns
- **Shared Types**: TypeScript schemas shared between client and server via `@shared/*` alias
- **API Contract**: Routes defined with Zod schemas for input validation and response types
- **Storage Abstraction**: `IStorage` interface in `server/storage.ts` for database operations
- **Modular Integrations**: Replit integrations organized in `server/replit_integrations/`

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components (shadcn/ui)
    hooks/        # Custom React hooks
    pages/        # Route components
    lib/          # Utilities and query client
server/           # Express backend
  replit_integrations/  # Auth, chat, image AI modules
shared/           # Shared types and schemas
  models/         # Auth-related schemas
  schema.ts       # Main database schema
  routes.ts       # API route definitions
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and migrations

### Authentication
- **Replit Auth**: OpenID Connect authentication
- **Required Secrets**: `SESSION_SECRET`, `ISSUER_URL` (defaults to Replit OIDC)

### AI Services
- **OpenAI API**: Used for AI response suggestions and image generation
- **Required Secrets**: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
- **Models Used**: GPT for chat completions, gpt-image-1 for image generation

### Key NPM Packages
- `@tanstack/react-query`: Server state management
- `drizzle-orm` / `drizzle-zod`: Database ORM and validation
- `express-session` / `connect-pg-simple`: Session management
- `openid-client` / `passport`: Authentication
- `recharts`: Dashboard charts and analytics
- `date-fns`: Date formatting
- `zod`: Runtime type validation

### Development Tools
- `tsx`: TypeScript execution for development
- `vite`: Frontend build and dev server
- `esbuild`: Server bundling for production