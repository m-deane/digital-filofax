import { redirect } from "next/navigation";

// A filofax opens to today's page - redirect to the Daily Planner
export default function DashboardPage() {
  redirect("/dashboard/daily");
}
