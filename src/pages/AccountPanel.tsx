import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { auth } from "../FirebaseConfig.ts";
import "../styles/pages/AccountPanel.css";
import { useTranslation } from "react-i18next";

const AccountPanel: React.FC = () => {
    const { user, setUser } = useContext(AuthContext);
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [nickname, setNickname] = useState("");
    const [editNickname, setEditNickname] = useState(false);
    const [newNickname, setNewNickname] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchUser = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/users/me`, {
                method: "GET",
                credentials: "include",
            });

            if (!res.ok) throw new Error("Failed to load user");

            const data = await res.json();
            setUser({
                email: data.email,
                nickname: data.nickname,
                isModerator: data.moderator,
            });
            setNickname(data.nickname);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const handleNicknameSave = async () => {
        try {
            setError(null);
            setSuccess(null);

            if (newNickname.trim().length < 3) {
                setError(t("nicknameTooShort"));
                return;
            }

            const res = await fetch(`${import.meta.env.VITE_API_URL}/users/update-nickname`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ nickname: newNickname }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to update nickname");
            }

            setSuccess(t("nicknameUpdated"));
            setNickname(newNickname);
            setEditNickname(false);
            setUser(prev => prev ? { ...prev, nickname: newNickname } : null);
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
        }
    };

    const handleAccountDelete = async () => {
        if (!confirm(t("confirmAccountDelete"))) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/users/delete`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to delete account");
            }

            await auth.currentUser?.delete();
            setUser(null);
            window.location.href = "/";
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
        }
    };

    if (loading) return <p>{t("loading")}...</p>;

    return (
        <div className="account-container">
            <div className="account-panel">

                <h1>{t("yourAccount")}</h1>

                <div className="account-item">
                    <strong>{t("email")}:</strong> {user?.email}
                </div>

                <div className="account-item">
                    <strong>{t("nickname")}:</strong>

                    {!editNickname ? (
                        <>
                            <span>{nickname}</span>
                            <button onClick={() => { setEditNickname(true); setNewNickname(nickname); }}>
                                {t("edit")}
                            </button>
                        </>
                    ) : (
                        <>
                            <input
                                type="text"
                                value={newNickname}
                                onChange={e => setNewNickname(e.target.value)}
                            />
                            <button onClick={handleNicknameSave}>
                                {t("save")}
                            </button>
                            <button onClick={() => setEditNickname(false)}>
                                {t("cancel")}
                            </button>
                        </>
                    )}
                </div>

                {user?.isModerator && (
                    <div className="account-item moderator">
                        <strong>{t("moderatorAccount")}</strong>
                    </div>
                )}

                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}

                <hr />

                <button className="delete-btn" onClick={handleAccountDelete}>
                    {t("deleteAccount")}
                </button>
            </div>
        </div>
    );
};

export default AccountPanel;
