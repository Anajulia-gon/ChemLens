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
      title="Em breve"
      message={`A ação "${actionLabel}" ainda não está disponível. Estamos trabalhando nisso — em breve por aqui.`}
      onClose={onClose}
    />
  );
}
