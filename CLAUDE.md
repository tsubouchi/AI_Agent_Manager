# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI Agent Manager application built with Next.js 14, TypeScript, and React. It's a platform for developing, managing, and deploying AI agents through a structured workflow system. The application is automatically synced with v0.app deployments and integrated with Vercel for deployment.

## Commands

```bash
# Development
npm run dev          # Start development server on http://localhost:3000

# Building & Production
npm run build        # Build the application for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run custom linting script
npm run type-check   # TypeScript type checking
npm run contract     # Run contract validation
npm run test:all     # Run all checks (lint, type-check, contract)
```

## Architecture

### Core Workflow System
The application implements a multi-stage workflow engine (`lib/workflow-engine.ts`) that orchestrates:
1. **Pain Analysis** - Identifies and analyzes problems from user input
2. **Solution Design** - Designs solutions for identified problems
3. **Agent Generation** - Creates AI agents based on solutions
4. **Manifest Generation** - Generates deployment manifests
5. **Deployment Preparation** - Prepares agents for deployment

Each stage maintains its own state and passes context to subsequent stages through the `WorkflowContext` interface.

### Key Components Structure
- **Main Layout** (`app/page.tsx`): Manages the overall application layout with collapsible sidebar and resizable panels
- **View System**: Supports multiple views (chat, new-issue, projects, import, drafts) controlled via URL parameters
- **API Routes** (`app/api/`): Each workflow stage has its own API endpoint for processing
- **Component Library**: Uses shadcn/ui components with Radix UI primitives

### State Management
- Uses React hooks for local state management
- Workflow state managed through `WorkflowEngine` class with subscription pattern
- Custom hook `use-workflow.ts` for workflow interaction
- Live chat store (`use-chat-store.ts`) for real-time message handling
- Authentication headers management (`lib/auth-headers.ts`) for API requests

### Database Integration
- **Supabase Backend**: PostgreSQL database with real-time capabilities
- **Tables**:
  - `workflows` - Main workflow records
  - `workflow_stages` - Stage execution tracking
  - `messages` - Chat message history
  - `manifests` - Agent deployment manifests
  - `projects`, `drafts` - Project management
- **Security**: Row Level Security (RLS) enabled with development policies
- **Extensions**: pgcrypto for UUID generation

### Styling
- Tailwind CSS v4 with CSS variables for theming
- Component variants managed through class-variance-authority (CVA)
- Dark mode support via next-themes

## Important Configuration

The project has TypeScript and ESLint errors disabled in production builds (`next.config.mjs`):
- `typescript.ignoreBuildErrors: true`
- `eslint.ignoreDuringBuilds: true`

This allows rapid prototyping but should be addressed for production readiness.

## Environment Variables

Required environment variables (see `.env.local.sample`):
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public Supabase key
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side Supabase key (optional)
- `SUPABASE_REQUIRE_JWT` - JWT enforcement on API routes (default: false)
- PostgreSQL connection strings for database access

## Dependencies

Key dependencies added:
- `@supabase/supabase-js` - Supabase client library
- `yaml` - YAML parsing for manifest generation
- ESLint configured for Next.js linting

## Path Aliases

- `@/*` - Root directory
- `@/components` - UI components
- `@/lib` - Utility functions and core logic
- `@/hooks` - Custom React hooks

## Additional Resources

- **AGENTS.md** - Detailed repository guidelines, coding standards, and architecture documentation
- **Contract Validation** - UI-DB contract system in `contract/` directory for type safety
- **Migrations** - Database schema in `supabase/migrations/` including RLS policies