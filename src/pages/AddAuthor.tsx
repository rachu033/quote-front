import React, { useState } from "react";
import FormAuthor from "../components/FormAuthor.tsx";
import "../styles/pages/AddAuthor.css";
import "../styles/components/Toast.css"

interface Toast {
    message: string;
    type: "success" | "error";
}

const AddAuthor: React.FC = () => {
    const [toast, setToast] = useState<Toast | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleAuthorSubmit = async (data: {
        name: string;
        birthDateInfo: unknown;
        deathDateInfo: unknown;
        nationalityPrimary: string;
        nationalitySecondary: string;
    }) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/users/submitAuthor`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Błąd podczas zapisu autora");

            showToast("Autor został zapisany!", "success");
        } catch (err) {
            console.error("Wystąpił błąd podczas zapisu autora:", err);
            showToast("Wystąpił błąd podczas zapisu autora", "error");
        }
    };

    return (
        <>
            <div className="container-add-author">
                <div className="left-panel">
                    <h3>Pomoc</h3>
                    <p>Po lewej możesz umieścić informacje opisowe lub wskazówki.</p>
                </div>

                <div className="center-form">
                    <h2 className="form-header">Dodaj autora</h2>
                    <FormAuthor onSubmit={handleAuthorSubmit} onReject={() => {}} />
                </div>

                <div className="right-panel">
                    <h3>Opis</h3>
                    <p>Po prawej stronie możesz dodać dowolne informacje kontekstowe.</p>
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

export default AddAuthor;
