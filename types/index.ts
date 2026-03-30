export interface CaRow {
  sales: number; decided: number; meetings: number; active: number;
  zuba?: number; cl?: number; focusCount?: number; interviewSet?: number;
}
export interface SegmentData { ca: CaRow[] }
export interface WeekData {
  overall: SegmentData; cs: SegmentData; csl: SegmentData;
  focusData: any[]; pjData: any[]; updatedAt?: string;
}
export const SC_CA_NAMES = ["清野","茨木","菊地","福田","大西","南原"] as const;
export const CS_CA_NAMES = ["中村","大城","小谷","喜多"] as const;
export function getCurrentWeek(): string {
  const d = new Date();
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0");
  const fd = new Date(y, d.getMonth(), 1).getDay();
  const w = Math.ceil((d.getDate()+fd)/7);
  return `${y}/${m}/${w}W`;
}
export function labelToKey(l: string) { return l.replace(/\//g,"_"); }
export function emptyWeekData(): WeekData {
  const emptyCa = () => ({ sales:0, decided:0, meetings:0, active:0, zuba:0, cl:0, focusCount:0, interviewSet:0 });
  return {
    overall: { ca: Array(6).fill(null).map(emptyCa) },
    cs: { ca: Array(6).fill(null).map(emptyCa) },
    csl: { ca: Array(4).fill(null).map(emptyCa) },
    focusData: [], pjData: []
  };
}
