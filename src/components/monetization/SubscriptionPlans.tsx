import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Star, Zap, TrendingUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '../../types';
import toast from 'react-hot-toast';

interface SubscriptionPlansProps {
  userType: 'organizer' | 'player' | 'facility_owner';
  currentPlan?: string;
  onSelectPlan: (planId: string) => void;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  userType,
  currentPlan,
  onSelectPlan
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [processing, setProcessing] = useState<string | null>(null);
  
  const filteredPlans = SUBSCRIPTION_PLANS.filter(plan => plan.type === userType);

  const handlePlanSelection = async (planId: string) => {
    setProcessing(planId);
    try {
      // Simulate plan selection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would:
      // 1. Create payment session
      // 2. Process subscription
      // 3. Update user's plan in database
      
      toast.success(`Successfully subscribed to ${filteredPlans.find(p => p.id === planId)?.name}!`);
      onSelectPlan(planId);
    } catch (error) {
      toast.error('Failed to process subscription. Please try again.');
    } finally {
      setProcessing(null);
    }
  };
  const getPlanIcon = (planName: string) => {
    if (planName.includes('Enterprise')) {
      return <Crown className="h-6 w-6 text-purple-500" />;
    } else if (planName.includes('Pro') || planName.includes('Premium')) {
      return <Crown className="h-6 w-6 text-yellow-500" />;
    }
    return <Star className="h-6 w-6 text-blue-500" />;
  };

  const getPrice = (plan: SubscriptionPlan) => {
    return billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
  };

  const getSavings = (plan: SubscriptionPlan) => {
    const monthlyTotal = plan.price_monthly * 12;
    const yearlySavings = monthlyTotal - plan.price_yearly;
    return Math.round((yearlySavings / monthlyTotal) * 100);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your {userType === 'organizer' ? 'Organizer' : userType === 'player' ? 'Player' : 'Facility'} Plan
        </h2>
        <p className="text-gray-600 mb-6">
          Affordable plans designed for Nepal's sports community
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
          <p className="text-green-800 text-sm">
            💡 <strong>Nepal Special:</strong> All prices are set considering local purchasing power. 
            Students get additional 20% discount with valid ID!
          </p>
        </div>
        
        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="ml-1 text-xs text-green-600 font-semibold">
              Save रू {Math.round(filteredPlans[0]?.price_monthly * 12 * 0.17) || 500}+
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`p-6 relative ${
              plan.name.includes('Pro') || plan.name.includes('Premium')
                ? 'border-2 border-blue-500 shadow-lg'
                : plan.name.includes('Enterprise')
                ? 'border-2 border-purple-500 shadow-lg'
                : 'border border-gray-200'
            }`}>
              {/* Popular Badge */}
              {(plan.name.includes('Pro') || plan.name.includes('Premium')) && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              {/* Best Value Badge */}
              {plan.name.includes('Enterprise') && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Best Value
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-2">
                  {getPlanIcon(plan.name)}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-gray-900">
                    रू {getPrice(plan).toLocaleString()}
                  </span>
                  <span className="text-gray-600 ml-1">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-green-600 font-medium">
                    Save रू {(plan.price_monthly * 12 - plan.price_yearly).toLocaleString()} per year!
                  </p>
                )}
                
                {/* Nepal-specific pricing note */}
                <p className="text-xs text-gray-500 mt-1">
                  ≈ ${(getPrice(plan) / 133).toFixed(2)} USD • Student discount available
                </p>
              </div>

              {/* Features List */}
              <div className="mb-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => handlePlanSelection(plan.id)}
                loading={processing === plan.id}
                className={`w-full ${
                  currentPlan === plan.id
                    ? 'bg-gray-400 cursor-not-allowed'
                    : plan.name.includes('Enterprise')
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : plan.name.includes('Pro') || plan.name.includes('Premium')
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-900 hover:bg-gray-800'
                }`}
                disabled={currentPlan === plan.id}
              >
                {processing === plan.id ? 'Processing...' : 
                 currentPlan === plan.id ? 'Current Plan' : 'Choose Plan'}
              </Button>
              
              {/* Money-back guarantee */}
              <p className="text-xs text-center text-gray-500 mt-2">
                30-day money-back guarantee
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Free Plan Option */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <Card className="p-6 bg-gray-50 border-dashed border-2 border-gray-300">
          <div className="text-center">
            <Zap className="h-8 w-8 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Free Forever Plan
            </h3>
            <p className="text-gray-600 mb-4">
              {userType === 'organizer' 
                ? 'Create 1 tournament per month with up to 16 participants'
                : userType === 'player'
                ? 'Join tournaments and access basic features forever'
                : 'List 1 facility with basic booking features'
              }
            </p>
            <div className="text-xs text-gray-500 mb-4">
              Perfect for trying out the platform • No credit card required
            </div>
            <Button
              variant="outline"
              onClick={() => handlePlanSelection('free')}
              loading={processing === 'free'}
              disabled={currentPlan === 'free'}
            >
              {processing === 'free' ? 'Processing...' :
               currentPlan === 'free' ? 'Current Plan' : 'Continue with Free'}
            </Button>
          </div>
        </Card>
      </motion.div>
      
      {/* Special Offers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 text-center"
      >
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-orange-800 text-sm">
            🎓 <strong>Student Discount:</strong> 20% off all plans with valid student ID • 🏫 <strong>School/College:</strong> Special institutional rates available
          </p>
        </div>
      </motion.div>
    </div>
  );
};