import React from "react";
import { homeDetails, features, benefits } from "../constants"; 
import { Link } from "react-router-dom";
import Button from "./Button";

const Homepage = () => {
    return (
        <div
        className="min-h-screen flex flex-col items-center px-6 py-12 text-white relative"
        style={{
            backgroundImage: `url('/image.png')`,  
            backgroundSize: "cover",          // Stretches to cover the whole screen
            backgroundPosition: "top center", // Moves focus to the top part of the image
            backgroundRepeat: "no-repeat",    
            backgroundAttachment: "fixed",
            backdropFilter: "blur(12px)"    // Keeps background fixed when scrolling
        }}
    >
        {/* Overlay to enhance readability */}
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 bg-black/40 z-0"></div>

            {/* Headings */}
            <div className="text-center space-y-4 relative z-10">
                {homeDetails.map((item, index) => (
                    <h1 
                        key={index} 
                        className={`tracking-wide drop-shadow-lg ${
                            index === 0 
                                ? "text-4xl sm:text-6xl font-extrabold text-cyan-400 neon-glow" 
                                : "text-lg sm:text-2xl text-gray-300"
                        }`}
                    >
                        {item.text}
                    </h1>
                ))}
            </div>

            {/* Button */}
            <div className="mt-6 relative z-10">
                <Button />
            </div>

            {/* Features Section */}
            <div className="mt-12 w-full max-w-5xl relative z-10">
                <h2 className="text-3xl font-bold text-center mb-6 text-cyan-300 neon-glow">🚀 Key Features</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <div 
                            key={index} 
                            className="p-6 bg-white/10 backdrop-blur-lg border border-cyan-400/30 rounded-xl shadow-lg transition-transform transform hover:scale-105 hover:border-cyan-300 neon-border"
                        >
                            <h3 className="text-lg font-semibold">{feature.title}</h3>
                            <p className="text-gray-300 mt-2">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Benefits Section */}
            <div className="mt-12 w-full max-w-5xl relative z-10">
                <h2 className="text-3xl font-bold text-center mb-6 text-cyan-300 neon-glow">✨ Why Choose Us?</h2>
                <ul className="text-center space-y-3 text-lg">
                    {benefits.map((benefit, index) => (
                        <li key={index} className="p-4 bg-white/10 backdrop-blur-lg border border-cyan-400/30 rounded-lg shadow-md neon-border">
                            {benefit}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex flex-wrap justify-center gap-6 relative z-10">
                {homeDetails.map((item, index) =>
                    item.label && item.href ? (
                        <Link 
                            key={index} 
                            to={item.href}
                            className="px-6 py-3 text-lg font-semibold text-gray-900 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl shadow-md hover:from-blue-500 hover:to-cyan-400 transition-all"
                        >
                            {item.label}
                        </Link>
                    ) : null
                )}
            </div>
        </div>
    );
};

export default Homepage;
