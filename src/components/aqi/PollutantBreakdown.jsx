import PropTypes from "prop-types";
import { motion } from "framer-motion";

const POLLUTANT_INFO = {
  pm2_5: {
    label: "PM2.5",
    fullname: "Fine Particulate Matter",
    desc: "Tiny particles that can enter deep into the lungs.",
    unit: "μg/m³",
    maxValue: 15,
  },
  pm10: {
    label: "PM10",
    fullname: "Coarse Particulate Matter",
    desc: "Larger particles that can cause respiratory issues.",
    unit: "μg/m³",
    maxValue: 45,
  },
  co: {
    label: "CO",
    fullname: "Carbon Monoxide",
    desc: "A colorless, odorless gas that reduces oxygen delivery.",
    unit: "mg/m³",
    maxValue: 4,
  },
  no2: {
    label: "NO₂",
    fullname: "Nitrogen Dioxide",
    desc: "A gas that irritates airways and worsens asthma.",
    unit: "μg/m³",
    maxValue: 25,
  },
  so2: {
    label: "SO₂",
    fullname: "Sulfur Dioxide",
    desc: "A gas that can cause respiratory problems.",
    unit: "μg/m³",
    maxValue: 40,
  },
  o3: {
    label: "O₃",
    fullname: "Ozone",
    desc: "A gas that can cause chest pain and coughing.",
    unit: "μg/m³",
    maxValue: 100,
  },
};

function getPollutantColor(value, maxValue) {
  const ratio = maxValue ? value / maxValue : 0;
  if (ratio <= 0.5) return "bg-green-500";
  if (ratio <= 0.8) return "bg-yellow-500";
  if (ratio <= 1) return "bg-orange-500";
  return "bg-red-600";
}

const PollutantBreakdown = ({ pollutants }) => {
  // Uncomment for debugging:
  // console.log("Pollutants received:", pollutants);

  const validPollutants = (pollutants || []).filter(
    (p) => p && typeof p.value === "number" && !isNaN(p.value)
  );

  return (
    <motion.div
      className="p-6 card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}>
      <motion.h2
        className="mb-4 text-xl font-semibold text-gray-900 dark:text-white"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, delay: 0.2 }}>
        Pollutant Breakdown
      </motion.h2>
      {validPollutants.length === 0 ? (
        <motion.div
          className="py-4 text-center text-gray-500"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.3 }}>
          No pollutant data available
        </motion.div>
      ) : (
        <motion.div
          className="space-y-5"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}>
          {validPollutants.map((pollutant, index) => {
            const info = POLLUTANT_INFO[pollutant.name];
            if (!info) return null;
            const value =
              typeof pollutant.value === "number" && !isNaN(pollutant.value)
                ? pollutant.value
                : 0;
            const maxValue =
              typeof info.maxValue === "number" && info.maxValue > 0
                ? info.maxValue
                : 100;
            const ratio = maxValue
              ? Math.max(0, Math.min(value / maxValue, 1))
              : 0;

            return (
              <motion.div
                key={pollutant.name}
                className="flex flex-col gap-1 p-3 rounded-lg sm:flex-row sm:items-center sm:justify-between bg-gray-50 dark:bg-dark-800"
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  show: {
                    opacity: 1,
                    x: 0,
                    transition: {
                      duration: 0.5,
                      delay: index * 0.1,
                    },
                  },
                }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}>
                <div className="flex-1 min-w-0">
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.3, delay: 0.1 }}>
                    <span className="text-lg font-bold text-gray-800 dark:text-gray-100">
                      {info.label}
                    </span>
                    <span className="text-base text-gray-500 dark:text-gray-400">
                      {info.fullname}
                    </span>
                  </motion.div>
                  <motion.div
                    className="mt-1 text-base font-medium text-gray-600 dark:text-gray-300"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.3, delay: 0.2 }}>
                    {info.desc}
                  </motion.div>
                </div>
                <motion.div
                  className="flex items-center gap-3 mt-2 sm:mt-0 sm:ml-4 min-w-[150px]"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.3, delay: 0.3 }}>
                  <div className="w-24 h-2 overflow-hidden bg-gray-200 rounded-full dark:bg-dark-700">
                    <motion.div
                      className={`h-2 ${getPollutantColor(
                        value,
                        maxValue
                      )} rounded-full`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${ratio * 100}%` }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{
                        duration: 0.8,
                        delay: 0.4,
                        ease: "easeOut",
                      }}
                    />
                  </div>
                  <motion.span
                    className="font-mono text-lg font-semibold text-gray-700 dark:text-gray-200"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.3, delay: 0.5 }}>
                    {typeof value === "number" && !isNaN(value)
                      ? value.toFixed(1)
                      : "-"}{" "}
                    {info.unit}
                  </motion.span>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
};

PollutantBreakdown.propTypes = {
  pollutants: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number,
      label: PropTypes.string,
    })
  ),
};

export default PollutantBreakdown;
