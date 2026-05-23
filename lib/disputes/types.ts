export type DisputeParty = {
  id: string;
  name: string;
  initials: string;
  trustScore: number;
  borrowCount: number;
  lendCount: number;
  memberSince: string;
};

export type DisputeEventItem = {
  id: string;
  type: string;
  actorRole: "borrower" | "lender" | "admin" | "system";
  actorName: string;
  body?: string | null;
  createdAt: string;
};

export type DisputeResolutionShape = {
  decisionType: "RELEASE_TO_LENDER" | "RETURN_TO_BORROWER" | "SPLIT";
  amountToLender?: number | null;
  amountToBorrower?: number | null;
  justification: string;
  resolvedAt: string;
  resolvedByName: string;
};

export type DisputeListItem = {
  id: string;
  status: string;
  itemName: string;
  itemCategory: string;
  depositAmount: number;
  raisedAt: string;
  borrower: { name: string; initials: string };
  lender: { name: string; initials: string };
  aiVerdict?: string | null;
};

export type DisputeDetail = {
  id: string;
  status: string;
  title: string;
  description: string;
  depositAmount: number;
  raisedAt: string;
  itemName: string;
  itemCategory: string;
  itemImageUrl?: string | null;
  borrower: DisputeParty;
  lender: DisputeParty;
  aiVerdict?: string | null;
  aiConfidence?: number | null;
  aiNotes?: string | null;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  events: DisputeEventItem[];
  resolution?: DisputeResolutionShape | null;
};
