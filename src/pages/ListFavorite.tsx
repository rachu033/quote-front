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
    source?: string;
    favorite?: boolean;
}

interface AuthorDTO {
    id: number;
    name: string;
}

interface DateInfo {
    era: string;
    precision: string;
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

    const [sortBy, setSortBy] = useState<string>("author.name");
    const [sortAsc, setSortAsc] = useState<boolean>(true);

    const fetchFavoriteQuotes = async (
        pageNum = page,
        pageSize = size,
        text = searchText,
        author = searchAuthor,
        source = searchSource,
        sortField = sortBy,
        asc = sortAsc
    ) => {
        if (!user) return;

        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (text) params.append("text", text);
            if (author) params.append("author", author);
            if (source) params.append("source", source);

            params.append("page", String(pageNum));
            params.append("size", String(pageSize));

            params.append("sortBy", sortField);
            params.append("asc", String(asc));

            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/users/favorites?${params.toString()}`,
                { credentials: "include" }
            );

            if (!res.ok) throw new Error("Błąd podczas pobierania ulubionych cytatów");

            const data = await res.json();

            setQuotes((data.content || []).map((q: QuoteDTO) => ({
                ...q,
                favorite: true
            })));

            setTotalPages(data.totalPages || 1);
            setError(null);

        } catch (err) {
            setError(err instanceof Error ? err.message : "Nieznany błąd");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavoriteQuotes();
    }, []);

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
        const newAsc = sortBy === field ? !sortAsc : true;
        setSortBy(field);
        setSortAsc(newAsc);
        setPage(0);

        fetchFavoriteQuotes(0, size, searchText, searchAuthor, searchSource, field, newAsc);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchFavoriteQuotes(newPage);
    };

    const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSize = Number(e.target.value);
        setSize(newSize);
        setPage(0);
        fetchFavoriteQuotes(0, newSize);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(0);
        fetchFavoriteQuotes(0);
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
                <div className="quote-search-panel-wrapper">
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
                </div>
                {loading && <p>Ładowanie ulubionych cytatów...</p>}
                {error && <p className="quote-error-text">{error}</p>}
                {!loading && !error && quotes.length === 0 && <p className="no-results">Brak wyników.</p>}

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
                                <th onClick={() => handleSort("quote_date_value")}>
                                    Data {sortBy === "quote_date_value" ? (sortAsc ? " ▲" : " ▼") : null}
                                </th>
                                <th onClick={() => handleSort("source")}>
                                    Źródło {sortBy === "source" ? (sortAsc ? " ▲" : " ▼") : null}
                                </th>
                                <th></th>
                            </tr>
                            </thead>

                            <tbody>
                            {quotes.map(q => (
                                <tr key={q.id}>
                                    <td>{q.author.name || "-"}</td>
                                    <td>{q.text}</td>
                                    <td>{formatDate(q.quoteDateInfo, i18n.language)}</td>
                                    <td>{q.source || "-"}</td>
                                    <td
                                        className="favorite-column"
                                        style={{ cursor: "pointer" }}
                                        onClick={() => toggleFavorite(q.id)}
                                    >
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
