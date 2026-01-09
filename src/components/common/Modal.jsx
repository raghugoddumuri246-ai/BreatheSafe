import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";

const Modal = ({ isOpen, onClose, children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleClose = () => {
    // If there's a background location, navigate back to it
    if (location.state?.background) {
      navigate(location.state.background.pathname, {
        state: { background: location.state.background.state?.background },
      });
    } else {
      // If no background location, go back one step
      navigate(-1);
    }
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-white rounded-lg shadow-xl dark:bg-dark-800"
              onClick={(e) => e.stopPropagation()}>
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute -top-3 -right-3 rounded-full bg-gray-800/90 p-1.5 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600">
                <FiX className="h-4 w-4" />
              </button>

              {/* Content */}
              <div className="p-6 sm:p-8">
                <div className="md:max-h-none max-h-[calc(85vh-4rem)] overflow-y-auto custom-scrollbar">
                  {children}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Modal;
