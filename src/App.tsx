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
import DemographicsPage from "./pages/DemographicsPage";
import ContactPage from "./pages/ContactPage";
import PracticePage from "./pages/PracticePage";
import LicensurePage from "./pages/LicensurePage";
import EducationPage from "./pages/EducationPage";
import WorkHistoryPage from "./pages/WorkHistoryPage";
import DocumentsPage from "./pages/DocumentsPage";
import SettingsPage from "./pages/SettingsPage";
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
            <Route path="/demographics" component={DemographicsPage} />
            <Route path="/contact" component={ContactPage} />
            <Route path="/practice" component={PracticePage} />
            <Route path="/licensure" component={LicensurePage} />
            <Route path="/education" component={EducationPage} />
            <Route path="/work-history" component={WorkHistoryPage} />
            <Route path="/documents" component={DocumentsPage} />
            <Route path="/settings" component={SettingsPage} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
