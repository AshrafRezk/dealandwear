import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm, SignupForm } from '../components/Auth/AuthForms';
import styles from './Home.module.css';

const Home = () => {
  const { userToken, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);

  useEffect(() => {
    if (!loading && userToken) {
      navigate('/swipe');
    }
  }, [userToken, loading, navigate]);

  if (loading) return null; // Or a nice full-screen spinner
  
  // If user is logged in, useEffect will navigate them away.
  if (userToken) return null;

  return (
    <div className={styles.homeContainer}>
      <div className={styles.overlay}></div>
      <div className={styles.contentWrapper}>
        <div className={styles.brandSection}>
          <h1 className={styles.brandName}>Deal & Wear</h1>
          <p className={styles.brandTagline}>Train your styles. Unlock your contact profile.</p>
        </div>
        
        <div className={styles.authWrapper}>
          {isLoginMode ? (
            <LoginForm onSwitchToSignup={() => setIsLoginMode(false)} />
          ) : (
            <SignupForm onSwitchToLogin={() => setIsLoginMode(true)} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
