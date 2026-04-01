import Map "mo:core/Map";

module {
  type PersonType = { #student; #employee };

  type Person = {
    id : Nat;
    name : Text;
    personType : PersonType;
    rollNo : Text;
    batch : Text;
    studentId : Text;
    employeeId : Text;
    faceDescriptor : [Float];
    createdAt : Int;
  };

  type AttendanceRecord = {
    id : Nat;
    personId : Nat;
    name : Text;
    personType : PersonType;
    slot : Text;
    timestamp : Int;
    dateStr : Text;
    monthStr : Text;
    timeStr : Text;
    year : Int;
    month : Int;
    day : Int;
    editedAt : ?Int;
  };

  type OldState = {
    persons : Map.Map<Nat, Person>;
    attendanceRecords : Map.Map<Nat, AttendanceRecord>;
    personIdCounter : Nat;
    attendanceIdCounter : Nat;
  };

  type NewState = {
    persons : Map.Map<Nat, Person>;
    attendance : Map.Map<Nat, AttendanceRecord>;
    personIdCounter : Nat;
    attendanceIdCounter : Nat;
  };

  public func run(old : OldState) : NewState {
    {
      persons = old.persons;
      attendance = old.attendanceRecords;
      personIdCounter = old.personIdCounter;
      attendanceIdCounter = old.attendanceIdCounter;
    };
  };
};
