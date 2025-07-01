import { useState } from "react";
import { User, Settings, Heart, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

export default function Profile() {
  const { user, firebaseUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [favoriteTeams, setFavoriteTeams] = useState(user?.favoriteTeams || []);

  const handleSave = () => {
    // TODO: Update user profile
    setIsEditing(false);
  };

  const recentActivity = [
    { type: 'like', article: 'Championship Playoffs Heat Up', time: '2 hours ago' },
    { type: 'comment', article: 'Rookie Sensation Breaks Record', time: '1 day ago' },
    { type: 'like', article: 'World Series Predictions', time: '2 days ago' },
  ];

  if (!firebaseUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">Please sign in to view your profile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={firebaseUser.photoURL || undefined} />
                <AvatarFallback className="text-2xl">
                  {firebaseUser.displayName?.[0] || firebaseUser.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {firebaseUser.displayName || 'User'}
                </h1>
                <p className="text-gray-600">{firebaseUser.email}</p>
                <p className="text-sm text-gray-500">
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                </p>
              </div>
              <Button 
                onClick={() => setIsEditing(!isEditing)}
                variant={isEditing ? "default" : "outline"}
              >
                <Settings className="h-4 w-4 mr-2" />
                {isEditing ? 'Save' : 'Edit Profile'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Favorite Teams</CardTitle>
                </CardHeader>
                <CardContent>
                  {favoriteTeams.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {favoriteTeams.map((team) => (
                        <Badge key={team} variant="secondary">
                          {team}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No favorite teams selected</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sports Interests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(user?.favoriteSports || ['NBA', 'NFL']).map((sport) => (
                      <Badge key={sport} variant="outline">
                        {sport}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Your Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Select your favorite teams to get personalized content and notifications.
                </p>
                {/* TODO: Add team selection interface */}
                <Button>Add Teams</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 py-2">
                      {activity.type === 'like' ? (
                        <Heart className="h-4 w-4 text-red-500" />
                      ) : (
                        <MessageCircle className="h-4 w-4 text-blue-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {activity.type === 'like' ? 'Liked' : 'Commented on'} "{activity.article}"
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={firebaseUser.email || ''}
                    disabled
                  />
                </div>
                {isEditing && (
                  <Button onClick={handleSave}>Save Changes</Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
