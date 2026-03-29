import type { Principal } from "@icp-sdk/core/principal";
export interface Stats {
    activeMonths: Array<string>;
    totalPersons: bigint;
    totalAttendance: bigint;
    todayCheckins: bigint;
}
export interface PersonSummary {
    id: bigint;
    studentId: string;
    name: string;
    createdAt: bigint;
    personType: PersonType;
    employeeId: string;
    batch: string;
    rollNo: string;
}
export interface AttendanceRecord {
    id: bigint;
    day: bigint;
    month: bigint;
    dateStr: string;
    name: string;
    slot: string;
    year: bigint;
    monthStr: string;
    personType: PersonType;
    personId: bigint;
    timestamp: bigint;
    editedAt?: bigint;
    timeStr: string;
}
export interface Person {
    id: bigint;
    studentId: string;
    name: string;
    createdAt: bigint;
    personType: PersonType;
    employeeId: string;
    faceDescriptor: Array<number>;
    batch: string;
    rollNo: string;
}
export interface DescriptorEntry {
    id: bigint;
    personType: PersonType;
    name: string;
    faceDescriptor: Array<number>;
}
export type PersonType = { student: null } | { employee: null };
export interface backendInterface {
    registerPerson(personTypeStr: string, studentId: string, employeeId: string, name: string, rollNo: string, batch: string, faceDescriptor: Array<number>): Promise<bigint>;
    getAllPersons(): Promise<Array<PersonSummary>>;
    getAllFaceDescriptors(): Promise<Array<DescriptorEntry>>;
    getPerson(id: bigint): Promise<Person>;
    getPersonSummary(id: bigint): Promise<PersonSummary>;
    updatePerson(id: bigint, studentId: string, employeeId: string, name: string, rollNo: string, batch: string): Promise<void>;
    updatePersonDescriptor(id: bigint, faceDescriptor: Array<number>): Promise<void>;
    deletePerson(id: bigint): Promise<void>;
    recordAttendance(personId: bigint, personTypeStr: string, name: string, slot: string, timestamp: bigint, dateStr: string, monthStr: string, timeStr: string, year: bigint, month: bigint, day: bigint): Promise<bigint>;
    getAttendanceRecords(): Promise<Array<AttendanceRecord>>;
    getAttendanceByDate(dateStr: string): Promise<Array<AttendanceRecord>>;
    getAttendanceByMonth(monthStr: string): Promise<Array<AttendanceRecord>>;
    updateAttendanceRecord(id: bigint, name: string, slot: string, dateStr: string, monthStr: string, timeStr: string): Promise<void>;
    deleteAttendanceRecord(id: bigint): Promise<void>;
    hasAttendedSlot(personId: bigint, slot: string, dateStr: string): Promise<boolean>;
    getStats(): Promise<Stats>;
    getTodayCheckins(dateStr: string): Promise<bigint>;
}
