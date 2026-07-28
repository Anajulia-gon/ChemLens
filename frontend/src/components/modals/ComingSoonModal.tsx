"use client";

import { colors } from "@/lib/theme";
import { ClockIcon } from "../icons";
import { MessageModal } from "./MessageModal";

interface ComingSoonModalProps {
  actionLabel: string | null;
  onClose: () => void;
}

export function ComingSoonModal({ actionLabel, onClose }: ComingSoonModalProps) {
  return (
    <MessageModal
      isOpen={!!actionLabel}
      icon={<ClockIcon size={36} color={colors.white} strokeWidth={1.6} />}
      title="Coming soon"
      message={`The "${actionLabel}" action isn't available yet. We're working on it — coming soon.`}
      onClose={onClose}
    />
  );
}
