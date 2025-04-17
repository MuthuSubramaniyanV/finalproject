import React, { useState } from "react";
import { Menu, Users, BarChart, ChevronLeft, LogOut, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';
import { useEffect } from "react";

// Separate component for the form field to improve reusability
const FormField = ({ label, type = "text", value, onChange, error }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <input
      type={type}
      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
      value={value}
      onChange={onChange}
    />
    {error && <p className="text-red-600 text-sm">{error}</p>}
  </div>
);

// Separate component for the stats card to improve reusability
const StatsCard = ({ title, value, colorClass }) => (
  <div className="bg-gray-50 p-6 rounded-lg">
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("users");
  const [usersList, setUsersList] = useState([]);
  
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [emailError, setEmailError] = useState("");
  const [roleError, setRoleError] = useState("");

  const menuItems = [
    { id: "users", icon: <Users />, label: "Manage Users" },
    { id: "reports", icon: <BarChart />, label: "Reports" }
  ];

  const handleLogout = () => {
    localStorage.removeItem("authToken"); // Clear authentication token
    sessionStorage.clear(); // Clear session storage
    navigate("/login", { replace: true }); // Redirect to login page with replace
  
    // Prevent back navigation after logout
    window.history.pushState(null, null, "/login");
  };
  

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handleRoleChange = (e) => setRole(e.target.value);

  const validateForm = () => {
    let isValid = true;

    // Reset previous error messages
    setEmailError("");
    setRoleError("");

    // Validate email
    if (!email) {
      setEmailError("Email is required.");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) { // Basic email validation
      setEmailError("Please enter a valid email.");
      isValid = false;
    }

    // Validate role selection
    if (!role) {
      setRoleError("Role is required.");
      isValid = false;
    }

    return isValid;
  };

  const handleCreateUser = async (event) => {
    if (event && event.preventDefault) {
        event.preventDefault();
    }

    if (validateForm()) {
        try {
            const response = await fetch("http://localhost:5000/api/create-user", {  
                method: "POST",  
                headers: { "Content-Type": "application/json" },  
                body: JSON.stringify({ email, role }),  
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Something went wrong. Please try again later.");
        }
    }
};

 
 const sendEmail = async () => {
  try {
      const response = await fetch("http://localhost:5000/api/send-email", {  
          method: "POST",  
          headers: { "Content-Type": "application/json" },  
          body: JSON.stringify({ email, role }),  
      });

      const data = await response.json();
      if (response.ok && data.success) {
          toast.success(data.message);
      } else {
          toast.error(data.message);
      }
  } catch (error) {
      toast.error("Something went wrong. Please try again later.");
  }
};

  // Separate component for the sidebar button
  const SidebarButton = ({ id, icon, label, onClick, isActive }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center p-3 rounded-lg transition-colors
        ${isActive ? "bg-blue-600" : "hover:bg-slate-700"}`}
    >
      {icon}
      {isSidebarOpen && <span className="ml-3">{label}</span>}
    </button>
  );
  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      const response = await fetch("http://localhost:5000/update-user-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, status: newStatus }),
      });
  
      const data = await response.json();
  
      if (response.ok && data.success) {
        toast.success(data.message);
        // Refresh user list after update
        fetchUsers();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to update user status.");
    }
  };
  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/get-users");
      const data = await response.json();
      if (response.ok) {
        setUsersList(data);
      } else {
        toast.error("Failed to load users.");
      }
    } catch (error) {
      toast.error("Error fetching users.");
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  const UsersTable = ({ users, onRefresh }) => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full 
                    ${user.status === "Activated" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.status === "Activated" ? (
                    <button
                      onClick={() => handleUpdateStatus(user.id, "Deactivated")}
                      className="text-red-600 hover:text-red-800"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(user.id, "Activated")}
                      className="text-green-600 hover:text-green-800"
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  

  return (
    <div className="min-h-screen bg-gray-100">
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg"
      >
        <Menu />
      </button>

      <aside
        className={`fixed top-0 left-0 h-full bg-slate-800 text-white transition-all duration-300 ease-in-out z-40 
          ${isSidebarOpen ? 'w-64' : 'w-0 md:w-20'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          {isSidebarOpen && <h2 className="text-xl font-bold">Admin Panel</h2>}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="hidden md:block"
          >
            <ChevronLeft />
          </button>
        </div>

        <nav className="mt-6 space-y-2 px-2 flex flex-col h-[calc(100%-5rem)]">
          <div className="space-y-2">
            {menuItems.map(({ id, icon, label }) => (
              <SidebarButton
                key={id}
                id={id}
                icon={icon}
                label={label}
                onClick={() => setActiveTab(id)}
                isActive={activeTab === id}
              />
            ))}
          </div>
          
          {/* Logout Button - Moved to bottom of sidebar */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-3 rounded-lg transition-colors hover:bg-red-600 mt-auto"
          >
            <LogOut />
            {isSidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </nav>
      </aside>

      <main className={`transition-all duration-300 p-4 md:p-8 
        ${isSidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <div className="bg-white rounded-2xl shadow-sm mt-12 md:mt-0">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800">
              {activeTab === "users" ? "Manage Users" : "User Reports"}
            </h2>
          </div>
          
          <div className="p-6">
            {activeTab === "users" && (
              <div className="space-y-6">
                {/* Create User Form */}
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-medium mb-4">Create New User</h3>
                  <div className="space-y-4">
                    <FormField 
                      label="Email" 
                      type="email" 
                      value={email} 
                      onChange={handleEmailChange} 
                      error={emailError} 
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <select
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                        value={role}
                        onChange={handleRoleChange}
                      >
                        <option value="">Select role</option>
                        <option value="Hr">HR</option>
                        <option value="Panel">Panel Members</option>
                      </select>
                      {roleError && <p className="text-red-600 text-sm">{roleError}</p>}
                    </div>
                    <button
                        onClick={(e) => {
                          e.preventDefault();  // Prevents unwanted default behavior
                          handleCreateUser(e);
                          sendEmail();
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full md:w-auto"
                      >
                        Create User
                      </button>
                  </div>
                </div>

                <UsersTable 
                  users={usersList} 
                  onRefresh={() => {
                    toast.promise(
                      fetchUsers(),
                      {
                        loading: 'Refreshing...',
                        success: 'User list updated',
                        error: 'Failed to refresh'
                      }
                    );
                  }} 
                />
              </div>
            )}

            {activeTab === "reports" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatsCard 
                    title="Total Users" 
                    value={usersList.length}
                    colorClass="text-blue-600"
                  />
                  <StatsCard 
                    title="HR Members" 
                    value={usersList.filter(user => user.role === "Hr").length}
                    colorClass="text-green-600"
                  />
                  <StatsCard 
                    title="Panel Members" 
                    value={usersList.filter(user => user.role === "Panel").length}
                    colorClass="text-yellow-600"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast Notification Container */}
      <Toaster />
    </div>
  );
};

export default AdminDashboard;
