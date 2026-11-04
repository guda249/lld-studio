/**
 * Site settings the owner may change.
 *
 * FEEDBACK: where "Suggest a correction" reports go by email. The address is stored in two parts and only joined in
 * the visitor's browser, so it never appears as plain text in the published files that spam bots scan.
 * Leave both empty to hide the email button (visitors can still copy their report).
 */
export const FEEDBACK = { user: "programmerskettle", domain: "gmail.com" };

export const feedbackAddress = (): string | null => (FEEDBACK.user && FEEDBACK.domain ? `${FEEDBACK.user}@${FEEDBACK.domain}` : null);

/**
 * GOOGLE_FORM: optional. When set, the Feedback page sends reports straight into the owner's free Google Form
 * (answers land in its Google Sheet) and the visitor never leaves the page. Email stays as the fallback.
 *
 * id: the long code in the form's share link, https://docs.google.com/forms/d/e/<id>/viewform
 * fields: the form's question ids ("entry.123456789"), one per question. Every question must be a
 * "Short answer" or "Paragraph" question (choice questions reject text they don't list). Empty ones are skipped.
 */
export const GOOGLE_FORM = {
  id: "1FAIpQLScjmaUFtI-WYJA1dNCOWdbAdNDRPH2t_qVJlt-GIzKkjuAerw",
  fields: {
    page: "entry.1024981128", link: "entry.1303468833", kind: "entry.1479817424", wrong: "entry.697358412",
    fix: "entry.1402833426", name: "entry.2112676488", browser: "entry.2057274335"
  }
};

export type FormField = keyof typeof GOOGLE_FORM.fields;
export const googleFormUrl = (): string | null =>
  GOOGLE_FORM.id && GOOGLE_FORM.fields.wrong ? `https://docs.google.com/forms/d/e/${GOOGLE_FORM.id}/formResponse` : null;

/**
 * MAKER: who made the site, shown as a small "Made by … on LinkedIn" note in the footer and on the About page.
 * linkedin: the full profile address, e.g. "https://www.linkedin.com/in/your-name". Leave empty to hide the note.
 */
export const MAKER = { name: "Uma Shanker Guda", linkedin: "https://www.linkedin.com/in/guda-uma-shanker/" };

/** REPO: the public source-code address (e.g. "https://github.com/<user>/lld-studio"), shown on the About page. */
export const REPO = "https://github.com/guda249/lld-studio";
