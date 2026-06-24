-- ============================================================
-- EEE – Add 20 questions to every exam that has none
-- Just paste and run — no changes needed
-- ============================================================

DO $$
DECLARE
  exam_rec RECORD;
  cnt      INTEGER;
BEGIN
  FOR exam_rec IN SELECT id, title FROM exams WHERE is_active = TRUE LOOP
    SELECT COUNT(*) INTO cnt FROM questions WHERE exam_id = exam_rec.id;

    IF cnt = 0 THEN
      RAISE NOTICE 'Adding questions to: %', exam_rec.title;

      INSERT INTO questions
        (id, exam_id, question_number, question_text,
         option_a, option_b, option_c, option_d, correct_answer, explanation)
      VALUES
      (uuid_generate_v4(),exam_rec.id,1,'What is the primary function of an operating system?','Store files permanently','Manage hardware and software resources','Browse the internet','Run antivirus software','B','An OS manages CPU, memory, I/O devices.'),
      (uuid_generate_v4(),exam_rec.id,2,'Which data structure follows LIFO?','Queue','Array','Stack','Linked List','C','Stack = Last In First Out.'),
      (uuid_generate_v4(),exam_rec.id,3,'What does CPU stand for?','Central Program Unit','Core Processing Unit','Central Processing Unit','Computer Protocol Unit','C','CPU = Central Processing Unit.'),
      (uuid_generate_v4(),exam_rec.id,4,'SQL command to retrieve data?','INSERT','DELETE','UPDATE','SELECT','D','SELECT retrieves data from tables.'),
      (uuid_generate_v4(),exam_rec.id,5,'Which is NOT a feature of OOP?','Encapsulation','Compilation','Inheritance','Polymorphism','B','OOP: Encapsulation, Inheritance, Polymorphism, Abstraction.'),
      (uuid_generate_v4(),exam_rec.id,6,'Binary Search time complexity?','O(n)','O(n²)','O(log n)','O(n log n)','C','Binary search halves the array each step.'),
      (uuid_generate_v4(),exam_rec.id,7,'Protocol for sending emails?','FTP','HTTP','SMTP','SNMP','C','SMTP = Simple Mail Transfer Protocol.'),
      (uuid_generate_v4(),exam_rec.id,8,'Base of binary number system?','8','10','16','2','D','Binary uses base 2 — digits 0 and 1.'),
      (uuid_generate_v4(),exam_rec.id,9,'OSI layer responsible for routing?','Session','Transport','Data Link','Network','D','Network Layer routes packets using IP.'),
      (uuid_generate_v4(),exam_rec.id,10,'What does RAM stand for?','Read Access Memory','Random Access Memory','Rapid Access Module','Read And Modify','B','RAM = Random Access Memory.'),
      (uuid_generate_v4(),exam_rec.id,11,'Sorting algorithm with O(n log n)?','Bubble Sort','Insertion Sort','Merge Sort','Selection Sort','C','Merge Sort = O(n log n) consistently.'),
      (uuid_generate_v4(),exam_rec.id,12,'What is polymorphism in OOP?','Multiple inheritance','Same interface, different behaviors','Hiding data','Creating objects','B','Polymorphism = one interface, many implementations.'),
      (uuid_generate_v4(),exam_rec.id,13,'What does HTTP stand for?','HyperText Transfer Protocol','High Transfer Text Process','Hyper Terminal Transfer Protocol','HyperText Terminal Program','A','HTTP is the foundation of web communication.'),
      (uuid_generate_v4(),exam_rec.id,14,'Which is a non-volatile storage?','RAM','Cache','Hard Disk Drive','CPU Register','C','HDD retains data without power.'),
      (uuid_generate_v4(),exam_rec.id,15,'What is a compiler?','Runs code line by line','Translates source to machine code','Stores data','Manages memory','B','Compiler translates high-level code to machine code.'),
      (uuid_generate_v4(),exam_rec.id,16,'HTML tag for hyperlink?','<link>','<a>','<href>','<url>','B','The <a> tag creates hyperlinks.'),
      (uuid_generate_v4(),exam_rec.id,17,'Primary key characteristic?','Can be NULL','Can repeat','Uniquely identifies each row','Is a foreign key','C','Primary key uniquely identifies each record.'),
      (uuid_generate_v4(),exam_rec.id,18,'Result of 0 AND 1 in Boolean algebra?','1','0','True','Undefined','B','AND returns 1 only when both inputs are 1.'),
      (uuid_generate_v4(),exam_rec.id,19,'OSI layer for encryption?','Network','Transport','Presentation','Session','C','Presentation Layer handles encryption.'),
      (uuid_generate_v4(),exam_rec.id,20,'What is encapsulation in OOP?','Inheriting from parent class','Wrapping data and methods into one unit','Creating multiple instances','Overriding methods','B','Encapsulation bundles data and methods together.');

    ELSE
      RAISE NOTICE 'Skipped % (already has % questions)', exam_rec.title, cnt;
    END IF;
  END LOOP;
  RAISE NOTICE 'Done.';
END $$;

-- Verify results
SELECT e.title, e.year, d.name AS department, COUNT(q.id) AS questions
FROM exams e
JOIN departments d ON d.id = e.department_id
LEFT JOIN questions q ON q.exam_id = e.id
GROUP BY e.title, e.year, d.name
ORDER BY d.name, e.year;
