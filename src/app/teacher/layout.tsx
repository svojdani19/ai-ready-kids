import { getDb } from "@/lib/db";
import { requireStaff } from "@/lib/auth/session";
import { getSchool } from "@/lib/repo/school";
import { StaffShell, type NavItem } from "@/components/staff/StaffShell";

const NAV: NavItem[] = [
  { href: "/teacher", label: "Overview" },
  { href: "/teacher/missions", label: "Mission library" },
  { href: "/teacher/certification", label: "Certification" },
];

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireStaff();
  const school = getSchool(getDb(), user.school_id)!;

  const nav =
    user.role === "admin" ? [...NAV, { href: "/admin", label: "← Administrator view" }] : NAV;

  return (
    <StaffShell school={school} user={user} nav={nav} area="Teacher">
      <main id="main">{children}</main>
    </StaffShell>
  );
}
