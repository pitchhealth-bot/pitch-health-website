import schema from "./schema.json";

type Filter = { conjunction?: string; filterSet?: Filter[]; fieldId?: string; operator?: string; value?: unknown };
export type SurveyField = { fieldId: string; label: string; fieldType: string; isRequired: boolean; options?: { choices: { id: string; name: string }[] }; visibilityFilters?: Filter };
export type SurveyAnswers = Record<string, string | string[]>;
export const fields = schema.sections.flatMap(section => section.rows.flatMap(row => row.elements)) as SurveyField[];
export const MODE_ID = "fldksabVKCXVgncmD";
export const QUICK = "Quick Feedback (Approximately 1 Minute)";
export const DETAILED = "Detailed Feedback (Approximately 3–4 Minutes)";
export const modeField = fields.find(field => field.fieldId === MODE_ID)!;
const choiceName = (value: unknown): string => (value as { choiceName?: string })?.choiceName || "";
function matches(filter: Filter, answers: SurveyAnswers): boolean {
  if (filter.filterSet) return filter.conjunction === "or"
    ? filter.filterSet.some(child => matches(child, answers))
    : filter.filterSet.every(child => matches(child, answers));
  const answer = answers[filter.fieldId || ""];
  if (filter.operator === "=") return answer === choiceName(filter.value);
  if (filter.operator === "isEmpty") return !answer || (typeof answer === "string" && !answer.trim());
  if (filter.operator === "|") return Array.isArray(answer) && Array.isArray(filter.value) && filter.value.some(value => answer.includes(choiceName(value)));
  return false;
}
export const visible = (field: SurveyField, answers: SurveyAnswers) => !field.visibilityFilters || matches(field.visibilityFilters, answers);
// Remove hidden answers repeatedly: removing a parent may hide another field.
export function pruneAnswers(answers: SurveyAnswers): SurveyAnswers {
  let next = { ...answers };
  for (let pass = 0; pass < fields.length; pass++) {
    const clean = Object.fromEntries(fields.filter(field => visible(field, next) && next[field.fieldId] !== undefined).map(field => [field.fieldId, next[field.fieldId]]));
    if (Object.keys(clean).length === Object.keys(next).length) return clean;
    next = clean;
  }
  return next;
}
export function validateAnswers(input: unknown): { fields?: SurveyAnswers; error?: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "Invalid survey answers." };
  const normalized: SurveyAnswers = {};
  for (const field of fields) {
    const raw = (input as Record<string, unknown>)[field.fieldId];
    if (raw === undefined || raw === "") continue;
    if (field.fieldType === "multipleSelects") {
      if (!Array.isArray(raw) || raw.length > 8 || raw.some(value => typeof value !== "string")) return { error: "Invalid plan issue selection." };
      normalized[field.fieldId] = [...new Set(raw)] as string[];
    } else {
      if (typeof raw !== "string" || raw.length > (field.fieldType === "multilineText" ? 3000 : 250)) return { error: `Please check: ${field.label}` };
      normalized[field.fieldId] = raw.trim();
    }
  }
  const clean = pruneAnswers(normalized);
  for (const field of fields.filter(field => visible(field, clean))) {
    const value = clean[field.fieldId];
    if (field.isRequired && (!value || value.length === 0)) return { error: `Please complete: ${field.label}` };
    if (!value || value.length === 0) { delete clean[field.fieldId]; continue; }
    if (field.options) {
      const options = new Set(field.options.choices.map(choice => choice.name));
      if ((Array.isArray(value) ? value : [value]).some(item => !options.has(item))) return { error: `Invalid selection: ${field.label}` };
    }
    if (field.fieldType === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) return { error: "Please enter a valid email address." };
    if (field.fieldType === "phoneNumber" && (!/^[+\d\s().-]{7,35}$/.test(String(value)) || String(value).replace(/\D/g, "").length < 7)) return { error: "Please enter a valid phone number." };
  }
  return { fields: clean };
}
