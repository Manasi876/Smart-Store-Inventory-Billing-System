import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../../models/user.model.js";
import {DB_NAME} from "../../constants.js";


/*
  seedAdmin.js - Yeh script sirf ek baar chalega, project setup ke waqt.
  Isse hum pehla ADMIN bana rahe hain seedha database mein, kyunki
  registerUser controller ke through naya Admin sirf ek existing Admin
  hi bana sakta hai - toh pehla Admin kahan se aayega? Yahi se!

  Chalane ka tarika (package.json mein script bhi bana lena):
    node src/seeds/seedAdmin.js

  Ya package.json mein:
    "scripts": { "seed:admin": "node src/seeds/seedAdmin.js" }
  aur phir:
    npm run seed:admin
*/

const seedAdmin = async () => {
    try {
        await mongoose.connect(
            `${process.env.MONGO_URI}/${DB_NAME}`,
        );
        console.log("MongoDB connected for seeding...");

        // Pehle check karo ki kahin admin already toh nahi bana hua
        const existingAdmin = await User.findOne({ role: "admin" });

        if (existingAdmin) {
            console.log(
                `Admin already exists: ${existingAdmin.username} (${existingAdmin.email}). Seed skip kar rahe hain.`,
            );
            process.exit(0);
        }

        // Credentials .env se aa rahe hain - hardcode mat karo, security risk hai
        const adminData = {
            fullName: process.env.ADMIN_FULLNAME || "Store Admin",
            email: process.env.ADMIN_EMAIL,
            username: process.env.ADMIN_USERNAME,
            password: process.env.ADMIN_PASSWORD,
            role: "admin",
        };

        if (!adminData.email || !adminData.username || !adminData.password) {
            throw new Error(
                "ADMIN_EMAIL, ADMIN_USERNAME aur ADMIN_PASSWORD .env mein set karna zaroori hai",
            );
        }

        // User.create() use kar rahe hain, isliye password wala pre-save hook
        // (bcrypt hashing) automatically chal jaayega - alag se hash nahi karna
        const admin = await User.create(adminData);

        console.log("✅ Pehla Admin ban gaya:");
        console.log({
            username: admin.username,
            email: admin.email,
            role: admin.role,
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Admin seeding fail ho gaya:", error.message);
        process.exit(1);
    }
};

seedAdmin();
