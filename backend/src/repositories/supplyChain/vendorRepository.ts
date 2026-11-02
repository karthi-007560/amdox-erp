
import Vendor from "../../models/supplyChain/Vendor.js";
import type { IVendor } from "../../models/supplyChain/Vendor.js";

export async function createVendor(
    vendorData: Partial<IVendor>
) {
    return Vendor.create(vendorData);
}

export async function getVendorsByTenant(tenantId: string) {
    return Vendor.find({ tenantId })
        .populate("tenantId", "name code")
        .sort({ createdAt: -1 });
}

export async function getVendorByIdAndTenant(
    vendorId: string,
    tenantId: string
) {
    return Vendor.findOne({
        _id: vendorId,
        tenantId,
    }).populate("tenantId", "name code");
}

export async function getVendorByCodeAndTenant(
    vendorCode: string,
    tenantId: string
) {
    return Vendor.findOne({
        vendorCode: vendorCode.trim().toUpperCase(),
        tenantId,
    });
}

export async function updateVendorByIdAndTenant(
    vendorId: string,
    tenantId: string,
    updateData: Partial<IVendor>
) {
    return Vendor.findOneAndUpdate(
        {
            _id: vendorId,
            tenantId,
        },
        updateData,
        {
            new: true,
            runValidators: true,
        }
    );
}

export async function deleteVendorByIdAndTenant(
    vendorId: string,
    tenantId: string
) {
    return Vendor.findOneAndDelete({
        _id: vendorId,
        tenantId,
    });
}
