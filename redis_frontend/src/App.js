import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import AuthPage from "./AuthPage";
import AdminDashboard from "./AdminDashboard";
import ManageOfficers from "./ManageOfficers";
import UserPage from "./UserPage";
import SocioInformation from "./SocioInformation";
import ManageResidents from "./ManageResidents";
import BarangayClearance from "./BarangayClearance";

function App() {
    const [isClearanceOpen, setIsClearanceOpen] = useState(false);

    return (
        <Router>
            
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/manage-officers" element={<ManageOfficers />} />
\                <Route path="/socio-information" element={<SocioInformation />} />
                <Route path="/manage-residents" element={<ManageResidents />} />
                <Route path="/user-page" element={<UserPage />} />

            </Routes>
        </Router>
    );
}

export default App;
