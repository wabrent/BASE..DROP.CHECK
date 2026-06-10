import { NextRequest, NextResponse } from "next/server";
import { checkVerification, PROVIDERS, buildResourceUrns } from "@/lib/base-verify";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, signature, message, providers, traits } = body;

    if (!address || !signature || !message || !providers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const results = await checkVerification(address, signature, message, providers, traits || {});

    return NextResponse.json({ results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const providers = Object.entries(PROVIDERS).map(([id, p]) => ({
    id,
    name: p.name,
    icon: p.icon,
    traits: p.availableTraits,
  }));

  return NextResponse.json({ providers });
}
