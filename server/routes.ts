import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCommentSchema } from "@shared/schema";
import { espnNewsService } from "./news-api";
import { espnScoresAPI } from "./live-scores-api";
import { sportsTeamsAPI } from "./sports-teams-api";
import { z } from "zod";

// Helper function for error handling
function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error) || 'Unknown error occurred';
}

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(400).json({ error: handleError(error) });
    }
  });

  app.get("/api/users/firebase/:firebaseUid", async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.params.firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error('Error fetching user by Firebase UID:', error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      res.json(user);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(400).json({ error: handleError(error) });
    }
  });

  // Favorite teams routes
  app.post("/api/users/:id/favorite-teams", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { team } = z.object({ team: z.string() }).parse(req.body);
      const user = await storage.addFavoriteTeam(userId, team);
      res.json(user);
    } catch (error) {
      console.error('Error adding favorite team:', error);
      res.status(400).json({ error: handleError(error) });
    }
  });

  app.delete("/api/users/:id/favorite-teams/:team", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const team = decodeURIComponent(req.params.team);
      const user = await storage.removeFavoriteTeam(userId, team);
      res.json(user);
    } catch (error) {
      console.error('Error removing favorite team:', error);
      res.status(400).json({ error: handleError(error) });
    }
  });

  // Favorite players routes
  app.post("/api/users/:id/favorite-players", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { player } = z.object({ player: z.string() }).parse(req.body);
      const user = await storage.addFavoritePlayer(userId, player);
      res.json(user);
    } catch (error) {
      console.error('Error adding favorite player:', error);
      res.status(400).json({ error: handleError(error) });
    }
  });

  app.delete("/api/users/:id/favorite-players/:player", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const player = decodeURIComponent(req.params.player);
      const user = await storage.removeFavoritePlayer(userId, player);
      res.json(user);
    } catch (error) {
      console.error('Error removing favorite player:', error);
      res.status(400).json({ error: handleError(error) });
    }
  });

  // Article routes
  app.get("/api/articles", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const articles = await storage.getArticles(limit, offset);
      res.json(articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getArticleById(id);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error('Error fetching article:', error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.get("/api/articles/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const limit = parseInt(req.query.limit as string) || 10;
      const articles = await storage.getArticlesByCategory(category, limit);
      res.json(articles);
    } catch (error) {
      console.error('Error fetching articles by category:', error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.post("/api/articles/:id/like", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.incrementArticleLikes(id);
      res.json(article);
    } catch (error) {
      console.error('Error liking article:', error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.post("/api/articles/:id/view", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.incrementArticleViews(id);
      res.json(article);
    } catch (error) {
      console.error('Error incrementing article views:', error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  // Real sports news from ESPN RSS
  app.get("/api/news/breaking", async (req, res) => {
    try {
      const articles = await espnNewsService.getBreakingAmericanSportsNews();
      res.json(articles);
    } catch (error) {
      console.error('Error fetching breaking news from ESPN RSS:', error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  // AI-generated trending topics from real ESPN news
  app.get("/api/ai/trending-topics", async (req, res) => {
    try {
      const { aiNewsService } = await import('./ai-service');
      const trendingTopics = await aiNewsService.generateTrendingTopics();
      res.json(trendingTopics);
    } catch (error) {
      console.error('Error generating trending topics from real news:', error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  // Comment routes
  app.get("/api/articles/:articleId/comments", async (req, res) => {
    try {
      const articleId = parseInt(req.params.articleId);
      const comments = await storage.getCommentsByArticleId(articleId);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.post("/api/comments", async (req, res) => {
    try {
      const commentData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(400).json({ error: handleError(error) });
    }
  });

  // Game routes - Real live scores from ESPN API
  app.get("/api/games/live", async (req, res) => {
    try {
      console.log('Fetching live games from ESPN API...');
      const games = await espnScoresAPI.getLiveGames();
      res.json(games);
    } catch (error) {
      console.error('Error fetching live games:', error);
      // Fallback to stored games if ESPN API fails
      try {
        const fallbackGames = await storage.getLiveGames();
        res.json(fallbackGames);
      } catch (fallbackError) {
        res.status(500).json({ error: handleError(error) });
      }
    }
  });

  // API status endpoint for debugging
  app.get("/api/games/status", async (req, res) => {
    try {
      const status = {
        espnAPI: true, // ESPN API is always available (no key needed)
        currentProvider: 'ESPN Sports API',
        message: 'Live sports scores from ESPN undocumented API endpoints'
      };
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.get("/api/games/team/:team", async (req, res) => {
    try {
      const team = req.params.team;
      const games = await storage.getGamesByTeam(team);
      res.json(games);
    } catch (error) {
      console.error('Error fetching games by team:', error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.get("/api/games/sport/:sport", async (req, res) => {
    try {
      const sport = req.params.sport;
      const games = await storage.getGamesBySport(sport);
      res.json(games);
    } catch (error) {
      console.error('Error fetching games by sport:', error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  // Poll routes
  app.get("/api/polls", async (req, res) => {
    try {
      const polls = await storage.getActivePolls();
      res.json(polls);
    } catch (error) {
      console.error('Error fetching polls:', error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.get("/api/polls/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const poll = await storage.getPollById(id);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      res.json(poll);
    } catch (error) {
      console.error('Error fetching poll:', error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.post("/api/polls/:id/vote", async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const { userId, optionIndex } = req.body;
      await storage.voteOnPoll(userId, pollId, optionIndex);
      res.json({ success: true });
    } catch (error) {
      console.error('Error voting on poll:', error);
      res.status(400).json({ error: handleError(error) });
    }
  });

  app.get("/api/polls/:id/user/:userId/vote", async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      const vote = await storage.getUserVote(userId, pollId);
      res.json(vote || null);
    } catch (error) {
      console.error('Error fetching user vote:', error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  // Sports teams and players routes
  app.get("/api/sports/teams", async (req, res) => {
    try {
      console.log('📊 Fetching all teams from ESPN API...');
      const teams = await sportsTeamsAPI.getAllTeams();
      res.json(teams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  app.get("/api/sports/players", async (req, res) => {
    try {
      console.log('🏆 Fetching all players from ESPN API...');
      const players = await sportsTeamsAPI.getAllPlayers();
      res.json(players);
    } catch (error) {
      console.error('Error fetching players:', error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  // AI predictions route
  app.get("/api/ai/predictions", async (req, res) => {
    try {
      console.log('🤖 Generating AI game predictions...');
      const { aiNewsService } = await import('./ai-service');
      const predictions = await aiNewsService.generateGamePredictions();
      res.json(predictions);
    } catch (error) {
      console.error('Error generating AI predictions:', error);
      res.status(500).json({ error: handleError(error) });
    }
  });

  const server = createServer(app);
  return server;
}