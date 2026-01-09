import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FiHome,
  FiActivity,
  FiClock,
  FiSettings,
  FiUser,
  FiDownload,
  FiAlertTriangle,
  FiCloud,
  FiMenu,
  FiSun,
  FiMoon,
  FiLogOut,
  FiTrash2,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useHistory } from "../context/HistoryContext";
import { toast } from "react-toastify";

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [aqiHistory, setAqiHistory] = useState([]);
  const [aqiCount, setAqiCount] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [healthReportsCount, setHealthReportsCount] = useState(0);
  const [isLoadingHealthReports, setIsLoadingHealthReports] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { history, deleteHistoryEntry } = useHistory();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    location: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch alerts count
  const fetchAlertCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setAlertCount(0);
        return;
      }

      setIsLoadingAlerts(true);
      const response = await fetch(
        "http://localhost:5000/api/alerts/my-alerts",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid or expired
          logout();
          navigate("/login");
          return;
        }
        throw new Error("Failed to fetch alerts");
      }

      const data = await response.json();
      if (data.success && data.alerts) {
        setAlertCount(data.alerts.length);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error("Failed to fetch alert count");
      setAlertCount(0);
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  // Fetch AQI history
  const fetchAQIHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      setIsLoadingHistory(true);
      const response = await fetch(
        "http://localhost:5000/api/aqi-tracker/history",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        throw new Error("Failed to fetch AQI history");
      }

      const data = await response.json();
      setAqiHistory(data);
    } catch (error) {
      console.error("Error fetching AQI history:", error);
      toast.error("Failed to fetch AQI history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Fetch AQI count
  const fetchAQICount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        "http://localhost:5000/api/aqi-tracker/count",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        throw new Error("Failed to fetch AQI count");
      }

      const data = await response.json();
      setAqiCount(data.count);
    } catch (error) {
      console.error("Error fetching AQI count:", error);
      toast.error("Failed to fetch AQI count");
    }
  };

  // Add this new function to fetch user data
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:5000/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();
      if (data.success && data.user) {
        // Update settings with latest user data
        setSettings({
          fullName: data.user.fullName || "",
          email: data.user.email || "",
          password: "",
          phone: data.user.phone || "",
          location: data.user.location || "",
        });

        // Update user in localStorage
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to fetch user data");
    }
  };

  // Add function to fetch total users
  const fetchTotalUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setTotalUsers(0);
        return;
      }

      setIsLoadingUsers(true);
      const response = await fetch(
        "http://localhost:5000/api/auth/total-users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        throw new Error("Failed to fetch total users");
      }

      const data = await response.json();
      if (data.success) {
        setTotalUsers(data.count);
      }
    } catch (error) {
      console.error("Error fetching total users:", error);
      toast.error("Failed to fetch total users count");
      setTotalUsers(0);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Add function to fetch health reports count
  const fetchHealthReportsCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setHealthReportsCount(0);
        return;
      }

      setIsLoadingHealthReports(true);
      const response = await fetch(
        "http://localhost:5000/api/health-report/count",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        throw new Error("Failed to fetch health reports count");
      }

      const data = await response.json();
      if (data.success) {
        setHealthReportsCount(data.count || 0);
      } else {
        throw new Error(data.message || "Failed to fetch health reports count");
      }
    } catch (error) {
      console.error("Error fetching health reports count:", error);
      toast.error("Failed to fetch health reports count");
      setHealthReportsCount(0);
    } finally {
      setIsLoadingHealthReports(false);
    }
  };

  // Update useEffect to include fetchHealthReportsCount
  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchAlertCount();
      fetchAQIHistory();
      fetchAQICount();
      fetchTotalUsers();
      fetchHealthReportsCount();
    }
  }, [user]);

  // Refresh alert count every 5 minutes
  useEffect(() => {
    if (user) {
      const intervalId = setInterval(fetchAlertCount, 5 * 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [user]);

  // Mock data for charts
  const chartData = {
    weeklyTrends: [
      { name: "Mon", aqi: 42 },
      { name: "Tue", aqi: 55 },
      { name: "Wed", aqi: 38 },
      { name: "Thu", aqi: 45 },
      { name: "Fri", aqi: 60 },
      { name: "Sat", aqi: 70 },
      { name: "Sun", aqi: 45 },
    ],
    pollutantBreakdown: [
      { name: "PM2.5", value: 35 },
      { name: "PM10", value: 25 },
      { name: "O₃", value: 20 },
      { name: "NO₂", value: 10 },
      { name: "SO₂", value: 5 },
      { name: "CO", value: 5 },
    ],
  };

  const SidebarLogo = (
    <Link
      to="/"
      className="flex items-center gap-2 text-2xl font-bold text-primary-600 dark:text-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
      tabIndex={0}
      style={{ pointerEvents: "auto", zIndex: 50 }}>
      BreatheSafe
    </Link>
  );

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to delete history");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/aqi-tracker/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete history entry");
      }

      // Refresh the history and count after deletion
      fetchAQIHistory();
      fetchAQICount();
      toast.success("History entry deleted successfully");
    } catch (error) {
      console.error("Error deleting history entry:", error);
      toast.error("Failed to delete history entry");
    }
  };

  const handleDeleteAllHistory = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete all history records? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to delete history");
        navigate("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/aqi-tracker/delete-all",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete history");
      }

      if (data.success) {
        toast.success(
          `Successfully deleted ${data.deletedCount || "all"} history records`
        );
        setAqiHistory([]);
        fetchAQICount();
        // Refresh the history data
        fetchAQIHistory();
      } else {
        throw new Error(data.message || "Failed to delete history");
      }
    } catch (error) {
      console.error("Error deleting history:", error);
      toast.error(error.message || "Failed to delete history");
    }
  };

  const stats = [
    {
      label: "Active Users",
      value: isLoadingUsers ? "..." : totalUsers.toString(),
      icon: <FiUser className="text-green-400" />,
    },
    {
      label: "Alert Notifications",
      value: isLoadingAlerts ? "..." : alertCount.toString(),
      icon: <FiAlertTriangle className="text-yellow-500" />,
    },
    {
      label: "AQI Searches",
      value: aqiCount.toString(),
      icon: <FiCloud className="text-blue-400" />,
    },
    {
      label: "Health Reports",
      value: isLoadingHealthReports ? "..." : healthReportsCount.toString(),
      icon: <FiDownload className="text-purple-400" />,
    },
  ];

  function getStatusBadgeClasses(status) {
    switch (status) {
      case "Good":
        return "bg-green-100 text-green-800";
      case "Moderate":
        return "bg-amber-100 text-amber-900";
      case "Unhealthy":
        return "bg-red-200 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  const COLORS = [
    "#6366F1",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  const getCardBg = (isDarkMode) =>
    isDarkMode ? "bg-[#23263A] text-white" : "bg-white text-gray-900";

  const getTooltipStyle = (isDarkMode) => ({
    backgroundColor: isDarkMode ? "#23263A" : "#fff", // Use backgroundColor for Recharts
    color: isDarkMode ? "#fff" : "#23263A",
    border: isDarkMode ? "1px solid #444" : "1px solid #ddd",
    borderRadius: "8px",
    fontWeight: 500,
    boxShadow: isDarkMode
      ? "0 4px 16px 0 rgba(0,0,0,0.32)"
      : "0 4px 16px 0 rgba(0,0,0,0.08)",
  });

  const sidebarNav = [
    {
      id: "overview",
      label: "Dashboard",
      icon: <FiHome className="w-6 h-6" />,
    },
    {
      id: "activity",
      label: "Activity",
      icon: <FiActivity className="w-6 h-6" />,
    },
    { id: "history", label: "History", icon: <FiClock className="w-6 h-6" /> },
    {
      id: "settings",
      label: "Settings",
      icon: <FiSettings className="w-6 h-6" />,
    },
  ];

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        "http://localhost:5000/api/auth/update-profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({
            fullName: settings.fullName,
            email: settings.email,
            phone: settings.phone,
            location: settings.location,
            ...(settings.password && { password: settings.password }),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();

      if (data.success) {
        // Fetch updated user data
        await fetchUserData();

        // Clear password field
        setSettings((prev) => ({
          ...prev,
          password: "",
        }));

        toast.success("Profile updated successfully!");
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Settings update error:", error);
      toast.error(error.message || "Failed to update settings");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetSettings = () => {
    setSettings({
      fullName: "",
      email: "",
      password: "",
      phone: "",
      location: "",
    });
    toast.success("Form fields cleared");
  };

  const renderHistory = () => {
    if (isLoadingHistory) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 rounded-full border-primary-500 border-t-transparent animate-spin"></div>
        </div>
      );
    }

    if (aqiHistory.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center h-64 text-gray-500">
          <FiClock className="w-12 h-12 mb-4" />
          <p>No AQI search history found</p>
        </motion.div>
      );
    }

    return (
      <div className="w-full">
        {/* Desktop Table View */}
        <div className="hidden md:block w-full overflow-x-auto">
          <motion.table
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full min-w-[700px] table-auto rounded-xl overflow-hidden shadow-lg bg-white dark:bg-slate-800">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700">
                <th className="w-1/4 py-4 pl-6 pr-4 text-gray-800 dark:text-gray-100">
                  Date & Time
                </th>
                <th className="w-1/4 py-4 pr-4 text-gray-800 dark:text-gray-100">
                  Location
                </th>
                <th className="w-1/6 py-4 pr-4 text-gray-800 dark:text-gray-100">
                  AQI
                </th>
                <th className="w-1/4 py-4 pr-4 text-gray-800 dark:text-gray-100">
                  Status
                </th>
                <th className="w-1/6 py-4 text-gray-800 dark:text-gray-100">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {aqiHistory.map((entry, index) => (
                <motion.tr
                  key={entry._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="py-4 pl-6 pr-4 text-gray-700 dark:text-gray-300">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="py-4 pr-4 text-gray-700 dark:text-gray-300">
                    {entry.city}
                  </td>
                  <td className="py-4 pr-4 text-gray-700 dark:text-gray-300">
                    {entry.aqi}
                  </td>
                  <td className="py-4 pr-4">
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClasses(
                        entry.status
                      )}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(entry._id)}
                      className="p-2 text-gray-500 transition-colors rounded-full hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20">
                      <FiTrash2 className="w-5 h-5" />
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </motion.table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {aqiHistory.map((entry, index) => (
            <motion.div
              key={entry._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-4 bg-white rounded-xl shadow-lg dark:bg-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDelete(entry._id)}
                  className="p-2 text-gray-500 transition-colors rounded-full hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20">
                  <FiTrash2 className="w-5 h-5" />
                </motion.button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">
                    Location:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {entry.city}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">AQI:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {entry.aqi}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">
                    Status:
                  </span>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClasses(
                      entry.status
                    )}`}>
                    {entry.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  className={`rounded-3xl shadow-lg p-6 flex flex-col gap-2 hover:shadow-xl transition-shadow ${getCardBg(
                    isDarkMode
                  )}`}
                  whileHover={{ y: -5 }}>
                  <div className="flex items-center justify-center w-12 h-12 mb-2 text-2xl text-white rounded-2xl bg-white/10 backdrop-blur-sm">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Main Graphs */}
            <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
              {/* Weekly AQI Trend */}
              <motion.div
                className={`col-span-2 rounded-3xl p-6 shadow-lg ${getCardBg(
                  isDarkMode
                )}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}>
                <motion.h2
                  className="mb-4 text-lg font-semibold"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: 0.2 }}>
                  Weekly AQI Trend
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: 0.3 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData.weeklyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#23263A" />
                      <XAxis dataKey="name" stroke="#aaa" />
                      <YAxis stroke="#aaa" />
                      <Tooltip contentStyle={getTooltipStyle(isDarkMode)} />
                      <Line
                        type="monotone"
                        dataKey="aqi"
                        stroke="#7C3AED"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#fff" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </motion.div>
              </motion.div>

              {/* Pollutant Breakdown */}
              <div
                className={`rounded-3xl p-6 shadow-lg ${getCardBg(
                  isDarkMode
                )}`}>
                <h2 className="mb-4 text-lg font-semibold">
                  Pollutant Breakdown
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData.pollutantBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }>
                      {chartData.pollutantBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={getTooltipStyle(isDarkMode)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        );
      case "activity":
        return (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <motion.div
              className={`rounded-3xl p-6 shadow-lg ${getCardBg(isDarkMode)}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}>
              <motion.h2
                className="mb-4 text-xl font-semibold"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.2 }}>
                Weekly AQI Trend
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.3 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#23263A" />
                    <XAxis dataKey="name" stroke="#aaa" />
                    <YAxis stroke="#aaa" />
                    <Tooltip contentStyle={getTooltipStyle(isDarkMode)} />
                    <Line
                      type="monotone"
                      dataKey="aqi"
                      stroke="#7C3AED"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#fff" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            </motion.div>
            <div
              className={`rounded-3xl p-6 shadow-lg ${getCardBg(isDarkMode)}`}>
              <h2 className="mb-4 text-xl font-semibold">
                Pollutant Breakdown
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.pollutantBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }>
                    {chartData.pollutantBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={getTooltipStyle(isDarkMode)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case "history":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                AQI Search History
              </h2>
              {aqiHistory.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeleteAllHistory}
                  className="px-4 py-2 font-semibold text-white transition-all bg-danger-500 rounded-lg hover:bg-danger-600 focus:outline-none focus:ring-2 focus:ring-danger-400 focus:ring-offset-2">
                  Delete All
                </motion.button>
              )}
            </div>
            {renderHistory()}
          </motion.div>
        );
      case "settings":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`rounded-3xl p-8 shadow-lg ${getCardBg(isDarkMode)}`}>
            <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
              Profile Settings
            </h2>
            <form className="space-y-8" onSubmit={handleSettingsSubmit}>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name
                  </label>
                  <input
                    name="fullName"
                    value={settings.fullName}
                    onChange={handleSettingsChange}
                    className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-lg dark:bg-dark-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Location
                  </label>
                  <input
                    name="location"
                    value={settings.location}
                    onChange={handleSettingsChange}
                    className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-lg dark:bg-dark-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your location"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={settings.email}
                    onChange={handleSettingsChange}
                    className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-lg dark:bg-dark-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone
                  </label>
                  <input
                    name="phone"
                    value={settings.phone}
                    onChange={handleSettingsChange}
                    className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-lg dark:bg-dark-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your phone number"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    New Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={settings.password}
                    onChange={handleSettingsChange}
                    className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 bg-white border border-gray-200 rounded-lg dark:bg-dark-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter new password (leave blank to keep current)"
                    autoComplete="new-password"
                  />
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="flex justify-end gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleResetSettings}
                  className="px-6 py-3 text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                  Clear Fields
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-3 text-white transition-colors rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isUpdating ? "Updating..." : "Save Changes"}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        );
      default:
        return null;
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Logged out successfully!");
  };

  return (
    <div
      className={`min-h-screen flex transition-colors duration-300 ${
        isDarkMode ? "bg-[#1F2128] text-white" : "bg-gray-50 text-gray-900"
      }`}>
      {/* Sidebar for desktop/tablet */}
      <aside
        className={`hidden md:fixed md:inset-y-0 md:left-0 md:z-50 md:flex md:flex-col py-8 px-4 ${
          sidebarMinimized ? "w-20" : "w-64"
        } transition-all duration-300 ease-in-out ${
          isDarkMode ? "bg-[#23263A]" : "bg-white border-r border-gray-200"
        }`}>
        <div className="flex items-center justify-between px-4 mb-10">
          {!sidebarMinimized && (
            <span className="text-lg font-bold text-primary-500">
              <Link to="/">BreatheSafe</Link>
            </span>
          )}
          <button
            onClick={() => setSidebarMinimized(!sidebarMinimized)}
            className={`transition-colors ${
              isDarkMode
                ? "text-gray-400 hover:text-white"
                : "text-gray-400 hover:text-gray-700"
            }`}
            aria-label="Toggle sidebar">
            <FiMenu size={20} />
          </button>
        </div>
        <nav className="flex-1 px-2 mt-10 space-y-4 ">
          {sidebarNav.map((item) => (
            <button
              key={item.id}
              className={`
                    flex items-center gap-2 px-3 py-2 rounded transition
                    ${
                      activeTab === item.id
                        ? isDarkMode
                          ? "text-primary-400 bg-[#23263A]" // dark: colored text + subtle bg
                          : "text-primary-600 bg-transparent" // light: colored text, NO bg
                        : isDarkMode
                        ? "text-gray-300"
                        : "text-gray-600"
                    }
                    hover:text-primary-500
                  `}
              onClick={() => setActiveTab(item.id)}>
              {item.icon}
              {!sidebarMinimized && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div
          className={`mt-auto px-2 pb-8 ${
            sidebarMinimized ? "flex justify-center" : ""
          }`}>
          <button
            className={`
            flex items-center gap-2 p-2 rounded-full transition
            focus:outline-none
            ${
              isDarkMode
                ? "text-gray-300 hover:text-red-500"
                : "text-gray-600 hover:text-red-500"
            }
          `}
            onClick={handleLogout}
            aria-label="Logout">
            <FiLogOut className="w-6 h-6" />
            {!sidebarMinimized && (
              <span className="text-base font-medium">Logout</span>
            )}
          </button>
        </div>
      </aside>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed inset-0 z-50 flex md:hidden`}
            style={{
              background: isDarkMode
                ? "rgba(24,26,32,0.85)"
                : "rgba(0,0,0,0.3)",
            }}
            onClick={() => setSidebarOpen(false)}>
            <div
              className={`w-64 h-full flex flex-col py-8 px-4 ${
                isDarkMode
                  ? "bg-[#1F2128]"
                  : "bg-white border-r border-gray-200"
              }`}
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 mb-10">
                {/* Updated: Logo is now a link */}
                <Link
                  to="/"
                  className="text-lg font-bold text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  tabIndex={0}
                  style={{ pointerEvents: "auto" }}>
                  BreatheSafe
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close sidebar">
                  <FiMenu size={20} />
                </button>
              </div>
              <nav className="flex-1 px-2 space-y-1">
                {sidebarNav.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? "bg-[#23263A] text-white"
                        : "text-gray-400 hover:bg-[#23263A] hover:text-white"
                    }`}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
              <div className="px-2 pb-8 mt-auto">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-gray-400 hover:bg-[#23263A] hover:text-white transition-colors">
                  {isDarkMode ? (
                    <FiSun className="w-6 h-6" />
                  ) : (
                    <FiMoon className="w-6 h-6" />
                  )}
                  <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={`flex-1 px-2 sm:px-4 md:px-10 py-8 min-h-screen ml-0 ${
          sidebarMinimized ? "md:ml-20" : "md:ml-64"
        } transition-all duration-300`}>
        {/* Topbar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-[#23263A]"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar">
              <FiMenu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              <p
                className={`text-sm mt-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}>
                Here's your analytic details
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 ${
                isDarkMode
                  ? "border-primary-500 bg-[#23263A] text-primary-400"
                  : "border-primary-500 bg-white text-primary-600"
              } shadow-sm hover:shadow-md transition-all`}>
              <span className="hidden text-sm font-semibold tracking-wide md:inline">
                {user?.fullName || "User"}
              </span>
              <span className="md:hidden text-sm font-semibold tracking-wide">
                {user?.fullName ? user.fullName[0].toUpperCase() : "U"}
              </span>
            </div>
            <button
              className="p-2 transition rounded-full hover:bg-primary-100 dark:hover:bg-primary-900 hover:scale-110 hover:shadow-lg"
              onClick={toggleTheme}
              aria-label="Toggle theme">
              {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
          </div>
        </div>
        {/* Content Area */}
        <div className="space-y-8">{renderContent()}</div>
      </main>
    </div>
  );
};

export default DashboardPage;
