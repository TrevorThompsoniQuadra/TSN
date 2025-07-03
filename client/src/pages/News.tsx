import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { NewsArticle } from "@/components/NewsArticle";
import { ArticleModal } from "@/components/ArticleModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function News() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sportFilter, setSportFilter] = useState<string>("all");

  // Fetch all news from ESPN
  const { data: allNews, isLoading, refetch, error } = useQuery<NewsAPIArticle[]>({
    queryKey: ['/api/news/all'],
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
    source: newsArticle.source,
    author: newsArticle.source,
    createdAt: new Date(newsArticle.publishedAt),
    likes: 0,
    views: 0,
    isBreaking: false
  });

  // Filter articles by sport
  const filteredArticles = allNews?.filter(article => {
    if (sportFilter === "all") return true;
    return article.category.toLowerCase().includes(sportFilter.toLowerCase()) ||
           article.tags.some(tag => tag.toLowerCase().includes(sportFilter.toLowerCase()));
  }) || [];

  // Get unique sports for filter dropdown
  const availableSports = Array.from(new Set(
    allNews?.flatMap(article => [
      article.category,
      ...article.tags.filter(tag => 
        ['nba', 'nfl', 'mlb', 'nhl', 'ncaam', 'cfb', 'pga', 'golf', 'tennis', 'soccer', 'basketball', 'football', 'baseball', 'hockey'].includes(tag.toLowerCase())
      )
    ]) || []
  )).sort();

  if (isLoading) {
    return (
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Sports News</h1>
          <p className="text-gray-600 mt-2">All the latest sports stories from ESPN</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="w-full h-48" />
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex space-x-2 mt-3">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to load news</h1>
          <p className="text-gray-600 mb-6">There was an error fetching the latest sports news.</p>
          <Button onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sports News</h1>
          <p className="text-gray-600 mt-2">
            {filteredArticles.length} stories from ESPN
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Sport Filter */}
          <div className="flex items-center gap-2">
            <Select value={sportFilter} onValueChange={setSportFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {availableSports.map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    {sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Refresh Button */}
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((newsArticle, index) => {
            const article = convertToArticle(newsArticle);
            return (
              <div key={`${newsArticle.title}-${index}`} className="relative">
                <NewsArticle 
                  article={article} 
                  onClick={() => handleArticleClick(article)}
                />
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-white/90 text-gray-700">
                    {newsArticle.category}
                  </Badge>
                </div>
                {/* Tags */}
                {newsArticle.tags.length > 0 && (
                  <div className="absolute bottom-4 left-4 flex flex-wrap gap-1">
                    {newsArticle.tags.slice(0, 3).map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="outline" className="text-xs bg-white/90">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500 mb-4">
              {sportFilter === "all" 
                ? "No sports news available at the moment" 
                : `No articles found for ${sportFilter}`
              }
            </p>
            <div className="flex justify-center gap-2">
              {sportFilter !== "all" && (
                <Button variant="outline" onClick={() => setSportFilter("all")}>
                  Show All Sports
                </Button>
              )}
              <Button onClick={() => refetch()}>
                Check for updates
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Article Modal */}
      <ArticleModal
        article={selectedArticle}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </main>
  );
}