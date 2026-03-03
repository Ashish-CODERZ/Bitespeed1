"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentifyController = void 0;
const identity_service_1 = require("../services/identity.service");
const identity_utils_1 = require("../utils/identity.utils");
class IdentifyController {
  identityService;
  constructor(identityService = new identity_service_1.IdentityService()) {
    this.identityService = identityService;
  }
  identify = async (req, res, next) => {
    try {
      const normalizedInput = (0, identity_utils_1.normalizeIdentifyInput)(req.body);
      const identityResponse = await this.identityService.identify(normalizedInput);
      res.status(200).json(identityResponse);
    } catch (error) {
      next(error);
    }
  };
}
exports.IdentifyController = IdentifyController;
