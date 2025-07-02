import { Bot, TrendingUp, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

interface Prediction {
  id: number;
  title: string;
  prediction: string;
  confidence: number;
  sport: string;
  teams: string[];
  updatedAt: string;
}

export function AIPredictions() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: predictions = [], isLoading, refetch } = useQuery<Prediction[]>({
    queryKey: ['/api/ai/predictions'],
    queryFn: async () => {
      const response = await fetch('/api/ai/predictions');
      if (!response.ok) throw new Error('Failed to fetch AI predictions');
      return response.json();
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    refetchInterval: 1000 * 60 * 15, // Auto-refresh every 15 minutes
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-tsn-blue" />
            <span>AI Predictions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-gray-100 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-tsn-blue" />
            <span>AI Predictions</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {predictions.map((prediction) => (
            <div
              key={prediction.id}
              className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{prediction.title}</span>
                  <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                    {prediction.sport}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-xs">
                  {prediction.confidence}% confidence
                </Badge>
              </div>
              
              <p className="text-sm text-gray-700 mb-2">{prediction.prediction}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {prediction.teams?.map((team, index) => (
                    <span key={team} className="text-xs font-medium text-gray-600">
                      {team}{index < prediction.teams.length - 1 ? ' vs ' : ''}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-500">Updated {prediction.updatedAt}</span>
              </div>
            </div>
          ))}
        </div>
        
        {predictions.length === 0 && (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No predictions available at the moment.</p>
            <Button variant="outline" onClick={handleRefresh} className="mt-2">
              Generate Predictions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
