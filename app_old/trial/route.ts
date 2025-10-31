import { NextResponse } from "next/server";

export async function GET() {
  console.log("✅ API route hit!");
  return NextResponse.json({ ok: true, msg: "API route works" });
}