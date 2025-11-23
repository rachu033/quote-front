import React from "react";
import "../styles/components/DateRow.css"

interface DateRowProps {
    dateType: string;
    setDateType: (value: string) => void;
    dateApprox: string;
    setDateApprox: (value: string) => void;
    dateValue: string;
    setDateValue: (value: string) => void;
    dateEra: string;
    setDateEra: (value: string) => void;
}

const RowDate: React.FC<DateRowProps> = ({
                                             dateType,
                                             setDateType,
                                             dateApprox,
                                             setDateApprox,
                                             dateValue,
                                             setDateValue,
                                             dateEra,
                                             setDateEra,
                                         }) => {
    return (
        <div className="date-row">
            <select value={dateType} onChange={(e) => setDateType(e.target.value)}>
                <option value="Data">Data</option>
                <option value="Rok">Rok</option>
                <option value="Wiek">Wiek</option>
            </select>

            <select value={dateApprox} onChange={(e) => setDateApprox(e.target.value)}>
                <option value="Dokładnie">Dokładnie</option>
                <option value="Około">Około</option>
            </select>

            <input
                value={dateValue}
                onChange={(e) => {
                    setDateValue(e.target.value);
                }}
                placeholder={
                    dateType === "Data"
                        ? "DD.MM.YYYY"
                        : dateType === "Rok"
                            ? "np. 424"
                            : "np. V w."
                }
            />

            <select
                value={dateEra}
                onChange={(e) => {
                    setDateEra(e.target.value);
                }}
            >
                <option value="n.e.">n.e.</option>
                <option value="p.n.e.">p.n.e.</option>
            </select>
        </div>
    );
};

export default RowDate;
