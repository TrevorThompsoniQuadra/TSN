import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  favoriteTeams: text("favorite_teams").array().default([]),
  favoritePlayers: text("favorite_players").array().default([]),
  favoriteSports: text("favorite_sports").array().default([]),
  points: integer("points").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  imageUrl: text("image_url"),
  author: text("author").notNull(),
  source: text("source").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array().default([]),
  publishedAt: timestamp("published_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isBreaking: boolean("is_breaking").default(false),
  likes: integer("likes").default(0),
  views: integer("views").default(0),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").references(() => articles.id),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  homeScore: integer("home_score").default(0),
  awayScore: integer("away_score").default(0),
  status: text("status").notNull(), // 'live', 'upcoming', 'final'
  quarter: text("quarter"),
  timeRemaining: text("time_remaining"),
  sport: text("sport").notNull(),
  league: text("league").notNull(),
  gameDate: timestamp("game_date").notNull(),
  venue: text("venue"),
});

export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of {text: string, votes: number}
  totalVotes: integer("total_votes").default(0),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userVotes = pgTable("user_votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  pollId: integer("poll_id").references(() => polls.id),
  optionIndex: integer("option_index").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gamePolls = pgTable("game_polls", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull(), // ESPN game ID
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  sport: text("sport").notNull(),
  league: text("league").notNull(),
  gameDate: timestamp("game_date").notNull(),
  status: text("status").notNull(), // 'upcoming', 'live', 'final'
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  winner: text("winner"), // 'home', 'away', null for upcoming games
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const gamePredictions = pgTable("game_predictions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  gamePollId: integer("game_poll_id").references(() => gamePolls.id),
  predictedWinner: text("predicted_winner").notNull(), // 'home' or 'away'
  isCorrect: boolean("is_correct"), // null until game is resolved
  pointsEarned: integer("points_earned").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
  likes: true,
  views: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
});

export const insertPollSchema = createInsertSchema(polls).omit({
  id: true,
  createdAt: true,
  totalVotes: true,
});

export const insertGamePollSchema = createInsertSchema(gamePolls).omit({
  id: true,
  createdAt: true,
});

export const insertGamePredictionSchema = createInsertSchema(gamePredictions).omit({
  id: true,
  createdAt: true,
  pointsEarned: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Poll = typeof polls.$inferSelect;
export type InsertPoll = z.infer<typeof insertPollSchema>;
export type UserVote = typeof userVotes.$inferSelect;
export type GamePoll = typeof gamePolls.$inferSelect;
export type InsertGamePoll = z.infer<typeof insertGamePollSchema>;
export type GamePrediction = typeof gamePredictions.$inferSelect;
export type InsertGamePrediction = z.infer<typeof insertGamePredictionSchema>;
