"use client";

import { useMemo, useState } from "react";

type InsightsArticle = {
  read_at: string;
  word_count: number | null;
  theme_tags: string[] | null;
};

type Timeframe = "weekly" | "monthly";
type ThemeTimeframe = "week" | "month" | "all";

type SeriesPoint = {
  date: Date;
  label: string;
  count: number;
  minutes: number;
};

type LineChartProps = {
  title: string;
  data: SeriesPoint[];
  valueKey: "count" | "minutes";
  valueLabel: string;
  valueFormatter: (value: number) => string;
};

type ThemePoint = {
  theme: string;
  count: number;
};

type BarChartProps = {
  title: string;
  data: ThemePoint[];
};

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day + 6) % 7;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfMonth(date: Date) {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addWeeks(date: Date) {
  const result = new Date(date);
  result.setDate(result.getDate() + 7);
  return result;
}

function addMonths(date: Date) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

function estimateMinutes(wordCount: number | null) {
  if (!wordCount) return 0;
  return Math.max(1, Math.ceil(wordCount / 200));
}

function formatWeekLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function buildSeries(articles: InsightsArticle[], timeframe: Timeframe) {
  if (articles.length === 0) return [];

  const buckets = new Map<
    string,
    { date: Date; count: number; minutes: number }
  >();

  const dates = articles.map((article) => new Date(article.read_at));
  const minDate = new Date(Math.min(...dates.map((date) => date.getTime())));
  const maxDate = new Date(Math.max(...dates.map((date) => date.getTime())));

  for (const article of articles) {
    const readDate = new Date(article.read_at);
    const bucketDate =
      timeframe === "weekly" ? startOfWeek(readDate) : startOfMonth(readDate);
    const key = bucketDate.toISOString();
    const bucket = buckets.get(key) ?? {
      date: bucketDate,
      count: 0,
      minutes: 0,
    };
    bucket.count += 1;
    bucket.minutes += estimateMinutes(article.word_count);
    buckets.set(key, bucket);
  }

  const start =
    timeframe === "weekly" ? startOfWeek(minDate) : startOfMonth(minDate);
  const end =
    timeframe === "weekly" ? startOfWeek(maxDate) : startOfMonth(maxDate);
  const step = timeframe === "weekly" ? addWeeks : addMonths;
  const labelFormatter =
    timeframe === "weekly" ? formatWeekLabel : formatMonthLabel;

  const series: SeriesPoint[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor = step(cursor)) {
    const key = cursor.toISOString();
    const bucket = buckets.get(key) ?? {
      date: new Date(cursor),
      count: 0,
      minutes: 0,
    };
    series.push({
      date: bucket.date,
      label: labelFormatter(bucket.date),
      count: bucket.count,
      minutes: bucket.minutes,
    });
  }

  return series;
}

function buildThemeSeries(
  articles: InsightsArticle[],
  timeframe: ThemeTimeframe
) {
  const now = new Date();
  const start =
    timeframe === "week"
      ? startOfWeek(now)
      : timeframe === "month"
      ? startOfMonth(now)
      : null;

  const filtered =
    start === null
      ? articles
      : articles.filter((article) => new Date(article.read_at) >= start);

  const counts = new Map<string, number>();
  for (const article of filtered) {
    for (const theme of article.theme_tags ?? []) {
      counts.set(theme, (counts.get(theme) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count);
}

function LineChart({
  title,
  data,
  valueKey,
  valueLabel,
  valueFormatter,
}: LineChartProps) {
  const width = 640;
  const height = 240;
  const padding = { top: 20, right: 24, bottom: 44, left: 44 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(
    1,
    ...data.map((point) => point[valueKey] ?? 0)
  );
  const labelEvery =
    data.length <= 6 ? 1 : Math.ceil(data.length / 6);

  const points = data.map((point, index) => {
    const x =
      data.length === 1
        ? padding.left + plotWidth / 2
        : padding.left + (index / (data.length - 1)) * plotWidth;
    const value = point[valueKey] ?? 0;
    const y =
      padding.top + plotHeight - (value / maxValue) * plotHeight;
    return { x, y, value };
  });

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;
  const hoveredData = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-400">{valueLabel}</p>
      </div>
      <div className="relative">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <line
            x1={padding.left}
            y1={padding.top}
            x2={width - padding.right}
            y2={padding.top}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          <text
            x={padding.left - 8}
            y={padding.top + 4}
            textAnchor="end"
            className="fill-gray-400 text-[10px]"
          >
            {valueFormatter(maxValue)}
          </text>
          <text
            x={padding.left - 8}
            y={height - padding.bottom + 4}
            textAnchor="end"
            className="fill-gray-400 text-[10px]"
          >
            {valueFormatter(0)}
          </text>
          <path
            d={path}
            fill="none"
            stroke="#111827"
            strokeWidth="2"
          />
          {points.map((point, index) => (
            <circle
              key={data[index].label}
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === index ? 5 : 4}
              fill={hoveredIndex === index ? "#111827" : "#ffffff"}
              stroke="#111827"
              strokeWidth="2"
              onMouseEnter={() => setHoveredIndex(index)}
            >
              <title>
                {data[index].label}: {valueFormatter(point.value)}
              </title>
            </circle>
          ))}
          {data.map((point, index) => {
            if (index % labelEvery !== 0 && index !== data.length - 1) {
              return null;
            }
            const x = points[index].x;
            return (
              <text
                key={`${point.label}-label`}
                x={x}
                y={height - padding.bottom + 22}
                textAnchor="middle"
                className="fill-gray-400 text-[10px]"
              >
                {point.label}
              </text>
            );
          })}
        </svg>
        {hoveredPoint && hoveredData && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-md"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100}%`,
            }}
          >
            <div className="font-semibold text-gray-900">
              {hoveredData.label}
            </div>
            <div>{valueFormatter(hoveredPoint.value)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function BarChart({ title, data }: BarChartProps) {
  const maxValue = Math.max(1, ...data.map((point) => point.count));
  const barHeight = 180;
  const [hoveredTheme, setHoveredTheme] = useState<ThemePoint | null>(null);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-400">Articles per theme</p>
      </div>
      {data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-xs text-gray-500">
          No themed articles in this timeframe.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <div className="flex items-end gap-4">
              <div
                className="relative flex flex-col justify-between text-[10px] text-gray-400"
                style={{ height: barHeight }}
              >
                <span>{maxValue}</span>
                <span>0</span>
                <span className="absolute right-0 top-0 h-full w-px bg-gray-200" />
              </div>
              <div className="relative flex-1">
                {hoveredTheme && (
                  <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-md">
                    <div className="font-semibold text-gray-900">
                      {hoveredTheme.theme}
                    </div>
                    <div>
                      {hoveredTheme.count}{" "}
                      {hoveredTheme.count === 1 ? "article" : "articles"}
                    </div>
                  </div>
                )}
                <div
                  className="flex items-end gap-3 px-2"
                  style={{ height: barHeight }}
                >
                  {data.map((point) => (
                    <div
                      key={point.theme}
                      className="group flex min-w-[72px] flex-col items-center gap-2"
                      onMouseEnter={() => setHoveredTheme(point)}
                      onMouseLeave={() => setHoveredTheme(null)}
                    >
                      <div className="text-[11px] font-semibold text-gray-500">
                        {point.count}
                      </div>
                      <div
                        className="w-full rounded-t-lg bg-indigo-200 transition-colors group-hover:bg-indigo-300"
                        style={{
                          height: `${Math.max(
                            12,
                            (point.count / maxValue) * barHeight
                          )}px`,
                        }}
                      />
                      <div className="w-full text-center text-[11px] text-gray-500">
                        <span className="block truncate">{point.theme}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InsightsClient({
  articles,
}: {
  articles: InsightsArticle[];
}) {
  const [timeframe, setTimeframe] = useState<Timeframe>("weekly");
  const [themeTimeframe, setThemeTimeframe] =
    useState<ThemeTimeframe>("week");

  const series = useMemo(
    () => buildSeries(articles, timeframe),
    [articles, timeframe]
  );
  const themeSeries = useMemo(
    () => buildThemeSeries(articles, themeTimeframe),
    [articles, themeTimeframe]
  );

  if (articles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
        No articles completed yet.
      </div>
    );
  }

  return (
    <section className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            How much am I reading?
          </h2>
          <p className="text-sm text-gray-500">
            Weekly and monthly trends since your first completed article.
          </p>
        </div>
        <div className="flex items-center rounded-full border border-gray-200 bg-white p-1 text-xs font-semibold text-gray-500">
          <button
            type="button"
            onClick={() => setTimeframe("weekly")}
            className={`rounded-full px-3 py-1 transition-colors ${
              timeframe === "weekly"
                ? "bg-gray-900 text-white"
                : "hover:text-gray-800"
            }`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setTimeframe("monthly")}
            className={`rounded-full px-3 py-1 transition-colors ${
              timeframe === "monthly"
                ? "bg-gray-900 text-white"
                : "hover:text-gray-800"
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <LineChart
          title="Articles read"
          data={series}
          valueKey="count"
          valueLabel="Number of completed articles"
          valueFormatter={(value) =>
            `${value} ${value === 1 ? "article" : "articles"}`
          }
        />
        <LineChart
          title="Reading time"
          data={series}
          valueKey="minutes"
          valueLabel="Estimated reading time"
          valueFormatter={(value) => `${value} min`}
        />
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              What am I reading?
            </h2>
            <p className="text-sm text-gray-500">
              Themes ranked by completed articles.
            </p>
          </div>
          <div className="flex items-center rounded-full border border-gray-200 bg-white p-1 text-xs font-semibold text-gray-500">
            <button
              type="button"
              onClick={() => setThemeTimeframe("week")}
              className={`rounded-full px-3 py-1 transition-colors ${
                themeTimeframe === "week"
                  ? "bg-gray-900 text-white"
                  : "hover:text-gray-800"
              }`}
            >
              This week
            </button>
            <button
              type="button"
              onClick={() => setThemeTimeframe("month")}
              className={`rounded-full px-3 py-1 transition-colors ${
                themeTimeframe === "month"
                  ? "bg-gray-900 text-white"
                  : "hover:text-gray-800"
              }`}
            >
              This month
            </button>
            <button
              type="button"
              onClick={() => setThemeTimeframe("all")}
              className={`rounded-full px-3 py-1 transition-colors ${
                themeTimeframe === "all"
                  ? "bg-gray-900 text-white"
                  : "hover:text-gray-800"
              }`}
            >
              All time
            </button>
          </div>
        </div>

        <BarChart title="Themes" data={themeSeries} />
      </div>
    </section>
  );
}
