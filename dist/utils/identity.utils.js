"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildIdentityResponse = exports.normalizeIdentifyInput = void 0;
const errors_1 = require("./errors");
const normalizeField = (value, fieldName) => {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== "string") {
    throw new errors_1.ValidationError(`${fieldName} must be a string when provided.`);
  }
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
};
const normalizeIdentifyInput = (body) => {
  if (typeof body !== "object" || body === null) {
    throw new errors_1.ValidationError("Request body must be a JSON object.");
  }
  const payload = body;
  const email = normalizeField(payload.email, "email");
  const phoneNumber = normalizeField(payload.phoneNumber, "phoneNumber");
  if (email === null && phoneNumber === null) {
    throw new errors_1.ValidationError("At least one of email or phoneNumber is required.");
  }
  return {
    email,
    phoneNumber
  };
};
exports.normalizeIdentifyInput = normalizeIdentifyInput;
const pushUnique = (target, seen, value) => {
  if (value === null || seen.has(value)) {
    return;
  }
  seen.add(value);
  target.push(value);
};
const buildIdentityResponse = (contacts, primaryContactId) => {
  const orderedContacts = [...contacts].sort((first, second) => {
    const createdAtDelta = first.createdAt.getTime() - second.createdAt.getTime();
    return createdAtDelta !== 0 ? createdAtDelta : first.id - second.id;
  });
  const primaryContact = orderedContacts.find((contact) => contact.id === primaryContactId);
  if (!primaryContact) {
    throw new errors_1.InternalServerError("Primary contact is missing from the resolved cluster.");
  }
  const emails = [];
  const emailSet = new Set();
  pushUnique(emails, emailSet, primaryContact.email);
  for (const contact of orderedContacts) {
    if (contact.id !== primaryContact.id) {
      pushUnique(emails, emailSet, contact.email);
    }
  }
  const phoneNumbers = [];
  const phoneSet = new Set();
  pushUnique(phoneNumbers, phoneSet, primaryContact.phoneNumber);
  for (const contact of orderedContacts) {
    if (contact.id !== primaryContact.id) {
      pushUnique(phoneNumbers, phoneSet, contact.phoneNumber);
    }
  }
  const secondaryContactIds = orderedContacts
    .filter((contact) => contact.id !== primaryContact.id)
    .map((contact) => contact.id);
  return {
    contact: {
      primaryContactId: primaryContact.id,
      emails,
      phoneNumbers,
      secondaryContactIds
    }
  };
};
exports.buildIdentityResponse = buildIdentityResponse;
