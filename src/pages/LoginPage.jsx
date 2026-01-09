import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-toastify";
import Modal from "../components/common/Modal";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const isModal = location.state?.background;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        toast.success("Logged in successfully!");
        if (location.state?.background && location.state?.from) {
          navigate(location.state.from);
        } else {
          navigate("/");
        }
      } else {
        toast.error(result.error || "Login failed. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSignupClick = () => {
    navigate("/signup", {
      state: { background: location.state?.background || location },
    });
  };

  const content = (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-6 text-center">
        <h2 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
          Welcome back
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please sign in to your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="login-email"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiMail className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="email"
              id="login-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="block w-full py-2 pl-10 pr-3 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-dark-700 dark:text-white focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_2px_rgba(30,144,255,0.2)] transition-colors duration-200"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiLock className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              id="login-password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="block w-full py-2 pl-10 pr-10 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-dark-700 dark:text-white focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_2px_rgba(30,144,255,0.2)] transition-colors duration-200"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3">
              {showPassword ? (
                <FiEyeOff className="w-4 h-4 text-gray-400" />
              ) : (
                <FiEye className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="w-4 h-4 border-gray-300 rounded text-primary-500 focus:ring-primary-500 dark:border-gray-600"
            />
            <label
              htmlFor="rememberMe"
              className="block ml-2 text-sm text-gray-700 dark:text-gray-300">
              Remember me
            </label>
          </div>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg shadow-sm bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-dark-800 disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? "Signing in..." : "Sign in"}
        </button>

        <div className="text-sm text-center">
          <span className="text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
          </span>
          <button
            type="button"
            onClick={handleSignupClick}
            className="font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300">
            Sign up
          </button>
        </div>
      </form>
    </div>
  );

  if (isModal) {
    return <Modal isOpen={true}>{content}</Modal>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-dark-900">
      {content}
    </div>
  );
};

export default LoginPage;
