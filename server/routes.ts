import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCommentSchema } from "@shared/schema";
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

  // Game routes
  app.get("/api/games/live", async (req, res) => {
    try {
      const games = await storage.getLiveGames();
      res.json(games);
    } catch (error) {
      console.error('Error fetching live games:', error);
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

  const server = createServer(app);
  return server;
}