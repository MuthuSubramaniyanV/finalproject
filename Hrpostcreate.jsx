import React, { useState, useEffect } from "react";
import {
  Menu,
  Briefcase,
  CheckCircle,
  ChevronLeft,
  LogOut,
  Loader,
  Eye,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { JobPostingSystem as NewPost } from "./HrPost";
import axios from "axios";

const HRDashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("create-job");

  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const response = await new Promise((resolve) =>
        setTimeout(() => resolve([]), 2000)
      );
      setCandidates(response);
    } catch (error) {
      toast.error("Error fetching candidates!");
    } finally {
      setLoading(false);
    }
  };

  const fetchHiringQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/hiring-questions");
      const data = await res.json();

      if (data.status === "success") {
        setQuestions(data.questions);
      } else {
        toast.error("Error fetching questions.");
      }
    } catch (err) {
      toast.error("Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (questionId, candidates) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/hr/start-test',
        {
          questionId: questionId,
          candidates: candidates
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.status === "success") {
        toast.success(response.data.message);
        // Optionally refresh the questions list
        fetchHiringQuestions();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error("Error starting test:", error);
      toast.error(error.response?.data?.message || "Failed to send test invitations");
    }
  };

  const handleViewQuestions = (question) => {
    setSelectedQuestion(question);
    setShowQuestionModal(true);
  };

  useEffect(() => {
    if (activeTab === "verify-candidates") fetchCandidates();
    if (activeTab === "start-hiring") fetchHiringQuestions();
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    sessionStorage.clear();
    navigate("/login", { replace: true });
    window.history.pushState(null, null, "/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg"
      >
        <Menu />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-slate-800 text-white transition-all duration-300 ease-in-out z-40 ${
          isSidebarOpen ? "w-64" : "w-0 md:w-20"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          {isSidebarOpen && <h2 className="text-xl font-bold">HR Panel</h2>}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="hidden md:block"
          >
            <ChevronLeft />
          </button>
        </div>

        <nav className="mt-6 space-y-2 px-2 flex flex-col h-[calc(100%-5rem)]">
          <button
            onClick={() => setActiveTab("create-job")}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${
              activeTab === "create-job"
                ? "bg-blue-600"
                : "hover:bg-slate-700"
            }`}
          >
            <Briefcase />
            {isSidebarOpen && <span className="ml-3">Create Job</span>}
          </button>
          <button
            onClick={() => setActiveTab("verify-candidates")}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${
              activeTab === "verify-candidates"
                ? "bg-blue-600"
                : "hover:bg-slate-700"
            }`}
          >
            <CheckCircle />
            {isSidebarOpen && <span className="ml-3">Verify Candidates</span>}
          </button>
          <button
            onClick={() => setActiveTab("start-hiring")}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${
              activeTab === "start-hiring"
                ? "bg-blue-600"
                : "hover:bg-slate-700"
            }`}
          >
            <CheckCircle />
            {isSidebarOpen && <span className="ml-3">Start Test</span>}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-3 rounded-lg transition-colors hover:bg-red-600 mt-auto"
          >
            <LogOut />
            {isSidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 p-4 md:p-8 ${
          isSidebarOpen ? "md:ml-64" : "md:ml-20"
        }`}
      >
        <div className="bg-white rounded-2xl shadow-sm p-6">
          {activeTab === "create-job" && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Create Job
              </h2>
              <NewPost />
            </div>
          )}

          {activeTab === "verify-candidates" && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Verify Candidates
              </h2>
              {loading ? (
                <div className="flex justify-center items-center space-x-2">
                  <Loader className="animate-spin text-blue-600" />
                  <span>Loading candidates...</span>
                </div>
              ) : candidates.length === 0 ? (
                <p className="text-red-500">
                  No candidate is evaluated by panels.
                </p>
              ) : (
                <ul>
                  {candidates.map((candidate, index) => (
                    <li key={index} className="border-b py-2">
                      <p>{candidate.name}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === "start-hiring" && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Start Test
              </h2>
              {loading ? (
                <div className="flex justify-center items-center space-x-2">
                  <Loader className="animate-spin text-blue-600" />
                  <span>Loading questions...</span>
                </div>
              ) : questions.length === 0 ? (
                <p className="text-red-500">
                  No hiring questions available.
                </p>
              ) : (
                <ul className="grid md:grid-cols-2 gap-6">
                  {questions.map((q) => {
                    let previewText = "Preview not available";
                    try {
                      const parsedQuestions = Array.isArray(q.questions)
                        ? q.questions
                        : JSON.parse(q.questions);
                      if (
                        parsedQuestions?.length > 0 &&
                        parsedQuestions[0]?.question
                      ) {
                        previewText = parsedQuestions[0].question;
                      }
                    } catch (err) {
                      previewText = "Invalid question format";
                    }

                    return (
                      <li
                        key={q.question_id}
                        className="border p-6 rounded-2xl shadow-md bg-white hover:shadow-lg transition duration-300"
                      >
                        <div className="space-y-4">
                          {/* Job and Question Info */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              {q.question_title}
                            </h3>
                            <div className="mt-2 flex items-center gap-4">
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                {q.job_title}
                              </span>
                              <span className="text-sm text-gray-500">
                                Test Date: {q.test_start_date}
                              </span>
                            </div>
                          </div>

                          {/* Question Preview */}
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {previewText}
                            </p>
                            <button
                              onClick={() => handleViewQuestions(q)}
                              className="mt-2 flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                            >
                              <Eye className="h-4 w-4" />
                              View Questions
                            </button>
                          </div>

                          {/* Assigned Candidates */}
                          {q.candidates && q.candidates.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-700 mb-2">
                                Assigned Candidates ({q.candidates.length})
                              </h4>
                              <div className="space-y-2">
                                {q.candidates.map((candidate) => (
                                  <div
                                    key={candidate.candidate_id}
                                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                                  >
                                    <div>
                                      <p className="font-medium text-gray-800">{candidate.name}</p>
                                      <p className="text-sm text-gray-600">{candidate.email}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      candidate.progress === 'Applied' ? 'bg-yellow-100 text-yellow-800' :
                                      candidate.progress === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {candidate.progress}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Button */}
                          {q.notify && (
                            <button
                              onClick={() => startTest(q.question_id, q.candidates)}
                              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                            >
                              Start Test
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {showQuestionModal && selectedQuestion && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">
                            {selectedQuestion.question_title}
                          </h3>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                              {selectedQuestion.exam_type}
                            </span>
                            <span className="text-sm text-gray-500">
                              Job: {selectedQuestion.job_title}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowQuestionModal(false)}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="space-y-6">
                        {(() => {
                          try {
                            const parsedQuestions = Array.isArray(selectedQuestion.questions)
                              ? selectedQuestion.questions
                              : JSON.parse(selectedQuestion.questions);

                            return parsedQuestions.map((q, index) => (
                              <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                                <p className="font-medium text-gray-800">
                                  {index + 1}. {q.question}
                                </p>
                                {q.options && (
                                  <div className="ml-4 space-y-1">
                                    {q.options.map((option, optIndex) => (
                                      <p
                                        key={optIndex}
                                        className={`text-sm ${
                                          q.expected_answer === option
                                            ? "text-green-600 font-medium"
                                            : "text-gray-600"
                                        }`}
                                      >
                                        {String.fromCharCode(65 + optIndex)}. {option}
                                      </p>
                                    ))}
                                  </div>
                                )}
                                {q.expected_answer && !q.options && (
                                  <div className="ml-4">
                                    <p className="text-sm text-green-600 font-medium">
                                      Expected Answer: {q.expected_answer}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ));
                          } catch (err) {
                            return (
                              <p className="text-red-500">
                                Error parsing questions: Invalid format
                              </p>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Toaster />
    </div>
  );
};

export default HRDashboard;
