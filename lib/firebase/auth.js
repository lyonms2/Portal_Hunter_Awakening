// ==================== FIREBASE AUTH UTILITIES ====================
// Centralized authentication functions using Firebase Auth
// Replaces Supabase authentication

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from './config';

/**
 * Register a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name (optional)
 * @returns {Promise<Object>} User object and success status
 */
export async function registerUser(email, password, displayName = null) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    return {
      success: true,
      user: {
        id: user.uid,
        email: user.email,
        displayName: user.displayName || displayName
      }
    };
  } catch (error) {
    console.error('Error registering user:', error);
    return {
      success: false,
      error: getAuthErrorMessage(error.code)
    };
  }
}

/**
 * Sign in user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User object and success status
 */
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return {
      success: true,
      user: {
        id: user.uid,
        email: user.email,
        displayName: user.displayName
      }
    };
  } catch (error) {
    console.error('Error logging in:', error);
    return {
      success: false,
      error: getAuthErrorMessage(error.code)
    };
  }
}

/**
 * Sign out current user
 * @returns {Promise<Object>} Success status
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return {
      success: false,
      error: 'Erro ao fazer logout'
    };
  }
}

/**
 * Get current authenticated user
 * @returns {Object|null} Current user or null
 */
export function getCurrentUser() {
  const user = auth.currentUser;
  if (!user) return null;

  return {
    id: user.uid,
    email: user.email,
    displayName: user.displayName
  };
}

/**
 * Listen to auth state changes
 * @param {Function} callback - Callback function to handle auth changes
 * @returns {Function} Unsubscribe function
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        id: user.uid,
        email: user.email,
        displayName: user.displayName
      });
    } else {
      callback(null);
    }
  });
}

/**
 * Get user-friendly error message from Firebase auth error code
 * @param {string} errorCode - Firebase error code
 * @returns {string} User-friendly error message
 */
function getAuthErrorMessage(errorCode) {
  const errorMessages = {
    'auth/email-already-in-use': 'Este email já está em uso',
    'auth/invalid-email': 'Email inválido',
    'auth/operation-not-allowed': 'Operação não permitida',
    'auth/weak-password': 'Senha muito fraca. Use pelo menos 6 caracteres',
    'auth/user-disabled': 'Usuário desabilitado',
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/invalid-credential': 'Credenciais inválidas',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde'
  };

  return errorMessages[errorCode] || 'Erro ao autenticar. Tente novamente.';
}

export default {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  onAuthChange
};
