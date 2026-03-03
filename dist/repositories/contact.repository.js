"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactRepository = void 0;
class ContactRepository {
  async acquireIdentifierLocks(tx, email, phoneNumber) {
    const lockKeys = [];
    if (email !== null) {
      lockKeys.push(`email:${email}`);
    }
    if (phoneNumber !== null) {
      lockKeys.push(`phone:${phoneNumber}`);
    }
    lockKeys.sort();
    for (const lockKey of lockKeys) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
    }
  }
  async findByEmailOrPhone(tx, email, phoneNumber) {
    const orConditions = [];
    if (email !== null) {
      orConditions.push({ email });
    }
    if (phoneNumber !== null) {
      orConditions.push({ phoneNumber });
    }
    if (orConditions.length === 0) {
      return [];
    }
    return tx.contact.findMany({
      where: {
        deletedAt: null,
        OR: orConditions
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
  }
  async findByIds(tx, ids) {
    if (ids.length === 0) {
      return [];
    }
    return tx.contact.findMany({
      where: {
        deletedAt: null,
        id: {
          in: ids
        }
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
  }
  async findByLinkedIds(tx, linkedIds) {
    if (linkedIds.length === 0) {
      return [];
    }
    return tx.contact.findMany({
      where: {
        deletedAt: null,
        linkedId: {
          in: linkedIds
        }
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
  }
  async create(tx, data) {
    return tx.contact.create({ data });
  }
  async update(tx, id, data) {
    return tx.contact.update({
      where: { id },
      data
    });
  }
}
exports.ContactRepository = ContactRepository;
