"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const pino_http_1 = __importDefault(require("pino-http"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const home_routes_1 = require("./routes/home.routes");
const health_routes_1 = require("./routes/health.routes");
const identify_routes_1 = require("./routes/identify.routes");
const errors_1 = require("./utils/errors");
const openapi_1 = require("./utils/openapi");
const app = (0, express_1.default)();
exports.app = app;
app.use(express_1.default.json());
app.use(
  (0, pino_http_1.default)({
    enabled: process.env.NODE_ENV !== "test"
  })
);
app.use(
  "/docs",
  swagger_ui_express_1.default.serve,
  swagger_ui_express_1.default.setup(openapi_1.openApiDocument)
);
app.use(home_routes_1.homeRouter);
app.use(health_routes_1.healthRouter);
app.use(identify_routes_1.identifyRouter);
app.use((_req, res) => {
  res.status(404).json({
    error: "Not Found"
  });
});
app.use((error, _req, res, _next) => {
  if (error instanceof errors_1.ValidationError) {
    res.status(error.statusCode).json({
      error: error.message
    });
    return;
  }
  if (typeof error === "object" && error !== null) {
    const maybeHttpError = error;
    const statusCode = maybeHttpError.statusCode ?? maybeHttpError.status;
    if (statusCode === 400) {
      res.status(400).json({
        error: maybeHttpError.message ?? "Invalid request payload."
      });
      return;
    }
  }
  const message = error instanceof Error ? error.message : "Unexpected internal server error.";
  res.status(500).json({
    error: message
  });
});
