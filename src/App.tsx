import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './styles/animations.css';
import './styles/mobile.css';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ElectronTitleBar } from './components/ui/ElectronTitleBar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Home } from './pages/Home';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { PlayerDashboard } from './pages/PlayerDashboard';
import { OrganizerDashboard } from './pages/OrganizerDashboard';
import { Facilities } from './pages/Facilities';
import { Venues } from './pages/Venues';
import { VenueDetail } from './pages/VenueDetail';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminDashboardSimple } from './pages/AdminDashboardSimple';
import { CreateTournament } from './pages/CreateTournament';
import { TournamentRegistration } from './pages/TournamentRegistration';
import { TournamentMap } from './pages/TournamentMap';
import { TournamentDetails } from './pages/TournamentDetails';
import { TournamentCommissionPayment } from './pages/TournamentCommissionPayment';
import { PlayerRegistrationPayment } from './pages/PlayerRegistrationPayment';
import { PaymentSuccess } from './pages/payment/PaymentSuccess';
import { PaymentFailure } from './pages/payment/PaymentFailure';
import { UserProfileSettings } from './components/profile/UserProfileSettings';
import { TestingPanel } from './components/ui/TestingPanel';
import { ViewPlayerProfile } from './components/player/ViewPlayerProfile';
import { TournamentPlayerChat } from './components/player/TournamentPlayerChat';
import { PWAInstallButton } from './components/ui/PWAInstallButton';
import { PWAStatus } from './components/ui/PWAStatus';
import { ProtectedRoute } from './components/ui/ProtectedRoute';
import { EditTournament } from './pages/EditTournament';

// Mobile components
import { MobileLayout } from './components/layout/MobileLayout';
import { MobileHome } from './pages/mobile/MobileHome';
import { MobileTournamentDetails } from './pages/mobile/MobileTournamentDetails';
import { MobileTournaments } from './pages/mobile/MobileTournaments';
import { MobileProfile } from './pages/mobile/MobileProfile';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <ElectronTitleBar />
            <div className="min-h-screen flex flex-col">
              {/* Single Routes component for all routes */}
              <Routes>
              {/* Mobile routes - no Header/Footer */}
              <Route path="/mobile" element={
                <MobileLayout>
                  <MobileHome />
                </MobileLayout>
              } />
              <Route path="/mobile/tournament/:tournamentId" element={
                <MobileLayout>
                  <MobileTournamentDetails />
                </MobileLayout>
              } />
              <Route path="/mobile/tournaments" element={
                <MobileLayout>
                  <MobileTournaments />
                </MobileLayout>
              } />
              <Route path="/mobile/profile" element={
                <MobileLayout>
                  <MobileProfile />
                </MobileLayout>
              } />
              
              {/* Desktop routes - with Header/Footer */}
              <Route path="/" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <Home />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/login" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <Login />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/register" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <Register />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/player-dashboard" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <PlayerDashboard />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/organizer-dashboard" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <OrganizerDashboard />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/facilities" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <Facilities />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/venues" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <Venues />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/venues/:venueId" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <VenueDetail />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <>
                    <Header />
                    <main className="flex-1">
                      <AdminDashboard />
                    </main>
                    <Footer />
                  </>
                </ProtectedRoute>
              } />
              <Route path="/create-tournament" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <CreateTournament />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/tournament-commission-payment" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <TournamentCommissionPayment />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/player-registration-payment" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <PlayerRegistrationPayment />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/tournament/:tournamentId" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <TournamentDetails />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/tournament/:tournamentId/register" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <TournamentRegistration />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/tournament/:tournamentId/chat" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <TournamentPlayerChat />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/tournament-map" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <TournamentMap />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/player-profile/:playerId" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <ViewPlayerProfile />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/payment/success" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <PaymentSuccess />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/payment/failure" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <PaymentFailure />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/profile" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <UserProfileSettings />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/organizer-profile" element={
                <>
                  <Header />
                  <main className="flex-1">
                    <UserProfileSettings />
                  </main>
                  <Footer />
                </>
              } />
              <Route path="/edit-tournament/:tournamentId" element={
                <ProtectedRoute requiredRole="organizer">
                  <>
                    <Header />
                    <main className="flex-1">
                      <EditTournament />
                    </main>
                    <Footer />
                  </>
                </ProtectedRoute>
              } />
            </Routes>

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </div>
          <PWAInstallButton />
          <PWAStatus />
          <TestingPanel />
        </Router>
      </NotificationProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;