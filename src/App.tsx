import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Router, Route, Switch } from "wouter";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import PhysiciansPage from "./pages/PhysiciansPage";
import NewPhysicianPage from "./pages/NewPhysicianPage";
import SearchPage from "./pages/SearchPage";
import NotFound from "./pages/NotFound";


const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/physicians" component={PhysiciansPage} />
            <Route path="/physicians/new" component={NewPhysicianPage} />
            <Route path="/search" component={SearchPage} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
