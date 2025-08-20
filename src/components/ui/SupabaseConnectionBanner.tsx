import React from 'react';
import { AlertCircle, Database, ExternalLink } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { isSupabaseConfigured } from '../../lib/supabase';

export const SupabaseConnectionBanner: React.FC = () => {
  if (isSupabaseConfigured) {
    return null; // Don't show banner if Supabase is connected
  }

  return (
    <Card className="p-4 bg-orange-50 border-orange-200 mb-6">
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-orange-900 mb-1">
            Database Connection Required
          </h3>
          <p className="text-sm text-orange-800 mb-3">
            To create tournaments that can be shared with everyone, you need to connect to Supabase. 
            Without this connection, your data will only be stored locally and won't be visible to other users.
          </p>
          <div className="flex items-center space-x-3">
            <Button
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => {
                // This would typically open a connection modal or redirect
                alert('Click "Connect to Supabase" button in the top right corner of the screen');
              }}
            >
              <Database className="h-4 w-4 mr-1" />
              Connect to Supabase
            </Button>
            <a
              href="https://supabase.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-orange-700 hover:text-orange-900 flex items-center"
            >
              Learn more
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
};