import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

// Helper functions for color/status
const getStatusColor = (status = '') => {
  switch (status.toLowerCase()) {
    case 'good':
      return 'success';
    case 'moderate':
      return 'yellow';
    case 'unhealthy for sensitive groups':
      return 'orange';
    case 'unhealthy':
      return 'danger';
    case 'very unhealthy':
      return 'purple';
    case 'hazardous':
      return 'red';
    default:
      return 'success';
  }
};

const getColorClass = (colorName) => {
  switch (colorName) {
    case 'success':
      return 'bg-success-500';
    case 'yellow':
      return 'bg-yellow-500';
    case 'orange':
      return 'bg-orange-500';
    case 'danger':
      return 'bg-danger-500';
    case 'purple':
      return 'bg-purple-500';
    case 'red':
      return 'bg-red-700';
    default:
      return 'bg-success-500';
  }
};

const AQICard = ({ aqiData, coordinates, isLoading }) => {
  // Safeguard against missing data
  const safeAQIValue = typeof aqiData?.value === 'number' ? aqiData.value : 0;
  const safeStatus = aqiData?.status || 'Loading...';
  const safeUpdated = aqiData?.updated || '';
  const safeTemperature = aqiData?.temperature !== null ? aqiData?.temperature : null;
  const safeTemperatureUnit = aqiData?.temperatureUnit || '°C';
  const statusColor = getStatusColor(safeStatus);
  const colorClass = getColorClass(statusColor);

  return (
    <motion.div 
      className="overflow-hidden card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-dark-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Current AQI</h2>
        </div>
      </div>
      
      {/* AQI Value */}
      <div className="flex flex-col items-center justify-center px-6 py-8 bg-gray-50 dark:bg-dark-800/50">
        <div className={`relative flex items-center justify-center w-36 h-36 rounded-full ${isLoading ? 'bg-gray-200 dark:bg-dark-700' : colorClass}`}>
          {isLoading ? (
            <div className="w-10 h-10 border-4 rounded-full border-primary-500 border-t-transparent animate-spin"></div>
          ) : (
            <motion.span 
              className="text-5xl font-bold text-white"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {safeAQIValue}
            </motion.span>
          )}
        </div>
        <h3 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
          {safeStatus}
        </h3>
        {safeTemperature !== null && (
          <div className="mt-2 text-lg text-gray-700 dark:text-gray-300">
            <span className="font-medium">Temperature:</span> {safeTemperature}{safeTemperatureUnit}
          </div>
        )}
      </div>
    </motion.div>
  );
};

AQICard.propTypes = {
  aqiData: PropTypes.shape({
    value: PropTypes.number,
    status: PropTypes.string,
    color: PropTypes.string,
    pollutants: PropTypes.array,
    updated: PropTypes.string,
    temperature: PropTypes.number,
    temperatureUnit: PropTypes.string,
  }),
  coordinates: PropTypes.shape({
    latitude: PropTypes.number,
    longitude: PropTypes.number,
  }),
  isLoading: PropTypes.bool
};

export default AQICard;
