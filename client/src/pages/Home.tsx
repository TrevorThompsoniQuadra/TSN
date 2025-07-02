import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { NewsArticle } from "@/components/NewsArticle";
import { ArticleModal } from "@/components/ArticleModal";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function Home() {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch real breaking sports news from NewsAPI
  const { data: newsData, isLoading: isLoadingNews, error: newsError, refetch: refetchNews } = useQuery<NewsAPIArticle[]>({
    queryKey: ['/api/news/breaking'],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Console logging when data changes
  if (newsData) {
    console.log('🔥 Article titles:', newsData.map(a => a.title));
  }
  if (newsError) {
    console.error('❌ NewsAPI Error:', newsError);
  }

  // Fallback to stored articles if real news fails
  const { data: storedArticles, isLoading: isLoadingStored } = useQuery<Article[]>({
    queryKey: ['/api/articles'],
    enabled: !newsData || newsData.length === 0,
  });

  // Use real news if available, otherwise fall back to stored articles
  const articles = newsData?.map((article, index) => ({
    id: index + 1000, // Use high IDs to avoid conflicts
    title: article.title,
    content: article.content,
    summary: article.summary,
    imageUrl: article.imageUrl,
    author: article.source,
    source: article.source,
    category: article.category,
    tags: article.tags,
    publishedAt: new Date(article.publishedAt),
    createdAt: new Date(article.publishedAt),
    isBreaking: index === 0,
    likes: 0, // Start with 0 real likes
    views: 0, // Start with 0 real views
  })) || storedArticles;

  const isLoading = isLoadingNews || isLoadingStored;
  const error = newsError;

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedArticle(null);
  };

  const featuredArticle = articles?.[0];
  const otherArticles = articles?.slice(1) || [];

  if (error) {
    return (
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Error Loading Content</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Unable to load articles. Please check your connection and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Breaking News Banner */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center space-x-3">
              <span className="bg-white text-red-600 px-2 py-1 rounded text-xs font-bold animate-pulse">
                LIVE
              </span>
              <p className="font-semibold flex-1">
                {articles?.[0]?.title || "Latest sports news loading..."}
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:text-red-200"
                onClick={() => refetchNews()}
                disabled={isLoadingNews}
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingNews ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Featured Story */}
          {isLoading ? (
            <Card className="overflow-hidden">
              <Skeleton className="w-full h-64 sm:h-80" />
              <CardContent className="p-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex space-x-4">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ) : featuredArticle ? (
            <NewsArticle 
              article={featuredArticle} 
              featured 
              onClick={() => handleArticleClick(featuredArticle)} 
            />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">No featured articles available</p>
              </CardContent>
            </Card>
          )}

          {/* News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full h-48" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))
            ) : otherArticles.length > 0 ? (
              otherArticles.map((article) => (
                <NewsArticle 
                  key={article.id} 
                  article={article} 
                  onClick={() => handleArticleClick(article)} 
                />
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <p className="text-gray-500">No additional articles available</p>
              </div>
            )}
          </div>

          {/* Load More */}
          <div className="text-center py-6">
            <Button variant="outline" className="px-6 py-3">
              Load More Stories
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <Sidebar />
      </div>

      {/* Article Modal */}
      <ArticleModal
        article={selectedArticle}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
    </main>
  );
}
