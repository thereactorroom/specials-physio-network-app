import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import IframeDetector from '@/components/IframeDetector';
import FusionCloseButton from '@/components/FusionCloseButton';
import { useEffect } from 'react';
import { getParamCaseInsensitive } from '@/lib/urlParams';
import { getUserCommunityGroups } from '@/lib/fusionBridge';
import { setFusionAdminStatus } from '@/lib/fusionAdminStore';
import Home from './pages/Home';
import CreateEditSpecial from './pages/CreateEditSpecial';
import PreviewSpecial from './pages/PreviewSpecial';
import SpecialView from './pages/SpecialView';
import HistorySpecials from './pages/HistorySpecials';
import AdminViewLog from './pages/AdminViewLog';
import BusinessNotFound from './pages/BusinessNotFound';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Fire postMessage to parent iframe once app is fully loaded.
  // Params are saved to sessionStorage immediately so they survive login redirects.
  useEffect(() => {
    const action = getParamCaseInsensitive('action');
    const origin = getParamCaseInsensitive('origin');
    if (action) sessionStorage.setItem('iframe_action', action);
    if (origin) sessionStorage.setItem('iframe_origin', origin);
  }, []);

  useEffect(() => {
    if (isLoadingAuth || isLoadingPublicSettings) return;
    const action = sessionStorage.getItem('iframe_action');
    const origin = sessionStorage.getItem('iframe_origin');
    if (action && origin) {
      window.parent.postMessage({ action, payload: 'appready' }, origin);
      sessionStorage.removeItem('iframe_action');
      sessionStorage.removeItem('iframe_origin');
    }
  }, [isLoadingAuth, isLoadingPublicSettings]);

  // Handle auth redirect in a useEffect so postMessage fires first
  useEffect(() => {
    if (isLoadingAuth || isLoadingPublicSettings) return;
    if (authError?.type === 'auth_required') {
      navigateToLogin();
    }
  }, [isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin]);

  // Determine admin status from the fusion bridge using the fID param.
  // Runs whenever the app is inside ANY iframe (document.referrer can be empty
  // on a hard refresh, so we can't rely on host detection here — the bridge
  // poll inside getUserCommunityGroups handles the wait/failure gracefully).
  // An explicit Admin URL param from the host always takes priority.
  useEffect(() => {
    if (isLoadingAuth || isLoadingPublicSettings) return;
    if (window.self === window.top) return; // never in a top-level browser tab
    if (getParamCaseInsensitive('Admin') !== null) return;
    const fId = parseInt(getParamCaseInsensitive('fID'), 10) || 0;
    if (fId <= 0) return;
    console.log("[fusion] checking admin status for fID", fId);
    getUserCommunityGroups(fId).then((res) => {
      console.log("[fusion] getUserCommunityGroups response", res);
      const member = res?.member || res?.data?.member || res?.result?.member || res?.data || res?.result || res;
      const groups = Array.isArray(member?.groups) ? member.groups : [];
      const isAdmin = groups.some((g) => {
        const name = typeof g === "string" ? g : (g?.name || g?.title || "");
        return name.toLowerCase().includes("admin");
      });
      console.log("[fusion] member:", member, "groups:", groups, "isAdmin:", isAdmin);
      const name = [member?.name, member?.surname].filter(Boolean).join(" ").trim();
      try {
        if (name) sessionStorage.setItem('__fusion_member_' + fId, name);
      } catch {}
      setFusionAdminStatus(isAdmin);
    }).catch((err) => {
      console.warn("[fusion] getUserCommunityGroups failed for fID", fId, err);
    });
  }, [isLoadingAuth, isLoadingPublicSettings]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      return null;
    }
  }

  // Render the main app
  return (
    <>
      <IframeDetector />
      <FusionCloseButton />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/specials/create" element={<CreateEditSpecial />} />
        <Route path="/specials/edit/:id" element={<CreateEditSpecial />} />
        <Route path="/specials/preview" element={<PreviewSpecial />} />
        <Route path="/specials/view/:id" element={<SpecialView />} />
        <Route path="/specials/history" element={<HistorySpecials />} />
        <Route path="/admin/views/:specialId" element={<AdminViewLog />} />
        <Route path="/admin/views" element={<AdminViewLog />} />
        <Route path="/business-not-found" element={<BusinessNotFound />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
          <SonnerToaster position="top-center" />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App