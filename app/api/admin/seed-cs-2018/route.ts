import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth.server";
import { createServerSupabaseClient } from "@/lib/supabase";

// POST /api/admin/seed-cs-2018
// Inserts all 100 CS 2018 questions directly into the database
export async function POST(req: NextRequest) {
  void req;
  const payload = await getAuthUser();
  if (!payload?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServerSupabaseClient();

  // Find the CS 2018 exam
  const { data: dept } = await supabase
    .from("departments")
    .select("id")
    .eq("name", "Computer Science")
    .single();

  if (!dept)
    return NextResponse.json({ error: "Computer Science department not found" }, { status: 404 });

  // Get or create the 2018 exam — safely handle duplicates
  const { data: examRows } = await supabase
    .from("exams")
    .select("id")
    .eq("department_id", dept.id)
    .eq("year", 2018)
    .order("created_at", { ascending: true });

  if (examRows && examRows.length > 1) {
    await supabase.from("exams").delete().in("id", examRows.slice(1).map(r => r.id));
  }

  let exam = examRows && examRows.length > 0 ? examRows[0] : null;

  if (!exam) {
    const { data: newExam, error: createErr } = await supabase
      .from("exams")
      .insert({ id: crypto.randomUUID(), department_id: dept.id, year: 2018, title: "Computer Science 2018 Exit Exam", is_free: false, is_active: true })
      .select("id")
      .single();
    if (createErr)
      return NextResponse.json({ error: "Failed to create exam: " + createErr.message }, { status: 500 });
    exam = newExam;
  }

  const examId = exam!.id;

  // Clear existing questions
  await supabase.from("questions").delete().eq("exam_id", examId);

  const Q = [
    [1,"Consider: nav ul { list-style-type: none; margin: 0; padding: 0; } What problem does this solve when creating a navigation bar?","Removes bullet points and default spacing, allowing custom layout","Aligns the navbar to the right of the page","Adds hover effects to list items","Converts the list into a dropdown menu","A","list-style-type:none removes bullets; margin/padding:0 removes default browser spacing."],
    [2,"Which AI approach most directly supports understanding biological intelligence behavior as a scientific goal?","Weak AI","Applied AI","Cognitive AI","Strong AI","C","Cognitive AI models human thought processes to understand and replicate biological intelligence."],
    [3,"In client-server database architecture, what is the primary role of the server?","Provide the GUI for end users","Initiate all network connections and poll clients for updates","Store and manage shared data, enforce ACID properties, and process client requests","Cache all user sessions locally for offline access","C","The server stores/manages data, enforces ACID, and responds to client queries."],
    [4,"Which automaton is powerful enough to recognize the language L = {a^n b^n c^n | n >= 1}?","DFA","Linear Bounded Automaton (LBA)","NFA","Pushdown Automaton (PDA)","B","LBA (Linear Bounded Automaton) recognizes context-sensitive languages like a^n b^n c^n."],
    [5,"In two-phase locking (2PL), during which phase may a transaction acquire locks but not release any?","Growing phase","Commit phase","Validation phase","Shrinking phase","A","In the Growing phase, transactions can only acquire locks. In Shrinking phase, they can only release locks."],
    [6,"To extend the connectivity of processor bus we use:","SCSI","PCI","Controllers","Multi bus","D","Multi bus architecture extends processor bus connectivity by using multiple interconnected buses."],
    [7,"Combinational circuit differs from sequential circuit primarily because:","Combinational circuit cannot be built using logic circuit","The output of combinational circuit depends only on the present input, not on past output.","Sequential circuit have no feedback while combinational circuit do","The combinational circuit requires clock signal, but sequential circuit do not","B","Combinational circuits have no memory — output depends only on current input."],
    [8,"Why is Greedy Best-First Search not guaranteed to be optimal or complete?","It ignores path cost g(n) and relies only on h(n)","It always chooses the shallowest node","It expands nodes in FIFO order","It requires full knowledge of the goal state in advance","A","Greedy BFS uses only h(n) ignoring actual path cost g(n), so it can miss optimal paths."],
    [9,"Which statement is correct about 'this' pointer in C++?","This pointer passed as hidden argument in all non-static member functions of the class.","This pointer passed as hidden argument in all static variables of the class.","This pointer passed as hidden argument in all static function of the class.","This pointer passed as hidden argument in all function of the class.","A","'this' pointer is implicitly passed to all non-static member functions to refer to the calling object."],
    [10,"In class diagram, if class Car has solid diamond pointing to class Engine, what does this indicate?","Car uses Engine temporarily","Engine can exist independently of the Car","Engine is the part of Car and cannot exist without it","Car inherits from Engine","C","Solid diamond = Composition: Engine cannot exist without Car (strong ownership)."],
  ] as const;

  const Q2 = [
    [11,"The amount of time the algorithm takes on the smallest possible set of inputs is called:","Average time","Small time","Worst time","Best time","D","Best-case time complexity is the minimum time for the smallest/simplest input."],
    [12,"For a weak entity set to be meaningful, it must be associated with another entity set, called the:","Identifying set","Strong entity set","Neighbor set","Owner set","B","A weak entity depends on a Strong entity set (identifying entity) for its existence."],
    [13,"Which one of the following is NOT an application level service?","Proxies and agents","Installing a new service","E-mail configuration","Quality of service","B","Installing a new service is a system administration task, not an application level service."],
    [14,"A language that allows the DBA or user to describe and name entities, attributes, and relationships is:","Transaction control language (TCL)","Data control language (DCL)","Data Manipulation Language (DML)","Data Definition Language (DDL)","D","DDL (Data Definition Language) defines schema: CREATE, ALTER, DROP commands."],
    [15,"Which one of the following is a linear data structure?","Tree","Array","Queue","Linked list","B","Array is linear. Note: Queue and Linked List are also linear — but Array is the most fundamental linear structure."],
    [16,"What is the main purpose of syntax-directed translation in a compiler?","To interleave semantic analysis with syntax analysis using attributes attached to grammar symbols","To generate optimized machine code directly","To tokenize the source code","To replace the parser with a finite automaton","A","Syntax-directed translation attaches semantic rules (attributes) to grammar productions."],
    [17,"What will be the output of: int sum=0; for(int j=1; j<=10; j++) { sum=sum+j; } System.out.println(+sum);","55","44","33","66","A","Sum of 1+2+...+10 = 55. The unary + before sum is valid and prints the value."],
    [18,"Which keyword is used in Java to create a subclass that inherits from a superclass?","Inherits","Superclass","Extends","Implements","C","Java uses 'extends' keyword for class inheritance."],
    [19,"C++ code: int a=6,b=8; int x=2,y=4; int c(x>y?(a--;x):(b--;y)); Output of a, b, c?","a=6 b=5 c=4","a=6 b=7 c=5","a=8 b=6 c=5","a=6 b=7 c=4","D","x>y is false (2>4), so b-- executes (b=7) and c=y=4. a remains 6."],
    [20,"___ is a collection of related fields that can be treated as a unit by some application program.","Rows","Field","Record","Database","C","A Record is a collection of related fields representing one entity instance."],
    [21,"Straight directed translation uses:","Purely lexical rules","Backtracking algorithms","Grammar without attributes","Grammar with semantic rule","D","Syntax-directed translation (straight translation) uses grammar augmented with semantic rules."],
    [22,"Which one of the following is the FIRST operation in CPU instruction cycle?","Executing the instruction","Handling interrupt","Decoding the instruction","Fetching the instruction","D","CPU instruction cycle: Fetch -> Decode -> Execute -> (Handle interrupt)."],
    [23,"Which search strategy expands the node closest to the goal using f(n) = h(n)?","Uniform-cost search","Greedy best-first search","Depth-first search","A* search","B","Greedy Best-First Search uses only the heuristic h(n) to select the next node."],
    [24,"Which one of the following is a top-down parser WITHOUT backtracking?","LR parser","Brute force parser","Operator precedence parser","Predictive parser","D","Predictive parser (LL parser) is a top-down parser that uses lookahead to avoid backtracking."],
    [25,"How many layers are there in the OSI reference model?","7","6","5","4","A","OSI model has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application."],
    [26,"Which computer structural component provides for communication among CPU, main memory and I/O?","System unit","Computer network","CPU","System interconnection","D","System interconnection (system bus) links CPU, memory, and I/O devices."],
    [27,"Mr. Getahun can view but cannot change database records. Which security technique is used?","Access Control","Availability","Non-repudiation","Integrity","A","Access Control restricts permissions — read-only access is a form of access control."],
    [28,"Deferred update with no checkpoints in high-transaction OLTP. Most serious drawback?","Log scans become prohibitively expensive after long uptime","Increased disk I/O due to frequent page copying","Shared locks cannot be used","View serializability cannot be ensured","A","Without checkpoints, recovery requires scanning the entire log from the beginning."],
    [29,"Which OS function is categorized under process management?","Allocates the device in the efficient way","De-allocates the resources","Allocates the memory when the process requests it","Allocates the processor (CPU) to a process","D","CPU scheduling (allocating processor to processes) is a core process management function."],
    [30,"Which of the following statements about formal languages is TRUE?","Every regular language is context-free.","Every context-free language is regular.","Every context-sensitive language is regular.","Every recursively enumerable language is recursive","A","The Chomsky hierarchy: Regular is a subset of Context-Free, which is a subset of Context-Sensitive, which is a subset of Recursively Enumerable."],
  ] as const;

  const Q3 = [
    [31,"___ allows an I/O device to transfer data directly to/from memory without CPU involvement.","Asynchronous data transfer","Direct Memory Access (DMA)","Interrupt-driven transfer","Programmed I/O transfer","B","DMA bypasses the CPU for data transfer between I/O devices and main memory."],
    [32,"Which PHP method retrieves information from form control through URL parameters?","$_REQUEST[]","$_POST[]","$_GET[]","isset()","C","$_GET[] retrieves data sent via URL query string (GET method)."],
    [33,"Which statement is NOT true about digital signature?","Digital signature is not an encryption algorithm","Sender encrypts message with its private key","Sender encrypts message with its public key","Digital signature provides authentication services","C","In digital signatures, the sender encrypts (signs) with their PRIVATE key, not public key."],
    [34,"Which IP address class uses first two octets for network and last two for host addressing?","Class C","Class D","Class A","Class B","D","Class B: 2 octets network (16 bits) + 2 octets host (16 bits). Range: 128.0.0.0-191.255.255.255."],
    [35,"Which best defines a heuristic in the context of AI search?","A function that estimates how close a state is to the goal","A guaranteed optimal path to the goal","A method that always avoids revisiting states","A brute-force enumeration of all possible states","A","A heuristic h(n) estimates the cost from state n to the goal without guaranteeing optimality."],
    [36,"Which party performs technical evaluation to confirm a product satisfies security target requirements?","Evaluator","Certifier","Sponsor","Developer","A","The Evaluator independently tests and verifies the product against security requirements."],
    [37,"For a university/bank data center storing critical data, which RAID is most preferable?","RAID level 3","RAID level 1","RAID level 2","RAID level 0","B","RAID 1 (mirroring) provides full redundancy — ideal for critical data requiring high availability."],
    [38,"Which technique is INAPPROPRIATE for determining the lower bound of comparison-based sorting?","Decision tree model — assumes only array indexing is allowed","Recurrence relations — because sorting is not naturally recursive","Asymptotic analysis — because it ignores constants","Decision tree model — gives information-theoretic lower bound of Omega(n log n)","B","Decision tree model gives the correct Omega(n log n) lower bound. Recurrence relations are inappropriate here."],
    [39,"In CSS, which property is used to change the text color of an element?","text-color","font-color","color","Foreground","C","The CSS 'color' property sets the text/foreground color of an element."],
    [40,"Which SQL function creates a table correctly?","CREATE table_name (column_name, column type)","CREATE table_name (column_type, column name)","CREATE TABLE table_name (column_name, column type)","CREATE TABLE table_name (column_type, column name)","C","Correct syntax: CREATE TABLE table_name (column_name datatype, ...);"],
    [41,"What is the primary function of an operating system?","To connect to the internet","To create documents and spreadsheets","To design computer hardware","To act as an intermediary between users and computer hardware","D","An OS manages hardware resources and provides an interface between users and hardware."],
    [42,"How many time units T(n) does this code take? int sum=0; for(i=1;i<=n;i++) sum=sum+1; return sum;","5n+5","4n2+4","6n+2","4n+4","C","1(init) + n+1(condition) + n(increment) + n(body) + n(body assign) + 1(return) + 1(init sum) = 6n+2 approximately."],
    [43,"OOP principle that contains information in an object, exposing only selected information:","Abstraction","Inheritance","Polymorphism","Encapsulation","D","Encapsulation bundles data and methods, exposing only what is needed (information hiding)."],
    [44,"Stack follows ____ policy:","LIFO","FIFO","FILO","FCFS","A","Stack = Last In First Out (LIFO). Last element pushed is first popped."],
    [45,"Which is FALSE about database system?","It is very difficult to protect a file under the system","In database system the user is not required to write the procedures","DBMS provides a good protection mechanism","It contains sophisticated techniques to store and retrieve data","A","Database systems actually make it EASIER to protect data through DBMS security mechanisms."],
    [46,"Which one is categorized under Log-based Recovery Techniques in database?","Recovery in Multi-database Systems","ARIES Recovery Algorithm","Shadow Paging Technique","Deferred Database Modification","B","ARIES (Algorithm for Recovery and Isolation Exploiting Semantics) is a log-based recovery algorithm."],
    [47,"What is the FIRST step to convert CFG into Greibach Normal Form (GNF)?","Convert the grammar into CNF","If any production rule is not in GNF form, convert it","Convert the grammar into GNF","If the grammar has left recursion, eliminate it","D","First step to GNF: eliminate left recursion from the grammar."],
    [48,"A user installs a new printer; OS automatically detects and configures it. This is an example of:","Plug-and-play functionality","Manual driver installation","Manual hardware management","Resource allocation","A","Plug-and-play (PnP) allows OS to automatically detect and configure new hardware."],
    [49,"Which of the following is NOT a property of an algorithm?","Finiteness","Definiteness","Correctness","Platform dependence","D","Algorithm properties: Finiteness, Definiteness, Input, Output, Effectiveness. Platform independence is desirable but not a formal property."],
    [50,"Which RAID is known as striping with parity and fault tolerance?","RAID 2","RAID 1","RAID 5","RAID 0","C","RAID 5 uses block-level striping with distributed parity — tolerates 1 disk failure."],
  ] as const;

  const Q4 = [
    [51,"Need to develop large portable programs quickly. Which programming language type is preferable?","Low level","Machine level","High level","Assembly","C","High-level languages (Java, Python, C++) are portable and support rapid development."],
    [52,"Which heuristic search evaluates f(n) = g(n) + h(n) for optimal path-finding?","A* search","Greedy Best-First Search","Uniform-cost search","Depth-first search","A","A* combines actual cost g(n) and heuristic h(n) to find optimal paths efficiently."],
    [53,"If input is 'a' (identifier) for syntax tree, which function creates the leaf node?","mknode(num, value)","mkleaf(num, value)","mkleaf(id, entry)","mknode(op, left, right)","C","For a variable 'a', mkleaf(id, entry) creates a leaf node in the syntax tree."],
    [54,"Mr. Negesa acts as Mr. Dereje to send a message to Registrar X. What type of attack is this?","Denial of service","Modification of message","Masquerade","Replay","C","Masquerade attack: attacker impersonates another user to gain unauthorized access."],
    [55,"Which is a DISADVANTAGE of the Waterfall model?","Model is simple and easy to understand and use","It is easy to manage due to the rigidity of the model","Not suitable for projects where requirements are at moderate to high risk of changing","In this model phases are processed and completed one at a time","C","Waterfall cannot accommodate changing requirements — major weakness for dynamic projects."],
    [56,"Directed line(->) from relationship set advisor to BOTH instructor and student entity sets indicates:","Many to one","Many to many","One to one","One to many","A","Arrow to both sides of a relationship = Many-to-one mapping."],
    [57,"Resources cannot be forcibly taken from processes; must be released voluntarily. Which deadlock condition?","No Preemption","Hold and Wait","Mutual Exclusion","Circular Wait","A","No Preemption: resources cannot be forcibly removed — process must release voluntarily."],
    [58,"Which statement is WRONGLY described about code generation?","Code generation can be considered as the start phase of compilation","The target program is the output of the code generator","Code generation needs complete error-free intermediate code as input","It produces target code for three-address statements","A","Code generation is the LAST (not start) phase of compilation."],
    [59,"___ is a service that allows organizations to post a website onto the Internet.","Web hosting","Internet service provider","Web client","Domain name registration","A","Web hosting provides server space for websites to be accessible on the internet."],
    [60,"In a singly linked list, a node contains:","Data and index","Data and one pointer (the next node)","Only data","Data and two pointers","B","Singly linked list node has: data field + one pointer to the next node."],
    [61,"Which statement is a NON-FUNCTIONAL requirement?","The system allows user to generate PDF report","The system responds to user requests within 2 seconds under normal load","The system allows user to store data on relational database","The system allows user to submit emergency report","B","Non-functional requirements specify quality attributes like performance, not features."],
    [62,"In object design, what does the contract typically include?","The class diagram and sequence diagram","Project budget and timeline","Invariants, preconditions, postconditions","The use case names and actors role","C","Object design contracts specify: invariants (always true), preconditions (before), postconditions (after)."],
    [63,"Which OSI layer is NOT correctly matched to its PDU?","Application layer ---> Data","Transport layer ---> Segment","Physical layer ---> Bit","Network layer ---> Frame","D","Network layer PDU = Packet (not Frame). Frame is the Data Link layer PDU."],
    [64,"Which data structure follows LIFO principle?","Graphs","Queues","Stacks","Trees","C","Stack follows LIFO (Last In First Out) — push and pop from the same end."],
    [65,"Dog class overrides sound() from Animal class. Which OOP concept is illustrated?","Method overriding","Method overloading","Abstraction","Encapsulation","A","Method overriding: subclass provides its own implementation of a superclass method."],
    [66,"Which type of grammar generates all possible patterns of strings in a given formal language?","Context-free","Context-sensitive","Recursively enumerable","Regular","C","Recursively enumerable grammars (Type 0) generate all computable languages."],
    [67,"Which tool is used to troubleshoot network connectivity?","Ipconfig","Ping","Encryption","Firewall","B","Ping sends ICMP echo requests to test network connectivity between two hosts."],
    [68,"The time complexity for binary search is:","O(n*log(n)^2)","O(n^2)","O(n)","O(log n)","D","Binary search divides the search space in half each step: O(log n)."],
    [69,"Which access specifier is accessible within the same package or subclasses in a different package?","Public","Default","Private","Protected","D","Protected access: accessible within same package AND subclasses in different packages."],
    [70,"What is the basic goal of Normalization?","To decrease data integrity","To reduce redundancy","To maximize transitive dependency","To increase dependency","B","Normalization eliminates data redundancy and anomalies by organizing data into related tables."],
  ] as const;

  const Q5 = [
    [71,"Which protocol is mostly used for communication between client and server in a web application?","FTP","SMTP","HTTP","SSH","C","HTTP (HyperText Transfer Protocol) is the foundation of web communication."],
    [72,"Which OSI layer is responsible for encryption, translation and compression?","Presentation layer","Data link layer","Transport layer","Network layer","A","Presentation Layer (Layer 6) handles encryption, compression, and data format translation."],
    [73,"What is the file extension of a JavaScript file?",".javaS",".JS",".java",".CSS","B","JavaScript files use the .js (or .JS) extension."],
    [74,"Why is perception still a challenge for AI even though systems can recognize faces?","Because perception is unrelated to reasoning","Because AI lacks actuators","Because perception requires common-sense knowledge and robust natural language understanding in open-ended worlds","Because sensors are too expensive","C","Real-world perception requires understanding context, language, and common sense beyond pattern recognition."],
    [75,"Which service translates domain names to IP addresses?","HTTPS","DHCP","HTTP","DNS","D","DNS (Domain Name System) resolves human-readable domain names to IP addresses."],
    [76,"Which one monitors incoming/outgoing traffic and allows/blocks based on security rules?","Intrusion detection system (IDS)","Proxy server","Virtual Private network","Firewall","D","Firewall filters network traffic based on predefined security rules."],
    [77,"Consider attributes ID, CITY and NAME. Which can be a super key?","NAME","ID","CITY","CITY, ID","D","A superkey uniquely identifies rows. ID alone works, but CITY,ID is also a valid superkey (contains candidate key)."],
    [78,"Method calculateTax() in Employee class cannot be overridden by subclasses. Which declaration?","Abstract double calculateTax()","Final double calculateTax(){...}","Private double calculateTax(){...}","Static double calculateTax(){...}","B","The 'final' keyword prevents method overriding in subclasses."],
    [79,"Which identifier name is INVALID in C++ programming language?","delete","for_cpp","jan2025","Hello","A","'delete' is a reserved keyword in C++ and cannot be used as an identifier."],
    [80,"Which UML building block defines the static part of the model representing physical and conceptual elements?","Structural things","Behavioral things","Annotational things","Grouping things","A","Structural things (classes, interfaces, components) define static structure in UML."],
    [81,"Which scenario is best suited for UDP rather than TCP protocol?","Live video streaming","Email transmission","Downloading the files","Database update","A","UDP is preferred for live streaming where speed matters more than reliability."],
    [82,"Which distributed DB transparency distributes a relation into sub-relations by subset of columns?","Replication","Location","Horizontal","Vertical","D","Vertical fragmentation splits a relation by columns (subsets of attributes)."],
    [83,"In which learning method does an agent receive rewards or penalties to maximize cumulative reward?","Supervised learning","Reinforcement learning","Semi-supervised learning","Unsupervised learning","B","Reinforcement Learning uses reward/penalty feedback to learn optimal behavior over time."],
    [84,"After deployment users report system slows during peak hours. Which quality attribute is affected?","Maintainability","Performance","Reliability","Usability","B","Performance is the quality attribute related to response time and throughput under load."],
    [85,"Which is WRONGLY stated about the importance of security policy?","To help minimize risk","To ensure confidentiality, integrity and availability of data","To coordinate and enforce a security program across an organization","To use the system in a passive way","D","Security policies are ACTIVE frameworks for protection, not passive system usage."],
    [86,"Which of the following is NOT a task of the lexical analyzer?","Generating parse trees","Correlating errors with line numbers","Entering identifiers into the symbol table","Stripping whitespace and comments","A","Parse tree generation is done by the parser (syntax analyzer), not the lexical analyzer."],
    [87,"Which sorting algorithm compares adjacent elements and swaps them if in reversed order?","Insertion sort","Bubble sort","Selection sort","Shell sort","B","Bubble sort repeatedly compares and swaps adjacent elements until sorted."],
    [88,"Which security goal prevents disclosure of sensitive information to unauthorized users?","Confidentiality","Integrity","Cyberspace","Availability","A","Confidentiality ensures information is not disclosed to unauthorized parties."],
    [89,"IPv4 binary: 11000001 10000011 00011011 11111111. Dotted decimal notation?","192.174.27.255","192.134.67.254","193.130.28.254","193.131.27.255","D","11000001=193, 10000011=131, 00011011=27, 11111111=255 -> 193.131.27.255"],
    [90,"Grammar G1: ({S,A,B}, {a,b}, S, {S->AB, A->a, B->b}). Which are terminal symbols?","a, b","S","S->AB, A->a, B->b","S, A, B","A","Terminal symbols are the actual characters {a,b}. Non-terminals are {S,A,B}."],
  ] as const;

  const Q6 = [
    [91,"Which is NOT an application of queue in the real world?","Used in OS for handling interrupts","Used to maintain play list in media players in order","Used in Depth First search","Widely used as waiting lists for a single shared resource","C","DFS uses a STACK, not a queue. BFS uses a queue."],
    [92,"Which is a DISADVANTAGE of circuit switching?","Predictable performance","Low latency","Guaranteed bandwidth","Limited scalability","D","Circuit switching reserves a dedicated path, making it hard to scale for many simultaneous connections."],
    [93,"Attacker sets cookie logged_in=1 without authenticating. Session stored server-side. Most accurate?","The system is vulnerable — cookie-only checks bypass server session validation","The system is secure — session data cannot be forged without server-side secret","The system is vulnerable only if session_id is exposed","The system is secure if HTTPS is used","A","If the server only checks the client cookie (not server-side session), the system is vulnerable to cookie tampering."],
    [94,"The language L = {ww^R | w in {a,b}*} (even-length palindromes) is:","Regular","Non-deterministic CFL but not deterministic","Deterministic CFL","Context-sensitive but not context-free","B","Even palindromes are accepted by non-deterministic PDAs but not deterministic PDAs -> Non-deterministic CFL."],
    [95,"___ is one of the candidate keys chosen by the DB designer to uniquely identify an entity set.","Super key","Candidate key","Social security key","Primary key","D","The Primary key is selected from candidate keys by the designer to uniquely identify entities."],
    [96,"Which statement about function overloading is TRUE?","Overloaded functions have same name but different parameters/type","Overloaded function is not supported","Overloaded function must have different return type","Overloaded function must have the same number of parameters","A","Overloading: same function name, different parameter types or number."],
    [97,"How does an OS improve efficiency in a multi-user environment?","By allowing only one user to access the system at a time","By disabling all background services","By using time-sharing and process scheduling to allocate CPU time fairly","By requiring manual intervention for each task","C","Time-sharing OS uses process scheduling to give each user a fair share of CPU time."],
    [98,"Which is NOT a feature of a dynamic web page?","Contents can be generated on-the-fly","Changing content or lively","Contain the same prebuilt content each time the page is loaded","Ability to connect to a database","C","Static pages have same content every load. Dynamic pages generate content on-the-fly."],
    [99,"Why should form input elements include an associated label with the 'for' attribute?","It enables offline form storage","It encrypts user data","It increases form submission speed","It improves accessibility: screen readers announce the label when the input is focused","D","Labels improve accessibility — screen readers use them to describe input fields to visually impaired users."],
    [100,"What is the name of the logic gate shown with inputs A, B and output F with a bubble (inversion)?","XOR","NOR","NAND","AND","C","The symbol shown is an AND gate with a bubble (circle) at output = NAND gate. NAND = NOT AND."],
  ] as const;

  // Combine all questions
  const allQuestions = [...Q, ...Q2, ...Q3, ...Q4, ...Q5, ...Q6];

  // Insert in batches of 20
  const batchSize = 20;
  const errors: string[] = [];

  for (let i = 0; i < allQuestions.length; i += batchSize) {
    const batch = allQuestions.slice(i, i + batchSize).map((q) => ({
      id: crypto.randomUUID(),
      exam_id: examId,
      question_number: q[0] as number,
      question_text: q[1] as string,
      option_a: q[2] as string,
      option_b: q[3] as string,
      option_c: q[4] as string,
      option_d: q[5] as string,
      correct_answer: q[6] as string,
      explanation: q[7] as string,
    }));

    const { error } = await supabase.from("questions").insert(batch);
    if (error) {
      errors.push(`Batch ${i / batchSize + 1} failed: ${error.message}`);
    }
  }

  if (errors.length > 0) {
    return NextResponse.json({ success: false, errors }, { status: 500 });
  }

  // Verify count
  const { count } = await supabase
    .from("questions")
    .select("id", { count: "exact" })
    .eq("exam_id", examId);

  return NextResponse.json({
    success: true,
    message: `CS 2018 exam seeded successfully`,
    questions_inserted: count,
    exam_id: examId,
  });
}
