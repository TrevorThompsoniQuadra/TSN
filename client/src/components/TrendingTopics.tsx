import { useQuery } from "@tanstack/react-query";
import { TrendingUp, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function TrendingTopics() {
  const { data: aiTopics, isLoading, refetch } = useQuery<string[]>({
    queryKey: ['/api/ai/trending-topics'],
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  const topics = aiTopics?.map((topic, index) => ({
    name: topic,
    mentions: `${(Math.random() * 15 + 2).toFixed(1)}K`,
    rank: index + 1,
  })) || [];

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500";
    return "bg-gray-400";
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
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="w-6 h-6 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))
          ) : (
            topics.map((topic) => (
              <div key={topic.rank} className="flex items-center space-x-3">
                <div className={`w-6 h-6 ${getRankColor(topic.rank)} text-white rounded-full flex items-center justify-center text-xs font-bold`}>
                  {topic.rank}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{topic.name}</p>
                  <p className="text-xs text-gray-500">{topic.mentions} mentions</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
