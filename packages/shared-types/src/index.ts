export type AuditStatus = "pending" | "approved" | "rejected";
export type DisplayStatus = "hidden" | "visible";

export interface ReflectionSummary {
  id: number;
  displayName: string;
  submitContent: string;
  submitTime: string;
  sourceGroupName: string | null;
  isFeatured: boolean;
  isTop: boolean;
  likeCount: number;
  liked?: boolean;
}

