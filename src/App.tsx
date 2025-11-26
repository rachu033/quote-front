import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Authentication from "./pages/Authetication.tsx";
import AddQuote from "./pages/AddQuote.tsx";
import AddAuthor from "./pages/AddAuthor.tsx";
import ListQuote from "./pages/ListQuote.tsx";
import ListAuthor from "./pages/ListAuthor.tsx";
import Layout from "./layouts/Layout.tsx";
import ModQuote from "./pages/ModQuote.tsx";
import ModAuthor from "./pages/ModAuthor.tsx";
import { AuthProvider } from "./context/AuthProvider.tsx";
import "./i18n";
import "./global.css";
import AdminPanel from "./pages/AdminPanel.tsx";
import Home from "./pages/Home.tsx";
import AccountPanel from "./pages/AccountPanel.tsx";
import ListFavorite from "./pages/ListFavorite.tsx";

const App = () => {

    return (
        <AuthProvider>
            <BrowserRouter>
                <Layout>
                    <Routes>
                        <Route path="/addauthor" element={<AddAuthor />} />
                        <Route path="/addquote" element={<AddQuote />} />
                        <Route path="/authors" element={<ListAuthor />} />
                        <Route path="/quotes" element={<ListQuote />} />
                        <Route path="/favorite" element={<ListFavorite />} />
                        <Route path="/modauthor" element={<ModAuthor />} />
                        <Route path="/modquote" element={<ModQuote />} />
                        <Route path="/login" element={<Authentication initialMode="signin" />} />
                        <Route path="/register" element={<Authentication initialMode="signup" />} />
                        <Route path="/admin" element={<AdminPanel />} />
                        <Route path="/account" element={<AccountPanel />} />
                        <Route path="/home" element={<Home />} />

                        <Route path="*" element={<Navigate to="/home" replace />} />
                    </Routes>
                </Layout>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;
