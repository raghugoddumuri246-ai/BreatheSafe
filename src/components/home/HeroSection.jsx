import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const HeroSection = () => {
  const canvasRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Earth animation effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      initParticles();
    };

    const createParticle = () => {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25,
        color: `rgba(30, 144, 255, ${Math.random() * 0.5 + 0.2})`,
      };
    };

    const initParticles = () => {
      particles = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 6000);
      for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleButtonClick = (path) => {
    if (!user) {
      navigate('/login', { 
        state: { 
          background: location,
          from: path 
        } 
      });
    } else {
      navigate(path);
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-b from-white to-gray-100 dark:from-dark-900 dark:to-dark-800">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-70"
      />
      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="heading-lg text-gray-900 dark:text-white mb-6">
              <span className="block">Breathe Safe.</span>
              <span className="block text-primary-500">Live Informed.</span>
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
              Get personalized health insights based on real-time air quality around you.
              Make informed decisions about your outdoor activities and protect your respiratory health.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => handleButtonClick('/live-aqi')}
                className="btn-primary text-lg group"
              >
                <span>Get Started</span>
                <motion.span 
                  className="ml-2"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                >
                  →
                </motion.span>
              </button>
              <button
                onClick={() => handleButtonClick('/forecasting')}
                className="btn-secondary text-lg"
              >
                AQI Forecasting
              </button>
            </div>
            <div className="mt-8 flex items-center text-gray-600 dark:text-gray-400">
              <span className="inline-block w-3 h-3 bg-success-500 rounded-full mr-2"></span>
              <span className="text-sm">Updated Air Quality Data in Real-Time</span>
            </div>
          </motion.div>

          <motion.div
            className="hidden lg:flex justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative w-[400px] h-[400px] flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary-500/20 animate-ping" style={{ animationDuration: '3s' }}></div>
              <div className="absolute inset-4 rounded-full bg-primary-500/30"></div>
              <div className="absolute inset-8 rounded-full bg-primary-400/40 flex items-center justify-center">
                <div className="text-white font-bold text-4xl">AQI</div>
              </div>
              
              {/* Air quality indicators */}
              <motion.div 
                className="absolute" 
                style={{ 
                  top: '15%', 
                  left: '20%', 
                  backgroundColor: '#10B981', 
                  borderRadius: '50%', 
                  width: 40, 
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
              >
                32
              </motion.div>
              
              <motion.div 
                className="absolute" 
                style={{ 
                  bottom: '20%', 
                  right: '15%', 
                  backgroundColor: '#EF4444', 
                  borderRadius: '50%', 
                  width: 50, 
                  height: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse' }}
              >
                168
              </motion.div>
              
              <motion.div 
                className="absolute" 
                style={{ 
                  top: '30%', 
                  right: '25%', 
                  backgroundColor: '#F59E0B', 
                  borderRadius: '50%', 
                  width: 45, 
                  height: 45,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
              >
                85
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Wave decoration at bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 100"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            className="text-white dark:text-dark-800"
            fillOpacity="1"
            d="M0,32L80,42.7C160,53,320,75,480,74.7C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z"
          ></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;