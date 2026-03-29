import Array "mo:core/Array";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";

persistent actor {
  type PersonType = {
    #student;
    #employee;
  };

  type Person = {
    id : Nat;
    name : Text;
    personType : PersonType;
    rollNo : Text;
    batch : Text;
    studentId : Text;
    employeeId : Text;
    faceDescriptor : [Float];
    createdAt : Time.Time;
  };

  type AttendanceRecord = {
    id : Nat;
    personId : Nat;
    name : Text;
    personType : PersonType;
    slot : Text;
    timestamp : Time.Time;
    dateStr : Text;
    monthStr : Text;
    timeStr : Text;
    year : Int;
    month : Int;
    day : Int;
    editedAt : ?Time.Time;
  };

  type PersonSummary = {
    id : Nat;
    name : Text;
    personType : PersonType;
    rollNo : Text;
    batch : Text;
    studentId : Text;
    employeeId : Text;
    createdAt : Time.Time;
  };

  type DescriptorEntry = {
    id : Nat;
    personType : PersonType;
    name : Text;
    faceDescriptor : [Float];
  };

  type Stats = {
    totalPersons : Nat;
    totalAttendance : Nat;
    todayCheckins : Nat;
    activeMonths : [Text];
  };

  var personIdCounter : Nat = 0;
  var attendanceIdCounter : Nat = 0;
  let persons = Map.empty<Nat, Person>();
  let attendanceRecords = Map.empty<Nat, AttendanceRecord>();

  func nextPersonId() : Nat {
    personIdCounter += 1;
    personIdCounter;
  };

  func nextAttendanceId() : Nat {
    attendanceIdCounter += 1;
    attendanceIdCounter;
  };

  func allPersonValues() : [Person] {
    persons.toArray().map(func(kv : (Nat, Person)) : Person { kv.1 });
  };

  func allAttendanceValues() : [AttendanceRecord] {
    attendanceRecords.toArray().map(func(kv : (Nat, AttendanceRecord)) : AttendanceRecord { kv.1 });
  };

  func getPerson_(id : Nat) : Person {
    switch (persons.get(id)) {
      case (null) Runtime.trap("Person not found");
      case (?p) p;
    };
  };

  // Update a person (remove + re-add since replace is deprecated)
  func updatePersonEntry(id : Nat, updated : Person) {
    persons.remove(id);
    persons.add(id, updated);
  };

  // Update an attendance record (remove + re-add)
  func updateAttendanceEntry(id : Nat, updated : AttendanceRecord) {
    attendanceRecords.remove(id);
    attendanceRecords.add(id, updated);
  };

  // Register a new person with face descriptor
  public shared func registerPerson(
    personTypeStr : Text,
    studentId : Text,
    employeeId : Text,
    name : Text,
    rollNo : Text,
    batch : Text,
    faceDescriptor : [Float]
  ) : async Nat {
    let pt : PersonType = if (personTypeStr == "student") #student else #employee;
    let id = nextPersonId();
    persons.add(id, {
      id;
      name;
      personType = pt;
      rollNo;
      batch;
      studentId;
      employeeId;
      faceDescriptor;
      createdAt = Time.now();
    });
    id;
  };

  // Get all persons (without face descriptors)
  public query func getAllPersons() : async [PersonSummary] {
    allPersonValues().map(func(p : Person) : PersonSummary {
      {
        id = p.id;
        name = p.name;
        personType = p.personType;
        rollNo = p.rollNo;
        batch = p.batch;
        studentId = p.studentId;
        employeeId = p.employeeId;
        createdAt = p.createdAt;
      };
    });
  };

  // Get all face descriptors for matching
  public query func getAllFaceDescriptors() : async [DescriptorEntry] {
    allPersonValues().map(func(p : Person) : DescriptorEntry {
      {
        id = p.id;
        personType = p.personType;
        name = p.name;
        faceDescriptor = p.faceDescriptor;
      };
    });
  };

  // Get single person with descriptor
  public query func getPerson(id : Nat) : async Person {
    getPerson_(id);
  };

  // Get person summary
  public query func getPersonSummary(id : Nat) : async PersonSummary {
    let p = getPerson_(id);
    {
      id = p.id;
      name = p.name;
      personType = p.personType;
      rollNo = p.rollNo;
      batch = p.batch;
      studentId = p.studentId;
      employeeId = p.employeeId;
      createdAt = p.createdAt;
    };
  };

  // Update person details
  public shared func updatePerson(
    id : Nat,
    studentId : Text,
    employeeId : Text,
    name : Text,
    rollNo : Text,
    batch : Text
  ) : async () {
    let p = getPerson_(id);
    updatePersonEntry(id, {
      id = p.id;
      name = if (name == "") p.name else name;
      personType = p.personType;
      rollNo;
      batch;
      studentId = if (studentId == "") p.studentId else studentId;
      employeeId = if (employeeId == "") p.employeeId else employeeId;
      faceDescriptor = p.faceDescriptor;
      createdAt = p.createdAt;
    });
  };

  // Delete person and their attendance records
  public shared func deletePerson(id : Nat) : async () {
    switch (persons.get(id)) {
      case (null) Runtime.trap("Person not found");
      case (?_) {};
    };
    persons.remove(id);
    let toRemove = allAttendanceValues()
      .filter(func(r : AttendanceRecord) : Bool { r.personId == id })
      .map(func(r : AttendanceRecord) : Nat { r.id });
    for (rid in toRemove.vals()) {
      attendanceRecords.remove(rid);
    };
  };

  // Record attendance
  public shared func recordAttendance(
    personId : Nat,
    personTypeStr : Text,
    name : Text,
    slot : Text,
    timestamp : Int,
    dateStr : Text,
    monthStr : Text,
    timeStr : Text,
    year : Int,
    month : Int,
    day : Int
  ) : async Nat {
    let pt : PersonType = if (personTypeStr == "student") #student else #employee;
    let id = nextAttendanceId();
    attendanceRecords.add(id, {
      id;
      personId;
      name;
      personType = pt;
      slot;
      timestamp;
      dateStr;
      monthStr;
      timeStr;
      year;
      month;
      day;
      editedAt = null;
    });
    id;
  };

  // Get all attendance records sorted by timestamp desc
  public query func getAttendanceRecords() : async [AttendanceRecord] {
    allAttendanceValues().sort(
      func(a : AttendanceRecord, b : AttendanceRecord) : { #less; #equal; #greater } {
        Int.compare(b.timestamp, a.timestamp);
      }
    );
  };

  // Filter by date
  public query func getAttendanceByDate(dateStr : Text) : async [AttendanceRecord] {
    allAttendanceValues().filter(func(r : AttendanceRecord) : Bool { r.dateStr == dateStr });
  };

  // Filter by month
  public query func getAttendanceByMonth(monthStr : Text) : async [AttendanceRecord] {
    allAttendanceValues().filter(func(r : AttendanceRecord) : Bool { r.monthStr == monthStr });
  };

  // Update attendance record
  public shared func updateAttendanceRecord(
    id : Nat,
    name : Text,
    slot : Text,
    dateStr : Text,
    monthStr : Text,
    timeStr : Text
  ) : async () {
    let r = switch (attendanceRecords.get(id)) {
      case (null) Runtime.trap("Record not found");
      case (?r) r;
    };
    updateAttendanceEntry(id, {
      id = r.id;
      personId = r.personId;
      name = if (name == "") r.name else name;
      personType = r.personType;
      slot = if (slot == "") r.slot else slot;
      timestamp = r.timestamp;
      dateStr = if (dateStr == "") r.dateStr else dateStr;
      monthStr = if (monthStr == "") r.monthStr else monthStr;
      timeStr = if (timeStr == "") r.timeStr else timeStr;
      year = r.year;
      month = r.month;
      day = r.day;
      editedAt = ?Time.now();
    });
  };

  // Delete attendance record
  public shared func deleteAttendanceRecord(id : Nat) : async () {
    attendanceRecords.remove(id);
  };

  // Check if person already attended a slot on a date
  public query func hasAttendedSlot(personId : Nat, slot : Text, dateStr : Text) : async Bool {
    allAttendanceValues().filter(
      func(r : AttendanceRecord) : Bool {
        r.personId == personId and r.slot == slot and r.dateStr == dateStr;
      }
    ).size() > 0;
  };

  // Get stats
  public query func getStats() : async Stats {
    let arr = allAttendanceValues();
    var uniqueMonths : [Text] = [];
    for (r in arr.vals()) {
      let m = r.monthStr;
      if (uniqueMonths.filter(func(um : Text) : Bool { um == m }).size() == 0) {
        let old = uniqueMonths;
        uniqueMonths := Array.tabulate<Text>(old.size() + 1, func(i : Nat) : Text {
          if (i < old.size()) old[i] else m;
        });
      };
    };
    {
      totalPersons = persons.size();
      totalAttendance = attendanceRecords.size();
      todayCheckins = 0;
      activeMonths = uniqueMonths;
    };
  };

  // Get today's checkin count by date string
  public query func getTodayCheckins(dateStr : Text) : async Nat {
    allAttendanceValues().filter(func(r : AttendanceRecord) : Bool { r.dateStr == dateStr }).size();
  };
};
