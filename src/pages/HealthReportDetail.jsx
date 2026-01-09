import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiAlertCircle, FiClock, FiMapPin, FiDownload, FiUser, FiActivity, FiShield, FiVolume2 } from 'react-icons/fi';
import html2pdf from 'html2pdf.js';

const HealthReportDetail = () => {
  // Helper function to get color class based on AQI value
  const getAqiColorClass = (aqi) => {
    if (aqi <= 50) return 'bg-success-500';
    if (aqi <= 100) return 'bg-yellow-500';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-danger-500';
    if (aqi <= 300) return 'bg-purple-500';
    return 'bg-red-900';
  };

  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [currentSpeakingId, setCurrentSpeakingId] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please log in to view health reports');
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:5000/api/health-report/reports/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setReport(data.report);
        } else {
          setError(data.message || 'Failed to fetch report');
        }
      } catch (err) {
        console.error('Error fetching health report:', err);
        setError('Failed to fetch health report');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  // Helper function to extract text content from a section
  const extractSectionContent = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (!section) return "Content not available";
    
    // Get all text content from the section, excluding button text
    let content = '';
    
    // Extract heading
    const heading = section.querySelector('h3, h4, h5');
    if (heading) {
      content += heading.textContent + '. ';
    }
    
    // Extract paragraphs
    const paragraphs = section.querySelectorAll('p');
    paragraphs.forEach(p => {
      content += p.textContent + ' ';
    });
    
    // Extract list items
    const listItems = section.querySelectorAll('li');
    if (listItems.length > 0) {
      content += 'Here are the key points: ';
      listItems.forEach(item => {
        content += item.textContent + '. ';
      });
    }
    
    return content;
  };
  
  const speakText = (text, id) => {
    // Cancel any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      
      // If clicking the same button that's currently speaking, just stop
      if (id === currentSpeakingId) {
        setSpeaking(false);
        setCurrentSpeakingId(null);
        return;
      }
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Set speaking state
    setSpeaking(true);
    setCurrentSpeakingId(id);
    
    // Handle speech end
    utterance.onend = () => {
      setSpeaking(false);
      setCurrentSpeakingId(null);
    };
    
    // Handle speech error
    utterance.onerror = () => {
      setSpeaking(false);
      setCurrentSpeakingId(null);
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const downloadReport = () => {
    setDownloading(true);
    const reportElement = document.getElementById('health-report');
    const options = {
      margin: 10,
      filename: `health-report-${report._id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf()
      .from(reportElement)
      .set(options)
      .save()
      .then(() => {
        setDownloading(false);
      })
      .catch(err => {
        console.error('Error generating PDF:', err);
        setDownloading(false);
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 dark:bg-dark-900">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 border-4 rounded-full border-primary-500 border-t-transparent animate-spin"></div>
            <span className="ml-3 text-gray-700 dark:text-gray-300">Loading health report...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 dark:bg-dark-900">
        <div className="max-w-4xl mx-auto">
          <div className="p-4 text-center text-danger-500 bg-danger-50 dark:bg-danger-900/30 rounded-lg">
            <FiAlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 dark:bg-dark-900">
        <div className="max-w-4xl mx-auto">
          <div className="p-4 text-center text-warning-500 bg-warning-50 dark:bg-warning-900/30 rounded-lg">
            <FiAlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p>No report data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 mt-12">
      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-dark-800 rounded-xl shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-dark-700">
              <div className="flex items-center justify-between">
                <Link
                  to="/live-aqi"
                  className="flex items-center text-primary-500 hover:text-primary-600 transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5 mr-2" />
                  Back to LiveAqi
                </Link>
                <button
                  onClick={downloadReport}
                  disabled={downloading}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <FiDownload className="w-4 h-4 mr-2" />
                      Download Report
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Report Content */}
            <div id="health-report" className="p-6 space-y-8">
              {/* Personal Info */}
              <section className="p-6 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div className="flex items-center mb-4">
                  <FiUser className="w-6 h-6 text-primary-500 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Personal Information</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                    <p className="text-gray-900 dark:text-white">{report.healthData?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Age</p>
                    <p className="text-gray-900 dark:text-white">{report.healthData?.age ? `${report.healthData.age} years` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Age Group</p>
                    <p className="text-gray-900 dark:text-white">{report.report?.userProfile?.ageGroup || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Risk Level</p>
                    <p className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${report.report?.userProfile?.riskLevel === 'High' ? 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-400' :
                        report.report?.userProfile?.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                      }`}>
                      {report.report?.userProfile?.riskLevel || 'N/A'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Air Quality Status */}
              <section className="p-6 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div className="flex items-center mb-4">
                  <FiActivity className="w-6 h-6 text-primary-500 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Air Quality Status</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAqiColorClass(report.aqiData?.value || 0)} text-white mr-2`}>
                        {report.aqiData?.value || 'N/A'}
                      </span>
                      <p className="text-gray-900 dark:text-white font-medium">{report.aqiData?.status || 'N/A'}</p>
                    </div>
                    {/* Temperature Display */}
                    <div className="mt-4">
                      <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-1">Temperature</h3>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        {report.aqiData?.temperature !== undefined ?
                          `${report.aqiData.temperature}${report.aqiData.temperatureUnit || '°C'}` :
                          'Not available'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <FiMapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                    </div>
                    <p className="text-gray-900 dark:text-white">{report.location?.name || 'N/A'}</p>
                  </div>
                </div>
              </section>

              {/* Health Status */}
              <section className="p-6 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div className="flex items-center mb-4">
                  <FiShield className="w-6 h-6 text-primary-500 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Health Status</h2>
                </div>
                <div className="space-y-4">
                  {/* Chronic Diseases Section */}
                  {report.report?.chronicDiseaseAnalysis?.map((disease, index) => {
                    // Get disease-specific recommendations
                    const getDiseaseRecommendations = (diseaseName, aqi, temp) => {
                      const recommendations = [];

                      // Asthma specific recommendations
                      if (diseaseName.toLowerCase().includes('asthma')) {
                        if (aqi > 100) {
                          recommendations.push('Use your rescue inhaler before going outside');
                          recommendations.push('Avoid outdoor exercise and physical activities');
                          recommendations.push('Keep windows closed and use air purifier');
                        }
                        if (temp > 30) {
                          recommendations.push('Stay in air-conditioned spaces');
                          recommendations.push('Avoid sudden temperature changes');
                        }
                        if (temp < 10) {
                          recommendations.push('Cover your mouth and nose when going outside');
                          recommendations.push('Warm up gradually before any physical activity');
                        }
                      }

                      // COPD specific recommendations
                      if (diseaseName.toLowerCase().includes('copd')) {
                        if (aqi > 50) {
                          recommendations.push('Use your prescribed inhalers as directed');
                          recommendations.push('Avoid areas with heavy traffic or industrial emissions');
                        }
                        if (temp > 30) {
                          recommendations.push('Stay hydrated and rest frequently');
                          recommendations.push('Avoid strenuous activities during hot hours');
                        }
                        if (temp < 10) {
                          recommendations.push('Keep your home warm and well-ventilated');
                          recommendations.push('Use a humidifier to prevent dry air');
                        }
                      }

                      // Sinusitis specific recommendations
                      if (diseaseName.toLowerCase().includes('sinusitis')) {
                        if (aqi > 50) {
                          recommendations.push('Use saline nasal sprays to keep nasal passages moist');
                          recommendations.push('Avoid exposure to smoke and strong odors');
                        }
                        if (temp > 30) {
                          recommendations.push('Stay hydrated to thin mucus');
                          recommendations.push('Use air conditioning to filter air');
                        }
                        if (temp < 10) {
                          recommendations.push('Use a humidifier to add moisture to indoor air');
                          recommendations.push('Keep your head covered when going outside');
                        }
                      }

                      // Sleep Apnea specific recommendations
                      if (diseaseName.toLowerCase().includes('sleep apnea')) {
                        if (aqi > 100) {
                          recommendations.push('Use your CPAP machine with a HEPA filter');
                          recommendations.push('Keep bedroom windows closed');
                        }
                        if (temp > 30) {
                          recommendations.push('Keep bedroom temperature between 18-21°C');
                          recommendations.push('Use air conditioning during sleep');
                        }
                        if (temp < 10) {
                          recommendations.push('Use a humidifier in your bedroom');
                          recommendations.push('Keep bedroom well-ventilated but warm');
                        }
                      }

                      return recommendations;
                    };

                    // Calculate current risk level based on conditions
                    const calculateRiskLevel = (diseaseName, aqi, temp) => {
                      // Base risk levels for different conditions
                      const baseRisks = {
                        'asthma': 'Moderate',
                        'copd': 'High',
                        'sinusitis': 'Moderate',
                        'sleep apnea': 'Low'
                      };

                      // Get base risk for the disease
                      const baseRisk = Object.entries(baseRisks).find(([key]) =>
                        diseaseName.toLowerCase().includes(key)
                      )?.[1] || 'Moderate';

                      // For good air quality (AQI <= 50), reduce the risk level
                      if (aqi <= 50) {
                        if (baseRisk === 'High') return 'Moderate';
                        if (baseRisk === 'Moderate') return 'Low';
                        return 'Low';
                      }

                      // For moderate air quality (50 < AQI <= 100), keep base risk
                      if (aqi <= 100) {
                        return baseRisk;
                      }

                      // For poor air quality (AQI > 100), increase the risk level
                      if (aqi > 100) {
                        if (baseRisk === 'Low') return 'Moderate';
                        if (baseRisk === 'Moderate') return 'High';
                        return 'High';
                      }

                      // Temperature adjustments
                      if (temp > 35 || temp < 5) {
                        return 'High';
                      }
                      if (temp > 30 || temp < 10) {
                        if (baseRisk === 'Low') return 'Moderate';
                        return baseRisk;
                      }

                      return baseRisk;
                    };

                    const diseaseRecommendations = getDiseaseRecommendations(
                      disease.diseaseName,
                      report.aqiData?.value || 0,
                      report.aqiData?.temperature || 0
                    );

                    const currentRiskLevel = calculateRiskLevel(
                      disease.diseaseName,
                      report.aqiData?.value || 0,
                      report.aqiData?.temperature || 0
                    );

                    return (
                      <div key={index} className="bg-white dark:bg-dark-800 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{disease.diseaseName}</h3>
                            <button 
                              onClick={() => speakText(`Recommendations for ${disease.diseaseName}. ${diseaseRecommendations.join('. ')}`, `disease-${index}`)}
                              className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                              aria-label={`Listen to recommendations for ${disease.diseaseName}`}
                            >
                              <FiVolume2 
                                className={`w-5 h-5 ${currentSpeakingId === `disease-${index}` ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`} 
                              />
                            </button>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentRiskLevel === 'High' ? 'bg-danger-100 text-danger-800' :
                              currentRiskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-success-100 text-success-800'
                            }`}>
                            {currentRiskLevel} Risk
                          </span>
                        </div>

                        {/* Air Quality and Temperature Impact */}
                        <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-dark-700">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Conditions Impact</h4>
                          <div className="space-y-2">
                            <p className="text-gray-600 dark:text-gray-400">
                              {report.aqiData?.value > 150 ?
                                `⚠️ Air Quality (AQI ${report.aqiData.value}) is POOR and may worsen your ${disease.diseaseName}.` :
                                report.aqiData?.value > 100 ?
                                  `⚠️ Air Quality (AQI ${report.aqiData.value}) is MODERATE and could affect your ${disease.diseaseName}.` :
                                  `✅ Air Quality (AQI ${report.aqiData.value}) is GOOD for your ${disease.diseaseName}.`
                              }
                            </p>
                            {report.aqiData?.temperature !== undefined && (
                              <p className="text-gray-600 dark:text-gray-400">
                                {report.aqiData.temperature > 30 ?
                                  `⚠️ High temperature (${report.aqiData.temperature}${report.aqiData.temperatureUnit}) may affect your condition.` :
                                  report.aqiData.temperature < 10 ?
                                    `⚠️ Low temperature (${report.aqiData.temperature}${report.aqiData.temperatureUnit}) may trigger symptoms.` :
                                    `✅ Temperature (${report.aqiData.temperature}${report.aqiData.temperatureUnit}) is comfortable.`
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Disease-Specific Recommendations */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recommendations for {disease.diseaseName}</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2">
                            {diseaseRecommendations.length > 0 ? (
                              diseaseRecommendations.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))
                            ) : (
                              <>
                                <li>Continue your normal activities</li>
                                <li>Keep taking your regular medications</li>
                                <li>Monitor your symptoms regularly</li>
                              </>
                            )}
                          </ul>
                        </div>

                        {/* Emergency Warning */}
                        {(report.aqiData?.value > 150 || report.aqiData?.temperature > 35 || report.aqiData?.temperature < 5) && (
                          <div className="mt-4 p-3 rounded-lg bg-danger-50 dark:bg-danger-900/30">
                            <h4 className="text-sm font-medium text-danger-600 dark:text-danger-400 mb-2">⚠️ Emergency Warning</h4>
                            <p className="text-sm text-danger-600 dark:text-danger-400">
                              Seek medical help immediately if you experience:
                            </p>
                            <ul className="list-disc list-inside text-sm text-danger-600 dark:text-danger-400 mt-2">
                              <li>Severe difficulty breathing</li>
                              <li>Chest pain or tightness</li>
                              <li>Sudden worsening of symptoms</li>
                              <li>Dizziness or confusion</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Health-Specific Recommendations */}
              <section className="p-6 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div className="flex items-center mb-6">
                  <FiShield className="w-6 h-6 text-primary-500 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Health Recommendations</h2>
                  <button 
                    onClick={() => speakText('Health Recommendations. The following are personalized recommendations based on your health profile and current air quality conditions.', 'health-recommendations')}
                    className="ml-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                    aria-label="Listen to health recommendations introduction"
                  >
                    <FiVolume2 
                      className={`w-5 h-5 ${currentSpeakingId === 'health-recommendations' ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`} 
                    />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your Symptom-Specific Guidance</h3>
                    <button 
                      onClick={() => speakText('Symptom-specific guidance based on your reported symptoms and current air quality conditions.', 'symptom-guidance')}
                      className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                      aria-label="Listen to symptom guidance introduction"
                    >
                      <FiVolume2 
                        className={`w-5 h-5 ${currentSpeakingId === 'symptom-guidance' ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`} 
                      />
                    </button>
                  </div>
                  {report.report?.healthSpecificRecommendations?.map((rec, index) => {
                    // Extract symptom name from the recommendation text
                    const symptomMatch = rec.match(/^([^:]+):/i);
                    const symptomName = symptomMatch ? symptomMatch[1].trim() : null;
                    const recommendation = symptomMatch ? rec.substring(symptomMatch[0].length).trim() : rec;

                    // Determine severity based on symptom name and AQI
                    const getSeverityInfo = () => {
                      const aqi = report.aqiData?.value || 0;

                      if (symptomName?.toLowerCase().includes('severe') || aqi > 150) {
                        return { level: 'High Priority', color: 'warning' };
                      } else if (symptomName?.toLowerCase().includes('moderate') || aqi > 100) {
                        return { level: 'Moderate Priority', color: 'primary' };
                      } else {
                        return { level: 'General Advice', color: 'success' };
                      }
                    };

                    const severityInfo = getSeverityInfo();

                    // Choose appropriate icon based on symptom type
                    const getSymptomIcon = () => {
                      const symptomLower = symptomName?.toLowerCase() || '';

                      if (symptomLower.includes('breath') || symptomLower.includes('cough') || symptomLower.includes('respiratory')) {
                        return (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                        );
                      } else if (symptomLower.includes('eye') || symptomLower.includes('vision')) {
                        return (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        );
                      } else if (symptomLower.includes('head') || symptomLower.includes('pain')) {
                        return (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m-6-8h6M9 1v1m0 10v1m0 8v1M1 9h1m8 0h1m8 0h1M4.6 4.6l.7.7m12.1-.7l-.7.7m0 11.4l.7.7m-12.1-.7l-.7.7" />
                        );
                      } else if (symptomLower.includes('skin') || symptomLower.includes('rash') || symptomLower.includes('itch')) {
                        return (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        );
                      } else {
                        return (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        );
                      }
                    };

                    return (
                      <div key={index} className="p-6 bg-white dark:bg-dark-800 rounded-lg shadow-md border border-gray-100 dark:border-dark-700">
                        <div className="flex items-center mb-4">
                          <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-${severityInfo.color}-100 text-${severityInfo.color}-600 dark:bg-${severityInfo.color}-800 dark:text-${severityInfo.color}-300 mr-3 shadow-sm`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              {getSymptomIcon()}
                            </svg>
                          </div>
                          <div>
                            {symptomName && (
                              <div className="flex items-center">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{symptomName}</h4>
                                <button 
                                  onClick={() => speakText(`${symptomName}. ${recommendation}`, `symptom-${index}`)}
                                  className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                                  aria-label={`Listen to recommendations for ${symptomName}`}
                                >
                                  <FiVolume2 
                                    className={`w-5 h-5 ${currentSpeakingId === `symptom-${index}` ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`} 
                                  />
                                </button>
                              </div>
                            )}
                            <div className="flex mt-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${severityInfo.color}-100 text-${severityInfo.color}-800 dark:bg-${severityInfo.color}-900 dark:text-${severityInfo.color}-300 border border-${severityInfo.color}-200 dark:border-${severityInfo.color}-800`}>
                                {severityInfo.level}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{recommendation}</p>
                        </div>

                        {/* Air quality context */}
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
                          <div className="flex items-center mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <h5 className="font-medium text-blue-700 dark:text-blue-300">Air Quality Context</h5>
                          </div>
                          <p className="ml-7 text-sm text-gray-700 dark:text-gray-300">
                            {report.aqiData?.value > 150 ?
                              `Current AQI of ${report.aqiData.value} may significantly worsen these symptoms. Consider staying indoors with air purification.` :
                              report.aqiData?.value > 100 ?
                                `Current AQI of ${report.aqiData.value} may affect these symptoms. Take precautions when outdoors.` :
                                `Current AQI of ${report.aqiData.value} is unlikely to severely impact these symptoms, but continue to monitor how you feel.`
                            }
                          </p>
                        </div>
                      </div>
                    );
                  }) || (
                      <div className="p-6 bg-white dark:bg-dark-800 rounded-lg shadow-md border border-gray-100 dark:border-dark-700 text-center">
                        <div className="flex justify-center mb-4">
                          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 dark:bg-dark-700 dark:text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No Symptom-Specific Recommendations</h4>
                        <p className="text-gray-500 dark:text-gray-400">
                          We don't have any specific recommendations for your current symptoms. Continue to monitor your health and follow general guidelines.
                        </p>
                      </div>
                    )}
                </div>

                {/* Chronic Disease Recommendations - Enhanced Section */}
                {report.healthStatus?.chronicDiseases && report.healthStatus.chronicDiseases.length > 0 && (
                  <div className="mt-8 space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Your Health Conditions Today</h3>
                    {report.chronicDiseaseRecommendations ? (
                      report.chronicDiseaseRecommendations.map((rec, index) => {
                        // Extract disease name from the recommendation text
                        const diseaseMatch = rec.match(/^([^:]+):/i);
                        const diseaseName = diseaseMatch ? diseaseMatch[1].trim() : null;
                        const recommendation = diseaseMatch ? rec.substring(diseaseMatch[0].length).trim() : rec;

                        return (
                          <div key={index} className="p-6 bg-white dark:bg-dark-800 rounded-lg shadow-md border border-gray-100 dark:border-dark-700">
                            <div className="flex items-center mb-4">
                              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-800 dark:text-primary-300 mr-3 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              </div>
                              <div>
                                {diseaseName && (
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{diseaseName}</h4>
                                )}
                                <div className="flex mt-1">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                                    Personalized Care
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{recommendation}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      report.healthStatus.chronicDiseases.map((disease, index) => {
                        // Determine risk level based on AQI and temperature
                        const getConditionRiskLevel = () => {
                          if (report.aqiData?.value > 150 || report.aqiData?.temperature > 35 || report.aqiData?.temperature < 5) {
                            return {
                              level: 'High Risk',
                              color: 'warning',
                              explanation: 'Current conditions may significantly affect your health'
                            };
                          } else if (report.aqiData?.value > 100 || report.aqiData?.temperature > 30 || report.aqiData?.temperature < 10) {
                            return {
                              level: 'Medium Risk',
                              color: 'primary',
                              explanation: 'Take extra precautions in these conditions'
                            };
                          } else {
                            return {
                              level: 'Low Risk',
                              color: 'success',
                              explanation: 'Conditions are favorable for your health today'
                            };
                          }
                        };

                        const riskLevel = getConditionRiskLevel();
                        const diseaseName = typeof disease === 'object' ? disease.name : disease;

                        // Get simple explanation based on disease type
                        const getSimpleExplanation = () => {
                          const lowerDisease = diseaseName.toLowerCase();

                          if (lowerDisease.includes('asthma')) {
                            return {
                              whatIs: "Asthma affects your airways and can make breathing difficult",
                              whyMatters: "Air pollution and temperature changes can trigger asthma symptoms"
                            };
                          } else if (lowerDisease.includes('copd')) {
                            return {
                              whatIs: "COPD makes it harder to breathe and can cause coughing and shortness of breath",
                              whyMatters: "Poor air quality can worsen COPD symptoms and may lead to flare-ups"
                            };
                          } else if (lowerDisease.includes('heart') || lowerDisease.includes('cardiac')) {
                            return {
                              whatIs: "Heart conditions affect how well your heart pumps blood through your body",
                              whyMatters: "Air pollution can strain your heart and cardiovascular system"
                            };
                          } else if (lowerDisease.includes('diabet')) {
                            return {
                              whatIs: "Diabetes affects how your body processes blood sugar",
                              whyMatters: "Environmental stress can affect blood sugar control"
                            };
                          } else if (lowerDisease.includes('allerg')) {
                            return {
                              whatIs: "Allergies are reactions to substances your body is sensitive to",
                              whyMatters: "Pollutants in the air can worsen allergy symptoms"
                            };
                          } else {
                            return {
                              whatIs: `${diseaseName} is a health condition that requires ongoing management`,
                              whyMatters: "Environmental factors like air quality and temperature can affect your symptoms"
                            };
                          }
                        };

                        const explanation = getSimpleExplanation();

                        return (
                          <div key={index} className="p-6 bg-white dark:bg-dark-800 rounded-lg shadow-md border border-gray-100 dark:border-dark-700">
                            {/* Header with icon and risk level */}
                            <div className="flex items-center mb-4">
                              <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-${riskLevel.color}-100 text-${riskLevel.color}-600 dark:bg-${riskLevel.color}-800 dark:text-${riskLevel.color}-300 mr-3 shadow-sm`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{diseaseName}</h4>
                                <div className="flex mt-1">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${riskLevel.color}-100 text-${riskLevel.color}-800 dark:bg-${riskLevel.color}-900 dark:text-${riskLevel.color}-300 border border-${riskLevel.color}-200 dark:border-${riskLevel.color}-800`}>
                                    {riskLevel.level} Today
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Simple explanation */}
                            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
                              <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">About Your Condition</h5>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{explanation.whatIs}</p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{explanation.whyMatters}</p>
                            </div>

                            {/* Today's impact */}
                            <div className="mb-4">
                              <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Today's Impact</h5>
                              <div className={`p-4 rounded-lg bg-${riskLevel.color}-50 dark:bg-${riskLevel.color}-900/20 border border-${riskLevel.color}-100 dark:border-${riskLevel.color}-800/30`}>
                                <div className="flex items-start">
                                  <div className={`flex-shrink-0 w-5 h-5 text-${riskLevel.color}-500 mt-0.5 mr-2`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{riskLevel.explanation}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {report.aqiData?.value > 150 ?
                                        `The current high AQI (${report.aqiData.value}) may significantly affect your ${diseaseName}.` :
                                        report.aqiData?.value > 100 ?
                                          `The moderate air pollution (AQI ${report.aqiData.value}) could affect your ${diseaseName}.` :
                                          `The current air quality (AQI ${report.aqiData.value}) is unlikely to severely impact your ${diseaseName}.`
                                      }
                                      {report.aqiData?.temperature > 35 ?
                                        ` The high temperature (${report.aqiData.temperature}°) may worsen your symptoms.` :
                                        report.aqiData?.temperature < 10 ?
                                          ` The low temperature (${report.aqiData.temperature}°) may trigger symptoms.` :
                                          ''
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* What to do */}
                            <div>
                              <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">What You Can Do Today</h5>
                              <ul className="space-y-2">
                                {diseaseName.toLowerCase().includes('asthma') && (
                                  <>
                                    <li className="flex items-start">
                                      <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <p className="text-gray-700 dark:text-gray-300">Keep your rescue inhaler with you at all times</p>
                                    </li>
                                    <li className="flex items-start">
                                      <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <p className="text-gray-700 dark:text-gray-300">Use your preventive medications as prescribed</p>
                                    </li>
                                    <li className="flex items-start">
                                      <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <p className="text-gray-700 dark:text-gray-300">Stay indoors during peak pollution hours (usually midday)</p>
                                    </li>
                                  </>
                                )}
                                {diseaseName.toLowerCase().includes('copd') && (
                                  <>
                                    <li className="flex items-start">
                                      <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <p className="text-gray-700 dark:text-gray-300">Practice pursed-lip breathing to improve airflow</p>
                                    </li>
                                    <li className="flex items-start">
                                      <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <p className="text-gray-700 dark:text-gray-300">Use supplemental oxygen as prescribed by your doctor</p>
                                    </li>
                                    <li className="flex items-start">
                                      <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <p className="text-gray-700 dark:text-gray-300">Avoid smoke, strong smells, and air pollution</p>
                                    </li>
                                  </>
                                )}
                                {(diseaseName.toLowerCase().includes('heart') || diseaseName.toLowerCase().includes('cardiac')) && (
                                  <>
                                    <li className="flex items-start">
                                      <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <p className="text-gray-700 dark:text-gray-300">Monitor your blood pressure regularly</p>
                                    </li>
                                    <li className="flex items-start">
                                      <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <p className="text-gray-700 dark:text-gray-300">Limit physical activity during high pollution days</p>
                                    </li>
                                    <li className="flex items-start">
                                      <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <p className="text-gray-700 dark:text-gray-300">Stay well-hydrated and reduce salt intake</p>
                                    </li>
                                  </>
                                )}
                                {diseaseName.toLowerCase().includes('allerg') && (
                                  <>
                                    <li className="flex items-start">
                                      <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <p className="text-gray-700 dark:text-gray-300">Take antihistamines before going outdoors</p>
                                    </li>
                                    <li className="flex items-start">
                                      <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <p className="text-gray-700 dark:text-gray-300">Shower after coming indoors to remove allergens</p>
                                    </li>
                                    <li className="flex items-start">
                                      <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <p className="text-gray-700 dark:text-gray-300">Keep windows closed during high pollen or pollution days</p>
                                    </li>
                                  </>
                                )}
                                {!diseaseName.toLowerCase().includes('asthma') &&
                                  !diseaseName.toLowerCase().includes('copd') &&
                                  !diseaseName.toLowerCase().includes('heart') &&
                                  !diseaseName.toLowerCase().includes('cardiac') &&
                                  !diseaseName.toLowerCase().includes('allerg') && (
                                    <>
                                      <li className="flex items-start">
                                        <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300">Continue taking your prescribed medications</p>
                                      </li>
                                      <li className="flex items-start">
                                        <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300">Monitor your symptoms and seek medical help if they worsen</p>
                                      </li>
                                      <li className="flex items-start">
                                        <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300">Limit exposure to environmental triggers like pollution</p>
                                      </li>
                                    </>
                                  )}
                              </ul>
                            </div>

                            {/* When to get help */}
                            <div className="mt-4 p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-100 dark:border-warning-800/30">
                              <div className="flex items-start">
                                <div className="flex-shrink-0 w-5 h-5 text-warning-500 mt-0.5 mr-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div>
                                  <h6 className="text-sm font-medium text-warning-800 dark:text-warning-300">When to Get Medical Help</h6>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Call your doctor or seek emergency care if you experience:
                                  </p>
                                  <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                                    <li>Severe difficulty breathing or shortness of breath</li>
                                    <li>Chest pain or pressure</li>
                                    <li>Unusual or severe symptoms</li>
                                    <li>Symptoms that don't improve with your usual medications</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Age-Specific Recommendations */}
                <div id="age-recommendations-section" className="mt-8">
                  <div className="flex items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Age-Specific Recommendations</h3>
                    <button 
                      onClick={() => {
                        const content = extractSectionContent('age-recommendations-section');
                        speakText(content, 'age-recommendations');
                      }}
                      className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                      aria-label="Listen to age-specific recommendations"
                    >
                      <FiVolume2 
                        className={`w-5 h-5 ${currentSpeakingId === 'age-recommendations' ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`} 
                      />
                    </button>
                  </div>
                  <div className="p-4 bg-white dark:bg-dark-800 rounded-lg shadow-sm">
                    {(() => {
                      const age = report.healthData?.age || 0;
                      const aqi = report.aqiData?.value || 0;
                      const temp = report.aqiData?.temperature || 0;
                      const chronicDiseases = report.healthData?.chronicDiseases || [];

                      // Determine age group
                      const ageGroup = age < 12 ? 'Child' :
                        age < 20 ? 'Teenager' :
                          age < 60 ? 'Adult' : 'Senior';

                      // Get personalized recommendations based on age group, health status, and air quality
                      const getRecommendations = () => {
                        const recommendations = {
                          dailyActivities: [],
                          precautions: [],
                          specialConsiderations: []
                        };

                        // Extract health conditions for easier reference
                        const hasAsthma = chronicDiseases.some(disease => {
                          const diseaseName = typeof disease === 'object' ? disease.name : disease;
                          return diseaseName.toLowerCase().includes('asthma');
                        });

                        const hasCOPD = chronicDiseases.some(disease => {
                          const diseaseName = typeof disease === 'object' ? disease.name : disease;
                          return diseaseName.toLowerCase().includes('copd');
                        });

                        const hasSinusitis = chronicDiseases.some(disease => {
                          const diseaseName = typeof disease === 'object' ? disease.name : disease;
                          return diseaseName.toLowerCase().includes('sinus');
                        });

                        const hasSleepApnea = chronicDiseases.some(disease => {
                          const diseaseName = typeof disease === 'object' ? disease.name : disease;
                          return diseaseName.toLowerCase().includes('sleep') || diseaseName.toLowerCase().includes('apnea');
                        });

                        const hasRespiratoryCondition = hasAsthma || hasCOPD || hasSinusitis;

                        // Personalized recommendations based on age group
                        switch (ageGroup) {
                          case 'Child':
                            // Daily activities based on AQI and health conditions
                            if (aqi > 150) {
                              recommendations.dailyActivities.push('Stay indoors with windows closed and air purifiers running');
                              recommendations.dailyActivities.push('Switch to indoor physical activities like yoga or stretching');
                            } else if (aqi > 100) {
                              recommendations.dailyActivities.push('Limit outdoor play to 30 minutes or less');
                              recommendations.dailyActivities.push('Choose indoor venues for birthday parties and playdates');
                            } else if (aqi > 50 && hasRespiratoryCondition) {
                              recommendations.dailyActivities.push('Take a 5-minute break every 20 minutes during outdoor play');
                              recommendations.dailyActivities.push('Have indoor backup activities ready if symptoms appear');
                            } else {
                              recommendations.dailyActivities.push('Enjoy outdoor activities, but keep an eye on changing conditions');
                              if (hasRespiratoryCondition) {
                                recommendations.dailyActivities.push('Schedule more demanding activities when air quality is best (usually morning)');
                              }
                            }

                            // Precautions based on health conditions and temperature
                            if (hasAsthma) {
                              recommendations.precautions.push('Use preventive inhaler 15-20 minutes before outdoor activities');
                              if (temp < 10) {
                                recommendations.precautions.push('Cover mouth and nose with a scarf when outdoors (cold air can trigger asthma)');
                              }
                            }

                            if (hasSinusitis && aqi > 50) {
                              recommendations.precautions.push('Use saline nasal spray before and after outdoor exposure');
                            }

                            if (temp > 30) {
                              recommendations.precautions.push('Drink water every 30 minutes during outdoor activities');
                            }

                            // Special considerations
                            if (hasRespiratoryCondition) {
                              recommendations.specialConsiderations.push('Ensure school staff are aware of your child\'s condition and action plan');
                              recommendations.specialConsiderations.push('Pack rescue medication in an easily accessible pocket of their backpack');
                            }
                            break;

                          case 'Teenager':
                            // Daily activities based on AQI and health conditions
                            if (aqi > 150) {
                              recommendations.dailyActivities.push('Move team practices and training indoors');
                              recommendations.dailyActivities.push('Consider rescheduling outdoor competitions until air quality improves');
                            } else if (aqi > 100) {
                              if (hasRespiratoryCondition) {
                                recommendations.dailyActivities.push('Reduce intensity of workouts to 50-60% of normal effort');
                                recommendations.dailyActivities.push('Take twice the normal rest periods between exercise sets');
                              } else {
                                recommendations.dailyActivities.push('Reduce high-intensity outdoor training duration by 30%');
                              }
                            } else if (aqi > 50 && hasRespiratoryCondition) {
                              recommendations.dailyActivities.push('Use your peak flow meter before and after exercise to monitor lung function');
                              recommendations.dailyActivities.push('Have a 10-minute warm-up and cool-down period for all activities');
                            } else {
                              if (hasRespiratoryCondition) {
                                recommendations.dailyActivities.push('Current conditions are good for your regular activities with normal precautions');
                              } else {
                                recommendations.dailyActivities.push('Enjoy your regular activities without air quality restrictions');
                              }
                            }

                            // Precautions based on specific health conditions
                            if (hasAsthma) {
                              if (aqi > 100) {
                                recommendations.precautions.push('Use N95 mask for brief necessary outdoor exposure');
                                recommendations.precautions.push('Pre-medicate with rescue inhaler 15 minutes before outdoor activity');
                              } else if (aqi > 50) {
                                recommendations.precautions.push('Keep rescue inhaler in an easily accessible pocket, not in a backpack');
                              }
                            }

                            if (hasCOPD) {
                              recommendations.precautions.push('Monitor oxygen saturation levels during and after physical activity');
                              if (aqi > 50) {
                                recommendations.precautions.push('Use pursed-lip breathing technique during outdoor activities');
                              }
                            }

                            if (hasSinusitis) {
                              recommendations.precautions.push('Use a saline nasal rinse after outdoor exposure');
                            }

                            if (hasSleepApnea) {
                              recommendations.precautions.push('Ensure CPAP filters are clean and replaced regularly during poor air quality');
                            }

                            // Special considerations
                            if (hasRespiratoryCondition) {
                              recommendations.specialConsiderations.push('Create an emergency action plan with coaches and school staff');
                              recommendations.specialConsiderations.push('Track your symptoms in relation to air quality using a mobile app');
                            }
                            break;

                          case 'Adult':
                            // Daily activities based on work and lifestyle
                            if (aqi > 150) {
                              recommendations.dailyActivities.push('Work from home if possible');
                              if (hasRespiratoryCondition) {
                                recommendations.dailyActivities.push('Reschedule non-essential outdoor appointments and errands');
                              }
                            } else if (aqi > 100) {
                              recommendations.dailyActivities.push('Schedule outdoor work during early morning hours when pollution is lower');
                              if (hasRespiratoryCondition) {
                                recommendations.dailyActivities.push('Take 10-minute indoor breaks every hour during outdoor work');
                              }
                            } else if (aqi > 50 && hasRespiratoryCondition) {
                              recommendations.dailyActivities.push('Maintain normal work schedule but keep medications readily available');
                            } else {
                              recommendations.dailyActivities.push('Current conditions allow for normal daily activities');
                            }

                            // Precautions based on specific health conditions
                            if (hasAsthma) {
                              if (aqi > 100) {
                                recommendations.precautions.push('Double-check that you have rescue medication at home, work, and in your vehicle');
                              }
                              if (temp < 10 || temp > 30) {
                                recommendations.precautions.push('Adjust medication dosage as prescribed by your doctor for extreme temperatures');
                              }
                            }

                            if (hasCOPD) {
                              if (aqi > 50) {
                                recommendations.precautions.push('Use supplemental oxygen as prescribed during outdoor activities');
                                recommendations.precautions.push('Practice energy conservation techniques for essential tasks');
                              }
                            }

                            // Special considerations for work environment
                            if (hasRespiratoryCondition) {
                              recommendations.specialConsiderations.push('Discuss flexible work arrangements with your employer during poor air quality');
                              recommendations.specialConsiderations.push('Consider using air quality as a factor in your commute planning');
                            }
                            break;

                          case 'Senior':
                            // Daily activities adjusted for mobility and health
                            if (aqi > 100) {
                              recommendations.dailyActivities.push('Postpone non-essential outdoor activities like gardening');
                              recommendations.dailyActivities.push('Arrange for grocery and medication delivery services');
                            } else if (aqi > 50 && hasRespiratoryCondition) {
                              recommendations.dailyActivities.push('Limit outdoor activities to 15-20 minutes at a time');
                              recommendations.dailyActivities.push('Schedule medical appointments during better air quality days when possible');
                            } else {
                              if (hasRespiratoryCondition) {
                                recommendations.dailyActivities.push('Enjoy light outdoor activities like walking during morning hours');
                              } else {
                                recommendations.dailyActivities.push('Current conditions are suitable for your normal daily routine');
                              }
                            }

                            // Precautions for specific health conditions
                            if (hasAsthma || hasCOPD) {
                              if (aqi > 50) {
                                recommendations.precautions.push('Keep all windows closed and use air purifiers with HEPA filters');
                                recommendations.precautions.push('Consider using a portable oxygen concentrator for outings');
                              }
                            }

                            if (hasSleepApnea) {
                              recommendations.precautions.push('Ensure bedroom air quality is optimal with air purifiers running 2 hours before bedtime');
                            }

                            // Special considerations
                            recommendations.specialConsiderations.push('Have a buddy system in place for checking in during poor air quality days');
                            if (hasRespiratoryCondition) {
                              recommendations.specialConsiderations.push('Keep a 7-day supply of all medications readily available');
                            }
                            break;
                        }

                        // Add chronic disease considerations
                        if (chronicDiseases && chronicDiseases.length > 0) {
                          const diseaseNames = chronicDiseases.map(disease =>
                            typeof disease === 'object' ? disease.name || 'Unknown Condition' : disease
                          ).filter(name => name !== 'Unknown Condition');

                          if (diseaseNames.length > 0) {
                            recommendations.specialConsiderations.push(
                              `Special attention needed for: ${diseaseNames.join(', ')}`
                            );
                          }
                        }

                        return recommendations;
                      };

                      const recommendations = getRecommendations();

                      // Determine air quality impact based on age group and health conditions
                      const getAirQualityImpact = () => {
                        let impactLevel = 'Low';
                        let impactDescription = '';
                        let actionableAdvice = '';

                        // Base impact level on AQI
                        if (aqi > 150) {
                          impactLevel = 'High';
                        } else if (aqi > 100) {
                          impactLevel = 'Moderate';
                        } else {
                          impactLevel = 'Low';
                        }

                        // Extract respiratory conditions
                        const respiratoryConditions = chronicDiseases.filter(disease => {
                          const diseaseName = typeof disease === 'object' ? disease.name : disease;
                          return diseaseName.toLowerCase().includes('asthma') ||
                            diseaseName.toLowerCase().includes('copd') ||
                            diseaseName.toLowerCase().includes('respiratory') ||
                            diseaseName.toLowerCase().includes('lung') ||
                            diseaseName.toLowerCase().includes('sinus');
                        });

                        const hasRespiratoryCondition = respiratoryConditions.length > 0;

                        // Personalized impact assessment based on age and health
                        switch (ageGroup) {
                          case 'Child':
                            if (hasRespiratoryCondition) {
                              impactLevel = aqi > 100 ? 'High' : aqi > 50 ? 'Moderate' : 'Low-Moderate';
                              impactDescription = `With your child's ${respiratoryConditions.map(d => typeof d === 'object' ? d.name : d).join('/')}`;
                            } else {
                              impactLevel = aqi > 150 ? 'High' : aqi > 100 ? 'Moderate' : 'Low';
                              impactDescription = 'For your child';
                            }
                            break;

                          case 'Teenager':
                            if (hasRespiratoryCondition) {
                              impactLevel = aqi > 100 ? 'High' : aqi > 50 ? 'Moderate' : 'Low-Moderate';

                              // Get specific condition names for personalization
                              const conditionNames = respiratoryConditions.map(d =>
                                typeof d === 'object' ? d.name : d
                              );

                              // Create personalized description
                              if (conditionNames.length === 1) {
                                impactDescription = `With your ${conditionNames[0]}`;
                              } else {
                                impactDescription = `With your respiratory conditions`;
                              }
                            } else {
                              impactLevel = aqi > 150 ? 'High' : aqi > 100 ? 'Moderate' : 'Low';
                              impactDescription = 'For active teenagers';
                            }
                            break;

                          case 'Adult':
                            if (hasRespiratoryCondition) {
                              impactLevel = aqi > 100 ? 'High' : aqi > 50 ? 'Moderate' : 'Low';
                              impactDescription = `With your respiratory health concerns`;
                            } else {
                              impactLevel = aqi > 150 ? 'High' : aqi > 100 ? 'Moderate' : 'Low';
                              impactDescription = 'For adults';
                            }
                            break;

                          case 'Senior':
                            if (hasRespiratoryCondition) {
                              impactLevel = aqi > 100 ? 'High' : 'Moderate';
                              impactDescription = `With your respiratory health concerns`;
                            } else {
                              impactLevel = aqi > 150 ? 'High' : aqi > 50 ? 'Moderate' : 'Low';
                              impactDescription = 'For seniors';
                            }
                            break;
                        }

                        // Add actionable advice based on impact level
                        if (impactLevel === 'High' || impactLevel === 'Very High') {
                          actionableAdvice = hasRespiratoryCondition ?
                            "Today's air quality requires you to take your medications as prescribed and limit outdoor exposure." :
                            "Consider rescheduling strenuous outdoor activities for another day.";
                        } else if (impactLevel === 'Moderate') {
                          actionableAdvice = hasRespiratoryCondition ?
                            "Keep rescue medications handy and monitor how you feel during outdoor activities." :
                            "You may continue normal activities, but take breaks if you feel any discomfort.";
                        } else {
                          actionableAdvice = hasRespiratoryCondition ?
                            "Current air quality is generally good, but still follow your regular treatment plan." :
                            "Today's air quality is good for your regular activities.";
                        }

                        return { impactLevel, impactDescription, actionableAdvice };
                      };

                      const airQualityImpact = getAirQualityImpact();

                      return (
                        <>
                          <div className="mb-3">
                            <h4 className="font-medium text-primary-600 dark:text-primary-400 mb-2">
                              Age Group: {ageGroup}
                            </h4>
                          </div>

                          {/* Air Quality Impact Section */}
                          <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-dark-700">
                            <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Today's Air Quality Impact</h5>
                            <div className="flex items-center mb-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium mr-2 ${airQualityImpact.impactLevel === 'Very High' ? 'bg-red-600 text-white' :
                                  airQualityImpact.impactLevel === 'High' ? 'bg-danger-500 text-white' :
                                    airQualityImpact.impactLevel === 'Moderate' ? 'bg-yellow-500 text-white' :
                                      airQualityImpact.impactLevel === 'Low-Moderate' ? 'bg-yellow-400 text-white' :
                                        'bg-success-500 text-white'
                                }`}>
                                {airQualityImpact.impactLevel} Impact
                              </span>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                AQI: {aqi}
                              </span>
                            </div>

                            {/* Direct advice based on conditions */}
                            <div className="p-3 bg-white dark:bg-dark-800 rounded-md mb-3">
                              <div className="flex items-start">
                                <div className="mr-3 mt-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <p className="text-gray-800 dark:text-gray-200 font-medium">
                                  {airQualityImpact.actionableAdvice}
                                </p>
                              </div>
                            </div>

                            {/* Personalized context */}
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">{airQualityImpact.impactDescription}</span> -
                              {aqi > 150 ?
                                "The current air quality is unhealthy and requires special attention." :
                                aqi > 100 ?
                                  "The current air quality may cause discomfort with prolonged exposure." :
                                  aqi > 50 ?
                                    "The current air quality is moderate and generally acceptable." :
                                    "The current air quality is good with minimal health concerns."
                              }
                            </p>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Daily Activities</h5>
                              {recommendations.dailyActivities.length > 0 ? (
                                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  {recommendations.dailyActivities.map((activity, index) => (
                                    <li key={index}>{activity}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  No specific daily activities recommended at this time.
                                </p>
                              )}
                            </div>

                            <div>
                              <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Precautions</h5>
                              {recommendations.precautions.length > 0 ? (
                                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  {recommendations.precautions.map((precaution, index) => (
                                    <li key={index}>{precaution}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Current conditions are favorable. No special precautions needed at this time.
                                </p>
                              )}
                            </div>

                            <div>
                              <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Special Considerations</h5>
                              {recommendations.specialConsiderations.length > 0 ? (
                                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  {recommendations.specialConsiderations.map((consideration, index) => (
                                    <li key={index}>{consideration}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  No special considerations needed at this time.
                                </p>
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Outdoor Activity Safety */}
                <div id="outdoor-activity-section" className="mt-8">
                  <div className="flex items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your Outdoor Activity Guide</h3>
                    <button 
                      onClick={() => {
                        const content = extractSectionContent('outdoor-activity-section');
                        speakText(content, 'outdoor-activity');
                      }}
                      className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                      aria-label="Listen to outdoor activity guide"
                    >
                      <FiVolume2 
                        className={`w-5 h-5 ${currentSpeakingId === 'outdoor-activity' ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`} 
                      />
                    </button>
                  </div>
                  <div className="p-4 bg-white dark:bg-dark-800 rounded-lg shadow-sm">
                    {(() => {
                      // Get user's health data
                      const age = report.healthData?.age || 0;
                      const aqi = report.aqiData?.value || 0;
                      const temp = report.aqiData?.temperature || 0;
                      const chronicDiseases = report.healthData?.chronicDiseases || [];
                      const symptoms = report.healthData?.symptoms || [];

                      // Extract specific conditions
                      const hasAsthma = chronicDiseases.some(disease => {
                        const diseaseName = typeof disease === 'object' ? disease.name : disease;
                        return diseaseName.toLowerCase().includes('asthma');
                      });

                      const hasCOPD = chronicDiseases.some(disease => {
                        const diseaseName = typeof disease === 'object' ? disease.name : disease;
                        return diseaseName.toLowerCase().includes('copd');
                      });

                      const hasRespiratoryCondition = chronicDiseases.some(disease => {
                        const diseaseName = typeof disease === 'object' ? disease.name : disease;
                        return diseaseName.toLowerCase().includes('asthma') ||
                          diseaseName.toLowerCase().includes('copd') ||
                          diseaseName.toLowerCase().includes('respiratory') ||
                          diseaseName.toLowerCase().includes('lung') ||
                          diseaseName.toLowerCase().includes('sinus');
                      });

                      const hasHeartCondition = chronicDiseases.some(disease => {
                        const diseaseName = typeof disease === 'object' ? disease.name : disease;
                        return diseaseName.toLowerCase().includes('heart') ||
                          diseaseName.toLowerCase().includes('cardiac') ||
                          diseaseName.toLowerCase().includes('hypertension');
                      });

                      const hasAllergies = chronicDiseases.some(disease => {
                        const diseaseName = typeof disease === 'object' ? disease.name : disease;
                        return diseaseName.toLowerCase().includes('allerg');
                      });

                      // Check for relevant symptoms
                      const hasBreathingSymptoms = symptoms.some(symptom =>
                        symptom.toLowerCase().includes('breath') ||
                        symptom.toLowerCase().includes('cough') ||
                        symptom.toLowerCase().includes('wheez')
                      );

                      // Determine age group for specific recommendations
                      const ageGroup = age < 12 ? 'Child' :
                        age < 20 ? 'Teenager' :
                          age < 60 ? 'Adult' : 'Senior';

                      // Determine outdoor activity safety
                      const getOutdoorActivityGuidance = () => {
                        let isSafe = true;
                        let safetyLevel = "";
                        let recommendation = "";
                        let timeLimit = "";
                        let bestTimeOfDay = "";
                        let specificActivities = [];

                        // Determine safety level based on AQI and health conditions
                        if (aqi > 300) {
                          isSafe = false;
                          safetyLevel = "Hazardous";
                        } else if (aqi > 200) {
                          isSafe = false;
                          safetyLevel = "Very Unhealthy";
                        } else if (aqi > 150) {
                          isSafe = hasRespiratoryCondition || hasHeartCondition || hasBreathingSymptoms || age > 65 || age < 12 ? false : false;
                          safetyLevel = "Unhealthy";
                        } else if (aqi > 100) {
                          isSafe = hasRespiratoryCondition || hasHeartCondition || hasBreathingSymptoms || age > 65 || age < 12 ? false : true;
                          safetyLevel = "Unhealthy for Sensitive Groups";
                        } else if (aqi > 50) {
                          isSafe = (hasAsthma && hasBreathingSymptoms) || (hasCOPD && hasBreathingSymptoms) ? false : true;
                          safetyLevel = "Moderate";
                        } else {
                          isSafe = true;
                          safetyLevel = "Good";
                        }

                        // Adjust for extreme temperatures
                        if (temp > 35) {
                          isSafe = hasRespiratoryCondition || hasHeartCondition || age > 65 || age < 12 ? false : false;
                          safetyLevel = safetyLevel === "Good" ? "Caution - High Heat" : safetyLevel;
                        } else if (temp < 5) {
                          isSafe = hasRespiratoryCondition || hasHeartCondition ? false : isSafe;
                          safetyLevel = safetyLevel === "Good" ? "Caution - Cold" : safetyLevel;
                        }

                        // Set time limits based on conditions
                        if (!isSafe) {
                          timeLimit = "Avoid outdoor activities";
                        } else if (safetyLevel === "Moderate") {
                          if (hasRespiratoryCondition) {
                            timeLimit = "Limit to 30-45 minutes";
                          } else if (age > 65 || age < 12) {
                            timeLimit = "Limit to 1-2 hours with breaks";
                          } else {
                            timeLimit = "No specific time limit, but take breaks as needed";
                          }
                        } else {
                          timeLimit = "No specific time limit needed";
                        }

                        // Determine best time of day
                        if (aqi > 100 || temp > 30) {
                          bestTimeOfDay = "Early morning (before 8 AM)";
                        } else if (temp < 10) {
                          bestTimeOfDay = "Midday (11 AM - 2 PM)";
                        } else {
                          bestTimeOfDay = "Any time of day is suitable";
                        }

                        // Recommend specific activities based on conditions
                        if (isSafe) {
                          if (hasRespiratoryCondition) {
                            if (aqi > 100) {
                              specificActivities = ["Light walking in areas away from traffic", "Gentle stretching in parks with good tree cover"];
                            } else if (aqi > 50) {
                              specificActivities = ["Walking at a comfortable pace", "Leisurely cycling", "Gardening with a mask"];
                            } else {
                              specificActivities = ["Most activities are suitable", "Consider swimming (good for respiratory health)", "Hiking in natural areas"];
                            }
                          } else if (ageGroup === "Child") {
                            if (aqi > 100) {
                              specificActivities = ["Indoor playground activities", "Brief outdoor play in green spaces"];
                            } else {
                              specificActivities = ["Playground activities", "Cycling in parks", "Organized sports with breaks"];
                            }
                          } else if (ageGroup === "Senior") {
                            specificActivities = ["Walking in parks with seating areas", "Gentle tai chi or yoga", "Gardening during cooler hours"];
                          } else {
                            if (aqi > 100) {
                              specificActivities = ["Low-intensity activities", "Short duration exercise", "Activities in areas with good air circulation"];
                            } else {
                              specificActivities = ["Most outdoor activities are suitable", "Consider intensity based on your fitness level"];
                            }
                          }
                        } else {
                          specificActivities = ["Indoor activities recommended", "Home exercises", "Mall walking", "Indoor swimming"];
                        }

                        // Generate personalized recommendation
                        if (!isSafe) {
                          if (hasRespiratoryCondition) {
                            const conditions = chronicDiseases
                              .filter(disease => {
                                const diseaseName = typeof disease === 'object' ? disease.name : disease;
                                return diseaseName.toLowerCase().includes('asthma') ||
                                  diseaseName.toLowerCase().includes('copd') ||
                                  diseaseName.toLowerCase().includes('respiratory');
                              })
                              .map(disease => typeof disease === 'object' ? disease.name : disease);

                            const conditionText = conditions.length === 1
                              ? conditions[0]
                              : "respiratory conditions";

                            recommendation = `With your ${conditionText}, outdoor activities are not recommended today. The current air quality (AQI ${aqi}) and conditions could trigger symptoms or worsen your condition. Consider indoor alternatives and ensure good indoor air quality with air purifiers if available.`;
                          } else if (hasAllergies && aqi > 50) {
                            recommendation = `Due to your allergies and the current air quality (AQI ${aqi}), outdoor activities may trigger symptoms. If you must go outside, wear a mask and limit your exposure time. Consider taking your allergy medication before going outdoors.`;
                          } else if (hasHeartCondition) {
                            recommendation = `With your heart condition, today's environmental conditions (AQI ${aqi}${temp > 30 ? ", high temperature" : temp < 10 ? ", low temperature" : ""}) could put additional strain on your cardiovascular system. Indoor activities are recommended today.`;
                          } else if (ageGroup === "Child" || ageGroup === "Senior") {
                            recommendation = `As a ${ageGroup.toLowerCase()}, your body may be more sensitive to today's air quality (AQI ${aqi}). Indoor activities are safer today. If outdoor time is necessary, keep it brief and avoid exertion.`;
                          } else {
                            recommendation = `Today's air quality (AQI ${aqi}) is in the ${safetyLevel} range. It's best to reschedule strenuous outdoor activities or move them indoors. If you must be outside, wear appropriate protection and limit exposure time.`;
                          }
                        } else if (safetyLevel === "Moderate" || safetyLevel.includes("Caution")) {
                          if (hasRespiratoryCondition) {
                            recommendation = `With your respiratory health history, you can engage in light outdoor activities today, but be mindful of the ${safetyLevel.toLowerCase()} conditions (AQI ${aqi}). ${timeLimit}. Carry any rescue medications and be attentive to how your body responds.`;
                          } else if (hasAllergies) {
                            recommendation = `With your allergies, today's conditions are manageable but stay alert to any symptoms. Consider taking preventive medication before outdoor activities and have remedies available if needed.`;
                          } else {
                            recommendation = `Today's conditions are generally acceptable for outdoor activities with some precautions. ${timeLimit}. ${bestTimeOfDay} would be optimal for your outdoor plans.`;
                          }
                        } else {
                          if (hasRespiratoryCondition) {
                            recommendation = `Good news! Today's air quality (AQI ${aqi}) is favorable for your outdoor activities despite your respiratory condition. Still, carry any necessary medications and stay aware of changing conditions.`;
                          } else {
                            recommendation = `Today's air quality (AQI ${aqi}) is excellent for all outdoor activities. Enjoy your time outside without specific air quality restrictions. ${bestTimeOfDay} would be most comfortable based on temperature.`;
                          }
                        }

                        return { isSafe, safetyLevel, recommendation, timeLimit, bestTimeOfDay, specificActivities };
                      };

                      const outdoorGuidance = getOutdoorActivityGuidance();

                      // Determine status color based on safety level
                      const getStatusColor = (safetyLevel) => {
                        switch (safetyLevel) {
                          case "Hazardous":
                            return "from-purple-900 to-purple-700";
                          case "Very Unhealthy":
                            return "from-purple-700 to-red-700";
                          case "Unhealthy":
                            return "from-red-600 to-red-500";
                          case "Unhealthy for Sensitive Groups":
                            return "from-orange-500 to-orange-400";
                          case "Moderate":
                            return "from-yellow-500 to-yellow-400";
                          case "Caution - High Heat":
                            return "from-orange-500 to-yellow-500";
                          case "Caution - Cold":
                            return "from-blue-500 to-blue-400";
                          case "Good":
                            return "from-green-500 to-green-400";
                          default:
                            return "from-gray-500 to-gray-400";
                        }
                      };

                      const statusColor = getStatusColor(outdoorGuidance.safetyLevel);
                      const textColor = outdoorGuidance.safetyLevel === "Good" ||
                        outdoorGuidance.safetyLevel === "Moderate" ||
                        outdoorGuidance.safetyLevel === "Caution - Cold" ?
                        "text-gray-800" : "text-white";

                      return (
                        <>
                          <div className="mb-4">
                            <div className={`bg-gradient-to-r ${statusColor} rounded-lg p-4 shadow-md`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-white bg-opacity-20 ${textColor} mr-4`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h4 className={`font-bold ${textColor}`}>{outdoorGuidance.safetyLevel}</h4>
                                    <p className={`text-sm ${textColor} opacity-90`}>AQI: {aqi} | Temp: {temp}°C</p>
                                  </div>
                                </div>
                                <div className={`px-4 py-2 rounded-full ${outdoorGuidance.isSafe ? 'bg-white bg-opacity-20 text-white' : 'bg-white bg-opacity-20 text-white'}`}>
                                  {outdoorGuidance.isSafe ? 'Safe with Precautions' : 'Limited Safety'}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg mb-4">
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {outdoorGuidance.recommendation}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div className="p-3 bg-white dark:bg-dark-800 rounded-lg border border-gray-100 dark:border-dark-700">
                              <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Recommended Time Limit</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{outdoorGuidance.timeLimit}</p>
                            </div>

                            <div className="p-3 bg-white dark:bg-dark-800 rounded-lg border border-gray-100 dark:border-dark-700">
                              <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Best Time of Day</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{outdoorGuidance.bestTimeOfDay}</p>
                            </div>
                          </div>

                          {outdoorGuidance.specificActivities.length > 0 && (
                            <div className="mt-4">
                              <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Suggested Activities</h5>
                              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                {outdoorGuidance.specificActivities.map((activity, index) => (
                                  <li key={index}>{activity}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Mask Recommendations */}
                <div id="mask-guidance-section" className="mt-8">
                  <div className="flex items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your Personalized Mask Guidance</h3>
                    <button 
                      onClick={() => {
                        const content = extractSectionContent('mask-guidance-section');
                        speakText(content, 'mask-guidance');
                      }}
                      className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                      aria-label="Listen to mask guidance"
                    >
                      <FiVolume2 
                        className={`w-5 h-5 ${currentSpeakingId === 'mask-guidance' ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`} 
                      />
                    </button>
                  </div>
                  <div className="p-4 bg-white dark:bg-dark-800 rounded-lg shadow-sm">
                    {(() => {
                      // Get user's health data
                      const age = report.healthData?.age || 0;
                      const aqi = report.aqiData?.value || 0;
                      const chronicDiseases = report.healthData?.chronicDiseases || [];
                      const symptoms = report.healthData?.symptoms || [];

                      // Extract specific conditions
                      const hasAsthma = chronicDiseases.some(disease => {
                        const diseaseName = typeof disease === 'object' ? disease.name : disease;
                        return diseaseName.toLowerCase().includes('asthma');
                      });

                      const hasCOPD = chronicDiseases.some(disease => {
                        const diseaseName = typeof disease === 'object' ? disease.name : disease;
                        return diseaseName.toLowerCase().includes('copd');
                      });

                      const hasRespiratoryCondition = chronicDiseases.some(disease => {
                        const diseaseName = typeof disease === 'object' ? disease.name : disease;
                        return diseaseName.toLowerCase().includes('asthma') ||
                          diseaseName.toLowerCase().includes('copd') ||
                          diseaseName.toLowerCase().includes('respiratory') ||
                          diseaseName.toLowerCase().includes('lung') ||
                          diseaseName.toLowerCase().includes('sinus');
                      });

                      // Check for relevant symptoms
                      const hasBreathingSymptoms = symptoms.some(symptom =>
                        symptom.toLowerCase().includes('breath') ||
                        symptom.toLowerCase().includes('cough') ||
                        symptom.toLowerCase().includes('wheez')
                      );

                      // Determine mask recommendation
                      const getMaskRecommendation = () => {
                        let isRecommended = false;
                        let maskType = "";
                        let reason = "";
                        let usage = "";

                        // Base recommendation on AQI
                        if (aqi > 150) {
                          isRecommended = true;
                          maskType = hasRespiratoryCondition ? "N95 respirator" : "KN95 or surgical mask";
                          reason = "Very unhealthy air quality";
                        } else if (aqi > 100) {
                          isRecommended = hasRespiratoryCondition || hasBreathingSymptoms || age > 65 || age < 12;
                          maskType = hasRespiratoryCondition ? "N95 respirator" : "Surgical mask";
                          reason = "Unhealthy air quality for sensitive groups";
                        } else if (aqi > 50) {
                          isRecommended = hasAsthma || hasCOPD || hasBreathingSymptoms;
                          maskType = "Surgical mask";
                          reason = "Moderate air quality";
                        } else {
                          isRecommended = false;
                          maskType = "";
                          reason = "Good air quality";
                        }

                        // Personalize the usage guidance
                        if (isRecommended) {
                          if (hasRespiratoryCondition) {
                            const conditions = chronicDiseases
                              .filter(disease => {
                                const diseaseName = typeof disease === 'object' ? disease.name : disease;
                                return diseaseName.toLowerCase().includes('asthma') ||
                                  diseaseName.toLowerCase().includes('copd') ||
                                  diseaseName.toLowerCase().includes('respiratory') ||
                                  diseaseName.toLowerCase().includes('lung');
                              })
                              .map(disease => typeof disease === 'object' ? disease.name : disease);

                            const conditionText = conditions.length === 1
                              ? conditions[0]
                              : "respiratory conditions";

                            usage = `With your ${conditionText}, wearing a ${maskType} will help filter out harmful particles that could trigger symptoms. Make sure it fits snugly around your face without gaps.`;

                            if (hasAsthma || hasCOPD) {
                              usage += " If you feel any breathing difficulty while wearing the mask, take short breaks in a clean air environment.";
                            }
                          } else if (hasBreathingSymptoms) {
                            usage = `Since you're experiencing respiratory symptoms, a ${maskType} will help protect your airways from further irritation. Wear it whenever you go outside.`;
                          } else if (age > 65) {
                            usage = `As a senior, your respiratory system may be more sensitive to air pollution. A ${maskType} provides good protection when you need to be outdoors.`;
                          } else if (age < 12) {
                            usage = `For your child, find a properly sized ${maskType} that fits comfortably. Ensure they can breathe easily and take breaks from mask-wearing when in clean air environments.`;
                          } else {
                            usage = `Based on the current air quality (AQI ${aqi}), wearing a ${maskType} is recommended during outdoor activities, especially if they last more than 30 minutes.`;
                          }
                        } else {
                          if (hasRespiratoryCondition) {
                            usage = `Current air quality is good (AQI ${aqi}), so masks are optional. However, if you notice any symptoms of your condition, consider wearing a mask as a precaution.`;
                          } else {
                            usage = `With the current good air quality (AQI ${aqi}), masks are not necessary for most outdoor activities.`;
                          }
                        }

                        return { isRecommended, maskType, reason, usage };
                      };

                      const maskRec = getMaskRecommendation();

                      return (
                        <>
                          <div className="mb-4">
                            <div className="p-6 bg-gray-50 dark:bg-dark-700 rounded-lg shadow-md">
                              <div className="flex items-center mb-4">
                                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${maskRec.isRecommended ? 'bg-warning-100 text-warning-600 dark:bg-warning-800 dark:text-warning-300' : 'bg-success-100 text-success-600 dark:bg-success-800 dark:text-success-300'} mr-3 shadow-sm`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                      {maskRec.isRecommended ? 'Mask Recommended' : 'Mask Optional'}
                                    </h4>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${maskRec.isRecommended ? 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300 border border-warning-200 dark:border-warning-800' : 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300 border border-success-200 dark:border-success-800'}`}>
                                      {maskRec.isRecommended ? 'Important' : 'Optional'}
                                    </span>
                                  </div>
                                  {maskRec.reason && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {maskRec.reason}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 p-4 bg-white dark:bg-dark-800 rounded-lg border border-gray-100 dark:border-dark-700">
                                <p className="text-gray-700 dark:text-gray-300">
                                  {maskRec.usage}
                                </p>
                              </div>

                              {maskRec.isRecommended && maskRec.maskType && (
                                <div className="mt-4 flex items-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800/30">
                                  <div className="mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <p className="font-medium text-gray-700 dark:text-gray-300">
                                    Best mask type for you: <span className="text-primary-600 dark:text-primary-400 font-semibold">{maskRec.maskType}</span>
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Oxygen Support Guidance */}
                <div id="oxygen-guidance-section" className="mt-8">
                  <div className="flex items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your Personalized Oxygen Support Guidance</h3>
                    <button 
                      onClick={() => {
                        const content = extractSectionContent('oxygen-guidance-section');
                        speakText(content, 'oxygen-guidance');
                      }}
                      className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                      aria-label="Listen to oxygen support guidance"
                    >
                      <FiVolume2 
                        className={`w-5 h-5 ${currentSpeakingId === 'oxygen-guidance' ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`} 
                      />
                    </button>
                  </div>
                  <div className="p-4 bg-white dark:bg-dark-800 rounded-lg shadow-sm">
                    {(() => {
                      // Get user's health data
                      const age = report.healthData?.age || 0;
                      const aqi = report.aqiData?.value || 0;
                      const chronicDiseases = report.healthData?.chronicDiseases || [];
                      const symptoms = report.healthData?.symptoms || [];

                      // Extract specific conditions
                      const hasAsthma = chronicDiseases.some(disease => {
                        const diseaseName = typeof disease === 'object' ? disease.name : disease;
                        return diseaseName.toLowerCase().includes('asthma');
                      });

                      const hasCOPD = chronicDiseases.some(disease => {
                        const diseaseName = typeof disease === 'object' ? disease.name : disease;
                        return diseaseName.toLowerCase().includes('copd');
                      });

                      const hasSleepApnea = chronicDiseases.some(disease => {
                        const diseaseName = typeof disease === 'object' ? disease.name : disease;
                        return diseaseName.toLowerCase().includes('sleep') || diseaseName.toLowerCase().includes('apnea');
                      });

                      const hasLungDisease = chronicDiseases.some(disease => {
                        const diseaseName = typeof disease === 'object' ? disease.name : disease;
                        return diseaseName.toLowerCase().includes('lung') ||
                          diseaseName.toLowerCase().includes('pulmonary') ||
                          diseaseName.toLowerCase().includes('emphysema');
                      });

                      const hasHeartDisease = chronicDiseases.some(disease => {
                        const diseaseName = typeof disease === 'object' ? disease.name : disease;
                        return diseaseName.toLowerCase().includes('heart') ||
                          diseaseName.toLowerCase().includes('cardiac') ||
                          diseaseName.toLowerCase().includes('cardiovascular');
                      });

                      const hasRespiratoryCondition = hasAsthma || hasCOPD || hasLungDisease;

                      // Check for relevant symptoms
                      const hasSevereBreathingSymptoms = symptoms.some(symptom =>
                        symptom.toLowerCase().includes('shortness of breath') ||
                        symptom.toLowerCase().includes('difficulty breathing') ||
                        symptom.toLowerCase().includes('severe cough')
                      );

                      const hasModerateBreathingSymptoms = symptoms.some(symptom =>
                        symptom.toLowerCase().includes('breath') ||
                        symptom.toLowerCase().includes('cough') ||
                        symptom.toLowerCase().includes('wheez')
                      ) && !hasSevereBreathingSymptoms;

                      // Get disease severity if available
                      const getConditionSeverity = (conditionName) => {
                        const condition = chronicDiseases.find(disease => {
                          if (typeof disease !== 'object') return false;
                          return disease.name.toLowerCase().includes(conditionName.toLowerCase());
                        });

                        return condition && condition.severity ? condition.severity : 'Moderate';
                      };

                      const copdSeverity = hasCOPD ? getConditionSeverity('copd') : null;
                      const asthmaSeverity = hasAsthma ? getConditionSeverity('asthma') : null;

                      // Determine oxygen recommendation
                      const getOxygenRecommendation = () => {
                        let isRecommended = false;
                        let recommendation = "";
                        let level = "";
                        let reason = "";

                        // Determine if oxygen is recommended based on conditions and symptoms
                        if (hasCOPD && (copdSeverity === 'Severe' || aqi > 150)) {
                          isRecommended = true;
                          reason = "COPD with poor air quality";
                          recommendation = "For your COPD, supplemental oxygen can help maintain adequate oxygen levels during periods of increased air pollution. Use as prescribed by your doctor, especially during outdoor activities or when symptoms worsen.";
                          level = "Follow your doctor's prescription for flow rate. Typically 1-3 liters per minute for COPD patients during exacerbations.";
                        }
                        else if (hasLungDisease && aqi > 100) {
                          isRecommended = true;
                          reason = "Lung condition with unhealthy air quality";
                          recommendation = "With your lung condition, supplemental oxygen can provide relief when air quality is poor. Use it when you feel increased shortness of breath or during physical activities.";
                          level = "Consult your physician to determine appropriate oxygen flow rate based on your specific needs.";
                        }
                        else if (hasAsthma && asthmaSeverity === 'Severe' && aqi > 100) {
                          isRecommended = true;
                          reason = "Severe asthma with poor air quality";
                          recommendation = "For your severe asthma, having supplemental oxygen available during high pollution days can help manage severe symptoms if they occur. Use it alongside your prescribed medications.";
                          level = "Low flow (1-2 liters per minute) as needed for symptom relief. Always consult your doctor before starting oxygen therapy.";
                        }
                        else if (hasSleepApnea && aqi > 150) {
                          isRecommended = true;
                          reason = "Sleep apnea with very unhealthy air quality";
                          recommendation = "With your sleep apnea and the current poor air quality, supplemental oxygen may be beneficial alongside your CPAP therapy, especially if you notice increased daytime fatigue or breathing difficulties.";
                          level = "Consult your sleep specialist to determine if supplemental oxygen should be added to your CPAP therapy.";
                        }
                        else if (hasHeartDisease && (aqi > 150 || hasSevereBreathingSymptoms)) {
                          isRecommended = true;
                          reason = "Heart condition with breathing symptoms";
                          recommendation = "For your heart condition, supplemental oxygen can reduce strain on your cardiovascular system during periods of poor air quality. Use it when you feel increased shortness of breath or chest discomfort.";
                          level = "Typically 2-4 liters per minute, but consult your cardiologist for personalized guidance.";
                        }
                        else if (age > 65 && hasRespiratoryCondition && aqi > 150) {
                          isRecommended = true;
                          reason = "Senior with respiratory condition";
                          recommendation = "As a senior with a respiratory condition, having supplemental oxygen available during this period of very poor air quality can help prevent exacerbations and maintain your comfort.";
                          level = "Consult your physician to determine appropriate oxygen flow rate based on your specific needs.";
                        }
                        else if (hasSevereBreathingSymptoms && aqi > 100) {
                          isRecommended = true;
                          reason = "Severe breathing symptoms";
                          recommendation = "Based on your reported severe breathing symptoms, temporary oxygen support may provide relief. However, please seek medical attention promptly as these symptoms require proper evaluation.";
                          level = "Seek immediate medical guidance before starting any oxygen therapy.";
                        }
                        else {
                          isRecommended = false;
                          recommendation = hasRespiratoryCondition ?
                            "Based on your current health status and the air quality conditions, routine oxygen supplementation is not necessary at this time. Continue using your prescribed medications and monitor for any changes in symptoms." :
                            "Oxygen therapy is not indicated for your current health status and environmental conditions. If you experience any breathing difficulties, please consult your healthcare provider.";
                        }

                        // Add safety disclaimer
                        if (isRecommended) {
                          recommendation += " Always consult with your healthcare provider before starting or adjusting any oxygen therapy.";
                        }

                        return { isRecommended, recommendation, level, reason };
                      };

                      const oxygenRec = getOxygenRecommendation();

                      return (
                        <>
                          <div className="mb-4">
                            <div className="p-6 bg-gray-50 dark:bg-dark-700 rounded-lg shadow-md">
                              <div className="flex items-center mb-4">
                                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${oxygenRec.isRecommended ? 'bg-warning-100 text-warning-600 dark:bg-warning-800 dark:text-warning-300' : 'bg-success-100 text-success-600 dark:bg-success-800 dark:text-success-300'} mr-3 shadow-sm`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.366 10.5a9 9 0 10-9.732 9.732M3 19.25a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 19.25V5.75A2.25 2.25 0 0018.75 3.5h-13.5A2.25 2.25 0 003 5.75v13.5zM9.75 12h4.5m-4.5 4.5h4.5" />
                                  </svg>
                                </div>
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                      {oxygenRec.isRecommended ? 'Oxygen Support Advised' : 'No Oxygen Support Needed'}
                                    </h4>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${oxygenRec.isRecommended ? 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300 border border-warning-200 dark:border-warning-800' : 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-300 border border-success-200 dark:border-success-800'}`}>
                                      {oxygenRec.isRecommended ? 'Medical Priority' : 'Not Required'}
                                    </span>
                                  </div>
                                  {oxygenRec.reason && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {oxygenRec.reason}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 p-4 bg-white dark:bg-dark-800 rounded-lg border border-gray-100 dark:border-dark-700">
                                <p className="text-gray-700 dark:text-gray-300">
                                  {oxygenRec.recommendation}
                                </p>
                              </div>

                              {oxygenRec.isRecommended && oxygenRec.level && (
                                <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800/30">
                                  <div className="flex items-center mb-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    <h5 className="font-medium text-primary-700 dark:text-primary-300">Recommended Oxygen Level</h5>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 ml-7">
                                    {oxygenRec.level}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Medication Guidance */}
                <div id="medication-guide-section" className="mt-8">
                  <div className="flex items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Your Personalized Medication Guide</h3>
                    <button 
                      onClick={() => {
                        const content = extractSectionContent('medication-guide-section');
                        speakText(content, 'medication-guide');
                      }}
                      className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                      aria-label="Listen to medication guide"
                    >
                      <FiVolume2 
                        className={`w-5 h-5 ${currentSpeakingId === 'medication-guide' ? 'text-primary-500' : 'text-gray-500 dark:text-gray-400'}`} 
                      />
                    </button>
                  </div>
                  <div className="p-6 bg-white dark:bg-dark-800 rounded-lg shadow-md">
                    {/* Personalized Medication Recommendations */}
                    <div>
                      {(() => {
                        // Get user's health data
                        const age = report.healthData?.age || 0;
                        const aqi = report.aqiData?.value || 0;
                        const chronicDiseases = report.healthData?.chronicDiseases || [];
                        const symptoms = report.healthData?.symptoms || [];

                        // Helper function to check if user has a specific condition
                        const hasCondition = (keyword) => {
                          return chronicDiseases.some(disease => {
                            const diseaseName = typeof disease === 'object' ? disease.name : disease;
                            return diseaseName.toLowerCase().includes(keyword.toLowerCase());
                          });
                        };

                        // Helper function to check if user has a specific symptom
                        const hasSymptom = (keyword) => {
                          return symptoms.some(symptom =>
                            symptom.toLowerCase().includes(keyword.toLowerCase())
                          );
                        };

                        // Generate medication recommendations based on conditions and symptoms
                        const getMedicationRecommendations = () => {
                          const recommendations = [];

                          // Respiratory conditions
                          if (hasCondition('asthma')) {
                            recommendations.push({
                              condition: 'Asthma',
                              medications: [
                                { name: 'Albuterol (ProAir, Ventolin)', purpose: 'Quick-relief rescue inhaler for sudden symptoms' },
                                { name: 'Fluticasone/Salmeterol (Advair)', purpose: 'Daily maintenance inhaler to prevent symptoms' },
                                { name: 'Montelukast (Singulair)', purpose: 'Daily oral medication to reduce inflammation' }
                              ],
                              note: 'Keep your rescue inhaler with you at all times when air quality is poor.'
                            });
                          }

                          if (hasCondition('copd')) {
                            recommendations.push({
                              condition: 'COPD',
                              medications: [
                                { name: 'Tiotropium (Spiriva)', purpose: 'Long-acting bronchodilator to improve breathing' },
                                { name: 'Albuterol/Ipratropium (Combivent)', purpose: 'Combination inhaler for quick relief' },
                                { name: 'Roflumilast (Daliresp)', purpose: 'Reduces inflammation and flare-ups' }
                              ],
                              note: 'Use your medications as prescribed, especially before any physical activity.'
                            });
                          }

                          // Allergy conditions
                          if (hasCondition('allerg') || (aqi > 100 && (hasSymptom('sneez') || hasSymptom('itch')))) {
                            recommendations.push({
                              condition: 'Allergies',
                              medications: [
                                { name: 'Cetirizine (Zyrtec)', purpose: 'Non-drowsy antihistamine for daytime use' },
                                { name: 'Diphenhydramine (Benadryl)', purpose: 'Antihistamine for nighttime use' },
                                { name: 'Fluticasone (Flonase)', purpose: 'Nasal spray to reduce inflammation' }
                              ],
                              note: 'Take antihistamines before going outdoors when air quality is poor.'
                            });
                          }

                          // Heart conditions
                          if (hasCondition('heart') || hasCondition('hypertension') || hasCondition('cardiac')) {
                            recommendations.push({
                              condition: 'Heart/Cardiovascular',
                              medications: [
                                { name: 'Continue your prescribed medications', purpose: 'Maintain heart health during poor air quality' },
                                { name: 'Blood pressure monitor', purpose: 'Check your blood pressure regularly' }
                              ],
                              note: 'Poor air quality can strain your cardiovascular system. Stay indoors when AQI is high.'
                            });
                          }

                          // Symptom-specific recommendations with air quality context
                          const getSymptomSeverity = (symptomType) => {
                            // Calculate symptom severity based on air quality and user health
                            if (aqi > 200) return 'severe';
                            if (aqi > 150) return 'moderate-to-severe';
                            if (aqi > 100) return 'moderate';
                            if (aqi > 50) return 'mild-to-moderate';
                            return 'mild';
                          };

                          // Cough recommendations
                          if (hasSymptom('cough')) {
                            const coughSeverity = getSymptomSeverity('cough');
                            const coughType = hasSymptom('mucus') || hasSymptom('phlegm') ? 'productive' : 'dry';
                            const isNightCough = hasSymptom('night') || hasSymptom('sleep');

                            const coughMeds = [];

                            // Base medications
                            if (coughType === 'dry') {
                              coughMeds.push({
                                name: 'Dextromethorphan (Robitussin DM)',
                                purpose: `Suppresses ${coughSeverity === 'severe' ? 'your severe' : coughSeverity === 'moderate-to-severe' ? 'your persistent' : 'your'} dry cough`
                              });

                              if (isNightCough) {
                                coughMeds.push({
                                  name: 'Diphenhydramine (Benadryl)',
                                  purpose: 'Helps with nighttime coughing and improves sleep quality'
                                });
                              }
                            } else {
                              coughMeds.push({
                                name: 'Guaifenesin (Mucinex)',
                                purpose: `Thins mucus to make your ${coughSeverity} productive cough more effective`
                              });
                            }

                            // Add prescription options for severe cases
                            if (coughSeverity === 'severe' || coughSeverity === 'moderate-to-severe') {
                              coughMeds.push({
                                name: 'Benzonatate (Tessalon)',
                                purpose: 'Prescription cough suppressant for your severe cough symptoms'
                              });

                              if (aqi > 150) {
                                coughMeds.push({
                                  name: 'Inhaled corticosteroids',
                                  purpose: 'May be prescribed by your doctor for cough related to current high pollution levels'
                                });
                              }
                            }

                            // Customize note based on air quality
                            let coughNote = 'Stay hydrated to help thin mucus and soothe irritated throat.';
                            if (aqi > 150) {
                              coughNote = `With current AQI of ${aqi}, your cough may worsen. Stay indoors with air purification, stay well-hydrated, and consider using a humidifier.`;
                            } else if (aqi > 100) {
                              coughNote = `Current AQI of ${aqi} may aggravate your cough. Limit outdoor exposure, especially during peak pollution hours.`;
                            }

                            recommendations.push({
                              condition: `${coughSeverity.charAt(0).toUpperCase() + coughSeverity.slice(1)} ${coughType.charAt(0).toUpperCase() + coughType.slice(1)} Cough`,
                              medications: coughMeds,
                              note: coughNote
                            });
                          }

                          // Sore throat recommendations
                          if (hasSymptom('throat')) {
                            const throatSeverity = getSymptomSeverity('throat');
                            const hasSwallowingPain = hasSymptom('swallow') || hasSymptom('pain');

                            const throatMeds = [];

                            // Base medications
                            throatMeds.push({
                              name: 'Benzocaine lozenges (Cepacol)',
                              purpose: `Numbs ${throatSeverity} throat pain${hasSwallowingPain ? ' and eases painful swallowing' : ''}`
                            });

                            throatMeds.push({
                              name: 'Honey and warm tea with lemon',
                              purpose: 'Natural remedy that soothes irritated throat tissues'
                            });

                            if (throatSeverity === 'severe' || throatSeverity === 'moderate-to-severe') {
                              throatMeds.push({
                                name: 'Ibuprofen or acetaminophen',
                                purpose: 'Reduces throat inflammation and pain'
                              });
                            }

                            if (aqi > 100) {
                              throatMeds.push({
                                name: 'Throat coat tea with slippery elm',
                                purpose: 'Provides a protective coating for throat irritated by pollutants'
                              });
                            }

                            // Customize note based on air quality
                            let throatNote = 'Avoid irritants like smoking or spicy foods that can worsen throat irritation.';
                            if (aqi > 150) {
                              throatNote = `Current high pollution (AQI ${aqi}) is likely contributing to your throat irritation. Use an air purifier indoors and consider wearing a mask outdoors.`;
                            } else if (aqi > 100) {
                              throatNote = `Moderate air pollution (AQI ${aqi}) may be irritating your throat. Limit talking when outdoors and breathe through your nose rather than mouth.`;
                            }

                            recommendations.push({
                              condition: `${throatSeverity.charAt(0).toUpperCase() + throatSeverity.slice(1)} Throat Irritation`,
                              medications: throatMeds,
                              note: throatNote
                            });
                          }

                          // Eye irritation recommendations
                          if (hasSymptom('eye') || hasSymptom('irritation')) {
                            const eyeSeverity = getSymptomSeverity('eye');
                            const hasItching = hasSymptom('itch');
                            const hasBurning = hasSymptom('burn');
                            const hasRedness = hasSymptom('red');

                            const eyeMeds = [];

                            // Base medications
                            eyeMeds.push({
                              name: 'Artificial tears (Refresh, Systane)',
                              purpose: `Lubricates and soothes ${eyeSeverity} dry, irritated eyes`
                            });

                            if (hasItching || aqi > 100) {
                              eyeMeds.push({
                                name: 'Ketotifen (Zaditor, Alaway)',
                                purpose: `Antihistamine eye drops for ${hasItching ? 'your itchy, ' : ''}allergic eye symptoms triggered by pollutants`
                              });
                            }

                            if (hasBurning || hasRedness) {
                              eyeMeds.push({
                                name: 'Cold compress',
                                purpose: `Reduces ${hasRedness ? 'redness and ' : ''}${hasBurning ? 'burning sensation' : 'inflammation'}`
                              });
                            }

                            if (eyeSeverity === 'severe' && aqi > 150) {
                              eyeMeds.push({
                                name: 'Prescription steroid eye drops',
                                purpose: 'May be needed for severe irritation from high pollution exposure - consult your doctor'
                              });
                            }

                            // Customize note based on air quality
                            let eyeNote = 'Avoid rubbing your eyes as this can worsen irritation.';
                            if (aqi > 150) {
                              eyeNote = `High pollution levels (AQI ${aqi}) are likely causing your eye symptoms. Wear wraparound sunglasses outdoors and use eye drops before and after exposure.`;
                            } else if (aqi > 100) {
                              eyeNote = `Current AQI of ${aqi} can irritate eyes. Rinse your eyes with cool water after outdoor exposure and consider wearing protective eyewear.`;
                            }

                            recommendations.push({
                              condition: `${eyeSeverity.charAt(0).toUpperCase() + eyeSeverity.slice(1)} Eye Irritation${hasItching ? ' with Itching' : ''}${hasBurning ? ' and Burning' : ''}`,
                              medications: eyeMeds,
                              note: eyeNote
                            });
                          }

                          // Headache recommendations
                          if (hasSymptom('head') || hasSymptom('pain')) {
                            const headSeverity = getSymptomSeverity('headache');
                            const isMigraine = hasSymptom('migraine') || hasSymptom('aura') || hasSymptom('nausea');
                            const isSinus = hasSymptom('sinus') || hasSymptom('pressure');

                            const headMeds = [];

                            // Base medications
                            if (!isMigraine) {
                              headMeds.push({
                                name: 'Ibuprofen (Advil, Motrin)',
                                purpose: `Anti-inflammatory pain reliever for ${headSeverity} ${isSinus ? 'sinus ' : ''}headache`
                              });

                              headMeds.push({
                                name: 'Acetaminophen (Tylenol)',
                                purpose: 'Pain reliever that is gentler on the stomach'
                              });
                            }

                            if (isMigraine) {
                              headMeds.push({
                                name: 'Excedrin Migraine',
                                purpose: 'Combination medication specifically for migraine relief'
                              });

                              if (headSeverity === 'severe' || headSeverity === 'moderate-to-severe') {
                                headMeds.push({
                                  name: 'Prescription migraine medications',
                                  purpose: 'Consult your doctor about triptans or other migraine-specific treatments'
                                });
                              }
                            }

                            if (isSinus) {
                              headMeds.push({
                                name: 'Pseudoephedrine (Sudafed)',
                                purpose: 'Relieves sinus pressure that may be causing your headache'
                              });
                            }

                            // Customize note based on air quality
                            let headNote = 'Stay hydrated and rest in a dark, quiet room for severe headaches.';
                            if (aqi > 150) {
                              headNote = `High pollution (AQI ${aqi}) can trigger or worsen headaches. Stay indoors with air filtration and maintain good hydration.`;
                              if (isMigraine) {
                                headNote += ' Consider using your migraine action plan earlier than usual when pollution is high.';
                              }
                            } else if (aqi > 100) {
                              headNote = `Moderate pollution (AQI ${aqi}) may contribute to your headache. Limit outdoor activity and consider using a mask when outside.`;
                            }

                            recommendations.push({
                              condition: `${headSeverity.charAt(0).toUpperCase() + headSeverity.slice(1)} ${isMigraine ? 'Migraine' : isSinus ? 'Sinus Headache' : 'Headache'}`,
                              medications: headMeds,
                              note: headNote
                            });
                          }

                          // Nasal congestion recommendations
                          if (hasSymptom('nasal') || hasSymptom('congest') || hasSymptom('stuffy')) {
                            const nasalSeverity = getSymptomSeverity('nasal');
                            const hasRunnyNose = hasSymptom('runny') || hasSymptom('drip');
                            const hasSinusPressure = hasSymptom('sinus') || hasSymptom('pressure');

                            const nasalMeds = [];

                            // Base medications
                            if (!hasRunnyNose) {
                              nasalMeds.push({
                                name: 'Pseudoephedrine (Sudafed)',
                                purpose: `Decongestant that reduces swelling in nasal passages for ${nasalSeverity} congestion`
                              });
                            }

                            if (nasalSeverity === 'severe' || nasalSeverity === 'moderate-to-severe') {
                              nasalMeds.push({
                                name: 'Oxymetazoline (Afrin)',
                                purpose: `Nasal spray for quick relief of ${nasalSeverity} congestion (use for max 3 days)`
                              });
                            }

                            nasalMeds.push({
                              name: 'Saline nasal spray or rinse',
                              purpose: `${aqi > 100 ? 'Flushes pollutants from nasal passages and ' : ''}Moisturizes and clears nasal passages`
                            });

                            if (hasRunnyNose) {
                              nasalMeds.push({
                                name: 'Loratadine (Claritin) or Cetirizine (Zyrtec)',
                                purpose: 'Controls runny nose and postnasal drip'
                              });
                            }

                            if (hasSinusPressure && (nasalSeverity === 'severe' || nasalSeverity === 'moderate-to-severe')) {
                              nasalMeds.push({
                                name: 'Fluticasone (Flonase)',
                                purpose: 'Reduces inflammation in sinuses and nasal passages'
                              });
                            }

                            // Customize note based on air quality
                            let nasalNote = 'Use a humidifier at night to help keep nasal passages moist.';
                            if (aqi > 150) {
                              nasalNote = `High pollution (AQI ${aqi}) is likely worsening your nasal symptoms. Use saline rinses after outdoor exposure and consider a HEPA air purifier in your bedroom.`;
                            } else if (aqi > 100) {
                              nasalNote = `Current pollution levels (AQI ${aqi}) can irritate nasal passages. Nasal irrigation with saline solution can help remove pollutants and reduce congestion.`;
                            }

                            recommendations.push({
                              condition: `${nasalSeverity.charAt(0).toUpperCase() + nasalSeverity.slice(1)} Nasal ${hasRunnyNose ? 'Discharge' : 'Congestion'}${hasSinusPressure ? ' with Sinus Pressure' : ''}`,
                              medications: nasalMeds,
                              note: nasalNote
                            });
                          }

                          // General recommendations based on AQI
                          if (aqi > 150) {
                            recommendations.push({
                              condition: 'High Pollution Exposure',
                              medications: [
                                { name: 'N-Acetylcysteine (NAC)', purpose: 'Antioxidant that may help protect lungs from pollution' },
                                { name: 'Vitamin C and E supplements', purpose: 'Antioxidants that may help reduce inflammation' }
                              ],
                              note: 'These supplements may help support your body during high pollution days, but the best strategy is to minimize exposure.'
                            });
                          }

                          return recommendations;
                        };

                        const medicationRecommendations = getMedicationRecommendations();

                        return (
                          <>
                            {medicationRecommendations.length > 0 ? (
                              <>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                                  Based on your health profile and current conditions, here are personalized medication recommendations:
                                </p>

                                <div className="space-y-6">
                                  {medicationRecommendations.map((rec, index) => (
                                    <div key={index} className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg border border-gray-100 dark:border-dark-700">
                                      <h4 className="font-semibold text-primary-600 dark:text-primary-400 mb-3">
                                        For {rec.condition}
                                      </h4>

                                      <ul className="space-y-2">
                                        {rec.medications.map((med, medIndex) => (
                                          <li key={medIndex} className="flex items-start">
                                            <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                            </div>
                                            <div>
                                              <span className="font-medium text-gray-800 dark:text-gray-200">{med.name}: </span>
                                              <span className="text-gray-600 dark:text-gray-400">{med.purpose}</span>
                                            </div>
                                          </li>
                                        ))}
                                      </ul>

                                      {rec.note && (
                                        <div className="mt-3 text-sm bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/30 text-gray-700 dark:text-gray-300">
                                          <span className="font-medium text-blue-700 dark:text-blue-300">Note: </span>
                                          {rec.note}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-6 p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-100 dark:border-warning-800/30">
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 w-5 h-5 text-warning-500 mt-0.5 mr-2">
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                      <span className="font-semibold">Important:</span> Always consult with your healthcare provider before starting any new medication. This guidance is personalized based on your reported health data but is not a substitute for professional medical advice.
                                    </p>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg text-center">
                                <p className="text-gray-700 dark:text-gray-300">
                                  No specific medication recommendations are available based on your current health profile. For general health during poor air quality days, stay hydrated and minimize outdoor exposure.
                                </p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    {/* Chronic Disease Recommendations - Enhanced Section */}
                    {report.healthStatus?.chronicDiseases && report.healthStatus.chronicDiseases.length > 0 && (
                      <div className="mt-8 space-y-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Your Health Conditions Today</h3>
                        {report.chronicDiseaseRecommendations ? (
                          report.chronicDiseaseRecommendations.map((rec, index) => {
                            // Extract disease name from the recommendation text
                            const diseaseMatch = rec.match(/^([^:]+):/i);
                            const diseaseName = diseaseMatch ? diseaseMatch[1].trim() : null;
                            const recommendation = diseaseMatch ? rec.substring(diseaseMatch[0].length).trim() : rec;

                            return (
                              <div key={index} className="p-6 bg-white dark:bg-dark-800 rounded-lg shadow-md border border-gray-100 dark:border-dark-700">
                                <div className="flex items-center mb-4">
                                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-800 dark:text-primary-300 mr-3 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                  </div>
                                  <div>
                                    {diseaseName && (
                                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{diseaseName}</h4>
                                    )}
                                    <div className="flex mt-1">
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                                        Personalized Care
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
                                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{recommendation}</p>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          report.healthStatus.chronicDiseases.map((disease, index) => {
                            // Determine risk level based on AQI and temperature
                            const getConditionRiskLevel = () => {
                              if (report.aqiData?.value > 150 || report.aqiData?.temperature > 35 || report.aqiData?.temperature < 5) {
                                return {
                                  level: 'High Risk',
                                  color: 'warning',
                                  explanation: 'Current conditions may significantly affect your health'
                                };
                              } else if (report.aqiData?.value > 100 || report.aqiData?.temperature > 30 || report.aqiData?.temperature < 10) {
                                return {
                                  level: 'Medium Risk',
                                  color: 'primary',
                                  explanation: 'Take extra precautions in these conditions'
                                };
                              } else {
                                return {
                                  level: 'Low Risk',
                                  color: 'success',
                                  explanation: 'Conditions are favorable for your health today'
                                };
                              }
                            };

                            const riskLevel = getConditionRiskLevel();
                            const diseaseName = typeof disease === 'object' ? disease.name : disease;

                            // Get simple explanation based on disease type
                            const getSimpleExplanation = () => {
                              const lowerDisease = diseaseName.toLowerCase();

                              if (lowerDisease.includes('asthma')) {
                                return {
                                  whatIs: "Asthma affects your airways and can make breathing difficult",
                                  whyMatters: "Air pollution and temperature changes can trigger asthma symptoms"
                                };
                              } else if (lowerDisease.includes('copd')) {
                                return {
                                  whatIs: "COPD makes it harder to breathe and can cause coughing and shortness of breath",
                                  whyMatters: "Poor air quality can worsen COPD symptoms and may lead to flare-ups"
                                };
                              } else if (lowerDisease.includes('heart') || lowerDisease.includes('cardiac')) {
                                return {
                                  whatIs: "Heart conditions affect how well your heart pumps blood through your body",
                                  whyMatters: "Air pollution can strain your heart and cardiovascular system"
                                };
                              } else if (lowerDisease.includes('diabet')) {
                                return {
                                  whatIs: "Diabetes affects how your body processes blood sugar",
                                  whyMatters: "Environmental stress can affect blood sugar control"
                                };
                              } else if (lowerDisease.includes('allerg')) {
                                return {
                                  whatIs: "Allergies are reactions to substances your body is sensitive to",
                                  whyMatters: "Pollutants in the air can worsen allergy symptoms"
                                };
                              } else {
                                return {
                                  whatIs: `${diseaseName} is a health condition that requires ongoing management`,
                                  whyMatters: "Environmental factors like air quality and temperature can affect your symptoms"
                                };
                              }
                            };

                            const explanation = getSimpleExplanation();

                            return (
                              <div key={index} className="p-6 bg-white dark:bg-dark-800 rounded-lg shadow-md border border-gray-100 dark:border-dark-700">
                                {/* Header with icon and risk level */}
                                <div className="flex items-center mb-4">
                                  <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-${riskLevel.color}-100 text-${riskLevel.color}-600 dark:bg-${riskLevel.color}-800 dark:text-${riskLevel.color}-300 mr-3 shadow-sm`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{diseaseName}</h4>
                                    <div className="flex mt-1">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${riskLevel.color}-100 text-${riskLevel.color}-800 dark:bg-${riskLevel.color}-900 dark:text-${riskLevel.color}-300 border border-${riskLevel.color}-200 dark:border-${riskLevel.color}-800`}>
                                        {riskLevel.level} Today
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Simple explanation */}
                                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
                                  <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">About Your Condition</h5>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{explanation.whatIs}</p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{explanation.whyMatters}</p>
                                </div>

                                {/* Today's impact */}
                                <div className="mb-4">
                                  <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Today's Impact</h5>
                                  <div className={`p-4 rounded-lg bg-${riskLevel.color}-50 dark:bg-${riskLevel.color}-900/20 border border-${riskLevel.color}-100 dark:border-${riskLevel.color}-800/30`}>
                                    <div className="flex items-start">
                                      <div className={`flex-shrink-0 w-5 h-5 text-${riskLevel.color}-500 mt-0.5 mr-2`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{riskLevel.explanation}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                          {report.aqiData?.value > 150 ?
                                            `The current high AQI (${report.aqiData.value}) may significantly affect your ${diseaseName}.` :
                                            report.aqiData?.value > 100 ?
                                              `The moderate air pollution (AQI ${report.aqiData.value}) could affect your ${diseaseName}.` :
                                              `The current air quality (AQI ${report.aqiData.value}) is unlikely to severely impact your ${diseaseName}.`
                                          }
                                          {report.aqiData?.temperature > 35 ?
                                            ` The high temperature (${report.aqiData.temperature}°) may worsen your symptoms.` :
                                            report.aqiData?.temperature < 10 ?
                                              ` The low temperature (${report.aqiData.temperature}°) may trigger symptoms.` :
                                              ''
                                          }
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* What to do */}
                                <div>
                                  <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">What You Can Do Today</h5>
                                  <ul className="space-y-2">
                                    {diseaseName.toLowerCase().includes('asthma') && (
                                      <>
                                        <li className="flex items-start">
                                          <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                          <p className="text-gray-700 dark:text-gray-300">Keep your rescue inhaler with you at all times</p>
                                        </li>
                                        <li className="flex items-start">
                                          <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                          <p className="text-gray-700 dark:text-gray-300">Use your preventive medications as prescribed</p>
                                        </li>
                                        <li className="flex items-start">
                                          <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                          <p className="text-gray-700 dark:text-gray-300">Stay indoors during peak pollution hours (usually midday)</p>
                                        </li>
                                      </>
                                    )}
                                    {diseaseName.toLowerCase().includes('copd') && (
                                      <>
                                        <li className="flex items-start">
                                          <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                          <p className="text-gray-700 dark:text-gray-300">Practice pursed-lip breathing to improve airflow</p>
                                        </li>
                                        <li className="flex items-start">
                                          <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                          <p className="text-gray-700 dark:text-gray-300">Use supplemental oxygen as prescribed by your doctor</p>
                                        </li>
                                        <li className="flex items-start">
                                          <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                          <p className="text-gray-700 dark:text-gray-300">Avoid smoke, strong smells, and air pollution</p>
                                        </li>
                                      </>
                                    )}
                                    {(diseaseName.toLowerCase().includes('heart') || diseaseName.toLowerCase().includes('cardiac')) && (
                                      <>
                                        <li className="flex items-start">
                                          <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                          <p className="text-gray-700 dark:text-gray-300">Monitor your blood pressure regularly</p>
                                        </li>
                                        <li className="flex items-start">
                                          <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                          <p className="text-gray-700 dark:text-gray-300">Limit physical activity during high pollution days</p>
                                        </li>
                                        <li className="flex items-start">
                                          <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                          <p className="text-gray-700 dark:text-gray-300">Stay well-hydrated and reduce salt intake</p>
                                        </li>
                                      </>
                                    )}
                                    {diseaseName.toLowerCase().includes('allerg') && (
                                      <>
                                        <li className="flex items-start">
                                          <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                          <p className="text-gray-700 dark:text-gray-300">Take antihistamines before going outdoors</p>
                                        </li>
                                        <li className="flex items-start">
                                          <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                          <p className="text-gray-700 dark:text-gray-300">Shower after coming indoors to remove allergens</p>
                                        </li>
                                        <li className="flex items-start">
                                          <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                          </div>
                                          <p className="text-gray-700 dark:text-gray-300">Keep windows closed during high pollen or pollution days</p>
                                        </li>
                                      </>
                                    )}
                                    {!diseaseName.toLowerCase().includes('asthma') &&
                                      !diseaseName.toLowerCase().includes('copd') &&
                                      !diseaseName.toLowerCase().includes('heart') &&
                                      !diseaseName.toLowerCase().includes('cardiac') &&
                                      !diseaseName.toLowerCase().includes('allerg') && (
                                        <>
                                          <li className="flex items-start">
                                            <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300">Continue taking your prescribed medications</p>
                                          </li>
                                          <li className="flex items-start">
                                            <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300">Monitor your symptoms and seek medical help if they worsen</p>
                                          </li>
                                          <li className="flex items-start">
                                            <div className="flex-shrink-0 w-5 h-5 text-primary-500 mt-0.5 mr-2">
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300">Limit exposure to environmental triggers like pollution</p>
                                          </li>
                                        </>
                                      )}
                                  </ul>
                                </div>

                                {/* When to get help */}
                                <div className="mt-4 p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-100 dark:border-warning-800/30">
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 w-5 h-5 text-warning-500 mt-0.5 mr-2">
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <div>
                                      <h6 className="text-sm font-medium text-warning-800 dark:text-warning-300">When to Get Medical Help</h6>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Call your doctor or seek emergency care if you experience:
                                      </p>
                                      <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                                        <li>Severe difficulty breathing or shortness of breath</li>
                                        <li>Chest pain or pressure</li>
                                        <li>Unusual or severe symptoms</li>
                                        <li>Symptoms that don't improve with your usual medications</li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}                  </div>
                </div>
              </section>

              {/* Footer */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                <p>Report generated by BreatheSafe</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HealthReportDetail;
