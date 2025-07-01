import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel } from "firebase/ai";
import type { Article, InsertArticle } from "../shared/schema";

export interface GeneratedNewsArticle {
  title: string;
  content: string;
  summary: string;
  category: string;
  imageUrl: string;
  tags: string[];
}

// You'll need to implement this web search function
// This is a placeholder - you'll need to integrate with a news API like NewsAPI, Sports APIs, or web scraping
interface NewsSearchResult {
  title: string;
  content: string;
  source: string;
  publishedAt: string;
  url: string;
  category?: string;
}

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyD0-KrEtI3mK0nbYn-SIlXQf-uJfaPRYbE",
  authDomain: "tsn-e551b.firebaseapp.com",
  projectId: "tsn-e551b",
  storageBucket: "tsn-e551b.firebasestorage.app",
  messagingSenderId: "717953145367",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:717953145367:web:a4d84e3feef94882a99a52",
  measurementId: "G-6F4MTEBJCH"
};

// Initialize Firebase App
const firebaseApp = initializeApp(firebaseConfig);

export class AINewsService {
  private ai: any;
  private model: any;

  constructor() {
    try {
      console.log('Initializing Firebase AI for project:', firebaseConfig.projectId);
      this.ai = getAI(firebaseApp);
      console.log('Firebase AI instance created');
      
      this.model = getGenerativeModel(this.ai, { 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.3, // Lower temperature for more factual content
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 2048,
        }
      });
      console.log('Firebase AI model (gemini-1.5-flash) initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase AI:', error);
      this.model = null;
    }
  }

  // Method to fetch real sports news from NewsAPI
  private async fetchRealSportsNews(): Promise<NewsSearchResult[]> {
    try {
      const newsApiKey = "256d01364ead418dad43baeb3d42fbec";
      const allArticles: NewsSearchResult[] = [];
      
      // Multiple sports-specific queries to ensure comprehensive coverage
      const sportsQueries = [
        'NBA OR basketball',
        'NFL OR "american football"',
        'MLB OR baseball',
        'soccer OR football OR FIFA OR "premier league"',
        'tennis OR wimbledon OR "us open"',
        'hockey OR NHL',
        'sports trade OR sports injury OR sports championship'
      ];

      console.log('Fetching real sports news from NewsAPI...');
      
      // Fetch from multiple queries to get diverse sports content
      for (const query of sportsQueries.slice(0, 3)) { // Limit to 3 queries to stay within API limits
        try {
          const url = `https://newsapi.org/v2/everything?` +
            `q=${encodeURIComponent(query)}&` +
            `from=${this.getYesterdayDate()}&` +
            `sortBy=publishedAt&` +
            `language=en&` +
            `domains=espn.com,sports.yahoo.com,bleacherreport.com,nfl.com,nba.com,mlb.com,si.com&` +
            `pageSize=5&` +
            `apiKey=${newsApiKey}`;

          console.log(`Fetching news for query: ${query}`);
          const response = await fetch(url);
          
          if (!response.ok) {
            console.error(`NewsAPI error: ${response.status} ${response.statusText}`);
            continue;
          }
          
          const data = await response.json();
          
          if (data.status === 'error') {
            console.error('NewsAPI error:', data.message);
            continue;
          }
          
          if (data.articles && data.articles.length > 0) {
            const articles = data.articles
              .filter((article: any) => 
                article.title && 
                article.description && 
                !article.title.includes('[Removed]') &&
                this.isSportsContent(article.title + ' ' + article.description)
              )
              .map((article: any) => ({
                title: article.title,
                content: article.description || article.content?.substring(0, 500) || '',
                source: article.source.name,
                publishedAt: article.publishedAt,
                url: article.url,
                category: this.categorizeNews(article.title + ' ' + article.description)
              }));
            
            allArticles.push(...articles);
            console.log(`Found ${articles.length} sports articles for query: ${query}`);
          }
          
          // Small delay to be respectful to the API
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (queryError) {
          console.error(`Error fetching news for query "${query}":`, queryError);
          continue;
        }
      }

      // Remove duplicates based on title similarity
      const uniqueArticles = this.removeDuplicateArticles(allArticles);
      console.log(`Total unique sports articles found: ${uniqueArticles.length}`);
      
      return uniqueArticles.slice(0, 10); // Return top 10 most recent
      
    } catch (error) {
      console.error('Error fetching real sports news:', error);
      return [];
    }
  }

  // Check if content is actually sports-related
  private isSportsContent(text: string): boolean {
    const sportsKeywords = [
      'nba', 'nfl', 'mlb', 'nhl', 'mls', 'basketball', 'football', 'baseball', 'hockey', 'soccer',
      'tennis', 'golf', 'olympics', 'playoff', 'championship', 'game', 'match', 'season', 'draft',
      'trade', 'injury', 'coach', 'player', 'team', 'score', 'win', 'loss', 'victory', 'defeat',
      'sports', 'athletic', 'league', 'tournament', 'stadium', 'field', 'court', 'arena'
    ];
    
    const lowerText = text.toLowerCase();
    return sportsKeywords.some(keyword => lowerText.includes(keyword));
  }

  // Remove duplicate articles based on title similarity
  private removeDuplicateArticles(articles: NewsSearchResult[]): NewsSearchResult[] {
    const unique: NewsSearchResult[] = [];
    const seenTitles = new Set<string>();
    
    for (const article of articles) {
      const normalizedTitle = article.title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
      const titleWords = normalizedTitle.split(' ').slice(0, 5).join(' '); // First 5 words
      
      if (!seenTitles.has(titleWords)) {
        seenTitles.add(titleWords);
        unique.push(article);
      }
    }
    
    return unique;
  }

  // Alternative method using RSS feeds or sports-specific APIs
  private async fetchFromSportsFeeds(): Promise<NewsSearchResult[]> {
    // This is where you'd integrate with:
    // - ESPN API
    // - Sports API
    // - RSS feeds from sports sites
    // - Web scraping (be careful about terms of service)
    
    // For now, returning empty array - you'll need to implement based on your preferred news source
    return [];
  }

  private getYesterdayDate(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  private categorizeNews(text: string): string {
    const categories = {
      'NBA': ['nba', 'basketball', 'lakers', 'warriors', 'celtics', 'nets', 'knicks', 'bulls', 'heat', 'spurs', 'lebron', 'curry', 'durant'],
      'NFL': ['nfl', 'american football', 'patriots', 'cowboys', 'giants', 'jets', 'chiefs', 'packers', 'steelers', 'mahomes', 'brady'],
      'MLB': ['mlb', 'baseball', 'yankees', 'dodgers', 'red sox', 'astros', 'giants', 'mets', 'world series', 'pitcher', 'home run'],
      'Soccer': ['soccer', 'football', 'messi', 'ronaldo', 'premier league', 'champions league', 'fifa', 'mls', 'manchester', 'liverpool', 'barcelona', 'real madrid'],
      'Tennis': ['tennis', 'wimbledon', 'us open', 'french open', 'australian open', 'djokovic', 'federer', 'nadal', 'serena'],
      'Hockey': ['nhl', 'hockey', 'rangers', 'bruins', 'maple leafs', 'penguins', 'blackhawks', 'stanley cup', 'ovechkin'],
      'Golf': ['golf', 'pga', 'masters', 'tiger woods', 'rory mcilroy', 'tournament'],
      'Olympics': ['olympics', 'olympic', 'gold medal', 'paralympics'],
      'College Sports': ['college', 'ncaa', 'march madness', 'college football', 'college basketball']
    };

    const lowerText = text.toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }
    return 'Sports';
  }

  async generateBreakingSportsNews(): Promise<GeneratedNewsArticle[]> {
    try {
      console.log('Fetching real sports news...');
      const realNews = await this.fetchRealSportsNews();
      
      if (realNews.length === 0) {
        console.log('No real news found, using AI to generate realistic content');
        return this.generateRealisticNews();
      }

      if (!this.model) {
        console.log('Firebase AI model not available, returning raw news');
        return this.convertRawNewsToArticles(realNews);
      }

      // Use AI to enhance and format the real news
      console.log(`Processing ${realNews.length} real news articles with AI...`);
      const enhancedArticles: GeneratedNewsArticle[] = [];

      for (const news of realNews.slice(0, 6)) {
        try {
          const prompt = `You are enhancing REAL sports news. This is factual information that actually happened. Improve the presentation while keeping ALL facts accurate.

REAL SPORTS NEWS:
Title: ${news.title}
Content: ${news.content}
Source: ${news.source}
Published: ${news.publishedAt}
Category: ${news.category}

INSTRUCTIONS:
- Keep ALL factual information accurate (names, scores, dates, teams, etc.)
- DO NOT change or add any facts, statistics, or details
- Only improve writing quality and structure
- Expand content to 2-3 well-written paragraphs if the original is short
- Create an appropriate summary
- Generate relevant tags

Format as JSON:
{
  "title": "Keep original title or improve readability without changing facts",
  "content": "Enhanced version with better writing but same facts (2-3 paragraphs)",
  "summary": "Brief factual summary of what actually happened",
  "category": "${news.category}",
  "tags": ["relevant", "sports", "tags"]
}

Return only the JSON object.`;

          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          
          const cleanText = this.cleanJsonResponse(text);
          const enhancedArticle = JSON.parse(cleanText);
          
          enhancedArticles.push({
            ...enhancedArticle,
            imageUrl: this.getSportsImage(enhancedArticle.category),
            tags: Array.isArray(enhancedArticle.tags) ? enhancedArticle.tags : []
          });
          
          console.log(`Enhanced article: ${enhancedArticle.title}`);
          
        } catch (error) {
          console.error('Error enhancing article:', error);
          // Fallback to raw conversion
          enhancedArticles.push(this.convertSingleNewsToArticle(news));
        }
      }

      return enhancedArticles.length > 0 ? enhancedArticles : this.getFallbackArticles();
      
    } catch (error) {
      console.error('Error in generateBreakingSportsNews:', error);
      return this.getFallbackArticles();
    }
  }

  private convertRawNewsToArticles(newsArray: NewsSearchResult[]): GeneratedNewsArticle[] {
    return newsArray.slice(0, 6).map(news => this.convertSingleNewsToArticle(news));
  }

  private convertSingleNewsToArticle(news: NewsSearchResult): GeneratedNewsArticle {
    return {
      title: news.title,
      content: news.content || 'Full article content not available. Please visit the source for complete details.',
      summary: news.content ? news.content.substring(0, 150) + '...' : 'Summary not available',
      category: news.category || this.categorizeNews(news.title),
      imageUrl: this.getSportsImage(news.category || 'Sports'),
      tags: this.generateTagsFromTitle(news.title)
    };
  }

  private generateTagsFromTitle(title: string): string[] {
    const commonSportsTerms = ['trade', 'injury', 'championship', 'playoff', 'draft', 'signing', 'victory', 'defeat'];
    const tags: string[] = [];
    
    commonSportsTerms.forEach(term => {
      if (title.toLowerCase().includes(term)) {
        tags.push(term);
      }
    });
    
    return tags.length > 0 ? tags : ['sports', 'news'];
  }

  private async generateRealisticNews(): Promise<GeneratedNewsArticle[]> {
    // This is your original AI generation as fallback
    if (!this.model) {
      return this.getFallbackArticles();
    }

    const prompt = `Generate 6 realistic sports news stories that could plausibly happen in the current sports season. Make them feel authentic and timely.

Important: These should sound like real breaking news, not obviously fictional stories.

Format as JSON array:
[
  {
    "title": "Realistic sports headline",
    "content": "Detailed, realistic content (2-3 paragraphs)",
    "summary": "Brief summary",
    "category": "Sport category",
    "tags": ["relevant", "tags"]
  }
]

Return only the JSON array.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const cleanText = this.cleanJsonResponse(text);
      const articles: GeneratedNewsArticle[] = JSON.parse(cleanText);
      
      return articles.map(article => ({
        ...article,
        imageUrl: this.getSportsImage(article.category),
        tags: Array.isArray(article.tags) ? article.tags : []
      }));
    } catch (error) {
      console.error('Error generating realistic news:', error);
      return this.getFallbackArticles();
    }
  }

  private cleanJsonResponse(text: string): string {
    let cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    
    const jsonStart = cleaned.indexOf('[') !== -1 ? cleaned.indexOf('[') : cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf(']') !== -1 ? cleaned.lastIndexOf(']') : cleaned.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
    }
    
    return cleaned;
  }

  private getSportsImage(category: string): string {
    const sportImages = {
      "NBA": "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop",
      "NFL": "https://images.unsplash.com/photo-1567593810070-7a3d471af022?w=800&h=600&fit=crop", 
      "MLB": "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&h=600&fit=crop",
      "Soccer": "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=600&fit=crop",
      "Hockey": "https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=800&h=600&fit=crop",
      "Tennis": "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=800&h=600&fit=crop",
      "Basketball": "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop",
      "Football": "https://images.unsplash.com/photo-1567593810070-7a3d471af022?w=800&h=600&fit=crop",
      "Sports": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop"
    };
    
    return sportImages[category as keyof typeof sportImages] || sportImages["Sports"];
  }

  async generateTrendingTopics(): Promise<string[]> {
    // You could also make these real by fetching from Twitter API, Google Trends, etc.
    if (!this.model) {
      return this.getFallbackTrendingTopics();
    }

    const prompt = `Generate 8 realistic trending sports hashtags that could be trending right now based on current sports seasons and typical sports discussions.

Return as JSON array: ["#Topic1", "#Topic2", ...]
Return only the JSON array.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const cleanText = this.cleanJsonResponse(text);
      const topics: string[] = JSON.parse(cleanText);
      
      return topics.slice(0, 8);
    } catch (error) {
      console.error('Error generating trending topics:', error);
      return this.getFallbackTrendingTopics();
    }
  }

  private getFallbackTrendingTopics(): string[] {
    return [
      "#TradeDeadline", "#PlayoffRace", "#MVP2025", "#DraftDay", 
      "#ChampionshipSeries", "#SuperBowl2025", "#MarchMadness", "#WorldSeries"
    ];
  }

  private getFallbackArticles(): GeneratedNewsArticle[] {
    return [
      {
        title: "Real Sports News Integration Required",
        content: "To get real breaking sports news, you need to integrate with a news API service like NewsAPI, ESPN API, or sports-specific APIs. The current system is set up to fetch real news and enhance it with AI, but requires API configuration. Check the implementation notes in the code for next steps.",
        summary: "News API integration needed for real sports news.",
        category: "System",
        imageUrl: this.getSportsImage("System"),
        tags: ["configuration", "api", "real-news"]
      }
    ];
  }

  async testConnection(): Promise<boolean> {
    if (!this.model) {
      return false;
    }

    try {
      const result = await this.model.generateContent("Test: Please respond with 'Firebase AI working'");
      const response = await result.response;
      const text = response.text();
      return text.length > 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const aiNewsService = new AINewsService();