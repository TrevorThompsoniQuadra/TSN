import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
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
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getArticleById(id);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      
      // Increment view count
      await storage.incrementArticleViews(id);
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/articles/category/:category", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const articles = await storage.getArticlesByCategory(req.params.category, limit);
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/articles/:id/like", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.incrementArticleLikes(id);
      res.json(article);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Comment routes
  app.get("/api/articles/:id/comments", async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const comments = await storage.getCommentsByArticleId(articleId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/articles/:id/comments", async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const commentData = insertCommentSchema.parse({
        ...req.body,
        articleId,
      });
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Game routes
  app.get("/api/games/live", async (req, res) => {
    try {
      const games = await storage.getLiveGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/games/team/:team", async (req, res) => {
    try {
      const games = await storage.getGamesByTeam(req.params.team);
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/games/sport/:sport", async (req, res) => {
    try {
      const games = await storage.getGamesBySport(req.params.sport);
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Poll routes
  app.get("/api/polls", async (req, res) => {
    try {
      const polls = await storage.getActivePolls();
      res.json(polls);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/polls/:id/vote", async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const { userId, optionIndex } = z.object({
        userId: z.number(),
        optionIndex: z.number(),
      }).parse(req.body);
      
      await storage.voteOnPoll(userId, pollId, optionIndex);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
