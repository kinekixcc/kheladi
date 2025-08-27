import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Trophy, 
  MapPin, 
  Users, 
  Settings, 
  DollarSign, 
  Shield, 
  Award, 
  XCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  Database
} from 'lucide-react';

interface AdminSidebarProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
  pendingCount: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  selectedTab,
  onTabChange,
  pendingCount,
  isCollapsed,
  onToggleCollapse
}) => {
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: <Home className="h-5 w-5" />, badge: null },
    { 
      id: 'tournaments', 
      label: 'Tournaments', 
      icon: <Trophy className="h-5 w-5" />, 
      badge: pendingCount > 0 ? pendingCount : null 
    },
    { id: 'venues', label: 'Venues', icon: <MapPin className="h-5 w-5" />, badge: null },
    { id: 'organizers', label: 'Organizers', icon: <Users className="h-5 w-5" />, badge: null },
    { id: 'control', label: 'Control Center', icon: <Settings className="h-5 w-5" />, badge: null },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-5 w-5" />, badge: null },
    { id: 'revenue', label: 'Revenue', icon: <DollarSign className="h-5 w-5" />, badge: null },
    { id: 'connectivity', label: 'Global Monitor', icon: <Shield className="h-5 w-5" />, badge: null },
    { id: 'badges', label: 'Badges', icon: <Award className="h-5 w-5" />, badge: null },
    { id: 'refunds', label: 'Refunds', icon: <XCircle className="h-5 w-5" />, badge: null },
    { id: 'database', label: 'Database', icon: <Database className="h-5 w-5" />, badge: null }
  ];

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 70 : 280 }}
      className="bg-white border-r border-gray-200 h-screen sticky top-0 overflow-hidden shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg font-semibold text-gray-900"
          >
            Admin Panel
          </motion.h2>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-2">
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedTab === item.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center justify-center w-6 h-6 mr-3">
                  {item.icon}
                </div>
                
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex items-center justify-between flex-1 min-w-0"
                    >
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-2 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
                          {item.badge}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Show badge even when collapsed */}
                {isCollapsed && item.badge && (
                  <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {item.badge}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50"
        >
          <div className="text-xs text-gray-500 text-center">
            Admin Dashboard v1.0
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
