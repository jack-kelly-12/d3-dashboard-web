import { auth } from "../config/firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getAuthErrorMessage } from "../utils/authUtils";

class AuthManager {
  constructor() {
    this.pendingPopup = false;
    this.authInitialized = false;
    this.currentUser = null;

    auth.onAuthStateChanged((user) => {
      this.authInitialized = true;
      this.currentUser = user;
    });
  }

  async waitForAuth() {
    if (this.authInitialized) return;

    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged(() => {
        this.authInitialized = true;
        unsubscribe();
        resolve();
      });
    });
  }

  async ensureUser(feature) {
    await this.waitForAuth();

    if (!this.currentUser && this.isAnonymousAllowed(feature)) {
      const result = await this.anonymousSignIn();
      if (result.success) {
        this.currentUser = result.user;
      }
    }
    return this.currentUser;
  }

  isAnonymousUser() {
    return this.currentUser?.isAnonymous || false;
  }

  async signUp(email, password) {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      return { success: true, user: result.user };
    } catch (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }
  }

  async googleSignIn() {
    try {
      if (this.pendingPopup) {
        throw new Error("Another sign in attempt is in progress");
      }

      this.pendingPopup = true;
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return { success: true, user: result.user };
    } catch (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    } finally {
      this.pendingPopup = false;
    }
  }

  async emailSignIn(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }
  }

  async anonymousSignIn() {
    try {
      const result = await signInAnonymously(auth);
      return { success: true, user: result.user };
    } catch (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }
  }

  async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }
  }

  isAnonymousAllowed(feature) {
    const anonymousFeatures = ["api", "charts", "reports", "trending"];
    return anonymousFeatures.includes(feature);
  }

  getCurrentUser() {
    if (!this.currentUser) {
      this.ensureUser();
    }
    return this.currentUser;
  }

  onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
  }
}

const manager = new AuthManager();
export default manager;
