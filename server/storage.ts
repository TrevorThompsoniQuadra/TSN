import {
  users,
  articles,
  comments,
  games,
  polls,
  userVotes,
  type User,
  type InsertUser,
  type Article,
  type InsertArticle,
  type Comment,
  type InsertComment,
  type Game,
  type InsertGame,
  type Poll,
  type InsertPoll,
  type UserVote,
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  
  // Article methods
  getArticles(limit?: number, offset?: number): Promise<Article[]>;
  getArticleById(id: number): Promise<Article | undefined>;
  getArticlesByCategory(category: string, limit?: number): Promise<Article[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article>;
  incrementArticleLikes(id: number): Promise<Article>;
  incrementArticleViews(id: number): Promise<Article>;
  
  // Comment methods
  getCommentsByArticleId(articleId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Game methods
  getLiveGames(): Promise<Game[]>;
  getGamesByTeam(team: string): Promise<Game[]>;
  getGamesBySport(sport: string): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, game: Partial<InsertGame>): Promise<Game>;
  
  // Poll methods
  getActivePolls(): Promise<Poll[]>;
  getPollById(id: number): Promise<Poll | undefined>;
  createPoll(poll: InsertPoll): Promise<Poll>;
  voteOnPoll(userId: number, pollId: number, optionIndex: number): Promise<void>;
  getUserVote(userId: number, pollId: number): Promise<UserVote | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private articles: Map<number, Article> = new Map();
  private comments: Map<number, Comment> = new Map();
  private games: Map<number, Game> = new Map();
  private polls: Map<number, Poll> = new Map();
  private userVotes: Map<number, UserVote> = new Map();
  
  private currentUserId = 1;
  private currentArticleId = 1;
  private currentCommentId = 1;
  private currentGameId = 1;
  private currentPollId = 1;
  private currentVoteId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed some initial data for demonstration
    const sampleArticles: Article[] = [
      {
        id: 1,
        title: "Championship Playoffs Heat Up: Unexpected Upsets Rock the League",
        content: "Three major upsets in tonight's playoff games have completely reshaped the championship picture. Underdog teams defeated favored opponents in thrilling overtime finishes, setting up unexpected matchups for the conference finals.",
        summary: "Three major upsets in playoff games reshape championship picture with overtime finishes.",
        imageUrl: "https://pixabay.com/get/gb7c21f0523e483b84250cbe76c47e444917e0eed9df12a58d7e3a27f05fd15267d6b9ed3bbc5df86a5316b759ff6fa135c1e2623cda8051240711234c4cb6694_1280.jpg",
        author: "Sarah Johnson",
        source: "TSN Sports",
        category: "NFL",
        tags: ["playoffs", "upsets", "championship"],
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isBreaking: true,
        likes: 247,
        views: 1520,
      },
      {
        id: 2,
        title: "Rookie Sensation Breaks 30-Year Scoring Record",
        content: "First-year player achieves historic milestone in dramatic victory over conference rivals.",
        summary: "Rookie player breaks 30-year scoring record in dramatic win.",
        imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
        author: "Mike Chen",
        source: "TSN Sports",
        category: "NBA",
        tags: ["rookie", "record", "scoring"],
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        isBreaking: false,
        likes: 189,
        views: 892,
      },
    ];

    const sampleGames: Game[] = [
      {
        id: 1,
        homeTeam: "Lakers",
        awayTeam: "Celtics",
        homeScore: 108,
        awayScore: 112,
        status: "live",
        quarter: "Q4",
        timeRemaining: "2:34",
        sport: "Basketball",
        league: "NBA",
        gameDate: new Date(),
        venue: "Staples Center",
      },
      {
        id: 2,
        homeTeam: "Warriors",
        awayTeam: "Mavericks",
        homeScore: 89,
        awayScore: 94,
        status: "live",
        quarter: "Q3",
        timeRemaining: "8:45",
        sport: "Basketball",
        league: "NBA",
        gameDate: new Date(),
        venue: "Chase Center",
      },
    ];

    sampleArticles.forEach(article => {
      this.articles.set(article.id, article);
      this.currentArticleId = Math.max(this.currentArticleId, article.id + 1);
    });

    sampleGames.forEach(game => {
      this.games.set(game.id, game);
      this.currentGameId = Math.max(this.currentGameId, game.id + 1);
    });
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.firebaseUid === firebaseUid);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.currentUserId++,
      ...user,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
      favoriteTeams: user.favoriteTeams || null,
      favoriteSports: user.favoriteSports || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    const existingUser = this.users.get(id);
    if (!existingUser) throw new Error("User not found");
    
    const updatedUser: User = {
      ...existingUser,
      ...user,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getArticles(limit = 10, offset = 0): Promise<Article[]> {
    const articles = Array.from(this.articles.values())
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(offset, offset + limit);
    return articles;
  }

  async getArticleById(id: number): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async getArticlesByCategory(category: string, limit = 10): Promise<Article[]> {
    return Array.from(this.articles.values())
      .filter(article => article.category === category)
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
      .slice(0, limit);
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const newArticle: Article = {
      id: this.currentArticleId++,
      ...article,
      createdAt: new Date(),
      likes: 0,
      views: 0,
    };
    this.articles.set(newArticle.id, newArticle);
    return newArticle;
  }

  async updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article> {
    const existingArticle = this.articles.get(id);
    if (!existingArticle) throw new Error("Article not found");
    
    const updatedArticle: Article = {
      ...existingArticle,
      ...article,
    };
    this.articles.set(id, updatedArticle);
    return updatedArticle;
  }

  async incrementArticleLikes(id: number): Promise<Article> {
    const article = this.articles.get(id);
    if (!article) throw new Error("Article not found");
    
    article.likes += 1;
    this.articles.set(id, article);
    return article;
  }

  async incrementArticleViews(id: number): Promise<Article> {
    const article = this.articles.get(id);
    if (!article) throw new Error("Article not found");
    
    article.views += 1;
    this.articles.set(id, article);
    return article;
  }

  async getCommentsByArticleId(articleId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.articleId === articleId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const newComment: Comment = {
      id: this.currentCommentId++,
      ...comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.comments.set(newComment.id, newComment);
    return newComment;
  }

  async getLiveGames(): Promise<Game[]> {
    return Array.from(this.games.values())
      .filter(game => game.status === "live")
      .sort((a, b) => a.gameDate.getTime() - b.gameDate.getTime());
  }

  async getGamesByTeam(team: string): Promise<Game[]> {
    return Array.from(this.games.values())
      .filter(game => game.homeTeam === team || game.awayTeam === team)
      .sort((a, b) => b.gameDate.getTime() - a.gameDate.getTime());
  }

  async getGamesBySport(sport: string): Promise<Game[]> {
    return Array.from(this.games.values())
      .filter(game => game.sport === sport)
      .sort((a, b) => b.gameDate.getTime() - a.gameDate.getTime());
  }

  async createGame(game: InsertGame): Promise<Game> {
    const newGame: Game = {
      id: this.currentGameId++,
      ...game,
    };
    this.games.set(newGame.id, newGame);
    return newGame;
  }

  async updateGame(id: number, game: Partial<InsertGame>): Promise<Game> {
    const existingGame = this.games.get(id);
    if (!existingGame) throw new Error("Game not found");
    
    const updatedGame: Game = {
      ...existingGame,
      ...game,
    };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  async getActivePolls(): Promise<Poll[]> {
    return Array.from(this.polls.values())
      .filter(poll => poll.isActive && (!poll.expiresAt || poll.expiresAt > new Date()))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPollById(id: number): Promise<Poll | undefined> {
    return this.polls.get(id);
  }

  async createPoll(poll: InsertPoll): Promise<Poll> {
    const newPoll: Poll = {
      id: this.currentPollId++,
      ...poll,
      totalVotes: 0,
      createdAt: new Date(),
    };
    this.polls.set(newPoll.id, newPoll);
    return newPoll;
  }

  async voteOnPoll(userId: number, pollId: number, optionIndex: number): Promise<void> {
    const poll = this.polls.get(pollId);
    if (!poll) throw new Error("Poll not found");
    
    const existingVote = Array.from(this.userVotes.values())
      .find(vote => vote.userId === userId && vote.pollId === pollId);
    
    if (existingVote) throw new Error("User has already voted on this poll");
    
    const newVote: UserVote = {
      id: this.currentVoteId++,
      userId,
      pollId,
      optionIndex,
      createdAt: new Date(),
    };
    
    this.userVotes.set(newVote.id, newVote);
    
    // Update poll totals
    const options = poll.options as any[];
    if (options[optionIndex]) {
      options[optionIndex].votes = (options[optionIndex].votes || 0) + 1;
      poll.totalVotes += 1;
      this.polls.set(pollId, poll);
    }
  }

  async getUserVote(userId: number, pollId: number): Promise<UserVote | undefined> {
    return Array.from(this.userVotes.values())
      .find(vote => vote.userId === userId && vote.pollId === pollId);
  }
}

export const storage = new MemStorage();
