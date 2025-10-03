"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

import { staggerChildren } from "@/utils/motion";

export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.45 } }}
        exit={{ opacity: 0, y: -12, transition: { duration: 0.35 } }}
        variants={staggerChildren}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
