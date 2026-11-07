import React from 'react';

interface BatchJourneyDiagramProps {
  activeStep?: 1 | 2 | 3 | 4;
  className?: string;
}

export const BatchJourneyDiagram: React.FC<BatchJourneyDiagramProps> = ({
  activeStep = 1,
  className = '',
}) => {
  const steps = [
    {
      num: '01',
      title: 'Forest Gathering',
      location: 'Karanjia Cluster #01',
      metric: '100.0 kg Intake',
      status: 'Direct DBT Released',
    },
    {
      num: '02',
      title: 'Waybill & Stencil',
      location: 'Transit OD-11-AB-1234',
      metric: '3 Jute Sacks',
      status: 'Digital Seal OD-ST-8840',
    },
    {
      num: '03',
      title: 'Depôt Reweigh',
      location: 'Baripada Central #02',
      metric: '98.5 kg (-1.5% Loss)',
      status: 'Grade 1 Certified',
    },
    {
      num: '04',
      title: 'Enterprise Fulfillment',
      location: 'Dabur Pharma Unit',
      metric: '50.0 kg Purchase Order',
      status: 'Statutory 0% Platform Fee',
    },
  ];

  return (
    <div className={`w-full bg-[#FFFAF2] border border-[#D7D2C8] rounded-[6px] p-4 sm:p-6 space-y-6 ${className}`}>
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#D7D2C8] gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2D4F1E]" />
          <span className="font-mono text-[12px] font-bold uppercase tracking-[0.08em] text-[#1F1A14]">
            Specimen Custody Chain: Batch #BS-402
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#544E45] bg-[#E9DDC9] px-2 py-0.5 rounded-[3px]">
          Produce: Dried Mahua Flowers · Mayurbhanj
        </span>
      </div>

      {/* 4-Step Visual Track */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {steps.map((step, idx) => {
          const stepNumber = (idx + 1) as 1 | 2 | 3 | 4;
          const isCurrent = activeStep === stepNumber;

          return (
            <div
              key={step.num}
              className={`p-4 rounded-[4px] border transition-all relative flex flex-col justify-between ${
                isCurrent
                  ? 'border-[#2D4F1E] bg-[#F5E6CC]/40 shadow-xs'
                  : 'border-[#D7D2C8] bg-surface hover:border-[#544E45]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] font-bold text-[#E27D60]">
                    STAGE {step.num}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#2D4F1E]" />
                </div>

                <h4 className="font-serif text-[15px] font-semibold text-[#1F1A14] leading-snug">
                  {step.title}
                </h4>
                <p className="text-[11px] font-mono text-[#544E45] mt-1">
                  {step.location}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#D7D2C8]/60 space-y-1">
                <p className="text-[12px] font-mono font-bold text-[#2D4F1E] tabular-nums">
                  {step.metric}
                </p>
                <p className="text-[10px] font-mono text-[#544E45]">
                  {step.status}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

