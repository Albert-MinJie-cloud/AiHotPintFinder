import { KpiCards } from '../components/KpiCards';
import { TrendChart } from '../components/TrendChart';
import { CategoryChart } from '../components/CategoryChart';
import { HotspotTable } from '../components/HotspotTable';

export default function Overview() {
  return (
    <>
      <KpiCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 min-h-[350px]">
          <TrendChart />
        </div>
        <div className="min-h-[350px]">
          <CategoryChart />
        </div>
      </div>

      <div className="min-h-[400px]">
        <HotspotTable />
      </div>
    </>
  );
}
