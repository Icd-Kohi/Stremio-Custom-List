const metadataBaseUrl = process.env.METADATA_BASE_URL || "https://v3-cinemeta.strem.io";
const metadataDisabled = process.env.DISABLE_REMOTE_METADATA === "1";

export async function resolveItemMetadata(stremioId, type) {
  if (metadataDisabled) {
    return { itemName: stremioId };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(`${metadataBaseUrl}/meta/${type}/${encodeURIComponent(stremioId)}.json`, {
      signal: controller.signal,
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      return { itemName: stremioId };
    }

    const payload = await response.json();
    const itemName = payload?.meta?.name?.trim();
    return { itemName: itemName || stremioId };
  } catch {
    return { itemName: stremioId };
  } finally {
    clearTimeout(timeout);
  }
}
