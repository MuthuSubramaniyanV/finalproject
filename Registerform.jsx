import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export function Register() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(
    localStorage.getItem("isRegistered") === "false"
  );

  useEffect(() => {
    if (isRegistered) {
      setSuccess("Now you have to log in with your user credentials - Thank you.");
    }
  }, [isRegistered]);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, password }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("User registered successfully!");
        setSuccess("Now you have to log in with your user credentials - Thank you.");
        setIsRegistered(true);
        localStorage.setItem("isRegistered", "true");
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-900 via-black to-gray-900 p-6">
      <div className="bg-gray-800 text-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-extrabold mb-4 text-center">WELCOME TO INNOVATIVE HIRING</h1>
        {isRegistered ? (
          <p className="text-green-400 text-center">{success}</p>
        ) : (
          <>
            <h2 className="text-lg font-medium mb-6 text-center">Create Your Account</h2>

            {error && <p className="text-red-400 mb-3 text-center">{error}</p>}

            <input
              type="text"
              placeholder="Enter Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none mb-3 text-white placeholder-gray-400"
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none mb-3 text-white placeholder-gray-400"
              disabled={loading}
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full p-3 rounded-lg shadow-lg font-semibold text-lg transition-all ${
                loading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-cyan-400 hover:to-blue-500 text-white"
              }`}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Register;