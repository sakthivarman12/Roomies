/**
 * Service registry. To move to Supabase, swap these bindings for Supabase-backed
 * implementations of the same interfaces (see lib/supabase/README.md). UI code only imports from here.
 */
import { localAuthService } from "./authService";
import { localBillService, localPaymentService } from "./paymentService";
import { localChoreService } from "./choreService";
import { localExpenseService } from "./expenseService";
import { localDevService, localHouseService, localNotificationService } from "./houseService";
import { localEventService, localGalleryService } from "./mediaService";
import { localGeoService } from "./geoService";
import { localFundService } from "./fundService";
import { localRoomService } from "./roomService";
import type {
  AuthService, BillService, ChoreService, DevService, EventService, ExpenseService, FundService, GalleryService, GeoService, HouseService,
  NotificationService, PaymentService, RoomService,
} from "./types";

export const authService: AuthService = localAuthService;
export const roomService: RoomService = localRoomService;
export const expenseService: ExpenseService = localExpenseService;
export const paymentService: PaymentService = localPaymentService;
export const billService: BillService = localBillService;
export const choreService: ChoreService = localChoreService;
export const houseService: HouseService = localHouseService;
export const notificationService: NotificationService = localNotificationService;
export const eventService: EventService = localEventService;
export const galleryService: GalleryService = localGalleryService;
export const geoService: GeoService = localGeoService;
export const fundService: FundService = localFundService;
export const devService: DevService = localDevService;

export { ServiceError } from "./context";
export { PermissionError } from "@/lib/permissions";
export { transferOwnership } from "./roomService";
export type * from "./types";
