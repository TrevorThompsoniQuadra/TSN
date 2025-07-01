# TSN - Smart Sports News Platform

## Overview

TSN is a modern smart sports news platform that delivers AI-powered sports content with real-time scores, personalized feeds, and intelligent predictions. The application is built as a full-stack web application using React with TypeScript for the frontend and Express.js for the backend, with PostgreSQL as the primary database.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Authentication**: Firebase Authentication with Google OAuth
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints
- **Database ORM**: Drizzle ORM with Neon Database serverless PostgreSQL
- **Session Management**: PostgreSQL-based session storage using connect-pg-simple

### Database Architecture
- **Primary Database**: PostgreSQL (via Neon Database serverless)
- **ORM**: Drizzle ORM with schema-first approach
- **Migrations**: Drizzle Kit for database migrations
- **Schema Location**: `shared/schema.ts` for type-safe sharing between frontend and backend

## Key Components

### Database Schema
The application uses the following main entities:
- **Users**: Firebase authentication integration with user preferences and favorite teams
- **Articles**: Sports news articles with categorization, tags, and engagement metrics
- **Comments**: User comments on articles with relationships to users and articles
- **Games**: Live sports game data with scores, status, and team information
- **Polls**: Interactive polls for user engagement
- **UserVotes**: Tracking user poll participation

### Authentication System
- Firebase Authentication for user management
- Google OAuth integration for seamless sign-in
- User profile synchronization with local database
- Session-based authentication for API access

### Frontend Components
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Component Library**: shadcn/ui for consistent UI components
- **Real-time Features**: Live scores, breaking news banners
- **Interactive Elements**: Polls, comments, article engagement
- **Personalization**: User-specific content based on favorite teams and sports

### API Structure
RESTful endpoints organized by resource:
- `/api/users/*` - User management and profile operations
- `/api/articles/*` - Article CRUD and engagement operations
- `/api/games/*` - Live sports data and game information
- `/api/polls/*` - Interactive polling system

## Data Flow

### User Authentication Flow
1. User initiates Google OAuth through Firebase
2. Firebase returns authentication token
3. User profile synced with local PostgreSQL database
4. Session established for API access

### Content Delivery Flow
1. Frontend requests content via TanStack Query
2. Express.js API handles requests with proper authentication
3. Drizzle ORM queries PostgreSQL database
4. Typed responses sent back to frontend
5. React components render with real-time updates

### Real-time Updates
- Live scores updated through polling mechanism
- Breaking news banner system
- User engagement tracking (likes, views, comments)

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **drizzle-orm**: TypeScript ORM for database operations
- **@tanstack/react-query**: Server state management
- **firebase**: Authentication and user management
- **@radix-ui/***: Headless UI components for accessibility

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production

### External APIs
- Sports data integration (placeholder for ESPN API, SportRadar, etc.)
- Firebase services for authentication
- Neon Database for serverless PostgreSQL

## Deployment Strategy

### Development Environment
- **Development Server**: Vite dev server with HMR
- **API Server**: tsx for TypeScript execution in development
- **Database**: Neon Database with development instance

### Production Build
- **Frontend**: Vite production build to `dist/public`
- **Backend**: ESBuild bundle to `dist/index.js`
- **Static Assets**: Served by Express.js in production
- **Environment Variables**: DATABASE_URL, Firebase configuration

### Configuration Management
- TypeScript path mapping for clean imports
- Shared types between frontend and backend
- Environment-specific configurations
- Database migrations through Drizzle Kit

## Changelog

```
Changelog:
- July 01, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```