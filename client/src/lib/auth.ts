import { 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "./firebase";
import { apiRequest } from "./queryClient";
import type { User } from "@shared/schema";

const provider = new GoogleAuthProvider();

export function signInWithGoogle() {
  return signInWithRedirect(auth, provider);
}

export function signOut() {
  return firebaseSignOut(auth);
}

export async function handleAuthRedirect(): Promise<FirebaseUser | null> {
  const result = await getRedirectResult(auth);
  if (result?.user) {
    // Create or update user in our database
    await syncUserWithDatabase(result.user);
    return result.user;
  }
  return null;
}

export async function syncUserWithDatabase(firebaseUser: FirebaseUser): Promise<User> {
  try {
    // Try to get existing user
    const response = await fetch(`/api/users/firebase/${firebaseUser.uid}`);
    
    if (response.ok) {
      return await response.json();
    }
    
    // Create new user if doesn't exist
    const userData = {
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email!,
      username: firebaseUser.email!.split('@')[0],
      displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
      photoURL: firebaseUser.photoURL,
      favoriteTeams: [],
      favoriteSports: [],
    };
    
    const createResponse = await apiRequest('POST', '/api/users', userData);
    return await createResponse.json();
  } catch (error) {
    console.error('Error syncing user with database:', error);
    throw error;
  }
}

export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
