"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

export default function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function updateTime() {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      );
    }

    updateTime();

    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute right-5 top-5 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-text-secondary shadow-sm sm:right-8 sm:top-7">
      <Clock3 size={18} />

      <time suppressHydrationWarning>{time || "--:--"}</time>
    </div>
  );
}
