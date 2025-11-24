import React, { useState } from "react";
import FormAuthor from "../components/FormAuthor.tsx";
import "../styles/pages/AddAuthor.css";
import "../styles/components/Toast.css"

interface Toast {
    message: string;
    type: "success" | "error";
}

interface AuthorRecord {
    id: number;
    name: string;
    birthDateInfo: unknown;
    deathDateInfo: unknown;
    nationalityPrimary: string;
    nationalitySecondary: string;
}

const AddAuthor: React.FC = () => {
    const [toast, setToast] = useState<Toast | null>(null);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleAuthorSubmit = async (
        data: {
            name: string;
            birthDateInfo: unknown;
            deathDateInfo: unknown;
            nationalityPrimary: string;
            nationalitySecondary: string;
        },
        existingAuthor?: AuthorRecord | null
    ) => {
        try {
            const url = existingAuthor
                ? `${import.meta.env.VITE_API_URL}/users/updateAuthor/${existingAuthor.id}`
                : `${import.meta.env.VITE_API_URL}/users/submitAuthor`;
            const method: "POST" | "PUT" = existingAuthor ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) throw new Error("Błąd podczas zapisu autora");

            showToast(existingAuthor ? "Autor został zaktualizowany!" : "Autor został zapisany!", "success");
        } catch (err) {
            console.error("Wystąpił błąd podczas zapisu autora:", err);
            showToast("Wystąpił błąd podczas zapisu autora", "error");
        }
    };

    return (
        <>
            <div className="container-add-author">
                <div className="left-panel">
                    <h3>Dodawanie autorów</h3>
                    <p>Dodaj autora, podając jego imię i nazwisko oraz datę urodzenia i śmierci. Jeśli autor cytatu żyje, pozostaw puste.</p>
                </div>

                <div className="center-form">
                    <h2 className="form-header">Dodaj autora</h2>
                    <FormAuthor onSubmit={handleAuthorSubmit} onReject={() => {}} initialData={null} />
                </div>

                <div className="right-panel">
                    <h3>Narodowść</h3>
                    <p>Jeśli autor miał dwa obywatelstwa lub miał silne konotacje z innym narodem, możesz zaznaczyć drugą flagę. W przypadku braku flagi na liście podstawowej wejdź w listę rozszerzoną. Na razie lista rozszerzona dostępna tylko w języku angielskim przez używanie zagranicznego API.</p>
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
