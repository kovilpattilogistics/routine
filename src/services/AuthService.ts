import { 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  NextOrObserver
} from "firebase/auth";
import { auth, getAuthErrorMessage } from "@/lib/firebase";

function withTimeout<T>(promise: Promise<T>, ms: number = 15000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out. Please check your internet connection and try again.")), ms)
    ),
  ]);
}

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public onAuthStateChange(callback: NextOrObserver<User>): () => void {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, callback as any);
  }

  public async signIn(email: string, pass: string): Promise<User> {
    if (!auth) throw new Error("Authentication service is unavailable. Please check your configuration.");
    try {
      const cred = await withTimeout(signInWithEmailAndPassword(auth, email, pass));
      return cred.user;
    } catch (e: any) {
      if (e.message?.includes("timed out")) throw e;
      throw new Error(getAuthErrorMessage(e, "Unable to sign in. Please try again."));
    }
  }

  public async register(email: string, pass: string): Promise<User> {
    if (!auth) throw new Error("Authentication service is unavailable. Please check your configuration.");
    try {
      const cred = await withTimeout(createUserWithEmailAndPassword(auth, email, pass));
      return cred.user;
    } catch (e: any) {
      if (e.message?.includes("timed out")) throw e;
      throw new Error(getAuthErrorMessage(e, "Unable to create account. Please try again."));
    }
  }

  public async signOut(): Promise<void> {
    if (!auth) return;
    await firebaseSignOut(auth);
  }
}
