import "./Footer.css";
import FirebaseIcon from "../../assets/firebase.svg";
import SpringIcon from "../../assets/spring.svg";
import PostgresIcon from "../../assets/postgres.svg";
import ReactIcon from "../../assets/react.svg";
import ViteIcon from "../../assets/vite.svg";

export default function Footer() {
    return (
        <footer className="Footer">
            <span className="author">© 2025 Adam Rachuba</span>

            <div className="tech-icons">
                <a
                    href="https://firebase.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img src={FirebaseIcon} alt="Firebase" className="tech-icon" />
                </a>

                <a
                    href="https://spring.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img src={SpringIcon} alt="Spring Framework" className="tech-icon" />
                </a>

                <a
                    href="https://www.postgresql.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img src={PostgresIcon} alt="PostgreSQL" className="tech-icon" />
                </a>

                <a
                    href="https://react.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img src={ReactIcon} alt="React" className="tech-icon" />
                </a>

                <a
                    href="https://vitejs.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img src={ViteIcon} alt="Vite" className="tech-icon" />
                </a>
            </div>
        </footer>
    );
}
