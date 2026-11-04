// Точечное применение auth-настроек (Site URL, redirect allow-list, шаблоны
// писем) к прод-проекту через Supabase Management API. `config push` не
// используем: config.toml дефолтный и затёр бы текущие настройки проекта.
//
// Токен: переменная окружения SUPABASE_ACCESS_TOKEN или gitignored-файл
// supabase/access-token. Получить: Dashboard → Account → Access tokens.
//
// Запуск: node supabase/scripts/apply-auth-settings.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_REF = "zgvolwclxwvboazhskio";
const SITE_URL = "https://shelf-life-guard.vercel.app";
const URI_ALLOW_LIST = [
  SITE_URL,
  "http://localhost:3000/auth/confirm",
  "http://127.0.0.1:3000/auth/confirm",
  "https://localhost:3000/auth/confirm",
  "https://127.0.0.1:3000/auth/confirm",
].join(",");

const here = dirname(fileURLToPath(import.meta.url));
const supabaseDir = join(here, "..");

function readToken() {
  if (process.env.SUPABASE_ACCESS_TOKEN) {
    return process.env.SUPABASE_ACCESS_TOKEN.trim();
  }
  const tokenFile = join(supabaseDir, "access-token");
  if (existsSync(tokenFile)) {
    return readFileSync(tokenFile, "utf8").trim();
  }
  console.error(
    "Не найден access-токен. Задайте SUPABASE_ACCESS_TOKEN или создайте " +
      "gitignored-файл supabase/access-token (Dashboard → Account → Access tokens).",
  );
  process.exit(1);
}

const token = readToken();
const authUrl = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

const get = await fetch(authUrl, { headers, signal: AbortSignal.timeout(30000) });
if (!get.ok) {
  console.error("GET config/auth:", get.status, await get.text());
  process.exit(1);
}
const current = await get.json();

const backupFile = join(supabaseDir, "auth-settings-backup.json");
writeFileSync(backupFile, JSON.stringify(current, null, 2));
console.log("Снимок текущих настроек сохранён:", backupFile);

const patchBody = {
  site_url: SITE_URL,
  uri_allow_list: URI_ALLOW_LIST,
  mailer_subjects_invite: "Приглашение в Shelf Life Guard",
  mailer_templates_invite_content: readFileSync(
    join(supabaseDir, "templates", "invite.html"),
    "utf8",
  ),
  mailer_subjects_recovery: "Сброс пароля Shelf Life Guard",
  mailer_templates_recovery_content: readFileSync(
    join(supabaseDir, "templates", "recovery.html"),
    "utf8",
  ),
  mailer_subjects_email_change: "Смена почты Shelf Life Guard",
  mailer_templates_email_change_content: readFileSync(
    join(supabaseDir, "templates", "email-change.html"),
    "utf8",
  ),
};

const patch = await fetch(authUrl, {
  method: "PATCH",
  headers,
  body: JSON.stringify(patchBody),
  signal: AbortSignal.timeout(30000),
});
if (!patch.ok) {
  console.error("PATCH config/auth:", patch.status, await patch.text());
  process.exit(1);
}

const check = await (await fetch(authUrl, { headers })).json();
const ok =
  check.site_url === SITE_URL &&
  check.uri_allow_list === URI_ALLOW_LIST &&
  check.mailer_templates_invite_content.includes("/auth/confirm?token_hash=") &&
  check.mailer_templates_recovery_content.includes("/auth/confirm?token_hash=") &&
  check.mailer_templates_email_change_content.includes(
    "/auth/confirm?token_hash=",
  );
console.log(
  ok
    ? "Применено и проверено: site_url, uri_allow_list, шаблоны invite/recovery/email_change."
    : "ВНИМАНИЕ: ответ не совпал с ожидаемым, проверьте auth-settings-backup.json",
);
