
import {
    Model,
    ClientSession,
} from "mongoose";

export class BaseRepository<T> {
    constructor(
        protected readonly model: Model<T>
    ) {}

    async create(
        data: Partial<T>,
        session?: ClientSession
    ) {
        const document = new this.model(data);

        if (session) {
            return document.save({ session });
        }

        return document.save();
    }

    async findById(
        id: string,
        session?: ClientSession
    ) {
        const query = this.model.findById(id);

        if (session) {
            query.session(session);
        }

        return query.exec();
    }

    async findOne(
        filter: Record<string, unknown>,
        session?: ClientSession
    ) {
        const query = this.model.findOne(filter as never);

        if (session) {
            query.session(session);
        }

        return query.exec();
    }

    async findMany(
        filter: Record<string, unknown> = {},
        session?: ClientSession
    ) {
        const query = this.model.find(filter as never);

        if (session) {
            query.session(session);
        }

        return query.exec();
    }

    async updateById(
        id: string,
        updates: Record<string, unknown>,
        session?: ClientSession
    ) {
        return this.model.findByIdAndUpdate(
            id,
            updates as never,
            {
                new: true,
                runValidators: true,
                ...(session ? { session } : {}),
            }
        ).exec();
    }

    async deleteById(
        id: string,
        session?: ClientSession
    ) {
        return this.model.findByIdAndDelete(
            id,
            session ? { session } : {}
        ).exec();
    }

    async count(
        filter: Record<string, unknown> = {},
        session?: ClientSession
    ) {
        const query = this.model.countDocuments(filter as never);

        if (session) {
            query.session(session);
        }

        return query.exec();
    }
}
