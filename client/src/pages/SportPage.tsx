import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { NewsDataArticle } from "../../../server/news-api";
import type { LiveGameScore } from "../../../server/live-scores-api";

interface SportPageProps {
  sport: string;
}

export function SportPage({ sport }: SportPageProps) {
  const sportName = sport.toUpperCase();
  
  // Fetch sport-specific news
  const { data: news, isLoading: newsLoading } = useQuery<NewsDataArticle[]>({
    queryKey: [`/api/news/sport/${sport}`],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Fetch sport-specific live scores
  const { data: scores, isLoading: scoresLoading } = useQuery<LiveGameScore[]>({
    queryKey: [`/api/games/sport/${sport}`],
    refetchInterval: 30 * 1000, // Refresh every 30 seconds for live scores
  });

  const getSportDisplayName = (sport: string): string => {
    const sportNames: { [key: string]: string } = {
      'nba': 'NBA Basketball',
      'nfl': 'NFL Football', 
      'mlb': 'MLB Baseball',
      'nhl': 'NHL Hockey',
      'ncaam': 'NCAA Men\'s Basketball',
      'cfb': 'College Football',
      'pga': 'PGA Golf',
      'liv': 'LIV Golf'
    };
    return sportNames[sport.toLowerCase()] || sport.toUpperCase();
  };

  const getScoreColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-500';
      case 'final': return 'bg-gray-500';
      case 'upcoming': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {getSportDisplayName(sport)}
          </h1>
          <p className="text-gray-600">
            Latest news, scores, and updates for {getSportDisplayName(sport)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Scores Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Live Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scoresLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : !scores || scores.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No live games for {sportName} right now
                  </p>
                ) : (
                  <div className="space-y-4">
                    {scores.slice(0, 5).map((game) => (
                      <div
                        key={game.id}
                        className="border rounded-lg p-4 bg-white"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            className={`text-white ${getScoreColor(game.status)}`}
                          >
                            {game.status === 'live' ? 'LIVE' : game.status.toUpperCase()}
                          </Badge>
                          {game.quarter && (
                            <span className="text-sm text-gray-500">
                              {game.quarter}
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{game.awayTeam}</span>
                            <span className="font-bold text-lg">{game.awayScore}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{game.homeTeam}</span>
                            <span className="font-bold text-lg">{game.homeScore}</span>
                          </div>
                        </div>
                        
                        {game.timeRemaining && game.status === 'live' && (
                          <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {game.timeRemaining}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* News Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Latest {sportName} News</CardTitle>
              </CardHeader>
              <CardContent>
                {newsLoading ? (
                  <div className="space-y-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : !news || news.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">
                      No {sportName} news available right now
                    </p>
                    <p className="text-sm text-gray-400">
                      Check back later for the latest updates
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {news.map((article, index) => (
                      <article
                        key={index}
                        className="border-b border-gray-200 pb-6 last:border-b-0"
                      >
                        <div className="flex gap-4">
                          {/* Article Image */}
                          <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32">
                            <img
                              src={article.imageUrl}
                              alt={article.title}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop';
                              }}
                            />
                          </div>

                          {/* Article Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                              {article.title}
                            </h3>
                            
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                              {article.summary}
                            </p>

                            {/* Article Meta */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span>{article.source}</span>
                                <span>•</span>
                                <span>
                                  {new Date(article.publishedAt).toLocaleDateString()}
                                </span>
                                {article.category && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="outline" className="text-xs">
                                      {article.category}
                                    </Badge>
                                  </>
                                )}
                              </div>

                              {/* Read More Link */}
                              {article.url && (
                                <a
                                  href={article.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  Read More
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>

                            {/* Tags */}
                            {article.tags && article.tags.length > 0 && (
                              <div className="flex gap-2 mt-3">
                                {article.tags.slice(0, 3).map((tag, tagIndex) => (
                                  <Badge
                                    key={tagIndex}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}