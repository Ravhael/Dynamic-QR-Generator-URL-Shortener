import apiClient from "./apiClient"
import authService from "./authService"
import qrCodeService from "./qrCodeService"
import qrMigrationService from "./qrMigrationService"
import shortUrlService from "./shortUrlService"
import { urlCategoryService } from "./urlCategoryService"
import reportService from "./reportService"
import userService from "./userService"
import { qrCategoryService } from "./qrCategoryService"
import qrAnalyticsService, { QRanalyticsService } from './QRanalyticsService'
import analyticsService, { analyticsService as analyticsServiceInstance } from './analyticsService'
import domainService from './domainService'

// Import new Supabase-based services
// import { analyticsService } from "../supabase/analyticsService"
// import { qrCodeService as supabaseQRService } from "../supabase/qrCodeService"
// import { authService as supabaseAuthService } from "../supabase/authService"

// Export dengan alias tersendiri agar tidak memicu parsing bermasalah
const exportsObject = {
  apiClient,
  authService,
  qrCodeService,
  qrMigrationService,
  shortUrlService,
  urlCategoryService,
  reportService,
  userService,
  qrCategoryService,
  qrAnalyticsService,
  QRanalyticsService,
  analyticsService: analyticsServiceInstance,
  domainService,
};

export default exportsObject;
export {
  apiClient,
  authService,
  qrCodeService,
  qrMigrationService,
  shortUrlService,
  urlCategoryService,
  reportService,
  userService,
  qrCategoryService,
  qrAnalyticsService,
  QRanalyticsService,
  analyticsServiceInstance as analyticsService,
  domainService,
};
