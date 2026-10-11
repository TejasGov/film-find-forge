import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const TITLE = "Page not found — WhatToWatch Tonight";
const DESC = "This page doesn't exist. Head back to WhatToWatch Tonight to explore 150 films and pick one your whole group will enjoy.";

const setMeta = (attr: "name" | "property", key: string, value: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  const prev = el.content;
  el.content = value;
  return () => { el!.content = prev; };
};

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = TITLE;
    const restore = [
      setMeta("name", "description", DESC),
      setMeta("name", "robots", "noindex"),
      setMeta("property", "og:title", TITLE),
      setMeta("property", "og:description", DESC),
      setMeta("name", "twitter:title", TITLE),
      setMeta("name", "twitter:description", DESC),
    ];
    return () => { document.title = prevTitle; restore.forEach((r) => r()); };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Error 404</p>
        <h1 className="mt-4 font-display text-6xl">Scene missing.</h1>
        <p className="mt-4 text-sm text-muted-foreground">This page doesn't exist.</p>
        <a href="/" className="mt-8 inline-block border border-foreground/15 px-5 py-3 text-sm transition hover:border-primary/60">
          Back to the films
        </a>
      </div>
    </main>
  );
};

export default NotFound;
