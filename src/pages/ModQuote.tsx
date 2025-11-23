import React, { useEffect, useState } from "react";
import FormQuote from "../components/FormQuote";
import "../styles/pages/AddQuote.css"
import "../styles/components/Toast.css";

interface Toast {
    message: string;
    type: "success" | "error";
}

export interface Author {
    id: number;
    name: string;
}

export interface DateInfo {
    type: "Date" | "Year" | "Century";
    value: string;
    precision: "Exact" | "Approx";
    era: "AD" | "BC";
}

export interface QuoteRecord {
    id?: number;
    text: string;
    authorId: number | null;
    author?: Author | null;
    quoteDateInfo: DateInfo;
    period?: string;
    source?: string;
}

interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
}

const ModQuote: React.FC = () => {
    const [toast, setToast] = useState<Toast | null>(null);
    const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedQuote, setSelectedQuote] = useState<QuoteRecord | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ------------------------------ FETCH QUOTES ------------------------------
    const fetchQuotes = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("approved", "0");
            params.append("page", "0");
            params.append("size", "20");

            const res = await fetch(`${import.meta.env.VITE_API_URL}/quotes?${params}`, {
                credentials: "include",
            });

            if (!res.ok) throw new Error("Błąd podczas pobierania cytatów");

            const data: PageResponse<QuoteRecord> = await res.json();
            setQuotes(data.content || []);
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError("Nieznany błąd");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotes();
    }, []);

    const handleSubmit = async (data: {
        text: string;
        authorId: number | null;
        quoteDateInfo: DateInfo;
        period: string;
        source: string;
    }) => {
        try {
            if (selectedQuote) {
                const updatedQuote: QuoteRecord = {
                    id: selectedQuote.id,
                    text: data.text,
                    period: data.period,
                    source: data.source,
                    quoteDateInfo: data.quoteDateInfo,
                    author: data.authorId !== null ? { id: data.authorId, name: selectedQuote.author?.name || "" } : null,
                    authorId: data.authorId,
                };

                const res = await fetch(`${import.meta.env.VITE_API_URL}/moderate/quote`, {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedQuote),
                });

                if (!res.ok) throw new Error("Błąd podczas moderacji cytatu");

                showToast("Cytat został zapisany po moderacji!", "success");
                setSelectedQuote(null);
                await fetchQuotes();
            } else {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/users/submitQuote`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text: data.text,
                        authorId: data.authorId,
                        quoteDateInfo: data.quoteDateInfo,
                        period: data.period,
                        source: data.source,
                    }),
                });

                if (!res.ok) throw new Error("Błąd podczas zapisu cytatu");

                showToast("Cytat został zapisany!", "success");
            }
        } catch (err) {
            console.error(err);
            showToast("Wystąpił błąd podczas zapisu", "error");
        }
    };

    // ------------------------------ DELETE QUOTE ------------------------------
    const handleReject = async () => {
        if (!selectedQuote) {
            showToast("Wybierz cytat, który chcesz odrzucić", "error");
            return;
        };

        if (!confirm("Czy na pewno usunąć wybrany cytat?")) return;

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/moderate/delete/quote/${selectedQuote.id}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!res.ok) throw new Error("Nie udało się usunąć cytatu");

            showToast("Cytat został usunięty!", "success");
            setSelectedQuote(null);
            await fetchQuotes();
        } catch (err) {
            console.error(err);
            showToast("Błąd podczas usuwania autora", "error");
        }
    };

    return (
        <>
            <div className="container-add-quote">

                <div className="container-form">
                    <h2 className="form-header">Moderacja cytatów</h2>
                    <FormQuote
                        initialData={selectedQuote}
                        onSubmit={handleSubmit}
                        onReject={handleReject}
                    />
                </div>

                <div className="describe-form">
                    <h3>Oczekujące cytaty</h3>
                    {loading && <p>Ładowanie...</p>}
                    {error && <p className="error">{error}</p>}
                    {quotes.length === 0 && !loading && (<p>Brak oczekujących cytatów</p>)}
                    <ul className="simple-quotes-list">
                        {quotes.map((q) => (
                            <li
                                key={q.id}
                                className="simple-quote-item"
                                onClick={() => setSelectedQuote(q)}
                                style={{
                                    cursor: "pointer",
                                    background: selectedQuote?.id === q.id ? "rgba(255,255,255,0.2)" : ""
                            }} >
                                <strong>{q.text.slice(0, 36)}...</strong>
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

export default ModQuote;