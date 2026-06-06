import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

const createSuperAdmin = async () => {
  try {
    console.log("========== SUPER ADMIN CHECK ==========");

    console.log(
      "ENV NAME:",
      process.env.SUPER_ADMIN_NAME
    );

    console.log(
      "ENV EMAIL:",
      process.env.SUPER_ADMIN_EMAIL
    );

    console.log(
      "ENV PASSWORD:",
      process.env.SUPER_ADMIN_PASSWORD
    );

    let admin = await Admin.findOne({
      email: process.env.SUPER_ADMIN_EMAIL,
    });

    if (!admin) {
      admin = new Admin({
        name: process.env.SUPER_ADMIN_NAME,
        email: process.env.SUPER_ADMIN_EMAIL,
        password: process.env.SUPER_ADMIN_PASSWORD,
        role: "superadmin",
      });

      await admin.save();

      console.log(
        "🟢 Super Admin created successfully!"
      );

      return;
    }

    console.log(
      "🟡 Existing Super Admin Found:",
      admin.email
    );

    let updated = false;

    // Name Check
    if (
      admin.name !== process.env.SUPER_ADMIN_NAME
    ) {
      console.log(
        "✏️ Updating Name:",
        admin.name,
        "=>",
        process.env.SUPER_ADMIN_NAME
      );

      admin.name = process.env.SUPER_ADMIN_NAME;
      updated = true;
    }

    // Email Check
    if (
      admin.email !== process.env.SUPER_ADMIN_EMAIL
    ) {
      console.log(
        "✏️ Updating Email:",
        admin.email,
        "=>",
        process.env.SUPER_ADMIN_EMAIL
      );

      admin.email = process.env.SUPER_ADMIN_EMAIL;
      updated = true;
    }

    console.log("DB HASH:", admin.password);

    const passwordMatch = await bcrypt.compare(
      process.env.SUPER_ADMIN_PASSWORD,
      admin.password
    );

    console.log(
      "PASSWORD MATCH WITH ENV:",
      passwordMatch
    );

    // Password Check
    if (!passwordMatch) {
      console.log(
        "🔐 Password mismatch detected. Updating password..."
      );

      admin.password =
        process.env.SUPER_ADMIN_PASSWORD;

      updated = true;
    }

    if (updated) {
      await admin.save();

      console.log(
        "🟢 Super Admin updated from ENV successfully!"
      );
    } else {
      console.log(
        "🟡 Super Admin already exists and is up to date."
      );
    }

    console.log("=======================================");
  } catch (err) {
    console.error(
      "❌ Super Admin setup failed:",
      err
    );
  }
};

export default createSuperAdmin;