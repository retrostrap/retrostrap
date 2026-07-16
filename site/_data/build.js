// Global data: build-time facts for the footer's "Last updated" line.
const now = new Date();

export default {
  updated: now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  year: now.getFullYear(),
};
