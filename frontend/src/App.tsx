import { Outlet } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans selection:bg-indigo-500/30">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-6 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
