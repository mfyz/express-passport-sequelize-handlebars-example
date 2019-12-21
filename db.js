const Sequelize = require('sequelize')
const bcrypt = require('bcryptjs')

const DATABASE_URL = process.env.DATABASE_URL

const sequelize = new Sequelize(DATABASE_URL, {
	dialect: 'mysql',
	// logging: false,
})

const globalModelConfig = {
	underscored: true,
	timestamps: true,
}

sequelize.authenticate()
	.then(() => {
		// eslint-disable-next-line no-console
		console.log('Connection has been established successfully.')
	})
	.catch((err) => {
		// eslint-disable-next-line no-console
		console.error('Unable to connect to the database:', err)
	})

const SessionModel = sequelize.define('Session', {
	sid: {
		type: Sequelize.STRING,
		primaryKey: true
	},
	expires: Sequelize.DATE,
	data: Sequelize.STRING(50000),
}, globalModelConfig)

const UserModel = sequelize.define('User', {
	uid: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	username: Sequelize.STRING(30),
	email: Sequelize.STRING(255),
	password_hash: Sequelize.STRING(255),
}, globalModelConfig)

sequelize.sync({
	alter: true
})

// const runQuery = (query, values, queryType) => sequelize.query(query, {
// 	replacements: values,
// 	type: queryType || sequelize.QueryTypes.SELECT
// })

const getUserById = uid => UserModel.findOne({ where: { uid } })
const getUserByUsername = username => UserModel.findOne({ where: { username } })
const getUserByEmail = email => UserModel.findOne({ where: { email } })

const isUsernameInUse = async username => {
	return await getUserByUsername(username) !== null
}

const isEmailInUse = async email => {
	return (await getUserByEmail(email) ? true : false)
}

const createUserRecord = userObj => new Promise(async (resolve, reject) => {
	const passwdHash = await createPasswordHash(userObj.password)
	UserModel.create({
		email: userObj.email,
		username: userObj.username,
		password_hash: passwdHash
	})
		.then((createdUser) => {
			resolve(createdUser)
		})
		.catch(err => reject(err))
})

const createPasswordHash = password => new Promise(async (resolve, reject) => {
	try {
		const saltRounds = 10
		bcrypt.hash(password, saltRounds, (err, hash) => {
			resolve(hash)
		})
	}
	catch (err) {
		reject(err)
	}
})

const isPasswordHashVerified = (hash, password) => new Promise(async (resolve, reject) => {
	try {
		bcrypt.compare(password, hash, (err, res) => {
			resolve(res)
		})
	}
	catch (err) {
		reject(err)
	}
})

module.exports = (session) => {
	const SequelizeStore = require('connect-session-sequelize')(session.Store)
	
	const SessionStore = new SequelizeStore({
		db: sequelize,
		table: 'Session'
	})

	return {
		SessionStore,
		getUserById,
		getUserByUsername,
		getUserByEmail,
		isUsernameInUse,
		isEmailInUse,
		createUserRecord,
		isPasswordHashVerified,
	}
}
