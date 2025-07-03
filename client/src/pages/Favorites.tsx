import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, RefreshCw, Users, Star } from "lucide-react";
import { NewsArticle } from "@/components/NewsArticle";
import { ArticleModal } from "@/components/ArticleModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import type { Article } from "@shared/schema";

interface NewsAPIArticle {
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

export default function Favorites() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  // Fetch user's favorite teams
  const { data: userData } = useQuery({
    queryKey: [`/api/users/${user?.id}`],
    enabled: !!user?.id,
  });

  // Get favorite teams from user data
  const favoriteTeams = (userData as any)?.favoriteTeams || [];

  // Fetch news for all favorite teams in a single query
  const { data: favoriteNews, isLoading, error, refetch } = useQuery<NewsAPIArticle[]>({
    queryKey: [`/api/news/favorites`, favoriteTeams],
    queryFn: async () => {
      if (favoriteTeams.length === 0) return [];
      
      // Fetch news for each team and combine results
      const promises = favoriteTeams.map(async (team: string) => {
        try {
          const response = await fetch(`/api/news/team/${encodeURIComponent(team)}`);
          if (!response.ok) return [];
          return response.json();
        } catch (error) {
          console.error(`Failed to fetch news for ${team}:`, error);
          return [];
        }
      });
      
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: favoriteTeams.length > 0,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedArticle(null);
  };

  // Convert NewsAPIArticle to Article for compatibility
  const convertToArticle = (newsArticle: NewsAPIArticle): Article => ({
    id: Math.random(), // Generate random ID for display
    title: newsArticle.title,
    content: newsArticle.content,
    summary: newsArticle.summary,
    category: newsArticle.category,
    imageUrl: newsArticle.imageUrl,
    tags: newsArticle.tags,
    publishedAt: new Date(newsArticle.publishedAt),
    createdAt: new Date(newsArticle.publishedAt),
    source: newsArticle.source,
    likes: Math.floor(Math.random() * 100),
    views: Math.floor(Math.random() * 1000),
    isBreaking: Math.random() > 0.8,
    author: "ESPN",
  });

  // Remove duplicates and sort by date
  const uniqueNews = (favoriteNews || [])
    .filter((article, index, self) => 
      index === self.findIndex(a => a.url === article.url)
    )
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
            <p className="text-gray-600">Please sign in to view your favorite teams' news.</p>
          </div>
        </div>
      </div>
    );
  }

  if (favoriteTeams.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Favorite Teams</h2>
            <p className="text-gray-600 mb-4">
              Add some teams to your favorites to see personalized news here.
            </p>
            <p className="text-sm text-gray-500">
              Use the search bar in the header to find and follow your favorite teams.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Heart className="h-8 w-8 text-red-500 mr-3" />
              Your Favorite Teams
            </h1>
            <p className="text-gray-600 mt-2">
              Latest news from {favoriteTeams.length} favorite team{favoriteTeams.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button 
            onClick={(e) => {
              e.preventDefault();
              refetch();
            }}
            variant="outline" 
            className="flex items-center space-x-2"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Favorite Teams List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Following Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {favoriteTeams.map((team: string) => (
                <Badge key={team} variant="secondary" className="px-3 py-1">
                  {team}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* News Articles */}
        {!isLoading && uniqueNews.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Recent News</h3>
              <p>No recent news found for your favorite teams. Check back later!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uniqueNews.map((article, index) => (
              <NewsArticle
                key={`${article.url}-${index}`}
                article={convertToArticle(article)}
                onClick={() => handleArticleClick(convertToArticle(article))}
              />
            ))}
          </div>
        )}

        {/* Article Modal */}
        <ArticleModal
          article={selectedArticle}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      </div>
    </div>
  );
}