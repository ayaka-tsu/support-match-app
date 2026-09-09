"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Props = {
  userId: string;
  initialSupportAvailable: boolean;
};

export default function SupportAvailableToggle({
  userId,
  initialSupportAvailable,
}: Props) {
  const [supportAvailable, setSupportAvailable] = useState(
    initialSupportAvailable,
  );


  useEffect(() => {
    const fetchSupportAvailable = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("support_available")
        .eq("id", userId)
        .single();

      if (error) {
        console.error(error.message);
        return;
      }

      setSupportAvailable(data.support_available);
    };

    fetchSupportAvailable();
  }, [userId]);

  const handleChange = async () => {
    const nextValue = !supportAvailable;

    setSupportAvailable(nextValue);

    const { error } = await supabase
      .from("profiles")
      .update({ support_available: nextValue })
      .eq("id", userId);

    if (error) {
      console.error(error.message);
      setSupportAvailable(!nextValue);
    }
  };
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-center text-sm text-stone-600">
        {supportAvailable ? "ON" : "OFF"}
      </span>
      <button
        type="button"
        onClick={handleChange}
        className={`relative h-7 w-12 rounded-full transition-colors ${
          supportAvailable ? "bg-[#d9a3a3]" : "bg-stone-300"
        }`}
        aria-label={
          supportAvailable
            ? "サポート可能をオフにする"
            : "サポート可能をオンにする"
        }
      >
        <span
          className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            supportAvailable ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
