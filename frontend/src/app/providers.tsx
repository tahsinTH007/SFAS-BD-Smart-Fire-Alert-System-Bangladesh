"use client";

import { useEffect } from "react";
import ReduxProvider from "@/redux/provider";
import { connectSocket } from "@/socket/socketClient";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    connectSocket();
  }, []);

  return <ReduxProvider>{children}</ReduxProvider>;
}
