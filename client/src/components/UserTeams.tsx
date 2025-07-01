import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

export function UserTeams() {
  const { user } = useAuth();
  const [teams, setTeams] = useState(user?.favoriteTeams || ['Lakers', 'Cowboys']);

  const getTeamColor = (team: string) => {
    const colors = {
      'Lakers': 'bg-purple-600',
      'Cowboys': 'bg-blue-600',
      'Celtics': 'bg-green-600',
      'Warriors': 'bg-yellow-500',
    };
    return colors[team as keyof typeof colors] || 'bg-gray-600';
  };

  const removeTeam = (teamToRemove: string) => {
    setTeams(teams.filter(team => team !== teamToRemove));
    // TODO: Update user preferences in database
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Teams</CardTitle>
      </CardHeader>
      <CardContent>
        {teams.length > 0 ? (
          <div className="space-y-3">
            {teams.map((team) => (
              <div key={team} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${getTeamColor(team)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                    {team.slice(0, 3).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900">{team}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTeam(team)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            <p className="text-sm">No teams followed yet</p>
            <p className="text-xs">Add your favorite teams to get personalized content</p>
          </div>
        )}
        
        <Button 
          variant="outline" 
          className="w-full mt-4 text-tsn-blue border-tsn-blue hover:bg-tsn-blue hover:text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Teams
        </Button>
      </CardContent>
    </Card>
  );
}
