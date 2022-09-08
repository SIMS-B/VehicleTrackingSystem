const { Model } = require('objection');

// importing libraries
const Joi = require('joi');

class Configurations extends Model {
    // getter for table and its coloumn names
    static get tableName() {
        return 'configurations';
    }

    static get poReceptionColumn() {
        return 'po_reception';
    }

    static get factoryFloorColumn() {
        return 'factory_floor';
    }

    static get vinColumn() {
        return 'vin';
    }

    static get chasisColumn() {
        return 'chassis';
    }

    static get readyToShipColumn() {
        return 'ready_to_ship';
    }

    static get arrivalAtVendorColumn() {
        return 'arrival_at_vendor';
    }

    static get idColumn() {
        return 'id';
    }


    // table's schema
    static get jsonSchema() {
        return {
            type: 'object',
            required: ['po_reception', 'factory_floor', 'vin', 'chassis', 'ready_to_ship', 'arrival_at_vendor', 'id'],
            properties: {
                po_reception: { type: 'integer' },
                factory_floor: { type: 'integer' },
                vin: { type: 'integer' },
                chassis: { type: 'integer' },
                ready_to_ship: { type: 'integer' },
                arrival_at_vendor: { type: 'integer' },
                id: { type: 'integer' }
            }
        };
    }
};

const validateConfig = (configs) => {

    const schema = Joi.object({
        po_reception: Joi.number().required(),
        factory_floor: Joi.number().required(),
        vin: Joi.number().required(),
        chassis: Joi.number().required(),
        ready_to_ship: Joi.number().required(),
        arrival_at_vendor: Joi.number().required()
    })  
    const result = Joi.validate(configs, schema);
    return result;
  }

// module.exports = Configurations;
exports.Configurations = Configurations;
exports.validateConfig = validateConfig;