import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './styles/animations.css';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
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
import { CreateTournament } from './pages/CreateTournament';
import { TournamentRegistration } from './pages/TournamentRegistration';
import { TournamentMap } from './pages/TournamentMap';
import { TournamentDetails } from './pages/TournamentDetails';
import { PaymentSuccess } from './pages/payment/PaymentSuccess';
import { PaymentFailure } from './pages/payment/PaymentFailure';
import { UserProfileSettings } from './components/profile/UserProfileSettings';
import { TestingPanel } from './components/ui/TestingPanel';
import { ViewPlayerProfile } from './components/player/ViewPlayerProfile';
import { TournamentPlayerChat } from './components/player/TournamentPlayerChat';
import { MyRequests } from './pages/MyRequests';
import { PWAInstallButton } from './components/ui/PWAInstallButton';
import { PWAStatus } from './components/ui/PWAStatus';
import { ProtectedRoute } from './components/ui/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <ElectronTitleBar />
                    <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/player-dashboard" element={<PlayerDashboard />} />
                <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
                <Route path="/facilities" element={<Facilities />} />
                <Route path="/venues" element={<Venues />} />
                <Route path="/venues/:venueId" element={<VenueDetail />} />
                <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/create-tournament" element={<CreateTournament />} />
                <Route path="/tournament/:tournamentId" element={<TournamentDetails />} />
                <Route path="/tournament/:tournamentId/register" element={<TournamentRegistration />} />
                <Route path="/tournament/:tournamentId/chat" element={<TournamentPlayerChat />} />
                <Route path="/tournament-map" element={<TournamentMap />} />
                <Route path="/player-profile/:playerId" element={<ViewPlayerProfile />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/failure" element={<PaymentFailure />} />
                <Route path="/profile" element={<UserProfileSettings />} />
                <Route path="/organizer-profile" element={<UserProfileSettings />} />
                <Route path="/my-requests" element={<ProtectedRoute><MyRequests /></ProtectedRoute>} />
              </Routes>
            </main>
            <Footer />
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
  );
}

export default App;