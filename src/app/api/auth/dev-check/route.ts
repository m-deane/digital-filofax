import { NextResponse } from "next/server";

export async function GET() {
  const isDev = process.env.NODE_ENV === "development";
  const devAuthBypass = isDev && process.env.DEV_AUTH_BYPASS === "true";

  return NextResponse.json({ devAuthBypass });
}
