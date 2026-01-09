import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import {
  FiVolume2,
  FiVolumeX,
  FiSearch,
  FiAlertCircle,
  FiWind,
  FiDroplet,
  FiCloud,
  FiSun,
} from "react-icons/fi";

const DiseaseInfoPage = () => {
  const { isDarkMode } = useTheme();
  const [speakingDisease, setSpeakingDisease] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const diseases = [
    {
      name: "Asthma",
      symptoms: [
        "Shortness of breath",
        "Wheezing",
        "Chest tightness",
        "Chronic cough",
      ],
      causes:
        "Airborne allergens, industrial pollutants, and respiratory irritants",
      pollutants: [
        "Pollen",
        "Dust mites",
        "Smoke from burning wood",
        "Ozone (O₃)",
      ],
      icon: <FiWind className="w-6 h-6" />,
    },
    {
      name: "Bronchitis",
      symptoms: [
        "Persistent cough",
        "Mucus production",
        "Fatigue",
        "Shortness of breath",
      ],
      causes: "Exposure to smoke, air pollution, and viral infections",
      pollutants: [
        "Particulate matter (PM2.5, PM10)",
        "Carbon monoxide (CO)",
        "Sulfur dioxide (SO₂)",
      ],
      icon: <FiDroplet className="w-6 h-6" />,
    },
    {
      name: "COPD",
      symptoms: [
        "Progressive breathlessness",
        "Chronic cough",
        "Frequent respiratory infections",
        "Fatigue",
      ],
      causes: "Long-term exposure to harmful gases and particulate matter",
      pollutants: [
        "Tobacco smoke",
        "Industrial dust",
        "Chemical fumes",
        "Air pollution",
      ],
      icon: <FiCloud className="w-6 h-6" />,
    },
    {
      name: "Pneumonia",
      symptoms: [
        "High fever",
        "Cough with phlegm",
        "Difficulty breathing",
        "Chest pain",
      ],
      causes: "Bacterial or viral infections, weakened immune system",
      pollutants: [
        "Air pollution",
        "Smoke inhalation",
        "Chemical fumes",
        "Dust particles",
      ],
      icon: <FiAlertCircle className="w-6 h-6" />,
    },
    {
      name: "Sinusitis",
      symptoms: [
        "Nasal congestion",
        "Facial pain",
        "Headache",
        "Post-nasal drip",
      ],
      causes: "Viral infections, allergies, air pollution",
      pollutants: [
        "Airborne allergens",
        "Pollution particles",
        "Mold spores",
        "Dust",
      ],
      icon: <FiSun className="w-6 h-6" />,
    },
    {
      name: "Tuberculosis",
      symptoms: [
        "Persistent cough",
        "Night sweats",
        "Weight loss",
        "Chest pain",
      ],
      causes: "Bacterial infection, poor air quality",
      pollutants: [
        "Indoor air pollution",
        "Tobacco smoke",
        "Industrial emissions",
        "Dust particles",
      ],
      icon: <FiAlertCircle className="w-6 h-6" />,
    },
    {
      name: "Lung Cancer",
      symptoms: [
        "Persistent cough",
        "Chest pain",
        "Shortness of breath",
        "Unexplained weight loss",
      ],
      causes: "Long-term exposure to carcinogens",
      pollutants: ["Tobacco smoke", "Radon gas", "Asbestos", "Air pollution"],
      icon: <FiAlertCircle className="w-6 h-6" />,
    },
    {
      name: "Allergic Rhinitis",
      symptoms: ["Sneezing", "Runny nose", "Itchy eyes", "Nasal congestion"],
      causes: "Allergic reactions to airborne particles",
      pollutants: ["Pollen", "Dust mites", "Pet dander", "Mold spores"],
      icon: <FiSun className="w-6 h-6" />,
    },
  ];

  const toggleSpeech = (disease) => {
    if (speakingDisease === disease.name) {
      window.speechSynthesis.cancel();
      setSpeakingDisease(null);
      return;
    }

    const text = `Disease: ${
      disease.name
    }. Symptoms include: ${disease.symptoms.join(", ")}. Caused by: ${
      disease.causes
    }. Major pollutants are: ${disease.pollutants.join(", ")}.`;

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";

    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(
      (voice) => voice.name.includes("Female") || voice.gender === "female"
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onend = () => setSpeakingDisease(null);
    window.speechSynthesis.speak(utterance);
    setSpeakingDisease(disease.name);
  };

  const filteredDiseases = diseases.filter(
    (disease) =>
      disease.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      disease.symptoms.some((symptom) =>
        symptom.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      disease.pollutants.some((pollutant) =>
        pollutant.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
    hover: {
      scale: 1.02,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        <div className="relative container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center">
            <motion.h1
              className="mb-4 text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}>
              Airborne Disease Information
            </motion.h1>
            <motion.p
              className="mb-8 text-lg text-gray-700 dark:text-gray-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}>
              Learn about common airborne diseases and their relationship with
              air quality
            </motion.p>

            {/* Search Bar */}
            <motion.div
              className="relative max-w-xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}>
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <FiSearch className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search diseases, symptoms, or pollutants..."
                className="w-full py-3 pl-12 pr-4 text-gray-900 bg-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:bg-dark-800 dark:text-white dark:placeholder-gray-400"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Disease Cards Section */}
      <div className="container-custom py-12">
        <motion.div
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}>
          {filteredDiseases.map((disease, index) => (
            <motion.div
              key={disease.name}
              variants={cardVariants}
              whileHover="hover"
              className={`group relative overflow-hidden rounded-xl ${
                isDarkMode
                  ? "bg-dark-800 border border-dark-700"
                  : "bg-white border border-gray-200"
              } shadow-lg hover:shadow-xl transition-all duration-300`}>
              {/* Card Header */}
              <motion.div
                className="p-6 border-b border-gray-200 dark:border-dark-700"
                variants={contentVariants}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <motion.div
                      className="p-2 text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}>
                      {disease.icon}
                    </motion.div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {disease.name}
                    </h2>
                  </div>
                  <motion.button
                    onClick={() => toggleSpeech(disease)}
                    className={`p-2 rounded-full transition-colors duration-200 ${
                      speakingDisease === disease.name
                        ? "bg-danger-500 hover:bg-danger-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200 dark:bg-dark-700 dark:hover:bg-dark-600 text-gray-600 dark:text-gray-300"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={
                      speakingDisease === disease.name ? "Stop" : "Listen"
                    }>
                    {speakingDisease === disease.name ? (
                      <FiVolumeX className="w-5 h-5" />
                    ) : (
                      <FiVolume2 className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>
              </motion.div>

              {/* Card Content */}
              <motion.div className="p-6 space-y-6" variants={contentVariants}>
                {/* Symptoms */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                    Symptoms
                  </h3>
                  <ul className="space-y-2">
                    {disease.symptoms.map((symptom, idx) => (
                      <motion.li
                        key={symptom}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: idx * 0.1 }}
                        className="flex items-center text-gray-600 dark:text-gray-300">
                        <span className="w-1.5 h-1.5 mr-2 bg-gray-500 rounded-full" />
                        {symptom}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Causes */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                    Caused By
                  </h3>
                  <motion.p
                    className="text-gray-600 dark:text-gray-300"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}>
                    {disease.causes}
                  </motion.p>
                </div>

                {/* Pollutants */}
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                    Major Pollutants
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {disease.pollutants.map((pollutant, idx) => (
                      <motion.span
                        key={pollutant}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: idx * 0.1 }}
                        className="px-3 py-1 text-sm text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                        {pollutant}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* No Results Message */}
        {filteredDiseases.length === 0 && (
          <motion.div
            className="py-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              No diseases found matching your search criteria.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DiseaseInfoPage;
