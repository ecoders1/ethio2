import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { createServerSupabaseClient } from "@/lib/supabase";

// POST /api/admin/seed-cs-2015
// Inserts Computer Science 2015 Exit Exam questions
export async function POST(req: NextRequest) {
  void req;
  const payload = await getAuthUser();
  if (!payload?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerSupabaseClient();

  // Find Computer Science department
  const { data: dept } = await supabase
    .from("departments")
    .select("id")
    .eq("name", "Computer Science")
    .single();

  if (!dept)
    return NextResponse.json({ error: "Computer Science department not found" }, { status: 404 });

  // Get or create the 2015 exam — safely handle duplicates
  const { data: examRows } = await supabase
    .from("exams")
    .select("id")
    .eq("department_id", dept.id)
    .eq("year", 2015)
    .order("created_at", { ascending: true });

  // Delete duplicates if any
  if (examRows && examRows.length > 1) {
    await supabase.from("exams").delete().in("id", examRows.slice(1).map(r => r.id));
  }

  let exam = examRows && examRows.length > 0 ? examRows[0] : null;

  if (!exam) {
    const { data: newExam, error: createErr } = await supabase
      .from("exams")
      .insert({
        id: crypto.randomUUID(),
        department_id: dept.id,
        year: 2015,
        title: "Computer Science 2015 Exit Exam",
        is_free: false,
        is_active: true,
      })
      .select("id")
      .single();
    if (createErr)
      return NextResponse.json({ error: "Failed to create exam: " + createErr.message }, { status: 500 });
    exam = newExam;
  }

  const examId = exam!.id;

  // Clear existing questions
  await supabase.from("questions").delete().eq("exam_id", examId);

  const questions = [
    {
      n: 1,
      q: "Which one of the following is concerned with the meaning of a sentence in knowledge representation?",
      a: "Structure", b: "Computational aspect", c: "Semantics", d: "Syntax",
      ans: "C",
      exp: "Semantics deals with the meaning and interpretation of sentences and symbols in knowledge representation.",
    },
    {
      n: 2,
      q: "Which one of the following is an attack performed by wiretapping a network and illicitly copying files and programs?",
      a: "Interception", b: "Fabrication", c: "Interruption", d: "Modification",
      ans: "A",
      exp: "Interception occurs when an attacker secretly accesses data during transmission.",
    },
    {
      n: 3,
      q: "If a company wants partial functionality delivered to users without unreasonable delay, which software development model is appropriate?",
      a: "Waterfall", b: "Incremental", c: "Spiral", d: "Evolutionary",
      ans: "B",
      exp: "The Incremental Model delivers software in small usable parts, allowing partial functionality early.",
    },
    {
      n: 4,
      q: "Which one of the following cannot affect proper functioning of a system?",
      a: "Improperly placed heater", b: "Humidity", c: "Lightning strikes", d: "UPS (Uninterruptible Power Supply)",
      ans: "D",
      exp: "A UPS protects systems from power failures — it prevents disruption rather than causing it.",
    },
    {
      n: 5,
      q: "_______ is the process of selecting an appropriate query execution strategy.",
      a: "Query graph", b: "Query optimization", c: "Query tree", d: "Query processing",
      ans: "B",
      exp: "Query optimization selects the most efficient way to execute a database query.",
    },
    {
      n: 6,
      q: "In asymmetric encryption, which statement is NOT correct?",
      a: "Public key is shared openly",
      b: "Private key is kept secret",
      c: "Encryption and decryption use different keys",
      d: "A user encrypts messages with their own private key for confidentiality",
      ans: "D",
      exp: "For confidentiality, a sender encrypts using the RECEIVER's public key, not their own private key.",
    },
    {
      n: 7,
      q: "Which agent uses an internal model of the world and predefined rules?",
      a: "Simple Reflex Agent", b: "Model-Based Reflex Agent", c: "Goal-Based Agent", d: "Utility-Based Agent",
      ans: "B",
      exp: "The Model-Based Reflex Agent maintains an internal state of the world to make decisions.",
    },
    {
      n: 8,
      q: "Which symbol is used for a single-line comment in JavaScript?",
      a: "<!-- -->", b: "/* */", c: "//", d: "##",
      ans: "C",
      exp: "Double slash (//) is used for single-line comments in JavaScript.",
    },
    {
      n: 9,
      q: "Which statement is correct about asymmetric keys?",
      a: "Uses only one secret key", b: "Uses public and private keys", c: "Uses no encryption", d: "Requires no authentication",
      ans: "B",
      exp: "Asymmetric cryptography uses a key pair: a public key and a private key.",
    },
    {
      n: 10,
      q: "Which testing phase is used to test individual program modules?",
      a: "Integration Testing", b: "System Testing", c: "Unit Testing", d: "Acceptance Testing",
      ans: "C",
      exp: "Unit testing focuses on testing individual components or modules in isolation.",
    },
    {
      n: 11,
      q: "Which command displays active network connections and ports?",
      a: "ping", b: "netstat", c: "ipconfig", d: "traceroute",
      ans: "B",
      exp: "netstat shows network statistics, active connections, and listening ports.",
    },
    {
      n: 12,
      q: "Which property of a hash function helps reduce collisions?",
      a: "Uniformity", b: "Recursion", c: "Modularity", d: "Encapsulation",
      ans: "A",
      exp: "Uniform distribution of hash values minimizes the chance of collisions.",
    },
    {
      n: 13,
      q: "In an array-based binary heap, the right child of node i is located at:",
      a: "2i", b: "2i + 1", c: "i/2", d: "2i - 1",
      ans: "B",
      exp: "Standard heap indexing: left child = 2i, right child = 2i + 1, parent = floor(i/2).",
    },
    {
      n: 14,
      q: "Which searching algorithm requires sorted data?",
      a: "Linear Search", b: "Sequential Search", c: "Binary Search", d: "Depth Search",
      ans: "C",
      exp: "Binary Search requires data to be sorted as it divides the search space in half each step.",
    },
    {
      n: 15,
      q: "What refers to the number of symbols in a string?",
      a: "Size", b: "Length", c: "Capacity", d: "Width",
      ans: "B",
      exp: "Length is the total number of characters (symbols) in a string.",
    },
    {
      n: 16,
      q: "Which technique sends data to a selected group of receivers?",
      a: "Broadcasting", b: "Unicasting", c: "Multicasting", d: "Routing",
      ans: "C",
      exp: "Multicasting targets a specific group of selected recipients, unlike broadcasting (all) or unicasting (one).",
    },
    {
      n: 17,
      q: "Which generation of programming languages is associated with AI?",
      a: "First Generation", b: "Second Generation", c: "Third Generation", d: "Fifth Generation",
      ans: "D",
      exp: "Fifth-generation languages (5GL) are designed to support AI and expert systems.",
    },
    {
      n: 18,
      q: "Which HTML attribute limits the number of characters in a text field?",
      a: "SIZE", b: "MAXLENGTH", c: "WIDTH", d: "LENGTH",
      ans: "B",
      exp: "The MAXLENGTH attribute controls the maximum number of characters allowed in an input field.",
    },
    {
      n: 19,
      q: "A requirement is said to be unambiguous if:",
      a: "It has many interpretations", b: "It has one clear interpretation", c: "It is difficult to understand", d: "It is optional",
      ans: "B",
      exp: "An unambiguous requirement has exactly one clear interpretation to avoid misunderstandings.",
    },
    {
      n: 20,
      q: "Which HTML feature divides a browser window into multiple sections?",
      a: "Tables", b: "Divisions", c: "Frames", d: "Layers",
      ans: "C",
      exp: "HTML Frames divide a browser window into independent sections, each loading a separate document.",
    },
    {
      n: 21,
      q: "Which statement is incorrect when mapping an ER diagram to a relational schema?",
      a: "Composite attributes are decomposed into simple attributes",
      b: "Multivalued attributes require separate relations",
      c: "Each entity type becomes a relation",
      d: "Composite attributes are mapped directly as one attribute",
      ans: "D",
      exp: "Composite attributes must be broken into their component attributes before mapping to a relational schema.",
    },
    {
      n: 22,
      q: "Which database recovery technique updates the database immediately after modification?",
      a: "Deferred Update", b: "Immediate Update", c: "Delayed Update", d: "Batch Update",
      ans: "B",
      exp: "Immediate update writes changes to the database before transaction completion.",
    },
    {
      n: 23,
      q: "Which synchronization mechanism uses a shared integer variable to control access?",
      a: "Semaphore", b: "Monitor", c: "Lock Variable", d: "Mutex",
      ans: "C",
      exp: "A lock variable is a shared integer that controls entry into the critical section.",
    },
    {
      n: 24,
      q: "Which of the following is a valid operation in formal language theory?",
      a: "Concatenation", b: "Compilation", c: "Scheduling", d: "Encryption",
      ans: "A",
      exp: "Concatenation combines strings from two languages and is a fundamental formal language operation.",
    },
    {
      n: 25,
      q: "Which addressing mode contains the actual operand within the instruction?",
      a: "Indirect Addressing", b: "Direct Addressing", c: "Immediate Addressing", d: "Indexed Addressing",
      ans: "C",
      exp: "Immediate addressing stores the operand value directly inside the instruction itself.",
    },
    {
      n: 26,
      q: "Which data structure is most suitable for implementing recursion?",
      a: "Queue", b: "Stack", c: "Array", d: "Tree",
      ans: "B",
      exp: "Recursive function calls are managed using a call stack — LIFO behavior matches recursion perfectly.",
    },
    {
      n: 27,
      q: "Which layer of the OSI model is responsible for routing packets?",
      a: "Physical Layer", b: "Data Link Layer", c: "Network Layer", d: "Session Layer",
      ans: "C",
      exp: "The Network Layer (Layer 3) handles routing and logical addressing (IP).",
    },
    {
      n: 28,
      q: "Which SQL command is used to remove all records from a table while keeping the table structure?",
      a: "DELETE", b: "DROP", c: "TRUNCATE", d: "REMOVE",
      ans: "C",
      exp: "TRUNCATE removes all rows from a table but preserves the table structure and schema.",
    },
    {
      n: 29,
      q: "Which software quality attribute refers to ease of maintenance?",
      a: "Reliability", b: "Maintainability", c: "Efficiency", d: "Portability",
      ans: "B",
      exp: "Maintainability measures how easily software can be modified, corrected, or enhanced.",
    },
    {
      n: 30,
      q: "Which scheduling algorithm gives the CPU to the process that arrives first?",
      a: "Round Robin", b: "Priority Scheduling", c: "FCFS", d: "SJF",
      ans: "C",
      exp: "First-Come, First-Served (FCFS) executes processes in the order they arrive in the ready queue.",
    },
    {
      n: 31,
      q: "What is the primary purpose of normalization?",
      a: "Increase redundancy", b: "Reduce redundancy", c: "Increase storage", d: "Reduce security",
      ans: "B",
      exp: "Normalization minimizes duplicate data, reduces anomalies, and improves data consistency.",
    },
    {
      n: 32,
      q: "Which network topology uses a central hub or switch?",
      a: "Bus", b: "Ring", c: "Star", d: "Mesh",
      ans: "C",
      exp: "In a star topology, all devices connect to a central hub or switch.",
    },
    {
      n: 33,
      q: "Which memory retains data even when power is turned off?",
      a: "RAM", b: "Cache", c: "ROM", d: "Register",
      ans: "C",
      exp: "ROM (Read-Only Memory) is non-volatile — it retains data without power.",
    },
    {
      n: 34,
      q: "Which algorithm explores nodes level by level?",
      a: "Depth First Search", b: "Breadth First Search", c: "Binary Search", d: "Linear Search",
      ans: "B",
      exp: "BFS visits all nodes at the current depth before going deeper, using a queue.",
    },
    {
      n: 35,
      q: "Which of the following is a valid relational database operation?",
      a: "Selection", b: "Compilation", c: "Parsing", d: "Encryption",
      ans: "A",
      exp: "Selection (σ) is a relational algebra operation that retrieves rows satisfying a given condition.",
    },
    {
      n: 36,
      q: "Which software model is best when requirements are well understood?",
      a: "Spiral Model", b: "Agile Model", c: "Waterfall Model", d: "Prototype Model",
      ans: "C",
      exp: "The Waterfall Model is most suitable when requirements are stable, clear, and well understood upfront.",
    },
    {
      n: 37,
      q: "Which switching technique establishes a dedicated path before communication begins?",
      a: "Packet Switching", b: "Multiplexing", c: "Broadcasting", d: "Circuit Switching",
      ans: "D",
      exp: "Circuit switching creates a dedicated end-to-end communication path before data transfer begins.",
    },
    {
      n: 38,
      q: "Which statement about CSS (Style Sheets) is false?",
      a: "Style sheets increase accessibility",
      b: "Style sheets create consistent appearance",
      c: "Style sheets make maintenance easier",
      d: "Style sheets do not reduce web page file size",
      ans: "D",
      exp: "CSS reduces repetition by separating style from content, which can reduce overall page file size.",
    },
    {
      n: 39,
      q: "Which statement is NOT correct about logical database design?",
      a: "It considers a particular DBMS",
      b: "Normalization is performed in this phase",
      c: "It is based on a data model",
      d: "It is independent of physical considerations",
      ans: "A",
      exp: "Logical design is DBMS-independent. It focuses on structure and relationships, not a specific product.",
    },
    {
      n: 40,
      q: "Which of the following is an attack detection mechanism?",
      a: "Physical Control", b: "Audit Log", c: "Password", d: "Encryption",
      ans: "B",
      exp: "Audit logs record system and user activities, enabling detection of security violations and breaches.",
    },
  ];

  // Insert all questions
  const { error } = await supabase.from("questions").insert(
    questions.map((q) => ({
      id: crypto.randomUUID(),
      exam_id: examId,
      question_number: q.n,
      question_text: q.q,
      option_a: q.a,
      option_b: q.b,
      option_c: q.c,
      option_d: q.d,
      correct_answer: q.ans,
      explanation: q.exp,
    }))
  );

  if (error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  // Verify
  const { count } = await supabase
    .from("questions")
    .select("id", { count: "exact" })
    .eq("exam_id", examId);

  return NextResponse.json({
    success: true,
    message: "Computer Science 2015 exam seeded successfully",
    questions_inserted: count,
    exam_id: examId,
  });
}
