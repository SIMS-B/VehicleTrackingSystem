const { Model } = require('objection');

class Orders extends Model {
    // getter for table and its coloumn names
    static get tableName() {
        return 'orders';
    }

    static get orderIdColumn() {
        return 'id';
    }

    static get userIdColumn() {
        return 'user_id';
    }

    static get cnicColumn() {
        return 'cnic';
    }

    static get vehicleNameColumn() {
        return 'vehicle_name';
    }

    static get vechileModelColumn() {
        return 'vehicle_model';
    }

    static get vechileColorColumn() {
        return 'vehicle_color';
    }

    static get statusColumn() {
        return 'status';
    }

    static get startingDateColumn() {
        return 'starting_date';
    }

    static get deliveryDateColumn() {
        return 'delivery_date';
    }

    static get configColumn() {
        return 'config';
    }

    // table's schema
    static get jsonSchema() {
        return {
            type: 'object',
            required: ['user_id', 'cnic', 'vehicle_name', 'vehicle_model', 'vehicle_color', 'status', 'starting_date', 'delivery_date'],
            properties: {
                id: { type: 'integer' },
                user_id:  { type: 'integer' },
                cnic: { type: 'integer' },
                vehicle_name: { type: 'string' },
                vehicle_model: { type: 'string' },
                vehicle_color: { type: 'string' },
                status: { type: 'string' },
                starting_date: { type: 'string' },
                delivery_date: { type: 'string' },
                config: { type: 'object' }
            }
        };
    }
};

// module.exports = Orders;
exports.Orders = Orders;