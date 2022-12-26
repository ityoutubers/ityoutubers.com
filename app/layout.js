"use client";

import "../styles/globals.css";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

function Navigation() {
  const pathname = usePathname();

  return (
    <div className="main-menu">
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

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <div className="prose max-w-none">
          <div className="container mx-auto pb-20 px-5">
            <div className="grid md:grid-cols-2">
              <div className="not-prose">
                <Link href="/">
                  <Image
                    width="400"
                    height="98"
                    alt="IT Youtubers"
                    src="/ityoutubers-logo.jpg"
                  />
                </Link>
              </div>
              <Navigation />
            </div>

            {children}

            <p className="pt-5 mt-20">
              <a
                className="not-prose float-right leading-6"
                href="https://github.com/ityoutubers/ityoutubers.com"
              >
                <Image
                  alt=""
                  className="inline"
                  width={21}
                  height={20.5}
                  src="/github-mark.svg"
                />
              </a>{" "}
              <a href="https://boosty.to/seniorsoftwarevlogger">Поддержать</a>{" "}
              развитие проекта. Сделано с помощью 💩 🪵 🌀 в 2022.{" "}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
