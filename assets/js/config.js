/**
 * Site settings — edit these values, nothing else needs to change.
 *
 * formEndpoint: where enquiries are sent. Uses FormSubmit (https://formsubmit.co),
 *               which emails each enquiry to the address in the URL — no account needed.
 *               The very first enquiry triggers a one-time "Activate form" email to that
 *               address; click the button in it and all later enquiries arrive directly.
 *               Leave empty and the form instead helps the visitor email / WhatsApp you.
 */
window.SITE_CONFIG = {
  email: "vaishnavi.s.pawar@gmail.com",
  phone: "",          // e.g. "+353 87 123 4567"
  whatsapp: "",       // number in international format, digits only, e.g. "353871234567"
  instagram: "tales_by_vassu",
  formEndpoint: "https://formsubmit.co/ajax/vaishnavi.s.pawar@gmail.com"
};
