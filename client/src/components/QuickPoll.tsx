import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function QuickPoll() {
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const poll = {
    question: "Who will win tonight's championship game?",
    options: [
      { text: "Los Angeles Lakers", votes: 64 },
      { text: "Boston Celtics", votes: 36 },
    ],
    totalVotes: 2847,
    expiresIn: "2 hours",
  };

  const handleVote = (optionIndex: number) => {
    if (!hasVoted) {
      setSelectedOption(optionIndex);
      setHasVoted(true);
      // TODO: Submit vote to API
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Poll</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900 mb-3">{poll.question}</p>
          
          <div className="space-y-2">
            {poll.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className={`w-full p-3 h-auto text-left ${
                  selectedOption === index ? 'border-tsn-blue bg-blue-50' : ''
                }`}
                onClick={() => handleVote(index)}
                disabled={hasVoted}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-medium">{option.text}</span>
                  <span className="text-sm text-gray-500">{option.votes}%</span>
                </div>
                <Progress 
                  value={option.votes} 
                  className="mt-1 h-2" 
                />
              </Button>
            ))}
          </div>
          
          <p className="text-xs text-gray-500 mt-3">
            {poll.totalVotes.toLocaleString()} votes • Poll ends in {poll.expiresIn}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
