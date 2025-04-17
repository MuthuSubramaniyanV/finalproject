import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import CandidateForm from './Candidateform';

const ApplyJob = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [jobTitle, setJobTitle] = useState(location.state?.jobTitle || "Job Position");
  
  useEffect(() => {
    const parsedId = parseInt(id);
    if (!id || isNaN(parsedId) || parsedId <= 0) {
      toast.error("Invalid job ID");
      navigate('/jobs');
      return;
    }
    
    // If no job title is provided in state, you could fetch it here
    if (!location.state?.jobTitle) {
      // Optional: Fetch job title from API using the ID
      // For now, we'll use a default
      console.log("No job title provided in navigation state");
    }
  }, [id, location.state, navigate]);

  return (
    <div className="min-h-screen bg-gray-900">
      <Toaster position="top-right" />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">
            Apply for Position
          </h1>
          <h2 className="text-xl text-gray-300 bg-gray-800 inline-block px-4 py-2 rounded-lg">
            {jobTitle || "Loading..."}
          </h2>
        </div>
        {id && (
          <CandidateForm 
            jobId={parseInt(id)}
            jobTitle={jobTitle}
          />
        )}
      </div>
    </div>
  );
};

export default ApplyJob;