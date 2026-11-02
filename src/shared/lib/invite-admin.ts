export function isInviteAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  const target = email.toLowerCase();
  return (process.env.INVITE_ADMIN_EMAILS ?? "")
    .split(",")
    .some((value) => value.trim().toLowerCase() === target);
}
