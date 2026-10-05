/** Preview figures for the home screen. These are not loaded from the database. */

export const dashboardVisits = [
  {
    id: "visit-aryan",
    patient: "Aryan Kelwin",
    kind: "OPD",
    doctor: "Dr N.M. Shaikh",
    time: "11:20 am",
    status: "Waiting",
  },
  {
    id: "visit-asif",
    patient: "Asif Patel",
    kind: "IPD",
    doctor: "Dr Vishal Hanmante",
    time: "2:14 pm",
    status: "Admitted",
  },
  {
    id: "visit-meera",
    patient: "Meera Joshi",
    kind: "OPD",
    doctor: "Dr N.M. Shaikh",
    time: "9:40 am",
    status: "Done",
  },
  {
    id: "visit-rahul",
    patient: "Rahul Deshmukh",
    kind: "OPD",
    doctor: "Dr Vishal Hanmante",
    time: "10:05 am",
    status: "With doctor",
  },
  {
    id: "visit-fatima",
    patient: "Fatima Shaikh",
    kind: "IPD",
    doctor: "Dr N.M. Shaikh",
    time: "8:15 am",
    status: "Admitted",
  },
] as const;

export const dashboardWards = [
  { name: "General", occupied: 8, beds: 12 },
  { name: "Private", occupied: 3, beds: 4 },
  { name: "ICU", occupied: 2, beds: 4 },
  { name: "Maternity", occupied: 1, beds: 6 },
] as const;

export const dashboardCollection = {
  today: 12450,
  month: 486200,
  referring: 184500,
  consultation: 301700,
} as const;

export const dashboardActivity = [
  { id: "act-admit", summary: "Asif Patel admitted to Private", when: "Today, 2:14 pm" },
  { id: "act-opd", summary: "Aryan Kelwin checked in for OPD", when: "Today, 11:20 am" },
  { id: "act-bed", summary: "Bed G-04 marked for maintenance", when: "Today, 10:05 am" },
  { id: "act-fee", summary: "Consultation fee recorded, ₹1,200", when: "Today, 9:40 am" },
] as const;

export const occupiedBeds = dashboardWards.reduce((sum, ward) => sum + ward.occupied, 0);
export const totalBeds = dashboardWards.reduce((sum, ward) => sum + ward.beds, 0);
export const freeBeds = totalBeds - occupiedBeds;
export const opdToday = 18;
