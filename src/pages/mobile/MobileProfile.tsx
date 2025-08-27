import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Settings, 
  LogOut, 
  Edit, 
  Trophy, 
  MapPin, 
  Calendar,
  Bell,
  Shield,
  HelpCircle,
  QrCode
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { QRCodeScanner } from '../../components/mobile/QRCodeScanner';
import toast from 'react-hot-toast';

export const MobileProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const handleQRScan = (data: string) => {
    console.log('QR Code scanned:', data);
    toast.success('QR Code scanned successfully!');
  };

  const profileMenuItems = [
    {
      icon: Trophy,
      label: 'My Tournaments',
      description: 'View and manage your tournaments',
      action: () => navigate('/organizer-dashboard'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: MapPin,
      label: 'My Venues',
      description: 'Manage your sports venues',
      action: () => navigate('/venues'),
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: Calendar,
      label: 'My Schedule',
      description: 'View upcoming events and matches',
      action: () => navigate('/player-dashboard'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: Bell,
      label: 'Notifications',
      description: 'Manage your notification preferences',
      action: () => navigate('/notifications'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: Settings,
      label: 'Settings',
      description: 'Account and app preferences',
      action: () => navigate('/profile'),
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
    {
      icon: Shield,
      label: 'Privacy & Security',
      description: 'Manage your privacy settings',
      action: () => navigate('/profile'),
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      description: 'Get help and contact support',
      action: () => navigate('/help'),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your profile</p>
          <Button onClick={() => navigate('/login')} className="mt-4">
            Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-6">
        <div className="text-center">
          {/* Profile Avatar */}
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-700 rounded-full mx-auto mb-4 flex items-center justify-center">
            {user.profile_image ? (
              <img
                src={user.profile_image}
                alt={user.full_name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-white" />
            )}
          </div>
          
          {/* User Info */}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{user.full_name}</h1>
          <p className="text-gray-600 mb-2">{user.email}</p>
          <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {user.role}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setShowQRScanner(true)}
            variant="outline"
            className="touch-target"
          >
            <QrCode className="w-5 h-5 mr-2" />
            Scan QR
          </Button>
          
          <Button
            onClick={() => navigate('/create-tournament')}
            className="bg-blue-600 hover:bg-blue-700 touch-target"
          >
            <Trophy className="w-5 h-5 mr-2" />
            Create Tournament
          </Button>
        </div>

        {/* Profile Menu */}
        <div className="space-y-3">
          {profileMenuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer touch-target" onClick={item.action}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.label}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <Edit className="w-5 h-5 text-gray-400" />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Account Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full text-red-600 border-red-300 hover:bg-red-50 touch-target"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>

        {/* App Info */}
        <Card className="p-4 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">Playo Tournament Platform</h3>
          <p className="text-sm text-gray-600 mb-2">Version 1.0.0</p>
          <p className="text-xs text-gray-500">© 2024 Playo. All rights reserved.</p>
        </Card>
      </div>

      {/* QR Code Scanner Modal */}
      <QRCodeScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
      />
    </div>
  );
};




