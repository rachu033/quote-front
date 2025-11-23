import React, { useEffect, useState, type ReactNode } from "react";
import { AuthContext, type User } from "./AuthContext";

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
            method: "GET",
            credentials: "include",
        })
            .then(async res => {
                if (res.ok) {
                    const data = await res.json();
                    setUser({
                        email: data.email,
                        nickname: data.nickname,
                        isModerator: data.moderator
                    });
                } else {
                    setUser(null);
                }
            })
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};