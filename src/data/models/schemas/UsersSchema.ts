import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const Schema = mongoose.Schema;

const UsersSchema = new Schema({
	email: {
		type: String,
		required: true,
		unique: true,
		trim: true,
		lowercase: true
	},
	password: {
		type: String,
		required: true
	},
	username: {
		type: String,
		required: false,
	},
	phone:{
		type: String,
		required: false,
		unique: true,
		sparse: true
	},
	bio: {
		type: String,
		required: false,
		validate: {
			validator: function(e) {
			  return e.length < 2200;
			},
			message: props => `${props.value} too long!`
		  }
	},
	posts: [{
		type: Schema.Types.ObjectId,
        ref:'posts',
	}],
	imageUrl: {
		type: String,
		required: true,
		default: "https://static.vecteezy.com/system/resources/previews/009/734/564/non_2x/default-avatar-profile-icon-of-social-media-user-vector.jpg",
	},
	isAdmin: {
		type: Boolean,
		required: true,
		default: false
	},
	isActive: {
		type: Boolean,
		required: true,
		default: false
	},
	isPhoneVerified: {
		type: Boolean,
		required: true,
		default: false
	},
	otpSecret: {
		type: String,
		required: false
	  }, 
	registrationDate: {
		type: Date,
		required: true,
		default: Date.now
	},
	lastLogin: {
		type: Date,
		required: true,
		default: Date.now
	}
});

UsersSchema.pre('save', function (next) {
    const fieldsToHash = ['password', 'otpSecret'];
    const modifiedFields = fieldsToHash.filter(field => this.isModified(field));

    if (modifiedFields.length === 0) {
        return next();
    }

    const hashField = (field) => {
        return new Promise<void>((resolve, reject) => {
            bcrypt.genSalt((err, salt) => {
                if (err) return reject(err);
                bcrypt.hash(this[field], salt, (err, hash) => {
                    if (err) return reject(err);
                    this[field] = hash;
                    resolve();
                });
            });
        });
    };

    Promise.all(modifiedFields.map(hashField))
        .then(() => next())
        .catch(err => next(err));
});

export { UsersSchema };
