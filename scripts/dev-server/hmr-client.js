const events = new EventSource("/__relement/events");

events.addEventListener("reload", () => window.location.reload());

events.addEventListener("update", async (event) => {
  try {
    const sourcePath = JSON.parse(event.data);

    if (typeof sourcePath !== "string" || !sourcePath.endsWith(".tsx")) {
      window.location.reload();
      return;
    }

    const moduleUrl = new URL(
      "/" + sourcePath.slice(0, -4) + ".js",
      window.location.origin,
    );
    moduleUrl.searchParams.set("t", String(Date.now()));

    await import(moduleUrl.href);
  } catch (error) {
    console.error("Relement HMR update failed; reloading the page.", error);
    window.location.reload();
  }
});
