import { NextResponse } from "next/server";

export type JsonObject = Record<string, unknown>;

export function apiSuccess(payload: JsonObject = {}, status = 200): NextResponse {
    return NextResponse.json({ success: true, ...payload }, { status });
}

export function apiError(error: string, status = 500, payload: JsonObject = {}): NextResponse {
    return NextResponse.json({ success: false, error, ...payload }, { status });
}

export async function withApiHandler(
    operation: string,
    handler: () => Promise<NextResponse>
): Promise<NextResponse> {
    try {
        return await handler();
    } catch (error) {
        console.error(`${operation} error:`, error);
        return apiError("Internal server error", 500);
    }
}
