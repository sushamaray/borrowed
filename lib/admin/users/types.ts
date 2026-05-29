export interface UserListItem {
  id: string;
  name: string;
  initials: string;
  email: string;
  location: string | null;
  isAdmin: boolean;
  trustScore: number;
  verificationCount: number;
  verifications: {
    identity: boolean;
    contact: boolean;
    id: boolean;
    address: boolean;
    meetup: boolean;
  };
  counts: {
    products: number;
    borrows: number;
    lends: number;
    disputes: number;
  };
  joinedAt: string;
}

export interface UserCheckout {
  id: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  totalPrice: number | null;
  createdAt: string;
  itemName: string;
  counterpartyName: string;
}

export interface UserDispute {
  id: string;
  status: string;
  depositAmount: number;
  raisedAt: string;
  title: string;
  itemName: string;
  role: "borrower" | "lender";
}

export interface UserDetail {
  id: string;
  name: string;
  initials: string;
  email: string;
  phoneNumber: string | null;
  location: string | null;
  profilePicture: string | null;
  isAdmin: boolean;
  createdAt: string;
  trustScore: number;
  verifications: {
    identity: boolean;
    contact: boolean;
    id: boolean;
    address: boolean;
    meetup: boolean;
    verifiedAt: string | null;
  };
  idVerification: {
    status: string;
    faceMatchScore: number | null;
    submittedAt: string;
    reviewedAt: string | null;
    hasFront: boolean;
    hasBack: boolean;
    hasSelfie: boolean;
  } | null;
  products: {
    id: string;
    name: string;
    category: string;
    pricePerDay: number;
    imageUrl: string | null;
    createdAt: string;
  }[];
  lentItems: {
    id: string;
    productName: string;
    status: string;
    createdAt: string;
  }[];
  checkoutsAsBorrower: UserCheckout[];
  checkoutsAsLender: UserCheckout[];
  borrowRequests: {
    id: string;
    title: string;
    category: string | null;
    budgetPerDay: number | null;
    neededFrom: string;
    neededUntil: string;
    status: string;
  }[];
  borrowRequestOffers: {
    id: string;
    status: string;
    createdAt: string;
    productName: string;
    requestTitle: string;
  }[];
  disputes: UserDispute[];
  reports: {
    id: string;
    reason: string;
    description: string | null;
    status: string;
    createdAt: string;
    reporterName: string;
    reporterId: string;
  }[];
  trailEntries: {
    id: string;
    itemRating: number;
    useFor: string;
    location: string | null;
    tags: unknown;
    isPublic: boolean;
    anonymous: boolean;
    createdAt: string;
    productName: string | null;
  }[];
  mentorBookings: {
    id: string;
    sessionFormat: string;
    scheduledAt: string | null;
    status: string;
    mentorName: string;
  }[];
  cartItems: {
    id: string;
    days: number;
    addedAt: string;
    itemName: string;
  }[];
  counts: {
    products: number;
    borrows: number;
    lends: number;
    disputes: number;
    borrowRequests: number;
    trailEntries: number;
    reports: number;
  };
}
