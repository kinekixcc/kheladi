import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  showMessageBox: (options: any) => Promise<any>;
  onNavigate: (callback: (path: string) => void) => void;
  removeAllListeners: (channel: string) => void;
}

interface AppInfo {
  platform: string;
  isElectron: boolean;
  version: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
    appInfo?: AppInfo;
  }
}

export const useElectron = () => {
  const [isElectron, setIsElectron] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [platform, setPlatform] = useState('web');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if running in Electron
    if (window.electronAPI && window.appInfo) {
      setIsElectron(true);
      setPlatform(window.appInfo.platform);
      
      // Get app version
      window.electronAPI.getAppVersion().then(version => {
        setAppVersion(version);
      });

      // Listen for navigation events from main process
      window.electronAPI.onNavigate((path: string) => {
        navigate(path);
      });

      // Cleanup on unmount
      return () => {
        window.electronAPI?.removeAllListeners('navigate-to');
      };
    }
  }, [navigate]);

  const showMessageBox = async (options: {
    type: 'info' | 'warning' | 'error' | 'question';
    title: string;
    message: string;
    detail?: string;
    buttons?: string[];
  }) => {
    if (window.electronAPI) {
      return await window.electronAPI.showMessageBox(options);
    }
    // Fallback for web
    alert(`${options.title}\n\n${options.message}`);
  };

  return {
    isElectron,
    appVersion,
    platform,
    showMessageBox
  };
};