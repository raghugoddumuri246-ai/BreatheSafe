import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./context/AuthContext";
import { HistoryProvider } from "./context/HistoryContext";
import { useTheme } from "./context/ThemeContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import LiveAQIPage from "./pages/LiveAQIPage";
import ForecastingPage from "./pages/ForecastingPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AboutPage from "./pages/AboutPage";
import RespiratoryIssuesForm from "./pages/RespiratoryIssuesForm"; // See below
import HealthAdvisoryDetails from "./pages/HealthReportDetail";
import DiseaseInfoPage from "./pages/AwarenessPage";
import ChatBot from "./context/ChatBot";

function App() {
  const location = useLocation();
  const background = location.state && location.state.background;
  const { isDarkMode } = useTheme();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Check if current route is dashboard
  const isDashboard = location.pathname === "/dashboard";

  return (
    <>
      <ChatBot />
      <AuthProvider>
        <HistoryProvider>
          <div className="flex flex-col min-h-screen transition-colors duration-300 bg-gray-50 dark:bg-dark-900">
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme={isDarkMode ? "dark" : "light"}
              style={{ zIndex: 19999 }}
              toastStyle={{
                background: isDarkMode ? "#23263A" : "#fff",
                color: isDarkMode ? "#fff" : "#000",
                boxShadow: isDarkMode
                  ? "0 4px 12px rgba(0, 0, 0, 0.3)"
                  : "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            />
            {!isDashboard && <Navbar />}

            <main className="flex-grow">
              <AnimatePresence mode="wait">
                <Routes
                  location={background || location}
                  key={(background || location).pathname}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/disease-info" element={<DiseaseInfoPage />} />
                  <Route path="/live-aqi" element={<LiveAQIPage />} />
                  <Route path="/forecasting" element={<ForecastingPage />} />
                  <Route
                    path="/form-input"
                    element={<RespiratoryIssuesForm />}
                  />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route
                    path="/advisory-details"
                    element={<HealthAdvisoryDetails />}
                  />
                  <Route
                    path="/health-reports/:id"
                    element={<HealthAdvisoryDetails />}
                  />
                </Routes>
              </AnimatePresence>

              {/* Modal routes rendered outside AnimatePresence/Routes */}
              {background && (
                <>
                  {location.pathname === "/login" && <LoginPage />}
                  {location.pathname === "/signup" && <SignupPage />}
                </>
              )}
            </main>
            {!isDashboard && <Footer />}
          </div>
        </HistoryProvider>
      </AuthProvider>
    </>
  );
}

export default App;
