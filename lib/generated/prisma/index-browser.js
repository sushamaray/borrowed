
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  firstName: 'firstName',
  lastName: 'lastName',
  userName: 'userName',
  email: 'email',
  emailVerified: 'emailVerified',
  image: 'image',
  location: 'location',
  latitude: 'latitude',
  longitude: 'longitude',
  password: 'password',
  profilePicture: 'profilePicture',
  phoneNumber: 'phoneNumber',
  identityVerified: 'identityVerified',
  contactVerified: 'contactVerified',
  idVerified: 'idVerified',
  addressVerified: 'addressVerified',
  meetupVerified: 'meetupVerified',
  verifiedAt: 'verifiedAt',
  isAdmin: 'isAdmin',
  createdAt: 'createdAt'
};

exports.Prisma.ProductScalarFieldEnum = {
  id: 'id',
  slug: 'slug',
  name: 'name',
  category: 'category',
  subcategory: 'subcategory',
  location: 'location',
  pricePerDay: 'pricePerDay',
  deposit: 'deposit',
  description: 'description',
  features: 'features',
  drawbacks: 'drawbacks',
  imageUrl: 'imageUrl',
  compensationMajor: 'compensationMajor',
  compensationMinor: 'compensationMinor',
  lenderNote: 'lenderNote',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ProductImageScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  data: 'data',
  mimeType: 'mimeType',
  order: 'order'
};

exports.Prisma.ConditionPhotoScalarFieldEnum = {
  id: 'id',
  checkoutId: 'checkoutId',
  role: 'role',
  data: 'data',
  mimeType: 'mimeType',
  createdAt: 'createdAt'
};

exports.Prisma.LentItemScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  lenderId: 'lenderId',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BorrowRequestScalarFieldEnum = {
  id: 'id',
  requesterId: 'requesterId',
  title: 'title',
  category: 'category',
  description: 'description',
  location: 'location',
  neededFrom: 'neededFrom',
  neededUntil: 'neededUntil',
  budgetPerDay: 'budgetPerDay',
  status: 'status',
  isPrivate: 'isPrivate',
  targetUserId: 'targetUserId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BorrowRequestOfferScalarFieldEnum = {
  id: 'id',
  borrowRequestId: 'borrowRequestId',
  productId: 'productId',
  lenderId: 'lenderId',
  message: 'message',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.BorrowCheckoutScalarFieldEnum = {
  id: 'id',
  borrowerId: 'borrowerId',
  lenderId: 'lenderId',
  productId: 'productId',
  lentItemId: 'lentItemId',
  borrowRequestOfferId: 'borrowRequestOfferId',
  originType: 'originType',
  startDate: 'startDate',
  endDate: 'endDate',
  totalPrice: 'totalPrice',
  deposit: 'deposit',
  notes: 'notes',
  damageReport: 'damageReport',
  returnedAt: 'returnedAt',
  cancelledBy: 'cancelledBy',
  status: 'status',
  aiDamageVerdict: 'aiDamageVerdict',
  aiDamageConfidence: 'aiDamageConfidence',
  aiDamageNotes: 'aiDamageNotes',
  aiDamageCheckedAt: 'aiDamageCheckedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  title: 'title',
  body: 'body',
  read: 'read',
  link: 'link',
  createdAt: 'createdAt'
};

exports.Prisma.MentorScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  name: 'name',
  handle: 'handle',
  avatar: 'avatar',
  specialty: 'specialty',
  category: 'category',
  subcategories: 'subcategories',
  bio: 'bio',
  tags: 'tags',
  rating: 'rating',
  sessions: 'sessions',
  pricePerSession: 'pricePerSession',
  available: 'available',
  responseTime: 'responseTime',
  createdAt: 'createdAt'
};

exports.Prisma.MentorBookingScalarFieldEnum = {
  id: 'id',
  mentorId: 'mentorId',
  userId: 'userId',
  sessionFormat: 'sessionFormat',
  scheduledAt: 'scheduledAt',
  goals: 'goals',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.ConversationScalarFieldEnum = {
  id: 'id',
  lastMessageAt: 'lastMessageAt',
  createdAt: 'createdAt'
};

exports.Prisma.ConversationParticipantScalarFieldEnum = {
  conversationId: 'conversationId',
  userId: 'userId'
};

exports.Prisma.MessageScalarFieldEnum = {
  id: 'id',
  conversationId: 'conversationId',
  senderId: 'senderId',
  content: 'content',
  type: 'type',
  metadata: 'metadata',
  readAt: 'readAt',
  createdAt: 'createdAt'
};

exports.Prisma.CartItemScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  lentItemId: 'lentItemId',
  days: 'days',
  addedAt: 'addedAt'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires'
};

exports.Prisma.VerificationTokenScalarFieldEnum = {
  identifier: 'identifier',
  token: 'token',
  expires: 'expires'
};

exports.Prisma.AuthenticatorScalarFieldEnum = {
  credentialID: 'credentialID',
  userId: 'userId',
  providerAccountId: 'providerAccountId',
  credentialPublicKey: 'credentialPublicKey',
  counter: 'counter',
  credentialDeviceType: 'credentialDeviceType',
  credentialBackedUp: 'credentialBackedUp',
  transports: 'transports'
};

exports.Prisma.ItemTrailEntryScalarFieldEnum = {
  id: 'id',
  productId: 'productId',
  lentItemId: 'lentItemId',
  borrowCheckoutId: 'borrowCheckoutId',
  borrowerId: 'borrowerId',
  useFor: 'useFor',
  location: 'location',
  tags: 'tags',
  itemRating: 'itemRating',
  photoUrls: 'photoUrls',
  isPublic: 'isPublic',
  anonymous: 'anonymous',
  createdAt: 'createdAt'
};

exports.Prisma.TrailReactionScalarFieldEnum = {
  id: 'id',
  trailEntryId: 'trailEntryId',
  userId: 'userId',
  type: 'type',
  createdAt: 'createdAt'
};

exports.Prisma.BorrowerReviewScalarFieldEnum = {
  id: 'id',
  borrowCheckoutId: 'borrowCheckoutId',
  lenderId: 'lenderId',
  borrowerId: 'borrowerId',
  rating: 'rating',
  comment: 'comment',
  createdAt: 'createdAt'
};

exports.Prisma.UserReportScalarFieldEnum = {
  id: 'id',
  reporterId: 'reporterId',
  reportedUserId: 'reportedUserId',
  reason: 'reason',
  description: 'description',
  status: 'status',
  createdAt: 'createdAt',
  readByAdmin: 'readByAdmin'
};

exports.Prisma.IdVerificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  frontImage: 'frontImage',
  backImage: 'backImage',
  selfieImage: 'selfieImage',
  frontMimeType: 'frontMimeType',
  backMimeType: 'backMimeType',
  selfieMimeType: 'selfieMimeType',
  faceMatchScore: 'faceMatchScore',
  status: 'status',
  submittedAt: 'submittedAt',
  reviewedAt: 'reviewedAt'
};

exports.Prisma.DisputeScalarFieldEnum = {
  id: 'id',
  checkoutId: 'checkoutId',
  raisedById: 'raisedById',
  borrowerId: 'borrowerId',
  lenderId: 'lenderId',
  status: 'status',
  title: 'title',
  description: 'description',
  depositAmount: 'depositAmount',
  beforePhotoUrl: 'beforePhotoUrl',
  afterPhotoUrl: 'afterPhotoUrl',
  aiVerdict: 'aiVerdict',
  aiConfidence: 'aiConfidence',
  aiNotes: 'aiNotes',
  raisedAt: 'raisedAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DisputeResolutionScalarFieldEnum = {
  id: 'id',
  disputeId: 'disputeId',
  resolvedById: 'resolvedById',
  decisionType: 'decisionType',
  amountToLender: 'amountToLender',
  amountToBorrower: 'amountToBorrower',
  justification: 'justification',
  resolvedAt: 'resolvedAt'
};

exports.Prisma.DisputeEventScalarFieldEnum = {
  id: 'id',
  disputeId: 'disputeId',
  actorRole: 'actorRole',
  type: 'type',
  body: 'body',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.SessionFormat = exports.$Enums.SessionFormat = {
  VIDEO: 'VIDEO',
  IN_PERSON: 'IN_PERSON'
};

exports.DisputeStatus = exports.$Enums.DisputeStatus = {
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  ESCALATED: 'ESCALATED',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
};

exports.DecisionType = exports.$Enums.DecisionType = {
  RELEASE_TO_LENDER: 'RELEASE_TO_LENDER',
  RETURN_TO_BORROWER: 'RETURN_TO_BORROWER',
  SPLIT: 'SPLIT'
};

exports.Prisma.ModelName = {
  User: 'User',
  Product: 'Product',
  ProductImage: 'ProductImage',
  ConditionPhoto: 'ConditionPhoto',
  LentItem: 'LentItem',
  BorrowRequest: 'BorrowRequest',
  BorrowRequestOffer: 'BorrowRequestOffer',
  BorrowCheckout: 'BorrowCheckout',
  Notification: 'Notification',
  Mentor: 'Mentor',
  MentorBooking: 'MentorBooking',
  Conversation: 'Conversation',
  ConversationParticipant: 'ConversationParticipant',
  Message: 'Message',
  CartItem: 'CartItem',
  Account: 'Account',
  Session: 'Session',
  VerificationToken: 'VerificationToken',
  Authenticator: 'Authenticator',
  ItemTrailEntry: 'ItemTrailEntry',
  TrailReaction: 'TrailReaction',
  BorrowerReview: 'BorrowerReview',
  UserReport: 'UserReport',
  IdVerification: 'IdVerification',
  Dispute: 'Dispute',
  DisputeResolution: 'DisputeResolution',
  DisputeEvent: 'DisputeEvent'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
