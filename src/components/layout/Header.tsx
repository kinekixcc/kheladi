import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, User, LogOut, Settings, MapPin, Bell, CheckCircle, XCircle, Clock, Trophy, UserCog } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  // Filter notifications based on user role
  const filteredNotifications = notifications.filter(notification => {
    if (!user) return false;
    
    // If no target role specified, show to all users
    if (!notification.targetRole || notification.targetRole === 'all') {
      return true;
    }
    
    // Show only notifications targeted to user's role
    return notification.targetRole === user.role;
  });
  
  const filteredUnreadCount = filteredNotifications.filter(n => !n.read).length;
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setUserMenuOpen(false);
    setNotificationOpen(false);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <MapPin className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">खेल खेलेको</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/venues" className="text-gray-700 hover:text-blue-600 transition-colors">
              Venues
            </Link>
            <Link to="/facilities" className="text-gray-700 hover:text-blue-600 transition-colors">
              Find Facilities
            </Link>
            <Link to="/tournament-map" className="text-gray-700 hover:text-blue-600 transition-colors">
              Tournament Map
            </Link>
            {user && user.role !== 'admin' && (
              <Link 
                to={user.role === 'organizer' ? '/organizer-dashboard' : '/player-dashboard'} 
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                {user.role === 'organizer' ? 'Organizer Dashboard' : 'Player Dashboard'}
              </Link>
            )}
            {user && user.role === 'player' && (
              <Link to="/my-requests" className="text-gray-700 hover:text-blue-600 transition-colors">
                My Requests
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-gray-700 hover:text-blue-600 transition-colors">
                Admin
              </Link>
            )}
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button 
                    onClick={() => setNotificationOpen(!notificationOpen)}
                    className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    {filteredUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {filteredUnreadCount > 9 ? '9+' : filteredUnreadCount}
                      </span>
                    )}
                  </button>
                  
                  {/* Notifications Dropdown */}
                  {notificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto"
                    >
                      <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {filteredUnreadCount > 0 && (
                          <button
                            onClick={() => {
                              markAllAsRead();
                              setNotificationOpen(false);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      
                      {filteredNotifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        <div className="max-h-80 overflow-y-auto">
                          {filteredNotifications.slice(0, 10).map((notification) => (
                            <div
                              key={notification.id}
                              className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                                notification.read 
                                  ? 'border-transparent' 
                                  : 'border-blue-500 bg-blue-50'
                              }`}
                              onClick={() => {
                                markAsRead(notification.id);
                                if (notification.tournamentId) {
                                  // Could navigate to tournament details
                                }
                              }}
                            >
                              <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-full ${
                                  notification.type === 'tournament_approved' ? 'bg-green-100' :
                                  notification.type === 'tournament_rejected' ? 'bg-red-100' :
                                  notification.type === 'tournament_submitted' ? 'bg-yellow-100' :
                                  'bg-blue-100'
                                }`}>
                                  {notification.type === 'tournament_approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                  {notification.type === 'tournament_rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                                  {notification.type === 'tournament_submitted' && <Clock className="h-4 w-4 text-yellow-600" />}
                                  {notification.type === 'new_tournament_available' && <Trophy className="h-4 w-4 text-blue-600" />}
                                  {notification.type === 'tournament_registration_success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(notification.created_at).toLocaleDateString()} at{' '}
                                    {new Date(notification.created_at).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {filteredNotifications.length > 10 && (
                        <div className="px-4 py-2 border-t border-gray-200 text-center">
                          <button className="text-sm text-blue-600 hover:text-blue-800">
                            View all notifications
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span>{user.full_name}</span>
                </button>
                
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
                  >
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <UserCog className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Link>
                    {user.role === 'organizer' && (
                      <Link
                        to="/organizer-profile"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Organization Settings
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button onClick={() => navigate('/register')}>
                  Sign Up
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="md:hidden border-t border-gray-200 py-4"
          >
            <nav className="flex flex-col space-y-4">
              <Link
                to="/venues"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Venues
              </Link>
              <Link
                to="/facilities"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Find Facilities
              </Link>
              <Link
                to="/tournament-map"
                className="text-gray-700 hover:text-blue-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tournament Map
              </Link>
              {user && user.role !== 'admin' && (
                <Link
                  to={user.role === 'organizer' ? '/organizer-dashboard' : '/player-dashboard'}
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {user.role === 'organizer' ? 'Organizer Dashboard' : 'Player Dashboard'}
                </Link>
              )}
              {user && user.role === 'player' && (
                <Link
                  to="/my-requests"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My Requests
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              {user ? (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-gray-900 font-medium mb-2">{user.full_name}</p>
                  <div className="flex flex-col space-y-2">
                    <Link
                      to="/profile"
                      className="text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="text-left text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200 flex flex-col space-y-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => {
                      navigate('/register');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
};