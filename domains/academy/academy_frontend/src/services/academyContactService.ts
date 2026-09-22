import emailjs from "@emailjs/browser";

export interface AcademyContactParams {
  name: string;
  email: string;
  organization?: string;
  phone?: string;
  country?: string;
  service_interest?: string;
  message: string;
  source_page?: string;
  target_email?: string;
}

export async function sendAcademyContact(params: AcademyContactParams) {
  const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "";
  const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID_ORG || "";
  const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "";

  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    throw new Error("EmailJS service ID, template ID, or public key is missing from environment variables.");
  }

  const recipientEmail = params.target_email || "academy@alikohub.com";

  const emailSubject = params.service_interest
    ? `Academy Inquiry: ${params.service_interest} - ${params.name.trim()}`
    : `New Academy Contact Submission from ${params.name.trim()}`;

  const templateParams = {
    to_email: recipientEmail,
    to_name: "AlikoHub Academy Team",
    from_name: params.name.trim(),
    from_email: params.email.trim(),
    reply_to: params.email.trim(),
    name: params.name.trim(),
    email: params.email.trim(),
    phone: params.phone ? params.phone.trim() : "N/A",
    organization: params.organization ? params.organization.trim() : "N/A",
    role: "N/A",
    country: params.country ? params.country.trim() : "N/A",
    service_interest: params.service_interest ? params.service_interest.trim() : "N/A",
    partnership_interest: params.service_interest ? params.service_interest.trim() : "N/A",
    subject: emailSubject,
    message: params.message.trim(),
    user_message: params.message.trim(),
    full_name: params.name.trim(),
    user_email: params.email.trim(),
    source_page: params.source_page || "contact",
  };

  const result = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
  return result;
}
