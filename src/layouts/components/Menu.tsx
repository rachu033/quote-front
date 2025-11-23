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
            //window.location.href = "/home"; // opcjonalnie redirect
        }
    };

    const getAddLink = (type: string) => {
        if (!user) return "#0"; // brak dostępu jeśli niezalogowany
        if (user.isModerator) {
            return type === "quote" ? "modquote" : "modauthor";
        }
        return type === "quote" ? "/addquote" : "/addauthor";
    };

    return (
        <nav className="menu">
            <ul>
                <li><Link to="/home">{t("menu.home")}</Link></li>

                {/* CYTATY */}
                <li>
                    <Link to="/quotes">{t("menu.quotes.title")}</Link>
                    <ul className="sub-menu">
                        <li><Link to="/quotes">{t("menu.quotes.list")}</Link></li>

                        <li>
                            <Link
                                to={getAddLink("quote")}
                                className={!user ? "disabled" : ""}
                                title={!user ? t("menu.loginRequired") : ""}
                            >
                                {t("menu.quotes.add")}
                            </Link>
                        </li>
                    </ul>
                </li>

                {/* AUTORZY */}
                <li>
                    <Link to="/authors">{t("menu.authors.title")}</Link>
                    <ul className="sub-menu">
                        <li><Link to="/authors">{t("menu.authors.list")}</Link></li>

                        <li>
                            <Link
                                to={getAddLink("author")}
                                className={!user ? "disabled" : ""}
                                title={!user ? t("menu.loginRequired") : ""}
                            >
                                {t("menu.authors.add")}
                            </Link>
                        </li>
                    </ul>
                </li>

                {/* PROFIL */}
                <li>
                    <Link to={user ? "/account" : "login"}>{t("menu.profile.title")}</Link>
                    <ul className="sub-menu">
                        {user ? (
                            <>
                                <li><Link to="/account">{t("menu.profile.account")}</Link></li>
                                <li><Link to="/favorite">{t("menu.profile.favorite")}</Link></li>
                                <li>
                                    <a onClick={handleLogout} className="logout-btn">
                                        {t("menu.profile.logout")}
                                    </a>
                                </li>
                            </>
                        ) : (
                            <>
                                <li><Link to="/login">{t("menu.profile.login")}</Link></li>
                                <li><Link to="/register">{t("menu.profile.register")}</Link></li>
                            </>
                        )}
                    </ul>
                </li>
            </ul>
        </nav>
    );

}