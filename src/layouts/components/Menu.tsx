import "./Menu.css";
import { useTranslation } from "react-i18next";
import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function Menu() {
    const { t } = useTranslation();
    const { user, setUser } = useContext(AuthContext);

    const handleLogout = async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/authentication/logout`, {
                method: "POST",
                credentials: "include"
            });
        } catch (err) {
            console.error("Błąd przy wylogowaniu:", err);
        } finally {
            setUser(null);
        }
    };

    const getAddLink = (type: string) => {
        if (!user) return "#0";
        if (user.isModerator) {
            return type === "quote" ? "modquote" : "modauthor";
        }
        return type === "quote" ? "/addquote" : "/addauthor";
    };

    return (
        <nav className="menu">
            <ul>
                <li><Link to="/home">{t("Strona główna")}</Link></li>

                {/* CYTATY */}
                <li>
                    <Link to="/quotes">{t("Cytaty")}</Link>
                    <ul className="sub-menu">
                        <li><Link to="/quotes">{t("Lista cytatów")}</Link></li>

                        <li>
                            <Link
                                to={getAddLink("quote")}
                                className={!user ? "disabled" : ""}
                                title={!user ? t("Wymaga zalogowania") : ""}
                            >
                                {t("Dodaj cytat")}
                            </Link>
                        </li>
                    </ul>
                </li>

                {/* AUTORZY */}
                <li>
                    <Link to="/authors">{t("Autorzy")}</Link>
                    <ul className="sub-menu">
                        <li><Link to="/authors">{t("Lista autorów")}</Link></li>

                        <li>
                            <Link
                                to={getAddLink("author")}
                                className={!user ? "disabled" : ""}
                                title={!user ? t("Wymaga zalogowania") : ""}
                            >
                                {t("Dodaj autora")}
                            </Link>
                        </li>
                    </ul>
                </li>

                {/* PROFIL */}
                <li>
                    <Link to={user ? "/account" : "login"}>{t("Konto")}</Link>
                    <ul className="sub-menu">
                        {user ? (
                            <>
                                <li><Link to="/favorite">{t("Ulubione")}</Link></li>
                                <li><Link to="/account">{t("Profil")}</Link></li>
                                <li>
                                    <a onClick={handleLogout} className="logout-btn">
                                        {t("Wyloguj")}
                                    </a>
                                </li>
                            </>
                        ) : (
                            <>
                                <li><Link to="/login">{t("Zaloguj")}</Link></li>
                                <li><Link to="/register">{t("Zarejestruj")}</Link></li>
                            </>
                        )}
                    </ul>
                </li>
            </ul>
        </nav>
    );

}