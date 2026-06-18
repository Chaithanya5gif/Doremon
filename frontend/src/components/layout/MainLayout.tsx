import { Outlet } from "react-router";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-system-bg text-white">
      <main className="min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
