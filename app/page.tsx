import { LaserFlowBoxExample } from '@/components/ui/laser-flow-box';

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-[#120F17] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-7xl">
        <LaserFlowBoxExample />
      </div>
    </div>
  );
}
