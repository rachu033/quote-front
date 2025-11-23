import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pages/Authentication.css";
import GoogleIcon from "../assets/google.svg";
import { AuthContext } from "../context/AuthContext";
import {
    auth,
    googleProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
} from "../FirebaseConfig.ts";
import { sendPasswordResetEmail } from "firebase/auth";

interface AuthProps {
    initialMode?: "signin" | "signup";
}

const Authentication: React.FC<AuthProps> = ({ initialMode = "signin" }) => {
    const [activePanel, setActivePanel] = useState<"signin" | "signup">(initialMode);
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState("");

    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);

    const fetchUser = async () => {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
            method: "GET",
            credentials: "include",
        });
        if (res.ok) {
            const data = await res.json();
            setUser({
                email: data.email,
                nickname: data.nickname,
                isModerator: data.moderator
            });
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const idToken = await result.user.getIdToken();

            const res = await fetch(`${import.meta.env.VITE_API_URL}/authentication/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
                credentials: "include",
            });

            if (res.ok) {
                await fetchUser();
                navigate("/home");
            } else {
                const data = await res.text();
                setError(data);
            }
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError("Nieoczekiwany błąd");
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (!userCredential.user.emailVerified) {
                alert("Zweryfikuj email");
                return;
            }

            const idToken = await userCredential.user.getIdToken();
            const res = await fetch(`${import.meta.env.VITE_API_URL}/authentication/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
                credentials: "include",
            });

            if (res.ok) {
                await fetchUser();
                navigate("/home");
            } else {
                const data = await res.text();
                setError(data);
            }
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError("Niespodziewany błąd");
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);

            const idToken = await userCredential.user.getIdToken();
            await fetch(`${import.meta.env.VITE_API_URL}/authentication/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    idToken,
                    name,
                }),
                credentials: "include",
            });

            alert("Zweryfikuj email!");
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError("Nieoczkiwany błąd");
        }
    };

    const handlePasswordReset = async () => {
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setShowResetModal(false);
            setResetEmail("");
            setToastMessage("Link resetujący wysłany");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (err: unknown) {
            setShowResetModal(false);
            setResetEmail("");
            if (err instanceof Error) setToastMessage(err.message);
            else setToastMessage("Nieoczekiwany błąd");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    return (
        <div className="container-authentication">
            <div className={`container ${activePanel === "signup" ? "right-panel-active" : ""}`} id="container">
                {/* REGISTER PANEL */}
                <div className="form-container sign-up-container">
                    <form onSubmit={handleRegister}>
                        <h1>{"Załóż konto"}</h1>
                        <input type="text" placeholder={"Nick"} value={name} onChange={e => setName(e.target.value)} required />
                        <input type="email" placeholder={"Email"} value={email} onChange={e => setEmail(e.target.value)} required />
                        <input type="password" placeholder={"Hasło"} value={password} onChange={e => setPassword(e.target.value)} required />
                        <button type="submit">{"Zarejestruj"}</button>
                        {error && <p className="error">{error}</p>}
                    </form>
                </div>

                {/* LOGIN PANEL */}
                <div className="form-container sign-in-container">
                    <form onSubmit={handleLogin}>
                        <h1>{"Zaloguj"}</h1>
                        <div className="social-container">
                            <img src={GoogleIcon} alt="Google" className="google-icon" onClick={handleGoogleLogin} />
                        </div>
                        <span>{"Lub stwórz konto"}</span>
                        <input type="email" placeholder={"Email"} value={email} onChange={e => setEmail(e.target.value)} required />
                        <input type="password" placeholder={"Hasło"} value={password} onChange={e => setPassword(e.target.value)} required />
                        <a href="#" onClick={e => { e.preventDefault(); setShowResetModal(true); }}>{"Zapomniałem mojego hasła"}</a>
                        <button type="submit">{"Zaloguj"}</button>
                        {error && <p className="error">{error}</p>}
                    </form>
                </div>

                {/* OVERLAY PANELS */}
                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h1>{"Witaj ponownie"}</h1>
                            <p>{"Dobrze Cię widzieć"}</p>
                            <button className="ghost" onClick={() => setActivePanel("signin")}>{"Zaloguj się"}</button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <h1>{"Witaj"}</h1>
                            <p>{"Nie masz konta?"}</p>
                            <button className="ghost" onClick={() => setActivePanel("signup")}>{"Zarejestruj"}</button>
                        </div>
                    </div>
                </div>

                {/* PASSWORD RESET MODAL */}
                {showResetModal && (
                    <div className="modal-backdrop">
                        <div className="modal">
                            <h2>{"Resetowanie hasła"}</h2>
                            <input type="email" placeholder={"Wprowadź maila"} value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                            <div className="modal-buttons">
                                <button onClick={handlePasswordReset}>{"Wyślij link"}</button>
                                <button onClick={() => setShowResetModal(false)}>{"Anuluj"}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TOAST NOTIFICATION */}
                {showToast && <div className="toast">{toastMessage}</div>}
            </div>
        </div>
    );
};

export default Authentication;
