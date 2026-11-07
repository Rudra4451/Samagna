import { NextRequest, NextResponse } from 'next/server';
import {
  getRetailProductSkus,
  getRetailProductSkuById,
  createRetailProductSku,
  updateRetailSkuInventory,
} from '@/lib/server/distribution';
import { DistributionProductTier } from '@/lib/distribution';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const partnerId = searchParams.get('partnerId') || undefined;
    const brandId = searchParams.get('brandId') || undefined;
    const tier = (searchParams.get('tier') as DistributionProductTier) || undefined;
    const isPublished = searchParams.has('isPublished') ? searchParams.get('isPublished') === 'true' : undefined;

    if (id) {
      const sku = await getRetailProductSkuById(id);
      if (!sku) {
        return NextResponse.json({ error: 'SKU not found' }, { status: 404 });
      }
      return NextResponse.json({ sku });
    }

    const skus = await getRetailProductSkus({ partnerId, brandId, tier, isPublished });
    return NextResponse.json({ skus, count: skus.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newSku = await createRetailProductSku(body);
    return NextResponse.json({ success: true, sku: newSku }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create retail SKU' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { skuId, onHandDelta, allocatedDelta } = body;

    if (!skuId) {
      return NextResponse.json({ error: 'skuId is required' }, { status: 400 });
    }

    const updated = await updateRetailSkuInventory(skuId, Number(onHandDelta || 0), Number(allocatedDelta || 0));
    return NextResponse.json({ success: true, sku: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update SKU inventory' }, { status: 400 });
  }
}

