"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <div className="main-menu text-sm md:text-base lg:text-lg">
      <Link className={pathname == "/" ? "active" : ""} href="/">
        Сообщество
      </Link>
      <Link className={pathname == "/learn" ? "active" : ""} href="/learn">
        Обучение
      </Link>
      <Link
        className={pathname == "/all-channels" ? "active" : ""}
        href="/all-channels"
      >
        Все видео и каналы
      </Link>
    </div>
  );
}
