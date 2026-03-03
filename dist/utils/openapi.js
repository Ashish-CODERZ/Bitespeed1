"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openApiDocument = void 0;
exports.openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Identity Reconciliation Service",
    version: "1.0.0",
    description: "API for transactional identity reconciliation and contact clustering."
  },
  servers: [
    {
      url: "/"
    }
  ],
  paths: {
    "/health": {
      get: {
        summary: "Health check endpoint",
        responses: {
          200: {
            description: "Service is healthy"
          }
        }
      }
    },
    "/identify": {
      post: {
        summary: "Identify and reconcile user contact data",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    nullable: true
                  },
                  phoneNumber: {
                    type: "string",
                    nullable: true
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Resolved identity cluster",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    contact: {
                      type: "object",
                      properties: {
                        primaryContactId: {
                          type: "integer"
                        },
                        emails: {
                          type: "array",
                          items: {
                            type: "string"
                          }
                        },
                        phoneNumbers: {
                          type: "array",
                          items: {
                            type: "string"
                          }
                        },
                        secondaryContactIds: {
                          type: "array",
                          items: {
                            type: "integer"
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
