import type { Metadata } from "next";
import CartExperience from "./CartExperience";

export const metadata: Metadata = {
  title: "MORI Cart 03 — 移动边柜拆解展示",
  description:
    "一台融合胡桃木、藤编与黄铜结构的移动边柜，以滚动交互展示每一个组成部件。",
};

export default function Home() {
  return <CartExperience />;
}
