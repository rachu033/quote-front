import {type ReactNode } from "react";
import "./Layout.css";
import Footer from "./components/Footer.tsx";

interface LayoutProps {
    children: ReactNode;
}

export default function LayoutSimple({ children }: LayoutProps) {
    return (
        <div className="layout-container">
            <div className="scroll-container">
                <main className="layout-content">
                    {children}
                </main>
                <Footer/>
            </div>
        </div>
    );
}
