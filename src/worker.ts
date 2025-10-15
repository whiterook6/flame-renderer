/* global self */

// Web Worker for heavy calculations
self.addEventListener("message", (event: { data: any }) => {
  // Handle incoming messages
  switch (event.data.type) {
    default:
      console.error("Unknown message type:", event.data);
      break;
  }
});
