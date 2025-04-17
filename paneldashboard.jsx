import React, { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import {
  Menu,
  ChevronLeft,
  LogOut,
  FileText,
  Edit,
  BarChart,
  Users,
  Clipboard,
  CheckCircle,
  Play,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import MCQPanelInterface from "./McqQuestion";
import InterviewPanelInterface from './InterviewQuestions';

const FormField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <input
      type={type}
      className={`w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all ${
        disabled ? "bg-gray-100 cursor-not-allowed" : ""
      }`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  </div>
);

const StatsCard = ({ title, value, colorClass }) => (
  <div className="bg-gray-50 p-6 rounded-lg">
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className={`text-4xl font-bold ${colorClass}`}>
      {value}
    </p>
  </div>
);

const TaskCard = ({ task, onSelect }) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${task.type === 'MCQ' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
            {task.type === 'MCQ' ? <FileText size={20} /> : <Clipboard size={20} />}
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium">{task.title}</h3>
            {task.levelIndicator && (
              <span className={`text-sm font-medium ${
                task.levelIndicator === 'Beginner Level' ? 'text-green-600' :
                task.levelIndicator === 'Intermediate Level' ? 'text-blue-600' :
                'text-purple-600'
              }`}>
                {task.levelIndicator}
              </span>
            )}
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          task.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          task.status.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {task.status}
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-600 font-medium mb-2">Description:</p>
          <p className="text-gray-800">{task.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 font-medium">Exam Type:</p>
            <div className={`mt-1 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              task.type === 'MCQ' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}>
              {task.type === 'MCQ' ? '📝 MCQ' : '🗣 Interview'}
            </div>
          </div>
          
          <div>
            <p className="text-gray-600 font-medium">Time Allowed:</p>
            <p className="text-gray-800">{task.time} minutes</p>
          </div>
          
          <div>
            <p className="text-gray-600 font-medium">Test Date:</p>
            <p className="text-gray-800">{new Date(task.test_start_date).toLocaleDateString()}</p>
          </div>
          
          <div>
            <p className="text-gray-600 font-medium">Category:</p>
            <p className="text-gray-800">{task.category}</p>
          </div>
        </div>

        {task.type === 'INTERVIEW' && (
          <div className="grid grid-cols-2 gap-4 mt-2 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-gray-600 font-medium">Minimum Mark Required:</p>
              <p className="text-gray-800">{task.coverage}%</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Follow-up Questions:</p>
              <p className="text-gray-800">{task.followup}</p>
            </div>
          </div>
        )}

        {task.candidates && task.candidates.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-lg font-semibold text-gray-700">
                Assigned Candidates ({task.candidates.length})
              </h4>
              <span className={`text-sm px-2 py-1 rounded-full ${
                task.candidates.filter(c => c.candidate_level !== task.expected_level).length > 0
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {task.candidates.filter(c => c.candidate_level !== task.expected_level).length === 0
                  ? '✓ All levels match'
                  : `⚠️ ${task.candidates.filter(c => c.candidate_level !== task.expected_level).length} level mismatch(es)`
                }
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              {task.candidates.map((candidate) => (
                <div 
                  key={candidate.candidate_id} 
                  className="bg-gray-50 p-3 rounded-lg border border-gray-100"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{candidate.name}</p>
                      <p className="text-sm text-gray-600">{candidate.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full
                          ${candidate.progress === 'Applied' ? 'bg-yellow-100 text-yellow-800' :
                            candidate.progress === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            candidate.progress === 'Completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {candidate.progress || 'Pending'}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full
                      ${candidate.candidate_level === 'Beginner' ? 'bg-green-100 text-green-800' :
                        candidate.candidate_level === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {candidate.candidate_level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button 
            onClick={() => onSelect(task)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <span>Generate {task.type}</span>
            {task.type === 'MCQ' ? <FileText size={16} /> : <Clipboard size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// Updated QuestionCard component
const QuestionCard = ({ question, onStartHiring, onDelete, taskId }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const currentUser = localStorage.getItem("username");

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(question);
    setShowDeleteConfirm(false);
  };

  const handleStartHiringClick = () => {
    onStartHiring(question, taskId);
  };

  const canDelete = !question.notify && question.created_by === currentUser;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${question.exam_type === 'MCQ' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
            {question.exam_type === 'MCQ' ? <FileText size={20} /> : <Clipboard size={20} />}
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium">{question.question_title}</h3>
            <p className="text-sm text-gray-500">Created by: {question.created_by}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          question.exam_type === 'MCQ' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {question.exam_type}
        </div>
      </div>
      <p className="text-gray-600 mb-4">
        {`${question.exam_type} assessment with ${
          typeof question.questions === 'string' 
            ? JSON.parse(question.questions).length 
            : question.questions.length
        } questions`}
      </p>
      <div className="flex justify-end space-x-2">
        {canDelete && (
          <button 
            onClick={handleDeleteClick}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center"
          >
            <Trash2 size={16} className="mr-2" />
            Delete
          </button>
        )}
        <button 
          onClick={handleStartHiringClick}
          className={`px-4 py-2 ${
            question.notify 
              ? 'bg-gray-500 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white rounded-lg transition-colors flex items-center group`}
          disabled={question.notify}
        >
          <Play size={16} className="mr-2 group-hover:animate-pulse" />
          {question.notify ? 'Notified to HR' : 'Notify HR'}
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this question? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getPanelLevel = (task, username) => {
  if (!task.panel_id) return '';
  
  const panels = task.panel_id.split(',');
  const index = panels.indexOf(username);
  
  switch(index) {
    case 0: return 'Easy Level';
    case 1: return 'Intermediate Level';
    case 2: return 'Advanced Level';
    default: return '';
  }
};

const PanelDashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks");
  const [prompt, setPrompt] = useState("");
  const [showMCQ, setShowMCQ] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedQuestion, setGeneratedQuestion] = useState("");
  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const cooldownTimerRef = useRef(null);
  const COOLDOWN_PERIOD = 30;

  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const [assignedTasks, setAssignedTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [selectedQuestionType, setSelectedQuestionType] = useState("all");

  const [panelName, setPanelName] = useState("");

  const menuItems = [
    { id: "tasks", icon: <Clipboard />, label: "Assigned Tasks" },
    { id: "generate", icon: <Edit />, label: "Generate Questions" },
    { id: "manage", icon: <FileText />, label: "Manage Questions" },
    { id: "stats", icon: <BarChart />, label: "Statistics" },
  ];

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (username) {
      setPanelName(username);
    }
  }, []);

  const startCooldown = () => {
    setIsButtonDisabled(true);
    setCooldownTime(COOLDOWN_PERIOD);
    cooldownTimerRef.current = setInterval(() => {
      setCooldownTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(cooldownTimerRef.current);
          setIsButtonDisabled(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    sessionStorage.clear();
    navigate("/login");
  };

  const generateQuestion = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    const numMatch = prompt.match(/\d+/);
    const numQuestions = numMatch ? parseInt(numMatch[0]) : 10;
    
    if (numQuestions < 10 || numQuestions > 15) {
      toast.error("Please request between 10-15 questions");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      
      const isInterview = selectedTask 
        ? selectedTask.type.toUpperCase() === 'INTERVIEW'
        : prompt.toLowerCase().includes('interview');
      
      const cleanPrompt = prompt
        .replace(/generate|create|\d+|questions|interview|mcq|about/gi, '')
        .trim();

      if (!cleanPrompt) {
        toast.error("Please specify a subject or topic");
        setLoading(false);
        return;
      }

      const endpoint = isInterview 
        ? 'http://localhost:5002/api/panel/generate-interview-questions'
        : 'http://localhost:5002/api/panel/generate-question';

      console.log("Using endpoint:", endpoint);

      const response = await axios.post(
        endpoint,
        {
          prompt: cleanPrompt,
          num_questions: numQuestions,
          task_id: selectedTask?.id || null,
          type: isInterview ? 'INTERVIEW' : 'MCQ'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data?.success && response.data?.questions) {
        setGeneratedQuestions(response.data.questions);
        setShowMCQ(!isInterview);
        toast.success(`Generated ${response.data.questions.length} ${isInterview ? 'interview' : 'MCQ'} questions!`);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      toast.error(error.response?.data?.error || "Failed to generate questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSelect = (task) => {
    setSelectedTask(task);
    setActiveTab("generate");
  };

  const handleStartHiring = async (question, taskId) => {
    try {
      const post_id = taskId;

      const response = await axios.post(
        'http://localhost:5000/api/panel/notify-hr',
        {
          questionId: question.question_id,
          postId: post_id
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.status === "success") {
        toast.success(`Notified HR about "${question.question_title}"`, {
          duration: 3000,
          icon: '🔔',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });

        setQuestions(prevQuestions => 
          prevQuestions.map(q => 
            q.question_id === question.question_id 
              ? {...q, notify: true}
              : q
          )
        );

        if (selectedTask) {
          setAssignedTasks(prevTasks => 
            prevTasks.map(task => 
              task.id === selectedTask.id
                ? {...task, status: 'Completed'}
                : task
            )
          );
        }
      } else {
        throw new Error(response.data.message || "Failed to notify HR");
      }
    } catch (error) {
      console.error("Error notifying HR:", error);
      toast.error("Failed to notify HR. Please try again.");
    }
  };

  const handleDeleteQuestion = async (question) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/panel/delete-question/${question.question_id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data.status === "success") {
        setQuestions(prevQuestions => 
          prevQuestions.filter(q => q.question_id !== question.question_id)
        );
        
        toast.success("Question deleted successfully", {
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
      } else {
        throw new Error(response.data.message || "Failed to delete question");
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error(
        error.response?.data?.message || 
        "Failed to delete question"
      );
    }
  };

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const username = localStorage.getItem("username");
      if (!username) {
        toast.error("User not found. Please login again.");
        return;
      }

      const endpoint = selectedQuestionType === "all" 
        ? `http://localhost:5000/api/questions?username=${username}`
        : `http://localhost:5000/api/questions/${selectedQuestionType}?username=${username}`;
      
      const response = await axios.get(endpoint, {
        headers: {
          "Content-Type": "application/json"
        },
        withCredentials: true
      });
      
      if (response.data?.status === "success") {
        setQuestions(response.data.questions);
      } else {
        throw new Error("Invalid response format");
      }

    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to fetch questions");
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    const fetchAssignedTasks = async () => {
      setLoadingTasks(true);
      try {
        const username = localStorage.getItem("username");
        console.log("Fetching tasks for:", username);

        if (!username) {
          toast.error("User information not found");
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/api/panel/tasks/${username}`
        );

        console.log("API Response:", response.data);

        if (response.data?.status === "success") {
          const tasks = response.data.tasks.map(task => {
            const panelLevel = task.panel_id ? getPanelLevel(task, username) : '';
            return {
              ...task,
              panelLevel,
              levelIndicator: task.panel_id && (
                task.panel_id.split(',')[0] === username ? 'Beginner Level' :
                task.panel_id.split(',')[1] === username ? 'Intermediate Level' :
                task.panel_id.split(',')[2] === username ? 'Advanced Level' : ''
              )
            };
          });

          const sortedTasks = tasks.sort((a, b) => {
            const levelOrder = {
              'Beginner Level': 1,
              'Intermediate Level': 2,
              'Advanced Level': 3
            };
            return (levelOrder[a.levelIndicator] || 0) - (levelOrder[b.levelIndicator] || 0);
          });

          setAssignedTasks(sortedTasks);
          console.log("Processed tasks:", sortedTasks);
        } else {
          toast.error("Failed to fetch tasks");
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast.error(error.response?.data?.message || "Failed to fetch assigned tasks");
      } finally {
        setLoadingTasks(false);
      }
    };

    if (activeTab === "tasks") {
      fetchAssignedTasks();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "manage") {
      fetchQuestions();
    }
  }, [activeTab, selectedQuestionType]);

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoadingCandidates(true);
      try {
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("userId");

        if (!panelMemberId) {
          toast.error("Panel member ID not found.");
          setLoadingCandidates(false);
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/panel/assigned-candidates?id=${panelMemberId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setCandidates(response.data.candidates || []);
      } catch (error) {
        console.error("Error fetching candidates:", error);
        const errorMessage =
          error.response?.data?.error ||
          error.message ||
          "Failed to fetch assigned candidates.";
        toast.error(errorMessage);
      } finally {
        setLoadingCandidates(false);
      }
    };

    if (activeTab === "candidates") {
      fetchCandidates();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "generate" && selectedTask) {
      setSelectedTask(null);
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-100">
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg"
      >
        <Menu />
      </button>

      <aside
        className={`fixed top-0 left-0 h-full bg-slate-800 text-white transition-all duration-300 ease-in-out z-40 ${
          isSidebarOpen ? "w-64" : "w-0 md:w-20"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          {isSidebarOpen && (
            <div>
              <h2 className="text-xl font-bold">Panel</h2>
              <p className="text-medium font-bold">Welcome, {panelName}</p>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="hidden md:block">
            <ChevronLeft />
          </button>
        </div>
        <nav className="mt-6 space-y-2 px-2 flex flex-col h-[calc(100%-5rem)]">
          {menuItems.map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                activeTab === id ? "bg-blue-600" : "hover:bg-slate-700"
              }`}
            >
              {icon}
              {isSidebarOpen && <span className="ml-3">{label}</span>}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-3 rounded-lg transition-colors hover:bg-red-600 mt-auto"
          >
            <LogOut />
            {isSidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </nav>
      </aside>

      <main
        className={`transition-all duration-300 p-4 md:p-8 ${
          isSidebarOpen ? "md:ml-64" : "md:ml-20"
        }`}
      >
        <div className="bg-white rounded-2xl shadow-sm mt-12 md:mt-0">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800">
              {activeTab === "tasks"
                ? "Assigned Tasks from HR"
                : activeTab === "generate"
                ? "Generate Questions"
                : activeTab === "manage"
                ? "Manage Questions"
                : activeTab === "candidates"
                ? "Assigned Candidates"
                : "Question Statistics"}
            </h2>
          </div>
          <div className="p-6">
            {activeTab === "tasks" && (
              <div className="space-y-6">
                {loadingTasks ? (
                  <div className="text-center py-8">
                    <p>Loading assigned tasks...</p>
                  </div>
                ) : assignedTasks.length > 0 ? (
                  <div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {assignedTasks.map((task) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          onSelect={handleTaskSelect}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No tasks assigned yet.</p>
                    <p className="text-gray-500 mt-2">HR will assign MCQ or Interview tasks for you to complete.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "generate" && (
              <div className="space-y-6">
                {generatedQuestions.length > 0 ? (
                  <>
                    <button
                      onClick={() => {
                        setGeneratedQuestions([]);
                        setShowMCQ(false);
                      }}
                      className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      ← Back to Question Generator
                    </button>
                    {showMCQ ? (
                      <MCQPanelInterface 
                        questions={generatedQuestions}
                        prompt={prompt}
                        taskId={selectedTask?.id}
                      />
                    ) : (
                      <InterviewPanelInterface
                        questions={generatedQuestions}
                        prompt={prompt}
                        taskId={selectedTask?.id}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {selectedTask && (
                      <div className="bg-blue-50 p-4 mb-6 rounded-lg border border-blue-200">
                        <div className="flex items-start">
                          <div className="mr-3">
                            {selectedTask.type === 'MCQ' ? <FileText className="text-blue-600" /> : <Clipboard className="text-green-600" />}
                          </div>
                          <div>
                            <h3 className="font-semibold text-blue-800">Currently working on:</h3>
                            <p className="text-blue-700">{selectedTask.title} ({selectedTask.type})</p>
                            <p className="text-sm text-blue-600 mt-1">{selectedTask.description}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  
                    <FormField
                      label="Enter Prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={isButtonDisabled || loading}
                    />
                    <button
                      onClick={generateQuestion}
                      className={`px-4 py-2 ${
                        isButtonDisabled
                          ? "bg-gray-400"
                          : "bg-blue-600 hover:bg-blue-700"
                      } text-white rounded-lg transition-colors`}
                      disabled={isButtonDisabled || loading}
                    >
                      {loading ? "Generating..." : "Generate Questions"}
                    </button>

                    <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">How to Generate Questions:</h3>
                      <div className="space-y-4">
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <h4 className="font-semibold text-yellow-800">Important Note:</h4>
                          <p className="text-yellow-700">You must generate between 10-15 questions at a time.</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-600">For MCQ Questions:</h4>
                          <p className="text-gray-600 font-bold">Prompt Template: "Generate [number] MCQ about [topic] at Difficulty Level["Beginner,Intermediate,Advanced"]"</p>
                          <p className="text-gray-500 text-sm font-bold">Example Prompt: "Generate 12 MCQ about Java at Beginner"</p>
                        </div>
                        <div>
                          <h4 className="font-bold text-green-600">For Interview Questions:</h4>
                          <p className="text-gray-600 font-bold">Prompt Template: "Generate [number] interview questions about [topic] at Difficulty Level["Beginner","Intermediate","Advanced"]"</p>
                          <p className="text-gray-500 text-sm font-bold">Example Prompt: "Generate 10 interview questions about Python at Intermediate"</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "manage" && (
              <div className="space-y-6">
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => setSelectedQuestionType("all")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedQuestionType === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    }`}
                  >
                    All Questions
                  </button>
                  <button
                    onClick={() => setSelectedQuestionType("MCQ")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedQuestionType === "MCQ"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    }`}
                  >
                    MCQ Questions
                  </button>
                  <button
                    onClick={() => setSelectedQuestionType("Interview")}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedQuestionType === "Interview"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    }`}
                  >
                    Interview Questions
                  </button>
                </div>

                {loadingQuestions ? (
                  <div className="text-center py-8">
                    <p>Loading questions...</p>
                  </div>
                ) : questions.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {questions.map((question) => (
                      <QuestionCard
                        key={question.question_id}
                        question={question}
                        onStartHiring={handleStartHiring}
                        onDelete={handleDeleteQuestion}
                        taskId={selectedTask?.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No questions found.</p>
                    <p className="text-gray-500 mt-2">
                      Go to the "Generate Questions" tab to create new questions.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "candidates" && (
              <div className="space-y-6">
                {loadingCandidates ? (
                  <div className="text-center py-8">
                    <p>Loading candidates...</p>
                  </div>
                ) : candidates.length > 0 ? (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {["Beginner", "Intermediate", "Advanced"].map(level => (
                        <div key={level} className={`p-4 rounded-lg ${
                          level === "Beginner" ? "bg-green-50 border border-green-200" :
                          level === "Intermediate" ? "bg-blue-50 border border-blue-200" :
                          "bg-purple-50 border border-purple-200"
                        }`}>
                          <h3 className={`text-lg font-semibold ${
                            level === "Beginner" ? "text-green-700" :
                            level === "Intermediate" ? "text-blue-700" :
                            "text-purple-700"
                          }`}>{level} Level</h3>
                          <p className="text-sm mt-1">
                            {candidates.filter(c => c.candidate_level === level).length} candidates
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name & Level
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Contact Info
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Job Details
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Interview Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {candidates.map((candidate) => (
                            <tr key={candidate.candidate_id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {candidate.name}
                                    </div>
                                    <div className={`text-sm ${
                                      candidate.candidate_level === "Beginner" ? "text-green-600" :
                                      candidate.candidate_level === "Intermediate" ? "text-blue-600" :
                                      "text-purple-600"
                                    }`}>
                                      {candidate.candidate_level} Level
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{candidate.email}</div>
                                <div className="text-sm text-gray-500">{candidate.phone}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{candidate.job_title}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {candidate.job_description}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  candidate.progress === "Completed" ? "bg-green-100 text-green-800" :
                                  candidate.progress === "In Progress" ? "bg-yellow-100 text-yellow-800" :
                                  "bg-gray-100 text-gray-800"
                                }`}>
                                  {candidate.progress || "Pending"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right text-sm font-medium">
                                <button
                                  className="text-blue-600 hover:text-blue-900"
                                  onClick={() => {/* Add interview action */}}
                                >
                                  Start Interview
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No candidates assigned yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "stats" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard title="Total Questions" value="" colorClass="text-blue-600" />
                <StatsCard title="Candidates" value="" colorClass="text-green-600" />
                <StatsCard title="Avg. Score" value="" colorClass="text-purple-600" />
              </div>
            )}
          </div>
        </div>
      </main>

      <Toaster />
    </div>
  );
};

export default PanelDashboard;

// In your login component where you handle successful login
const handleLoginSuccess = (data) => {
  localStorage.setItem("authToken", data.token);
  localStorage.setItem("username", data.user.username);
  localStorage.setItem("panelid",data.user.id);
};

MCQPanelInterface.propTypes = {
  questions: PropTypes.array.isRequired,
  prompt: PropTypes.string.isRequired,
  taskId: PropTypes.number.isRequired
};
