"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PwaShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  return (
    <main className="pwa-shell">
      <header className="pwa-header">
        <Link href="/pwa" className="pwa-brand"><span>SK</span> Sơn Khang</Link>
        <span className={`pwa-network ${online ? "is-online" : "is-offline"}`}>{online ? "Online" : "Offline"}</span>
      </header>
      <section className="pwa-hero"><p>ERP tác nghiệp</p><h1>{title}</h1><span>{subtitle}</span></section>
      <section className="pwa-content">{children}</section>
      <nav className="pwa-bottom" aria-label="Điều hướng PWA">
        <Link href="/pwa">Trang chủ</Link><Link href="/workspace">Công việc</Link><Link href="/workspace/profile">Tài khoản</Link>
      </nav>
    </main>
  );
}

export function PwaActionGrid({ actions }: { actions: Array<{ href: string; label: string; description: string }> }) {
  return <div className="pwa-grid">{actions.map((item) => <Link className="pwa-action" href={item.href} key={item.label}><strong>{item.label}</strong><span>{item.description}</span><b aria-hidden="true">→</b></Link>)}</div>;
}
