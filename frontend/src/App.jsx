import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { getMe } from "./api/api";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import OnboardingProfile from "./pages/OnboardingProfile";
import OnboardingTelegram from "./pages/OnboardingTelegram";
import Dashboard from "./pages/Dashboard";
import Opportunities from "./pages/Opportunities";
import OpportunityDetails from "./pages/OpportunityDetails";
import Eligible from "./pages/Eligible";
import Deadlines from "./pages/Deadlines";
import Matches from "./pages/Matches";
import Profile from "./pages/Profile";

function ProtectedLayout({ children, user, userSynced, onLogout }) {
  const location = useLocation();
  const path = location.pathname;

  if (!user || !localStorage.getItem("token")) {
    return <Navigate to="/login" replace />;
  }

  if (!userSynced) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-textSecondary">Loading...</p>
      </div>
    );
  }

  // Force onboarding flow: resume then Telegram
  const isOnboardingProfile = path === "/onboarding/profile";
  const isOnboardingTelegram = path === "/onboarding/telegram";
  if (!isOnboardingProfile && !isOnboardingTelegram) {
    if (!user.profile_created) return <Navigate to="/onboarding/profile" replace />;
    if (!user.telegram_connected) return <Navigate to="/onboarding/telegram" replace />;
  }
  if (isOnboardingTelegram && !user.profile_created) {
    return <Navigate to="/onboarding/profile" replace />;
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar user={user} onLogout={onLogout} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [userSynced, setUserSynced] = useState(() => !localStorage.getItem("token"));

  // Refetch user from backend when we have a token (after refresh or on another device) so skills/eligibility stay in sync
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUserSynced(true);
      return;
    }
    getMe()
      .then((user) => {
        setAuth(user);
        localStorage.setItem("user", JSON.stringify(user));
        setUserSynced(true);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setAuth(null);
        setUserSynced(true);
      });
  }, []);

  const handleAuthSuccess = (data) => {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setAuth(data.user);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth(null);
  };

  const updateUser = (patch) => {
    setAuth((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <Login onAuthSuccess={handleAuthSuccess} isAuthenticated={!!auth} />
          }
        />
        <Route
          path="/register"
          element={
            <Register
              onAuthSuccess={handleAuthSuccess}
              isAuthenticated={!!auth}
            />
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedLayout user={auth} userSynced={userSynced} onLogout={handleLogout}>
              <Onboarding />
            </ProtectedLayout>
          }
        />
        <Route
          path="/onboarding/profile"
          element={
            <ProtectedLayout user={auth} userSynced={userSynced} onLogout={handleLogout}>
              <OnboardingProfile user={auth} onUserUpdate={updateUser} />
            </ProtectedLayout>
          }
        />
        <Route
          path="/onboarding/telegram"
          element={
            <ProtectedLayout user={auth} userSynced={userSynced} onLogout={handleLogout}>
              <OnboardingTelegram user={auth} onUserUpdate={updateUser} />
            </ProtectedLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedLayout user={auth} userSynced={userSynced} onLogout={handleLogout}>
              <Profile user={auth} />
            </ProtectedLayout>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout user={auth} userSynced={userSynced} onLogout={handleLogout}>
              <Dashboard user={auth} />
            </ProtectedLayout>
          }
        />
        <Route
          path="/opportunities"
          element={
            <ProtectedLayout user={auth} userSynced={userSynced} onLogout={handleLogout}>
              <Opportunities />
            </ProtectedLayout>
          }
        />
        <Route
          path="/opportunity/:id"
          element={
            <ProtectedLayout user={auth} userSynced={userSynced} onLogout={handleLogout}>
              <OpportunityDetails />
            </ProtectedLayout>
          }
        />
        <Route
          path="/eligible"
          element={
            <ProtectedLayout user={auth} userSynced={userSynced} onLogout={handleLogout}>
              <Eligible user={auth} />
            </ProtectedLayout>
          }
        />
        <Route
          path="/deadlines"
          element={
            <ProtectedLayout user={auth} userSynced={userSynced} onLogout={handleLogout}>
              <Deadlines />
            </ProtectedLayout>
          }
        />
        <Route
          path="/matches"
          element={
            <ProtectedLayout user={auth} userSynced={userSynced} onLogout={handleLogout}>
              <Matches user={auth} />
            </ProtectedLayout>
          }
        />
        <Route
          path="/"
          element={
            auth ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

