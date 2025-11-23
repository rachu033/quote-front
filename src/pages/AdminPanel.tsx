import { useEffect, useState, useCallback } from "react";
import "../styles/pages/AdminPanel.css";

interface Author {
    name: string;
}

interface Quote {
    author: Author;
    id: number;
    text: string;
}

interface User {
    id: number;
    nickname: string;
}

interface QuoteOfDate {
    id: number;
    quoteDate: string;
    quote: Quote;
    setBy?: User;
}

const AdminPanel: React.FC = () => {
    const [qodList, setQodList] = useState<QuoteOfDate[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [newQuoteId, setNewQuoteId] = useState<number | "">("");
    const [newDate, setNewDate] = useState<string>("");

    const [searchText, setSearchText] = useState("");
    const [searchResults, setSearchResults] = useState<Quote[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

    const previewQuote = async (id: number) => {
        try {
            const res = await fetch(`http://localhost:8080/quoteapi/quotes/${id}`);
            if (!res.ok) throw new Error("Nie udało się pobrać cytatu");
            const data: Quote = await res.json();
            setSelectedQuote(data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadQod = useCallback(async () => {
        try {
            const res = await fetch("http://localhost:8080/quoteapi/admin/qod/all", {
                credentials: "include"
            });

            if (res.status === 403 || res.status === 401) {
                setError("Nie masz uprawnień do panelu administratora.");
                return;
            }

            if (!res.ok) {
                setError("Błąd podczas pobierania danych z serwera.");
                return;
            }

            const data: QuoteOfDate[] = await res.json();
            setQodList(data);
        } catch {
            setError("Błąd połączenia z serwerem.");
        }
    }, []);

    const searchQuotes = useCallback(async (query: string) => {
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);

        const res = await fetch(
            `http://localhost:8080/quoteapi/quotes?text=${encodeURIComponent(query)}&size=10`
        );
        const data = await res.json();

        setSearchResults(data.content ?? []);
        setIsSearching(false);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => searchQuotes(searchText), 400);
        return () => clearTimeout(t);
    }, [searchText, searchQuotes]);

    useEffect(() => {
        const fetchQod = async () => {
            await loadQod();
        };
        fetchQod();
    }, [loadQod]);

    const addQod = async () => {
        if (!newQuoteId || !newDate) {
            setError("Uzupełnij pola dodawania!");
            return;
        }

        const params = new URLSearchParams();
        params.append("quoteId", newQuoteId.toString());
        params.append("date", newDate);

        const res = await fetch("http://localhost:8080/quoteapi/admin/qod/add", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString()
        });

        if (res.status === 403) return setError("Brak uprawnień (add).");
        if (!res.ok) return setError("Nie udało się dodać cytatu dnia.");

        await loadQod();
        setNewQuoteId("");
        setNewDate("");
    };

    const deleteQod = async (id: number) => {
        const res = await fetch(`http://localhost:8080/quoteapi/admin/qod/delete/${id}`, {
            method: "DELETE",
            credentials: "include"
        });

        if (res.status === 403) return setError("Brak uprawnień (delete).");
        if (!res.ok) return setError("Nie udało się usunąć cytatu dnia.");

        await loadQod();
    };

    if (error) {
        return (
            <div className="error-page">
                <h2>Error: {error}</h2>
            </div>
        );
    }

    return (
        <div className="admin-panel-container">
            <div className="container-add-author">
                <div className="left-panel">
                    <h2 className="panel-header">Statystyki</h2>
                </div>

                <div className="center-form">
                    <h2 className="form-header">Cytaty Dnia</h2>

                    <div className="add-qod-form">
                        <h3>Dodaj Cytat Dnia</h3>

                        <div className="quote-search">
                            <input
                                type="text"
                                placeholder="Wyszukaj cytat..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />

                            {isSearching && <div className="loader">Szukam...</div>}

                            {searchResults.length > 0 && (
                                <ul className="search-dropdown">
                                    {searchResults.map(q => (
                                        <li
                                            key={q.id}
                                            onClick={() => {
                                                setNewQuoteId(q.id);
                                                setSearchText(q.text);
                                                setSearchResults([]);
                                            }}
                                        >
                                            {q.text.substring(0, 80)}...
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                        />

                        <button onClick={addQod}>Dodaj</button>
                    </div>

                    <table className="qod-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Quote ID</th>
                            <th>Data</th>
                            <th>Ustawiony przez</th>
                            <th>Akcje</th>
                        </tr>
                        </thead>
                        <tbody>
                        {qodList.map((qod) => (
                            <tr key={qod.id}>
                                <td>{qod.id}</td>
                                <td>{qod.quote.id}</td>
                                <td>{qod.quoteDate}</td>
                                <td>{qod.setBy?.nickname ?? "-"}</td>
                                <td>
                                    <button onClick={() => previewQuote(qod.quote.id)}>Podgląd</button>
                                    <button onClick={() => deleteQod(qod.id)} className="delete-btn">Usuń</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    {selectedQuote && (
                        <div className="quote-preview">
                            <h4>Treść cytatu:</h4>
                            <p>{selectedQuote.text}</p>
                            <h5>Autor: {selectedQuote.author?.name}</h5>
                        </div>
                    )}
                </div>

                <div className="right-panel">
                    <h2 className="panel-header">Informacje</h2>
                </div>
            </div>
        </div>
    );

};

export default AdminPanel;