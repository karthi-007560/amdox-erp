import mongoose, {
    Schema,
    type Document,
    type Types,
} from "mongoose";

export type ForecastMethod = "simple_moving_average";

export interface IForecastDemand {
    periodStart: Date;
    periodEnd: Date;
    quantity: number;
}

export interface IForecast extends Document {
    tenantId: Types.ObjectId;
    inventoryId: Types.ObjectId;
    historicalDemand: IForecastDemand[];
    forecastedDemand: IForecastDemand[];
    method: ForecastMethod;
    windowSize: number;
    generatedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const forecastDemandSchema = new Schema<IForecastDemand>(
    {
        periodStart: {
            type: Date,
            required: true,
        },
        periodEnd: {
            type: Date,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        _id: false,
    }
);

const forecastSchema = new Schema<IForecast>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
        },
        inventoryId: {
            type: Schema.Types.ObjectId,
            ref: "Inventory",
            required: true,
        },
        historicalDemand: {
            type: [forecastDemandSchema],
            required: true,
            validate: {
                validator: (items: IForecastDemand[]) =>
                    items.length > 0,
                message: "Historical demand cannot be empty",
            },
        },
        forecastedDemand: {
            type: [forecastDemandSchema],
            required: true,
            validate: {
                validator: (items: IForecastDemand[]) =>
                    items.length > 0,
                message: "Forecasted demand cannot be empty",
            },
        },
        method: {
            type: String,
            enum: ["simple_moving_average"],
            default: "simple_moving_average",
            required: true,
        },
        windowSize: {
            type: Number,
            required: true,
            min: 1,
        },
        generatedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

forecastSchema.index({
    tenantId: 1,
    inventoryId: 1,
    createdAt: -1,
});

forecastSchema.index({
    tenantId: 1,
    createdAt: -1,
});

const Forecast =
    mongoose.models.Forecast ||
    mongoose.model<IForecast>("Forecast", forecastSchema);

export default Forecast;