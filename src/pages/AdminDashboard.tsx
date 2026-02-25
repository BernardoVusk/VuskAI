import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { KeyGenerator } from '../components/admin/KeyGenerator';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'keys'>('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAdminAuthenticated');
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-black text-white font-sans">
      <AdminSidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout} 
      />
      
      <div className="flex-1 overflow-auto bg-[#0A0A0A]">
        {activeTab === 'dashboard' && (
          <div className="p-8 flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <h3 className="text-xl font-medium mb-2">Dashboard Empty</h3>
              <p>Select "Key Generator" from the sidebar.</p>
            </div>
          </div>
        )}
        
        {activeTab === 'keys' && <KeyGenerator />}
      </div>
    </div>
  );
};

export default AdminDashboard;
