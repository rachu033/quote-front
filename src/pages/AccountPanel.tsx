import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { auth } from "../FirebaseConfig.ts";
import "../styles/pages/AccountPanel.css";

const AccountPanel: React.FC = () => {
    const { user, setUser } = useContext(AuthContext);

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

            if (!res.ok) throw new Error("Nie udało się pobrać danych użytkownika");

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
                setError("Nick jest za krótki (minimum 3 znaki)");
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
                throw new Error(msg || "Nie udało się zmienić nicku");
            }

            setSuccess("Nick został zaktualizowany");
            setNickname(newNickname);
            setEditNickname(false);
            setUser(prev => prev ? { ...prev, nickname: newNickname } : null);
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
        }
    };

    const handleAccountDelete = async () => {
        if (!confirm("Czy na pewno chcesz usunąć swoje konto?")) return;

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/users/delete`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Nie udało się usunąć konta");
            }

            await auth.currentUser?.delete();
            setUser(null);
            window.location.href = "/";
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
        }
    };

    if (loading) return <p>Ładowanie danych...</p>;

    return (
        <div className="account-container">
            <div className="account-panel">

                <h1>Twoje konto</h1>

                <div className="account-item">
                    <strong>E-mail:</strong> {user?.email}
                </div>

                <div className="account-item">
                    <strong>Nick:</strong>

                    {!editNickname ? (
                        <>
                            <span>{nickname}</span>
                            <button onClick={() => { setEditNickname(true); setNewNickname(nickname); }}>
                                Edytuj
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
                                Zapisz
                            </button>
                            <button onClick={() => setEditNickname(false)}>
                                Anuluj
                            </button>
                        </>
                    )}
                </div>

                {user?.isModerator && (
                    <div className="account-item moderator">
                        <strong>Konto moderatora</strong>
                    </div>
                )}

                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}

                <hr />

                <button className="delete-btn" onClick={handleAccountDelete}>
                    Usuń konto
                </button>
            </div>
        </div>
    );

};

export default AccountPanel;