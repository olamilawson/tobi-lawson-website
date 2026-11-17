import { HashRouter, Link, Route, Routes } from "react-router-dom";
import Agent from "./components/Agent";
import { SessionProvider, useSession } from "./session";
import Home from "./screens/Home";
import Approvals from "./screens/Approvals";
import Tasks from "./screens/Tasks";
import Memory from "./screens/Memory";
import Settings from "./screens/Settings";
import SignIn from "./screens/SignIn";
import Blocked from "./screens/Blocked";

export default function App() {
  return (
    <SessionProvider>
      <Gate />
    </SessionProvider>
  );
}

/** Which screen the session allows (session.tsx draws the machine). */
function Gate() {
  const { session, recheck } = useSession();
  switch (session.state) {
    case "checking":
    case "loading_me":
      return (
        <main data-state={session.state} aria-label="Loading" className="flex min-h-dvh items-center justify-center bg-canvas">
          <div aria-hidden="true">
            <Agent pose="think" size={110} />
          </div>
        </main>
      );
    case "not_running":
    case "not_set_up":
    case "offline":
      return <Blocked kind={session.state} detail={session.message} onRetry={recheck} />;
    case "signed_out":
      return <SignIn codeRequired={session.codeRequired} ended={session.ended} />;
    case "ready":
      return (
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/c/:chatId" element={<Home />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/memory" element={<Memory />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="*"
              element={
                <main className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-canvas">
                  <p className="text-lg font-medium">Nothing here</p>
                  <Link to="/" className="text-accent underline">
                    Back to home
                  </Link>
                </main>
              }
            />
          </Routes>
        </HashRouter>
      );
  }
}
