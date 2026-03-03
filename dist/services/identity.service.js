"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = require("../lib/prisma");
const contact_repository_1 = require("../repositories/contact.repository");
const contact_types_1 = require("../types/contact.types");
const identity_utils_1 = require("../utils/identity.utils");
class IdentityService {
  contactRepository;
  maxRetryAttempts;
  constructor(contactRepository = new contact_repository_1.ContactRepository()) {
    this.contactRepository = contactRepository;
    this.maxRetryAttempts = 5;
  }
  async identify(input) {
    for (let attempt = 1; attempt <= this.maxRetryAttempts; attempt += 1) {
      try {
        return await prisma_1.prisma.$transaction(
          async (tx) => {
            await this.contactRepository.acquireIdentifierLocks(tx, input.email, input.phoneNumber);
            const directMatches = await this.contactRepository.findByEmailOrPhone(
              tx,
              input.email,
              input.phoneNumber
            );
            if (directMatches.length === 0) {
              const createdPrimary = await this.contactRepository.create(tx, {
                email: input.email,
                phoneNumber: input.phoneNumber,
                linkedId: null,
                linkPrecedence: contact_types_1.LINK_PRECEDENCE.PRIMARY
              });
              return (0, identity_utils_1.buildIdentityResponse)(
                [createdPrimary],
                createdPrimary.id
              );
            }
            const expandedCluster = await this.expandCluster(tx, directMatches);
            const canonicalPrimary = this.selectCanonicalPrimary(expandedCluster);
            await this.normalizeCluster(tx, expandedCluster, canonicalPrimary.id);
            const hasNewInformation = this.hasNewInformation(
              expandedCluster,
              input.email,
              input.phoneNumber
            );
            if (hasNewInformation) {
              await this.contactRepository.create(tx, {
                email: input.email,
                phoneNumber: input.phoneNumber,
                linkedId: canonicalPrimary.id,
                linkPrecedence: contact_types_1.LINK_PRECEDENCE.SECONDARY
              });
            }
            const normalizedCluster = await this.collectClusterFromPrimary(tx, canonicalPrimary.id);
            return (0, identity_utils_1.buildIdentityResponse)(
              normalizedCluster,
              canonicalPrimary.id
            );
          },
          {
            isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 10000,
            timeout: 30000
          }
        );
      } catch (error) {
        const shouldRetry =
          attempt < this.maxRetryAttempts && this.isRetryableTransactionError(error);
        if (!shouldRetry) {
          throw error;
        }
        await this.sleep(50 * attempt);
      }
    }
    throw new Error("Identity reconciliation failed after retry attempts.");
  }
  async expandCluster(tx, seedContacts) {
    const contactCache = new Map();
    for (const contact of seedContacts) {
      contactCache.set(contact.id, contact);
    }
    const rootIds = new Set();
    for (const contact of seedContacts) {
      const rootContact = await this.resolveRootContact(tx, contact, contactCache);
      rootIds.add(rootContact.id);
    }
    const knownIds = new Set([...rootIds, ...seedContacts.map((contact) => contact.id)]);
    let frontier = [...knownIds];
    while (frontier.length > 0) {
      const children = await this.contactRepository.findByLinkedIds(tx, frontier);
      const nextFrontier = [];
      for (const child of children) {
        contactCache.set(child.id, child);
        if (!knownIds.has(child.id)) {
          knownIds.add(child.id);
          nextFrontier.push(child.id);
        }
      }
      frontier = nextFrontier;
    }
    return this.contactRepository.findByIds(tx, [...knownIds]);
  }
  async resolveRootContact(tx, startingContact, contactCache) {
    let current = startingContact;
    const visitedIds = new Set();
    while (true) {
      if (
        current.linkPrecedence === contact_types_1.LINK_PRECEDENCE.PRIMARY ||
        current.linkedId === null
      ) {
        return current;
      }
      if (visitedIds.has(current.id)) {
        return current;
      }
      visitedIds.add(current.id);
      const parentId = current.linkedId;
      let parentContact = contactCache.get(parentId);
      if (!parentContact) {
        const parentCandidates = await this.contactRepository.findByIds(tx, [parentId]);
        if (parentCandidates.length === 0) {
          return current;
        }
        parentContact = parentCandidates[0];
        contactCache.set(parentContact.id, parentContact);
      }
      current = parentContact;
    }
  }
  selectCanonicalPrimary(clusterContacts) {
    return [...clusterContacts].sort((first, second) => {
      const createdAtDelta = first.createdAt.getTime() - second.createdAt.getTime();
      return createdAtDelta !== 0 ? createdAtDelta : first.id - second.id;
    })[0];
  }
  hasNewInformation(clusterContacts, email, phoneNumber) {
    const existingEmails = new Set();
    const existingPhoneNumbers = new Set();
    for (const contact of clusterContacts) {
      if (contact.email !== null) {
        existingEmails.add(contact.email);
      }
      if (contact.phoneNumber !== null) {
        existingPhoneNumbers.add(contact.phoneNumber);
      }
    }
    const hasNewEmail = email !== null && !existingEmails.has(email);
    const hasNewPhoneNumber = phoneNumber !== null && !existingPhoneNumbers.has(phoneNumber);
    return hasNewEmail || hasNewPhoneNumber;
  }
  async normalizeCluster(tx, clusterContacts, primaryContactId) {
    for (const contact of clusterContacts) {
      if (contact.id === primaryContactId) {
        if (
          contact.linkPrecedence !== contact_types_1.LINK_PRECEDENCE.PRIMARY ||
          contact.linkedId !== null
        ) {
          await this.contactRepository.update(tx, contact.id, {
            linkPrecedence: contact_types_1.LINK_PRECEDENCE.PRIMARY,
            linkedId: null
          });
        }
        continue;
      }
      if (
        contact.linkPrecedence !== contact_types_1.LINK_PRECEDENCE.SECONDARY ||
        contact.linkedId !== primaryContactId
      ) {
        await this.contactRepository.update(tx, contact.id, {
          linkPrecedence: contact_types_1.LINK_PRECEDENCE.SECONDARY,
          linkedId: primaryContactId
        });
      }
    }
  }
  async collectClusterFromPrimary(tx, primaryContactId) {
    const knownIds = new Set([primaryContactId]);
    let frontier = [primaryContactId];
    while (frontier.length > 0) {
      const children = await this.contactRepository.findByLinkedIds(tx, frontier);
      const nextFrontier = [];
      for (const child of children) {
        if (!knownIds.has(child.id)) {
          knownIds.add(child.id);
          nextFrontier.push(child.id);
        }
      }
      frontier = nextFrontier;
    }
    return this.contactRepository.findByIds(tx, [...knownIds]);
  }
  isRetryableTransactionError(error) {
    if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2034" || error.code === "P2028") {
        return true;
      }
    }
    const message =
      error instanceof Error && typeof error.message === "string"
        ? error.message.toLowerCase()
        : "";
    return (
      message.includes("write conflict") ||
      message.includes("could not serialize access") ||
      message.includes("deadlock") ||
      message.includes("transaction already closed")
    );
  }
  async sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
exports.IdentityService = IdentityService;
