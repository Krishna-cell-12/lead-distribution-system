import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let provider = null;

    // Try to find by ID if it's potentially a valid UUID
    try {
      provider = await prisma.provider.findUnique({
        where: { id },
        include: {
          assignments: {
            include: {
              lead: true,
            },
          },
        },
      });
    } catch (err) {
      // If ID is not a valid UUID, findUnique will throw. We catch it and fallback.
      console.log("Invalid UUID format, falling back to first provider.");
    }

    // Fallback if not found or invalid ID
    if (!provider) {
      provider = await prisma.provider.findFirst({
        include: {
          assignments: {
            include: {
              lead: true,
            },
          },
        },
      });
    }

    if (!provider) {
      return NextResponse.json(
        { error: "No providers found in the system" },
        { status: 404 }
      );
    }

    return NextResponse.json(provider);
  } catch (error) {
    console.error("Error fetching provider details:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
