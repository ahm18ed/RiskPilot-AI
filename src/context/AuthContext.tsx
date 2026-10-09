import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole, ENTERPRISE_PERSONAS } from '../types/auth';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginAsPersona: (personaId: string) => Promise<void>;
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  loginWithSSO: (provider?: string) => Promise<void>;
  registerUser: (data: {
    name: string;
    email: string;
    role: UserRole;
    organization: string;
    department?: string;
    password?: string;
  }) => Promise<void>;
  switchPersona: (personaId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'riskpilot_auth_session_v1';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from localStorage or seed with default CPO if requested
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          setUser(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached auth session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveUserSession = (userProfile: UserProfile, token?: string) => {
    setUser(userProfile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
      if (token) {
        localStorage.setItem('riskpilot_token', token);
      }
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  };

  const loginAsPersona = async (personaId: string) => {
    setIsLoading(true);
    try {
      const persona = ENTERPRISE_PERSONAS.find(p => p.id === personaId) || ENTERPRISE_PERSONAS[0];
      // Notify backend to log audit trail
      try {
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: persona.email, personaId: persona.id })
        });
      } catch (err) {
        // Fallback gracefully in case of offline dev mode
      }
      saveUserSession(persona);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Authentication failed');
      }

      const data = await res.json();
      saveUserSession(data.user, data.token);
    } catch (err: any) {
      // Local fallback if server call fails
      const matched = ENTERPRISE_PERSONAS.find(p => p.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        saveUserSession(matched);
      } else {
        const name = email.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
        const fallbackUser: UserProfile = {
          id: `usr-${Date.now().toString(36)}`,
          name: name || 'Enterprise Operator',
          email,
          role: 'SOURCING_SPECIALIST',
          title: 'Senior Sourcing Specialist',
          department: 'Strategic Sourcing',
          organization: 'AeroDynamics Global Corp',
          permissions: ['RUN_SIMULATIONS', 'DRAFT_ACTIONS', 'INITIATE_RFQ', 'VIEW_SUPPLIERS']
        };
        saveUserSession(fallbackUser);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithSSO = async (provider = 'Okta SSO') => {
    setIsLoading(true);
    try {
      // Elena Vance by default for executive enterprise SSO simulation
      const persona = ENTERPRISE_PERSONAS[0];
      try {
        await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: persona.email, provider })
        });
      } catch (err) {
        // fallback
      }
      saveUserSession(persona);
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (data: {
    name: string;
    email: string;
    role: UserRole;
    organization: string;
    department?: string;
    password?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          role: data.role,
          organization: data.organization,
          department: data.department || 'Strategic Sourcing',
          password: data.password || 'TemporaryPass123!'
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Registration failed');
      }

      const resData = await res.json();
      saveUserSession(resData.user, resData.token);
    } catch (err: any) {
      // Local fallback
      const newUser: UserProfile = {
        id: `usr-${Date.now().toString(36)}`,
        name: data.name,
        email: data.email,
        role: data.role,
        title: data.role === 'CHIEF_PROCUREMENT_OFFICER' ? 'VP Procurement & Supply Chain' : 'Sourcing Lead',
        department: data.department || 'Strategic Sourcing',
        organization: data.organization,
        permissions: ['RUN_SIMULATIONS', 'DRAFT_ACTIONS', 'VIEW_SUPPLIERS', 'APPROVE_ACTIONS']
      };
      saveUserSession(newUser);
    } finally {
      setIsLoading(false);
    }
  };

  const switchPersona = async (personaId: string) => {
    await loginAsPersona(personaId);
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('riskpilot_token');
    } catch (e) {
      console.warn('Error clearing auth storage:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginAsPersona,
        loginWithEmail,
        loginWithSSO,
        registerUser,
        switchPersona,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
