import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AuthForms.module.css';

export const LoginForm = ({ onSwitchToSignup }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Quick heuristic: if it has '@', assume email, else assume mobile
    const credentials = { password };
    if (identifier.includes('@')) {
      credentials.email = identifier;
    } else {
      credentials.mobile = identifier;
    }

    const res = await login(credentials);
    if (!res.success) {
      setError(res.error?.message || 'Login failed. Please check your credentials.');
    }
    setIsLoading(false);
  };

  return (
    <div className={styles.authContainer}>
      <h2 className={styles.title}>Welcome Back</h2>
      <p className={styles.subtitle}>Sign in to pick up where you left off</p>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label>Email or Mobile Number</label>
          <input 
            type="text" 
            value={identifier} 
            onChange={e => setIdentifier(e.target.value)} 
            placeholder="john@example.com or +1234567890"
            required 
          />
        </div>
        
        <div className={styles.inputGroup}>
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="••••••••"
            required 
          />
        </div>
        
        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      
      <div className={styles.switchMode}>
        Don't have an account? <button type="button" onClick={onSwitchToSignup}>Sign Up</button>
      </div>
    </div>
  );
};

export const SignupForm = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: ''
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const res = await register(formData);
    if (!res.success) {
      setError(res.error?.message || 'Registration failed. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className={styles.authContainer}>
      <h2 className={styles.title}>Create Account</h2>
      <p className={styles.subtitle}>Join us and discover your personal style</p>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.inputGroup}>
            <label>First Name</label>
            <input 
              type="text" 
              name="firstName"
              value={formData.firstName} 
              onChange={handleChange} 
              placeholder="John"
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Last Name *</label>
            <input 
              type="text" 
              name="lastName"
              value={formData.lastName} 
              onChange={handleChange} 
              placeholder="Doe"
              required
            />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label>Email *</label>
          <input 
            type="email" 
            name="email"
            value={formData.email} 
            onChange={handleChange} 
            placeholder="john@example.com"
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Mobile Number</label>
          <input 
            type="tel" 
            name="mobile"
            value={formData.mobile} 
            onChange={handleChange} 
            placeholder="+1 234 567 8900"
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Password *</label>
          <input 
            type="password" 
            name="password"
            value={formData.password} 
            onChange={handleChange} 
            placeholder="••••••••"
            required
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      
      <div className={styles.switchMode}>
        Already have an account? <button type="button" onClick={onSwitchToLogin}>Sign In</button>
      </div>
    </div>
  );
};
