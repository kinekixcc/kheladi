import React from 'react';
import { motion } from 'framer-motion';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  showMobileNav?: boolean;
  onMobileNavToggle?: () => void;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className = '',
  showMobileNav = false,
  onMobileNavToggle
}) => {
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

  return (
    <div className={`responsive-layout ${className}`}>
      {/* Mobile Navigation Toggle */}
      {isMobile && (
        <motion.button
          className="fixed top-4 right-4 z-50 lg:hidden bg-blue-600 text-white p-3 rounded-full shadow-lg"
          onClick={onMobileNavToggle}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {showMobileNav ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </motion.button>
      )}

      {/* Main Content */}
      <motion.div
        className={`main-content ${
          isMobile ? 'px-4' : isTablet ? 'px-6' : 'px-8'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>

      {/* Mobile Navigation Overlay */}
      {isMobile && showMobileNav && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onMobileNavToggle}
        />
      )}

      {/* Mobile Navigation Menu */}
      {isMobile && showMobileNav && (
        <motion.div
          className="fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 lg:hidden"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Navigation
            </h3>
            {/* Add mobile navigation items here */}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Responsive utility components
export const MobileOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="block md:hidden">{children}</div>
);

export const DesktopOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="hidden md:block">{children}</div>
);

export const TabletAndUp: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="hidden sm:block">{children}</div>
);

export const MobileAndTablet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="block lg:hidden">{children}</div>
);

// Responsive grid utilities
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  cols?: { mobile?: number; tablet?: number; desktop?: number };
  gap?: string;
  className?: string;
}> = ({ children, cols = { mobile: 1, tablet: 2, desktop: 3 }, gap = 'gap-4', className = '' }) => {
  const gridCols = `grid-cols-${cols.mobile} sm:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop}`;
  
  return (
    <div className={`grid ${gridCols} ${gap} ${className}`}>
      {children}
    </div>
  );
};

// Responsive text utilities
export const ResponsiveText: React.FC<{
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption';
  size?: { mobile?: string; tablet?: string; desktop?: string };
  className?: string;
}> = ({ children, variant, size, className = '' }) => {
  let textClasses = '';
  
  if (variant) {
    // Use variant-based sizing
    const variantClasses = {
      h1: 'text-2xl sm:text-3xl lg:text-4xl font-bold',
      h2: 'text-xl sm:text-2xl lg:text-3xl font-semibold',
      h3: 'text-lg sm:text-xl lg:text-2xl font-semibold',
      h4: 'text-base sm:text-lg lg:text-xl font-medium',
      h5: 'text-sm sm:text-base lg:text-lg font-medium',
      h6: 'text-xs sm:text-sm lg:text-base font-medium',
      body: 'text-sm sm:text-base lg:text-lg',
      caption: 'text-xs sm:text-sm',
    };
    textClasses = variantClasses[variant];
  } else if (size) {
    // Use custom size-based sizing
    textClasses = `${size.mobile || ''} sm:${size.tablet || ''} lg:${size.desktop || ''}`;
  } else {
    // Default sizing
    textClasses = 'text-sm sm:text-base lg:text-lg';
  }
  
  return (
    <div className={`${textClasses} ${className}`}>
      {children}
    </div>
  );
};

// Responsive Card Component
export const ResponsiveCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}> = ({ children, className = '', onClick, hover = true }) => {
  return (
    <motion.div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 ${hover ? 'hover:shadow-md hover:border-gray-300' : ''} transition-all duration-200 ${className}`}
      whileHover={hover ? { y: -2, scale: 1.01 } : {}}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </motion.div>
  );
};

// Responsive spacing utilities
export const ResponsiveSpacing: React.FC<{
  children: React.ReactNode;
  padding?: { mobile?: string; tablet?: string; desktop?: string };
  margin?: { mobile?: string; tablet?: string; desktop?: string };
  className?: string;
}> = ({ children, padding, margin, className = '' }) => {
  let spacingClasses = '';
  
  if (padding) {
    spacingClasses += `${padding.mobile || ''} sm:${padding.tablet || ''} lg:${padding.desktop || ''} `;
  }
  
  if (margin) {
    spacingClasses += `${margin.mobile || ''} sm:${margin.tablet || ''} lg:${margin.desktop || ''} `;
  }
  
  return (
    <div className={`${spacingClasses}${className}`}>
      {children}
    </div>
  );
};
