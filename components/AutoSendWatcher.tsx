"use client";

import { useEffect } from "react";

export default function AutoSendWatcher() {
  useEffect(() => {
    async function runAutoSend() {
      try {
        await fetch("/api/auto-send");
        console.log("Auto send checked");
      } catch (error) {
        console.log("Auto send error", error);
      }
    }

    runAutoSend();

    const interval = setInterval(runAutoSend, 60000);

    return () => clearInterval(interval);
  }, []);

  return null;
}