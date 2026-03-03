"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyRouter = void 0;
const express_1 = require("express");
const identify_controller_1 = require("../controllers/identify.controller");
const identifyRouter = (0, express_1.Router)();
exports.identifyRouter = identifyRouter;
const identifyController = new identify_controller_1.IdentifyController();
identifyRouter.post("/identify", identifyController.identify);
