import { createContext } from "react";

export interface User {
    email: string;
    nickname: string;
    isModerator?: boolean;
}

interface AuthContextProps {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextProps>({
    user: null,
    setUser: () => {},
    loading: true,
});
