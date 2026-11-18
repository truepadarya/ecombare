# Contact request form

Source: Figma `ofeZeqZ9BvoCmGhcd6F9T0`, node `1442:6338`.
Implementation: `src/components/content/ContactForm.astro`, inside the existing
Section on the home page. Uses ContentWrapper, Heading, Form, Input, Textarea,
ButtonWrapper and Button. The only custom layout rule caps the native wrapper
at 43rem (688px). Shared spacing, field geometry, colors and typography remain
the source of truth. The user's follow-up overrides the Figma Medium placeholder
weight with Regular, using the shared primitive through an opt-in field prop.

## Current behavior

- Name and email are required; company and message are optional.
- Native labels remain accessible when visually hidden. Inline errors are linked
  through aria-describedby without changing the field's accessible name. Autofill uses name,
  email and organization; no country, address, phone or location is requested.
- Limits: name 100, email 254, company 200, message 5000 characters. Names may
  contain Unicode, spaces, apostrophes and hyphens; a name must contain a letter,
  and whitespace-only names fail. Single-letter names remain valid.
- Contact validation uses English inline messages after blur or submit and clears
  corrected errors while typing. First invalid field receives focus on submit;
  a summary announces the failed validation. IME composition is respected.
  Native browser-localized validation popovers and the old title are replaced.
- Email requires a complete domain with valid labels, valid local-part syntax and
  length limits. This cannot establish mailbox existence or deliverability.
- A shared 30-second request timeout restores controls and retains entered data.
- No endpoint, captcha, third-party form script, custom analytics, local/session
  storage, geolocation lookup or persistence is added. Browser-managed autofill
  remains under the user's control.
- A valid submit produces an explicit unavailable/not-sent message and retains
  entered values. No request is made and no success is simulated. The button is
  enabled only after the shared submit handler is installed; without JavaScript
  it stays disabled and a noscript explanation is shown.
- FormData is not reflected into HTML. Textarea initial content uses escaped
  `set:text`, preventing both template whitespace and raw HTML insertion.

## Before enabling external delivery

This interface is not a completed server-side security or privacy implementation.
Client validation is a usability feature, not an enforcement boundary.

When connecting Web3Forms, verify its current response contract (including a
failed JSON result in a successful HTTP response), timeout/abort behavior,
offline/429/5xx cases, uncertain delivery and safe retry. Retain fields on errors;
clear them only after confirmed success. Test without delivering real requests.

Review provider-side validation, size limits, rate limits, domain restrictions
and server-verified captcha. Do not treat hidden fields or a public client-side
token as protection against direct API abuse. Do not expose private credentials
or place submitted personal data in URLs, application logs or analytics.

Confirm the responsible organization, recipient mailbox, processing purposes,
retention/deletion process, provider/subprocessors, hosting/processing locations
and any international transfers. Do not infer processing location from the
visitor's locale or the business being in Cyprus. Prepare an approved privacy
notice before collection is enabled. Do not invent a policy URL, consent text,
retention period or claim of compliance. Provider infrastructure may process
request metadata such as IP addresses even though this UI adds no location field.

References: [OWASP input validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html),
[MDN form validation](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation).

## Verification

`npm run test:contact-form`: widths 360, 390, 768, 1024, 1440 and 2500; 200% text;
accessible names; keyboard order; Unicode names; required, whitespace and email
validation; actual typed maxlength; Regular placeholders; initially empty
textarea; zero delivery; no HTML execution; retained data and no-JS guard.
Screenshots are in `.cache/contact-form`.

`npm run test:form` covers the shared controller with mocked requests:
missing action, POST/GET, submitter overrides, duplicate prevention, HTTP/network
failures, retry, disabled-state restoration, validation and confirmed-success reset.

`npm run test:contact-validation` exercises the pure validation rules, including
international and single-letter names, malformed email domains, punctuation,
control characters and lengths. Browser coverage additionally checks English
inline errors, aria-invalid, correction, focus and preventing invalid submission.
