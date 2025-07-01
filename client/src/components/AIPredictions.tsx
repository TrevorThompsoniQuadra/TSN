import { Bot, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AIPredictions() {
  const predictions = [
    {
      id: 1,
      title: "Tonight's Game",
      prediction: "Lakers likely to win by 6-8 points based on recent performance and injury reports.",
      confidence: 87,
      updatedAt: "1 hour ago",
    },
    {
      id: 2,
      title: "MLB Playoffs",
      prediction: "Dodgers favored to advance to World Series despite tough competition.",
      confidence: 72,
      updatedAt: "3 hours ago",
    },
  ];

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
          {predictions.map((prediction) => (
            <div
              key={prediction.id}
              className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{prediction.title}</span>
                <Badge variant="outline" className="text-xs">
                  {prediction.confidence}% confidence
                </Badge>
              </div>
              
              <p className="text-sm text-gray-700 mb-2">{prediction.prediction}</p>
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="text-xs text-tsn-blue p-0 h-auto">
                  Details
                </Button>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">Updated {prediction.updatedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
