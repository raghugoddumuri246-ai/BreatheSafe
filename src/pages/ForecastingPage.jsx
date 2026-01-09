import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { FiMapPin, FiSearch } from "react-icons/fi";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useTheme } from "../context/ThemeContext";

// Fix default marker icon for leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ToggleSwitch component (can be moved to its own file if you wish)
function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <span className="text-sm font-medium">{label}</span>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div
          className={`block w-12 h-7 rounded-full transition ${
            checked ? "bg-primary-500" : "bg-gray-300 dark:bg-dark-700"
          }`}></div>
        <div
          className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform duration-200 ${
            checked ? "translate-x-5" : ""
          }`}></div>
      </div>
      <span
        className={`ml-2 text-xs font-semibold ${
          checked ? "text-primary-600" : "text-gray-400"
        }`}>
        {checked ? "Feature ON" : "Feature OFF"}
      </span>
    </label>
  );
}

// AQI Ranges and Consequences
const AQI_RANGES = [
  {
    min: 0,
    max: 50,
    label: "Good",
    color: "text-green-500",
    bg: "bg-green-100 dark:bg-green-900/40",
    border: "border-green-400 dark:border-green-700",
    desc: "Minimal impact on health; air quality is satisfactory.",
  },
  {
    min: 51,
    max: 100,
    label: "Satisfactory",
    color: "text-yellow-500",
    bg: "bg-yellow-100 dark:bg-yellow-900/40",
    border: "border-yellow-400 dark:border-yellow-700",
    desc: "Minor breathing discomfort to sensitive people.",
  },
  {
    min: 101,
    max: 200,
    label: "Moderate",
    color: "text-orange-500",
    bg: "bg-orange-100 dark:bg-orange-900/40",
    border: "border-orange-400 dark:border-orange-700",
    desc: "Breathing discomfort to people with lung, asthma, and heart diseases.",
  },
  {
    min: 201,
    max: 300,
    label: "Poor",
    color: "text-red-500",
    bg: "bg-red-100 dark:bg-red-900/40",
    border: "border-red-400 dark:border-red-700",
    desc: "Can cause significant breathing difficulties in everyone.",
  },
  {
    min: 301,
    max: 500,
    label: "Very Unhealthy/Hazardous",
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/40",
    border: "border-purple-400 dark:border-purple-700",
    desc: "Health warnings are triggered, and everyone should stay indoors and reduce activity levels.",
  },
];

const AQIMap = ({ coordinates, onClick }) => {
  function ClickHandler() {
    useMapEvents({
      click(e) {
        onClick(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  return (
    <MapContainer
      center={[coordinates.latitude, coordinates.longitude]}
      zoom={12}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom
      key={`${coordinates.latitude},${coordinates.longitude}`}>
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[coordinates.latitude, coordinates.longitude]}>
        <Popup>
          Selected Location
          <br />
          Lat: {coordinates.latitude.toFixed(4)}
          <br />
          Lng: {coordinates.longitude.toFixed(4)}
        </Popup>
      </Marker>
      <ClickHandler />
    </MapContainer>
  );
};

const ForecastingPage = () => {
  const { isDarkMode } = useTheme();
  const [coordinates, setCoordinates] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
  });
  const [locationName, setLocationName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [searchError, setSearchError] = useState("");
  const [forecastData, setForecastData] = useState([]);
  const [pincode, setPincode] = useState("");
  const [showPollutants, setShowPollutants] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Function to process forecast data
  const processForecastData = (data) => {
    if (data && data.hourly && data.hourly.us_aqi && data.hourly.time) {
      const now = new Date();
      const currentIndex = data.hourly.time.findIndex(
        (timeStr) => new Date(timeStr) >= now
      );
      const startIndex = currentIndex !== -1 ? currentIndex : 0;

      // Use windowWidth state instead of direct window.innerWidth
      const hoursToShow = windowWidth < 640 ? 12 : 24;

      return data.hourly.time
        .slice(startIndex, startIndex + hoursToShow)
        .map((time, idx) => {
          const realIdx = startIndex + idx;
          const timeDate = new Date(time);
          return {
            hour: timeDate.toLocaleString([], {
              hour: "numeric",
              hour12: true,
            }),
            aqi: data.hourly.us_aqi[realIdx],
            pm2_5: data.hourly.pm2_5?.[realIdx],
            pm10: data.hourly.pm10?.[realIdx],
            co:
              data.hourly.carbon_monoxide?.[realIdx] != null
                ? data.hourly.carbon_monoxide[realIdx] / 1000
                : null,
            no2: data.hourly.nitrogen_dioxide?.[realIdx],
            so2: data.hourly.sulphur_dioxide?.[realIdx],
            o3:
              data.hourly.ozone?.[realIdx] != null
                ? data.hourly.ozone[realIdx] / 2
                : null,
          };
        });
    }
    return [];
  };

  // Fetch forecast AQI and pollutant data
  useEffect(() => {
    async function fetchForecast() {
      setIsLoading(true);
      setSearchError("");
      try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&hourly=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;
        const resp = await fetch(url);
        const data = await resp.json();
        const processedData = processForecastData(data);
        setForecastData(processedData);
      } catch (e) {
        setForecastData([]);
        setSearchError("Failed to fetch AQI forecast data.");
      }
      setIsLoading(false);
    }
    fetchForecast();
  }, [coordinates.latitude, coordinates.longitude, windowWidth]); // Add windowWidth as dependency

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Reverse geocode to get location name and pincode
  useEffect(() => {
    async function fetchLocationDetails() {
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.latitude}&lon=${coordinates.longitude}`
        );
        const data = await resp.json();
        setLocationName(
          data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.state_district ||
            data.address?.state ||
            data.address?.county ||
            data.address?.country ||
            data.display_name ||
            ""
        );
        setPincode(data.address?.postcode || "");
      } catch {
        setLocationName("");
        setPincode("");
      }
    }
    fetchLocationDetails();
  }, [coordinates.latitude, coordinates.longitude]);

  const handleMapClick = (lat, lng) => {
    setCoordinates({ latitude: lat, longitude: lng });
    setLocationName("");
    setPincode("");
  };

  const handleLocationSearch = async (e) => {
    e.preventDefault();
    setSearchError("");
    if (locationSearch.trim()) {
      setIsLoading(true);
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            locationSearch
          )}`
        );
        const data = await resp.json();
        if (data && data.length > 0) {
          setCoordinates({
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
          });
          setLocationName(data[0].display_name);
        } else {
          setSearchError("Location not found.");
          setLocationName("");
        }
      } catch {
        setSearchError("Error searching location.");
        setLocationName("");
      }
      setIsLoading(false);
    }
  };

  // Precise device location
  const handleDetectLocation = () => {
    setIsLoading(true);
    setSearchError("");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const newCoordinates = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };

          try {
            // Get city name from coordinates using Nominatim API
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=10&addressdetails=1`
            );
            const data = await response.json();

            // Extract city name from the response
            const cityName =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.county ||
              "Unknown Location";

            // Update state with coordinates and city name
            setCoordinates(newCoordinates);
            setLocationName(cityName);
            setLocationSearch(cityName); // Set the search input to the city name
          } catch (error) {
            console.error("Error in location detection:", error);
            setSearchError("Failed to get location details. Please try again.");
          } finally {
            setIsLoading(false);
          }
        },
        (err) => {
          if (err.code === 1) {
            setSearchError(
              "Location access denied. Please allow location access in your browser settings for the most accurate air quality data."
            );
          } else if (err.code === 2) {
            setSearchError(
              "Location unavailable. Please ensure your device location is enabled."
            );
          } else if (err.code === 3) {
            setSearchError("Location request timed out. Try again.");
          } else {
            setSearchError("Could not get your location.");
          }
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true, // Use GPS if available
          timeout: 20000,
          maximumAge: 0,
        }
      );
    } else {
      setSearchError("Geolocation is not supported by your browser.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`pt-24 pb-16 min-h-screen transition-colors duration-300 ${
        isDarkMode ? "bg-dark-900" : "bg-gray-50"
      }`}>
      <div className="container-custom">
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}>
          <h1
            className={`heading-md mb-3 pt-10 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}>
            AQI Forecasting
          </h1>
          <p
            className={`max-w-2xl mx-auto ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}>
            View air quality predictions for the next 24 hours based on
            real-time data.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left panel - Map and controls */}
          <motion.div
            className={`lg:col-span-2 card p-4 sm:p-6 h-[600px] flex flex-col ${
              isDarkMode ? "bg-dark-800" : "bg-white"
            } transition-colors duration-300`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="mb-4">
              <form onSubmit={handleLocationSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiSearch className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Search location..."
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 transition
                      ${
                        isDarkMode
                          ? "border-dark-600 bg-dark-700 text-white placeholder-white"
                          : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                      }`}
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 text-white transition-colors rounded-lg bg-primary-500 hover:bg-primary-600">
                  Search
                </button>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDarkMode
                      ? "bg-dark-700 text-gray-300 hover:bg-dark-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  title="Detect Device Location">
                  <FiMapPin className="w-5 h-5" />
                </button>
              </form>
              {searchError && (
                <p className="mt-2 text-sm text-danger-500">{searchError}</p>
              )}
            </div>
            <div className="relative flex-1 mt-4 overflow-hidden rounded-lg">
              <AQIMap coordinates={coordinates} onClick={handleMapClick} />
            </div>
          </motion.div>
          {/* Right panel - Location details and AQI consequences */}
          <motion.div
            className={`lg:col-span-1 space-y-6 card p-6 transition-colors duration-300 ${
              isDarkMode ? "bg-dark-800" : "bg-white"
            }`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}>
            {/* Location Details */}
            <div>
              <h2
                className={`text-lg font-bold mb-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                {locationName || "Location"}
              </h2>
              {pincode && (
                <div
                  className={`text-base font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}>
                  Pincode: {pincode}
                </div>
              )}
              <div
                className={`flex flex-col gap-1 text-base ${
                  isDarkMode ? "text-gray-200" : "text-gray-700"
                }`}>
                <div>
                  <span className="font-medium">Latitude:</span>{" "}
                  {coordinates.latitude.toFixed(4)}
                </div>
                <div>
                  <span className="font-medium">Longitude:</span>{" "}
                  {coordinates.longitude.toFixed(4)}
                </div>
              </div>
            </div>
            {/* AQI Ranges and Consequences */}
            <div className="mt-6">
              <h3
                className={`text-base font-semibold mb-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                AQI Ranges &amp; Consequences
              </h3>
              <div className="space-y-3">
                {AQI_RANGES.map((range) => (
                  <div
                    key={range.label}
                    className={`rounded-lg px-3 py-2 border-l-8 flex flex-col ${range.bg} ${range.border}`}>
                    <span
                      className={`font-bold text-base ${range.color} ${
                        isDarkMode && range.color === "text-gray-900"
                          ? "text-white"
                          : ""
                      }`}>
                      {range.min}-{range.max} ({range.label})
                    </span>
                    <span
                      className={`text-sm ${
                        isDarkMode ? "text-gray-200" : "text-gray-700"
                      } mt-1`}>
                      {range.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
        {/* Modern 24-Hour AQI & Pollutant Trend Chart */}
        <motion.div
          className={`mt-8 card p-4 sm:p-6 rounded-2xl shadow-xl transition-colors duration-300 ${
            isDarkMode ? "bg-dark-800 text-white" : "bg-white text-gray-900"
          }`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.3 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <motion.h2
              className={`text-lg font-semibold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.4 }}>
              24-Hour AQI & Pollutants Trend
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.5 }}>
              <ToggleSwitch
                checked={showPollutants}
                onChange={() => setShowPollutants((v) => !v)}
                label="Show Pollutants"
              />
            </motion.div>
          </div>
          <motion.div
            className="h-[300px] sm:h-[400px] md:h-[500px]"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.6 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={forecastData}
                margin={{
                  top: 20,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDarkMode ? "#374151" : "#E5E7EB"}
                />
                <XAxis
                  dataKey="hour"
                  stroke={isDarkMode ? "#fff" : "#222"}
                  textAnchor="end"
                  tick={{
                    fill: isDarkMode ? "#fff" : "#333",
                    fontSize: window.innerWidth < 640 ? 10 : 12,
                  }}
                  interval={window.innerWidth < 640 ? 2 : 1}
                  height={window.innerWidth < 640 ? 40 : 60}
                />
                <YAxis
                  stroke={isDarkMode ? "#9CA3AF" : "#6B7280"}
                  tick={{
                    fontSize: window.innerWidth < 640 ? 10 : 12,
                  }}
                  width={window.innerWidth < 640 ? 40 : 60}
                />
                <Tooltip
                  contentStyle={{
                    background: isDarkMode ? "#23263A" : "#fff",
                    color: isDarkMode ? "#fff" : "#23263A",
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                    fontSize: window.innerWidth < 640 ? "12px" : "14px",
                  }}
                  labelStyle={{
                    color: isDarkMode ? "#fff" : "#23263A",
                    fontWeight: 600,
                    fontSize: window.innerWidth < 640 ? "12px" : "14px",
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: window.innerWidth < 640 ? 10 : 12,
                    color: isDarkMode ? "#fff" : "#23263A",
                    paddingTop: window.innerWidth < 640 ? "10px" : "20px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="aqi"
                  stroke="#7C3AED"
                  strokeWidth={window.innerWidth < 640 ? 2 : 4}
                  dot={{
                    r: window.innerWidth < 640 ? 3 : 6,
                    fill: isDarkMode ? "#23263A" : "#fff",
                    stroke: "#7C3AED",
                    strokeWidth: 2,
                  }}
                  activeDot={{ r: window.innerWidth < 640 ? 4 : 8 }}
                  name="AQI"
                  animationDuration={1500}
                  animationBegin={0}
                  animationEasing="ease-out"
                />
                {showPollutants && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="pm2_5"
                      stroke="#22D3EE"
                      strokeWidth={window.innerWidth < 640 ? 1 : 2}
                      name="PM2.5"
                      animationDuration={1500}
                      animationBegin={200}
                      animationEasing="ease-out"
                    />
                    <Line
                      type="monotone"
                      dataKey="pm10"
                      stroke="#F59E42"
                      strokeWidth={window.innerWidth < 640 ? 1 : 2}
                      name="PM10"
                      animationDuration={1500}
                      animationBegin={400}
                      animationEasing="ease-out"
                    />
                    <Line
                      type="monotone"
                      dataKey="co"
                      stroke="#F43F5E"
                      strokeWidth={window.innerWidth < 640 ? 1 : 2}
                      name="CO"
                      animationDuration={1500}
                      animationBegin={600}
                      animationEasing="ease-out"
                    />
                    <Line
                      type="monotone"
                      dataKey="no2"
                      stroke="#8B5CF6"
                      strokeWidth={window.innerWidth < 640 ? 1 : 2}
                      name="NO₂"
                      animationDuration={1500}
                      animationBegin={800}
                      animationEasing="ease-out"
                    />
                    <Line
                      type="monotone"
                      dataKey="so2"
                      stroke="#FBBF24"
                      strokeWidth={window.innerWidth < 640 ? 1 : 2}
                      name="SO₂"
                      animationDuration={1500}
                      animationBegin={1000}
                      animationEasing="ease-out"
                    />
                    <Line
                      type="monotone"
                      dataKey="o3"
                      stroke="#10B981"
                      strokeWidth={window.innerWidth < 640 ? 1 : 2}
                      name="O₃"
                      animationDuration={1500}
                      animationBegin={1200}
                      animationEasing="ease-out"
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForecastingPage;
