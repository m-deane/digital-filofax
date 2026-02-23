"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const SNOOZE_KEY = "filofax-pwa-prompt-snoozed";
const SNOOZE_DAYS = 7;

export function PwaInstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;

    // iOS Safari only — not Chrome, Firefox, Edge etc on iOS
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !/MSStream/.test(ua);
    const isSafari =
      /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome/.test(ua);

    // Already running as installed PWA
    const isStandalone =
      ("standalone" in navigator &&
        (navigator as { standalone?: boolean }).standalone === true) ||
      window.matchMedia("(display-mode: standalone)").matches;

    if (!isIOS || !isSafari || isStandalone) return;

    // Respect snooze
    const snoozedUntil = localStorage.getItem(SNOOZE_KEY);
    if (snoozedUntil && Date.now() < Number(snoozedUntil)) return;

    const timer = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem(
      SNOOZE_KEY,
      String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000),
    );
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 pb-6 animate-in slide-in-from-bottom duration-300">
      <div className="bg-card border rounded-xl shadow-lg p-4 flex items-start gap-3 max-w-sm mx-auto">
        <div className="flex-shrink-0 w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-lg select-none">
          F
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Add to Home Screen</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Tap{" "}
            <Share className="inline h-3.5 w-3.5 mx-0.5 align-text-bottom" />{" "}
            then <strong>Add to Home Screen</strong> for a fullscreen app
            experience.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0 -mt-1 -mr-1"
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
