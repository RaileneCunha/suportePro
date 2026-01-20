## Packages
recharts | For dashboard analytics and reporting charts
date-fns | For date formatting in ticket lists and conversation history
framer-motion | For smooth page transitions and micro-interactions
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging Tailwind classes efficiently

## Notes
- Authentication is handled via Replit Auth (useAuth hook)
- AI suggestions endpoint is available at /api/ai/suggest
- Tickets have complex status workflows (open -> in_progress -> resolved -> closed)
- Real-time updates via TanStack Query invalidation (no WebSocket requirement mentioned, but polling or manual refresh works for MVP)
