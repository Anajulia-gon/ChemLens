/**
 * Paleta de cores da interface, extraída do design (Claude Design: "Gerador de Smiles").
 * São os mesmos tons de cinza (+ dois acentos semânticos) usados no mock, apenas
 * nomeados por função para não espalhar hex codes pelos componentes.
 */
export const colors = {
  pageBackground: "rgb(210, 210, 210)",
  canvas: "#fbfbfb",
  panel: "#e9e9e9",

  ink: "#262626",
  inkText: "#fafafa",
  white: "#ffffff",

  buttonSecondary: "#d6d6d6",
  buttonSecondaryBorder: "#cccccc",
  buttonSecondaryHover: "#cfcfcf",

  divider: "#d2d2d2",

  tabBar: "#d8d8d8",
  tabIdleText: "#4a4a4a",

  inputField: "#eef0f2",
  addButton: "#bcc1c7",
  addButtonHover: "#b0b6bd",

  emptyIcon: "#7c7c7c",
  emptyTitle: "#606060",
  emptySubtitle: "#9a9a9a",

  card: "#dedede",
  cardIcon: "#cbcbcb",
  cardIconStroke: "#555555",
  cardTitle: "#1f1f1f",
  cardSubtitle: "#8f8f8f",
  cardRemoveHover: "#f0f0f0",
  cardRemoveStroke: "#5a5a5a",

  dropZoneOuter: "#e2e2e2",
  dropZoneInner: "#eaeaea",
  dropZoneOutline: "#b3b3b3",
  dropZoneText: "#5a5a5a",
  dropZoneActiveOutline: "#8a8a8a",

  fileIconBg: "#f4f5f7",
  fileIconBorder: "#c2c2c2",
  fileIconTab: "#e2e4e8",
  fileBadge: "#1e8f5b",
  fileName: "#3a3a3a",
  fileRemoveText: "#8a8a8a",

  toolButtonShadow: "rgba(0, 0, 0, 0.1)",
  toolIconStroke: "#3a3a3a",

  secondarySend: "#c9c9c9",
  secondarySendHover: "#bfbfbf",
  secondarySendText: "#3a3a3a",

  stepNumberBg: "#262626",
  stepTitle: "#262626",
  stepDesc: "#8a8a8a",

  modalOverlay: "rgba(38, 38, 38, 0.42)",
  modalShadow: "rgba(0, 0, 0, 0.3)",
  modalBg: "#fbfbfb",
  modalIconBg: "#262626",

  historyItem: "#efefef",
  historyItemHover: "#e6e6e6",
  historyDeleteHover: "#e0d3d3",
  historyDeleteStroke: "#b2544c",

  progressTrack: "#e2e2e2",
} as const;
