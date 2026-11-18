// src/app/api/geo/zip/route.ts
//
// GET /api/geo/zip?zip=71101 → { zip, lat, lon, city, state }
// Turns a U.S. ZIP code into coordinates for the distance filter.
// Uses the free Zippopotam.us service (no key) and caches each ZIP for 30 days.
// The client falls back to its built-in ZIP-prefix table if this fails.

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const zip = (req.nextUrl.searchParams.get('zip') || '').trim();
  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: 'A 5-digit ZIP code is required' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      next: { revalidate: 60 * 60 * 24 * 30 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'ZIP code not found' }, { status: 404 });
    }
    const data = await res.json();
    const place = data?.places?.[0];
    const lat = parseFloat(place?.latitude);
    const lon = parseFloat(place?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ error: 'ZIP code not found' }, { status: 404 });
    }
    return NextResponse.json(
      { zip, lat, lon, city: place['place name'], state: place['state abbreviation'] },
      { headers: { 'Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=86400' } }
    );
  } catch {
    return NextResponse.json({ error: 'Geocoding unavailable' }, { status: 502 });
  }
}
