import sanitizeHtml from "sanitize-html";

/**
 * ✅ Product description/additionalInfo rich text sanitizer
 * Admin panel এর TipTap এডিটর থেকে আসা HTML সেভ করার আগে এখানে ফিল্টার করা হয় —
 * script/iframe/event-handler ইত্যাদি বিপজ্জনক কিছু ঢুকলেও তা বাদ পড়ে যায়,
 * শুধু bold/italic/underline/color/heading/list/link এর মতো ফরম্যাটিং ট্যাগ টিকে থাকে।
 */
const RICH_TEXT_OPTIONS = {
  allowedTags: [
    "p",
    "br",
    "b",
    "strong",
    "i",
    "em",
    "u",
    "s",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "blockquote",
    "a",
    "span",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    span: ["style"],
  },
  allowedStyles: {
    span: {
      color: [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/, /^rgba\(/],
    },
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      target: "_blank",
      rel: "noopener noreferrer",
    }),
  },
};

// ✅ TipTap/contenteditable একাধিক স্পেস চাপলে সেটা আটকে না গিয়ে দেখানোর জন্য
// non-breaking space (কোড ১৬০) বসিয়ে দেয় — এটা সাধারণ স্পেসের চেয়ে চওড়া
// এবং justify করার সময় আরও বেশি ফাঁকা দেখায়। তাই সবসময় সাধারণ স্পেসে normalize
// করে দেওয়া হয় — বেশি ফাঁকা লাগলে ইউজার নতুন প্যারাগ্রাফ/লাইন ব্যবহার করবে।
const NBSP_CHAR = String.fromCharCode(160);

function normalizeSpaces(html) {
  const collapsed = html.split(NBSP_CHAR).join(String.fromCharCode(32));
  return collapsed
    .replace(/&nbsp;/gi, String.fromCharCode(32))
    .replace(/[\t ]{2,}/g, String.fromCharCode(32));
}

export function sanitizeRichText(html) {
  if (!html) return "";
  return normalizeSpaces(sanitizeHtml(String(html), RICH_TEXT_OPTIONS)).trim();
}
