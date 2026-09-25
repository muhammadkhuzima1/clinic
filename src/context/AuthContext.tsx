import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, Patient, Doctor } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  patientId?: string;
  doctorId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  currentRole: Role | 'public';
  signInWithPassword: (
    email: string,
    password: string,
    expectedRole?: Role
  ) => Promise<{ success: boolean; error?: string }>;
  signUpPatient: (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    dob?: string;
    gender?: 'Male' | 'Female' | 'Other';
    bloodGroup?: string;
    address?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  activePatient: Patient | null;
  activeDoctor: Doctor | null;
  isSupabaseActive: boolean;
  isLoadingAuth: boolean;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('nfc_current_auth_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [activeDoctor, setActiveDoctor] = useState<Doctor | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const isSupabaseActive = isSupabaseConfigured();

  const persistUser = (newUser: AuthUser | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('nfc_current_auth_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('nfc_current_auth_user');
      setActivePatient(null);
      setActiveDoctor(null);
    }
  };

  const loadSupabaseUserProfile = async (userId: string, email: string): Promise<AuthUser | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        console.warn('Could not load profile row for authenticated user:', error);
        return null;
      }

      const role = (profile.role as Role) || 'patient';
      const authUser: AuthUser = {
        id: profile.id,
        name: profile.full_name || 'Clinic User',
        email: profile.email || email,
        role,
        avatar: profile.avatar_url,
        patientId: role === 'patient' ? profile.id : undefined,
        doctorId: role === 'doctor' ? profile.id : undefined,
      };

      persistUser(authUser);

      if (role === 'patient') {
        const p = await supabaseService.getPatientById(profile.id);
        setActivePatient(p);
      } else if (role === 'doctor') {
        const d = await supabaseService.getDoctorById(profile.id);
        setActiveDoctor(d);
      }

      return authUser;
    } catch (err) {
      console.error('loadSupabaseUserProfile error:', err);
      return null;
    }
  };

  const refreshUserProfile = async () => {
    if (user?.id) {
      await loadSupabaseUserProfile(user.id, user.email);
    }
  };

  // Synchronize on startup and listen to Supabase Auth state changes
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      if (!isSupabaseConfigured()) {
        if (isMounted) setIsLoadingAuth(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          await loadSupabaseUserProfile(session.user.id, session.user.email || '');
        } else if (isMounted) {
          persistUser(null);
        }
      } catch (err) {
        console.warn('Session check error:', err);
      } finally {
        if (isMounted) setIsLoadingAuth(false);
      }
    };

    initAuth();

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            await loadSupabaseUserProfile(session.user.id, session.user.email || '');
          } else if (event === 'SIGNED_OUT') {
            persistUser(null);
          }
        }
      );

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [isSupabaseActive]);

  // Synchronize active patient / doctor when user changes
  useEffect(() => {
    if (!user) {
      setActivePatient(null);
      setActiveDoctor(null);
      return;
    }

    if (user.role === 'patient') {
      supabaseService.getPatientById(user.id).then((p) => setActivePatient(p));
    } else if (user.role === 'doctor') {
      supabaseService.getDoctorById(user.id).then((d) => setActiveDoctor(d));
    }
  }, [user?.id, user?.role]);

  // Real Supabase Auth sign-in with password and role verification
  const signInWithPassword = async (
    email: string,
    password: string,
    expectedRole?: Role
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error:
          'Supabase backend credentials (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are not set. Please provide your Supabase credentials to log in.',
      };
    }

    setIsLoadingAuth(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setIsLoadingAuth(false);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        setIsLoadingAuth(false);
        return { success: false, error: 'Authentication failed. Please verify credentials.' };
      }

      const loadedUser = await loadSupabaseUserProfile(data.user.id, data.user.email || email);
      setIsLoadingAuth(false);

      if (!loadedUser) {
        return {
          success: false,
          error: 'User profile not found in database. Please contact the administrator.',
        };
      }

      // Check role authorization if expectedRole was specified
      if (expectedRole && loadedUser.role !== expectedRole) {
        if (expectedRole === 'admin') {
          await supabase.auth.signOut();
          persistUser(null);
          return {
            success: false,
            error:
              'Access Denied: This account does not possess clinic administrator privileges.',
          };
        } else if (expectedRole === 'doctor') {
          await supabase.auth.signOut();
          persistUser(null);
          return {
            success: false,
            error:
              'Access Denied: This account is not registered as a doctor. Doctor accounts are created by the clinic administrator.',
          };
        } else if (expectedRole === 'patient') {
          // Allow doctor/admin to view or test if needed, or enforce patient
          return { success: true };
        }
      }

      return { success: true };
    } catch (err: any) {
      setIsLoadingAuth(false);
      return { success: false, error: err?.message || 'Unexpected login error' };
    }
  };

  // Real Patient registration with Supabase Auth
  const signUpPatient = async (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    dob?: string;
    gender?: 'Male' | 'Female' | 'Other';
    bloodGroup?: string;
    address?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error:
          'Supabase credentials are required. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      };
    }

    setIsLoadingAuth(true);

    try {
      // 1. Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email.trim(),
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
            phone: data.phone.trim(),
            role: 'patient', // Enforce patient role strictly
          },
        },
      });

      if (authError) {
        setIsLoadingAuth(false);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        setIsLoadingAuth(false);
        return { success: false, error: 'Registration failed. No user was created.' };
      }

      // 2. Upsert demographics into profiles table
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        full_name: data.fullName.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        role: 'patient',
        dob: data.dob || '1995-01-01',
        gender: data.gender || 'Male',
        blood_group: data.bloodGroup || 'O+',
        address: data.address || 'Nowshera, Khyber Pakhtunkhwa',
      });

      // 3. Load user profile into context state
      await loadSupabaseUserProfile(authData.user.id, data.email);
      setIsLoadingAuth(false);
      return { success: true };
    } catch (err: any) {
      setIsLoadingAuth(false);
      return { success: false, error: err?.message || 'Registration exception' };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }
    persistUser(null);
  };

  const currentRole: Role | 'public' = user ? user.role : 'public';

  return (
    <AuthContext.Provider
      value={{
        user,
        currentRole,
        signInWithPassword,
        signUpPatient,
        logout,
        activePatient,
        activeDoctor,
        isSupabaseActive,
        isLoadingAuth,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
