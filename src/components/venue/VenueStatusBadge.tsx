import React from 'react';
import { Info, CheckCircle, Shield, BookOpen, AlertTriangle } from 'lucide-react';

interface VenueStatusBadgeProps {
  status: 'seeded' | 'verified' | 'claimed' | 'bookable' | 'suspended';
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const VenueStatusBadge: React.FC<VenueStatusBadgeProps> = ({ 
  status, 
  showIcon = true, 
  size = 'md' 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'seeded':
        return {
          label: 'Info Only',
          description: 'Not bookable yet',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          icon: Info,
          iconColor: 'text-blue-600'
        };
      case 'verified':
        return {
          label: 'Verified Details',
          description: 'Admin verified',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-600'
        };
      case 'claimed':
        return {
          label: 'Claimed',
          description: 'Owner verified',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
          icon: Shield,
          iconColor: 'text-yellow-600'
        };
      case 'bookable':
        return {
          label: 'Instant Booking',
          description: 'Available now',
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-800',
          borderColor: 'border-emerald-200',
          icon: BookOpen,
          iconColor: 'text-emerald-600'
        };
      case 'suspended':
        return {
          label: 'Suspended',
          description: 'Not available',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          icon: AlertTriangle,
          iconColor: 'text-red-600'
        };
      default:
        return {
          label: 'Unknown',
          description: 'Status unclear',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          icon: Info,
          iconColor: 'text-gray-600'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <div className={`inline-flex items-center gap-2 ${config.bgColor} ${config.textColor} ${config.borderColor} border rounded-full ${sizeClasses[size]} font-medium`}>
      {showIcon && <Icon className={`${iconSizes[size]} ${config.iconColor}`} />}
      <span>{config.label}</span>
      <span className="text-xs opacity-75">({config.description})</span>
    </div>
  );
};


