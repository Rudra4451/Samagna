import { NextRequest, NextResponse } from 'next/server';
import {
  getProcessingJobs,
  getProcessingJobById,
  scheduleProcessingJob,
  updateProcessingJobProgress,
} from '@/lib/server/processing';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const facilityId = searchParams.get('facilityId') || undefined;
    const inputLotRef = searchParams.get('inputLotRef') || undefined;
    const outputLotRef = searchParams.get('outputLotRef') || undefined;
    const status = searchParams.get('status') as any;

    if (id) {
      const job = await getProcessingJobById(id);
      if (!job) {
        return NextResponse.json({ success: false, error: 'JOB_NOT_FOUND' }, { status: 404 });
      }
      return NextResponse.json({ success: true, job });
    }

    const jobs = await getProcessingJobs({ facilityId, status, inputLotRef, outputLotRef });
    return NextResponse.json({ success: true, count: jobs.length, jobs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, facilityId, inputLotRef, startDate, targetCompletionDate, actor = 'Processing Coordinator' } = body;

    if (!requestId || !facilityId || !inputLotRef) {
      return NextResponse.json(
        {
          success: false,
          error: 'MISSING_FIELDS',
          message: 'requestId, facilityId, and inputLotRef are required to schedule a processing job.',
        },
        { status: 422 }
      );
    }

    const job = await scheduleProcessingJob({
      requestId,
      facilityId,
      inputLotRef,
      startDate: startDate || new Date().toISOString(),
      targetCompletionDate: targetCompletionDate || new Date(Date.now() + 5 * 86400000).toISOString(),
      actor,
    });

    return NextResponse.json({
      success: true,
      message: 'Processing job scheduled with unique output lot lineage reference.',
      job,
    });
  } catch (err: any) {
    const status = err.message.includes('CAPACITY_CONFLICT_EXCEEDED') ? 409 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, status, actor = 'Plant Operator', updateData } = body;

    if (!jobId || !status) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: 'jobId and status are required.' },
        { status: 422 }
      );
    }

    const job = await updateProcessingJobProgress(jobId, status, actor, updateData);
    return NextResponse.json({
      success: true,
      message: `Processing job transitioned to ${status}.`,
      job,
    });
  } catch (err: any) {
    const status = err.message.includes('MASS_BALANCE') || err.message.includes('QUALITY_INSPECTION') ? 422 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

