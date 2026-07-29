/**
 * Paleta de cores da interface. Baseada na escala neutra "cod-gray" (50-950)
 * — todo tom de cinza usado no app deve vir de um desses 11 degraus, para
 * evitar a proliferação de cinzas quase-iguais espalhados pelos componentes.
 * Cores semânticas não-neutras (status verde/laranja/vermelho, acentos do
 * radar, badge "selecionado" etc.) ficam fora da escala, propositalmente.
 */
export const codGray = {
  50: "#fafafa",
  100: "#f5f5f5",
  200: "#e6e6e6",
  300: "#d3d3d3",
  400: "#a3a3a3",
  500: "#727272",
  600: "#535353",
  700: "#404040",
  800: "#272727",
  900: "#1a1a1a",
  950: "#0a0a0a",
} as const;

export const colors = {
  pageBackground: codGray[300],
  canvas: codGray[50],
  panel: codGray[200],

  ink: codGray[800],
  inkText: codGray[50],
  white: "#ffffff",

  buttonSecondary: codGray[300],
  buttonSecondaryBorder: codGray[300],
  buttonSecondaryHover: codGray[300],

  divider: codGray[300],

  tabBar: codGray[300],
  tabIdleText: codGray[600],

  inputField: codGray[200],
  addButton: codGray[300],
  addButtonHover: codGray[400],

  emptyIcon: codGray[500],
  emptyTitle: codGray[600],
  emptySubtitle: codGray[400],

  card: codGray[200],
  cardIcon: codGray[300],
  cardIconStroke: codGray[600],
  cardTitle: codGray[900],
  cardSubtitle: codGray[400],
  cardRemoveHover: codGray[100],
  cardRemoveStroke: codGray[600],

  dropZoneOuter: codGray[200],
  dropZoneInner: codGray[200],
  dropZoneOutline: codGray[400],
  dropZoneText: codGray[600],
  dropZoneActiveOutline: codGray[500],

  fileIconBg: codGray[100],
  fileIconBorder: codGray[300],
  fileIconTab: codGray[200],
  fileBadge: "#1e8f5b",
  fileName: codGray[700],
  fileRemoveText: codGray[500],

  toolButtonShadow: "rgba(0, 0, 0, 0.1)",
  toolIconStroke: codGray[700],

  secondarySend: codGray[300],
  secondarySendHover: codGray[300],
  secondarySendText: codGray[700],

  stepNumberBg: codGray[800],
  stepTitle: codGray[800],
  stepDesc: codGray[500],

  modalOverlay: "rgba(38, 38, 38, 0.42)",
  modalShadow: "rgba(0, 0, 0, 0.3)",
  modalBg: codGray[50],
  modalIconBg: codGray[800],

  historyItem: codGray[100],
  historyItemHover: codGray[200],
  historyDeleteHover: "#e0d3d3",
  historyDeleteStroke: "#b2544c",

  progressTrack: codGray[200],

  // Status de confiabilidade (tabela de resultados / cromatização de risco).
  statusHighConfidence: "#3aa657",
  statusReviewSuggested: "#e0932f",
  statusRiskAlert: "#d64545",

  sidebarCollapsed: codGray[200],
  navIdleBg: codGray[300],
  navIdleStroke: codGray[700],

  tableHeaderBg: codGray[300],
  tableRowAlt: codGray[100],
  tableBorder: codGray[200],
  tableDividerRow: codGray[200],
  tableRowHover: codGray[100],
  tableRowActive: "#d7e3f7",

  detailPanelBg: codGray[200],
  detailFooterBg: codGray[300],
} as const;

/**
 * Escala tipográfica modular (base 14px, razão 1.25 — "major third"). Todo
 * fontSize do app deve vir de um desses degraus, em vez de números soltos
 * (13, 15, 16, 24...) espalhados pelos componentes.
 */
export const fontSize = {
  xs: 9,
  sm: 11,
  cap: 12,
  base: 14,
  md: 18,
  lg: 22,
  xl: 27,
  "2xl": 34,
  "3xl": 43,
  "4xl": 53,
  "5xl": 66,
  "6xl": 83,
} as const;
