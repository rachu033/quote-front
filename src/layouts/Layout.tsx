import {type ReactNode } from "react";
import Menu from "./components/Menu.tsx";
import "./Layout.css";
import Footer from "./components/Footer.tsx";

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="layout-container">
            <Menu />
            <div className="scroll-container">
                <div className="layout-content">
                    {children}
                </div>

                <Footer/>
            </div>
        </div>
    );
}
