import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';

const MCQPanelInterface = ({ questions, prompt, taskId }) => {
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [fileName, setFileName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Add validation for taskId prop
  useEffect(() => {
    if (!taskId) {
      toast.error("Task ID is missing");
      console.error("Task ID is required but not provided");
    }
  }, [taskId]);

  useEffect(() => {
    // Load selected questions from localStorage
    const savedQuestions = JSON.parse(localStorage.getItem("selectedQuestions")) || [];
    setSelectedQuestions(savedQuestions);
  }, []);

  const handleSelectQuestion = (question) => {
    if (!selectedQuestions.some(q => q.question === question.question)) {
      const updatedSelections = [...selectedQuestions, question];
      setSelectedQuestions(updatedSelections);
      localStorage.setItem("selectedQuestions", JSON.stringify(updatedSelections));
      toast.success('Question added to selection');
    } else {
      toast.error('This question is already selected');
    }
  };

  const handleRemoveQuestion = (index) => {
    const updatedSelections = selectedQuestions.filter((_, i) => i !== index);
    setSelectedQuestions(updatedSelections);
    localStorage.setItem("selectedQuestions", JSON.stringify(updatedSelections));
    toast.success('Question removed from selection');
  };

  const handleSaveToDatabase = async () => {
    if (!fileName.trim()) {
      toast.error('Please enter a file name');
      return;
    }

    if (!taskId) {
      toast.error('Task ID is required');
      return;
    }

    setIsSaving(true);
    try {
      const username = localStorage.getItem('username');
      if (!username) {
        toast.error('User information not found');
        return;
      }

      // Format the MCQ questions to include required fields
      const formattedQuestions = selectedQuestions.map(q => ({
        question: q.question,
        expected_answer: q.correctAnswer !== undefined ? 
          q.options[q.correctAnswer] : 
          q.answer || '',
        options: q.options || [],
        explanation: q.explanation || ''
      }));

      // Validate questions before sending
      if (!formattedQuestions.length) {
        toast.error('No questions selected');
        return;
      }

      const requestData = {
        question_title: fileName,
        questions: formattedQuestions,
        exam_type: 'MCQ',
        created_by: username,
        task_id: taskId // Ensure taskId is included
      };

      console.log('Sending request data:', requestData); // Debug log

      const response = await axios.post(
        'http://localhost:5000/api/panel/save-questions',
        requestData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === "success") {
        toast.success('Questions saved successfully!');
        setFileName('');
        setSelectedQuestions([]);
        localStorage.removeItem("selectedQuestions");
        setShowSaveDialog(false);
      }
    } catch (error) {
      console.error('Error saving questions:', error);
      toast.error(error.response?.data?.message || 'Failed to save questions');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      const username = localStorage.getItem("username"); // Get username from localStorage
      
      const response = await axios.post(
        "http://localhost:5000/api/save-selected-questions",
        {
          file_name: `MCQ_${prompt.substring(0, 30)}...`,
          questions: questions,
          created_by: username // Add this line
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

  const handleCompleteSelection = () => {
    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question');
      return;
    }
    setShowSaveDialog(true);
  };

  if (!questions || questions.length === 0) {
    return <div>No questions available</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="flex space-x-6 p-4 bg-white rounded shadow">
      {/* Left Panel - Questions */}
      <div className="w-2/3">
        <h2 className="text-xl font-bold mb-4">
          Question {currentQuestionIndex + 1} of {questions.length}
        </h2>
        
        <div className="mb-4">
          <p className="text-lg font-medium">{currentQuestion.question}</p>
        </div>
        
        <div className="space-y-2 mb-6">
          {currentQuestion.options.map((option, idx) => (
            <div 
              key={idx}
              className={`p-2 border rounded ${idx === currentQuestion.correctAnswer ? 'bg-green-100 border-green-500' : 'hover:bg-gray-50'}`}
            >
              <span className="mr-2">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </div>
          ))}
        </div>
        
        <div className="mb-6 p-3 bg-blue-50 rounded">
          <h3 className="font-bold text-blue-800">Explanation:</h3>
          <p>{currentQuestion.explanation}</p>
        </div>

        <button
          onClick={() => handleSelectQuestion(currentQuestion)}
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Select Question
        </button>
        
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          
          <button
            onClick={() => setCurrentQuestionIndex(i => Math.min(questions.length - 1, i + 1))}
            disabled={currentQuestionIndex === questions.length - 1}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Right Panel - Selected Questions */}
      <div className="w-1/3 bg-gray-50 p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Selected Questions</h2>
        {selectedQuestions.length === 0 ? (
          <p className="text-gray-500">No questions selected</p>
        ) : (
          <div className="space-y-4">
            {selectedQuestions.map((q, idx) => (
              <div key={idx} className="p-3 border rounded bg-white shadow">
                <p className="font-medium">{q.question}</p>
                <button
                  onClick={() => handleRemoveQuestion(idx)}
                  className="mt-2 px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedQuestions.length > 0 && (
          <button
            onClick={handleCompleteSelection}
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Selected Questions
          </button>
        )}
      </div>

      {/* Save Dialog Modal */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-bold mb-4">Save Questions</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter a name for this question set"
                disabled={isSaving}
              />
            </div>
            <div className="text-sm text-gray-600 mb-4">
              {selectedQuestions.length} questions will be saved to the database.
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToDatabase}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save to Database'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCQPanelInterface;