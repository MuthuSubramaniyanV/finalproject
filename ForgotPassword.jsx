import React, { useState } from "react";
import { ArrowLeft, Mail, Lock, KeyRound, Send, Check } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const sendOTP = async (email) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to send OTP');
      return false;
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await sendOTP(email);
    if (success) {
      setOtpSent(true);
    }
    setIsLoading(false);
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const response = await fetch("http://127.0.0.1:5000/api/verify-otp", { 

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2);
        toast.success('OTP verified successfully!', { 
          duration: 3000, 
          position: 'top-center' 
        });
      } else {
        toast.error(data.message || 'Invalid OTP', { 
          duration: 4000, 
          position: 'top-center' 
        });
      }
    } catch (error) {
      toast.error('Unable to connect to the server', { 
        duration: 4000, 
        position: 'top-center' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetCredentials = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match', { 
        duration: 4000, 
        position: 'top-center' 
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/reset-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          otp,
          newUsername,
          newPassword 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Your credentials have been updated successfully!', { 
          duration: 3000, 
          position: 'top-center' 
        });
        
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        toast.error(data.message || 'Failed to reset credentials', { 
          duration: 4000, 
          position: 'top-center' 
        });
      }
    } catch (error) {
      toast.error('Unable to connect to the server', { 
        duration: 4000, 
        position: 'top-center' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-gray-800 rounded-3xl shadow-2xl overflow-hidden transform transition-all hover:scale-105 neon-border">
      <Toaster />
      <div className="p-8 bg-gradient-to-r from-cyan-500 to-blue-500 text-center">
        <h2 className="text-3xl font-bold text-white">Password Recovery</h2>
        <p className="text-gray-200 mt-2">Reset your login credentials</p>
      </div>

      <div className="p-8 space-y-6">
        <button 
          onClick={onBack}
          className="flex items-center text-cyan-400 hover:text-cyan-300 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Login
        </button>

        {step === 1 ? (
          <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white"
                placeholder="Enter your registered email"
                required
                disabled={isLoading || otpSent}
              />
            </div>

            {otpSent && (
              <div className="relative mt-4">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white"
                  placeholder="Enter OTP received in email"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            >
              {!otpSent ? (
                <>
                  <span>{isLoading ? "Sending OTP..." : "Send OTP"}</span>
                  <Send className="h-5 w-5" />
                </>
              ) : (
                <>
                  <span>{isLoading ? "Verifying..." : "Verify OTP"}</span>
                  <Check className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetCredentials}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white"
                placeholder="New Username"
                required
                disabled={isLoading}
              />
            </div>

            <div className="relative mt-4">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white"
                placeholder="New Password"
                required
                disabled={isLoading}
              />
            </div>

            <div className="relative mt-4">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-600 bg-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-white"
                placeholder="Confirm New Password"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed mt-6"
            >
              <span>{isLoading ? "Updating..." : "Update Credentials"}</span>
              <Check className="h-5 w-5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;