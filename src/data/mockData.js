export const MOCK_STUDENT = {
  full_name: "Arjun Mehta",
  email: "arjun.mehta@university.edu",
  usn: "1AT21CS045",
  branch: "Computer Science",
  section: "A",
  semester: 5,
};

export const MOCK_QUESTIONS = [
  { id: 1, text: "Which data structure uses LIFO order?", options: ["Queue", "Stack", "Linked List", "Tree"], correct: 1 },
  { id: 2, text: "What is the time complexity of binary search?", options: ["O(n)", "O(n²)", "O(log n)", "O(1)"], correct: 2 },
  { id: 3, text: "Which sorting algorithm has best average-case O(n log n)?", options: ["Bubble Sort", "Insertion Sort", "Merge Sort", "Selection Sort"], correct: 2 },
  { id: 4, text: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Power Unit", "Core Processing Unit", "Central Program Unit"], correct: 0 },
  { id: 5, text: "In OOP, what is encapsulation?", options: ["Hiding implementation details", "Inheriting properties", "Overloading methods", "Polymorphism"], correct: 0 },
];

export const LIVE_TESTS = [
  { id: "lt1", title: "Data Structures — Unit 3 Quiz", subject: "Data Structures", teacher: "Prof. Ramesh K.", duration: 30, questions: 20, endsAt: "Today, 6:00 PM", status: "live" },
  { id: "lt2", title: "DBMS Mid-Term Assessment", subject: "Database Management", teacher: "Dr. Suneeta P.", duration: 45, questions: 30, endsAt: "Today, 8:00 PM", status: "live" },
  { id: "lt3", title: "Operating Systems — Module 2", subject: "Operating Systems", teacher: "Prof. Arvind M.", duration: 20, questions: 15, endsAt: "Tomorrow, 10:00 AM", status: "upcoming" },
];

export const ANNOUNCEMENTS_DATA = [
  { id: 1, title: "Mid-Term Exam Schedule Released", course: "Data Structures", teacher: "Prof. Ramesh K.", message: "The mid-term examination for Data Structures (CS301) will be held on February 10, 2025. Syllabus covers Units 1–3. Please prepare thoroughly. Question paper will have 30 MCQs and 2 descriptive questions.", date: "Jan 30, 2025", isNew: true, priority: "high" },
  { id: 2, title: "Assignment 3 Deadline Extended", course: "DBMS", teacher: "Dr. Suneeta P.", message: "Due to multiple requests, the deadline for Assignment 3 has been extended to February 5, 2025. Submissions after this date will not be accepted under any circumstances.", date: "Jan 28, 2025", isNew: true, priority: "medium" },
  { id: 3, title: "Guest Lecture on AI/ML — Feb 8", course: "General", teacher: "Dept. of CS", message: "A guest lecture by Dr. Anand Krishnan (IISc) on 'Foundations of Machine Learning' is scheduled for February 8, 2025 at 2:00 PM in Seminar Hall B. Attendance is mandatory for Sem 5 students.", date: "Jan 26, 2025", isNew: false, priority: "medium" },
  { id: 4, title: "Lab Practical Exam — Networks", course: "Computer Networks", teacher: "Prof. Arvind M.", message: "Practical examination for Computer Networks lab will be conducted on February 3, 2025. Each student will be allotted a 20-minute slot. Slot assignments will be posted on the notice board.", date: "Jan 24, 2025", isNew: false, priority: "low" },
  { id: 5, title: "Holiday Notice — Republic Day", course: "General", teacher: "Principal's Office", message: "The institute will remain closed on January 26, 2025 on account of Republic Day. All scheduled classes and tests for this day are rescheduled. Check the revised timetable on the portal.", date: "Jan 22, 2025", isNew: false, priority: "low" },
];

export const PERF = {
  trend: [
    { month: "Aug", score: 62, avg: 68 }, { month: "Sep", score: 71, avg: 69 },
    { month: "Oct", score: 68, avg: 70 }, { month: "Nov", score: 78, avg: 71 },
    { month: "Dec", score: 82, avg: 72 }, { month: "Jan", score: 88, avg: 73 },
  ],
  attendance: [
    { month: "Aug", pct: 82 }, { month: "Sep", pct: 90 }, { month: "Oct", pct: 75 },
    { month: "Nov", pct: 88 }, { month: "Dec", pct: 93 }, { month: "Jan", pct: 85 },
  ],
  subjects: [
    { name: "Data Structures", score: 88, tests: 8, color: "#F0A500" },
    { name: "Algorithms", score: 74, tests: 6, color: "#60A5FA" },
    { name: "DBMS", score: 91, tests: 5, color: "#4ADE80" },
    { name: "OS", score: 67, tests: 7, color: "#F87171" },
    { name: "Networks", score: 79, tests: 4, color: "#C084FC" },
  ],
  attempts: [
    { id: "a1", title: "DS Mid-Term", type: "teacher", subject: "Data Structures", date: "Jan 15", score: 88, total: 100, time: "42 min", correct: 22, total_q: 25, tabs: 0 },
    { id: "a2", title: "Algorithm Practice", type: "ai", subject: "Algorithms", date: "Jan 18", score: 74, total: 100, time: "28 min", correct: 14, total_q: 19, tabs: 1 },
    { id: "a3", title: "DBMS Quiz 3", type: "teacher", subject: "DBMS", date: "Jan 22", score: 91, total: 100, time: "35 min", correct: 20, total_q: 22, tabs: 0 },
    { id: "a4", title: "OS Concepts", type: "ai", subject: "OS", date: "Jan 25", score: 67, total: 100, time: "19 min", correct: 10, total_q: 15, tabs: 2 },
    { id: "a5", title: "Networks Basics", type: "teacher", subject: "Networks", date: "Jan 28", score: 79, total: 100, time: "38 min", correct: 18, total_q: 23, tabs: 0 },
    { id: "a6", title: "DS Lab Practice", type: "ai", subject: "Data Structures", date: "Feb 1", score: 84, total: 100, time: "22 min", correct: 21, total_q: 25, tabs: 0 },
    { id: "a7", title: "DBMS Advanced", type: "teacher", subject: "DBMS", date: "Feb 5", score: 95, total: 100, time: "40 min", correct: 19, total_q: 20, tabs: 0 },
  ],
  leaderboard: [
    { rank: 1, name: "Priya Sharma", score: 94, initials: "PS" },
    { rank: 2, name: "Rahul Kumar", score: 91, initials: "RK" },
    { rank: 3, name: "Arjun Mehta", score: 88, initials: "AM", isMe: true },
    { rank: 4, name: "Sneha Patel", score: 85, initials: "SP" },
    { rank: 5, name: "Dev Verma", score: 83, initials: "DV" },
    { rank: 6, name: "Ananya Singh", score: 80, initials: "AS" },
    { rank: 7, name: "Kiran Nair", score: 77, initials: "KN" },
    { rank: 8, name: "Riya Das", score: 75, initials: "RD" },
    { rank: 9, name: "Arun Tiwari", score: 73, initials: "AT" },
    { rank: 10, name: "Meera Iyer", score: 70, initials: "MI" },
  ],
};
