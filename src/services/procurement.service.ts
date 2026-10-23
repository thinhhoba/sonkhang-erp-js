// File: src/services/procurement.service.ts
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { calculatePurchaseOrderVnd, invoiceMayMatchPurchaseOrder, ProcurementDomainError, vndDifference } from "@/lib/procurement";

export interface CreateSupplierInput {
  code: string;
  name: string;
  taxCode: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentTerms?: string;
  creditLimit?: number;
  bankAccount?: string;
  bankName?: string;
}

export interface CreatePOItemInput {
  productId: string;
  orderedQty: number;
  unitPrice: number;
  note?: string;
}

export interface CreatePOInput {
  supplierId: string;
  expectedDeliveryDate?: Date | string;
  paymentTerms?: string;
  note?: string;
  createdById?: string;
  vatRate?: number; // % VAT (mặc định 8% hoặc 10%)
  items: CreatePOItemInput[];
}

export interface ThreeWayMatchingResult {
  poId: string;
  poCode: string;
  supplierName: string;
  supplierTaxCode: string;
  invoiceId?: string;
  invoiceNumber?: string;
  matchStatus: "PASSED" | "WARNING" | "FAILED";
  summary: {
    poOrderedQty: number;
    actualReceivedQty: number;
    invoiceBilledQty: number;
    poTotalAmount: number;
    invoiceGrandTotal: number;
    qtyDifference: number;
    amountDifference: number;
  };
  lineDetails: Array<{
    productId: string;
    productSku: string;
    productName: string;
    orderedQty: number;
    receivedQty: number;
    billedQty: number;
    poUnitPrice: number;
    invoiceUnitPrice: number;
    status: "EXACT_MATCH" | "QTY_MISMATCH" | "PRICE_VARIANCE" | "NOT_BILLED";
  }>;
  discrepancies: string[];
}

export class ProcurementService {
  private static async serializable<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await operation();
      } catch (error: any) {
        if ((error?.code === "P2034" || error?.code === "P2002") && attempt < 2) continue;
        throw error;
      }
    }
    throw new ProcurementDomainError("Không thể hoàn tất giao dịch do xung đột đồng thời", 409);
  }
  // ==========================================
  // 1. QUẢN LÝ NHÀ CUNG CẤP
  // ==========================================
  static async listSuppliers() {
    return await prisma.supplier.findMany({
      include: {
        _count: {
          select: { purchaseOrders: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getSupplierById(id: string) {
    return await prisma.supplier.findUnique({
      where: { id },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  }

  static async createSupplier(input: CreateSupplierInput, actorId?: string) {
    const existing = await prisma.supplier.findFirst({
      where: {
        OR: [{ taxCode: input.taxCode }, { code: input.code }],
      },
    });

    if (existing) {
      throw new ProcurementDomainError(`Nhà cung cấp với MST (${input.taxCode}) hoặc Mã (${input.code}) đã tồn tại`, 409);
    }

    return await prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.create({
      data: {
        code: input.code.toUpperCase(),
        name: input.name,
        taxCode: input.taxCode,
        contactPerson: input.contactPerson,
        phone: input.phone,
        email: input.email,
        address: input.address,
        paymentTerms: input.paymentTerms || "NET30",
        creditLimit: input.creditLimit || 0,
        bankAccount: input.bankAccount,
        bankName: input.bankName,
      },
      });
      if (actorId) {
        await tx.auditLog.create({
          data: {
            employeeId: actorId,
            action: "CREATE_SUPPLIER",
            targetId: supplier.id,
            newValue: JSON.stringify({ code: supplier.code, taxCode: supplier.taxCode }),
          },
        });
      }
      return supplier;
    });
  }

  static async updateSupplier(id: string, input: Partial<CreateSupplierInput>, actorId?: string) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.supplier.findUnique({ where: { id } });
      if (!existing) throw new ProcurementDomainError("Không tìm thấy nhà cung cấp", 404);
      const supplier = await tx.supplier.update({
        where: { id },
        data: {
          name: input.name,
          contactPerson: input.contactPerson,
          phone: input.phone,
          email: input.email,
          address: input.address,
          paymentTerms: input.paymentTerms,
          creditLimit: input.creditLimit,
          bankAccount: input.bankAccount,
          bankName: input.bankName,
        },
      });
      if (actorId) {
        await tx.auditLog.create({
          data: {
            employeeId: actorId,
            action: "UPDATE_SUPPLIER",
            targetId: supplier.id,
            oldValue: JSON.stringify({ name: existing.name, paymentTerms: existing.paymentTerms, creditLimit: existing.creditLimit }),
            newValue: JSON.stringify({ name: supplier.name, paymentTerms: supplier.paymentTerms, creditLimit: supplier.creditLimit }),
          },
        });
      }
      return supplier;
    });
  }

  // ==========================================
  // 2. QUẢN LÝ ĐƠN ĐẶT HÀNG (PURCHASE ORDER - PO)
  // ==========================================
  static async listPurchaseOrders(status?: string) {
    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    return await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: { product: true },
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceSymbol: true,
            grandTotal: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getPurchaseOrderById(id: string) {
    return await prisma.purchaseOrder.findFirst({
      where: {
        OR: [{ id }, { poCode: id }],
      },
      include: {
        supplier: true,
        items: {
          include: { product: true },
        },
        invoices: {
          include: {
            items: {
              include: { mappedProduct: true },
            },
          },
        },
      },
    });
  }

  static async createPurchaseOrder(input: CreatePOInput, actorId?: string) {
    if (!input.items || input.items.length === 0) {
      throw new ProcurementDomainError("Đơn đặt hàng phải có ít nhất 1 mặt hàng");
    }

    const vatRate = input.vatRate ?? 8;
    const amounts = calculatePurchaseOrderVnd(input.items, vatRate);
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;

    return this.serializable(() => prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({ where: { id: input.supplierId } });
      if (!supplier) throw new ProcurementDomainError("Không tìm thấy Nhà cung cấp", 404);
      const latest = await tx.purchaseOrder.findFirst({
        where: { poCode: { startsWith: `PO-${yearMonth}-` } }, orderBy: { poCode: "desc" }, select: { poCode: true },
      });
      const sequence = latest ? Number(latest.poCode.slice(-3)) + 1 : 1;
      const poCode = `PO-${yearMonth}-${String(sequence).padStart(3, "0")}`;
      const itemsData = input.items.map((item, index) => ({
        productId: item.productId, orderedQty: item.orderedQty, receivedQty: 0,
        unitPrice: item.unitPrice, lineAmount: amounts.lineAmounts[index], note: item.note,
      }));
      const order = await tx.purchaseOrder.create({
        data: {
          poCode, supplierId: input.supplierId, paymentTerms: input.paymentTerms || supplier.paymentTerms,
          expectedDeliveryDate: input.expectedDeliveryDate ? new Date(input.expectedDeliveryDate) : null,
          createdById: input.createdById, status: "DRAFT", totalAmount: amounts.totalAmount,
          vatAmount: amounts.vatAmount, grandTotal: amounts.grandTotal, note: input.note,
          items: { create: itemsData },
        },
        include: { supplier: true, items: { include: { product: true } } },
      });
      if (actorId) {
        await tx.auditLog.create({
          data: {
            employeeId: actorId,
            action: "CREATE_PURCHASE_ORDER",
            targetId: order.id,
            newValue: JSON.stringify({ poCode: order.poCode, supplierId: order.supplierId, grandTotal: order.grandTotal }),
          },
        });
      }
      return order;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  static async submitPurchaseOrder(poId: string, actorId: string) {
    return this.serializable(() => prisma.$transaction(async (tx) => {
      const claimed = await tx.purchaseOrder.updateMany({ where: { id: poId, status: "DRAFT" }, data: { status: "SUBMITTED" } });
      if (claimed.count !== 1) throw new ProcurementDomainError("PO không tồn tại hoặc không còn ở trạng thái DRAFT", 409);
      await tx.auditLog.create({ data: { employeeId: actorId, action: "SUBMIT_PURCHASE_ORDER", targetId: poId, oldValue: JSON.stringify({ status: "DRAFT" }), newValue: JSON.stringify({ status: "SUBMITTED" }) } });
      return tx.purchaseOrder.findUniqueOrThrow({ where: { id: poId }, include: { supplier: true, items: { include: { product: true } } } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  static async updateDraftPurchaseOrder(poId: string, input: CreatePOInput, actorId: string) {
    const vatRate = input.vatRate ?? 8;
    const amounts = calculatePurchaseOrderVnd(input.items, vatRate);
    return this.serializable(() => prisma.$transaction(async (tx) => {
      const existing = await tx.purchaseOrder.findUnique({ where: { id: poId } });
      if (!existing) throw new ProcurementDomainError("Không tìm thấy PO", 404);
      if (existing.status !== "DRAFT") throw new ProcurementDomainError("Chỉ được sửa PO ở trạng thái DRAFT", 409);
      const supplier = await tx.supplier.findUnique({ where: { id: input.supplierId } });
      if (!supplier) throw new ProcurementDomainError("Không tìm thấy Nhà cung cấp", 404);
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: poId } });
      const updated = await tx.purchaseOrder.update({
        where: { id: poId },
        data: {
          supplierId: input.supplierId, paymentTerms: input.paymentTerms || supplier.paymentTerms,
          expectedDeliveryDate: input.expectedDeliveryDate ? new Date(input.expectedDeliveryDate) : null,
          totalAmount: amounts.totalAmount, vatAmount: amounts.vatAmount, grandTotal: amounts.grandTotal, note: input.note,
          items: { create: input.items.map((item, index) => ({ ...item, receivedQty: 0, lineAmount: amounts.lineAmounts[index] })) },
        },
        include: { supplier: true, items: { include: { product: true } } },
      });
      await tx.auditLog.create({
        data: { employeeId: actorId, action: "UPDATE_PURCHASE_ORDER", targetId: poId,
          oldValue: JSON.stringify({ supplierId: existing.supplierId, grandTotal: existing.grandTotal }),
          newValue: JSON.stringify({ supplierId: updated.supplierId, grandTotal: updated.grandTotal }) },
      });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  static async approvePurchaseOrder(poId: string, approvedById: string) {
    return this.serializable(() => prisma.$transaction(async (tx) => {
      const claimed = await tx.purchaseOrder.updateMany({
        where: { id: poId, status: "SUBMITTED" }, data: { status: "APPROVED", approvedById },
      });
      if (claimed.count !== 1) throw new ProcurementDomainError("PO không tồn tại hoặc chưa ở trạng thái SUBMITTED", 409);
      const approved = await tx.purchaseOrder.findUniqueOrThrow({ where: { id: poId }, include: { supplier: true, items: { include: { product: true } } } });
      if (approvedById) {
        await tx.auditLog.create({
          data: {
            employeeId: approvedById,
            action: "APPROVE_PURCHASE_ORDER",
            targetId: approved.id,
            oldValue: JSON.stringify({ status: "SUBMITTED" }),
            newValue: JSON.stringify({ status: "APPROVED", poCode: approved.poCode }),
          },
        });
      }
      return approved;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  static async cancelPurchaseOrder(poId: string, reason?: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
    });

    if (!po) throw new ProcurementDomainError("Không tìm thấy đơn đặt hàng", 404);
    if (po.status === "COMPLETED") {
      throw new ProcurementDomainError("Không thể hủy đơn đặt hàng đã hoàn tất nhập kho", 409);
    }

    return await prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        status: "CANCELLED",
        note: reason ? `${po.note ? po.note + " | " : ""}Lý do hủy: ${reason}` : po.note,
      },
    });
  }

  // ==========================================
  // 3. ĐỐI CHIẾU 3 BÊN (3-WAY MATCHING)
  // [1. Đơn PO] <---> [2. Nhập kho thực tế] <---> [3. Hóa đơn meInvoice]
  // ==========================================
  static async performThreeWayMatching(poId: string, invoiceId?: string): Promise<ThreeWayMatchingResult> {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        supplier: true,
        items: { include: { product: true } },
        invoices: {
          include: {
            items: { include: { mappedProduct: true } },
          },
        },
      },
    });

    if (!po) throw new ProcurementDomainError("Không tìm thấy đơn đặt hàng để đối chiếu", 404);

    // Chọn hóa đơn để đối chiếu (Ưu tiên invoiceId được truyền vào hoặc hóa đơn liên kết đầu tiên)
    let invoice = invoiceId
      ? await prisma.purchaseInvoice.findUnique({
          where: { id: invoiceId },
          include: { items: { include: { mappedProduct: true } } },
        })
      : po.invoices[0];

    if (invoice && !invoiceMayMatchPurchaseOrder(invoice, { id: po.id, supplierTaxCode: po.supplier.taxCode })) {
      throw new ProcurementDomainError("Hóa đơn không liên kết PO và không cùng mã số thuế nhà cung cấp", 409);
    }

    // Nếu PO chưa liên kết hóa đơn trực tiếp, thử tra cứu hóa đơn cùng MST nhà cung cấp gần nhất
    if (!invoice) {
      invoice = await prisma.purchaseInvoice.findFirst({
        where: {
          supplierTaxCode: po.supplier.taxCode,
          status: { in: ["PENDING_STOCK_IMPORT", "IMPORTED_STOCK"] },
        },
        include: { items: { include: { mappedProduct: true } } },
        orderBy: { invoiceDate: "desc" },
      }) as any;
    }

    const discrepancies: string[] = [];
    let matchStatus: "PASSED" | "WARNING" | "FAILED" = "PASSED";

    let poOrderedQty = 0;
    let actualReceivedQty = 0;
    let invoiceBilledQty = 0;

    const lineDetails = po.items.map((poItem) => {
      poOrderedQty += poItem.orderedQty;
      actualReceivedQty += poItem.receivedQty;

      // Tìm dòng hàng tương ứng trên hóa đơn qua mappedProductId
      const matchedInvoiceItem = invoice?.items.find(
        (invItem) => invItem.mappedProductId === poItem.productId
      );

      const billedQty = matchedInvoiceItem?.convertedQty ?? 0;
      invoiceBilledQty += billedQty;

      const invoiceUnitPrice = matchedInvoiceItem ? matchedInvoiceItem.unitPrice : 0;

      let lineStatus: "EXACT_MATCH" | "QTY_MISMATCH" | "PRICE_VARIANCE" | "NOT_BILLED" = "EXACT_MATCH";

      if (!matchedInvoiceItem) {
        lineStatus = "NOT_BILLED";
        discrepancies.push(`Mặt hàng [${poItem.product.sku}] ${poItem.product.name} chưa xuất hiện trên Hóa đơn`);
        matchStatus = "WARNING";
      } else {
        if (Math.abs(poItem.orderedQty - billedQty) > 0.01) {
          lineStatus = "QTY_MISMATCH";
          discrepancies.push(
            `Chênh lệch số lượng mặt hàng [${poItem.product.sku}]: Đặt ${poItem.orderedQty} ${poItem.product.baseUnit} nhưng Hóa đơn xuất ${billedQty} ${poItem.product.baseUnit}`
          );
          matchStatus = "WARNING";
        }
        if (vndDifference(poItem.unitPrice, invoiceUnitPrice) > 100) {
          lineStatus = "PRICE_VARIANCE";
          discrepancies.push(
            `Sai lệch đơn giá mặt hàng [${poItem.product.sku}]: PO thỏa thuận ${poItem.unitPrice.toLocaleString("vi-VN")}đ nhưng HĐ tính ${invoiceUnitPrice.toLocaleString("vi-VN")}đ`
          );
          matchStatus = "FAILED";
        }
      }

      return {
        productId: poItem.productId,
        productSku: poItem.product.sku,
        productName: poItem.product.name,
        orderedQty: poItem.orderedQty,
        receivedQty: poItem.receivedQty,
        billedQty,
        poUnitPrice: poItem.unitPrice,
        invoiceUnitPrice,
        status: lineStatus,
      };
    });

    const invoiceGrandTotal = invoice?.grandTotal ?? 0;
    const amountDifference = invoiceGrandTotal > 0 ? vndDifference(po.grandTotal, invoiceGrandTotal) : 0;

    if (invoice && amountDifference > 1000) {
      discrepancies.push(
        `Tổng giá trị hóa đơn (${invoiceGrandTotal.toLocaleString("vi-VN")}đ) lệch so với Đơn đặt hàng PO (${po.grandTotal.toLocaleString("vi-VN")}đ)`
      );
      if (matchStatus === "PASSED") matchStatus = "WARNING";
    }

    return {
      poId: po.id,
      poCode: po.poCode,
      supplierName: po.supplier.name,
      supplierTaxCode: po.supplier.taxCode,
      invoiceId: invoice?.id,
      invoiceNumber: invoice?.invoiceNumber,
      matchStatus,
      summary: {
        poOrderedQty,
        actualReceivedQty,
        invoiceBilledQty,
        poTotalAmount: po.grandTotal,
        invoiceGrandTotal,
        qtyDifference: Math.abs(poOrderedQty - invoiceBilledQty),
        amountDifference,
      },
      lineDetails,
      discrepancies,
    };
  }
}
