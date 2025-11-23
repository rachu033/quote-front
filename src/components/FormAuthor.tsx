import React, { useEffect, useRef, useState } from "react";
import RowDate from "./RowDate.tsx";
import SearchIcon from "../assets/search.svg";
import "../styles/components/FormAuthor.css";

interface Country {
    code: string;
    name: string;
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
    nationalityPrimary: string;
    nationalitySecondary: string;
}

interface FormAuthorSectionProps {
    onSubmit: (data: {
        name: string;
        birthDateInfo: DateInfo;
        deathDateInfo: DateInfo;
        nationalityPrimary: string;
        nationalitySecondary: string;
    }) => void;

    initialData?: AuthorRecord | null;
    onReject: () => void;
}

const FormAuthor: React.FC<FormAuthorSectionProps> = ({ onSubmit, initialData, onReject }) => {
    const [name, setName] = useState("");

    const [birthDateType, setBirthDateType] = useState("Data");
    const [birthDateValue, setBirthDateValue] = useState("");
    const [birthDateApprox, setBirthDateApprox] = useState("Dokładnie");
    const [birthDateEra, setBirthDateEra] = useState("n.e.");
    const [birthDateError, setBirthDateError] = useState("");

    const [deathDateType, setDeathDateType] = useState("Data");
    const [deathDateValue, setDeathDateValue] = useState("");
    const [deathDateApprox, setDeathDateApprox] = useState("Dokładnie");
    const [deathDateEra, setDeathDateEra] = useState("n.e.");
    const [deathDateError, setDeathDateError] = useState("");

    const [nationalities, setNationalities] = useState<string[]>([]);
    const [message, setMessage] = useState("");

    const [allCountries, setAllCountries] = useState<Country[]>([]);
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const searchRef = useRef<HTMLDivElement>(null);

    const basicCountries: Country[] = [
        { code: "pl", name: "Polska" },
        { code: "gb", name: "Wielka Brytania" },
        { code: "us", name: "Stany Zjednoczone" },
        { code: "fr", name: "Francja" },
        { code: "de", name: "Niemcy" },
        { code: "it", name: "Włochy" },
        { code: "es", name: "Hiszpania" },
        { code: "cn", name: "Chiny" },
        { code: "jp", name: "Japonia" },
    ];

    const prevInitialRef = useRef<AuthorRecord | null>(null);

    useEffect(() => {
        if (!initialData) return;

        if (prevInitialRef.current === initialData) return;
        prevInitialRef.current = initialData;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setName(initialData.name);

        setBirthDateType(
            initialData.birthDateInfo.type === "Date"
                ? "Data"
                : initialData.birthDateInfo.type === "Year"
                    ? "Rok"
                    : "Wiek"
        );
        setBirthDateValue(
            initialData.birthDateInfo.type === "Century"
                ? initialData.birthDateInfo.value + " w"
                : initialData.birthDateInfo.value
        );
        setBirthDateApprox(
            initialData.birthDateInfo.precision === "Exact" ? "Dokładnie" : "Około"
        );
        setBirthDateEra(initialData.birthDateInfo.era === "AD" ? "n.e." : "p.n.e.");

        // DEATH DATE
        setDeathDateType(
            initialData.deathDateInfo.type === "Date"
                ? "Data"
                : initialData.deathDateInfo.type === "Year"
                    ? "Rok"
                    : "Wiek"
        );
        setDeathDateValue(
            initialData.deathDateInfo.type === "Century"
                ? initialData.deathDateInfo.value + " w"
                : initialData.deathDateInfo.value
        );
        setDeathDateApprox(
            initialData.deathDateInfo.precision === "Exact" ? "Dokładnie" : "Około"
        );
        setDeathDateEra(initialData.deathDateInfo.era === "AD" ? "n.e." : "p.n.e.");

        const nats = [];
        if (initialData.nationalityPrimary) nats.push(initialData.nationalityPrimary);
        if (initialData.nationalitySecondary) nats.push(initialData.nationalitySecondary);
        setNationalities(nats);

    }, [initialData]);

    const validateDate = (type: string, value: string) => {
        switch (type) {
            case "Data": // DD.MM.YYYY
                return /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(value);
            case "Rok": // liczba całkowita
                return /^\d+$/.test(value);
            case "Wiek": // Century w rzymskich liczbach
                return /^([IVXLCDM]+)\s*w\.?$/i.test(value.trim());
            default:
                return false;
        }
    };
    useEffect(() => {
        const timer = setTimeout(() => {
            setBirthDateError(
                birthDateValue && !validateDate(birthDateType, birthDateValue)
                    ? "Niepoprawny format daty"
                    : ""
            );
        }, 0);
        return () => clearTimeout(timer);
    }, [birthDateValue, birthDateType]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDeathDateError(
                deathDateValue && !validateDate(deathDateType, deathDateValue)
                    ? "Niepoprawny format daty"
                    : ""
            );
        }, 0);
        return () => clearTimeout(timer);
    }, [deathDateValue, deathDateType]);

    // ---------------- POBIERANIE KRAJÓW ----------------
    useEffect(() => {
        if (searchVisible && allCountries.length === 0) {
            fetch("https://flagcdn.com/en/codes.json")
                .then(res => res.json())
                .then((data: Record<string, string>) => {
                    const list = Object.entries(data).map(([code, name]) => ({ code: code.toLowerCase(), name }));
                    setAllCountries(list);
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

    const toggleNationality = (code: string) => {
        setNationalities(prev => {
            if (prev.includes(code)) return prev.filter(c => c !== code);
            if (prev.length < 2) return [...prev, code];
            return prev;
        });
    };

    const filteredCountries = allCountries.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const clearForm = () => {
        setName("");
        setBirthDateType("Data");
        setBirthDateValue("");
        setBirthDateApprox("Dokładnie");
        setBirthDateEra("n.e.");
        setBirthDateError("");

        setDeathDateType("Data");
        setDeathDateValue("");
        setDeathDateApprox("Dokładnie");
        setDeathDateEra("n.e.");
        setDeathDateError("");

        setNationalities([]);
        setMessage("");
        setSearchTerm("");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setMessage("Proszę podać imię i nazwisko autora.");
            return;
        }
        if (birthDateError || deathDateError) {
            setMessage("Proszę poprawić błędy w polach dat.");
            return;
        }

        const birthDateInfo = mapDateToBackend(birthDateType, birthDateValue, birthDateApprox, birthDateEra);
        const deathDateInfo = mapDateToBackend(deathDateType, deathDateValue, deathDateApprox, deathDateEra);

        onSubmit({
            name,
            birthDateInfo,
            deathDateInfo,
            nationalityPrimary: nationalities[0] || "",
            nationalitySecondary: nationalities[1] || ""
        });
    };

    return (
        <div className="form-content">
            <label>Imię i nazwisko</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />

            <label>Data urodzenia</label>
            <RowDate
                dateType={birthDateType}
                setDateType={setBirthDateType}
                dateApprox={birthDateApprox}
                setDateApprox={setBirthDateApprox}
                dateValue={birthDateValue}
                setDateValue={setBirthDateValue}
                dateEra={birthDateEra}
                setDateEra={setBirthDateEra}
            />
            {birthDateError && <small className="warning-text">{birthDateError}</small>}

            <label>Data śmierci</label>
            <RowDate
                dateType={deathDateType}
                setDateType={setDeathDateType}
                dateApprox={deathDateApprox}
                setDateApprox={setDeathDateApprox}
                dateValue={deathDateValue}
                setDateValue={setDeathDateValue}
                dateEra={deathDateEra}
                setDateEra={setDeathDateEra}
            />
            {deathDateError && <small className="warning-text">{deathDateError}</small>}

            <label>Wybierz narodowość</label>
            <div className="flags-grid">
                {basicCountries.map(c => {
                    const pos = nationalities.indexOf(c.code);
                    const border = pos === 0 ? "gold" : pos === 1 ? "silver" : "transparent";
                    return (
                        <img
                            key={c.code}
                            src={`https://flagcdn.com/w40/${c.code}.png`}
                            alt={c.name}
                            title={c.name}
                            className="flag"
                            style={{ border: `3px solid ${border}` }}
                            onClick={() => toggleNationality(c.code)}
                        />
                    );
                })}

                {nationalities
                    .filter(code => !basicCountries.some(c => c.code === code))
                    .map(code => {
                        const country = allCountries.find(c => c.code === code);
                        if (!country) return null;
                        const pos = nationalities.indexOf(code);
                        const border = pos === 0 ? "gold" : pos === 1 ? "silver" : "transparent";
                        return (
                            <img
                                key={country.code}
                                src={`https://flagcdn.com/w40/${country.code}.png`}
                                alt={country.name}
                                title={country.name}
                                className="flag"
                                style={{ border: `3px solid ${border}` }}
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
                                <img src={`https://flagcdn.com/w40/${c.code}.png`} alt={c.name} />
                                <span>{c.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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

export default FormAuthor;
