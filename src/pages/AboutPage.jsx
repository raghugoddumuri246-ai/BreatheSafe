import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiHeart,
  FiShield,
  FiUsers,
  FiGlobe,
  FiAward,
  FiTrendingUp,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const AboutPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleButtonClick = (path) => {
    if (!user) {
      navigate("/login", {
        state: {
          background: location,
          from: path,
        },
      });
    } else {
      navigate(path);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  // Values data
  const values = [
    {
      icon: <FiHeart className="w-8 h-8 text-primary-500" />,
      title: "Health First",
      description:
        "We prioritize your health and well-being by providing accurate air quality information and personalized health recommendations.",
    },
    {
      icon: <FiShield className="w-8 h-8 text-primary-500" />,
      title: "Data Security",
      description:
        "Your data privacy is our top priority. We ensure all your personal information and health data is securely protected.",
    },
    {
      icon: <FiUsers className="w-8 h-8 text-primary-500" />,
      title: "Community Focus",
      description:
        "We believe in building a community of informed citizens who can make better decisions for their health and environment.",
    },
  ];

  return (
    <div className="pt-16">
      {/* Mission Section */}
      <section className="section bg-white dark:bg-dark-800 pt-20">
        <div className="container-custom">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}>
            <motion.h2
              className="mb-6 text-gray-900 heading-md dark:text-white"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}>
              Our Mission
            </motion.h2>
            <motion.p
              className="mb-8 text-lg leading-relaxed text-gray-700 dark:text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}>
              We believe everyone has the right to breathe clean air.
              BreatheSafe provides accurate, real-time air quality data and
              personalized health insights to help you make informed decisions
              about your outdoor activities and take control of your respiratory
              health.
            </motion.p>
            <motion.div
              className="flex flex-col justify-center gap-4 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}>
              <motion.button
                onClick={() => handleButtonClick("/live-aqi")}
                className="btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                Check Your Air Quality
              </motion.button>
              <motion.button
                onClick={() => handleButtonClick("/forecasting")}
                className="btn-secondary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}>
                View AQI Forecast
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section bg-gray-50 dark:bg-dark-900">
        <div className="container-custom">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}>
            <motion.h2
              className="mb-4 text-gray-900 heading-md dark:text-white"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}>
              Our Values
            </motion.h2>
            <motion.p
              className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}>
              The principles that guide our mission to improve air quality
              awareness and public health.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 gap-8 md:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}>
            {values.map((value, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                transition={{ duration: 0.3 }}
                className="p-6 bg-white rounded-xl shadow-lg dark:bg-dark-800">
                <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/30 rounded-xl inline-block">
                  {value.icon}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-white">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
