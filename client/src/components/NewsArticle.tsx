import { useState } from "react";
import { Heart, MessageCircle, Share2, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Article } from "@shared/schema";

interface NewsArticleProps {
  article: Article;
  featured?: boolean;
}

export function NewsArticle({ article, featured = false }: NewsArticleProps) {
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/articles/${article.id}/like`);
      return response.json();
    },
    onSuccess: () => {
      setIsLiked(true);
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      toast({
        title: "Article liked!",
        description: "Thanks for your feedback.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like article. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    if (!isLiked) {
      likeMutation.mutate();
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: article.title,
        text: article.summary || article.title,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Article link copied to clipboard.",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'nfl': return 'bg-tsn-blue text-white';
      case 'nba': return 'bg-orange-100 text-orange-800';
      case 'mlb': return 'bg-green-100 text-green-800';
      case 'nhl': return 'bg-purple-100 text-purple-800';
      case 'soccer': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const timeAgo = (date: Date | string) => {
    const now = new Date();
    const publishedDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <Card className="overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
      {article.imageUrl && (
        <img 
          src={article.imageUrl} 
          alt={article.title}
          className={`w-full object-cover ${featured ? 'h-64 sm:h-80' : 'h-48'}`}
        />
      )}
      <CardContent className={featured ? 'p-6' : 'p-4'}>
        <div className="flex items-center space-x-2 mb-3">
          <Badge className={getCategoryColor(article.category)}>
            {article.category}
          </Badge>
          {article.summary && (
            <Badge variant="outline" className="text-green-600 border-green-200">
              <Zap className="h-3 w-3 mr-1" />
              AI SUMMARY
            </Badge>
          )}
          {article.isBreaking && (
            <Badge className="bg-red-600 text-white animate-pulse">
              BREAKING
            </Badge>
          )}
          <div className="flex items-center text-gray-500 text-sm">
            <Clock className="h-3 w-3 mr-1" />
            {timeAgo(article.publishedAt)}
          </div>
        </div>
        
        <h2 className={`font-bold text-gray-900 mb-3 ${featured ? 'text-2xl' : 'text-lg'}`}>
          {article.title}
        </h2>
        
        {article.summary && (
          <p className={`text-gray-600 mb-4 leading-relaxed ${featured ? 'text-base' : 'text-sm'}`}>
            {article.summary}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center space-x-2 ${isLiked ? 'text-red-600' : 'text-gray-600'}`}
              disabled={likeMutation.isPending}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{(article.likes || 0) + (isLiked ? 1 : 0)}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-600">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">Comments</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-600"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-sm">Share</span>
            </Button>
          </div>
          
          {featured && (
            <Button className="bg-tsn-blue hover:bg-blue-700">
              Read Full Story
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
