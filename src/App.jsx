import { lazy, Suspense, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from './layout/AppShell';
import { useAuth } from './auth/AuthContext';
import { Spinner } from './ui/primitives';

const Home = lazy(() => import('./pages/Home'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Dna = lazy(() => import('./pages/Dna'));
const Search = lazy(() => import('./pages/Search'));
const Product = lazy(() => import('./pages/Product'));
const Saved = lazy(() => import('./pages/Saved'));
const Brands = lazy(() => import('./pages/Brands'));
const BrandDetail = lazy(() => import('./pages/BrandDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const About = lazy(() => import('./pages/info/About'));
const Contact = lazy(() => import('./pages/info/Contact'));
const Privacy = lazy(() => import('./pages/info/Privacy'));
const Terms = lazy(() => import('./pages/info/Terms'));
const NotFound = lazy(() => import('./pages/info/NotFound'));
const GetApp = lazy(() => import('./pages/info/GetApp'));

function RequireAuth({ children }) {
  const { isSignedIn } = useAuth();
  const location = useLocation();
  if (!isSignedIn) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

/** Only redirects shoppers who arrive already signed in; the auth pages handle their own post-sign-in navigation. */
function GuestOnly({ children }) {
  const { isSignedIn } = useAuth();
  const location = useLocation();
  const [signedInOnArrival] = useState(isSignedIn);
  if (signedInOnArrival) return <Navigate to={location.state?.from || '/profile'} replace />;
  return children;
}

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="quiz" element={<Quiz />} />
          <Route path="dna" element={<Dna />} />
          <Route path="search" element={<Search />} />
          <Route path="p/:id" element={<Product />} />
          <Route path="saved" element={<Saved />} />
          <Route path="brands" element={<Brands />} />
          <Route path="brands/:id" element={<BrandDetail />} />
          <Route
            path="profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route
            path="login"
            element={
              <GuestOnly>
                <Login />
              </GuestOnly>
            }
          />
          <Route
            path="signup"
            element={
              <GuestOnly>
                <Signup />
              </GuestOnly>
            }
          />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="app" element={<GetApp />} />
          <Route path="swipe" element={<Navigate to="/quiz" replace />} />
          <Route path="datahub" element={<Navigate to="/profile" replace />} />
          <Route path="stories" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
