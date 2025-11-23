import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pages/Authentication.css";
import { useTranslation } from "react-i18next";
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
    const { t } = useTranslation();
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
            else setError(t("unexpectedError"));
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (!userCredential.user.emailVerified) {
                alert(t("verifyEmailBeforeLogin"));
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
            else setError(t("unexpectedError"));
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

            alert(t("checkEmailVerification"));
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError(t("unexpectedError"));
        }
    };

    const handlePasswordReset = async () => {
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            setShowResetModal(false);
            setResetEmail("");
            setToastMessage(t("resetLinkSent"));
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (err: unknown) {
            setShowResetModal(false);
            setResetEmail("");
            if (err instanceof Error) setToastMessage(err.message);
            else setToastMessage(t("unexpectedError"));
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
                        <h1>{t("createAccount")}</h1>
                        <input type="text" placeholder={t("name")} value={name} onChange={e => setName(e.target.value)} required />
                        <input type="email" placeholder={t("email")} value={email} onChange={e => setEmail(e.target.value)} required />
                        <input type="password" placeholder={t("password")} value={password} onChange={e => setPassword(e.target.value)} required />
                        <button type="submit">{t("register")}</button>
                        {error && <p className="error">{error}</p>}
                    </form>
                </div>

                {/* LOGIN PANEL */}
                <div className="form-container sign-in-container">
                    <form onSubmit={handleLogin}>
                        <h1>{t("login")}</h1>
                        <div className="social-container">
                            <img src={GoogleIcon} alt="Google" className="google-icon" onClick={handleGoogleLogin} />
                        </div>
                        <span>{t("orUseAccount")}</span>
                        <input type="email" placeholder={t("email")} value={email} onChange={e => setEmail(e.target.value)} required />
                        <input type="password" placeholder={t("password")} value={password} onChange={e => setPassword(e.target.value)} required />
                        <a href="#" onClick={e => { e.preventDefault(); setShowResetModal(true); }}>{t("forgotPassword")}</a>
                        <button type="submit">{t("login")}</button>
                        {error && <p className="error">{error}</p>}
                    </form>
                </div>

                {/* OVERLAY PANELS */}
                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h1>{t("welcomeBack")}</h1>
                            <p>{t("welcomeText")}</p>
                            <button className="ghost" onClick={() => setActivePanel("signin")}>{t("login")}</button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <h1>{t("helloFriend")}</h1>
                            <p>{t("registerText")}</p>
                            <button className="ghost" onClick={() => setActivePanel("signup")}>{t("register")}</button>
                        </div>
                    </div>
                </div>

                {/* PASSWORD RESET MODAL */}
                {showResetModal && (
                    <div className="modal-backdrop">
                        <div className="modal">
                            <h2>{t("resetPassword")}</h2>
                            <input type="email" placeholder={t("enterEmail")} value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                            <div className="modal-buttons">
                                <button onClick={handlePasswordReset}>{t("sendResetLink")}</button>
                                <button onClick={() => setShowResetModal(false)}>{t("cancel")}</button>
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
