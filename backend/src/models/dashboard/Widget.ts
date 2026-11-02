import mongoose, { Schema, type Document, type Types } from "mongoose";

export type WidgetType =
    | "chart"
    | "statistic"
    | "table"
    | "calendar"
    | "activity"
    | "custom";

export interface IWidget extends Document {
    tenantId: Types.ObjectId;
    dashboardId: Types.ObjectId;
    userId: Types.ObjectId;
    title: string;
    type: WidgetType;
    configuration: Record<string, unknown>;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    isVisible: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const widgetSchema = new Schema<IWidget>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true
        },
        dashboardId: {
            type: Schema.Types.ObjectId,
            ref: "Dashboard",
            required: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        type: {
            type: String,
            enum: ["chart", "statistic", "table", "calendar", "activity", "custom"],
            required: true
        },
        configuration: {
            type: Schema.Types.Mixed,
            default: {}
        },
        position: {
            x: { type: Number, default: 0, min: 0 },
            y: { type: Number, default: 0, min: 0 },
            width: { type: Number, default: 4, min: 1 },
            height: { type: Number, default: 3, min: 1 }
        },
        isVisible: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

widgetSchema.index({ tenantId: 1, dashboardId: 1 });
widgetSchema.index({ tenantId: 1, userId: 1 });

const Widget =
    mongoose.models.Widget ||
    mongoose.model<IWidget>("Widget", widgetSchema);

export default Widget;