import React from "react";
import NavBar from "@/components/home/NavBar";
import Hero from "@/components/home/Hero";
import Modes from "@/components/home/Modes";
import Flow from "@/components/home/Flow";
import Legacy from "@/components/home/Legacy";
import Audiences from "@/components/home/Audiences";
import Project from "@/components/home/Project";
import Footer from "@/components/home/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main>
        <Hero />
        <Modes />
        <Flow />
        <Legacy />
        <Audiences />
        <Project />
      </main>
      <Footer />
    </div>
  );
}