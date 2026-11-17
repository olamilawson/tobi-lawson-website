import { NavLink } from "react-router-dom";
import { House, Inbox, ListChecks, BookOpen, Settings } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: House },
  { to: "/approvals", label: "Approvals", icon: Inbox },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/memory", label: "Memory", icon: BookOpen },
];

const on = "flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent";
const off = "flex size-10 items-center justify-center rounded-xl text-ink-3 hover:bg-sunken hover:text-ink";

/** Desktop: the left rail. Phones: a tab bar along the bottom. waiting: approvals count. */
export default function Rail({ waiting = 0 }: { waiting?: number }) {
  return (
    <>
      <nav aria-label="Main" className="hidden w-[72px] shrink-0 flex-col items-center gap-2 bg-muted py-5 md:flex">
        <div className="mb-4 flex size-10 items-center justify-center gap-1.5 rounded-xl bg-face" aria-hidden="true">
          <span className="h-3.5 w-1.5 animate-blink rounded-full bg-white" />
          <span className="h-3.5 w-1.5 animate-blink rounded-full bg-white" />
        </div>
        {items.map((it) => (
          <Item key={it.to} {...it} waiting={it.to === "/approvals" ? waiting : 0} />
        ))}
        <div className="flex-1" />
        <Item to="/settings" label="Settings" icon={Settings} waiting={0} />
      </nav>
      <nav
        aria-label="Main"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-line bg-canvas/95 pt-2 backdrop-blur md:hidden"
      >
        {[...items, { to: "/settings", label: "Settings", icon: Settings }].map((it) => (
          <Item key={it.to} {...it} waiting={it.to === "/approvals" ? waiting : 0} />
        ))}
      </nav>
    </>
  );
}

function Item({ to, label, icon: Icon, waiting }: { to: string; label: string; icon: typeof House; waiting: number }) {
  const name = waiting ? `${label}, ${waiting} waiting` : label;
  return (
    <NavLink to={to} end={to === "/"} title={name} aria-label={name} className={({ isActive }) => `relative ${isActive ? on : off}`}>
      <Icon size={18} strokeWidth={1.75} />
      {waiting > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-medium text-white">
          {waiting}
        </span>
      )}
    </NavLink>
  );
}
