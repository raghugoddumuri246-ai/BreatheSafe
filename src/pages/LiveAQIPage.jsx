import React, {
  useState,
  useEffect,
  startTransition,
  useCallback,
} from "react";
import { motion } from "framer-motion";
import {
  FiNavigation,
  FiSearch,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";
import { useNavigate, Link } from "react-router-dom";
import AQICard from "../components/aqi/AQICard";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import PollutantBreakdown from "../components/aqi/PollutantBreakdown";
import { useHistory } from "../context/HistoryContext";
import { toast } from "react-toastify";

// Fix default marker icon for leaflet in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// EPA AQI Scale (unchanged)
const EPA_AQI_SCALE = {
  0: { label: "Good", color: "success", range: "0-50" },
  1: { label: "Moderate", color: "info", range: "51-100" },
  2: {
    label: "Unhealthy for Sensitive Groups",
    color: "warning",
    range: "101-150",
  },
  3: { label: "Unhealthy", color: "danger", range: "151-200" },
  4: { label: "Very Unhealthy", color: "danger", range: "201-300" },
  5: { label: "Hazardous", color: "danger", range: "301-500" },
};

function getAQIStatus(aqi) {
  if (aqi <= 50) return EPA_AQI_SCALE[0].label;
  if (aqi <= 100) return EPA_AQI_SCALE[1].label;
  if (aqi <= 150) return EPA_AQI_SCALE[2].label;
  if (aqi <= 200) return EPA_AQI_SCALE[3].label;
  if (aqi <= 300) return EPA_AQI_SCALE[4].label;
  return EPA_AQI_SCALE[5].label;
}

function getAQIColor(aqi) {
  if (aqi <= 50) return EPA_AQI_SCALE[0].color;
  if (aqi <= 100) return EPA_AQI_SCALE[1].color;
  if (aqi <= 150) return EPA_AQI_SCALE[2].color;
  if (aqi <= 200) return EPA_AQI_SCALE[3].color;
  if (aqi <= 300) return EPA_AQI_SCALE[4].color;
  return EPA_AQI_SCALE[5].color;
}

function getAQIAdvisory(aqi) {
  if (aqi <= 50) {
    return {
      headline: "Good Air Quality",
      message:
        "Air quality is satisfactory, and air pollution poses little or no risk.",
    };
  } else if (aqi <= 100) {
    return {
      headline: "Moderate Air Quality",
      message:
        "Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.",
    };
  } else if (aqi <= 150) {
    return {
      headline: "Unhealthy for Sensitive Groups",
      message:
        "Members of sensitive groups may experience health effects. The general public is less likely to be affected.",
    };
  } else if (aqi <= 200) {
    return {
      headline: "Unhealthy",
      message:
        "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.",
    };
  } else if (aqi <= 300) {
    return {
      headline: "Very Unhealthy",
      message:
        "Health warnings of emergency conditions. The entire population is more likely to be affected.",
    };
  } else {
    return {
      headline: "Hazardous",
      message:
        "Health alert: everyone may experience more serious health effects. Emergency conditions.",
    };
  }
}

// Dynamic Leaflet Map component (unchanged)
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

// Add geocoding function to convert lat/long to city name
const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
    );
    const data = await response.json();
    if (data && data.address) {
      // Try to get city name in this order: city, town, village, or municipality
      const cityName =
        data.address.city ||
        data.address.town ||
        data.address.village ||
        data.address.municipality ||
        "Unknown Location";
      return cityName;
    }
    return "Unknown Location";
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return "Unknown Location";
  }
};

const LiveAQIPage = () => {
  const navigate = useNavigate();
  const [coordinates, setCoordinates] = useState({
    latitude: 17.385044,
    longitude: 78.486671,
  });
  const [locationName, setLocationName] = useState("Hyderabad");
  const [locationSearch, setLocationSearch] = useState("");
  const [searchError, setSearchError] = useState("");
  const [aqiData, setAqiData] = useState(null);
  const { addHistoryEntry } = useHistory(); // Destructure addHistoryEntry from useHistory
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const MIN_FETCH_INTERVAL = 5000; // 5 seconds minimum between fetches
  const [healthReportsCount, setHealthReportsCount] = useState(0);

  const fetchHealthReportsCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        "http://localhost:5000/api/health-report/count",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch health reports count");
      }

      const data = await response.json();
      if (data.success) {
        setHealthReportsCount(data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching health reports count:", error);
    }
  };

  // Memoize the fetchAQI function to ensure a stable reference
  const fetchAQI = useCallback(
    async (lat, lon, currentSearchLocationName) => {
      // Prevent too frequent API calls
      const now = Date.now();
      if (now - lastFetchTime < MIN_FETCH_INTERVAL) {
        console.log("Skipping fetch - too soon since last fetch");
        return;
      }
      setLastFetchTime(now);

      // Add debouncing to prevent rapid API calls
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      console.log("fetchAQI called with:", {
        lat,
        lon,
        currentSearchLocationName,
      });
      setIsLoading(true);
      setSearchError("");

      try {
        // Fetch AQI data
        const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi`;

        // Fetch temperature data from Open Meteo API
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=auto`;

        // Fetch both AQI and temperature data in parallel
        const [aqiResp, weatherResp] = await Promise.all([
          fetch(aqiUrl, { signal: controller.signal }),
          fetch(weatherUrl, { signal: controller.signal }),
        ]);

        if (!aqiResp.ok) {
          throw new Error(`HTTP error for AQI data! status: ${aqiResp.status}`);
        }

        if (!weatherResp.ok) {
          throw new Error(
            `HTTP error for weather data! status: ${weatherResp.status}`
          );
        }

        const data = await aqiResp.json();
        const weatherData = await weatherResp.json();

        console.log("AQI data:", data);
        console.log("Weather data:", weatherData);

        // Validate data structure
        if (!data?.hourly?.us_aqi || !Array.isArray(data.hourly.us_aqi)) {
          throw new Error("Invalid data structure received from API");
        }

        let idx = -1;
        if (data?.hourly?.us_aqi && Array.isArray(data.hourly.us_aqi)) {
          for (let i = data.hourly.us_aqi.length - 1; i >= 0; i--) {
            if (
              data.hourly.us_aqi[i] != null &&
              data.hourly.pm2_5?.[i] != null &&
              data.hourly.pm10?.[i] != null &&
              data.hourly.carbon_monoxide?.[i] != null &&
              data.hourly.nitrogen_dioxide?.[i] != null &&
              data.hourly.sulphur_dioxide?.[i] != null &&
              data.hourly.ozone?.[i] != null
            ) {
              idx = i;
              break;
            }
          }
        }

        if (idx === -1) {
          throw new Error("No valid AQI data found");
        }

        const pollutants = [
          {
            name: "pm2_5",
            label: "PM2.5",
            value: data.hourly.pm2_5[idx],
            unit: "μg/m³",
          },
          {
            name: "pm10",
            label: "PM10",
            value: data.hourly.pm10[idx],
            unit: "μg/m³",
          },
          {
            name: "co",
            label: "CO",
            value: data.hourly.carbon_monoxide[idx] / 1000,
            unit: "mg/m³",
          },
          {
            name: "no2",
            label: "NO₂",
            value: data.hourly.nitrogen_dioxide[idx],
            unit: "μg/m³",
          },
          {
            name: "so2",
            label: "SO₂",
            value: data.hourly.sulphur_dioxide[idx],
            unit: "μg/m³",
          },
          {
            name: "o3",
            label: "O₃",
            value: data.hourly.ozone[idx],
            unit: "μg/m³",
          },
        ];

        const aqiValue = data.hourly.us_aqi[idx];
        const aqiStatus = getAQIStatus(aqiValue);
        const aqiColor = getAQIColor(aqiValue);

        // Extract temperature from weather data
        const temperature = weatherData.current?.temperature_2m || null;
        const temperatureUnit =
          weatherData.current_units?.temperature_2m || "°C";

        const newAqiData = {
          value: aqiValue,
          status: aqiStatus,
          color: aqiColor,
          pollutants,
          updated: data.hourly.time[idx],
          temperature: temperature,
          temperatureUnit: temperatureUnit,
        };
        setAqiData(newAqiData);

        // Add to history only if we have valid data
        if (currentSearchLocationName && newAqiData.value !== null) {
          const historyEntry = {
            city: currentSearchLocationName,
            aqi: newAqiData.value,
            status: newAqiData.status,
            date: new Date().toISOString().split("T")[0],
            coordinates: {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            },
          };

          addHistoryEntry(historyEntry);

          // Send to backend API
          try {
            const token = localStorage.getItem("token");
            if (token) {
              const response = await fetch(
                "http://localhost:5000/api/aqi-tracker/save",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    city: currentSearchLocationName,
                    aqi: newAqiData.value,
                    status: newAqiData.status,
                    coordinates: {
                      latitude: coordinates.latitude,
                      longitude: coordinates.longitude,
                    },
                    pollutants: {
                      pm2_5:
                        newAqiData.pollutants.find((p) => p.name === "pm2_5")
                          ?.value || 0,
                      pm10:
                        newAqiData.pollutants.find((p) => p.name === "pm10")
                          ?.value || 0,
                      o3:
                        newAqiData.pollutants.find((p) => p.name === "o3")
                          ?.value || 0,
                      no2:
                        newAqiData.pollutants.find((p) => p.name === "no2")
                          ?.value || 0,
                      so2:
                        newAqiData.pollutants.find((p) => p.name === "so2")
                          ?.value || 0,
                      co:
                        newAqiData.pollutants.find((p) => p.name === "co")
                          ?.value || 0,
                    },
                  }),
                }
              );

              if (!response.ok) {
                console.error(
                  "Failed to save AQI data to backend:",
                  response.statusText
                );
              }
            }
          } catch (backendError) {
            console.error("Error sending AQI data to backend:", backendError);
          }
        }
      } catch (e) {
        console.error("AQI fetch error:", e);
        if (e.name === "AbortError") {
          setSearchError("Request timed out. Please try again.");
        } else {
          setSearchError(`Failed to fetch AQI data: ${e.message}`);
        }
        setAqiData(null);
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    },
    [
      addHistoryEntry,
      lastFetchTime,
      coordinates.latitude,
      coordinates.longitude,
    ]
  );

  // Effect for triggering AQI data fetching whenever coordinates change
  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const fetchData = async () => {
      if (isMounted) {
        // Only fetch if we have valid coordinates and location name
        if (coordinates.latitude && coordinates.longitude && locationName) {
          // Add a small delay to prevent rapid consecutive calls
          timeoutId = setTimeout(() => {
            fetchAQI(coordinates.latitude, coordinates.longitude, locationName);
          }, 300);
        }
      }
    };

    fetchData();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [coordinates.latitude, coordinates.longitude, locationName, fetchAQI]);

  const handleRefresh = useCallback(() => {
    if (
      !isLoading &&
      coordinates.latitude &&
      coordinates.longitude &&
      locationName
    ) {
      setIsLoading(true);
      fetchAQI(coordinates.latitude, coordinates.longitude, locationName);
    }
  }, [
    coordinates.latitude,
    coordinates.longitude,
    locationName,
    fetchAQI,
    isLoading,
  ]);

  // Geocode location search using Nominatim
  const handleLocationSearch = async (e) => {
    e.preventDefault();
    setSearchError("");

    if (!locationSearch.trim()) {
      setSearchError("Please enter a location to search");
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      // Add country code to improve search accuracy
      const searchQuery = `${locationSearch.trim()}, India`;
      console.log("Searching for:", searchQuery);

      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1`,
        { signal: controller.signal }
      );

      if (!resp.ok) {
        throw new Error(`HTTP error! status: ${resp.status}`);
      }

      const data = await resp.json();
      console.log("Search results:", data);

      if (data && data.length > 0) {
        const location = data[0];
        console.log("Selected location:", location);

        const newCoordinates = {
          latitude: parseFloat(location.lat),
          longitude: parseFloat(location.lon),
        };

        // Use startTransition to mark state updates as non-urgent
        startTransition(() => {
          setCoordinates(newCoordinates);

          // Extract city name from display_name
          const cityName = location.display_name.split(",")[0];
          setLocationName(cityName);
          setLocationSearch(cityName);
        });
      } else {
        setSearchError("Location not found. Please try a different city name.");
        setLocationName("");
      }
    } catch (error) {
      console.error("Location search error:", error);
      if (error.name === "AbortError") {
        setSearchError("Search request timed out. Please try again.");
      } else {
        setSearchError(
          `Error searching location: ${error.message}. Please try again.`
        );
      }
      setLocationName("");
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  // Modify handleDetectLocation function
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

            // Fetch AQI data with the new coordinates and city name
            await fetchAQI(
              newCoordinates.latitude,
              newCoordinates.longitude,
              cityName
            );
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

  // Map click handler (unchanged)
  const handleMapClick = (lat, lng) => {
    setCoordinates({
      latitude: lat,
      longitude: lng,
    });
    setLocationName("");
    setLocationSearch("");
  };

  // Handle health report generation
  const handleGenerateReport = async () => {
    if (!locationName || !aqiData) {
      toast.error("Please search for a location first");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please log in to generate health report");
        navigate("/login");
        return;
      }

      setIsGeneratingReport(true);
      const response = await fetch(
        "http://localhost:5000/api/health-report/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            location: {
              name: locationName,
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            },
            aqiData: {
              value: aqiData.value,
              status: aqiData.status,
              pollutants: aqiData.pollutants,
              temperature: aqiData.temperature,
              temperatureUnit: aqiData.temperatureUnit,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (
          response.status === 400 &&
          data.message?.includes("health assessment")
        ) {
          toast.error(
            <div>
              Please complete a health assessment first.{" "}
              <Link to="/form-input" className="text-blue-500 underline">
                Click here to complete assessment
              </Link>
            </div>
          );
          return;
        }
        throw new Error(data.message || "Failed to generate health report");
      }

      if (data.success) {
        toast.success("Health report generated successfully!");
        // Refresh the health reports count
        await fetchHealthReportsCount();
        // Navigate to the report view
        navigate(`/health-reports/${data.report._id}`);
      } else {
        throw new Error(data.message || "Failed to generate health report");
      }
    } catch (error) {
      console.error("Error generating health report:", error);
      toast.error(error.message || "Failed to generate health report");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Add useEffect to fetch initial health reports count
  useEffect(() => {
    fetchHealthReportsCount();
  }, []);

  // Get advisory for current AQI
  const advisory = getAQIAdvisory(aqiData?.value);

  return (
    <div className="pt-20 pb-16">
      <div className="container-custom">
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}>
          <h1 className="pt-5 mb-3 text-gray-900 heading-md dark:text-white">
            Live AQI Tracker
          </h1>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400">
            Monitor real-time air quality data for any location.
          </p>
        </motion.div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left panel - Map and controls */}
          <motion.div
            className="lg:col-span-2 card p-4 sm:p-6 h-[600px] flex flex-col"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}>
            <div className="mb-4">
              <div className="flex flex-col gap-4 mb-4 sm:flex-row">
                <form
                  onSubmit={handleLocationSearch}
                  className="flex flex-grow gap-2">
                  <input
                    type="text"
                    placeholder="Search location"
                    className="flex-grow px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg dark:border-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-700 dark:text-white"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="p-2 btn-primary"
                    disabled={isLoading}>
                    <FiSearch className="w-5 h-5" />
                  </button>
                </form>
                <button
                  onClick={handleDetectLocation}
                  className="flex items-center gap-2 btn-secondary"
                  disabled={isLoading}>
                  <FiNavigation className="w-4 h-4" />
                  <span>Detect Location</span>
                </button>
              </div>
              {searchError && (
                <div className="mt-2 text-sm text-danger-600 dark:text-danger-400">
                  {searchError}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <span className="font-medium">Latitude:</span>{" "}
                  {coordinates.latitude.toFixed(4)}
                </div>
                <div>
                  <span className="font-medium">Longitude:</span>{" "}
                  {coordinates.longitude.toFixed(4)}
                </div>
                <button
                  onClick={handleRefresh}
                  className="flex items-center gap-1 ml-auto text-primary-500 hover:text-primary-600"
                  disabled={isLoading}>
                  <FiRefreshCw
                    className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  <span>Refresh</span>
                </button>
              </div>
              {locationName && (
                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">Location:</span> {locationName}
                </div>
              )}
            </div>
            <div className="relative flex-grow overflow-hidden border border-gray-200 rounded-lg dark:border-dark-700">
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-dark-800/70">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 mb-2 border-4 rounded-full border-primary-500 border-t-transparent animate-spin"></div>
                    <p className="text-gray-700 dark:text-gray-300">
                      Loading data...
                    </p>
                  </div>
                </div>
              )}
              <AQIMap coordinates={coordinates} onClick={handleMapClick} />
            </div>
          </motion.div>
          {/* Right panel - Health Advisory and AQI Card */}
          <motion.div
            className="flex flex-col gap-6 lg:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}>
            {/* Health Advisory at the top */}
            <div className="p-4 border card sm:p-6 bg-primary-50 dark:bg-primary-900/20 border-primary-100 dark:border-primary-800">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <FiAlertCircle
                    className={`w-5 h-5 text-${
                      aqiData ? getAQIColor(aqiData.value) : "primary"
                    }-500`}
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {advisory.headline}
                  </h3>
                  <div className="mt-2 space-y-2 text-gray-700 dark:text-gray-300">
                    <p>
                      Current air quality is{" "}
                      <span
                        className={`font-medium text-${
                          aqiData ? getAQIColor(aqiData.value) : "primary"
                        }-600 dark:text-${
                          aqiData ? getAQIColor(aqiData.value) : "primary"
                        }-400`}>
                        {aqiData ? aqiData.status : "Loading..."}
                      </span>
                      .
                    </p>
                    <p>{advisory.message}</p>
                    <button
                      onClick={handleGenerateReport}
                      className="inline-block mt-3 font-semibold underline text-primary-600 dark:text-primary-400"
                      disabled={isGeneratingReport}>
                      {isGeneratingReport
                        ? "Generating Report..."
                        : "Generate Health Report"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* AQI Card below */}
            {isLoading ? (
              <div className="p-6 text-center card">
                <p className="text-gray-600 dark:text-gray-400">
                  Loading AQI data...
                </p>
              </div>
            ) : aqiData ? (
              <AQICard
                aqiData={aqiData}
                coordinates={coordinates}
                isLoading={isLoading}
              />
            ) : (
              <div className="p-6 text-center card">
                <p className="text-gray-600 dark:text-gray-400">
                  No AQI data available for this location.
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Pollutant Breakdown always below the main grid */}
        {aqiData && (
          <div className="mt-8">
            <PollutantBreakdown pollutants={aqiData.pollutants} />
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveAQIPage;
