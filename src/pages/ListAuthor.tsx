import React, { useEffect, useRef, useState } from "react";
import "../styles/pages/ListAuthor.css";
import SearchIcon from "../assets/search.svg";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

interface AuthorDTO {
    id: number;
    name: string;
    nationalityPrimary: string;
    nationalitySecondary?: string;
    birthDateInfo: DateInfo;
    deathDateInfo: DateInfo;
}

interface DateInfo {
    era : string;
    precision : string;
    type: string;
    value: string;
}

interface Country {
    code: string;
    name: string;
}

const ListAuthor: React.FC = () => {
    const navigate = useNavigate();
    const { i18n } = useTranslation();

    const [sortBy, setSortBy] = useState<string>("name");
    const [sortAsc, setSortAsc] = useState<boolean>(true);

    const [authors, setAuthors] = useState<AuthorDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]);
    const [allCountries, setAllCountries] = useState<Country[]>([]);
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const searchRef = useRef<HTMLDivElement>(null);

    const [searchName, setSearchName] = useState("");

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);

    const basicCountries: Country[] = [
        { code: "pl", name: "Polska" },
        { code: "gb", name: "Wielka Brytania" },
        { code: "us", name: "Stany Zjednoczone" },
        { code: "fr", name: "Francja" },
        { code: "de", name: "Niemcy" },
        { code: "it", name: "Włochy" },
        { code: "es", name: "Hiszpania" },
        { code: "cn", name: "Chiny" },
        { code: "jp", name: "Japonia" }
    ];

    const fetchAuthors = async (
        name?: string,
        nationality?: string,
        approved: number = 1,
        pageNum?: number,
        pageSize?: number,
        sortField?: string,
        asc?: boolean
    ) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();

            if (name) params.append("name", name);
            if (nationality) params.append("nationality", nationality);

            params.append("approved", String(approved));
            params.append("page", String(pageNum ?? page));
            params.append("size", String(pageSize ?? size));

            if (sortField) params.append("sortBy", sortField);
            if (asc !== undefined) params.append("asc", String(asc));

            const res = await fetch(`${import.meta.env.VITE_API_URL}/authors?${params}`);
            if (!res.ok) throw new Error("Błąd podczas pobierania autorów");

            const data = await res.json();
            setAuthors(data.content || []);
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
            setSortAsc(!sortAsc);
        } else {
            setSortBy(field);
            setSortAsc(true);
        }
        setPage(0);
        fetchAuthors(searchName, selectedNationalities.join(",") || undefined, 1, 0, size, field, sortBy === field ? !sortAsc : true);
    };

    useEffect(() => {
        setPage(0);
        fetchAuthors(undefined, undefined, 1, 0, size, sortBy, sortAsc);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const nationalityParam = selectedNationalities.join(",");
        setPage(0);
        fetchAuthors(searchName, nationalityParam || undefined, 1, 0, size, sortBy, sortAsc);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        fetchAuthors(searchName, selectedNationalities.join(",") || undefined, 1, newPage, size, sortBy, sortAsc);
    };

    const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSize = Number(e.target.value);
        setSize(newSize);
        setPage(0);
        fetchAuthors(searchName, selectedNationalities.join(",") || undefined, 1, 0, newSize, sortBy, sortAsc);
    };

    const toggleNationality = (code: string) => {
        setSelectedNationalities(prev => {
            if (prev.includes(code)) {
                return [];
            } else {
                return [code];
            }
        });
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

    useEffect(() => {
        if (searchVisible && allCountries.length === 0) {
            fetch("https://flagcdn.com/en/codes.json")
                .then(res => res.json())
                .then((data: Record<string, string>) => {
                    setAllCountries(
                        Object.entries(data).map(([code, name]) => ({ code: code.toLowerCase(), name }))
                    );
                })
                .catch(console.error);
        }
    }, [searchVisible]);

    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchVisible(false);
            }
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    const filteredCountries = allCountries.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div className="container-author-list">
                <div className="author-list-container">

                    <div className="author-search-panel-wrapper">
                        <form onSubmit={handleSearch} className="author-search-panel">

                            <input
                                type="text"
                                placeholder={"Kogo szukasz?"}
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                            />

                            <div className="flags-grid">
                                {basicCountries.map(c => {
                                    const selected = selectedNationalities[0] === c.code;
                                    const border = selected ? "gold" : "transparent";

                                    return (
                                        <img
                                            key={c.code}
                                            src={`https://flagcdn.com/w40/${c.code}.png`}
                                            alt={c.name}
                                            className="flag"
                                            style={{ border: `3px solid ${border}` }}
                                            onClick={() => toggleNationality(c.code)}
                                        />
                                    );
                                })}

                                {selectedNationalities
                                    .filter(code => !basicCountries.some(c => c.code === code))
                                    .map(code => {
                                        const country = allCountries.find(c => c.code === code);
                                        if (!country) return null;
                                        return (
                                            <img
                                                key={country.code}
                                                src={`https://flagcdn.com/w40/${country.code}.png`}
                                                alt={country.name}
                                                className="flag"
                                                style={{ border: `3px solid gold` }}
                                                onClick={() => toggleNationality(code)}
                                            />
                                        );
                                    })}

                                <img
                                    src={SearchIcon}
                                    alt="Wyszukaj kraj"
                                    title="Wyszukaj kraj"
                                    className="flag"
                                    style={{ border: "2px dashed white" }}
                                    onClick={() => setSearchVisible(true)}
                                />
                            </div>

                            {searchVisible && (
                                <div className="country-search-popup" ref={searchRef}>
                                    <input
                                        type="text"
                                        placeholder="Szukaj kraju..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />

                                    <div className="country-suggestions">
                                        {filteredCountries.slice(0, 10).map(c => (
                                            <div
                                                key={c.code}
                                                className="country-suggestion"
                                                onClick={() => toggleNationality(c.code)}
                                            >
                                                <img
                                                    src={`https://flagcdn.com/w40/${c.code}.png`}
                                                    alt={c.name}
                                                />
                                                <span>{c.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button type="submit">{"Szukaj"}</button>
                        </form>
                    </div>

                    {loading && <p>Ładowanie autorów...</p>}
                    {error && <p className="author-error-text">{error}</p>}

                    {!loading && !error && authors.length === 0 && (
                        <p className="no-results">Brak wyników.</p>
                    )}

                    {!loading && !error && authors.length > 0 && (
                        <>
                            <table className="author-table">
                                <thead>
                                <tr>
                                    <th onClick={() => handleSort("name")}>
                                        Imię i nazwisko
                                        {sortBy === "name" ? (sortAsc ? " ▲" : " ▼") : null}
                                    </th>
                                    <th onClick={() => handleSort("nationalityPrimary")}>
                                        Narodowość
                                        {sortBy === "nationalityPrimary" ? (sortAsc ? " ▲" : " ▼") : null}
                                    </th>
                                    <th onClick={() => handleSort("birth_date_value")}>
                                        Urodzony
                                        {sortBy === "birth_date_value" ? (sortAsc ? " ▲" : " ▼") : null}
                                    </th>
                                    <th onClick={() => handleSort("death_date_value")}>
                                        Zmarł
                                        {sortBy === "death_date_value" ? (sortAsc ? " ▲" : " ▼") : null}
                                    </th>
                                </tr>
                                </thead>

                                <tbody>
                                {authors.map((a) => (
                                    <tr
                                        key={a.id}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => navigate(`/quotes?author=${encodeURIComponent(a.name)}`)}
                                    >
                                        <td className="name-column">{a.name}</td>
                                        <td className="flag-column">
                                            {a.nationalityPrimary && a.nationalityPrimary !== "None" && (
                                                <img
                                                    src={`https://flagcdn.com/w40/${a.nationalityPrimary}.png`}
                                                    alt={a.nationalityPrimary}
                                                    className="flag-mini"
                                                />
                                            )}
                                            {a.nationalitySecondary && a.nationalitySecondary !== "None" && (
                                                <img
                                                    src={`https://flagcdn.com/w40/${a.nationalitySecondary}.png`}
                                                    alt={a.nationalitySecondary}
                                                    className="flag-mini"
                                                />
                                            )}
                                        </td>
                                        <td className="birth-column">{formatDate(a.birthDateInfo, i18n.language)}</td>
                                        <td className="death-column">{formatDate(a.deathDateInfo, i18n.language)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>

                            <div className="pagination-panel">
                                <span>{"Strona " + (page + 1) + " z " + totalPages}</span>

                                <button disabled={page === 0} onClick={() => handlePageChange(page - 1)}>
                                    ◀
                                </button>

                                <button
                                    disabled={page + 1 >= totalPages}
                                    onClick={() => handlePageChange(page + 1)}
                                >
                                    ▶
                                </button>

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

export default ListAuthor;