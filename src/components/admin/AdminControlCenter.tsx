import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Crown, 
  DollarSign, 
  Percent, 
  Gift, 
  Users,
  Trophy,
  BarChart3,
  Shield,
  Zap,
  Save,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { dummyPaymentProcessor } from '../../lib/dummyPaymentSystem';
import { SubscriptionPlan, PlatformFee } from '../../types';
import toast from 'react-hot-toast';

interface AdminControlCenterProps {
  onFeatureUpdate?: () => void;
}

interface PlatformSettings {
  commissionRates: {
    tournament: number;
    facility: number;
    premium_listing: number;
  };
  subscriptionPlans: SubscriptionPlan[];
  promotionalDiscounts: {
    id: string;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    code: string;
    description: string;
    validUntil: string;
    maxUses: number;
    currentUses: number;
    isActive: boolean;
  }[];
  featureFlags: {
    [key: string]: boolean;
  };
}

export const AdminControlCenter: React.FC<AdminControlCenterProps> = ({
  onFeatureUpdate
}) => {
  const [selectedTab, setSelectedTab] = useState<'subscriptions' | 'commissions' | 'discounts' | 'features'>('subscriptions');
  const [settings, setSettings] = useState<PlatformSettings>({
    commissionRates: {
      tournament: 5,
      facility: 3,
      premium_listing: 500
    },
    subscriptionPlans: [
      {
        id: 'organizer_basic',
        name: 'Basic Organizer',
        type: 'organizer',
        price_monthly: 999,
        price_yearly: 9999,
        features: [
          'Create up to 5 tournaments per month',
          'Up to 50 participants per tournament',
          'Basic analytics',
          'Email support',
          'Standard listing'
        ],
        max_tournaments: 5,
        max_participants: 50,
        priority_support: false,
        analytics_access: true,
        custom_branding: false
      },
      {
        id: 'organizer_pro',
        name: 'Pro Organizer',
        type: 'organizer',
        price_monthly: 2499,
        price_yearly: 24999,
        features: [
          'Unlimited tournaments',
          'Up to 500 participants per tournament',
          'Advanced analytics & insights',
          'Priority support',
          'Featured listings',
          'Custom branding',
          'Bulk participant management',
          'Revenue analytics'
        ],
        max_tournaments: -1,
        max_participants: 500,
        priority_support: true,
        analytics_access: true,
        custom_branding: true
      }
    ],
    promotionalDiscounts: [
      {
        id: 'student_discount',
        name: 'Student Discount',
        type: 'percentage',
        value: 20,
        code: 'STUDENT20',
        description: '20% off for students with valid ID',
        validUntil: '2025-12-31',
        maxUses: 1000,
        currentUses: 45,
        isActive: true
      },
      {
        id: 'new_year_2025',
        name: 'New Year Special',
        type: 'percentage',
        value: 30,
        code: 'NEWYEAR30',
        description: '30% off all plans for new users',
        validUntil: '2025-02-28',
        maxUses: 500,
        currentUses: 123,
        isActive: true
      }
    ],
    featureFlags: {
      advanced_analytics: true,
      real_time_notifications: true,
      tournament_brackets: false,
      live_streaming: false,
      mobile_app_features: false,
      ai_matchmaking: false
    }
  });

  const [saving, setSaving] = useState(false);
  const [newDiscount, setNewDiscount] = useState({
    name: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 0,
    code: '',
    description: '',
    validUntil: '',
    maxUses: 100
  });

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Save settings to localStorage and simulate database save
      localStorage.setItem('platform_settings', JSON.stringify(settings));
      
      // Simulate API call to save platform settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('💾 Platform settings saved:', settings);
      toast.success('Platform settings saved successfully!');
      
      if (onFeatureUpdate) {
        onFeatureUpdate();
      }
    } catch (error) {
      console.error('Error saving platform settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateCommissionRate = (type: keyof typeof settings.commissionRates, value: number) => {
    setSettings(prev => ({
      ...prev,
      commissionRates: {
        ...prev.commissionRates,
        [type]: value
      }
    }));
  };

  const toggleFeature = (feature: string) => {
    setSettings(prev => ({
      ...prev,
      featureFlags: {
        ...prev.featureFlags,
        [feature]: !prev.featureFlags[feature]
      }
    }));
  };

  const addDiscount = () => {
    if (!newDiscount.name || !newDiscount.code || newDiscount.value <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const discount = {
      id: `discount_${Date.now()}`,
      ...newDiscount,
      currentUses: 0,
      isActive: true
    };

    setSettings(prev => ({
      ...prev,
      promotionalDiscounts: [...prev.promotionalDiscounts, discount]
    }));

    setNewDiscount({
      name: '',
      type: 'percentage',
      value: 0,
      code: '',
      description: '',
      validUntil: '',
      maxUses: 100
    });

    toast.success('Promotional discount added!');
  };

  const toggleDiscount = (discountId: string) => {
    setSettings(prev => ({
      ...prev,
      promotionalDiscounts: prev.promotionalDiscounts.map(discount =>
        discount.id === discountId
          ? { ...discount, isActive: !discount.isActive }
          : discount
      )
    }));
    toast.success('Discount status updated!');
  };

  const removeDiscount = (discountId: string) => {
    if (!confirm('Are you sure you want to remove this discount?')) {
      return;
    }
    
    setSettings(prev => ({
      ...prev,
      promotionalDiscounts: prev.promotionalDiscounts.filter(d => d.id !== discountId)
    }));
    toast.success('Discount removed');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Control Center</h2>
          <p className="text-gray-600">Centralized platform management and configuration</p>
        </div>
        <Button onClick={saveSettings} loading={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'subscriptions', label: 'Subscription Plans', icon: <Crown className="h-4 w-4" /> },
            { id: 'commissions', label: 'Commission Rates', icon: <DollarSign className="h-4 w-4" /> },
            { id: 'discounts', label: 'Promotional Discounts', icon: <Gift className="h-4 w-4" /> },
            { id: 'features', label: 'Feature Deployment', icon: <Zap className="h-4 w-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'subscriptions' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Plan Management</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {settings.subscriptionPlans.map((plan, index) => (
                <Card key={plan.id} className="p-4 border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Monthly Price:</span>
                      <span className="font-medium">रू {plan.price_monthly}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yearly Price:</span>
                      <span className="font-medium">रू {plan.price_yearly}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Tournaments:</span>
                      <span className="font-medium">{plan.max_tournaments === -1 ? 'Unlimited' : plan.max_tournaments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Participants:</span>
                      <span className="font-medium">{plan.max_participants}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-600">Features: {plan.features.length} included</p>
                  </div>
                </Card>
              ))}
            </div>
            
            <Button className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Add New Plan
            </Button>
          </Card>
        </div>
      )}

      {selectedTab === 'commissions' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Commission Rates</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tournament Commission (%)
                </label>
                <Input
                  type="number"
                  value={settings.commissionRates.tournament}
                  onChange={(e) => updateCommissionRate('tournament', parseFloat(e.target.value))}
                  min="0"
                  max="20"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: {settings.commissionRates.tournament}% of tournament entry fees
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facility Booking (%)
                </label>
                <Input
                  type="number"
                  value={settings.commissionRates.facility}
                  onChange={(e) => updateCommissionRate('facility', parseFloat(e.target.value))}
                  min="0"
                  max="15"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: {settings.commissionRates.facility}% of facility bookings
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Premium Listing Fee (रू)
                </label>
                <Input
                  type="number"
                  value={settings.commissionRates.premium_listing}
                  onChange={(e) => updateCommissionRate('premium_listing', parseFloat(e.target.value))}
                  min="0"
                  max="2000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: रू {settings.commissionRates.premium_listing} per featured listing
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Revenue Impact Calculator</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {(() => {
                  const analytics = dummyPaymentProcessor.getRevenueAnalytics();
                  return (
                    <>
                <div>
                      <p className="text-blue-800">Tournament Revenue</p>
                      <p className="font-semibold">रू {analytics.monthlyRevenue.toLocaleString()}/month</p>
                      <p className="text-xs text-blue-600">Commission: रू {analytics.platformCommission.toLocaleString()}</p>
                </div>
                <div>
                      <p className="text-blue-800">Transaction Count</p>
                      <p className="font-semibold">{analytics.transactionCount} payments</p>
                      <p className="text-xs text-blue-600">Success Rate: {analytics.successRate.toFixed(1)}%</p>
                </div>
                <div>
                      <p className="text-blue-800">Avg Transaction</p>
                      <p className="font-semibold">रू {Math.round(analytics.averageTransaction).toLocaleString()}</p>
                      <p className="text-xs text-blue-600">Per payment</p>
                </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedTab === 'discounts' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Promotional Discount Management</h3>
            
            {/* Add New Discount */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Create New Discount</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  placeholder="Discount Name"
                  value={newDiscount.name}
                  onChange={(e) => setNewDiscount(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Discount Code"
                  value={newDiscount.code}
                  onChange={(e) => setNewDiscount(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                />
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Value"
                    value={newDiscount.value}
                    onChange={(e) => setNewDiscount(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                  />
                  <select
                    value={newDiscount.type}
                    onChange={(e) => setNewDiscount(prev => ({ ...prev, type: e.target.value as any }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">रू</option>
                  </select>
                </div>
                <Input
                  type="date"
                  value={newDiscount.validUntil}
                  onChange={(e) => setNewDiscount(prev => ({ ...prev, validUntil: e.target.value }))}
                />
              </div>
              <div className="mt-3">
                <Input
                  placeholder="Description"
                  value={newDiscount.description}
                  onChange={(e) => setNewDiscount(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <Button onClick={addDiscount} className="mt-3">
                <Plus className="h-4 w-4 mr-2" />
                Add Discount
              </Button>
            </div>
            
            {/* Existing Discounts */}
            <div className="space-y-3">
              {settings.promotionalDiscounts.map((discount) => (
                <div key={discount.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{discount.name}</h4>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-mono">
                        {discount.code}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        discount.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {discount.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{discount.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Value: {discount.value}{discount.type === 'percentage' ? '%' : ' रू'}</span>
                      <span>Uses: {discount.currentUses}/{discount.maxUses}</span>
                      <span>Valid until: {discount.validUntil}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleDiscount(discount.id)}
                    >
                      {discount.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => removeDiscount(discount.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {selectedTab === 'features' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Flag Management</h3>
            <p className="text-gray-600 mb-6">Control which features are available to users in real-time</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(settings.featureFlags).map(([feature, enabled]) => (
                <div key={feature} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-gray-600">
                      {feature === 'advanced_analytics' && 'Enhanced analytics dashboard with detailed insights'}
                      {feature === 'real_time_notifications' && 'Live notifications and updates'}
                      {feature === 'tournament_brackets' && 'Visual tournament bracket system'}
                      {feature === 'live_streaming' && 'Live streaming integration for tournaments'}
                      {feature === 'mobile_app_features' && 'Mobile-specific features and optimizations'}
                      {feature === 'ai_matchmaking' && 'AI-powered player and tournament matching'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${enabled ? 'text-green-600' : 'text-red-600'}`}>
                      {enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => toggleFeature(feature)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        enabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};