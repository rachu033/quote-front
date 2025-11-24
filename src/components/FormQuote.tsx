import React, {useState, useEffect, useRef} from "react";
import RowDate from "./RowDate.tsx";
import "../styles/components/FormQuote.css";

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

interface FormQuoteFormProps {
    onSubmit?: (data: {
        text: string;
        authorId: number | null;
        quoteDateInfo: DateInfo;
        period: string;
        source: string;
    }) => void;

    initialData?: QuoteRecord | null;
    onReject: () => void;
}

const FormQuote: React.FC<FormQuoteFormProps> = ({onSubmit, initialData, onReject}) => {
    const [text, setText] = useState("Treść cytatu");
    const [authorName, setAuthorName] = useState("");
    const [authorId, setAuthorId] = useState<number | null>(null);

    const [dateType, setDateType] = useState("Data");
    const [dateValue, setDateValue] = useState("");
    const [dateApprox, setDateApprox] = useState("Dokładnie");
    const [dateEra, setDateEra] = useState("n.e.");

    const [period, setPeriod] = useState("");
    const [source, setSource] = useState("");
    const [authorSuggestions, setAuthorSuggestions] = useState<{ id: number; name: string }[]>([]);
    const [message, setMessage] = useState("");

    const authorRef = useRef<HTMLDivElement>(null);
    //const periods = ["Starożytność", "Średniowiecze", "Nowożytność", "Współczesność"];

    const prevInitialRef = useRef<QuoteRecord | null>(null);

    const [isAutoFilling, setIsAutoFilling] = useState(false);

    const mapDateToBackend = (type: string, value: string, approx: string, era: string) => {
        let backendType: "Date" | "Year" | "Century" = "Date";
        let backendValue = value;
        const precision: "Exact" | "Approx" = approx === "Dokładnie" ? "Exact" : "Approx";
        const backendEra: "AD" | "BC" = era === "n.e." ? "AD" : "BC";

        switch (type) {
            case "Data":
                backendType = "Date";
                break;
            case "Rok":
                backendType = "Year";
                break;
            case "Wiek":
                backendType = "Century";
                backendValue = value.replace(/\s*w\.?/i, "").trim();
                break;
        }

        return {
            type: backendType,
            value: backendValue,
            precision: precision,
            era: backendEra,
        };
    };

    const quoteDateInfo =  mapDateToBackend(dateType, dateValue, dateApprox, dateEra);

    const validateDate = (): boolean => {
        if (dateType === "Data") return /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateValue);
        if (dateType === "Rok") return /^\d+$/.test(dateValue);
        if (dateType === "Wiek") return /^([IVXLCDM\d]+)\s*w\.?$/i.test(dateValue.trim());
        return false;
    };

    const autoSetPeriod = () => {
        let year: number | null = null;
        if (dateType === "Data") {
            const match = dateValue.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
            if (match) year = parseInt(match[3]);
        } else if (dateType === "Rok") {
            if (/^\d+$/.test(dateValue)) {
                year = parseInt(dateValue);
                if (dateEra === "p.n.e.") year = -year;
            }
        } else if (dateType === "Wiek") return;

        if (year !== null) {
            if (year < 476) setPeriod("Starożytność");
            else if (year >= 476 && year < 1492) setPeriod("Średniowiecze");
            else if (year >= 1492 && year < 1914) setPeriod("Nowożytność");
            else if (year >= 1914) setPeriod("Współczesność");
        } else {
            setPeriod("");
        }
    };

    useEffect(() => {
        if (!initialData) return;

        if (prevInitialRef.current === initialData) return;
        prevInitialRef.current = initialData;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsAutoFilling(true);

        setText(initialData.text || "");
        setAuthorId(initialData.author?.id || null);
        setAuthorName(initialData.author?.name || "");

        if (initialData.quoteDateInfo) {
            setDateType(
                initialData.quoteDateInfo.type === "Date" ? "Data" :
                    initialData.quoteDateInfo.type === "Year" ? "Rok" :
                        "Wiek"
            );
            setDateValue(initialData.quoteDateInfo.value || "");
            setDateApprox(initialData.quoteDateInfo.precision === "Exact" ? "Dokładnie" : "Przybliżone");
            setDateEra(initialData.quoteDateInfo.era === "AD" ? "n.e." : "p.n.e.");
        } else {
            setDateType("Data");
            setDateValue("");
            setDateApprox("Dokładnie");
            setDateEra("n.e.");
        }

        setPeriod(initialData.period || "");
        setSource(initialData.source || "");

        const timer = setTimeout(() => setIsAutoFilling(false), 0);
        return () => clearTimeout(timer);
    }, [initialData]);


    useEffect(() => {
        const timer = setTimeout(autoSetPeriod, 0);
        return () => clearTimeout(timer);
    }, [dateValue, dateType, dateEra]);

    useEffect(() => {
        let isMounted = true;

        if (isAutoFilling) {
            return;
        }

        if (authorName.length > 1) {
            fetch(`${import.meta.env.VITE_API_URL}/authors/search?name=${authorName}`, {
                method: "GET",
                credentials: "include",
            })
                .then((res) => res.json())
                .then((data) => {
                    if (isMounted) setAuthorSuggestions(data);
                })
                .catch((err) => console.error(err));
        } else {
            setTimeout(() => {
                if (isMounted) {
                    setAuthorSuggestions([]);
                    setAuthorId(null);
                }
            }, 0);
        }

        return () => {
            isMounted = false;
        };
    }, [authorName]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (authorRef.current && !authorRef.current.contains(e.target as Node)) {
                setAuthorSuggestions([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");

        if (!authorId) {
            setMessage("Proszę wybrać autora z listy.");
            return;
        }
        if (!validateDate()) {
            setMessage("Niepoprawny format daty/wieku/roku.");
            return;
        }

        if (onSubmit) {
            onSubmit({text, authorId, quoteDateInfo, period, source});
            setMessage("Formularz został wysłany!");
        }
    };

    const clearForm = () => {
        setText("");
        setAuthorName("");
        setAuthorId(null);
        setDateValue("");
        setDateType("Data");
        setDateApprox("Dokładnie");
        setDateEra("n.e.");
        setPeriod("");
        setSource("");
        setAuthorSuggestions([]);
        setMessage("");
    };

    return (
        <div className="quote-form">
            <div className="row-top">
                <div className="left-quote">
                    <textarea value={text} onChange={(e) => setText(e.target.value)} required/>
                </div>
                <div className="right-fields" ref={authorRef}>
                    <label>Autor</label>
                    <input
                        value={authorName}
                        onChange={(e) => setAuthorName(e.target.value)}
                        onFocus={() => {
                            if (authorName.length > 1) setAuthorSuggestions(authorSuggestions);
                        }}
                        onBlur={() => {
                            setTimeout(() => setAuthorSuggestions([]), 150);
                        }}
                        required
                    />
                    {authorSuggestions.length > 0 && (
                        <ul className="suggestions">
                            {authorSuggestions.map(a => (
                                <li
                                    key={a.id}
                                    onMouseDown={() => {
                                        setAuthorName(a.name);
                                        setAuthorId(a.id);
                                        setAuthorSuggestions([]);
                                    }}
                                >
                                    {a.name}
                                </li>
                            ))}
                        </ul>
                    )}
                    <label>Źródło</label>
                    <input value={source} onChange={(e) => setSource(e.target.value)}/>
                </div>
            </div>

            <div className="row-bottom">
                <div className="row-date-component">
                    <RowDate
                        dateType={dateType}
                        setDateType={setDateType}
                        dateApprox={dateApprox}
                        setDateApprox={setDateApprox}
                        dateValue={dateValue}
                        setDateValue={setDateValue}
                        dateEra={dateEra}
                        setDateEra={setDateEra}
                    />
                </div>
                <div className="period-row">

                </div>
            </div>

            <div className="button-row">
                <button className="submit" type="button" onClick={handleSubmit}>{initialData ? "Zatwierdź" : "Zapisz autora"}</button>
                <button className="clear" type="button" onClick={() => {
                    if (initialData) {
                        onReject();
                    } else {
                        clearForm();
                    }}}>{initialData ? "Odrzuć" : "Wyczyść formularz"}
                </button>
            </div>

            {message && <p className="message">{message}</p>}
        </div>
    );
};

export default FormQuote;
