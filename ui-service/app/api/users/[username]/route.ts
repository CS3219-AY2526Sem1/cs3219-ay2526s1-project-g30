// AI Assistance Disclosure:
// Tool: sst/opencode (model: Polaris Alpha), date: 2025‑11-12
// Scope: Generated implementation based on component specifications for PPR and existing code structure
// Author review: Validated correctness, fixed bugs

import { getUserProfile, UserServiceError } from '@/lib/userServiceClient';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/users/:username
 * 
 * Fetches a user's public profile data.
 * This endpoint is accessible to all clients and forwards requests to the internal user service.
 * 
 * @param request NextRequest object
 * @param params Route parameters
 * @returns User profile data (excluding sensitive fields)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    let username: string;
    
    try {
      const resolvedParams = await params;
      username = resolvedParams.username;
    } catch (paramError) {
      console.error('[User Profile API] Failed to resolve params:', paramError);
      return NextResponse.json(
        { error: 'Failed to parse request parameters' },
        { status: 400 }
      );
    }

    if (!username || typeof username !== 'string' || !username.trim()) {
      return NextResponse.json(
        { error: 'Invalid username provided' },
        { status: 400 }
      );
    }

    console.log('[User Profile API] Fetching profile for:', username);
    const profile = await getUserProfile(username.trim());

    return NextResponse.json(profile, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('[User Profile API] Error fetching profile:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle UserServiceError specifically
    if (error instanceof UserServiceError) {
      if (error.statusCode === 404) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      console.error('[User Profile API] User service error:', {
        status: error.statusCode,
        message: error.message,
        data: error.data,
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

