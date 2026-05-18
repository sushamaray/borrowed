import { NextResponse } from "next/server";

const NOMINATIM = "https://nominatim.openstreetmap.org";
const HEADERS = {
  "User-Agent": "borrowed-app/1.0 (contact@borrowed.app)",
  "Accept-Language": "en",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    if (action === "search") {
      const q = searchParams.get("q");
      if (!q || q.trim().length < 2) {
        return NextResponse.json([]);
      }
      const url = `${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&countrycodes=bd`;
      const res = await fetch(url, { headers: HEADERS, next: { revalidate: 60 } });
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === "reverse") {
      const lat = searchParams.get("lat");
      const lon = searchParams.get("lon");
      if (!lat || !lon) {
        return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
      }
      const url = `${NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=json`;
      const res = await fetch(url, { headers: HEADERS });
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Geocode proxy error:", error);
    return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
  }
}
