import { useState, useEffect } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { BarChart, PieChart, LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart, PieChart, LineChart,
  GridComponent, TooltipComponent, TitleComponent, LegendComponent,
  CanvasRenderer,
]);

import { API, fetchApi } from "../config.js";

const CHART_TEXT_COLOR = "#94a3b8";
const CHART_AXIS_COLOR = "#e2e8f0";

const STATUSES = [
  { value: "potential", label: "潜在客户", color: "#94a3b8" },
  { value: "contacted", label: "已联系", color: "#60a5fa" },
  { value: "following", label: "跟进中", color: "#f59e0b" },
  { value: "won", label: "已成交", color: "#10b981" },
  { value: "lost", label: "无效客户", color: "#f43f5e" },
];

function baseOptions(extra) {
  return {
    textStyle: { color: CHART_TEXT_COLOR, fontSize: 11, fontFamily: "Inter, system-ui, sans-serif" },
    grid: { left: 0, right: 0, top: 8, bottom: 0, containLabel: true },
    ...extra,
  };
}

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState(null);
  const [countryData, setCountryData] = useState([]);
  const [industryData, setIndustryData] = useState([]);
  const [growthData, setGrowthData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      const [ov, ct, ind, gr] = await Promise.all([
        fetchApi(`${API}/analytics/overview`).then((r) => r.json()),
        fetchApi(`${API}/analytics/country-distribution`).then((r) => r.json()),
        fetchApi(`${API}/analytics/industry-distribution`).then((r) => r.json()),
        fetchApi(`${API}/analytics/growth-trend`).then((r) => r.json()),
      ]);
      setOverview(ov.data);
      setCountryData(ct.data || []);
      setIndustryData(ind.data || []);
      setGrowthData(gr.data || []);
      setLoading(false);
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
        <div className="flex space-x-1.5">
          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
        </div>
      </main>
    );
  }

  const statusPieOption = baseOptions({
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: 0, textStyle: { color: CHART_TEXT_COLOR, fontSize: 11 } },
    series: [{
      type: "pie",
      radius: ["55%", "82%"],
      center: ["50%", "45%"],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: "#fff", borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: "bold" } },
      data: STATUSES.map((s) => ({
        value: overview?.statusCounts?.[s.value] || 0,
        name: s.label,
        itemStyle: { color: s.color },
      })),
    }],
  });

  const countryBarOption = baseOptions({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: {
      type: "value", axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: CHART_AXIS_COLOR, type: "dashed" } },
      axisLabel: { color: CHART_TEXT_COLOR, fontSize: 10 },
    },
    yAxis: {
      type: "category", data: countryData.map((d) => d.name).reverse(),
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: "#64748b", fontSize: 10 },
    },
    series: [{
      type: "bar", data: countryData.map((d) => d.value).reverse(),
      barWidth: 10, itemStyle: { borderRadius: [0, 4, 4, 0], color: "#6366f1" },
    }],
  });

  const industryBarOption = baseOptions({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: {
      type: "category", data: industryData.map((d) => d.name),
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: "#64748b", fontSize: 10, rotate: 30 },
    },
    yAxis: {
      type: "value", axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: CHART_AXIS_COLOR, type: "dashed" } },
      axisLabel: { color: CHART_TEXT_COLOR, fontSize: 10 },
    },
    series: [{
      type: "bar", data: industryData.map((d) => d.value),
      barWidth: 20, itemStyle: { borderRadius: [4, 4, 0, 0], color: "#14b8a6" },
    }],
  });

  const growthLineOption = baseOptions({
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category", data: growthData.map((d) => d.month),
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: CHART_TEXT_COLOR, fontSize: 10 },
    },
    yAxis: {
      type: "value", axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: CHART_AXIS_COLOR, type: "dashed" } },
      axisLabel: { color: CHART_TEXT_COLOR, fontSize: 10 },
    },
    series: [{
      type: "line", data: growthData.map((d) => d.count),
      smooth: true, symbol: "circle", symbolSize: 4,
      lineStyle: { color: "#6366f1", width: 2 },
      itemStyle: { color: "#6366f1" },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: "rgba(99, 102, 241, 0.12)" },
        { offset: 1, color: "rgba(99, 102, 241, 0)" },
      ])},
    }],
  });

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">数据分析</h1>
            <p className="mt-0.5 text-sm text-slate-500">销售概览与客户洞察</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "客户总数", value: overview?.total || 0, sub: "位", icon: "👥" },
            { label: "已成交", value: overview?.statusCounts?.won || 0, sub: "位", icon: "✅" },
            { label: "转化率", value: overview?.conversionRate || 0, sub: "%", icon: "📈" },
            { label: "收藏客户", value: overview?.favorited || 0, sub: "位", icon: "⭐" },
            { label: "跟进中", value: overview?.statusCounts?.following || 0, sub: "位", icon: "🔄" },
          ].map((kpi, i) => (
            <div key={i} className="rounded-xl border border-slate-200/60 bg-white p-5 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
                <span className="text-lg">{kpi.icon}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-slate-900">{kpi.value}</span>
                <span className="text-sm text-slate-400">{kpi.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="rounded-xl border border-slate-200/60 bg-white p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">客户状态分布</h3>
            <ReactEChartsCore echarts={echarts} option={statusPieOption} style={{ height: 260 }} />
          </div>

          {/* Country Distribution */}
          <div className="rounded-xl border border-slate-200/60 bg-white p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">客户国家分布</h3>
            {countryData.length > 0 ? (
              <ReactEChartsCore echarts={echarts} option={countryBarOption} style={{ height: 260 }} />
            ) : (
              <div className="flex items-center justify-center h-[260px] text-sm text-slate-400">暂无数据</div>
            )}
          </div>

          {/* Industry Distribution */}
          <div className="rounded-xl border border-slate-200/60 bg-white p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">行业占比</h3>
            {industryData.length > 0 ? (
              <ReactEChartsCore echarts={echarts} option={industryBarOption} style={{ height: 260 }} />
            ) : (
              <div className="flex items-center justify-center h-[260px] text-sm text-slate-400">暂无数据</div>
            )}
          </div>

          {/* Growth Trend */}
          <div className="rounded-xl border border-slate-200/60 bg-white p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">客户增长趋势</h3>
            {growthData.length > 0 ? (
              <ReactEChartsCore echarts={echarts} option={growthLineOption} style={{ height: 260 }} />
            ) : (
              <div className="flex items-center justify-center h-[260px] text-sm text-slate-400">暂无数据</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
