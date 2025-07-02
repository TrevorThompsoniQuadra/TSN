import { useQuery } from "@tanstack/react-query";
import { TrendingUp, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendingTopic {
  title: string;
  description: string;
  category: string;
  tags: string[];
}

export function TrendingTopics() {
  const { data: trendingTopics, isLoading, refetch } = useQuery<TrendingTopic[]>({
    queryKey: ['/api/ai/trending-topics'],
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  const topics = trendingTopics || [];

  const getCategoryColor = (category: string) => {
    const colors = {
      'NBA': 'bg-orange-500',
      'NFL': 'bg-green-600', 
      'MLB': 'bg-blue-600',
      'NHL': 'bg-red-600',
      'Soccer': 'bg-purple-600',
      default: 'bg-gray-600'
    };
    return colors[category as keyof typeof colors] || colors.default;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            <span>Trending Now</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))
          ) : (
            topics.map((topic, index) => (
              <div key={index} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight hover:text-blue-600 cursor-pointer">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {topic.description}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant="secondary" 
                      className={`${getCategoryColor(topic.category)} text-white text-xs px-2 py-1`}
                    >
                      {topic.category}
                    </Badge>
                    {topic.tags?.slice(0, 2).map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
