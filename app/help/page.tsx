import { Metadata } from "next";
import HelpCenterClient from "@/components/help/HelpCenterClient";

export const metadata: Metadata = {
  title: "Help Center | MyHarvestHub",
  description: "Find answers to common questions and get help with your MyHarvestHub experience.",
};

export default function HelpCenterPage() {
  return <HelpCenterClient />;
}
