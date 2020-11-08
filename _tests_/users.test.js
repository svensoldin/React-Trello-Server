const app = require("../index.js");
const supertest = require("supertest");
const request = supertest(app);
const mongoose = require("mongoose");
const User = require("../models/User");

// Connect to db before tests
beforeAll(async () => {
	const url = `${process.env.MONGO_URI}`;
	await mongoose.connect(url, { useNewUrlParser: true });
});

it("Registers a new user", async (done) => {
	try {
		const response = await request.post("/users/register").send({
			name: "Emma",
			email: "emma@gmail.com",
			password: "12345678",
		});
		expect(response.status).toBe(200);
		expect(response.body).toHaveProperty("token");
		done();
	} catch (err) {
		done(err);
	}
});

it("Does not register a user with an invalid email adress", async (done) => {
	try {
		const response = await request.post("/users/register").send({
			name: "Emma",
			email: "emmagmail.com",
			password: "12345678",
		});
		expect(response.status).toBe(400);
		expect(response.body.errors).toBeTruthy();
		done();
	} catch (err) {
		done(err);
	}
});

// Delete the created user after the test, disconnects from db
afterAll(async (done) => {
	await User.deleteOne({ email: "emma@gmail.com" });
	await mongoose.connection.close();
	done();
});
