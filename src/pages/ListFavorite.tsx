import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "../styles/pages/ListQuote.css";
import { useTranslation } from 'react-i18next';
import StarFilled from "../assets/starfilled.svg";
import StarEmpty from "../assets/starempty.svg";

interface QuoteDTO {
    id: number;
    text: string;
    author: AuthorDTO;
    quoteDateInfo: DateInfo;
    period?: string;
    source?: string;
    favorite?: boolean;
}

interface AuthorDTO {
    id: number;
    name: string;
}

interface DateInfo {
    era : string;
    precision : string;
    type: string;
    value: string;
}

const ListFavorite: React.FC = () => {
    const { i18n } = useTranslation();
    const { user } = useContext(AuthContext);

    const [quotes, setQuotes] = useState<QuoteDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);

    const [searchText, setSearchText] = useState("");
    const [searchAuthor, setSearchAuthor] = useState("");
    const [searchSource, setSearchSource] = useState("");

    const [sortBy, setSortBy] = useState<string>("savedAt");
    const [sortAsc, setSortAsc] = useState<boolean>(false);

    const fetchFavoriteQuotes = async (
        pageNum?: number,
        pageSize?: number,
        text?: string,
        author?: string,
        source?: string,
        sortField?: string,
        asc?: boolean
    ) => {
        if (!user) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", String(pageNum ?? page));
            params.append("size", String(pageSize ?? size));
            if (text) params.append("text", text);
            if (author) params.append("author", author);
            if (source) params.append("source", source);
            if (sortField) params.append("sortBy", sortField);
            if (asc !== undefined) params.append("asc", String(asc));

            const res = await fetch(`${import.meta.env.VITE_API_URL}/users/favorites?${params.toString()}`, {
                credentials: "include"
            });

            if (!res.ok) throw new Error("Błąd podczas pobierania ulubionych cytatów");

            const data = await res.json();
            const mappedQuotes = (data.content || []).map((q: QuoteDTO) => ({
                ...q,
                favorite: true
            }));

            setQuotes(mappedQuotes);
            setTotalPages(data.totalPages || 1);
        } catch (err: unknown) {
            if (err instanceof Error) setError(err.message);
            else setError("Nieznany błąd");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavoriteQuotes(page, size, searchText, searchAuthor, searchSource, sortBy, sortAsc);
    }, [page, size, searchText, searchAuthor, searchSource, sortBy, sortAsc, user]);

    const toggleFavorite = async (quoteId: number) => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/users/favorites/${quoteId}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            setQuotes(prev => prev.filter(q => q.id !== quoteId));
        } catch (err) {
            console.error("Błąd przy usuwaniu ulubionych:", err);
        }
    };

    const handleSort = (field: string) => {
        if (sortBy === field) setSortAsc(!sortAsc);
        else {
            setSortBy(field);
            setSortAsc(true);
        }
        setPage(0);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSize(Number(e.target.value));
        setPage(0);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchFavoriteQuotes(0, size, searchText, searchAuthor, searchSource, sortBy, sortAsc);
    };

    const formatDate = (dateInfo: DateInfo | undefined, lang: string): string => {
        if (!dateInfo) return "";
        if (dateInfo.value === "Unknown") return "-";
        const { precision, type, value, era } = dateInfo;
        const approx = precision === "Approx" ? (lang === "pl" ? "około" : "c.") : "";
        let eraStr = "";
        if (era === "BC") eraStr = lang === "pl" ? "p. n. e." : "BC";
        else if (era === "AD") eraStr = lang === "en" ? "AD" : "";
        switch (type) {
            case "Date": {
                const [day, month, year] = value.split(".");
                if (era === "AD") return `${day}.${month}.${year}`;
                return `${approx} ${day}.${month}.${year} ${eraStr}`.trim();
            }
            case "Year":
                return `${approx} ${value} ${eraStr}`.trim();
            case "Century":
                return `${approx} ${value} ${lang === "pl" ? "w." : ""} ${eraStr}`.trim();
            default:
                return value;
        }
    };

    return (
        <div className="container-quote-list">
            <div className="quote-list-container">
                <form className="quote-search-panel" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Szukaj po tekście"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Szukaj po autorze"
                        value={searchAuthor}
                        onChange={(e) => setSearchAuthor(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Szukaj po źródle"
                        value={searchSource}
                        onChange={(e) => setSearchSource(e.target.value)}
                    />
                    <button type="submit">Szukaj</button>
                </form>

                {loading && <p>Ładowanie ulubionych cytatów...</p>}
                {error && <p className="quote-error-text">{error}</p>}
                {!loading && !error && quotes.length === 0 && <p className="no-results">Brak wyników.</p>}

                {!loading && !error && quotes.length > 0 && (
                    <>
                        <table className="quote-table">
                            <thead>
                            <tr>
                                <th onClick={() => handleSort("author.name")}>Autor {sortBy === "author.name" ? (sortAsc ? " ▲" : " ▼") : null}</th>
                                <th onClick={() => handleSort("text")}>Cytat {sortBy === "text" ? (sortAsc ? " ▲" : " ▼") : null}</th>
                                <th>Data</th>
                                <th onClick={() => handleSort("source")}>Źródło {sortBy === "source" ? (sortAsc ? " ▲" : " ▼") : null}</th>
                                <th>Zapisane</th>
                            </tr>
                            </thead>
                            <tbody>
                            {quotes.map(q => (
                                <tr key={q.id}>
                                    <td>{q.author.name || "-"}</td>
                                    <td>{q.text}</td>
                                    <td>{formatDate(q.quoteDateInfo, i18n.language)}</td>
                                    <td>{q.source || "-"}</td>
                                    <td className="favorite-column" style={{ cursor: 'pointer' }} onClick={() => toggleFavorite(q.id)}>
                                        <img src={q.favorite ? StarFilled : StarEmpty} className="favorite-icon" />
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        <div className="pagination-panel">
                            <span>Strona {page + 1} z {totalPages}</span>
                            <button disabled={page === 0} onClick={() => handlePageChange(page - 1)}>◀</button>
                            <button disabled={page + 1 >= totalPages} onClick={() => handlePageChange(page + 1)}>▶</button>
                            <select value={size} onChange={handleSizeChange}>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ListFavorite;
