import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { NewsDataArticle } from "../../../server/news-api";

interface TeamPageProps {
  teamName: string;
}

export function TeamPage({ teamName }: TeamPageProps) {
  // Fetch team-specific news
  const { data: teamNews, isLoading: newsLoading } = useQuery<NewsDataArticle[]>({
    queryKey: ['/api/news/team', teamName],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const formatTeamName = (team: string): string => {
    return team.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              {formatTeamName(teamName)}
            </h1>
          </div>
          <p className="text-gray-600">
            Latest news and updates for {formatTeamName(teamName)}
          </p>
        </div>

        {/* Team News Section */}
        <Card>
          <CardHeader>
            <CardTitle>Team News</CardTitle>
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
            ) : !teamNews || teamNews.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  No news found for {formatTeamName(teamName)}
                </p>
                <p className="text-sm text-gray-400">
                  Check back later for the latest team updates
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {teamNews.map((article, index) => (
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
  );
}