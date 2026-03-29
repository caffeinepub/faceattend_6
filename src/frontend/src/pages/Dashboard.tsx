import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CalendarCheck,
  Clock,
  Layers,
  LayoutDashboard,
  Loader2,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useDeleteAttendance,
  useDeletePerson,
  useGetAllPersons,
  useGetAttendanceRecords,
  useGetStats,
  useUpdateAttendance,
  useUpdatePerson,
} from "../hooks/useQueries";
import type { AttendanceRecord, PersonSummary } from "../hooks/useQueries";

const SLOTS = ["Morning", "Late Morning", "Afternoon", "Evening"];

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-card border border-border p-4 flex items-start gap-3"
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-2xl font-bold font-mono">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const today = new Date();

  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: attendance = [], isLoading: attLoading } =
    useGetAttendanceRecords();
  const { data: persons = [], isLoading: persLoading } = useGetAllPersons();

  const updateAttendance = useUpdateAttendance();
  const deleteAttendance = useDeleteAttendance();
  const updatePerson = useUpdatePerson();
  const deletePerson = useDeletePerson();

  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  const [editAtt, setEditAtt] = useState<AttendanceRecord | null>(null);
  const [editAttForm, setEditAttForm] = useState({
    name: "",
    slot: "",
    dateStr: "",
    monthStr: "",
    timeStr: "",
  });

  const [editPerson, setEditPerson] = useState<PersonSummary | null>(null);
  const [editPersonForm, setEditPersonForm] = useState({
    name: "",
    studentId: "",
    employeeId: "",
    rollNo: "",
    batch: "",
  });

  const [deleteAttId, setDeleteAttId] = useState<bigint | null>(null);
  const [deletePersonId, setDeletePersonId] = useState<bigint | null>(null);

  const filteredAttendance = attendance.filter((r) => {
    if (dateFilter && r.dateStr !== dateFilter) return false;
    if (monthFilter && r.monthStr !== monthFilter) return false;
    return true;
  });

  const openEditAtt = (r: AttendanceRecord) => {
    setEditAtt(r);
    setEditAttForm({
      name: r.name,
      slot: r.slot,
      dateStr: r.dateStr,
      monthStr: r.monthStr,
      timeStr: r.timeStr,
    });
  };

  const openEditPerson = (p: PersonSummary) => {
    setEditPerson(p);
    setEditPersonForm({
      name: p.name,
      studentId: p.studentId,
      employeeId: p.employeeId,
      rollNo: p.rollNo,
      batch: p.batch,
    });
  };

  const handleSaveAttendance = async () => {
    if (!editAtt) return;
    try {
      await updateAttendance.mutateAsync({ id: editAtt.id, ...editAttForm });
      toast.success("Record updated");
      setEditAtt(null);
    } catch (_e) {
      toast.error("Update failed");
    }
  };

  const handleDeleteAttendance = async () => {
    if (deleteAttId === null) return;
    try {
      await deleteAttendance.mutateAsync(deleteAttId);
      toast.success("Record deleted");
      setDeleteAttId(null);
    } catch (_e) {
      toast.error("Delete failed");
    }
  };

  const handleSavePerson = async () => {
    if (!editPerson) return;
    try {
      await updatePerson.mutateAsync({ id: editPerson.id, ...editPersonForm });
      toast.success("Person updated");
      setEditPerson(null);
    } catch (_e) {
      toast.error("Update failed");
    }
  };

  const handleDeletePerson = async () => {
    if (deletePersonId === null) return;
    try {
      await deletePerson.mutateAsync(deletePersonId);
      toast.success("Person removed");
      setDeletePersonId(null);
    } catch (_e) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{formatDate(today)}</p>
        </div>
      </div>

      {statsLoading ? (
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          data-ocid="dashboard.loading_state"
        >
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total People"
            value={Number(stats?.totalPersons ?? 0)}
            icon={Users}
            color="bg-primary/20 text-primary"
          />
          <StatCard
            label="Total Attendance"
            value={Number(stats?.totalAttendance ?? 0)}
            icon={CalendarCheck}
            color="bg-chart-2/20 text-chart-2"
          />
          <StatCard
            label="Today's Check-ins"
            value={Number(stats?.todayCheckins ?? 0)}
            icon={Clock}
            color="bg-chart-3/20 text-chart-3"
          />
          <StatCard
            label="Active Months"
            value={stats?.activeMonths.length ?? 0}
            icon={Layers}
            color="bg-chart-5/20 text-chart-5"
          />
        </div>
      )}

      <Tabs defaultValue="attendance">
        <TabsList
          className="bg-card border border-border mb-6"
          data-ocid="dashboard.tab"
        >
          <TabsTrigger value="attendance" data-ocid="dashboard.attendance.tab">
            Attendance Records
          </TabsTrigger>
          <TabsTrigger value="people" data-ocid="dashboard.people.tab">
            People
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                Filter by date
              </Label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-8 text-sm bg-card border-border w-40"
                data-ocid="dashboard.date_filter.input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                Filter by month
              </Label>
              <Input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="h-8 text-sm bg-card border-border w-36"
                data-ocid="dashboard.month_filter.input"
              />
            </div>
            {(dateFilter || monthFilter) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setDateFilter("");
                  setMonthFilter("");
                }}
              >
                Clear
              </Button>
            )}
          </div>

          {attLoading ? (
            <div
              className="space-y-2"
              data-ocid="dashboard.attendance.loading_state"
            >
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div
              className="rounded-xl border border-dashed border-border p-10 text-center"
              data-ocid="dashboard.attendance.empty_state"
            >
              <CalendarCheck className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                No attendance records found
              </p>
            </div>
          ) : (
            <div
              className="rounded-xl border border-border overflow-hidden"
              data-ocid="dashboard.attendance.table"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-card hover:bg-card border-border">
                    <TableHead className="text-muted-foreground">#</TableHead>
                    <TableHead className="text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Type
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Slot
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Time
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Date
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map((r, idx) => (
                    <TableRow
                      key={String(r.id)}
                      className="border-border"
                      data-ocid={`dashboard.attendance.row.item.${idx + 1}`}
                    >
                      <TableCell className="text-muted-foreground text-xs font-mono">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            "student" in r.personType
                              ? "border-primary/40 text-primary"
                              : "border-chart-2/40 text-chart-2"
                          }
                        >
                          {"student" in r.personType ? "Student" : "Employee"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{r.slot}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {r.timeStr}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {r.dateStr}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditAtt(r)}
                            data-ocid={`dashboard.attendance.edit_button.${idx + 1}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteAttId(r.id)}
                            data-ocid={`dashboard.attendance.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="people">
          {persLoading ? (
            <div
              className="space-y-2"
              data-ocid="dashboard.people.loading_state"
            >
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : persons.length === 0 ? (
            <div
              className="rounded-xl border border-dashed border-border p-10 text-center"
              data-ocid="dashboard.people.empty_state"
            >
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                No people registered yet
              </p>
            </div>
          ) : (
            <div
              className="rounded-xl border border-border overflow-hidden"
              data-ocid="dashboard.people.table"
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-card hover:bg-card border-border">
                    <TableHead className="text-muted-foreground">#</TableHead>
                    <TableHead className="text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Type
                    </TableHead>
                    <TableHead className="text-muted-foreground">ID</TableHead>
                    <TableHead className="text-muted-foreground">
                      Roll No
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Batch
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {persons.map((p, idx) => (
                    <TableRow
                      key={String(p.id)}
                      className="border-border"
                      data-ocid={`dashboard.people.row.item.${idx + 1}`}
                    >
                      <TableCell className="text-muted-foreground text-xs font-mono">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            "student" in p.personType
                              ? "border-primary/40 text-primary"
                              : "border-chart-2/40 text-chart-2"
                          }
                        >
                          {"student" in p.personType ? "Student" : "Employee"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {"student" in p.personType
                          ? p.studentId || "—"
                          : p.employeeId || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.rollNo || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.batch || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditPerson(p)}
                            data-ocid={`dashboard.people.edit_button.${idx + 1}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeletePersonId(p.id)}
                            data-ocid={`dashboard.people.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Attendance Dialog */}
      <Dialog open={!!editAtt} onOpenChange={(o) => !o && setEditAtt(null)}>
        <DialogContent
          className="bg-card border-border"
          data-ocid="dashboard.edit_attendance.dialog"
        >
          <DialogHeader>
            <DialogTitle>Edit Attendance Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={editAttForm.name}
                onChange={(e) =>
                  setEditAttForm((p) => ({ ...p, name: e.target.value }))
                }
                className="bg-background border-border"
                data-ocid="dashboard.edit_name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slot</Label>
              <select
                value={editAttForm.slot}
                onChange={(e) =>
                  setEditAttForm((p) => ({ ...p, slot: e.target.value }))
                }
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                data-ocid="dashboard.edit_slot.select"
              >
                {SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={editAttForm.dateStr}
                  onChange={(e) => {
                    const d = e.target.value;
                    setEditAttForm((p) => ({
                      ...p,
                      dateStr: d,
                      monthStr: d.slice(0, 7),
                    }));
                  }}
                  className="bg-background border-border"
                  data-ocid="dashboard.edit_date.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={editAttForm.timeStr}
                  onChange={(e) =>
                    setEditAttForm((p) => ({ ...p, timeStr: e.target.value }))
                  }
                  className="bg-background border-border"
                  data-ocid="dashboard.edit_time.input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditAtt(null)}
              data-ocid="dashboard.edit_attendance.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAttendance}
              disabled={updateAttendance.isPending}
              data-ocid="dashboard.edit_attendance.save_button"
            >
              {updateAttendance.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Attendance */}
      <Dialog
        open={deleteAttId !== null}
        onOpenChange={(o) => !o && setDeleteAttId(null)}
      >
        <DialogContent
          className="bg-card border-border"
          data-ocid="dashboard.delete_attendance.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Delete Record?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteAttId(null)}
              data-ocid="dashboard.delete_attendance.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAttendance}
              disabled={deleteAttendance.isPending}
              data-ocid="dashboard.delete_attendance.confirm_button"
            >
              {deleteAttendance.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Person Dialog */}
      <Dialog
        open={!!editPerson}
        onOpenChange={(o) => !o && setEditPerson(null)}
      >
        <DialogContent
          className="bg-card border-border"
          data-ocid="dashboard.edit_person.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              Edit{" "}
              {editPerson && "student" in editPerson.personType
                ? "Student"
                : "Employee"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={editPersonForm.name}
                onChange={(e) =>
                  setEditPersonForm((p) => ({ ...p, name: e.target.value }))
                }
                className="bg-background border-border"
                data-ocid="dashboard.edit_person_name.input"
              />
            </div>
            {editPerson && "student" in editPerson.personType ? (
              <>
                <div className="space-y-1.5">
                  <Label>Student ID</Label>
                  <Input
                    value={editPersonForm.studentId}
                    onChange={(e) =>
                      setEditPersonForm((p) => ({
                        ...p,
                        studentId: e.target.value,
                      }))
                    }
                    className="bg-background border-border"
                    data-ocid="dashboard.edit_student_id.input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Roll No</Label>
                  <Input
                    value={editPersonForm.rollNo}
                    onChange={(e) =>
                      setEditPersonForm((p) => ({
                        ...p,
                        rollNo: e.target.value,
                      }))
                    }
                    className="bg-background border-border"
                    data-ocid="dashboard.edit_roll_no.input"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <Label>Employee ID</Label>
                <Input
                  value={editPersonForm.employeeId}
                  onChange={(e) =>
                    setEditPersonForm((p) => ({
                      ...p,
                      employeeId: e.target.value,
                    }))
                  }
                  className="bg-background border-border"
                  data-ocid="dashboard.edit_employee_id.input"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Batch</Label>
              <Input
                value={editPersonForm.batch}
                onChange={(e) =>
                  setEditPersonForm((p) => ({ ...p, batch: e.target.value }))
                }
                className="bg-background border-border"
                data-ocid="dashboard.edit_batch.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditPerson(null)}
              data-ocid="dashboard.edit_person.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePerson}
              disabled={updatePerson.isPending}
              data-ocid="dashboard.edit_person.save_button"
            >
              {updatePerson.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Person */}
      <Dialog
        open={deletePersonId !== null}
        onOpenChange={(o) => !o && setDeletePersonId(null)}
      >
        <DialogContent
          className="bg-card border-border"
          data-ocid="dashboard.delete_person.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Remove Person?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the person, their face data, and ALL
            their attendance records. This cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletePersonId(null)}
              data-ocid="dashboard.delete_person.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePerson}
              disabled={deletePerson.isPending}
              data-ocid="dashboard.delete_person.confirm_button"
            >
              {deletePerson.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Remove"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
