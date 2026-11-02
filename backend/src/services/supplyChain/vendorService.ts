
import mongoose from "mongoose";

import type {
    IVendor,
    VendorStatus,
} from "../../models/supplyChain/Vendor.js";

import {
    createVendor,
    getVendorsByTenant,
    getVendorByIdAndTenant,
    getVendorByCodeAndTenant,
    updateVendorByIdAndTenant,
    deleteVendorByIdAndTenant,
} from "../../repositories/supplyChain/vendorRepository.js";

import {
    findTenantById,
} from "../../repositories/tenantRepository.js";

interface CreateVendorInput {
    tenantId: string;
    vendorCode: string;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    taxId?: string;
    paymentTermsDays?: number;
    status?: VendorStatus;
    notes?: string;
    createdBy?: string;
}

interface UpdateVendorInput {
    vendorCode?: string;
    name?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    taxId?: string;
    paymentTermsDays?: number;
    status?: VendorStatus;
    notes?: string;
}

function validateObjectId(
    id: string,
    errorCode: string
): void {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error(errorCode);
    }
}

async function validateActiveTenant(tenantId: string) {
    validateObjectId(tenantId, "INVALID_TENANT_ID");

    const tenant = await findTenantById(tenantId);

    if (!tenant) {
        throw new Error("TENANT_NOT_FOUND");
    }

    if (tenant.status !== "active") {
        throw new Error("TENANT_NOT_ACTIVE");
    }

    return tenant;
}

function validatePaymentTerms(paymentTermsDays: number): void {
    if (
        !Number.isInteger(paymentTermsDays) ||
        paymentTermsDays < 0 ||
        paymentTermsDays > 365
    ) {
        throw new Error("INVALID_PAYMENT_TERMS");
    }
}

export async function createVendorService(
    input: CreateVendorInput
) {
    await validateActiveTenant(input.tenantId);

    const vendorCode = input.vendorCode?.trim().toUpperCase();
    const name = input.name?.trim();

    if (!vendorCode || !name) {
        throw new Error("VENDOR_CODE_AND_NAME_REQUIRED");
    }

    const existingVendor = await getVendorByCodeAndTenant(
        vendorCode,
        input.tenantId
    );

    if (existingVendor) {
        throw new Error("VENDOR_CODE_ALREADY_EXISTS");
    }

    const paymentTermsDays = input.paymentTermsDays ?? 30;
    validatePaymentTerms(paymentTermsDays);

    if (input.createdBy) {
        validateObjectId(input.createdBy, "INVALID_CREATED_BY");
    }

    const vendorData: Partial<IVendor> = {
        tenantId: new mongoose.Types.ObjectId(input.tenantId),
        vendorCode,
        name,
        contactPerson: input.contactPerson?.trim(),
        email: input.email?.trim().toLowerCase(),
        phone: input.phone?.trim(),
        website: input.website?.trim(),
        address: input.address?.trim(),
        taxId: input.taxId?.trim().toUpperCase(),
        paymentTermsDays,
        status: input.status ?? "active",
        notes: input.notes?.trim(),
    };

    if (input.createdBy) {
        vendorData.createdBy = new mongoose.Types.ObjectId(
            input.createdBy
        );
    }

    return createVendor(vendorData);
}

export async function getVendorsByTenantService(
    tenantId: string
) {
    await validateActiveTenant(tenantId);

    return getVendorsByTenant(tenantId);
}

export async function getVendorByIdService(
    vendorId: string,
    tenantId: string
) {
    validateObjectId(vendorId, "INVALID_VENDOR_ID");
    await validateActiveTenant(tenantId);

    const vendor = await getVendorByIdAndTenant(
        vendorId,
        tenantId
    );

    if (!vendor) {
        throw new Error("VENDOR_NOT_FOUND");
    }

    return vendor;
}

export async function updateVendorService(
    vendorId: string,
    tenantId: string,
    input: UpdateVendorInput
) {
    validateObjectId(vendorId, "INVALID_VENDOR_ID");
    await validateActiveTenant(tenantId);

    const existingVendor = await getVendorByIdAndTenant(
        vendorId,
        tenantId
    );

    if (!existingVendor) {
        throw new Error("VENDOR_NOT_FOUND");
    }

    const updateData: Partial<IVendor> = {};

    if (input.vendorCode !== undefined) {
        const vendorCode = input.vendorCode.trim().toUpperCase();

        if (!vendorCode) {
            throw new Error("VENDOR_CODE_REQUIRED");
        }

        const duplicateVendor = await getVendorByCodeAndTenant(
            vendorCode,
            tenantId
        );

        if (
            duplicateVendor &&
            duplicateVendor._id.toString() !== vendorId
        ) {
            throw new Error("VENDOR_CODE_ALREADY_EXISTS");
        }

        updateData.vendorCode = vendorCode;
    }

    if (input.name !== undefined) {
        const name = input.name.trim();

        if (!name) {
            throw new Error("VENDOR_NAME_REQUIRED");
        }

        updateData.name = name;
    }

    if (input.contactPerson !== undefined) {
        updateData.contactPerson = input.contactPerson.trim();
    }

    if (input.email !== undefined) {
        updateData.email = input.email.trim().toLowerCase();
    }

    if (input.phone !== undefined) {
        updateData.phone = input.phone.trim();
    }

    if (input.website !== undefined) {
        updateData.website = input.website.trim();
    }

    if (input.address !== undefined) {
        updateData.address = input.address.trim();
    }

    if (input.taxId !== undefined) {
        updateData.taxId = input.taxId.trim().toUpperCase();
    }

    if (input.paymentTermsDays !== undefined) {
        validatePaymentTerms(input.paymentTermsDays);
        updateData.paymentTermsDays = input.paymentTermsDays;
    }

    if (input.status !== undefined) {
        updateData.status = input.status;
    }

    if (input.notes !== undefined) {
        updateData.notes = input.notes.trim();
    }

    if (Object.keys(updateData).length === 0) {
        throw new Error("NO_VENDOR_FIELDS_TO_UPDATE");
    }

    const updatedVendor = await updateVendorByIdAndTenant(
        vendorId,
        tenantId,
        updateData
    );

    if (!updatedVendor) {
        throw new Error("VENDOR_UPDATE_FAILED");
    }

    return updatedVendor;
}

export async function deleteVendorService(
    vendorId: string,
    tenantId: string
) {
    validateObjectId(vendorId, "INVALID_VENDOR_ID");
    await validateActiveTenant(tenantId);

    const deletedVendor = await deleteVendorByIdAndTenant(
        vendorId,
        tenantId
    );

    if (!deletedVendor) {
        throw new Error("VENDOR_NOT_FOUND");
    }

    return deletedVendor;
}
