"use client";

import { useEffect, useRef, useState } from "react";
import { JsonView, darkStyles, defaultStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import jsonlint from "jsonlint-mod";

type ThemePreference = "system" | "light" | "dark";

type ParseResult =
  | { ok: true; value: any }
  | {
      ok: false;
      errorMessage: string;
    };

function computeErrorInfo(errMsg: string) {
  // Try to extract line/column from jsonlint error message
  // e.g., "Parse error on line 3:\n...\nExpecting 'STRING', got 'NUMBER'"
  const lineMatch = errMsg.match(/line\s+(\d+)/i);
  const colMatch = errMsg.match(/column\s+(\d+)/i);
  const line = lineMatch ? Number(lineMatch[1]) : undefined;
  const column = colMatch ? Number(colMatch[1]) : undefined;
  return { line, column };
}

function looksLikeJsonText(text: string) {
  const t = text.trim();
  if (!t) return false;
  // A pragmatic heuristic: only attempt a second parse when it looks like an object/array.
  return (
    (t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"))
  );
}

function formatJsonlintError(e: any) {
  const msg = e?.message || String(e);
  const info = computeErrorInfo(msg);
  const hint = info.line
    ? `Line ${info.line}${info.column ? `, Column ${info.column}` : ""}`
    : "";
  return `${msg}${hint ? ` (${hint})` : ""}`;
}

function safeParseJson(raw: string): ParseResult {
  try {
    // jsonlint provides better errors than JSON.parse
    let value: any = jsonlint.parse(raw);

    // If the input is a JSON string that itself contains JSON, parse one extra level.
    // Example: "{\"a\":1}" -> { a: 1 }
    if (typeof value === "string" && looksLikeJsonText(value)) {
      try {
        value = jsonlint.parse(value);
      } catch {
        // Keep first parse result if the inner value isn't valid JSON.
      }
    }

    return { ok: true, value };
  } catch (e: any) {
    return { ok: false, errorMessage: formatJsonlintError(e) };
  }
}

export default function Home() {
  const [raw, setRaw] = useState<string>(
    "{\n  \"hello\": \"world\",\n  \"list\": [1, 2, 3]\n}"
  );

  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [formatted, setFormatted] = useState<string>("");
  const [minified, setMinified] = useState<string>("");
  // Use `undefined` as the "no valid value" sentinel so that valid JSON like `null` can still render.
  const [jsonObj, setJsonObj] = useState<any>(undefined);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [copied, setCopied] = useState<{ input: boolean; formatted: boolean; minified: boolean }>({
    input: false,
    formatted: false,
    minified: false,
  });

  // Load persisted preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemePreference(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  // Track system preference changes (only matters when themePreference === "system")
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemPrefersDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Persist preference
  useEffect(() => {
    try {
      localStorage.setItem("theme", themePreference);
    } catch {
      // ignore
    }
  }, [themePreference]);

  const theme: "light" | "dark" =
    themePreference === "system"
      ? systemPrefersDark
        ? "dark"
        : "light"
      : themePreference;

  // Drive Tailwind's `dark:` variant
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const styles = theme === "dark" ? darkStyles : defaultStyles;

  const validateNow = () => {
    const result = safeParseJson(raw);
    if (result.ok) {
      setError(null);
      setJsonObj(result.value);
      return result.value;
    }
    setError(result.errorMessage);
    setJsonObj(undefined);
    return null;
  };

  // Auto-validate as user types (debounced)
  useEffect(() => {
    const handle = window.setTimeout(() => {
      validateNow();
    }, 250);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  const onFormat = () => {
    const obj = validateNow();
    if (obj === null) {
      showToast("Fix JSON errors first");
      return;
    }
    setFormatted(JSON.stringify(obj, null, 2));
    showToast("Formatted");
  };

  const onMinify = () => {
    const obj = validateNow();
    if (obj === null) {
      showToast("Fix JSON errors first");
      return;
    }
    setMinified(JSON.stringify(obj));
    showToast("Minified");
  };

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 1500);
  };

  const copyText = async (text: string, kind: keyof typeof copied) => {
    if (!text) {
      showToast("Nothing to copy");
      return;
    }

    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      // Fallback
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }

    if (ok) {
      setCopied((s) => ({ ...s, [kind]: true }));
      window.setTimeout(() => setCopied((s) => ({ ...s, [kind]: false })), 1200);
      showToast("Copied");
    } else {
      showToast("Copy failed");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          JSON Editor
        </h1>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full border px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() => setThemePreference(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <button
            className="rounded-full border px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() => setThemePreference("system")}
            aria-label="Use system theme"
          >
            System
          </button>
          <a
            className="text-sm text-zinc-600 underline dark:text-zinc-400"
            href="https://github.com/YueeLi/JSON_editor"
            target="_blank"
            rel="noreferrer"
          >
            Repo
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        {toast ? (
          <div
            className="fixed bottom-4 right-4 z-50 rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white shadow-lg"
            role="status"
            aria-live="polite"
          >
            {toast}
          </div>
        ) : null}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-2 text-base font-medium text-zinc-900 dark:text-zinc-50">
              Input JSON (or JSON string)
            </h2>
            <textarea
              className="h-64 w-full resize-y rounded-lg border p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder='Paste JSON or a JSON string (e.g. "{\\"a\\":1}")'
            />
            {error ? (
              <div className="mt-2 rounded-md border border-red-300 bg-red-50 p-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
                Invalid: {error}
              </div>
            ) : (
              <div className="mt-2 rounded-md border border-emerald-300 bg-emerald-50 p-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                Valid JSON
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={onFormat}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Format (Pretty)
              </button>
              <button
                onClick={onMinify}
                className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-900 dark:bg-zinc-700"
              >
                Minify (One line)
              </button>
              <button
                onClick={() => copyText(raw, "input")}
                className="rounded-md border px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {copied.input ? "Copied" : "Copy input"}
              </button>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-2 text-base font-medium text-zinc-900 dark:text-zinc-50">
              Tree view
            </h2>
            <div className="max-h-[22rem] overflow-auto rounded-md border p-3 dark:border-zinc-700">
              {jsonObj !== undefined ? (
                <JsonView data={jsonObj} style={styles} shouldExpandNode={() => true} />
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Waiting for valid JSON…</p>
              )}
            </div>

            <h2 className="mt-4 mb-2 text-base font-medium text-zinc-900 dark:text-zinc-50">
              Output
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  Formatted {formatted ? `(Length: ${formatted.length})` : ""}
                </label>
                <textarea
                  className="h-40 w-full resize-y rounded-lg border p-3 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  value={formatted}
                  readOnly
                />
                <button
                  onClick={() => copyText(formatted, "formatted")}
                  className="mt-2 rounded-md border px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {copied.formatted ? "Copied" : "Copy formatted"}
                </button>
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
                  Minified {minified ? `(Length: ${minified.length})` : ""}
                </label>
                <textarea
                  className="h-40 w-full resize-y rounded-lg border p-3 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  value={minified}
                  readOnly
                />
                <button
                  onClick={() => copyText(minified, "minified")}
                  className="mt-2 rounded-md border px-3 py-1.5 text-sm text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {copied.minified ? "Copied" : "Copy minified"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-xl border bg-white p-4 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          <ul className="list-disc pl-6">
            <li>Validate JSON (with line/column hints when available)</li>
            <li>
              Parse JSON strings that contain JSON (attempts one safe extra parse when applicable)
            </li>
            <li>Format (pretty print) and minify (one line)</li>
            <li>One-click copy for input/output</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
