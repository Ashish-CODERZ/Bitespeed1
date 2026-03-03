"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerError = exports.ValidationError = void 0;
class ValidationError extends Error {
  statusCode;
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}
exports.ValidationError = ValidationError;
class InternalServerError extends Error {
  statusCode;
  constructor(message) {
    super(message);
    this.name = "InternalServerError";
    this.statusCode = 500;
  }
}
exports.InternalServerError = InternalServerError;
