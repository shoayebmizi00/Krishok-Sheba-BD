import React, { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { LanguageProvider } from '@/lib/LanguageContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import RouteDiagnostics from '@/components/RouteDiagnostics';
import PageLoader from '@/components/shared/PageLoader';

// Layout
import MainLayout from '@/components/layout/MainLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';

const Home = lazy(() => import('@/pages/Home'));
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const ListingDetail = lazy(() => import('@/pages/ListingDetail'));
const Equipment = lazy(() => import('@/pages/Equipment'));
const Transport = lazy(() => import('@/pages/Transport'));
const MarketPrices = lazy(() => import('@/pages/MarketPrices'));
const Notices = lazy(() => import('@/pages/Notices'));
const Profile = lazy(() => import('@/pages/Profile'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Messages = lazy(() => import('@/pages/Messages'));
const ConversationDetail = lazy(() => import('@/pages/ConversationDetail'));
const Stories = lazy(() => import('@/pages/Stories'));
const StoryDetail = lazy(() => import('@/pages/StoryDetail'));
const ShareStory = lazy(() => import('@/pages/ShareStory'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const FarmerDashboard = lazy(() => import('@/pages/FarmerDashboard'));
const FarmerOverview = lazy(() => import('@/pages/farmer/FarmerOverview'));
const MyListings = lazy(() => import('@/pages/farmer/MyListings'));
const AddListing = lazy(() => import('@/pages/farmer/AddListing'));
const FarmerBids = lazy(() => import('@/pages/farmer/FarmerBids'));
const FarmerOrders = lazy(() => import('@/pages/farmer/FarmerOrders'));
const FarmerEquipmentBookings = lazy(() => import('@/pages/farmer/FarmerEquipmentBookings'));
const FarmerTransport = lazy(() => import('@/pages/farmer/FarmerTransport'));
const FarmerTransactions = lazy(() => import('@/pages/farmer/FarmerTransactions'));
const HarvestReminders = lazy(() => import('@/pages/farmer/HarvestReminders'));
const BuyerDashboard = lazy(() => import('@/pages/BuyerDashboard'));
const BuyerOverview = lazy(() => import('@/pages/buyer/BuyerOverview'));
const BuyerOrders = lazy(() => import('@/pages/buyer/BuyerOrders'));
const BuyerTransactions = lazy(() => import('@/pages/buyer/BuyerTransactions'));
const EquipmentOwnerDashboard = lazy(() => import('@/pages/EquipmentOwnerDashboard'));
const OwnerOverview = lazy(() => import('@/pages/equipment_owner/OwnerOverview'));
const MyEquipment = lazy(() => import('@/pages/equipment_owner/MyEquipment'));
const AddEquipment = lazy(() => import('@/pages/equipment_owner/AddEquipment'));
const OwnerBookings = lazy(() => import('@/pages/equipment_owner/OwnerBookings'));
const TransportDashboard = lazy(() => import('@/pages/TransportDashboard'));
const TransportOverview = lazy(() => import('@/pages/transport/TransportOverview'));
const MyVehicles = lazy(() => import('@/pages/transport/MyVehicles'));
const AddVehicle = lazy(() => import('@/pages/transport/AddVehicle'));
const TransportBookings = lazy(() => import('@/pages/transport/TransportBookings'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminOverview = lazy(() => import('@/pages/admin/AdminOverview'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminCrops = lazy(() => import('@/pages/admin/AdminCrops'));
const AdminBids = lazy(() => import('@/pages/admin/AdminBids'));
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders'));
const AdminBookings = lazy(() => import('@/pages/admin/AdminBookings'));
const AdminNotices = lazy(() => import('@/pages/admin/AdminNotices'));
const AdminTransactions = lazy(() => import('@/pages/admin/AdminTransactions'));
const AdminEquipment = lazy(() => import('@/pages/admin/AdminEquipment'));
const AdminTransport = lazy(() => import('@/pages/admin/AdminTransport'));
const AdminStories = lazy(() => import('@/pages/admin/AdminStories'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminReports = lazy(() => import('@/pages/admin/AdminReports'));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">কৃষক-সেবা বিডি লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Main Layout (with Navbar + Footer) */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/transport" element={<Transport />} />
        <Route path="/market-prices" element={<MarketPrices />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:id" element={<ConversationDetail />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/stories/:id" element={<StoryDetail />} />
        <Route path="/share-story" element={<ShareStory />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Farmer Dashboard */}
      <Route element={<DashboardLayout />}>
        <Route path="/farmer-dashboard" element={<FarmerDashboard />}>
          <Route index element={<FarmerOverview />} />
          <Route path="listings" element={<MyListings />} />
          <Route path="add-listing" element={<AddListing />} />
          <Route path="listings/:id/edit" element={<AddListing />} />
          <Route path="bids" element={<FarmerBids />} />
          <Route path="orders" element={<FarmerOrders />} />
          <Route path="equipment-bookings" element={<FarmerEquipmentBookings />} />
          <Route path="transport-requests" element={<FarmerTransport />} />
          <Route path="transactions" element={<FarmerTransactions />} />
          <Route path="harvest-reminders" element={<HarvestReminders />} />
          <Route path="profile" element={<Profile />} />
          <Route path="share-story" element={<ShareStory />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:id" element={<ConversationDetail />} />
        </Route>
      </Route>

      {/* Buyer Dashboard */}
      <Route element={<DashboardLayout />}>
        <Route path="/buyer-dashboard" element={<BuyerDashboard />}>
          <Route index element={<BuyerOverview />} />
          <Route path="orders" element={<BuyerOrders />} />
          <Route path="transactions" element={<BuyerTransactions />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:id" element={<ConversationDetail />} />
        </Route>
      </Route>

      {/* Equipment Owner Dashboard */}
      <Route element={<DashboardLayout />}>
        <Route path="/equipment-owner-dashboard" element={<EquipmentOwnerDashboard />}>
          <Route index element={<OwnerOverview />} />
          <Route path="equipment" element={<MyEquipment />} />
          <Route path="add" element={<AddEquipment />} />
          <Route path="bookings" element={<OwnerBookings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="share-story" element={<ShareStory />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:id" element={<ConversationDetail />} />
        </Route>
      </Route>

      {/* Transport Dashboard */}
      <Route element={<DashboardLayout />}>
        <Route path="/transport-dashboard" element={<TransportDashboard />}>
          <Route index element={<TransportOverview />} />
          <Route path="vehicles" element={<MyVehicles />} />
          <Route path="add" element={<AddVehicle />} />
          <Route path="bookings" element={<TransportBookings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="share-story" element={<ShareStory />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:id" element={<ConversationDetail />} />
        </Route>
      </Route>

      {/* Admin Dashboard */}
      <Route element={<DashboardLayout />}>
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="crops" element={<AdminCrops />} />
          <Route path="bids" element={<AdminBids />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="equipment" element={<AdminEquipment />} />
          <Route path="transport" element={<AdminTransport />} />
          <Route path="notices" element={<AdminNotices />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="stories" element={<AdminStories />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

const RoutedApp = () => {
  const location = useLocation();

  return (
    <AppErrorBoundary key={location.pathname}>
      <Suspense fallback={<PageLoader />}>
        <AuthenticatedApp />
      </Suspense>
    </AppErrorBoundary>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <RouteDiagnostics />
            <RoutedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App
