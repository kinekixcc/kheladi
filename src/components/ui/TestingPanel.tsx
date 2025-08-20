import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TestTube, Database, User, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../lib/database';
import { isSupabaseConfigured } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { notificationService } from '../../lib/database';

interface TestingPanelProps {}

export const TestingPanel: React.FC<TestingPanelProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'database' | 'profile' | 'auth'>('database');
  const [testResults, setTestResults] = useState<{ [key: string]: { success: boolean; message: string; details?: any } }>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const shouldShowPanel = import.meta.env.DEV && user?.role === 'admin';

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setLoading(true);
    try {
      const result = await testFunction();
      setTestResults(prev => ({
        ...prev,
        [testName]: { success: true, message: 'Test passed', details: result }
      }));
      toast.success(`${testName} test passed!`);
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { 
          success: false, 
          message: error.message || 'Test failed', 
          details: error 
        }
      }));
      toast.error(`${testName} test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not configured');
    }
    
    const { data, error } = await profileService.getAllProfiles();
    if (error) throw error;
    return { profileCount: data?.length || 0 };
  };

  const testProfileUpdate = async () => {
    if (!user?.id) {
      throw new Error('No user logged in');
    }
    
    const testUpdate = {
      bio: `Test update at ${new Date().toLocaleTimeString()}`,
      location: 'Test Location'
    };
    
    const result = await profileService.updateProfile(user.id, testUpdate);
    return result;
  };

  const testProfileRetrieval = async () => {
    if (!user?.id) {
      throw new Error('No user logged in');
    }
    
    const profile = await profileService.getProfile(user.id);
    return profile;
  };

  const testNotifications = async () => {
    try {
      setTestResults(prev => ({ 
        ...prev, 
        notifications: { success: false, message: '🔄 Testing...', details: null }
      }));
      
      // Test creating a system notification
      const systemNotif = await notificationService.createSystemNotification(
        'Test System Notification',
        'This is a test system notification to verify the notification system is working.',
        'all'
      );
      
      if (systemNotif) {
        setTestResults(prev => ({ 
          ...prev, 
          notifications: { success: true, message: '✅ System notification created successfully', details: systemNotif }
        }));
        toast.success('Test notification created!');
      } else {
        setTestResults(prev => ({ 
          ...prev, 
          notifications: { success: false, message: '⚠️ Notification created but returned null', details: null }
        }));
      }
    } catch (error) {
      console.error('Notification test failed:', error);
      setTestResults(prev => ({ 
        ...prev, 
        notifications: { 
          success: false, 
          message: `❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 
          details: error 
        }
      }));
      toast.error('Notification test failed');
    }
  };

  const getTestResultIcon = (testName: string) => {
    const result = testResults[testName];
    if (!result) return null;
    
    return result.success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-600" />
    );
  };

  if (!shouldShowPanel) return null;

  return (
    <>
      {/* Floating Test Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <TestTube className="h-6 w-6" />
      </motion.button>

      {/* Testing Panel Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <TestTube className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Testing Panel</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('database')}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'database'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Database className="h-4 w-4" />
                    <span>Database</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'profile'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('auth')}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'auth'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Auth</span>
                  </button>
                </nav>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {activeTab === 'database' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Database Connection Tests</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">Database Connection</h4>
                          <p className="text-sm text-gray-600">Test if Supabase is properly connected</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getTestResultIcon('database-connection')}
                          <button
                            onClick={() => runTest('database-connection', testDatabaseConnection)}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {loading ? 'Testing...' : 'Test'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Test Results */}
                    {Object.keys(testResults).length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium text-gray-900 mb-3">Test Results</h4>
                        <div className="space-y-2">
                          {Object.entries(testResults).map(([testName, result]) => (
                            <div
                              key={testName}
                              className={`p-3 rounded-lg border ${
                                result.success 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-red-50 border-red-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900 capitalize">
                                  {testName.replace('-', ' ')}
                                </span>
                                {getTestResultIcon(testName)}
                              </div>
                              <p className={`text-sm mt-1 ${
                                result.success ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {result.message}
                              </p>
                              {result.details && (
                                <details className="mt-2">
                                  <summary className="text-xs text-gray-600 cursor-pointer">
                                    View Details
                                  </summary>
                                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                    {JSON.stringify(result.details, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Profile Management Tests</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">Profile Retrieval</h4>
                          <p className="text-sm text-gray-600">Test if we can retrieve user profile</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getTestResultIcon('profile-retrieval')}
                          <button
                            onClick={() => runTest('profile-retrieval', testProfileRetrieval)}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {loading ? 'Testing...' : 'Test'}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">Profile Update</h4>
                          <p className="text-sm text-gray-600">Test if we can update user profile</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getTestResultIcon('profile-update')}
                          <button
                            onClick={() => runTest('profile-update', testProfileUpdate)}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {loading ? 'Testing...' : 'Test'}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">Notifications</h4>
                          <p className="text-sm text-gray-600">Test notification system functionality</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getTestResultIcon('notifications')}
                          <button
                            onClick={() => runTest('notifications', testNotifications)}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {loading ? 'Testing...' : 'Test'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Current User Info */}
                    {user && (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Current User</h4>
                        <div className="text-sm text-blue-800">
                          <p><strong>ID:</strong> {user.id}</p>
                          <p><strong>Email:</strong> {user.email}</p>
                          <p><strong>Name:</strong> {user.full_name}</p>
                          <p><strong>Role:</strong> {user.role}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'auth' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Authentication Tests</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">Supabase Configuration</h4>
                          <p className="text-sm text-gray-600">Check if Supabase is properly configured</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {isSupabaseConfigured ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span className={`text-sm ${isSupabaseConfigured ? 'text-green-600' : 'text-red-600'}`}>
                            {isSupabaseConfigured ? 'Configured' : 'Not Configured'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">User Authentication</h4>
                          <p className="text-sm text-gray-600">Check current authentication status</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          {user ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span className={`text-sm ${user ? 'text-green-600' : 'text-red-600'}`}>
                            {user ? 'Authenticated' : 'Not Authenticated'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};