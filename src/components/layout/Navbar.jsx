import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { FiSun, FiMoon, FiMenu, FiX } from "react-icons/fi";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAuthClick = (path) => {
    navigate(path, { state: { background: location } });
    closeMenu();
  };

  const navbarClasses = `fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${
    isScrolled
      ? "bg-white/90 dark:bg-dark-900/90 backdrop-blur-md shadow-sm"
      : "bg-transparent"
  }`;

  const linkClasses =
    "font-medium transition-colors duration-200 hover:text-primary-500";
  const activeLinkClasses = "text-primary-500 font-semibold";

  // Health Assessment is a regular route now:
  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/disease-info", label: "Disease Info" },
    ...(user
      ? [
          { path: "/live-aqi", label: "Live AQI Tracker" },
          { path: "/forecasting", label: "AQI Forecasting" },
          { path: "/form-input", label: "Health Assessment" },
          { path: "/dashboard", label: "Dashboard" },
        ]
      : []),
  ];

  return (
    <nav className={navbarClasses}>
      <div className="py-4 container-custom">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-primary-500">
            <span className="flex items-center">
              BreatheSafe
              <motion.span
                className="ml-1 text-3xl text-success-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}>
                .
              </motion.span>
            </span>
          </Link>

          {/* Desktop & Tablet Navigation */}
          <div className="items-center hidden lg:flex lg:space-x-8">
            <div className="flex items-center lg:space-x-6">
              {navLinks.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`${linkClasses} ${
                    location.pathname === path
                      ? activeLinkClasses
                      : "text-gray-700 dark:text-gray-300"
                  }`}>
                  {label}
                </Link>
              ))}
            </div>

            <div className="flex items-center lg:space-x-4">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700"
                aria-label="Toggle theme">
                {isDarkMode ? (
                  <FiSun className="w-5 h-5 text-white" />
                ) : (
                  <FiMoon className="w-5 h-5" />
                )}
              </button>

              {!user ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleAuthClick("/login")}
                    className="px-3 py-2 text-sm lg:text-base btn-secondary">
                    Login
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAuthClick("/signup")}
                    className="px-3 py-2 text-sm lg:text-base btn-primary">
                    Sign Up
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center space-x-4 lg:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-700"
              aria-label="Toggle theme">
              {isDarkMode ? (
                <FiSun className="w-5 h-5 text-white" />
              ) : (
                <FiMoon className="w-5 h-5" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleMenu}
              className="p-2 text-gray-700 rounded-md dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800"
              aria-label="Toggle menu">
              {isOpen ? (
                <FiX className="w-6 h-6" />
              ) : (
                <FiMenu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        className={`lg:hidden ${isOpen ? "block" : "hidden"}`}
        initial={false}
        animate={
          isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }
        }
        transition={{ duration: 0.3 }}>
        <div className="py-4 pb-6 bg-white rounded-b-lg shadow-lg container-custom dark:bg-dark-800">
          <div className="flex flex-col space-y-4">
            {navLinks.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`${linkClasses} py-2 ${
                  location.pathname === path
                    ? activeLinkClasses
                    : "text-gray-700 dark:text-gray-300"
                }`}
                onClick={closeMenu}>
                {label}
              </Link>
            ))}
            <div className="flex flex-col pt-4 space-y-2 border-t border-gray-200 dark:border-dark-700">
              {!user ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleAuthClick("/login")}
                    className="w-full py-2 text-center btn-secondary">
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAuthClick("/signup")}
                    className="w-full py-2 text-center btn-primary">
                    Sign Up
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>
    </nav>
  );
};

export default Navbar;
