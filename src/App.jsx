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

// Layout
import MainLayout from '@/components/layout/MainLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';

// Public pages
import Home from '@/pages/Home';
import Marketplace from '@/pages/Marketplace';
import ListingDetail from '@/pages/ListingDetail';
import Equipment from '@/pages/Equipment';
import Transport from '@/pages/Transport';
import MarketPrices from '@/pages/MarketPrices';
import Notices from '@/pages/Notices';
import Profile from '@/pages/Profile';
import Notifications from '@/pages/Notifications';
import Messages from '@/pages/Messages';
import ConversationDetail from '@/pages/ConversationDetail';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Farmer Dashboard
import FarmerDashboard from '@/pages/FarmerDashboard';
import FarmerOverview from '@/pages/farmer/FarmerOverview';
import MyListings from '@/pages/farmer/MyListings';
import AddListing from '@/pages/farmer/AddListing';
import FarmerBids from '@/pages/farmer/FarmerBids';
import FarmerOrders from '@/pages/farmer/FarmerOrders';
import FarmerEquipmentBookings from '@/pages/farmer/FarmerEquipmentBookings';
import FarmerTransport from '@/pages/farmer/FarmerTransport';
import FarmerTransactions from '@/pages/farmer/FarmerTransactions';
import HarvestReminders from '@/pages/farmer/HarvestReminders';

// Buyer Dashboard
import BuyerDashboard from '@/pages/BuyerDashboard';
import BuyerOverview from '@/pages/buyer/BuyerOverview';
import BuyerOrders from '@/pages/buyer/BuyerOrders';
import BuyerTransactions from '@/pages/buyer/BuyerTransactions';

// Equipment Owner Dashboard
import EquipmentOwnerDashboard from '@/pages/EquipmentOwnerDashboard';
import OwnerOverview from '@/pages/equipment_owner/OwnerOverview';
import MyEquipment from '@/pages/equipment_owner/MyEquipment';
import AddEquipment from '@/pages/equipment_owner/AddEquipment';
import OwnerBookings from '@/pages/equipment_owner/OwnerBookings';

// Transport Dashboard
import TransportDashboard from '@/pages/TransportDashboard';
import TransportOverview from '@/pages/transport/TransportOverview';
import MyVehicles from '@/pages/transport/MyVehicles';
import AddVehicle from '@/pages/transport/AddVehicle';
import TransportBookings from '@/pages/transport/TransportBookings';

// Admin Dashboard
import AdminDashboard from '@/pages/AdminDashboard';
import AdminOverview from '@/pages/admin/AdminOverview';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminCrops from '@/pages/admin/AdminCrops';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminNotices from '@/pages/admin/AdminNotices';
import AdminTransactions from '@/pages/admin/AdminTransactions';
import AdminEquipment from '@/pages/admin/AdminEquipment';
import AdminTransport from '@/pages/admin/AdminTransport';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading KRISHOK-SHEBA BD...</p>
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
          <Route path="bids" element={<FarmerBids />} />
          <Route path="orders" element={<FarmerOrders />} />
          <Route path="equipment-bookings" element={<FarmerEquipmentBookings />} />
          <Route path="transport-requests" element={<FarmerTransport />} />
          <Route path="transactions" element={<FarmerTransactions />} />
          <Route path="harvest-reminders" element={<HarvestReminders />} />
        </Route>
      </Route>

      {/* Buyer Dashboard */}
      <Route element={<DashboardLayout />}>
        <Route path="/buyer-dashboard" element={<BuyerDashboard />}>
          <Route index element={<BuyerOverview />} />
          <Route path="orders" element={<BuyerOrders />} />
          <Route path="transactions" element={<BuyerTransactions />} />
        </Route>
      </Route>

      {/* Equipment Owner Dashboard */}
      <Route element={<DashboardLayout />}>
        <Route path="/equipment-owner-dashboard" element={<EquipmentOwnerDashboard />}>
          <Route index element={<OwnerOverview />} />
          <Route path="equipment" element={<MyEquipment />} />
          <Route path="add" element={<AddEquipment />} />
          <Route path="bookings" element={<OwnerBookings />} />
        </Route>
      </Route>

      {/* Transport Dashboard */}
      <Route element={<DashboardLayout />}>
        <Route path="/transport-dashboard" element={<TransportDashboard />}>
          <Route index element={<TransportOverview />} />
          <Route path="vehicles" element={<MyVehicles />} />
          <Route path="add" element={<AddVehicle />} />
          <Route path="bookings" element={<TransportBookings />} />
        </Route>
      </Route>

      {/* Admin Dashboard */}
      <Route element={<DashboardLayout />}>
        <Route path="/admin" element={<AdminDashboard />}>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="crops" element={<AdminCrops />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="equipment" element={<AdminEquipment />} />
          <Route path="transport" element={<AdminTransport />} />
          <Route path="notices" element={<AdminNotices />} />
          <Route path="transactions" element={<AdminTransactions />} />
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
      <AuthenticatedApp />
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
