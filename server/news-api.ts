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
    private rssUrl = 'https://www.espn.com/espn/rss/news';
    private corsProxy = 'https://api.allorigins.win/raw?url=';

    async getBreakingAmericanSportsNews(): Promise<NewsDataArticle[]> {
        try {
            console.log('Fetching breaking American sports news from ESPN RSS...');
            
            const response = await fetch(`${this.corsProxy}${encodeURIComponent(this.rssUrl)}`);
            
            if (!response.ok) {
                throw new Error(`ESPN RSS request failed: ${response.status} ${response.statusText}`);
            }

            const xmlText = await response.text();
            const articles = this.parseRSSFeed(xmlText);
            
            console.log(`ESPN RSS returned ${articles.length} articles`);
            
            if (articles.length === 0) {
                return this.getFallbackArticles();
            }

            return articles.slice(0, 10);

        } catch (error) {
            console.error('ESPN RSS Error:', error);
            return this.getFallbackArticles();
        }
    }

    async getSpecificAmericanSport(sport: string): Promise<NewsDataArticle[]> {
        try {
            console.log(`Fetching ${sport} news from ESPN RSS...`);
            
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
                        imageUrl: this.getESPNImage(title + ' ' + description),
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

    private getESPNImage(text: string): string {
        const textLower = text.toLowerCase();
        
        // Sport-specific images
        if (textLower.includes('nba') || textLower.includes('basketball')) {
            return 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=400&fit=crop';
        }
        if (textLower.includes('nfl') || textLower.includes('football')) {
            return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop';
        }
        if (textLower.includes('mlb') || textLower.includes('baseball')) {
            return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop';
        }
        if (textLower.includes('golf')) {
            return 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=400&fit=crop';
        }
        if (textLower.includes('hockey') || textLower.includes('nhl')) {
            return 'https://images.unsplash.com/photo-1578662015659-ccea53ae4a20?w=800&h=400&fit=crop';
        }
        if (textLower.includes('tennis')) {
            return 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=400&fit=crop';
        }
        if (textLower.includes('soccer')) {
            return 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&h=400&fit=crop';
        }
        
        // Default sports image
        const images = [
            'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=400&fit=crop',
            'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800&h=400&fit=crop',
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop'
        ];
        
        return images[Math.floor(Math.random() * images.length)];
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
}

export const espnNewsService = new ESPNNewsService();