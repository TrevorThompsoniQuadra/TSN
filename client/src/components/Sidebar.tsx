import { LiveScores } from "./LiveScores";
import { UserTeams } from "./UserTeams";
import { AIPredictions } from "./AIPredictions";
import { TrendingTopics } from "./TrendingTopics";
import { QuickPoll } from "./QuickPoll";

export function Sidebar() {
  return (
    <aside className="lg:col-span-4 space-y-6">
      <LiveScores />
      <UserTeams />
      <AIPredictions />
      <TrendingTopics />
      <QuickPoll />
    </aside>
  );
}
