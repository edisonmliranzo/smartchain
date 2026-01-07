import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth, firestore, isFirebaseConfigured } from '../firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { doc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

// Admin wallet addresses (lowercase for comparison)
const ADMIN_ADDRESSES = [
    '0x0000000000000000000000000000000000000000', // Replace with actual admin addresses
];

// Credit plans
export const CREDIT_PLANS = [
    { id: 'basic', credits: 10, price: 20, label: '10 Credits', popular: false },
    { id: 'standard', credits: 25, price: 50, label: '25 Credits', popular: true },
    { id: 'premium', credits: 50, price: 100, label: '50 Credits', popular: false },
];

interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    credits: number;
    isAdmin: boolean;
    walletAddress: string | null;
    createdAt: Date;
    lastLogin: Date;
}

interface CreditsContextType {
    user: User | null;
    profile: UserProfile | null;
    credits: number;
    isAdmin: boolean;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    useCredit: () => Promise<boolean>;
    addCredits: (amount: number) => Promise<void>;
    hasCredits: boolean;
    linkWallet: (address: string) => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType>({
    user: null,
    profile: null,
    credits: 0,
    isAdmin: false,
    loading: true,
    signInWithGoogle: async () => { },
    signOut: async () => { },
    useCredit: async () => false,
    addCredits: async () => { },
    hasCredits: false,
    linkWallet: async () => { },
});

export const useCredits = () => useContext(CreditsContext);

export function CreditsProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Check if user is admin based on wallet address
    const checkIsAdmin = (walletAddress: string | null): boolean => {
        if (!walletAddress) return false;
        return ADMIN_ADDRESSES.includes(walletAddress.toLowerCase());
    };

    useEffect(() => {
        if (!isFirebaseConfigured || !auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser && firestore) {
                // Get or create user profile
                const userRef = doc(firestore, 'users', firebaseUser.uid);

                // Set up real-time listener for profile updates
                const unsubProfile = onSnapshot(userRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setProfile({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            credits: data.credits || 0,
                            isAdmin: checkIsAdmin(data.walletAddress),
                            walletAddress: data.walletAddress || null,
                            createdAt: data.createdAt?.toDate() || new Date(),
                            lastLogin: data.lastLogin?.toDate() || new Date(),
                        });
                    } else {
                        // Create new user with 1 free credit
                        const newProfile: any = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            displayName: firebaseUser.displayName,
                            photoURL: firebaseUser.photoURL,
                            credits: 1, // Free credit for new users
                            walletAddress: null,
                            createdAt: new Date(),
                            lastLogin: new Date(),
                        };
                        await setDoc(userRef, newProfile);
                        setProfile({
                            ...newProfile,
                            isAdmin: false,
                            createdAt: new Date(),
                            lastLogin: new Date(),
                        });
                    }
                    setLoading(false);
                });

                return () => unsubProfile();
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        if (!auth) {
            console.error('Firebase auth not initialized');
            return;
        }

        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    };

    const signOut = async () => {
        if (!auth) return;

        try {
            await firebaseSignOut(auth);
            setProfile(null);
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    };

    const useCredit = async (): Promise<boolean> => {
        if (!profile || !firestore) return false;

        // Admin has unlimited credits
        if (profile.isAdmin) return true;

        // Check if user has credits
        if (profile.credits <= 0) return false;

        try {
            const userRef = doc(firestore, 'users', profile.uid);
            await updateDoc(userRef, {
                credits: profile.credits - 1
            });
            return true;
        } catch (error) {
            console.error('Error using credit:', error);
            return false;
        }
    };

    const addCredits = async (amount: number) => {
        if (!profile || !firestore) return;

        try {
            const userRef = doc(firestore, 'users', profile.uid);
            await updateDoc(userRef, {
                credits: profile.credits + amount
            });
        } catch (error) {
            console.error('Error adding credits:', error);
            throw error;
        }
    };

    const linkWallet = async (address: string) => {
        if (!profile || !firestore) return;

        try {
            const userRef = doc(firestore, 'users', profile.uid);
            await updateDoc(userRef, {
                walletAddress: address.toLowerCase()
            });
        } catch (error) {
            console.error('Error linking wallet:', error);
            throw error;
        }
    };

    const hasCredits = profile?.isAdmin || (profile?.credits || 0) > 0;

    return (
        <CreditsContext.Provider value={{
            user,
            profile,
            credits: profile?.isAdmin ? Infinity : (profile?.credits || 0),
            isAdmin: profile?.isAdmin || false,
            loading,
            signInWithGoogle,
            signOut,
            useCredit,
            addCredits,
            hasCredits,
            linkWallet,
        }}>
            {children}
        </CreditsContext.Provider>
    );
}
