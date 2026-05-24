export async function getUserLocation(): Promise<string> {
  try {
    const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
    if (!res.ok) throw new Error("Network response was not ok");
    const data = await res.json();
    return data.country || "Hollywood";
  } catch (error) {
    console.warn("Failed to fetch user location, defaulting to Hollywood:", error);
    return "Hollywood";
  }
}
