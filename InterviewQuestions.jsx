import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';

const InterviewPanelInterface = ({ questions, prompt, taskId }) => {
  const handleSave = async () => {
    try {
      const username = localStorage.getItem("username"); // Get username from localStorage
      
      const response = await axios.post(
        "http://localhost:5000/api/save-questions",
        {
          question_title: `Interview_${prompt.substring(0, 30)}...`,
          questions: questions,
          exam_type: "Interview",
          created_by: username, // Add this line
          task_id: taskId
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }
      );

      if (response.data.status === "success") {
        toast.success("Questions saved successfully!");
      } else {
        throw new Error(response.data.message || "Failed to save questions");
      }
    } catch (error) {
      console.error("Error saving questions:", error);
      toast.error(error.response?.data?.message || "Failed to save questions");
    }
  };

  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fileNameError, setFileNameError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('selectedInterviewQuestions');
    if (saved) {
      try {
        setSelectedQuestions(JSON.parse(saved));
      } catch (err) {
        console.error('Error parsing saved questions:', err);
        localStorage.removeItem('selectedInterviewQuestions');
      }
    }
  }, []);

  const handleSelect = (question) => {
    if (!selectedQuestions.find((q) => q.id === question.id)) {
      const updated = [...selectedQuestions, question];
      setSelectedQuestions(updated);
      localStorage.setItem('selectedInterviewQuestions', JSON.stringify(updated));
      toast.success('Question added to selection');
    } else {
      toast.error('This question is already in your selection');
    }
  };

  const handleRemove = (questionId) => {
    const updated = selectedQuestions.filter((q) => q.id !== questionId);
    setSelectedQuestions(updated);
    localStorage.setItem('selectedInterviewQuestions', JSON.stringify(updated));
    toast.success('Question removed from selection');
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const openSaveModal = () => {
    if (selectedQuestions.length === 0) {
      toast.error("No questions selected to save");
      return;
    }
    setIsModalOpen(true);
  };

  const handleSaveToDatabase = async () => {
    if (!fileName.trim()) {
        setFileNameError('File name is required');
        return;
    }

    setIsLoading(true);
    setFileNameError('');

    try {
        const username = localStorage.getItem('username');
        if (!username) {
            toast.error("User information not found");
            return;
        }

        // Format the questions to match the required structure
        const formattedQuestions = selectedQuestions.map(q => ({
            question: q.question,
            expected_answer: q.answer || q.expectedAnswer || '',
            type: 'interview'
        }));

        // Validate the questions before sending
        if (!formattedQuestions.length) {
            toast.error("No questions selected");
            return;
        }

        const requestData = {
            question_title: fileName.trim(),
            questions: formattedQuestions,
            exam_type: 'Interview',
            created_by: username,
            task_id: taskId  // Make sure taskId is passed as a prop
        };

        // Validate all required fields are present
        const requiredFields = ['question_title', 'questions', 'exam_type', 'created_by', 'task_id'];
        const missingFields = requiredFields.filter(field => !requestData[field]);
        
        if (missingFields.length > 0) {
            toast.error(`Missing required fields: ${missingFields.join(', ')}`);
            return;
        }

        const response = await axios.post(
            'http://localhost:5000/api/panel/save-questions',
            requestData,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("authToken")}`
                }
            }
        );

        if (response.data.status === "success") {
            toast.success("Questions saved successfully!");
            setFileName('');
            setSelectedQuestions([]);
            localStorage.removeItem('selectedInterviewQuestions');
            setIsModalOpen(false);
        }
    } catch (error) {
        console.error("Error saving questions:", error);
        toast.error(error.response?.data?.message || "Failed to save questions");
    } finally {
        setIsLoading(false);
    }
};

  // Custom components for ReactMarkdown
  const components = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  if (!questions || questions.length === 0) {
    return <div className="p-6 text-center text-gray-500">No questions available</div>;
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Question Navigation */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Interview Questions: {prompt}</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0 || isLoading}
            className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
          >
            ← Previous
          </button>
          <span className="px-4 py-2">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1 || isLoading}
            className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Current Question with Answer */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="space-y-6">
          <div className="border-b pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">{currentQuestion.question}</h3>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {currentQuestion.type || 'conceptual'}
              </span>
            </div>
          </div>

          {/* Answer Section with Enhanced Markdown */}
          <div className="mt-4">
            <h4 className="text-lg font-semibold mb-3 text-gray-700">Answer:</h4>
            <div className="prose prose-slate max-w-none bg-gray-50 p-4 rounded-lg">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {currentQuestion.answer || currentQuestion.expectedAnswer || 'No answer provided'}
              </ReactMarkdown>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => handleSelect(currentQuestion)}
              disabled={selectedQuestions.some(q => q.id === currentQuestion.id) || isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:bg-gray-400"
            >
              {selectedQuestions.some(q => q.id === currentQuestion.id) ? 'Already Saved' : 'Save Question'}
            </button>
          </div>
        </div>
      </div>

      {/* Selected Questions with Enhanced Markdown */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-bold mb-4">Saved Questions ({selectedQuestions.length})</h3>
        {selectedQuestions.length === 0 ? (
          <p className="text-gray-500 italic">No questions selected yet</p>
        ) : (
          <div className="space-y-4">
            {selectedQuestions.map((q) => (
              <div key={q.id} className="p-4 border rounded hover:bg-gray-50">
                <div className="mb-3">
                  <p className="font-medium text-gray-800">{q.question}</p>
                </div>
                <div className="pl-4 border-l-2 border-gray-200 mb-3">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                    {q.answer || q.expectedAnswer || ''}
                  </ReactMarkdown>
                </div>
                <button
                  onClick={() => handleRemove(q.id)}
                  disabled={isLoading}
                  className="text-red-600 text-sm hover:text-red-800 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Questions Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={openSaveModal}
          disabled={selectedQuestions.length === 0 || isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Selected Questions'}
        </button>
      </div>

      {/* Modal Dialog for File Name Input */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Save Question Set</h3>
            <div className="mb-4">
              <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-1">
                File Name
              </label>
              <input
                type="text"
                id="fileName"
                value={fileName}
                onChange={(e) => {
                  setFileName(e.target.value);
                  if (e.target.value.trim()) setFileNameError('');
                }}
                className={`w-full p-2 border rounded ${fileNameError ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter a name for your question set"
                disabled={isLoading}
              />
              {fileNameError && (
                <p className="text-red-500 text-sm mt-1">{fileNameError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFileName('');
                  setFileNameError('');
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToDatabase}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save to Database'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPanelInterface;