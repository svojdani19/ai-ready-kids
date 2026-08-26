import { getDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { getSchool } from "@/lib/repo/school";
import { StaffShell, type NavItem } from "@/components/staff/StaffShell";

const NAV: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/benchmarks", label: "Benchmarks" },
  { href: "/admin/classes", label: "Classes" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/program", label: "Program & plan" },
  { href: "/admin/data", label: "Data & retention" },
  { href: "/admin/report", label: "School report" },
  { href: "/teacher", label: "→ Teacher view" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  const school = getSchool(getDb(), user.school_id)!;

  return (
    <StaffShell school={school} user={user} nav={NAV} area="Administrator">
      <main id="main">{children}</main>
    </StaffShell>
  );
}
