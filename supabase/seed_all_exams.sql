-- ============================================================
-- EEE – CS 2015 Seed (40 Questions)
-- Run in Supabase SQL Editor AFTER SETUP_RUN_THIS_FIRST.sql
-- ============================================================

DO $$
DECLARE
  v_cs_dept_id UUID;
  v_cs2015_id  UUID;
BEGIN
  SELECT id INTO v_cs_dept_id FROM departments WHERE name = 'Computer Science' LIMIT 1;
  IF v_cs_dept_id IS NULL THEN
    RAISE EXCEPTION 'Computer Science department not found. Run SETUP_RUN_THIS_FIRST.sql first.';
  END IF;

  SELECT id INTO v_cs2015_id FROM exams
  WHERE department_id = v_cs_dept_id AND year = 2015 LIMIT 1;

  IF v_cs2015_id IS NULL THEN
    INSERT INTO exams (id, department_id, year, title, is_free, is_active)
    VALUES (uuid_generate_v4(), v_cs_dept_id, 2015, 'Computer Science 2015 Exit Exam', FALSE, TRUE)
    RETURNING id INTO v_cs2015_id;
    RAISE NOTICE 'Created exam: %', v_cs2015_id;
  ELSE
    RAISE NOTICE 'Using existing exam: %', v_cs2015_id;
    DELETE FROM questions WHERE exam_id = v_cs2015_id;
  END IF;

  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_cs2015_id,1,'Which one of the following is concerned with the meaning of a sentence in knowledge representation?','Structure','Computational aspect','Semantics','Syntax','C','Semantics deals with the meaning and interpretation of sentences and symbols in knowledge representation.'),
  (uuid_generate_v4(),v_cs2015_id,2,'Which one of the following is an attack performed by wiretapping a network and illicitly copying files and programs?','Interception','Fabrication','Interruption','Modification','A','Interception occurs when an attacker secretly accesses data during transmission.'),
  (uuid_generate_v4(),v_cs2015_id,3,'If a company wants partial functionality delivered to users without unreasonable delay, which software development model is appropriate?','Waterfall','Incremental','Spiral','Evolutionary','B','The Incremental Model delivers software in small usable parts.'),
  (uuid_generate_v4(),v_cs2015_id,4,'Which one of the following cannot affect proper functioning of a system?','Improperly placed heater','Humidity','Lightning strikes','UPS (Uninterruptible Power Supply)','D','A UPS protects systems from power failures.'),
  (uuid_generate_v4(),v_cs2015_id,5,'_______ is the process of selecting an appropriate query execution strategy.','Query graph','Query optimization','Query tree','Query processing','B','Query optimization selects the most efficient way to execute a query.'),
  (uuid_generate_v4(),v_cs2015_id,6,'In asymmetric encryption, which statement is NOT correct?','Public key is shared openly','Private key is kept secret','Encryption and decryption use different keys','A user encrypts messages with their own private key for confidentiality','D','For confidentiality, a sender encrypts using the RECEIVER''s public key, not their own private key.'),
  (uuid_generate_v4(),v_cs2015_id,7,'Which agent uses an internal model of the world and predefined rules?','Simple Reflex Agent','Model-Based Reflex Agent','Goal-Based Agent','Utility-Based Agent','B','The Model-Based Reflex Agent maintains an internal state of the world to make decisions.'),
  (uuid_generate_v4(),v_cs2015_id,8,'Which symbol is used for a single-line comment in JavaScript?','<!-- -->','/* */','//','##','C','Double slash (//) is used for single-line comments in JavaScript.'),
  (uuid_generate_v4(),v_cs2015_id,9,'Which statement is correct about asymmetric keys?','Uses only one secret key','Uses public and private keys','Uses no encryption','Requires no authentication','B','Asymmetric cryptography uses a key pair: a public key and a private key.'),
  (uuid_generate_v4(),v_cs2015_id,10,'Which testing phase is used to test individual program modules?','Integration Testing','System Testing','Unit Testing','Acceptance Testing','C','Unit testing focuses on testing individual components or modules in isolation.');

  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_cs2015_id,11,'Which command displays active network connections and ports?','ping','netstat','ipconfig','traceroute','B','netstat shows network statistics, active connections, and listening ports.'),
  (uuid_generate_v4(),v_cs2015_id,12,'Which property of a hash function helps reduce collisions?','Uniformity','Recursion','Modularity','Encapsulation','A','Uniform distribution of hash values minimizes the chance of collisions.'),
  (uuid_generate_v4(),v_cs2015_id,13,'In an array-based binary heap, the right child of node i is located at:','2i','2i + 1','i/2','2i - 1','B','Standard heap indexing: left child = 2i, right child = 2i + 1, parent = floor(i/2).'),
  (uuid_generate_v4(),v_cs2015_id,14,'Which searching algorithm requires sorted data?','Linear Search','Sequential Search','Binary Search','Depth Search','C','Binary Search requires sorted data as it divides the search space in half each step.'),
  (uuid_generate_v4(),v_cs2015_id,15,'What refers to the number of symbols in a string?','Size','Length','Capacity','Width','B','Length is the total number of characters (symbols) in a string.'),
  (uuid_generate_v4(),v_cs2015_id,16,'Which technique sends data to a selected group of receivers?','Broadcasting','Unicasting','Multicasting','Routing','C','Multicasting targets a specific group of selected recipients.'),
  (uuid_generate_v4(),v_cs2015_id,17,'Which generation of programming languages is associated with AI?','First Generation','Second Generation','Third Generation','Fifth Generation','D','Fifth-generation languages (5GL) are designed to support AI and expert systems.'),
  (uuid_generate_v4(),v_cs2015_id,18,'Which HTML attribute limits the number of characters in a text field?','SIZE','MAXLENGTH','WIDTH','LENGTH','B','The MAXLENGTH attribute controls the maximum number of characters allowed in an input field.'),
  (uuid_generate_v4(),v_cs2015_id,19,'A requirement is said to be unambiguous if:','It has many interpretations','It has one clear interpretation','It is difficult to understand','It is optional','B','An unambiguous requirement has exactly one clear interpretation.'),
  (uuid_generate_v4(),v_cs2015_id,20,'Which HTML feature divides a browser window into multiple sections?','Tables','Divisions','Frames','Layers','C','HTML Frames divide a browser window into independent sections.');

  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_cs2015_id,21,'Which statement is incorrect when mapping an ER diagram to a relational schema?','Composite attributes are decomposed into simple attributes','Multivalued attributes require separate relations','Each entity type becomes a relation','Composite attributes are mapped directly as one attribute','D','Composite attributes must be broken into their component attributes before mapping.'),
  (uuid_generate_v4(),v_cs2015_id,22,'Which database recovery technique updates the database immediately after modification?','Deferred Update','Immediate Update','Delayed Update','Batch Update','B','Immediate update writes changes to the database before transaction completion.'),
  (uuid_generate_v4(),v_cs2015_id,23,'Which synchronization mechanism uses a shared integer variable to control access?','Semaphore','Monitor','Lock Variable','Mutex','C','A lock variable is a shared integer that controls entry into the critical section.'),
  (uuid_generate_v4(),v_cs2015_id,24,'Which of the following is a valid operation in formal language theory?','Concatenation','Compilation','Scheduling','Encryption','A','Concatenation combines strings from two languages.'),
  (uuid_generate_v4(),v_cs2015_id,25,'Which addressing mode contains the actual operand within the instruction?','Indirect Addressing','Direct Addressing','Immediate Addressing','Indexed Addressing','C','Immediate addressing stores the operand value directly inside the instruction itself.'),
  (uuid_generate_v4(),v_cs2015_id,26,'Which data structure is most suitable for implementing recursion?','Queue','Stack','Array','Tree','B','Recursive function calls are managed using a call stack.'),
  (uuid_generate_v4(),v_cs2015_id,27,'Which layer of the OSI model is responsible for routing packets?','Physical Layer','Data Link Layer','Network Layer','Session Layer','C','The Network Layer (Layer 3) handles routing and logical addressing (IP).'),
  (uuid_generate_v4(),v_cs2015_id,28,'Which SQL command removes all records from a table while keeping the table structure?','DELETE','DROP','TRUNCATE','REMOVE','C','TRUNCATE removes all rows but preserves the table structure and schema.'),
  (uuid_generate_v4(),v_cs2015_id,29,'Which software quality attribute refers to ease of maintenance?','Reliability','Maintainability','Efficiency','Portability','B','Maintainability measures how easily software can be modified, corrected, or enhanced.'),
  (uuid_generate_v4(),v_cs2015_id,30,'Which scheduling algorithm gives the CPU to the process that arrives first?','Round Robin','Priority Scheduling','FCFS','SJF','C','First-Come, First-Served (FCFS) executes processes in the order they arrive.');

  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_cs2015_id,31,'What is the primary purpose of normalization?','Increase redundancy','Reduce redundancy','Increase storage','Reduce security','B','Normalization minimizes duplicate data, reduces anomalies, and improves data consistency.'),
  (uuid_generate_v4(),v_cs2015_id,32,'Which network topology uses a central hub or switch?','Bus','Ring','Star','Mesh','C','In a star topology, all devices connect to a central hub or switch.'),
  (uuid_generate_v4(),v_cs2015_id,33,'Which memory retains data even when power is turned off?','RAM','Cache','ROM','Register','C','ROM (Read-Only Memory) is non-volatile — it retains data without power.'),
  (uuid_generate_v4(),v_cs2015_id,34,'Which algorithm explores nodes level by level?','Depth First Search','Breadth First Search','Binary Search','Linear Search','B','BFS visits all nodes at the current depth before going deeper, using a queue.'),
  (uuid_generate_v4(),v_cs2015_id,35,'Which of the following is a valid relational database operation?','Selection','Compilation','Parsing','Encryption','A','Selection retrieves rows satisfying a given condition in relational algebra.'),
  (uuid_generate_v4(),v_cs2015_id,36,'Which software model is best when requirements are well understood?','Spiral Model','Agile Model','Waterfall Model','Prototype Model','C','The Waterfall Model is most suitable when requirements are stable and well understood upfront.'),
  (uuid_generate_v4(),v_cs2015_id,37,'Which switching technique establishes a dedicated path before communication begins?','Packet Switching','Multiplexing','Broadcasting','Circuit Switching','D','Circuit switching creates a dedicated end-to-end communication path before data transfer begins.'),
  (uuid_generate_v4(),v_cs2015_id,38,'Which statement about CSS (Style Sheets) is false?','Style sheets increase accessibility','Style sheets create consistent appearance','Style sheets make maintenance easier','Style sheets do not reduce web page file size','D','CSS reduces repetition by separating style from content, which can reduce overall page file size.'),
  (uuid_generate_v4(),v_cs2015_id,39,'Which statement is NOT correct about logical database design?','It considers a particular DBMS','Normalization is performed in this phase','It is based on a data model','It is independent of physical considerations','A','Logical design is DBMS-independent. It focuses on structure and relationships, not a specific product.'),
  (uuid_generate_v4(),v_cs2015_id,40,'Which of the following is an attack detection mechanism?','Physical Control','Audit Log','Password','Encryption','B','Audit logs record system and user activities, enabling detection of security violations.');

  RAISE NOTICE 'CS 2015: 40 questions inserted successfully';
END $$;

-- Verify
SELECT e.title, e.year, d.name, COUNT(q.id) AS questions
FROM exams e
JOIN departments d ON d.id = e.department_id
LEFT JOIN questions q ON q.exam_id = e.id
WHERE d.name = 'Computer Science' AND e.year = 2015
GROUP BY e.title, e.year, d.name;
