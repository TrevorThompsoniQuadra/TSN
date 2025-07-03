import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Home from "@/pages/Home";
import Scores from "@/pages/Scores";
import News from "@/pages/News";
import Favorites from "@/pages/Favorites";
import Login from "@/pages/Login";
import Profile from "@/pages/Profile";
import { TeamPage } from "@/pages/TeamPage";
import { SportPage } from "@/pages/SportPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/scores" component={Scores} />
      <Route path="/news" component={News} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/login" component={Login} />
      <Route path="/profile" component={Profile} />
      <Route path="/team/:teamName">
        {params => <TeamPage teamName={params.teamName} />}
      </Route>
      <Route path="/nba">
        <SportPage sport="nba" />
      </Route>
      <Route path="/nfl">
        <SportPage sport="nfl" />
      </Route>
      <Route path="/mlb">
        <SportPage sport="mlb" />
      </Route>
      <Route path="/ncaam">
        <SportPage sport="ncaam" />
      </Route>
      <Route path="/cfb">
        <SportPage sport="cfb" />
      </Route>
      <Route path="/pga">
        <SportPage sport="pga" />
      </Route>
      <Route path="/liv">
        <SportPage sport="liv" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <Router />
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
