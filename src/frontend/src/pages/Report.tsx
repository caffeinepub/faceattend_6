import { Download, FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useGetAttendanceRecords } from "../hooks/useQueries";

export default function Report() {
  const { data: records = [], isLoading } = useGetAttendanceRecords();
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  const filtered = useMemo(() => {
    let list = [...records].sort((a, b) => Number(b.timestamp - a.timestamp));
    if (dateFilter) {
      const d = new Date(dateFilter);
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      list = list.filter(
        (r) =>
          Number(r.day) === day &&
          Number(r.month) === month &&
          Number(r.year) === year,
      );
    }
    if (monthFilter) {
      list = list.filter((r) => r.monthStr === monthFilter);
    }
    return list;
  }, [records, dateFilter, monthFilter]);

  function downloadCSV() {
    const header = [
      "Name",
      "Type",
      "Entry Time",
      "Date",
      "Month",
      "Year",
      "Slot",
    ];
    const rows = filtered.map((r) => [
      r.name,
      "personType" in r
        ? (r.personType as any).student !== undefined
          ? "Student"
          : "Employee"
        : "",
      r.timeStr,
      r.dateStr,
      r.monthStr,
      String(r.year),
      r.slot,
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Attendance Report
          </h1>
          <p className="text-sm text-muted-foreground">
            View and export verification records
          </p>
        </div>
      </div>

      {/* Filters + Download */}
      <div className="flex flex-wrap gap-3 mb-5 items-end">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="date-filter"
            className="text-xs font-medium text-muted-foreground"
          >
            Filter by Date
          </label>
          <input
            id="date-filter"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            data-ocid="report.search_input"
            className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            htmlFor="month-filter"
            className="text-xs font-medium text-muted-foreground"
          >
            Filter by Month
          </label>
          <input
            id="month-filter"
            type="month"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            data-ocid="report.select"
            className="px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        {(dateFilter || monthFilter) && (
          <button
            type="button"
            onClick={() => {
              setDateFilter("");
              setMonthFilter("");
            }}
            className="px-3 py-2 rounded-lg border border-border bg-accent text-foreground text-sm hover:bg-accent/80 transition-colors self-end"
          >
            Clear
          </button>
        )}
        <div className="ml-auto">
          <button
            type="button"
            onClick={downloadCSV}
            disabled={filtered.length === 0}
            data-ocid="report.primary_button"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div
          data-ocid="report.loading_state"
          className="text-center py-16 text-muted-foreground"
        >
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading records...
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-ocid="report.empty_state"
          className="text-center py-16 text-muted-foreground"
        >
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No records found</p>
          <p className="text-xs mt-1">
            Verifications will appear here after they are completed
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl border border-border overflow-hidden"
          data-ocid="report.table"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    #
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Entry Time
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Month
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Year
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    Slot
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const isStudent = (r.personType as any).student !== undefined;
                  return (
                    <tr
                      key={String(r.id)}
                      data-ocid={`report.item.${i + 1}`}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {r.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isStudent
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                          }`}
                        >
                          {isStudent ? "Student" : "Employee"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground font-mono">
                        {r.timeStr}
                      </td>
                      <td className="px-4 py-3 text-foreground">{r.dateStr}</td>
                      <td className="px-4 py-3 text-foreground">
                        {r.monthStr}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {String(r.year)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.slot}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground border-t border-border">
            {filtered.length} record{filtered.length !== 1 ? "s" : ""} shown
          </div>
        </div>
      )}
    </div>
  );
}
