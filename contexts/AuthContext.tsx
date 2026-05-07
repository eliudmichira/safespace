"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import {
  User,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

export type UserRole =
  | "survivor"
  | "campus_security"
  | "juja_nps"
  | "gwo_admin"

interface AuthContextType {
  user: User | null
  role: UserRole | null
  loading: boolean
  loginAnonymously: () => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<UserRole>
  registerSurvivor: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  loginAnonymously: async () => {},
  loginWithEmail: async () => {},
  loginWithGoogle: async () => "survivor" as UserRole,
  registerSurvivor: async () => {},
  logout: async () => {},
})

async function ensureUserDoc(user: User, defaultRole: UserRole = "survivor") {
  const ref = doc(db, "users", user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      role: defaultRole,
      email: user.email || null,
      displayName: user.displayName || null,
      createdAt: serverTimestamp(),
    })
    return defaultRole
  }
  return (snap.data().role as UserRole) || "survivor"
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        try {
          const r = await ensureUserDoc(currentUser)
          setRole(r)
        } catch (e) {
          console.error("Failed to load role:", e)
          setRole("survivor")
        }
      } else {
        setRole(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const loginAnonymously = async () => {
    await signInAnonymously(auth)
  }

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const registerSurvivor = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await ensureUserDoc(cred.user, "survivor")
  }

  const loginWithGoogle = async (): Promise<UserRole> => {
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    return await ensureUserDoc(cred.user, "survivor")
  }

  const logout = async () => {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        loginAnonymously,
        loginWithEmail,
        loginWithGoogle,
        registerSurvivor,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
