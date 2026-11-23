import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ActivityIcon, CpuIcon, DownloadIcon, ListOrderedIcon, TriangleAlertIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { KpiCard } from '../components/dashboard/KpiCard';
import { UtilizationChart } from '../components/dashboard/UtilizationChart';
import { CapacityDonut } from '../components/dashboard/CapacityDonut';
import { StatusMixChart } from '../components/dashboard/StatusMixChart';
import { EnvironmentCapacity } from '../components/dashboard/EnvironmentCapacity';
import { RecentDecisions } from '../components/dashboard/RecentDecisions';
import { AttentionList } from '../components/dashboard/AttentionList';
import { useData } from '../contexts/DataContext';
import { utilizationHistory } from '../data/seed';
import { downloadCsv } from '../utils/csv';
import { fleetSummary, trendPercent } from '../utils/scheduling';

const periods = [
{ days: 7, label: 'Last 7 days' },
{ days: 14, label: 'Last 14 days' },
{ days: 30, label: 'Last 30 days' }];


export function Dashboard() {
  const { resources, workloads, allocations } = useData();
  const navigate = useNavigate();
  const [days, setDays] = useState(14);
  const period = periods.find((p) => p.days === days) ?? periods[1];
  const history = utilizationHistory.slice(-days);
  const fleet = useMemo(() => fleetSummary(resources, allocations), [resources, allocations]);

  const running = workloads.filter((w) => w.status === 'Running').length;
  const queued = workloads.filter((w) => w.queueState === 'Queued' || w.queueState === 'Assigned').length;
  const failedOrDelayed = workloads.filter((w) => w.status === 'Failed' || w.queueState === 'Delayed').length;

  const exportReport = () => {
    downloadCsv(`queldrin-operations-report-${days}d.csv`, [
    { Day: 'Live snapshot', 'Utilization %': fleet.utilization, 'Allocated GPUs': fleet.allocated, 'Available GPUs': fleet.available, Queued: queued, Running: running, Completed: workloads.filter((w) => w.status === 'Completed').length, Failed: workloads.filter((w) => w.status === 'Failed').length },
    ...history.map((h) => ({ Day: h.day, 'Utilization %': h.utilization, 'Allocated GPUs': h.allocated, 'Available GPUs': fleet.total - h.allocated, Queued: h.queued, Running: h.running, Completed: h.completed, Failed: h.failed }))]
    );
    toast.success(`Operations report exported (${period.label.toLowerCase()})`);
  };

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Infrastructure operations"
        title="Infrastructure operations dashboard"
        description="Available and allocated GPU resources, queued and running workloads, failed or delayed requests and recent scheduling decisions in one view."
        actions={
        <>
            <label htmlFor="period" className="sr-only">Reporting period</label>
            <select id="period" className="input h-11 w-auto min-w-[160px]" value={days} onChange={(e) => setDays(Number(e.target.value))}>
              {periods.map((p) =>
            <option key={p.days} value={p.days}>{p.label}</option>
            )}
            </select>
            <button type="button" className="btn-secondary h-11" onClick={exportReport}>
              <DownloadIcon className="h-4 w-4" /> Export report
            </button>
          </>
        } />
      

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        <KpiCard value={String(fleet.allocated)} suffix={`/ ${fleet.total}`} label="Allocated GPU capacity" icon={CpuIcon} trend={trendPercent(history.map((h) => h.allocated))} higherIsGood series={history.map((h) => h.allocated)} onClick={() => navigate('/app/allocations')} />
        <KpiCard value={String(running)} label="Running workloads" icon={ActivityIcon} trend={trendPercent(history.map((h) => h.running))} higherIsGood series={history.map((h) => h.running)} onClick={() => navigate('/app/monitoring')} />
        <KpiCard value={String(queued)} label="Queued workloads awaiting start" icon={ListOrderedIcon} trend={trendPercent(history.map((h) => h.queued))} higherIsGood={false} series={history.map((h) => h.queued)} onClick={() => navigate('/app/queue')} />
        <KpiCard value={String(failedOrDelayed)} label="Failed or delayed requests" icon={TriangleAlertIcon} trend={trendPercent(history.map((h) => h.failed + 1))} higherIsGood={false} series={history.map((h) => h.failed)} onClick={() => navigate('/app/queue?view=Delayed')} />
      </div>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <UtilizationChart data={history} periodLabel={period.label.toLowerCase()} />
        </div>
        <CapacityDonut allocated={fleet.allocated} available={fleet.available} unavailable={fleet.unavailable} utilization={fleet.utilization} nodeCount={resources.length} />
      </div>

      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <RecentDecisions />
        </div>
        <AttentionList />
      </div>

      <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-2">
        <div className="min-w-0"><StatusMixChart workloads={workloads} /></div>
        <div className="min-w-0"><EnvironmentCapacity resources={resources} allocations={allocations} /></div>
      </div>
    </div>);

}