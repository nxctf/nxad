import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import Admin from "@/models/Admin"
import bcrypt from "bcryptjs"

// This route will create the admin with proper password hashing
export async function POST() {
  try {
    // Connect to database
    await connectToDatabase()

    const username = process.env.ADMIN_USERNAME || "admin"
    const password = process.env.ADMIN_PASSWORD

    if (!password) {
      return NextResponse.json(
        { success: false, message: "ADMIN_PASSWORD must be set before creating an admin account" },
        { status: 400 },
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username })

    if (existingAdmin) {
      existingAdmin.password = hashedPassword
      await existingAdmin.save()

      return NextResponse.json({
        success: true,
        message: "Admin account updated with hashed password",
      })
    } else {
      // Create new admin
      const admin = new Admin({
        username,
        password: hashedPassword,
      })

      await admin.save()

      return NextResponse.json({
        success: true,
        message: "Admin account created with hashed password",
      })
    }
  } catch (error) {
    console.error("Create admin error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create admin account",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
