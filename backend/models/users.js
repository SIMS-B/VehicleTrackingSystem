const { Model } = require('objection');
const { Orders } = require('./orders');    // importing order class to define relation

// importing libraries
const Joi = require('joi');

// MODEL

class Users extends Model {
    // getter for table and its coloumn names
    static get tableName() {
        return 'users';
    }

    static get idColumn() {
        return 'id';
    }
    
    static get cnicColumn() {
        return 'cnic';
    }

    static get firstNameColumn() {
        return 'first_name';
    }

    static get lastNameColumn() {
        return 'last_name';
    }

    static get emailColumn() {
        return 'email';
    }

    static get phoneNumberColumn() {
        return 'phone_number';
    }

    static get passwordColumn() {
        return 'password';
    }

    static get registerationDateColumn() {
        return 'registration_date';
    }

    static get isVerifiedColumn() {
        return 'is_verified';
    }

    static get isAdminColumn() {
        return 'is_admin';
    }


    // table's schema
    static get jsonSchema() {
        return {
            type: 'object',
            required: ['cnic', 'first_name', 'last_name', 'email', 'phone_number', 'password', 'registration_date'],
            properties: {
                id:  { type: 'integer' },
                cnic: { type: 'integer' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                email: { type: 'string' },
                phone_number: { type: 'integer' },
                password: { type: 'string' },
                registration_date: { type: 'string' },
                is_verified: { type: 'boolean' },
                is_admin:  { type: 'boolean' }
            }
        };
    };

    // defining relation with orders' table
    static get relationMappings() {
        return {
            Order: {
                relation: Model.HasManyRelation,
                modelClass: Orders,
                join: {
                    from: 'users.id',
                    to: 'orders.user_id'
                }
            }
        };
    };
};

// VALIDATION FUNCTIONS

const validateAdmin = (creds) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(5).max(20).required()
    })  
    const result= Joi.validate(creds, schema);
    return result
  }
  
const validateUser = (creds) => {
  
    const schema = Joi.object({
        cnic: Joi.number().required(),
        password: Joi.string().min(5).max(20).required()
    }) 
    const result= Joi.validate(creds, schema);
    return result
  }

function validatePassword(pwd) {
    
    const schema = Joi.object({
        pwd: Joi.string().min(5).max(20) 
    });

    const result = Joi.validate(pwd, schema);
    return result;
}

function validateEmail(newEmail) {
    
    const schema = Joi.object({
        newEmail: Joi.string().email()
    });

    const result = Joi.validate(newEmail, schema);
    return result;
}

function validatePhoneNumber(newPhoneNumber) {
    
    const schema = Joi.object({
        newPhoneNumber: Joi.number().integer()
    });

    const result = Joi.validate(newPhoneNumber, schema);
    return result;
}

exports.Users = Users;
exports.validatePassword = validatePassword;
exports.validatePhoneNumber = validatePhoneNumber;
exports.validateEmail = validateEmail;  
exports.validateUser = validateUser;
exports.validateAdmin = validateAdmin;
