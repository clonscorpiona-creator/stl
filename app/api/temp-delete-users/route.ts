import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Temporary endpoint to delete all users - NO AUTH (remove after use!)
export async function GET(request: NextRequest) {
  try {
    const result = await prisma.user.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} users`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
