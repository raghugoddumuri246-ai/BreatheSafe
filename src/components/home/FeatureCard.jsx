import { motion } from "framer-motion";
import PropTypes from "prop-types";

const FeatureCard = ({ icon, title, description }) => {
  return (
    <motion.div
      className="card p-6 min-h-[300px] flex flex-col justify-between"
      whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)" }}
      transition={{ duration: 0.3 }}>
      <div className="flex flex-col items-start flex-grow">
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </motion.div>
  );
};

FeatureCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

export default FeatureCard;
