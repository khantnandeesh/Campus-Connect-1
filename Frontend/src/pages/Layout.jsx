import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 bg-[#010038]">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
