import React, { useEffect, useState } from "react";
import FormAuthor from "../components/FormAuthor";
import "../styles/pages/AddAuthor.css";
import "../styles/components/Toast.css";

interface Toast {
    message: string;
    type: "success" | "error";
}

interface DateInfo {
    type: "Date" | "Year" | "Century";
    value: string;
    precision: "Exact" | "Approx";
    era: "AD" | "BC";
}

interface AuthorRecord {
    id: number;
    name: string;
    birthDateInfo: DateInfo;
    deathDateInfo: DateInfo;
    nationalityPrimary?: string;
    nationalitySecondary?: string;
}

const ModAuthor: React.FC = () => {
    const [toast, setToast] = useState<Toast | null>(null);
    const [authors, setAuthors] = useState<AuthorRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedAuthor, setSelectedAuthor] = useState<AuthorRecord | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchAuthors = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("approved", "0");
            params.append("page", "0");
            params.append("size", "20");

            const res = await fetch(`${import.meta.env.VITE_API_URL}/authors?${params}`, {
                credentials: "include",
            });

            if (!res.ok) throw new Error("Błąd podczas pobierania autorów");

            const data = await res.json();
            setAuthors(data.content || []);
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message || "Nieznany błąd");
            else setError("Nieznany błąd");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuthors();
    }, []);

    const handleModerationSubmit = async (data: {
        name: string;
        birthDateInfo: DateInfo;
        deathDateInfo: DateInfo;
        nationalityPrimary: string;
        nationalitySecondary: string;
    }) => {
        if (!selectedAuthor) {
            showToast("Wybierz autora z listy po prawej", "error");
            return;
        }

        const updatedAuthor = {
            id: selectedAuthor.id,
            ...data
        };

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/moderate/author`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedAuthor),
            });

            if (!res.ok) throw new Error("Błąd podczas moderacji autora");

            showToast("Autor został zapisany po moderacji!", "success");
            setSelectedAuthor(null);
            await fetchAuthors();
        } catch (err) {
            console.error(err);
            showToast("Błąd podczas zapisu", "error");
        }
    };

    const handleReject = async () => {
        if (!selectedAuthor) {
            showToast("Wybierz autora, którego chcesz odrzucić", "error");
            return;
        }

        if (!confirm(`Czy na pewno chcesz usunąć autora: ${selectedAuthor.name}?`)) {
            return;
        }

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/moderate/delete/author/${selectedAuthor.id}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!res.ok) throw new Error("Błąd podczas usuwania autora");

            showToast("Autor został usunięty!", "success");
            setSelectedAuthor(null);
            fetchAuthors();
        } catch (err) {
            console.error(err);
            showToast("Błąd podczas usuwania autora", "error");
        }
    };

    return (
        <>
            <div className="container-add-author">
                {/* LEWY PANEL */}
                <div className="left-panel">
                    <h3>Moderacja autorów</h3>
                    <p>Wybierz autora po prawej, popraw dane i zapisz zmiany.</p>
                </div>

                {/* FORMULARZ */}
                <div className="center-form">
                    <h2 className="form-header">Moderacja autorów</h2>
                    <FormAuthor
                        key={selectedAuthor?.id || "empty"}
                        onSubmit={handleModerationSubmit}
                        initialData={
                            selectedAuthor
                                ? {
                                    ...selectedAuthor,
                                    nationalityPrimary: selectedAuthor.nationalityPrimary || "",
                                    nationalitySecondary: selectedAuthor.nationalitySecondary || "",
                                }
                                : null
                        }
                        onReject={handleReject}
                    />
                </div>

                {/* PRAWA LISTA */}
                <div className="right-panel">
                    <h3>Oczekujący autorzy</h3>
                    {loading && <p>Ładowanie...</p>}
                    {error && <p style={{ color: "red" }}>{error}</p>}
                    {authors.length === 0 && <p>Brak autorów do moderacji.</p>}

                    <ul className="simple-author-list">
                        {authors.map(a => (
                            <li
                                key={a.id}
                                className="simple-author-item"
                                onClick={() => setSelectedAuthor(a)}
                                style={{
                                    cursor: "pointer",
                                    background: selectedAuthor?.id === a.id ? "rgba(255,255,255,0.2)" : ""
                                }}
                            >
                                <strong>{a.name}</strong>
                                <div style={{ display: "flex", gap: "5px", marginTop: "4px" }}>
                                    {a.nationalityPrimary && (
                                        <img src={`https://flagcdn.com/w20/${a.nationalityPrimary}.png`} />
                                    )}
                                    {a.nationalitySecondary && a.nationalitySecondary !== "None" && (
                                        <img
                                            src={`https://flagcdn.com/w40/${a.nationalitySecondary}.png`}
                                            alt={a.nationalitySecondary}
                                            className="flag-mini"
                                        />
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            {toast && (
                <div className={`toast ${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </>
    );
};

export default ModAuthor;