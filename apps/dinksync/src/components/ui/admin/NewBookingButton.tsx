"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NewBookingModal } from "@/components/ui/admin/NewBookingModal";
import type { CourtOption } from "@/components/ui/admin/NewBookingModal";

export function NewBookingButton({ courts }: { courts: CourtOption[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="shrink-0 cursor-pointer"
      >
        <Plus className="w-4 h-4 mr-2" /> New Booking
      </Button>

      <NewBookingModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        courts={courts}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </>
  );
}
