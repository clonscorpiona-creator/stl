/*
 * 📊 STL Platform - Statistics API Endpoint
 * 📦 Version: 1.0.0
 * 📅 Created: 2026-03-22
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalMembers, totalArtists, totalWorks, uniqueDirections] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          works: {
            some: {
              status: "PUBLISHED"
            }
          }
        }
      }),
      prisma.work.count({
        where: {
          status: "PUBLISHED"
        }
      }),
      prisma.userDirection.findMany({
        select: {
          direction: true
        },
        distinct: ["direction"]
      })
    ]);

    return NextResponse.json({
      totalMembers,
      totalArtists,
      totalWorks,
      totalSpecializations: uniqueDirections.length
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      {
        totalMembers: 0,
        totalArtists: 0,
        totalWorks: 0,
        totalSpecializations: 0
      },
      { status: 200 }
    );
  }
}
