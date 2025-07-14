# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lumio** is a French student project management web application with microservices architecture. It enables teachers to manage student projects through their complete lifecycle: promotion creation, group formation, deliverable submissions, presentations, evaluations, and plagiarism detection.

## Common Development Commands

### Build & Development
```bash
# Start all services in development mode
bun run dev

# Build all services
bun run build

# Build only affected packages (CI)
bun run build:ci
```

### Development Guidelines
- **Always use TanStack Query (React Query)** for all data fetching and mutations
- **Always use Bun** as package manager, runtime, and test runner
- **Never use `any` type** - use proper TypeScript types
- **Write small and readable code** - prefer composition over large functions
- **Always use shadcn/ui components** for UI elements - don't create custom components when shadcn/ui alternatives exist
- **Use strict type checking for nullable conditions** - always use utility functions from `/lib/utils.ts` for boolean expressions:
  - `isNotEmpty(value)` for string checks (instead of `value`)
  - `isValidNumber(value)` for number checks (instead of `value`)
  - `isNotNull(value)` for general null checks (instead of `value`)
  - `isTruthy(value)` for string truthiness checks (instead of `value`)
  - Never use nullable values directly in conditionals (e.g., avoid `if (user?.name)`, use `if (isTruthy(user?.name))`)
  - Implement utility functions for common checks if needed
- **Always run verification commands** before committing changes:
  You can skip the `test` command if you are only modifying frontend code, but always run `lint` and `build`:
  ```bash
  bun run lint
  bun run test
  bun run build
  ```

### Code Quality
```bash
# Format & Lint and fix issues with Biome
bun run lint
```

### Testing
```bash
# Run all tests
bun run test:ci
```

### Database
```bash
# Run Prisma commands across services
bun run prisma
```

### Frontend Development
```bash
# Start frontend with Turbopack (port 3001)
cd apps/frontend && bun dev

# Build frontend
cd apps/frontend && bun run build
```

## Architecture Overview

### Microservices Structure
The application consists of 8 core services orchestrated through an API Gateway:

1. **API Gateway** (`apps/api-gateway/`) - Central entry point with Swagger federation
2. **Auth Service** (`apps/auth-service/`) - JWT + OAuth 2.0 authentication
3. **Project Service** (`apps/project-service/`) - Project and promotion management
4. **Files Service** (`apps/files-service/`) - Deliverable and document handling
5. **Evaluation Service** (`apps/evaluation-service/`) - Grading and assessment system
6. **Report Service** (`apps/report-service/`) - Collaborative report writing
7. **Plagiarism Service** (`apps/plagiarism-service/`) - Rust-based plagiarism detection
8. **Notification Service** (`apps/notif-service/`) - Email notifications

### Technology Stack
- **Backend**: NestJS with Fastify, Bun runtime
- **Frontend**: Next.js 15 (App Router), TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS with Radix UI + shadcn/ui
- **Build System**: Turbo monorepo with Biome for code quality
- **Specialized**: Rust (Actix Web) for plagiarism detection
- **Infrastructure**: Docker, Redis, AWS S3, Prometheus/Grafana

### Key Patterns
- All services use NestJS with Fastify adapter
- Prisma ORM for database operations
- JWT authentication with role-based access
- Swagger documentation federation through API Gateway
- React Hook Form + Zod for frontend form validation
- TanStack Query for state management

## Database Schema
Each service has its own Prisma schema:
- Auth: Users, roles, OAuth providers
- Project: Promotions, projects, groups, students
- Files: Deliverables, documents, S3 metadata
- Evaluation: Criteria, presentations, grades
- Report: Collaborative reports with version control

## Development Notes

### Port Configuration
- API Gateway: 3000 (development)
- Frontend: 3001 (development)
- Services: Auto-assigned ports in development

### Environment Setup
- Use `docker-compose up -d` for PostgreSQL + Adminer
- Each service requires its own `.env` file
- AWS S3 credentials needed for file uploads

### Testing Strategy
- Unit tests with Bun test
- Frontend tests use Happy DOM
- Rust tests use cargo nextest
- Integration tests through API Gateway

### Monitoring
- Prometheus metrics exposed by all services
- Grafana dashboards in `/monitoring/`
- Health checks implemented across services
