import { XMLParser } from 'fast-xml-parser';

export interface NewsDataArticle {
    title: string;
    content: string;
    summary: string;
    category: string;
    imageUrl: string;
    tags: string[];
    publishedAt: string;
    source: string;
    url: string;
}

export class ESPNNewsService {
    private apiUrl = 'https://site.api.espn.com/apis/site/v2/sports';
    private newsUrl = 'https://site.api.espn.com/apis/v2/sports/news';

    async getBreakingAmericanSportsNews(sport?: string): Promise<NewsDataArticle[]> {
        try {
            console.log('Fetching breaking American sports news from ESPN API...');
            
            // Try multiple ESPN news endpoints with higher limits
            const newsEndpoints = [
                `${this.newsUrl}?limit=50`,
                `${this.apiUrl}/football/nfl/news?limit=25`,
                `${this.apiUrl}/basketball/nba/news?limit=25`,
                `${this.apiUrl}/baseball/mlb/news?limit=25`,
                `${this.apiUrl}/basketball/mens-college-basketball/news?limit=15`,
                `${this.apiUrl}/football/college-football/news?limit=15`,
                `${this.apiUrl}/golf/news?limit=10`
            ];

            const allArticles: NewsDataArticle[] = [];

            for (const endpoint of newsEndpoints) {
                try {
                    const response = await fetch(endpoint);
                    if (!response.ok) {
                        console.log(`ESPN API endpoint ${endpoint} returned ${response.status}`);
                        continue;
                    }
                    
                    const data = await response.json();
                    const articles = this.parseESPNNewsResponse(data);
                    allArticles.push(...articles);
                } catch (error) {
                    console.log(`Error fetching from ${endpoint}:`, error);
                }
            }

            if (allArticles.length > 0) {
                let filteredArticles = allArticles;
                
                // Filter by sport if specified
                if (sport) {
                    filteredArticles = this.filterArticlesBySport(allArticles, sport);
                    console.log(`ESPN API returned ${filteredArticles.length} articles for sport: ${sport}`);
                } else {
                    console.log(`ESPN API returned ${allArticles.length} news articles`);
                }
                
                // Remove duplicates based on title
                const uniqueArticles = this.removeDuplicates(filteredArticles);
                return uniqueArticles;
            }

            // If no articles from API, try RSS as fallback
            return await this.getRSSFallback();

        } catch (error) {
            console.error('ESPN News API Error:', error);
            return await this.getRSSFallback();
        }
    }

    private async getRSSFallback(): Promise<NewsDataArticle[]> {
        try {
            console.log('Trying ESPN RSS as fallback...');
            const corsProxy = 'https://api.allorigins.win/raw?url=';
            const rssUrl = 'https://www.espn.com/espn/rss/news';
            
            const response = await fetch(`${corsProxy}${encodeURIComponent(rssUrl)}`);
            
            if (!response.ok) {
                throw new Error(`ESPN RSS request failed: ${response.status} ${response.statusText}`);
            }

            const xmlText = await response.text();
            const articles = this.parseRSSFeed(xmlText);
            
            console.log(`ESPN RSS returned ${articles.length} articles`);
            return articles;

        } catch (error) {
            console.error('ESPN RSS also failed:', error);
            return this.getFallbackArticles();
        }
    }

    private parseESPNNewsResponse(data: any): NewsDataArticle[] {
        const articles: NewsDataArticle[] = [];

        try {
            // Handle different ESPN API response formats
            const newsItems = data.articles || data.items || data.news || [];
            
            newsItems.forEach((item: any) => {
                if (!item.headline && !item.title) return;

                const article: NewsDataArticle = {
                    title: item.headline || item.title || 'Sports News',
                    content: this.generateContent(
                        item.headline || item.title,
                        item.description || item.summary || '',
                        item.links?.web?.href || item.url || ''
                    ),
                    summary: item.description || item.summary || 'Latest sports news update',
                    category: this.extractCategoryFromESPN(item),
                    imageUrl: this.getESPNImage(item),
                    tags: this.extractESPNTags(item.headline || item.title || ''),
                    publishedAt: this.formatDate(item.published || item.lastModified || new Date().toISOString()),
                    source: 'ESPN',
                    url: item.links?.web?.href || item.url || 'https://espn.com'
                };

                articles.push(article);
            });

        } catch (error) {
            console.error('Error parsing ESPN news response:', error);
        }

        return articles;
    }

    private removeDuplicates(articles: NewsDataArticle[]): NewsDataArticle[] {
        const seen = new Set();
        return articles.filter(article => {
            const key = article.title.toLowerCase().trim();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    private filterArticlesBySport(articles: NewsDataArticle[], sport: string): NewsDataArticle[] {
        const sportLower = sport.toLowerCase();
        
        // Map navigation names to ESPN URL patterns
        const sportMappings: { [key: string]: string[] } = {
            'nba': ['nba', 'basketball'],
            'nfl': ['nfl', 'football'],
            'mlb': ['mlb', 'baseball'],
            'nhl': ['nhl', 'hockey'],
            'ncaam': ['mens-college-basketball', 'college-basketball', 'ncb'],
            'cfb': ['college-football', 'cfb'],
            'wnba': ['wnba', 'womens-basketball'],
            'pga': ['golf', 'pga'],
            'liv': ['golf', 'liv']
        };

        const urlPatterns = sportMappings[sportLower] || [sportLower];
        
        return articles.filter(article => {
            // Check if article URL contains sport patterns
            const urlLower = article.url.toLowerCase();
            const titleLower = article.title.toLowerCase();
            const categoryLower = article.category.toLowerCase();
            
            return urlPatterns.some(pattern => 
                urlLower.includes(`espn.com/${pattern}/`) ||
                urlLower.includes(`/${pattern}/`) ||
                titleLower.includes(pattern) ||
                categoryLower.includes(pattern)
            );
        });
    }

    private extractCategoryFromESPN(item: any): string {
        // Try to get category from ESPN API structure
        if (item.categories && item.categories.length > 0) {
            return item.categories[0].description || item.categories[0].sportName || 'Sports';
        }
        
        if (item.sport) {
            return item.sport.displayName || item.sport.name || 'Sports';
        }

        // Fallback to URL-based category extraction
        const url = item.links?.web?.href || item.url || '';
        return this.extractCategoryFromUrl(url);
    }

    async getSpecificAmericanSport(sport: string): Promise<NewsDataArticle[]> {
        try {
            console.log(`Fetching ${sport} news from ESPN API...`);
            
            const allArticles = await this.getBreakingAmericanSportsNews();
            
            // Filter articles by sport
            const filteredArticles = allArticles.filter(article => 
                this.isRelevantToSport(article, sport)
            );

            return filteredArticles.slice(0, 8);

        } catch (error) {
            console.error(`ESPN RSS Error for ${sport}:`, error);
            return [];
        }
    }

    private parseRSSFeed(xmlText: string): NewsDataArticle[] {
        try {
            const parser = new XMLParser();
            const json = parser.parse(xmlText);

            const items = json.rss?.channel?.item ?? [];
            const articles: NewsDataArticle[] = [];

            items.forEach((item: any) => {
                const title = item.title || '';
                const description = item.description || '';
                const link = item.link || '';
                const pubDate = item.pubDate || '';

                if (title && description) {
                    const article: NewsDataArticle = {
                        title: this.cleanTitle(title),
                        content: this.generateContent(title, description, link),
                        summary: this.cleanDescription(description),
                        category: this.extractCategoryFromUrl(link),
                        imageUrl: this.getSportsLogoByCategory(this.extractCategoryFromUrl(link)),
                        tags: this.extractESPNTags(title + ' ' + description),
                        publishedAt: this.formatDate(pubDate),
                        source: 'ESPN',
                        url: link
                    };

                    articles.push(article);
                }
            });

            return articles;
        } catch (error) {
            console.error('Error parsing RSS feed:', error);
            return [];
        }
    }

    private cleanTitle(title: string): string {
        // Remove any HTML entities and clean up the title
        return title
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
    }

    private cleanDescription(description: string): string {
        // Remove HTML tags and clean up description
        return description
            .replace(/<[^>]*>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ')
            .trim();
    }

    private generateContent(title: string, description: string, link: string): string {
        const cleanTitle = this.cleanTitle(title);
        const cleanDescription = this.cleanDescription(description);
        
        // Create comprehensive content from the RSS data
        let content = `${cleanDescription} ${link}`;

        return content;
    }


    private extractCategoryFromUrl(url: string): string {
        try {
          if (!url) return "SPORTS";
          const parsedUrl = new URL(url);
          const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
          return pathSegments.length > 0 ? pathSegments[0].toUpperCase() : "SPORTS";
        } catch {
          return "SPORTS";
        }
      }
      

    private isRelevantToSport(article: NewsDataArticle, sport: string): boolean {
        const text = (article.title + ' ' + article.summary).toLowerCase();
        const sportLower = sport.toLowerCase();

        const sportRelevanceMap: { [key: string]: string[] } = {
            'nba': ['nba', 'basketball', 'lebron', 'curry', 'lakers', 'warriors', 'celtics', 'knicks', 'nets', 'heat'],
            'nfl': ['nfl', 'football', 'quarterback', 'touchdown', 'super bowl', 'patriots', 'cowboys', 'packers', 'chiefs'],
            'mlb': ['mlb', 'baseball', 'world series', 'yankees', 'dodgers', 'red sox', 'giants', 'astros'],
            'college basketball': ['college basketball', 'ncaa basketball', 'march madness', 'duke', 'unc', 'kentucky', 'gonzaga'],
            'college football': ['college football', 'ncaa football', 'college football playoff', 'alabama', 'georgia', 'ohio state', 'clemson'],
            'golf': ['golf', 'pga', 'masters', 'tiger woods', 'pga tour', 'us open golf', 'rory mcilroy'],
            'nhl': ['nhl', 'hockey', 'stanley cup', 'rangers', 'bruins', 'penguins', 'blackhawks'],
            'tennis': ['tennis', 'us open tennis', 'wimbledon', 'serena williams', 'djokovic', 'federer'],
            'soccer': ['soccer', 'mls', 'usmnt', 'world cup', 'fifa', 'premier league']
        };

        const relevantTerms = sportRelevanceMap[sportLower] || [sportLower];
        return relevantTerms.some(term => text.includes(term));
    }

    private getESPNImage(item: any): string {
        // Try to get image from ESPN API response
        if (item.images && item.images.length > 0) {
            return item.images[0].url || item.images[0].href || '';
        }
        
        if (item.thumbnail) {
            return item.thumbnail;
        }

        // Fallback to category-based images
        const category = this.extractCategoryFromESPN(item);
        return this.getSportsLogoByCategory(category);
    }

    private extractESPNTags(text: string): string[] {
        const tags: string[] = [];
        const textLower = text.toLowerCase();
        
        // Sport-specific tags
        if (textLower.includes('trade') || textLower.includes('traded')) tags.push('Trade');
        if (textLower.includes('draft') || textLower.includes('drafted')) tags.push('Draft');
        if (textLower.includes('injury') || textLower.includes('injured')) tags.push('Injury');
        if (textLower.includes('playoff') || textLower.includes('postseason')) tags.push('Playoffs');
        if (textLower.includes('championship') || textLower.includes('title')) tags.push('Championship');
        if (textLower.includes('mvp') || textLower.includes('award')) tags.push('Award');
        if (textLower.includes('contract') || textLower.includes('signing')) tags.push('Contract');
        if (textLower.includes('coach') || textLower.includes('coaching')) tags.push('Coaching');
        if (textLower.includes('record') || textLower.includes('milestone')) tags.push('Record');
        if (textLower.includes('breaking') || textLower.includes('news')) tags.push('Breaking');
        if (textLower.includes('analysis') || textLower.includes('report')) tags.push('Analysis');
        
        // Event-specific tags
        if (textLower.includes('super bowl')) tags.push('Super Bowl');
        if (textLower.includes('world series')) tags.push('World Series');
        if (textLower.includes('march madness') || textLower.includes('final four')) tags.push('March Madness');
        if (textLower.includes('masters') || textLower.includes('major championship')) tags.push('Major');
        if (textLower.includes('stanley cup')) tags.push('Stanley Cup');
        if (textLower.includes('olympics')) tags.push('Olympics');
        
        // Remove duplicates and limit to 4 tags
        return Array.from(
            new Set(
                tags
                    .filter(Boolean)
                    .map(tag => tag.trim())
                    .map(tag => tag.charAt(0).toUpperCase() + tag.slice(1))
            )
        ).slice(0, 4);
    }

    private getSportsLogoByCategory(category: string): string {
        const categoryLower = category.toLowerCase();
        
        // Sport-specific logos based on ESPN URL categories
        const logoMap: { [key: string]: string } = {
            'nba': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=400&fit=crop',
            'nfl': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop',
            'mlb': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop',
            'wnba': 'https://images.unsplash.com/photo-1594623930572-300a3011d9ae?w=800&h=400&fit=crop',
            'college-football': 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&h=400&fit=crop',
            'college-basketball': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
            'mens-college-basketball': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop',
            'womens-college-basketball': 'https://images.unsplash.com/photo-1594623930572-300a3011d9ae?w=800&h=400&fit=crop',
            'nhl': 'https://images.unsplash.com/photo-1578662015659-ccea53ae4a20?w=800&h=400&fit=crop',
            'golf': 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=400&fit=crop',
            'tennis': 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=400&fit=crop',
            'soccer': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=400&fit=crop',
            'mls': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=400&fit=crop',
            'boxing': 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&h=400&fit=crop',
            'mma': 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&h=400&fit=crop',
            'racing': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&h=400&fit=crop',
            'olympics': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=400&fit=crop'
        };
        
        // Return sport-specific logo or default sports image
        return logoMap[categoryLower] || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=400&fit=crop';
    }

    private formatDate(pubDate: string): string {
        if (!pubDate) return new Date().toISOString();
        
        try {
            const date = new Date(pubDate);
            return date.toISOString();
        } catch {
            return new Date().toISOString();
        }
    }

    private getFallbackArticles(): NewsDataArticle[] {
        return [
            {
                title: '⚠️ ESPN Sports News Temporarily Unavailable',
                content: `We're currently unable to fetch the latest sports news from ESPN's RSS feed. This could be due to:

• Network connectivity issues
• CORS proxy temporary unavailability  
• ESPN RSS feed maintenance

Please try again in a few minutes for the latest breaking news from:
• NBA - Basketball scores, trades, and player updates
• NFL - Football news, draft updates, and game analysis  
• MLB - Baseball standings, player moves, and World Series coverage
• College Basketball & Football - NCAA tournament updates and rankings
• NHL - Hockey scores and playoff coverage
• Golf - PGA Tour and major championship results

In the meantime, you can visit ESPN.com directly for the latest sports coverage.`,
                summary: 'ESPN sports news temporarily unavailable due to technical issues.',
                category: 'System',
                imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=400&fit=crop',
                tags: ['System', 'Notice', 'Technical'],
                publishedAt: new Date().toISOString(),
                source: 'System Notice',
                url: ''
            }
        ];
    }

    // Get trending sports topics from ESPN RSS
    async getTrendingAmericanSportsTopics(): Promise<string[]> {
        try {
            const articles = await this.getBreakingAmericanSportsNews();
            
            const allTags = articles.flatMap(article => article.tags);
            const tagCount = allTags.reduce((acc: any, tag: string) => {
                acc[tag] = (acc[tag] || 0) + 1;
                return acc;
            }, {});

            return Object.entries(tagCount)
                .sort(([,a]: any, [,b]: any) => b - a)
                .slice(0, 8)
                .map(([tag]) => tag as string);
        } catch (error) {
            console.error('Error getting trending topics:', error);
            return ['NBA', 'NFL', 'MLB', 'College Football', 'NBA Trade', 'Injury Report'];
        }
    }

    // Get team-specific news articles (like ESPN team pages)
    async getTeamSpecificNews(teamName: string): Promise<NewsDataArticle[]> {
        try {
            console.log(`🔍 Fetching team-specific news for: ${teamName}`);
            
            // Get all breaking news first
            const allArticles = await this.getBreakingAmericanSportsNews();
            
            // Filter articles that mention the team name (case insensitive)
            const teamArticles = allArticles.filter(article => {
                const teamNameLower = teamName.toLowerCase();
                const titleLower = article.title.toLowerCase();
                const contentLower = article.content.toLowerCase();
                const summaryLower = article.summary.toLowerCase();
                
                return titleLower.includes(teamNameLower) || 
                       contentLower.includes(teamNameLower) || 
                       summaryLower.includes(teamNameLower) ||
                       article.tags.some(tag => tag.toLowerCase().includes(teamNameLower));
            });

            console.log(`✅ Found ${teamArticles.length} direct matches for ${teamName}`);
            
            // If no direct matches, try partial team name matches (e.g., "titans" for "tennessee titans")
            if (teamArticles.length === 0) {
                const teamWords = teamName.toLowerCase().split(' ');
                const partialMatches = allArticles.filter(article => {
                    const titleLower = article.title.toLowerCase();
                    const contentLower = article.content.toLowerCase();
                    
                    return teamWords.some(word => 
                        word.length > 3 && (titleLower.includes(word) || contentLower.includes(word))
                    );
                });
                
                console.log(`✅ Found ${partialMatches.length} partial matches for ${teamName}`);
                return partialMatches.slice(0, 10);
            }
            
            return teamArticles.slice(0, 10);
        } catch (error) {
            console.error('❌ Error fetching team-specific news:', error);
            return [];
        }
    }
}

export const espnNewsService = new ESPNNewsService();