import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Router, Route, Switch } from "wouter";
import Layout from "./components/Layout";
import PageLoader from "./components/PageLoader";
import RouteMonitor from "./components/RouteMonitor";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load all page components for code splitting
const LoginPage = lazy(() => import("./pages/LoginPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const PhysiciansPage = lazy(() => import("./pages/PhysiciansPage"));
const NewPhysicianPage = lazy(() => import("./pages/NewPhysicianPage"));
const PhysicianProfilePage = lazy(() => import("./pages/PhysicianProfilePage"));
const EditPhysicianPage = lazy(() => import("./pages/EditPhysicianPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const DemographicsPage = lazy(() => import("./pages/DemographicsPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PracticePage = lazy(() => import("./pages/PracticePage"));
const LicensurePage = lazy(() => import("./pages/LicensurePage"));
const EducationPage = lazy(() => import("./pages/EducationPage"));
const WorkHistoryPage = lazy(() => import("./pages/WorkHistoryPage"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PhysicianDocumentsPage = lazy(() => import("./pages/PhysicianDocumentsPage"));


const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <RouteMonitor>
              <Suspense fallback={<PageLoader />}>
                <Switch>
                  {/* Login page without Layout wrapper and without protection */}
                  <Route path="/login" component={LoginPage} />
                  
                  {/* All other pages with Layout wrapper and route protection */}
                  <Route>
                    {() => (
                      <ProtectedRoute>
                        <Layout>
                          <Suspense fallback={<PageLoader />}>
                            <Switch>
                              <Route path="/" component={Dashboard} />
                              <Route path="/physicians" component={PhysiciansPage} />
                              <Route path="/physicians/new" component={NewPhysicianPage} />
                              <Route path="/physicians/:id" component={PhysicianProfilePage} />
                              <Route path="/physicians/:id/edit" component={EditPhysicianPage} />
                              <Route path="/physicians/:id/documents" component={PhysicianDocumentsPage} />
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
                          </Suspense>
                        </Layout>
                      </ProtectedRoute>
                    )}
                  </Route>
                </Switch>
              </Suspense>
            </RouteMonitor>
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;