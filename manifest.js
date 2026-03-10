export function buildManifest({ lists }) {
  const catalogs = [];

  for (const list of lists) {
    const types = list.type === "both" ? ["movie", "series"] : [list.type];
    for (const type of types) {
      catalogs.push({
        type,
        id: `list_${list.id}`,
        name: list.name,
        extra: [{ name: "search", isRequired: false }],
        extraSupported: ["search"]
      });
    }
  }

  return {
    id: "com.stremio.customlists",
    version: "1.0.0",
    name: "Custom Lists",
    description: "Personal custom lists exposed as Stremio catalogs.",
    resources: ["catalog"],
    types: ["movie", "series"],
    catalogs,
    behaviorHints: { configurable: false }
  };
}
