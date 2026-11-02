import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { Tenant } from "../../models/Tenant.js";
import { User } from "../../models/User.js";

export const seedUsers = async () => {
    const tenantId = process.env.SEED_TENANT_ID;
    const name = process.env.SEED_ADMIN_NAME;
    const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD;

    if (!tenantId || !mongoose.isValidObjectId(tenantId)) {
        throw new Error("A valid SEED_TENANT_ID is required");
    }

    if (!name?.trim() || !email || !password) {
        throw new Error(
            "SEED_ADMIN_NAME, SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required"
        );
    }

    if (password.length < 12) {
        throw new Error("Seed admin password must be at least 12 characters");
    }

    const tenant = await Tenant.findOne({
        _id: tenantId,
        status: "active",
    });

    if (!tenant) {
        throw new Error("Active tenant not found for admin seeding");
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        if (
            existingUser.role !== "admin" ||
            existingUser.tenantId?.toString() !== tenant._id.toString()
        ) {
            throw new Error(
                "The configured admin email already belongs to another account or tenant"
            );
        }

        if (!existingUser.isActive) {
            throw new Error("Existing seed admin account is inactive");
        }

        return {
            created: false,
            user: existingUser,
            message: "Seed admin already exists",
        };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
        name: name.trim(),
        email,
        password: hashedPassword,
        role: "admin",
        isActive: true,
        tenantId: tenant._id,
    });

    return {
        created: true,
        user,
        message: "Initial admin user created successfully",
    };
};