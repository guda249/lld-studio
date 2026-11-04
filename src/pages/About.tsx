import { Link } from "react-router-dom";
import libs from "virtual:licences";
import { GOOGLE_FORM, MAKER, REPO, feedbackAddress } from "../config";
import MadeBy from "../components/MadeBy";

/** About, privacy and licences. Keep the privacy list true: update it whenever the site starts sending anything new. */
export default function About() {
  const formOn = Boolean(GOOGLE_FORM.id);
  const email = feedbackAddress();
  return (
    <div className="page about">
      <div className="pattern-head">
        <h1>About LLD Studio</h1>
        <p className="lede">A free place to learn Low-Level Design: UML, the SOLID principles and design patterns, explained with animations, quizzes, case studies and code you can run in Python and Scala.</p>
      </div>

      <section className="card">
        <h2>What's here</h2>
        <ul>
          <li><Link to="/uml">UML Basics</Link>: nine short lessons, from class boxes to use-case diagrams, plus a <Link to="/uml/notation">notation lab</Link>.</li>
          <li><Link to="/solid">OOP &amp; SOLID</Link> and <Link to="/anti-patterns">anti-patterns</Link>: the principles patterns are built on, and what goes wrong without them.</li>
          <li><Link to="/patterns">26 design patterns</Link> (the 22 classic ones and 4 for concurrency), each with an animated story, a class diagram, code, a quiz and flashcards.</li>
          <li><Link to="/compare">Comparisons</Link> of look-alike patterns, <Link to="/case-studies">case studies</Link> and <Link to="/katas">refactoring katas</Link> checked in the <Link to="/scratch-pad">scratch pad</Link>.</li>
        </ul>
        <p>Every Python example runs on Python 3.12 and every Scala example compiles and runs on Scala 3. The lessons, code and diagrams are written for LLD Studio.</p>
      </section>

      <section className="card">
        <h2>Your privacy</h2>
        <p>There are no accounts, no cookies, no ads and no tracking. The site is a set of files your browser downloads once; after that everything runs on your device.</p>
        <ul>
          <li><strong>Your progress stays in this browser:</strong> quiz scores, flashcards, scratch-pad code and drafts are saved in this browser's storage on this device. Nothing about them is sent anywhere. Clearing the site's data in your browser removes them.</li>
          <li><strong>The scratch-pad review runs in your browser.</strong> Your code is read on your device and never uploaded or run.</li>
          <li><strong>Fonts and libraries come from this site</strong>, not from other servers.</li>
          <li><strong>Only a correction you choose to send leaves your device.</strong>{" "}
            {formOn
              ? <>When you press "Send report" on the <Link to="/feedback">feedback page</Link>, what you typed there, the page link and your browser name go to a Google Form owned by the site's maintainer (Google's privacy policy applies to that form).</>
              : <>The <Link to="/feedback">feedback page</Link> only fills in an email for you; you decide whether to send it.</>}
            {email && <> If you use "Open in my email app", the report is sent from your own email account like any other email.</>}
          </li>
        </ul>
      </section>

      <section className="card">
        <h2>{MAKER.linkedin ? "Who made it, and found a mistake?" : "Found a mistake?"}</h2>
        {MAKER.linkedin && <p><MadeBy /></p>}
        <p>Every page has a "Report a mistake on this page" button at the bottom, or use the <Link to="/feedback">feedback page</Link>. Corrections are very welcome.</p>
      </section>

      <section className="card" id="licence">
        <h2>Licence: how you may reuse this</h2>
        <p>
          The lessons, quizzes, diagrams and the Python and Scala examples in them are © 2026 {MAKER.name || "the author"} and licensed under{" "}
          <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer license">Creative Commons BY-NC-SA 4.0</a>.
        </p>
        <ul>
          <li><strong>You may</strong> share them and adapt them, for example in study notes, a class or a talk.</li>
          <li><strong>Give credit</strong>: "LLD Studio by {MAKER.name || "the author"}", with a link to this site and the licence, and say what you changed.</li>
          <li><strong>Not commercially</strong>: don't sell it or put it in paid courses or ad-supported pages.</li>
          <li><strong>Share alike</strong>: anything you build from it uses the same licence.</li>
        </ul>
        <p>
          The app's own source code is under the MIT licence{REPO ? <> and is <a href={REPO} target="_blank" rel="noopener noreferrer">on GitHub</a></> : ""}.
          For uses the licence doesn't cover, ask through the <Link to="/feedback">feedback page</Link>.
        </p>
      </section>

      <section className="card">
        <h2>Open-source libraries and fonts</h2>
        <p>LLD Studio is built with these free libraries and fonts. Thank you to their authors.</p>
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Libraries and licences">
          <table className="licences">
            <thead><tr><th scope="col">Name</th><th scope="col">Version</th><th scope="col">Licence</th></tr></thead>
            <tbody>
              {libs.map((l) => (
                <tr key={l.name}>
                  <td>{l.url ? <a href={l.url} target="_blank" rel="noopener noreferrer">{l.name}</a> : l.name}</td>
                  <td>{l.version}</td>
                  <td>{l.license}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small-text muted-text">MIT and OFL-1.1 are open-source licences that allow free use. GSAP (animations) is free to use under its own licence.</p>
      </section>
    </div>
  );
}
