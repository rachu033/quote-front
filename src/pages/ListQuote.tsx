import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "../styles/pages/ListQuote.css";
import { useTranslation } from 'react-i18next';
import StarFilled from "../assets/starfilled.svg"
import StarEmpty from "../assets/starempty.svg"
import { useLocation } from "react-router-dom";

interface QuoteDTO {
    id: number;
    text: string;
    author: AuthorDTO;
    quoteDateInfo: DateInfo;
    period?: string;
    source?: string;
    favorite?: boolean; // nowe pole
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

const ListQuote: React.FC = () => {
    const location = useLocation();

    const [sortBy, setSortBy] = useState<string>("author.name"); // domyślnie
    const [sortAsc, setSortAsc] = useState<boolean>(true);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const authorParam = params.get("author");
        setPage(0);
        if (authorParam) {
            setSearchAuthor(authorParam);
            fetchQuotes(undefined, authorParam, searchPeriod, searchSource, showUnapproved, 0, size, sortBy, sortAsc);
        } else {
            fetchQuotes(undefined, undefined, searchPeriod, searchSource, showUnapproved, 0, size, sortBy, sortAsc);
        }
    }, [location.search, sortBy, sortAsc]);

    const { i18n } = useTranslation();
    const { user } = useContext(AuthContext);

    const [quotes, setQuotes] = useState<QuoteDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchText, setSearchText] = useState("");
    const [searchAuthor, setSearchAuthor] = useState("");
    const [searchSource, setSearchSource] = useState("");

    const [searchPeriod] = useState("");
    const [showUnapproved] = useState(false);

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);

    const fetchQuotes = async (
        text?: string,
        author?: string,
        period?: string,
        source?: string,
        approved: number = 1,
        pageNum?: number,
        pageSize?: number,
        sortField?: string,
        asc?: boolean
    ) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();

            if (text) params.append("text", text);
            if (author) params.append("author", author);
            if (period) params.append("period", period);
            if (source) params.append("source", source);

            params.append("approved", approved ? "0" : "2");
            params.append("page", String(pageNum ?? page));
            params.append("size", String(pageSize ?? size));

            if (sortField) params.append("sortBy", sortField);
            if (asc !== undefined) params.append("asc", String(asc));

            const res = await fetch(`${import.meta.env.VITE_API_URL}/quotes?${params.toString()}`);
            if (!res.ok) throw new Error("Błąd podczas pobierania cytatów");
            const data = await res.json();

            let favoriteIds: number[] = [];
            if (user) {
                const favRes = await fetch(`${import.meta.env.VITE_API_URL}/users/favorites/ids`, {
                    credentials: 'include'
                });
                if (!favRes.ok) throw new Error("Błąd podczas pobierania ulubionych");
                favoriteIds = await favRes.json();
            }

            const mappedQuotes = (data.content || []).map((q: QuoteDTO) => ({
                ...q,
                favorite: user ? favoriteIds.includes(q.id) : undefined
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

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortAsc(!sortAsc); // zmiana kierunku
        } else {
            setSortBy(field);
            setSortAsc(true); // nowa kolumna zawsze rosnąco
        }

        setPage(0);
        fetchQuotes(searchText, searchAuthor, searchPeriod, searchSource, showUnapproved, 0, size, field, sortBy === field ? !sortAsc : true);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchQuotes(searchText, searchAuthor, searchPeriod, searchSource, showUnapproved, 0, size);
    };

    const toggleFavorite = async (quoteId: number, isFavorite: boolean) => {
        try {
            if (isFavorite) {
                await fetch(`${import.meta.env.VITE_API_URL}/users/favorites/${quoteId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });
            } else {
                await fetch(`${import.meta.env.VITE_API_URL}/users/favorites/${quoteId}`, {
                    method: 'POST',
                    credentials: 'include',
                });
            }
            setQuotes(prev =>
                prev.map(q => q.id === quoteId ? { ...q, favorite: !isFavorite } : q)
            );
        } catch (err) {
            console.error("Błąd przy zmianie ulubionych:", err);
        }
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchQuotes(searchText, searchAuthor, searchPeriod, searchSource, showUnapproved, newPage, size);
    };

    const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSize = Number(e.target.value);
        setSize(newSize);
        setPage(0);
        fetchQuotes(searchText, searchAuthor, searchPeriod, searchSource, showUnapproved, 0, newSize);
    };

    const formatDate = (dateInfo: DateInfo | undefined, lang: string): string => {
        if (!dateInfo) return "";
        if (dateInfo.value == "Unknown") return "-";
        const { precision, type, value, era } = dateInfo;

        const approx = precision === "Approx" ? (lang === "pl" ? "około" : "c.") : "";
        let eraStr = "";
        if (era === "BC") eraStr = lang === "pl" ? "p. n. e." : "BC";
        else if (era === "AD") eraStr = lang === "en" ? "AD" : "";

        switch (type) {
            case "Date":
            { const [day, month, year] = value.split(".");
                if (era === "AD") return `${day}.${month}.${year}`;
                return `${approx} ${day}.${month}.${year} ${eraStr}`.trim(); }
            case "Year":
                return `${approx} ${value} ${eraStr}`.trim();
            case "Century":
                return `${approx} ${value} ${lang === "pl" ? "w." : ""} ${eraStr}`.trim();
            default:
                return value;
        }
    };

    return (
        <>
            <div className = "container-quote-list">
                <div className="quote-list-container">
                    <div className="quote-search-panel-wrapper">
                        <form onSubmit={handleSearch} className="quote-search-panel">
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
                    </div>
                    {loading && <p>Ładowanie cytatów...</p>}
                    {error && <p className="quote-error-text">{error}</p>}

                    {!loading && !error && quotes.length === 0 && (
                        <p className="no-results">Brak wyników.</p>
                    )}

                    {!loading && !error && quotes.length > 0 && (
                        <>
                            <table className="quote-table">
                                <thead>
                                <tr>
                                    <th onClick={() => handleSort("author.name")}>
                                        Autor {sortBy === "author.name" ? (sortAsc ? " ▲" : " ▼") : null}
                                    </th>
                                    <th onClick={() => handleSort("text")}>
                                        Cytat {sortBy === "text" ? (sortAsc ? " ▲" : " ▼") : null}
                                    </th>
                                    <th>Data</th>
                                    <th onClick={() => handleSort("period")}>
                                        Okres {sortBy === "period" ? (sortAsc ? " ▲" : " ▼") : null}
                                    </th>
                                    <th onClick={() => handleSort("source")}>
                                        Źródło {sortBy === "source" ? (sortAsc ? " ▲" : " ▼") : null}
                                    </th>
                                    {user && <th>Zapisane</th>}
                                </tr>
                                </thead>
                                <tbody>
                                {quotes.map((q) => (
                                    <tr key={q.id}>
                                        <td>{q.author.name || "-"}</td>
                                        <td>{q.text}</td>
                                        <td className="date-column">{formatDate(q.quoteDateInfo, i18n.language)}</td>
                                        <td>{q.period || "-"}</td>
                                        <td>{q.source || "-"}</td>
                                        {user && (
                                            <td className="favorite-column" style={{ cursor: 'pointer' }} onClick={() => toggleFavorite(q.id, !!q.favorite)}>
                                                <img src={q.favorite ? StarFilled : StarEmpty} className="favorite-icon" />
                                            </td>
                                        )}
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
        </>
    );
};

export default ListQuote;
