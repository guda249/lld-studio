import { useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { pageLink } from "../lib/site";
import { GOOGLE_FORM, type FormField, feedbackAddress, googleFormUrl } from "../config";

const KINDS = ["Wrong or unclear explanation", "Bug in the code example", "Diagram is wrong or hard to read", "Typo or grammar", "Quiz answer is wrong", "Something else"];

/**
 * "Suggest a correction". The site has no server. If the owner set up a Google Form (src/config.ts), "Send report"
 * posts the answers straight into it and the visitor stays on the page. Otherwise (and as a fallback) the button opens
 * the visitor's own email app with the report filled in, or they copy it.
 */
export default function Feedback() {
  const [params] = useSearchParams();
  const [page, setPage] = useState(params.get("title") ?? "");
  const url = params.get("page") ?? "";
  const [kind, setKind] = useState(KINDS[0]);
  const [wrong, setWrong] = useState("");
  const [fix, setFix] = useState("");
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const [tried, setTried] = useState(false);
  const wrongBox = useRef<HTMLTextAreaElement>(null);
  const address = feedbackAddress();
  const formUrl = googleFormUrl();
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");

  const subject = `[LLD Studio] ${kind}${page ? `: ${page}` : ""}`;
  const body = useMemo(() => [
    `Page: ${page || "(not given)"}`,
    url ? `Link: ${pageLink(url)}` : "",
    `Type: ${kind}`,
    "",
    "What's wrong:",
    wrong.trim(),
    "",
    "Suggested correction:",
    fix.trim() || "(none)",
    "",
    name.trim() ? `From: ${name.trim()}` : "",
    `Browser: ${navigator.userAgent}`
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n"), [page, url, kind, wrong, fix, name]);
  const mailto = address ? `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` : "";
  const tooLong = mailto.length > 1900;
  const ready = wrong.trim().length >= 5;

  const check = () => { setTried(true); if (!ready) { wrongBox.current?.focus(); return false; } return true; };
  async function send() {
    if (!check() || !formUrl || status === "sending") return;
    const values: Record<FormField, string> = {
      page: page.trim() || "(not given)", link: url ? pageLink(url) : "", kind,
      wrong: wrong.trim(), fix: fix.trim(), name: name.trim(), browser: navigator.userAgent
    };
    const data = new URLSearchParams();
    for (const [k, entry] of Object.entries(GOOGLE_FORM.fields)) if (entry && values[k as FormField]) data.append(entry, values[k as FormField]);
    setStatus("sending");
    try {
      // Google doesn't let other sites read its reply ("no-cors"), so a finished request is the best signal we get.
      await fetch(formUrl, { method: "POST", mode: "no-cors", body: data });
      setStatus("sent");
    } catch { setStatus("failed"); }
  }
  const another = () => { setWrong(""); setFix(""); setTried(false); setCopied(false); setStatus("idle"); };

  async function copy() {
    if (!check()) return;
    try { await navigator.clipboard.writeText(`To: ${address ?? "(see the site's About page)"}\nSubject: ${subject}\n\n${body}`); setCopied(true); }
    catch { setCopied(false); }
  }

  return (
    <div className="page">
      <div className="pattern-head">
        <h1>Suggest a correction</h1>
        <p className="lede">Found a mistake, a confusing explanation, broken code or a wrong quiz answer? Tell us and it gets fixed.{" "}
          {formUrl ? "Fill in the form and press Send: nothing else about you or your progress is shared." : "Nothing is sent from this page: the button opens your own email app with the report filled in, and you decide whether to send it."}</p>
      </div>
      {status === "sent" ? (
        <div className="card feedback-form" role="status">
          <h2 className="sent-h">Thank you, your report was sent.</h2>
          <p>It goes to the person who maintains these lessons. Fixes usually show up in the next update.</p>
          <div className="actions">
            <button type="button" className="btn primary" onClick={another}>Report something else</button>
            {url && <Link className="btn" to={url}>Back to {page || "the page"}</Link>}
          </div>
        </div>
      ) : (
      <form className="card feedback-form" onSubmit={(e) => e.preventDefault()} noValidate>
        <label><span className="lbl">Which page?</span>
          <input type="text" value={page} onChange={(e) => setPage(e.target.value)} placeholder="e.g. Strategy, UML Basics: Multiplicity" />
          {url && <span className="small-text muted-text">Link to the page is included: <code>{url}</code></span>}
        </label>
        <label><span className="lbl">What kind of problem?</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select>
        </label>
        <label><span className="lbl">What's wrong? <span className="req">(required)</span></span>
          <textarea ref={wrongBox} rows={5} value={wrong} onChange={(e) => setWrong(e.target.value)} aria-invalid={tried && !ready} aria-describedby="wrong-help"
            placeholder="Quote the sentence or line, and say what's wrong with it." />
          <span id="wrong-help" className={"small-text " + (tried && !ready ? "err" : "muted-text")}>{tried && !ready ? "Please describe the problem (a few words is fine)." : "Line numbers from the code panel help a lot."}</span>
        </label>
        <label><span className="lbl">Your suggested correction <span className="req">(optional)</span></span>
          <textarea rows={4} value={fix} onChange={(e) => setFix(e.target.value)} placeholder="How should it read instead?" />
        </label>
        <label><span className="lbl">Your name <span className="req">(optional, to credit you)</span></span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <div className="actions">
          {formUrl && <button type="button" className="btn primary" onClick={send} disabled={status === "sending"}>{status === "sending" ? "Sending…" : "Send report"}</button>}
          {address && <button type="button" className={"btn" + (formUrl ? "" : " primary")} data-mailto={ready ? mailto : ""}
            onClick={() => { if (check()) window.location.href = mailto; }}>Open in my email app</button>}
          <button type="button" className={"btn" + (address || formUrl ? "" : " primary")} onClick={copy}>{copied ? "Copied ✓" : "Copy the report"}</button>
        </div>
        {copied && <p className="notice" role="status">Copied. Paste it into an email{address ? <> to <strong>{address}</strong></> : ""}.</p>}
        {address && !formUrl && tooLong && <p className="small-text muted-text">Long reports may be cut off by some email apps. If that happens, use "Copy the report" and paste it into an email to <strong>{address}</strong>.</p>}
        {status === "failed" && <p className="notice warn" role="alert">The report couldn't be sent (are you offline?). Try again{address ? ", or use “Open in my email app”" : ""}.</p>}
        {!address && !formUrl && <p className="small-text muted-text">Reports aren't switched on for this copy of the site yet. Copy the report and send it to the site owner.</p>}
      </form>
      )}
      <p className="small-text muted-text">Your progress and code stay in your browser; only what you put in the email is shared. <Link to="/">Back to learning</Link></p>
    </div>
  );
}
