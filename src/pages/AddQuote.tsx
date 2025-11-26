import React, {useState} from "react";
import FormQuote from "../components/FormQuote.tsx";
import "../styles/pages/AddQuote.css";
import "../styles/components/Toast.css"

interface Toast {
    message: string;
    type: "success" | "error";
}

const AddQuote: React.FC = () => {
    const [toast, setToast] = useState<Toast | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    interface DateInfo {
        type: "Date" | "Year" | "Century";
        value: string;
        precision: "Exact" | "Approx";
        era: "AD" | "BC";
    }

    const handleQuoteSubmit = async (data: {
        text: string;
        authorId: number | null;
        quoteDateInfo: DateInfo;
        source: string;
    }) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/users/submitQuote`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Błąd podczas zapisu cytatu");

            showToast("Cytat został zapisany!", "success");
        } catch (err) {
            console.error("Wystąpił błąd podczas zapisywania cytatu:", err);
            showToast("Wystąpił błąd podczas zapisu autora", "error");
        }
    };

    return (
        <>
            <div className="container-add-quote">
                <div className="container-form">
                    <h2 className="form-header">Cytowanie to najwyższa forma uznania</h2>
                    <FormQuote onSubmit={handleQuoteSubmit} onReject={() => {}}  />
                </div>

                <div className="describe-form">
                    <h3>Opis</h3>
                    <p>Dodaj cytat i przypisz go do autora, podając źródło i datę.</p>
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

export default AddQuote;
