import React from 'react';
import { useElectron } from '../../hooks/useElectron';

export const ElectronTitleBar: React.FC = () => {
  const { isElectron, platform } = useElectron();

  // Only show on Windows/Linux in Electron (macOS handles title bar natively)
  if (!isElectron || platform === 'darwin') {
    return null;
  }

  return (
    <div className="bg-gray-800 text-white h-8 flex items-center justify-between px-4 select-none">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">खेल खेलेको</span>
      </div>
      <div className="flex items-center space-x-1">
        {/* Window controls would go here if needed */}
      </div>
    </div>
  );
};