import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TrendingTopics() {
  const topics = [
    { name: "Championship Trade Rumors", mentions: "12.4K", rank: 1 },
    { name: "Rookie Record Breaking", mentions: "8.7K", rank: 2 },
    { name: "Draft Lottery Results", mentions: "6.2K", rank: 3 },
    { name: "Coaching Changes", mentions: "4.1K", rank: 4 },
    { name: "Stadium Renovations", mentions: "2.8K", rank: 5 },
  ];

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-500";
    return "bg-gray-400";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-orange-500" />
          <span>Trending Now</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topics.map((topic) => (
            <div key={topic.rank} className="flex items-center space-x-3">
              <div className={`w-6 h-6 ${getRankColor(topic.rank)} text-white rounded-full flex items-center justify-center text-xs font-bold`}>
                {topic.rank}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{topic.name}</p>
                <p className="text-xs text-gray-500">{topic.mentions} mentions</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
