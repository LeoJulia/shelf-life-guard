export function isInviteAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  const admins = (process.env.INVITE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}
