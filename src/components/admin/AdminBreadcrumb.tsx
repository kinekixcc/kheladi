import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';

interface AdminBreadcrumbProps {
  currentTab: string;
}

export const AdminBreadcrumb: React.FC<AdminBreadcrumbProps> = ({ currentTab }) => {
  const getTabLabel = (tabId: string) => {
    const tabLabels: { [key: string]: string } = {
      overview: 'Overview',
      tournaments: 'Tournaments',
      venues: 'Venues',
      organizers: 'Organizers',
      control: 'Control Center',
      analytics: 'Real-Time Analytics',
      revenue: 'Revenue Dashboard',
      connectivity: 'Global Monitor',
      settings: 'Settings',
      badges: 'Organizer Badges',
      refunds: 'Refund Management'
    };
    return tabLabels[tabId] || tabId;
  };

  const getTabIcon = (tabId: string) => {
    // You can add specific icons for each tab if needed
    return null;
  };

  return (
    <motion.nav
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center space-x-2 text-sm text-gray-500 mb-6"
      aria-label="Breadcrumb"
    >
      <div className="flex items-center space-x-2">
        <Home className="h-4 w-4" />
        <span>Admin</span>
      </div>
      <ChevronRight className="h-4 w-4" />
      <span className="text-gray-900 font-medium">{getTabLabel(currentTab)}</span>
    </motion.nav>
  );
};






