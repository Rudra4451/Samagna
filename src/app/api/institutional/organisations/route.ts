import { NextRequest, NextResponse } from 'next/server';
import { requireServerRole } from '@/lib/server/auth';
import {
  getInstitutionalOrganisation,
  updateInstitutionalConfiguration,
} from '@/lib/server/institutional';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // All authenticated operational roles can inspect organisation profile within their district/facility
  const auth = await requireServerRole(req, [
    'COLLECTOR',
    'SHG_FACILITATOR',
    'COLLECTION_MANAGER',
    'WAREHOUSE_MANAGER',
    'SUPERVISOR_ADMIN',
  ]);

  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get('orgId') || 'ORG-TDCCOL-OR';

  const result = await getInstitutionalOrganisation(auth.actor, orgId);
  if (!result.success) {
    const status = result.error === 'ORGANISATION_ACCESS_DENIED' ? 403 : 404;
    return NextResponse.json(
      { success: false, error: result.error, message: 'Institutional organisation could not be retrieved.' },
      { status }
    );
  }

  return NextResponse.json({
    success: true,
    organisation: result.organisation,
  });
}

export async function PATCH(req: NextRequest) {
  // Only SUPERVISOR_ADMIN can update operational configuration
  const auth = await requireServerRole(req, ['SUPERVISOR_ADMIN']);
  if (!auth.authorized || !auth.actor) {
    return auth.errorResponse!;
  }

  // Demo sessions must never execute mutations
  if (auth.actor.isDemo) {
    return NextResponse.json(
      {
        success: false,
        error: 'DEMO_SESSION_MUTATION_BLOCKED',
        message: 'Demo mode is a simulation. Server configuration mutations are blocked for demo sessions.',
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { orgId = 'ORG-TDCCOL-OR', operationalConfig } = body;

    if (!operationalConfig || typeof operationalConfig !== 'object') {
      return NextResponse.json(
        { success: false, error: 'INVALID_CONFIG_PAYLOAD', message: 'Valid operational configuration object required.' },
        { status: 422 }
      );
    }

    // Validate shrinkage tolerance boundaries
    if (
      operationalConfig.allowableShrinkagePercent !== undefined &&
      (operationalConfig.allowableShrinkagePercent < 0 || operationalConfig.allowableShrinkagePercent > 10)
    ) {
      return NextResponse.json(
        { success: false, error: 'INVALID_SHRINKAGE_BOUNDS', message: 'Allowable shrinkage must be between 0.0% and 10.0%.' },
        { status: 422 }
      );
    }

    const result = await updateInstitutionalConfiguration(auth.actor, orgId, operationalConfig);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, message: 'Failed to update institutional configuration.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Operational configuration updated successfully.',
      organisation: result.organisation,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'MALFORMED_JSON_BODY', message: err?.message || 'Invalid JSON body.' },
      { status: 400 }
    );
  }
}

