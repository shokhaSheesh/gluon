import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toasts } from './components/ui';
import { AppProvider, PLATFORM_HOME, useApp, type Platform } from './lib/store';
import Login from './pages/auth/Login';
import Forgot from './pages/auth/Forgot';
import Register from './pages/auth/Register';
import UserLayout from './layouts/UserLayout';
import PanelLayout from './layouts/PanelLayout';
import Dashboard from './pages/user/Dashboard';
import Integration from './pages/user/Integration';
import Archive from './pages/user/Archive';
import Store from './pages/user/Store';
import Banking from './pages/user/Banking';
import Chat from './pages/user/Chat';
import Operations from './pages/user/Operations';
import Billing from './pages/user/Billing';
import Pricing from './pages/panel/Pricing';
import { BillingProvider } from './lib/billing';
import { BrandingProvider } from './lib/branding';
import Branding from './pages/panel/Branding';
import ServiceDashboard from './pages/panel/merchant/ServiceDashboard';
import ServiceClients from './pages/panel/merchant/ServiceClients';
import ConnRequests from './pages/panel/merchant/ConnRequests';
import ServiceClientDetail from './pages/panel/merchant/ServiceClientDetail';
import ServiceSubscriptions from './pages/panel/merchant/ServiceSubscriptions';
import AuditLog from './pages/panel/merchant/AuditLog';
import BankClients from './pages/panel/merchant/BankClients';
import BankClientDetail, { ClientDetail } from './pages/panel/merchant/BankClientDetail';
import AdminCompanies from './pages/panel/AdminCompanies';
import AdminPartners from './pages/panel/AdminPartners';
import AdminServices from './pages/panel/AdminServices';
import { AdminOperations, AdminPayments, AdminSubscriptions } from './pages/panel/AdminFinance';
import BankDashboard from './pages/panel/merchant/BankDashboard';
import BankServices from './pages/panel/merchant/BankServices';
import AdminBanks, { AdminAccountRequests } from './pages/panel/AdminBanks';
import AdminBanners from './pages/panel/AdminBanners';
import AdminProducts from './pages/panel/AdminProducts';
import Team from './pages/panel/merchant/Team';
import { MerchantProvider } from './lib/merchant';
import PanelDashboard from './pages/panel/PanelDashboard';
import PanelChat from './pages/panel/PanelChat';

/** Only lets in a session of the matching platform; otherwise sends to login or the session's own home. */
function Guard({ platform, children }: { platform: Platform; children: ReactNode }) {
  const { session } = useApp();
  if (!session) return <Navigate to="/login" replace />;
  if (session.platform !== platform) return <Navigate to={PLATFORM_HOME[session.platform]} replace />;
  return <>{children}</>;
}

/** Bank-offers page is for regular Gluon users only, not clients who came through a partner bank. */
function GluonOnly({ children }: { children: ReactNode }) {
  const { session } = useApp();
  return session?.kind === 'bank' ? <Navigate to="/app" replace /> : <>{children}</>;
}

/** Sections that exist only in one merchant cabinet type. */
function MerchantKind({ kind, children }: { kind: 'bank' | 'service'; children: ReactNode }) {
  const { session } = useApp();
  return session?.kind === kind ? <>{children}</> : <Navigate to="/merchant" replace />;
}

function MerchantClients() {
  const { session } = useApp();
  return session?.kind === 'bank' ? <BankClients /> : <ServiceClients />;
}

function MerchantClientDetail() {
  const { session } = useApp();
  return session?.kind === 'bank' ? <BankClientDetail /> : <ServiceClientDetail />;
}

function MerchantHome() {
  const { session } = useApp();
  return session?.kind === 'bank' ? <BankDashboard /> : <ServiceDashboard />;
}

function Home() {
  const { session } = useApp();
  return <Navigate to={session ? PLATFORM_HOME[session.platform] : '/login'} replace />;
}

export default function App() {
  return (
    <AppProvider>
      <BillingProvider>
      <BrandingProvider>
      <MerchantProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/register" element={<Register />} />

          <Route path="/app" element={<Guard platform="user"><UserLayout /></Guard>}>
            <Route index element={<Dashboard />} />
            <Route path="service/:id" element={<Integration />} />
            <Route path="archive" element={<Archive />} />
            <Route path="store" element={<Store />} />
            <Route path="banking" element={<GluonOnly><Banking /></GluonOnly>} />
            <Route path="operations" element={<Operations />} />
            <Route path="billing" element={<Billing />} />
            <Route path="chat" element={<Chat />} />
          </Route>

          <Route path="/merchant" element={<Guard platform="merchant"><PanelLayout platform="merchant" /></Guard>}>
            <Route index element={<MerchantHome />} />
            <Route path="clients" element={<MerchantClients />} />
            <Route path="clients/:id" element={<MerchantClientDetail />} />
            <Route path="chat" element={<PanelChat />} />
            <Route path="team" element={<Team />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="subscriptions" element={<MerchantKind kind="service"><ServiceSubscriptions /></MerchantKind>} />
            <Route path="requests" element={<MerchantKind kind="service"><ConnRequests /></MerchantKind>} />
            <Route path="services" element={<MerchantKind kind="bank"><BankServices /></MerchantKind>} />
            <Route path="branding" element={<MerchantKind kind="bank"><Branding /></MerchantKind>} />
          </Route>

          <Route path="/admin" element={<Guard platform="admin"><PanelLayout platform="admin" /></Guard>}>
            <Route index element={<PanelDashboard />} />
            <Route path="companies" element={<AdminCompanies />} />
            <Route path="companies/:id" element={<ClientDetail admin />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="operations" element={<AdminOperations />} />
            <Route path="partners" element={<AdminPartners />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="bank-products" element={<AdminProducts />} />
            <Route path="account-requests" element={<AdminAccountRequests />} />
            <Route path="chat" element={<PanelChat />} />
            <Route path="team" element={<Team />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="banks" element={<AdminBanks />} />
          </Route>

          <Route path="*" element={<Home />} />
        </Routes>
        <Toasts />
      </BrowserRouter>
      </MerchantProvider>
      </BrandingProvider>
      </BillingProvider>
    </AppProvider>
  );
}
