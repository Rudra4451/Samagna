import { NextRequest, NextResponse } from 'next/server';
import { getTradeListings, getTradeListingById, createTradeListing } from '@/lib/server/b2bTrade';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const produceSlug = searchParams.get('produceSlug') || undefined;
    const sellerOrgId = searchParams.get('sellerOrgId') || undefined;

    if (id) {
      const listing = await getTradeListingById(id);
      if (!listing) {
        return NextResponse.json({ success: false, error: 'LISTING_NOT_FOUND' }, { status: 404 });
      }
      return NextResponse.json({ success: true, listing });
    }

    const listings = await getTradeListings({ produceSlug, sellerOrgId, isActive: true });
    return NextResponse.json({
      success: true,
      count: listings.length,
      listings,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Verify statutory clearance invariant
    if (!body.isStatutoryClearanceVerified || !body.lotSaleAuthorizationRef) {
      return NextResponse.json(
        {
          success: false,
          error: 'UNAUTHORIZED_STOCK_LISTING_BLOCKED',
          message: 'Lot must have verified statutory clearance from DPO prior to commercial listing.',
        },
        { status: 403 }
      );
    }

    if (!body.sellerOrgId || !body.produceSlug || !body.produceName || !body.totalLotQuantityKg || !body.indicativePricePerKg) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_REQUIRED_FIELDS',
          message: 'sellerOrgId, produceSlug, produceName, totalLotQuantityKg, and indicativePricePerKg are required.',
        },
        { status: 422 }
      );
    }

    const listing = await createTradeListing({
      sellerOrgId: body.sellerOrgId,
      sellerOrgName: body.sellerOrgName,
      produceSlug: body.produceSlug,
      produceName: body.produceName,
      scientificName: body.scientificName || null,
      qualityGrade: body.qualityGrade || 'Grade 1 / Premium',
      totalLotQuantityKg: Number(body.totalLotQuantityKg),
      minimumOrderQuantityKg: Number(body.minimumOrderQuantityKg || 25),
      indicativePricePerKg: Number(body.indicativePricePerKg),
      depotFacilityId: body.depotFacilityId || 'BRP-01',
      storageBayLocation: body.storageBayLocation || 'Bay 01-A',
      warehouseBatchRef: body.warehouseBatchRef || 'BS-402',
      lotSaleAuthorizationRef: body.lotSaleAuthorizationRef,
      authorizingOfficer: body.authorizingOfficer || 'patnaik.dpo',
      isStatutoryClearanceVerified: Boolean(body.isStatutoryClearanceVerified),
      availabilityStartDate: body.availabilityStartDate || new Date().toISOString(),
      availabilityEndDate: body.availabilityEndDate || new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      labReportUrl: body.labReportUrl || null,
      inspectionCertificateRef: body.inspectionCertificateRef || null,
      packagingDescription: body.packagingDescription || '50kg Jute Gunny Bag (Double Stitched)',
    });

    return NextResponse.json({
      success: true,
      message: 'Lot listing created successfully with verified statutory clearance.',
      listing,
    });
  } catch (err: any) {
    const status = err.message.includes('BLOCKED') ? 403 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

