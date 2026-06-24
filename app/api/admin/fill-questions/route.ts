import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { createServerSupabaseClient } from "@/lib/supabase";

// Fills sample questions into every exam that has zero questions
// POST /api/admin/fill-questions
export async function POST(req: NextRequest) {
  void req;
  const payload = await getAuthUser();
  if (!payload?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerSupabaseClient();

  // Get all exams with no questions
  const { data: exams } = await supabase
    .from("exams")
    .select("id, title, year");

  if (!exams || exams.length === 0)
    return NextResponse.json({ message: "No exams found.", filled: 0 });

  const SAMPLE = [
    { q: "What is the primary function of an operating system?", a: "Store files", b: "Manage hardware and software", c: "Browse internet", d: "Play games", ans: "B", exp: "An OS manages CPU, memory, and I/O devices." },
    { q: "Which data structure uses LIFO order?", a: "Queue", b: "Array", c: "Stack", d: "Tree", ans: "C", exp: "Stack = Last In First Out." },
    { q: "What does CPU stand for?", a: "Central Program Unit", b: "Core Processing Unit", c: "Central Processing Unit", d: "Computer Protocol Unit", ans: "C", exp: "CPU = Central Processing Unit." },
    { q: "SQL command to retrieve data?", a: "INSERT", b: "DELETE", c: "UPDATE", d: "SELECT", ans: "D", exp: "SELECT queries data from tables." },
    { q: "Which is NOT a feature of OOP?", a: "Encapsulation", b: "Compilation", c: "Inheritance", d: "Polymorphism", ans: "B", exp: "OOP: Encapsulation, Inheritance, Polymorphism, Abstraction." },
    { q: "Binary Search time complexity?", a: "O(n)", b: "O(n²)", c: "O(log n)", d: "O(n log n)", ans: "C", exp: "Binary search halves array each step." },
    { q: "What does IP stand for?", a: "Internal Protocol", b: "Internet Protocol", c: "Input Process", d: "Integrated Port", ans: "B", exp: "IP provides addressing and routing." },
    { q: "Which storage is non-volatile?", a: "RAM", b: "Cache", c: "ROM", d: "CPU Register", ans: "C", exp: "ROM retains data without power." },
    { q: "Which OSI layer handles routing?", a: "Session", b: "Transport", c: "Data Link", d: "Network", ans: "D", exp: "Network Layer (Layer 3) routes IP packets." },
    { q: "What is a compiler?", a: "Runs code line by line", b: "Translates source to machine code", c: "Stores data permanently", d: "Manages memory allocation", ans: "B", exp: "A compiler translates high-level code to machine code." },
    { q: "Which protocol is used for email sending?", a: "FTP", b: "HTTP", c: "SMTP", d: "SNMP", ans: "C", exp: "SMTP = Simple Mail Transfer Protocol." },
    { q: "What is the base of the binary number system?", a: "8", b: "10", c: "16", d: "2", ans: "D", exp: "Binary uses base 2 (0 and 1)." },
    { q: "Which sorting algorithm has O(n log n) average complexity?", a: "Bubble Sort", b: "Insertion Sort", c: "Merge Sort", d: "Selection Sort", ans: "C", exp: "Merge Sort consistently runs in O(n log n)." },
    { q: "What does RAM stand for?", a: "Read Access Memory", b: "Random Access Memory", c: "Rapid Access Module", d: "Read And Modify", ans: "B", exp: "RAM = Random Access Memory, volatile storage." },
    { q: "Which HTML tag creates a hyperlink?", a: "<link>", b: "<a>", c: "<href>", d: "<url>", ans: "B", exp: "The <a> anchor tag creates hyperlinks in HTML." },
    { q: "What does HTTP stand for?", a: "HyperText Transfer Protocol", b: "High Transfer Text Process", c: "Hyper Terminal Transfer Protocol", d: "HyperText Terminal Program", ans: "A", exp: "HTTP = HyperText Transfer Protocol, used for web." },
    { q: "Which of these is a primary key characteristic?", a: "Can be NULL", b: "Can repeat", c: "Uniquely identifies each row", d: "Can have duplicates", ans: "C", exp: "Primary key uniquely identifies each record." },
    { q: "What is the result of 0 AND 1 in Boolean algebra?", a: "1", b: "0", c: "True", d: "Undefined", ans: "B", exp: "AND returns 1 only when both inputs are 1." },
    { q: "Which layer of OSI model handles data encryption?", a: "Network", b: "Transport", c: "Presentation", d: "Session", ans: "C", exp: "Presentation Layer handles encryption and decryption." },
    { q: "What is polymorphism in OOP?", a: "Multiple inheritance only", b: "Same method name, different behaviors", c: "Hiding data from users", d: "Creating multiple objects", ans: "B", exp: "Polymorphism: same interface, different implementations." },
  ];

  let totalFilled = 0;
  const results: string[] = [];

  for (const exam of exams) {
    // Check if questions exist
    const { count } = await supabase
      .from("questions")
      .select("id", { count: "exact" })
      .eq("exam_id", exam.id);

    if ((count || 0) > 0) {
      results.push(`${exam.title}: already has ${count} questions`);
      continue;
    }

    // Insert sample questions
    const inserts = SAMPLE.map((s, i) => ({
      id: crypto.randomUUID(),
      exam_id: exam.id,
      question_number: i + 1,
      question_text: s.q,
      option_a: s.a, option_b: s.b, option_c: s.c, option_d: s.d,
      correct_answer: s.ans,
      explanation: s.exp,
    }));

    const { error } = await supabase.from("questions").insert(inserts);
    if (!error) {
      totalFilled++;
      results.push(`✅ ${exam.title}: added ${inserts.length} questions`);
    } else {
      results.push(`❌ ${exam.title}: ${error.message}`);
    }
  }

  return NextResponse.json({
    success: true,
    filled: totalFilled,
    results,
    message: totalFilled > 0
      ? `Added questions to ${totalFilled} exam(s). Users can now take exams.`
      : "All exams already have questions.",
  });
}
