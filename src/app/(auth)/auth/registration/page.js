"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The full registration wizard has moved to /auth/register
export default function OldRegistrationPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/auth/register");
  }, [router]);
  return null;
}