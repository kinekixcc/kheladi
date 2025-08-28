import React from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Home, BarChart2, CheckSquare, Flag, Users } from 'lucide-react';

export const SaaSDesignShowcase = () => {
  return (
    <div className="p-8 bg-background text-text-secondary font-sans">
      <header className="mb-12">
        <h1>Pro SaaS Design System</h1>
        <p className="text-lg mt-2">A showcase of the clean, modern, and professional UI components.</p>
      </header>

      {/* Section 1: Typography */}
      <section className="mb-12">
        <h2 className="mb-4">1. Typography</h2>
        <Card>
          <div className="p-6">
            <h1>Heading 1 - The quick brown fox jumps over the lazy dog.</h1>
            <p className="mt-2">This is the largest heading, used for main page titles.</p>
            <hr className="my-6 border-card-stroke" />
            <h2>Heading 2 - The quick brown fox jumps over the lazy dog.</h2>
            <p className="mt-2">This is the second largest heading, used for section titles.</p>
            <hr className="my-6 border-card-stroke" />
            <h3>Heading 3 - The quick brown fox jumps over the lazy dog.</h3>
            <p className="mt-2">This is the third largest heading, used for sub-section titles.</p>
            <hr className="my-6 border-card-stroke" />
            <p>This is a standard paragraph of body text. It's used for descriptions, explanations, and general content. The quick brown fox jumps over the lazy dog. It provides a clean and readable experience for the user.</p>
          </div>
        </Card>
      </section>

      {/* Section 2: Buttons */}
      <section className="mb-12">
        <h2 className="mb-4">2. Buttons</h2>
        <Card>
          <div className="p-6 flex items-center gap-4">
            <Button className="primary">Primary Button</Button>
            <Button>Default Button</Button>
            {/* Example of a button with an icon */}
            <Button>
              <Users className="w-4 h-4 mr-2" />
              <span>With Icon</span>
            </Button>
          </div>
          <div className="p-6 border-t border-card-stroke bg-background rounded-b-lg">
            <p>Buttons have a default, primary style. They provide clear calls-to-action with subtle hover effects.</p>
          </div>
        </Card>
      </section>
      
      {/* Section 3: Cards */}
      <section className="mb-12">
        <h2 className="mb-4">3. Cards & Layout</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <div className="p-6">
              <h3>Standard Card</h3>
              <p className="mt-2">This is a standard card component. It's used to group related content and provide a clear visual hierarchy on the page.</p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <h3>Hover Effect</h3>
              <p className="mt-2">Cards have a subtle lift and shadow effect on hover to provide feedback to the user and feel interactive.</p>
            </div>
          </Card>
          <Card>
            <div className="p-6 flex flex-col items-center text-center">
              <div className="bg-brand-light p-3 rounded-full mb-4">
                <Home className="w-6 h-6 text-brand" />
              </div>
              <h3>Card with Icon</h3>
              <p className="mt-2">Cards can contain icons and other elements to create visually appealing layouts.</p>
            </div>
          </Card>
        </div>
      </section>

      {/* Section 4: Form Inputs */}
      <section className="mb-12">
        <h2 className="mb-4">4. Form Inputs</h2>
        <Card>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">Full Name</label>
              <Input id="name" type="text" placeholder="John Doe" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">Email Address</label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="bio" className="block text-sm font-medium text-text-primary mb-2">Biography</label>
              <textarea id="bio" rows={4} className="w-full" placeholder="Tell us about yourself..."></textarea>
            </div>
          </div>
        </Card>
      </section>

      {/* Section 5: Badges */}
      <section className="mb-12">
        <h2 className="mb-4">5. Badges & Status</h2>
        <Card>
          <div className="p-6 flex items-center gap-4">
            <span className="badge badge-success">Approved</span>
            <span className="badge badge-warning">Pending</span>
            <span className="badge badge-error">Rejected</span>
            <span className="badge badge-info">Active</span>
          </div>
        </Card>
      </section>

    </div>
  );
};
