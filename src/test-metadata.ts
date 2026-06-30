async function getProjectFromMetadata() {
  try {
    const response = await fetch("http://metadata.google.internal/computeMetadata/v1/project/project-id", {
      headers: { "Metadata-Flavor": "Google" }
    });
    const projectId = await response.text();
    console.log("ACTUAL GCP PROJECT ID FROM METADATA SERVER:", projectId);
  } catch (err: any) {
    console.error("Failed to query metadata server:", err.message);
  }
}

getProjectFromMetadata();
