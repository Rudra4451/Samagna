import { NextRequest, NextResponse } from 'next/server';
import {
  getProcessingRequests,
  getProcessingRequestById,
  submitProcessingRequest,
  matchProcessingFacilitiesForRequest,
  reviewProcessingRequest,
} from '@/lib/server/processing';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const requestingOrgId = searchParams.get('requestingOrgId') || undefined;
    const status = searchParams.get('status') as any;

    if (id) {
      const request = await getProcessingRequestById(id);
      if (!request) {
        return NextResponse.json({ success: false, error: 'REQUEST_NOT_FOUND' }, { status: 404 });
      }
      return NextResponse.json({ success: true, request });
    }

    const requests = await getProcessingRequests({ requestingOrgId, status });
    return NextResponse.json({ success: true, count: requests.length, requests });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.requestingOrgId || !body.inputProduceSlug || !body.inputProduceName || !body.inputQuantityKg || !body.requiredOutputName) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: 'requestingOrgId, inputProduceSlug, inputProduceName, inputQuantityKg, and requiredOutputName are required.',
        },
        { status: 422 }
      );
    }

    const request = await submitProcessingRequest({
      requestingOrgId: body.requestingOrgId,
      requestingOrgName: body.requestingOrgName || body.requestingOrgId,
      targetFacilityId: body.targetFacilityId || null,
      inputProduceSlug: body.inputProduceSlug,
      inputProduceName: body.inputProduceName,
      inputQuantityKg: Number(body.inputQuantityKg),
      requiredOutputName: body.requiredOutputName,
      desiredQualitySpecs: body.desiredQualitySpecs || 'Standard Government Quality Specifications',
      expectedYieldPercent: Number(body.expectedYieldPercent || 85.0),
      facilityRequirements: body.facilityRequirements || null,
      preferredStartDate: body.preferredStartDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      preferredCompletionDate: body.preferredCompletionDate || new Date(Date.now() + 14 * 86400000).toISOString(),
      deliveryRequirements: body.deliveryRequirements || 'Ex-Facility Warehouse Transfer',
    });

    return NextResponse.json({
      success: true,
      message: 'Processing request submitted successfully for facility capacity matching.',
      request,
    });
  } catch (err: any) {
    const status = err.message.includes('UNVERIFIED_ORGANISATION_BLOCKED') ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, requestId, ...params } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'requestId and action are required.' },
        { status: 422 }
      );
    }

    if (action === 'MATCH') {
      const matchData = await matchProcessingFacilitiesForRequest(requestId);
      return NextResponse.json({
        success: true,
        message: 'Capacity matching evaluation completed for manual operator review. No physical inventory allocated.',
        request: matchData.request,
        candidates: matchData.candidateMatches,
      });
    }

    if (action === 'REVIEW') {
      const { decision, facilityId, notes } = params;
      if (!decision || (decision !== 'ACCEPT' && decision !== 'REJECT')) {
        return NextResponse.json(
          { success: false, error: 'INVALID_DECISION', message: "decision must be 'ACCEPT' or 'REJECT'." },
          { status: 422 }
        );
      }

      const updated = await reviewProcessingRequest(requestId, decision, facilityId, notes);
      return NextResponse.json({
        success: true,
        message: `Processing request marked as ${decision}.`,
        request: updated,
      });
    }

    return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

