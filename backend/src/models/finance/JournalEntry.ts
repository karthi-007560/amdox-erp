
import mongoose, { Schema, Document, Types } from "mongoose";

export type JournalStatus =
    | "draft"
    | "posted"
    | "reversed";

export interface IJournalLine {
    accountId: Types.ObjectId;
    description?: string;
    debit: Types.Decimal128;
    credit: Types.Decimal128;
}

export interface IJournalEntry extends Document {
    tenantId: Types.ObjectId;
    journalNumber: string;
    entryDate: Date;
    description: string;
    reference?: string;

    entries: IJournalLine[];

    totalDebit: Types.Decimal128;
    totalCredit: Types.Decimal128;

    status: JournalStatus;

    createdBy: Types.ObjectId;
    postedBy?: Types.ObjectId;
    postedAt?: Date;

    reversalOf?: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

const journalLineSchema = new Schema<IJournalLine>(
    {
        accountId: {
            type: Schema.Types.ObjectId,
            ref: "ChartOfAccounts",
            required: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 300,
        },
        debit: {
            type: Schema.Types.Decimal128,
            required: true,
            default: "0",
            min: 0,
        },
        credit: {
            type: Schema.Types.Decimal128,
            required: true,
            default: "0",
            min: 0,
        },
    },
    {
        _id: false,
    }
);

const journalEntrySchema = new Schema<IJournalEntry>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },

        journalNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            maxlength: 50,
        },

        entryDate: {
            type: Date,
            required: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },

        reference: {
            type: String,
            trim: true,
            maxlength: 100,
        },

        entries: {
            type: [journalLineSchema],
            required: true,
            validate: {
                validator: (entries: IJournalLine[]) =>
                    entries.length >= 2,
                message: "A journal entry must contain at least two lines.",
            },
        },

        totalDebit: {
            type: Schema.Types.Decimal128,
            required: true,
            default: "0",
            min: 0,
        },

        totalCredit: {
            type: Schema.Types.Decimal128,
            required: true,
            default: "0",
            min: 0,
        },

        status: {
            type: String,
            enum: ["draft", "posted", "reversed"],
            default: "draft",
            required: true,
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        postedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        postedAt: {
            type: Date,
        },

        reversalOf: {
            type: Schema.Types.ObjectId,
            ref: "JournalEntry",
        },
    },
    {
        timestamps: true,
    }
);

journalEntrySchema.index(
    { tenantId: 1, journalNumber: 1 },
    { unique: true }
);

journalEntrySchema.index(
    { tenantId: 1, entryDate: -1 }
);

export const JournalEntry = mongoose.model<IJournalEntry>(
    "JournalEntry",
    journalEntrySchema
);
