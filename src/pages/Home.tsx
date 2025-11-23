import { useEffect, useState } from "react";
import "../styles/pages/Home.css";

interface Author {
    id: number;
    name: string;
}

interface Quote {
    id: number;
    text: string;
    author: Author;
}

interface QuoteOfDay {
    id: number;
    quoteDate: string;
    quote: Quote;
}

const Home: React.FC = () => {
    const [qod, setQod] = useState<QuoteOfDay | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQod = async () => {
            try {
                const res = await fetch("http://localhost:8080/quoteapi/quotes/qod/today");
                if (!res.ok) throw new Error("Nie udało się pobrać Cytatu Dnia");
                const data: QuoteOfDay = await res.json();
                setQod(data);
            } catch (err) {
                console.error(err);
                setError("Błąd podczas pobierania Cytatu Dnia");
            } finally {
                setLoading(false);
            }
        };

        fetchQod();
    }, []);

    if (loading) return <div className="loading">Ładowanie...</div>;
    if (error) return <div className="error-page"><h2>{error}</h2></div>;

    return (
        <div className="home-container">
            <div className="center-panel">
                {qod ? (
                    <div className="qod-card">
                        <h2>Cytat Dnia</h2>
                        <p className="qod-text">"{qod.quote.text}"</p>
                        <p className="qod-author">— {qod.quote.author?.name}</p>
                    </div>
                ) : (
                    <p>Brak Cytatu Dnia</p>
                )}
            </div>
        </div>
    );
};

export default Home;
