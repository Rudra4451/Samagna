import { NextRequest, NextResponse } from 'next/server';
import {
  getConsumerProducts,
  getConsumerProductBySlug,
  getConsumerProductById,
  createConsumerProduct,
} from '@/lib/server/consumerCommerce';
import { ConsumerProductCategory } from '@/lib/consumerCommerce';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');
    const category = (searchParams.get('category') as ConsumerProductCategory) || undefined;
    const inStockOnly = searchParams.get('inStockOnly') === 'true';
    const query = searchParams.get('query') || undefined;

    if (slug) {
      const product = await getConsumerProductBySlug(slug);
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ product });
    }

    if (id) {
      const product = await getConsumerProductById(id);
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ product });
    }

    const products = await getConsumerProducts({ category, inStockOnly, query });
    return NextResponse.json({ products, count: products.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newProduct = await createConsumerProduct(body);
    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 400 });
  }
}

