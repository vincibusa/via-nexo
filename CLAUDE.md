# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands

- `npm run dev` - Start development server with TurboPack
- `npm run build` - Build for production with TurboPack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run typecheck` - Run TypeScript type checking without emitting files
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Testing

Currently no test framework is configured. Before adding tests, check with the user about their preferred testing setup.

## Project Architecture

### Tech Stack

- **Framework**: Next.js 15 with App Router and React 19
- **Styling**: Tailwind CSS 4 with Shadcn/UI components (New York variant)
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **AI**: OpenAI Agents SDK with GPT-5-mini for chat orchestration
- **Language**: TypeScript with strict configuration

### Core Structure

#### AI System Architecture

The application is built around an intelligent AI orchestration system:

- **Chat Orchestrator** (`src/lib/agents.ts`): Coordinates specialized agents for travel recommendations
- **Specialized Agents** (`src/lib/agents/`): Individual agents for hotels, restaurants, tours, and shuttle services
- **RAG Pipeline** (`src/lib/rag-pipeline.ts`): Retrieval-Augmented Generation with vector search capabilities
- **Vector Search**: Uses Supabase pgvector for semantic similarity matching

#### API Architecture

- **Conversational Chat**: `/api/chat/conversation` - Main chat interface using agent orchestration
- **Intelligent Search**: `/api/search/intelligent` - Direct search with AI interpretation
- **Vector Search**: `/api/partners/vector-search` - Semantic search with similarity scores
- **RAG Query**: `/api/rag/query` - Full RAG pipeline with context building
- **Traditional Search**: `/api/search/traditional` - Filtered database queries

#### Database Schema

Uses Supabase with specialized tables (hotels, restaurants, tours, shuttles) unified through PostgreSQL views. Each table has vector embeddings for semantic search using OpenAI's embedding models.

#### Frontend Architecture

- **Chat Interface**: Real-time conversational UI with message history persistence
- **Search Components**: Multiple search interfaces (traditional filters, AI-powered, map-based)
- **Partner Cards**: Interactive cards showing tourism partners with booking CTAs
- **State Management**: Custom React hooks for chat, search, and data persistence

### Key Dependencies

#### UI Framework

- Shadcn/UI components with Radix UI primitives
- Tailwind CSS 4 for styling
- Lucide React for icons

#### AI & Backend

- OpenAI Agents SDK for AI orchestration
- Supabase client for database operations
- Custom RAG implementation with caching

#### Development Tools

- ESLint with Next.js configuration
- Prettier with Tailwind plugin
- Husky for git hooks
- Lint-staged for pre-commit linting

### Important Implementation Notes

#### AI Agent System

The AI system uses a hierarchical approach where a central orchestrator delegates to specialized agents. Each agent has access to specific tools for searching partner databases. The orchestrator synthesizes results into conversational responses.

#### Vector Embeddings

All tourism partners have pre-generated embeddings stored in the database. User queries are embedded in real-time and matched using cosine similarity for semantic search capabilities.

#### Rate Limiting & Error Handling

APIs implement request rate limiting and comprehensive error handling with user-friendly messages. All OpenAI API calls have timeout and retry logic.

#### Chat Persistence

Chat conversations are persisted to Supabase with auto-saving functionality. The system maintains conversation history and supports session management.

### File Organization

#### Core Directories

- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components organized by feature
- `src/lib/` - Utility libraries and AI agent implementations
- `src/hooks/` - Custom React hooks
- `src/types/` - TypeScript type definitions
- `src/contexts/` - React context providers

#### Key Files

- `src/lib/agents.ts` - Main AI orchestration logic
- `src/lib/agents/orchestrator.ts` - Agent coordination system
- `src/hooks/useChat.ts` - Chat functionality hook
- `src/types/index.ts` - Comprehensive TypeScript types
- `components.json` - Shadcn/UI configuration

### Development Guidelines

#### Code Style

- Use TypeScript strict mode
- Follow Shadcn/UI component patterns
- Implement proper error boundaries
- Use server components where possible in App Router

#### AI Integration

- Always handle OpenAI API failures gracefully
- Implement proper rate limiting for AI endpoints
- Cache embeddings when possible to reduce API costs
- Use structured prompts and maintain conversation context

#### Database Operations

- Use Supabase client utilities in `src/lib/supabase-*.ts`
- Implement proper error handling for database operations
- Use parameterized queries to prevent injection
- Leverage pgvector for semantic search capabilities

### Authentication & Security

Authentication is handled through Supabase Auth with middleware protection for chat routes. API routes implement rate limiting and input validation using Zod schemas.
