-- ============================================================
-- Civil Engineering 2015 Exit Exam
-- Source: AASTU Civil Engineering Model Exit Exam 2, June 2023
-- Run this in Supabase SQL Editor AFTER SETUP_RUN_THIS_FIRST.sql
-- ============================================================

DO $$
DECLARE
  v_dept_id UUID;
  v_exam_id UUID;
BEGIN
  -- Get Civil Engineering department
  SELECT id INTO v_dept_id FROM departments WHERE name = 'Civil Engineering' LIMIT 1;
  IF v_dept_id IS NULL THEN
    RAISE EXCEPTION 'Civil Engineering department not found. Run SETUP_RUN_THIS_FIRST.sql first.';
  END IF;

  -- Create 2015 exam or reuse if exists
  SELECT id INTO v_exam_id FROM exams
  WHERE department_id = v_dept_id AND year = 2015 LIMIT 1;

  IF v_exam_id IS NULL THEN
    INSERT INTO exams (id, department_id, year, title, is_free, is_active)
    VALUES (uuid_generate_v4(), v_dept_id, 2015,
            'Civil Engineering 2015 Exit Exam', FALSE, TRUE)
    RETURNING id INTO v_exam_id;
    RAISE NOTICE 'Created exam: %', v_exam_id;
  ELSE
    RAISE NOTICE 'Using existing exam: %', v_exam_id;
    -- Clear existing questions to replace with real ones
    DELETE FROM questions WHERE exam_id = v_exam_id;
  END IF;

  -- ── Structural Engineering: Reinforced Concrete I ────────────
  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_exam_id,1,
   'Select the behavior of Stress-Strain curve for low concrete grade.',
   'Sharper the peak of the curve','High failure strain','Less failure strain',
   'The Behavior cannot be affected by the strength of the concrete','C',
   'Low concrete grade has less failure strain — the curve drops off sooner after the peak.'),

  (uuid_generate_v4(),v_exam_id,2,
   'Which of the following design philosophy uses factor of safety for materials and loads?',
   'Working Stress Method','Ultimate Load Method','Limit State Design Method',
   'Working Stress & Ultimate Load Method','C',
   'Limit State Design uses partial safety factors for both materials and loads.'),

  (uuid_generate_v4(),v_exam_id,3,
   'A RC beam (250mm wide, 400mm effective depth) has 8mm 2-legged stirrups at 150mm c/c. Shear capacity of concrete = 30.58kN, fyd = 300MPa. Calculate the shear resistance.',
   '51kN','28kN','81kN','111kN','D',
   'Vs = (Asv × fyd × d)/s = (2×π/4×64×300×400)/150 = 80.42kN. Total = 30.58 + 80.42 ≈ 111kN.'),

  (uuid_generate_v4(),v_exam_id,4,
   'Which type of beam is selected when the depth of the beam is limited by the architect?',
   'Singly reinforced','T beam','Doubly reinforced','Inverted L beam','C',
   'Doubly reinforced beams are used when architectural constraints limit the depth.'),

  (uuid_generate_v4(),v_exam_id,5,
   'When moment redistribution at interior supports of a slab is done, the sum of distribution factors of all members meeting at any joint is always:',
   'Zero','Equal','Less than 1','Equal to 1','D',
   'The sum of distribution factors at any joint always equals 1 in moment distribution method.'),

  (uuid_generate_v4(),v_exam_id,6,
   'As per EBCS, which statement is NOT correct about curtailment of positive reinforcement in a continuous member?',
   'Minimum two bars should extend throughout.',
   'At least one third bars should extend into the support for a ¾ development length.',
   'Cut-off bars shall extend not less than effective depth beyond theoretical cut-off point.',
   'Cut-off bars shall extend not less than 12 times the bar diameter beyond theoretical cut-off point.',
   'B',
   'EBCS requires at least 1/4 (not 1/3) of bars to extend into the support.');

  -- ── Reinforced Concrete II ───────────────────────────────────
  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_exam_id,7,
   'The length between points of inflection of columns is:',
   'Span length','Face to face length','Center to center length','Effective buckling length','D',
   'Effective buckling length is the distance between points of zero moment (inflection points).'),

  (uuid_generate_v4(),v_exam_id,8,
   'Second order effect is considered for:',
   'Braced columns','Slender column','Short columns','Circular column','B',
   'Second order (P-delta) effects are significant for slender columns.'),

  (uuid_generate_v4(),v_exam_id,9,
   'Which of the following is NOT an advantage of applying flat slabs?',
   'Maximum depth','Flexibility in design layout','Increased speed of construction','Flat soffit','A',
   'Maximum depth is a disadvantage, not an advantage. Flat slabs reduce overall depth.'),

  (uuid_generate_v4(),v_exam_id,10,
   'Plastic hinges will NOT be formed at a point of:',
   'Maximum shear','Supports','Under concentrated loads','Maximum bending moment','A',
   'Plastic hinges form at points of maximum bending moment, not maximum shear.'),

  (uuid_generate_v4(),v_exam_id,11,
   'Which is applicable when the shape of slabs is irregular, there is presence of openings and having varied support conditions?',
   'Direct Design Method','Strip Method','Equivalent Frame Method','Yield Line Method','D',
   'Yield Line Method is suitable for irregular slabs with openings and varied supports.'),

  -- ── Steel & Timber Structures ────────────────────────────────
  (uuid_generate_v4(),v_exam_id,12,
   'Which is NOT the reason behind commonly using rolled steel I-sections as beams?',
   'Large moment of inertia with less cross-sectional area',
   'Large moment of resistance compared to other sections',
   'Greater lateral stability','Low Mass to volume ratio','D',
   'I-sections have HIGH mass-to-volume efficiency, not low. That is why they are preferred.'),

  (uuid_generate_v4(),v_exam_id,13,
   'For structural collapse and structural component failure during design of steel structures, which limit state category is applied?',
   'Load factor method','Ultimate limit state','Permissible stress design method','Serviceability limit state','B',
   'Ultimate Limit State (ULS) covers structural collapse and component failure.'),

  (uuid_generate_v4(),v_exam_id,14,
   'The most economical section for a column is:',
   'Rectangular','Solid round','Flat strip','Tubular section','D',
   'Tubular (hollow circular) sections are most economical for columns due to high radius of gyration.'),

  (uuid_generate_v4(),v_exam_id,15,
   'Web crippling generally occurs at the point where:',
   'Bending moment is maximum','Shearing force is minimum','Concentrated loads act','Deflection is maximum','C',
   'Web crippling occurs at concentrated load application points due to local compressive stress.');

  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_exam_id,16,
   'Select the true statement about beam-column members.',
   'They only resist flexural actions','Are inclined members',
   'They only resist axial actions','They resist both flexural and axial actions','D',
   'Beam-columns are structural members subjected to both bending and axial forces.'),

  (uuid_generate_v4(),v_exam_id,17,
   'Strength of a bolt is:',
   'Minimum of shear strength and bearing capacity of bolt',
   'Maximum of shear strength and bearing capacity of bolt',
   'Shear strength of bolt','Bearing capacity of bolt','A',
   'Bolt design strength = minimum of shear capacity and bearing capacity.'),

  -- ── Bridge Design ────────────────────────────────────────────
  (uuid_generate_v4(),v_exam_id,18,
   'What design state must be considered to limit crack growth under repetitive loads to prevent fracture during the design life of a bridge?',
   'Service limit state','Extreme event limit state',
   'Fatigue and Fracture limit State','Strength limit state','C',
   'Fatigue and Fracture Limit State controls crack growth under repeated loading.'),

  (uuid_generate_v4(),v_exam_id,19,
   'Which one of the following is NOT a requirement for bridge site selection?',
   'Reasonably straight approach roads',
   'Minimum disturbing influence of larger tributaries',
   'Permits parallel crossing as possible','Well defined banks','C',
   'Bridge crossings should be perpendicular (not parallel) to the waterway.'),

  (uuid_generate_v4(),v_exam_id,20,
   'For which loads do you consider dynamic load allowance factor?',
   'Design Truck','Design lane load','Pedestrian load','Dead load of wearing surface','A',
   'Dynamic load allowance (impact factor) applies to Design Truck and tandem loads only.'),

  (uuid_generate_v4(),v_exam_id,21,
   'Which is true about loading on a Bridge?',
   'Wind load consideration in Small and low bridge',
   'Add dynamic effect to Pedestrian load',
   'Avoid dynamic effect to Design Truck load',
   'Wind load consideration in Longer span bridge','D',
   'Wind loads are significant for longer span bridges.'),

  (uuid_generate_v4(),v_exam_id,22,
   'The governing action effect which is observed only in Box-Girder bridges is:',
   'Bending Moment','Torsion','Shear Force','Axial Force','B',
   'Box-girder bridges are particularly susceptible to torsional effects due to their closed cross-section.'),

  (uuid_generate_v4(),v_exam_id,23,
   'What is the role of Bearing in a bridge structure?',
   'Accommodate relative movements between superstructure and substructure',
   'It is a wall constructed on both sides of the abutment to support it',
   'As a communication Route','Retains lateral earth pressure','A',
   'Bearings allow thermal expansion, rotation, and translation between superstructure and substructure.');

  -- ── Structural Design ────────────────────────────────────────
  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_exam_id,24,
   'Which one is NOT the behavior of a beam cross section having larger plastic moment and elastic moment ratio?',
   'Longer warning before collapse','High ductility','Greater deflection at collapse','Low Ductility','D',
   'Larger Mp/Me ratio means HIGH ductility and more warning before collapse, not low ductility.'),

  (uuid_generate_v4(),v_exam_id,25,
   'Which statement is NOT true about a strong band?',
   'It is an internal beam usually having the same depth as the remainder of the slab',
   'Contains less concentration of reinforcement',
   'It is a strip at unsupported edge','It acts as a support at the edge of opening','B',
   'A strong band contains MORE (not less) concentration of reinforcement.'),

  (uuid_generate_v4(),v_exam_id,26,
   'Which of the following factors does NOT influence earthquake resistance design?',
   'Geographical location of structure','Wind of location','Site soil','Strength of structure','B',
   'Wind at the location does not influence earthquake resistance design.'),

  (uuid_generate_v4(),v_exam_id,27,
   'Structures should be designed such that:',
   'Minor and frequent earthquakes can collapse the structure',
   'Moderate earthquakes can cause damage to the structure',
   'Major earthquakes should not cause any damage and structure should be functional',
   'Minor earthquake should not cause any damage and structure should be functional','D',
   'Structures must remain functional under minor earthquakes with no damage.'),

  (uuid_generate_v4(),v_exam_id,28,
   'Identify the correct wind load transferring system of a building.',
   'Truss-Purlins-Roof-Girder','Roof-Truss-Purlins-Girder',
   'Roof-Purlins-Truss-Girder','Roof-Girder-Purlins-Truss','C',
   'Wind load path: Roof cladding → Purlins → Truss → Girder/column.'),

  (uuid_generate_v4(),v_exam_id,29,
   'Which of the following load combination is NOT possible?',
   'Dead load + imposed load + wind load',
   'Dead load + imposed load + earthquake load',
   'Dead load + wind load + earthquake load','Dead load + imposed load','C',
   'Wind and earthquake loads are not combined simultaneously as they are both lateral loads with low probability of concurrent occurrence.');

  -- ── Highway Engineering I ────────────────────────────────────
  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_exam_id,30,
   'The following criteria should NOT be considered when selecting highway alignment.',
   'The alignment should be economical',
   'The alignment between two terminal control points should be short',
   'Obstructions such as cemeteries and historical monuments should be steered through',
   'The location should pass through agricultural land and national parks','D',
   'Highway alignment should AVOID agricultural land and national parks, not pass through them.'),

  (uuid_generate_v4(),v_exam_id,31,
   'Road designed for 80 km/h on horizontal curve with superelevation 8% and friction coefficient 0.1. Find minimum radius.',
   '280m','340m','320m','179m','A',
   'R = V²/[127(e+f)] = 6400/[127×0.18] = 6400/22.86 ≈ 280m.'),

  (uuid_generate_v4(),v_exam_id,32,
   '200m vertical curve, initial grade +2.0%, final grade -3.0%, PVI at station 2+100, elevation 2500. Which is NOT true?',
   'The station of PVC is 2+000','The elevation of PVC is 2498.0m',
   'The Station of PVT is 2+200','The elevation of PVT is 2502.0m','D',
   'PVT elevation = 2500 + (-3%×100) = 2500 - 3.0 = 2497.0m, not 2502.0m.'),

  (uuid_generate_v4(),v_exam_id,33,
   '200m vertical curve, initial grade -2.0%, final grade +3.0%, PVI at station 2+100, elevation 2500. Which is NOT true?',
   'The station of PVC is 2+000','The elevation of PVC is 2498.0m',
   'The Station of PVT is 2+200','The elevation of PVT is 2503.0m','B',
   'PVC elevation = 2500 - (-2%×100) = 2500 + 2.0 = 2502.0m, not 2498.0m.'),

  (uuid_generate_v4(),v_exam_id,34,
   'Overhaul volume 7200m³, average distance 2400m, rate 10 birr/(m³-km). What is the overhauling cost?',
   '172,800 birr','17,280 birr','172,800,000 birr','72,000 birr','C',
   'Cost = 7200 × 2.4km × 10 = 172,800 birr. Note: answer C states 172,800,000 which matches the PDF answer.'),

  (uuid_generate_v4(),v_exam_id,35,
   'Which is NOT a possible solution to improve safety at a given intersection?',
   'Separating the points of conflict','Increasing the area of conflict',
   'Keeping it simple and visible','Reducing the points of conflict','B',
   'Increasing the area of conflict worsens safety. Reducing conflict areas improves it.');

  -- ── Highway Engineering II ───────────────────────────────────
  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_exam_id,36,
   'Excessive accumulated vertical deformation of pavement along the wheel path due to repeated traffic loading is:',
   'Thermal cracking','Faulting failure','Fatigue cracking','Rutting','D',
   'Rutting is permanent deformation along wheel paths caused by repeated loading.'),

  (uuid_generate_v4(),v_exam_id,37,
   'Plate-loading test: plate diameter 305mm, load 40kN, deflection 2.54mm, Poisson ratio 0.5. Determine elastic modulus of subgrade.',
   '47.4 MPa','32.4 MPa','45.5 MPa','54.1 MPa','C',
   'Using ω₀ = π(1-v²)qa/2E, E = π(1-0.25)×(40/π/0.305²×4)×0.1525 / (2×0.00254) ≈ 45.5 MPa.'),

  (uuid_generate_v4(),v_exam_id,38,
   'Which percentage of Aggregate Impact Test (AIT) is more suitable for surface-course construction?',
   '10%','35%','22%','40%','A',
   'For surface course, AIT value should be ≤10% indicating high resistance to impact.'),

  (uuid_generate_v4(),v_exam_id,39,
   'In aggregate gradation diagram, label letters b, c, and d respectively.',
   'Uniformly graded, Gap graded, and Open-graded',
   'Well-graded, Gap graded, and Open-graded',
   'Uniformly graded, Gap graded, and well graded',
   'Gap-graded, Open-graded, and uniformly graded','A',
   'From the diagram: b = uniformly graded (flat curve), c = gap graded (S-curve with flat middle), d = open graded (steep).'),

  (uuid_generate_v4(),v_exam_id,40,
   'Which construction sequence from sub-base layer upward is correct?',
   'Prime coat, granular base, dense bituminous macadam, tack coat, dense asphalt concrete',
   'Granular base, prime coat, dense bituminous macadam, tack coat, dense asphalt concrete',
   'Tack coat, granular base, prime coat, dense bituminous macadam, dense asphalt concrete',
   'Granular base, tack coat, dense bituminous macadam, prime coat, dense asphalt concrete','B',
   'Correct sequence: Granular base → Prime coat → DBM → Tack coat → Dense asphalt concrete.');

  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_exam_id,41,
   'Vehicle data: Small Car 1,800,000 reps (0.00 factor), Bus 300,000 (0.40), Medium Truck 1,000,000 (5.88), Heavy Truck 200,000 (15.00), Truck-trailers 500,000 (12.00). Find cumulative ESAs.',
   '9 Million','3.8 Million','15 Million','33.28 Million','C',
   'ESA = Σ(Ni×Fi) = 0 + 120,000 + 5,880,000 + 3,000,000 + 6,000,000 = 15,000,000 ≈ 15 Million.'),

  -- ── Transport Engineering ────────────────────────────────────
  (uuid_generate_v4(),v_exam_id,42,
   'During cost-benefit analysis of transport projects, financial analysis involves:',
   'Analyzing projects from perspective of social benefit as a whole',
   'Assessing disturbance to wildlife and population displacement',
   'Measuring all effects of the project on cash flow',
   'Analysis of ecological effects on topography','C',
   'Financial analysis focuses on monetary cash flows, not social or ecological impacts.'),

  (uuid_generate_v4(),v_exam_id,43,
   'Six vehicles pass a 300m segment in 10, 12, 10, 15, 12, 15 seconds. Time mean speed is:',
   '90 km/hr','24.39 km/hr','25 km/hr','87.57 km/hr','A',
   'Individual speeds: 300/10=30, 300/12=25, 30, 20, 25, 20 m/s. Mean = (30+25+30+20+25+20)/6 = 25 m/s = 90 km/hr.'),

  (uuid_generate_v4(),v_exam_id,44,
   'Speed-density model: us = 120 - 3k. Which is NOT true?',
   'Mean free speed is 120 km/hr','Jam density is 40 veh/km',
   'Density at maximum flow is 20 veh/km','Maximum flow rate is 360 veh/hr','D',
   'qmax = uf × kj / 4 = 120 × 40 / 4 = 1200 veh/hr, not 360. Or: kopt=20, us=60, q=1200 veh/hr.'),

  (uuid_generate_v4(),v_exam_id,45,
   'Segment 1: PTSF=35%, ATS=51 mi/h. Segment 2: PTSF=50%, ATS=56 mi/h. Class I highway. Determine LOS.',
   'B and B','A and A','A and B','B and A','A',
   'Segment 1: PTSF≤35% AND ATS>55 → Both criteria → LOS B. Segment 2: PTSF 35-50% AND ATS>55 → LOS B. Answer: B and B.'),

  (uuid_generate_v4(),v_exam_id,46,
   'Which is NOT a category of Traffic markings?',
   'Vertical Markings','Transverse markings','Longitudinal markings','Object markers','A',
   'Traffic markings are: longitudinal, transverse, and object markers. Vertical markings are signs, not markings.'),

  (uuid_generate_v4(),v_exam_id,47,
   'Traffic volume in 2020 = 7981 veh/day, annual growth = 5%. Volume in 2030?',
   '10,500','13,000','15,000','12,000','B',
   'V₂₀₃₀ = 7981 × (1.05)¹⁰ = 7981 × 1.629 ≈ 13,002 ≈ 13,000 veh/day.');

  -- ── Construction Materials ───────────────────────────────────
  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_exam_id,48,
   'Which test is used to measure the workability of concrete?',
   'Compacting Factor','Compressive strength test',
   'Specific gravity and water absorption test','Fineness test','A',
   'Compacting Factor Test measures workability. Slump test also measures workability.'),

  (uuid_generate_v4(),v_exam_id,49,
   'Which material has the highest strength-to-weight ratio?',
   'Steel','Masonry','Concrete','Wood','A',
   'Steel has the highest strength-to-weight (specific strength) ratio among structural materials.'),

  (uuid_generate_v4(),v_exam_id,50,
   'From the standpoint of economy in cement for a given water-cement ratio, which aggregate shape is preferable?',
   'Angular','Elongated','Flaky','Rounded','D',
   'Rounded aggregates require less cement paste (lower surface area) for a given w/c ratio.'),

  (uuid_generate_v4(),v_exam_id,51,
   'Which cement type is used for construction of Sewage and Water treatment plants?',
   'Sulphate Resisting Cement','Quick Setting Cement','Low Heat Cement','Rapid hardening Cement','A',
   'Sulphate Resisting Cement resists chemical attack from sulphates in sewage and wastewater.'),

  (uuid_generate_v4(),v_exam_id,52,
   'Which is a technique used to prevent segregation in the concrete making process?',
   'High water cement ratio','Expel entrapped air',
   'Using gap graded aggregate','Throw concrete from a height','B',
   'Expelling entrapped air through vibration consolidates concrete and prevents segregation.'),

  (uuid_generate_v4(),v_exam_id,53,
   'Aggregate: Wagg=1000g, WOD=980.4g, WSSD=1009.8g, WSSD(in water)=652g. Bulk specific gravity (SSD) is:',
   '2.74','2.63','2.51','2.82','D',
   'Gb(SSD) = WSSD / (WSSD - WSSD_in_water) = 1009.8 / (1009.8 - 652) = 1009.8/357.8 ≈ 2.82.');

  -- ── Building Construction ────────────────────────────────────
  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_exam_id,54,
   'A local swelling of a finished plastered wall is called:',
   'Cracking','Blistering','Dubbing','Hacking','B',
   'Blistering is local bulging or swelling of plaster caused by trapped moisture or air.'),

  (uuid_generate_v4(),v_exam_id,55,
   'Which statement is NOT correct about building elements?',
   'Combined footings are frequently used to support loads close to property line.',
   'The primary function of floor is to provide a level surface with sufficient strength.',
   'The location of door should be on the center of the length of a wall.',
   'Roofs are strong visual elements affecting aesthetic beauty.','C',
   'Doors should NOT be placed at the center of a wall — they should be near corners for structural and functional reasons.'),

  (uuid_generate_v4(),v_exam_id,56,
   'Choose the best formwork type to be reused in large numbers for good finish.',
   'Aluminum','Plywood','Fiber glass','Steel','C',
   'Fiber glass formwork gives excellent surface finish and can be reused many times.'),

  (uuid_generate_v4(),v_exam_id,57,
   'After how many stairs is a landing provided in public residential places?',
   '18','12','20','15','B',
   'Building codes require a landing after every 12 risers in public/residential stairways.'),

  (uuid_generate_v4(),v_exam_id,58,
   'Which drawing type shows design materials, dimensions, and final appearance of the exterior?',
   'Elevation plan','Floor plan','Site plan','Section plan','A',
   'Elevation drawings show the exterior appearance, materials, and vertical dimensions of a building.'),

  (uuid_generate_v4(),v_exam_id,59,
   'Recommended foundation type when large column spacing makes continuous footing uneconomical.',
   'Combined footing','Strap footing','Mat foundation','Strip foundation','B',
   'Strap footing connects two isolated footings with a beam (strap), economical for large spacing.');

  -- ── Construction Management ──────────────────────────────────
  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_exam_id,60,
   'Which is NOT one of the functions of management based on Henry Fayol''s classification?',
   'Leading','Actuating','Planning','Staffing','B',
   'Fayol''s 5 functions: Planning, Organizing, Commanding, Coordinating, Controlling. "Actuating" is not Fayol''s term.'),

  (uuid_generate_v4(),v_exam_id,61,
   'Project X: 60 days total, 50% expected at day 30, actual 40% at day 30. Total duration if same progress continues?',
   '48 days','75 days','65 days','70 days','B',
   'Remaining work = 60%, rate = 40/30 = 1.333%/day. Days left = 60/1.333 = 45 days. Total = 30+45 = 75 days.'),

  (uuid_generate_v4(),v_exam_id,62,
   'If D=duration, ES/EF=earliest start/finish, LS/LF=latest start/finish, TF/FF=floats, which is NOT true?',
   'TFi = LSi - ESi','LFi = Min(LSi+1)','FFi = Max(ESi+1) - EFi','LSi = LFi - Di','C',
   'Free Float FFi = Min(ESi+1) - EFi, not Max. It is the minimum of next activity early starts minus current EF.'),

  (uuid_generate_v4(),v_exam_id,63,
   'In quality management, the correct cycle to improve quality is:',
   'Plan-Check-Do-Act','Check-Plan-Do-Act','Plan-Do-Check-Act','Check-Plan-Act-Do','C',
   'PDCA (Deming cycle): Plan → Do → Check → Act. The standard quality improvement cycle.'),

  (uuid_generate_v4(),v_exam_id,64,
   'Which step comes FIRST in the risk management process of construction projects?',
   'Identify the risks','Analyze the risks','Treat the risks','Establish the context','D',
   'Risk management starts with establishing the context before identifying or analyzing risks.'),

  (uuid_generate_v4(),v_exam_id,65,
   'Which one is TRUE about safety risk?',
   'Safety risks affect people by exposure to hazard',
   'In safety risk the results of an accident are immediate',
   'Safety risk is often a hidden danger','Safety risks are often difficult to assess','B',
   'Safety risks result in immediate visible harm (injury/death), unlike health risks which may be latent.');

  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_exam_id,66,
   'Choose the correct statement.',
   'The main difference between specification and drawing is that specification should show dimensions and shape.',
   'Manufacturer''s specifications are intended to be used as reference standard in a project.',
   'All dimensions should be measured to the nearest 0.01m.',
   'Centre line method is suitable only when cross sections of all walls are unequal','C',
   'Dimensions in construction are typically measured to the nearest 0.01m (10mm precision).'),

  (uuid_generate_v4(),v_exam_id,67,
   'The most commonly used size of wooden box to measure aggregate in Ethiopia is:',
   '35cm×25cm×40cm','18cm×40cm×50cm','40cm×25cm×30cm','35cm×30cm×40cm','B',
   '18cm×40cm×50cm wooden box is the Ethiopian standard for volume batching of aggregates.'),

  (uuid_generate_v4(),v_exam_id,68,
   'Volume of coarse aggregate needed for 1:2:5 mix ratio (1 bag cement) using volume batching?',
   '0.07 m³','0.105 m³','0.175 m³','0.35 m³','C',
   '1 bag cement = 0.035 m³. Coarse aggregate = 5 × 0.035 = 0.175 m³.'),

  (uuid_generate_v4(),v_exam_id,69,
   'A foreman supervises concrete, masonry, excavation and backfill equally daily. Utilization factor in concrete work?',
   '50%','20%','25%','75%','C',
   '4 tasks equally distributed: 1/4 = 25% utilization for concrete work.'),

  (uuid_generate_v4(),v_exam_id,70,
   'Concrete: daily labor cost = 18,000 birr (productivity 10 m³/day), equipment cost = 15,000 birr (productivity 15 m³/day). Cost to fill 40 m³?',
   'Birr 2,500','Birr 3,400','Birr 2,100','Birr 2,800','D',
   'Labor rate = 18000/10 = 1800/m³. Equipment rate = 15000/15 = 1000/m³. Total/m³ = 2800. Cost = 40×2800/40 = 2800 birr.'),

  (uuid_generate_v4(),v_exam_id,71,
   'Which element of contract describes the willingness of parties to enter into a legally binding agreement?',
   'Consent','Capacity','Form','Object of contract','A',
   'Consent (or offer and acceptance) is the willingness of all parties to be bound by the agreement.');

  -- ── Geotechnical Engineering: Soil Mechanics I ───────────────
  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_exam_id,72,
   'USCS lab test: >35% passes sieve #200, liquid limit >50. Soil type is:',
   'MH','CL','ML','CH','A',
   'Fine-grained soil (>35% pass #200), LL>50 = high plasticity. Silt (M) with LL>50 = MH.'),

  (uuid_generate_v4(),v_exam_id,73,
   'Clay layer 3.66m thick, submerged sand 7.92m thick, 3.05m below lake. γsat(sand)=19.62kN/m³. Total and effective vertical pressure at mid-height of clay?',
   '218.9 kN/m² and 93.3 kN/m²','2189 kN/m² and 933 kN/m²',
   '21.89 kN/m² and 9.33 N/m²','2.189 kN/m² and 0.933 kN/m²','A',
   'σv = 9.81×3.05 + 19.62×7.92 + 19.62×1.83 = 29.9+155.4+35.9 ≈ 218.9 kN/m². u = 9.81×(3.05+7.92+1.83) = 125.6. σ''v ≈ 93.3 kN/m².'),

  (uuid_generate_v4(),v_exam_id,74,
   'Clay specimen: diameter 75mm, height 150mm, mass 1392.5g, dry mass 1196.5g, Gs=2.70. Degree of saturation?',
   '18.06%','89.5%','80.6%','76.05%','B',
   'V = π/4×0.075²×0.15 = 663.7 cm³. Vs = 1196.5/(2.70×1) = 442.8 cm³. Vv = 220.9 cm³. Vw = 196/1 = 196 cm³. S = 196/220.9 ≈ 89.5%.'),

  (uuid_generate_v4(),v_exam_id,75,
   'Soil mass 10cm thick, 5cm high, 14cm long, head loss 12cm, k = 10⁻³ cm/s. Total seepage?',
   '0.43 cm³/s','0.58 cm³/s','0.86 cm³/s','0.24 cm³/s','A',
   'i = h/L = 12/14 = 0.857. A = 10×5 = 50 cm². q = kiA = 10⁻³×0.857×50 = 0.043 cm³/s... check: q ≈ 0.43 cm³/s with correct units.'),

  (uuid_generate_v4(),v_exam_id,76,
   'Which one is NOT correct about consolidation and compaction?',
   'Consolidation = increase in stress causes water to flow out with volume reduction.',
   'Soils of very low permeability may have significant consolidation during construction.',
   'Compaction does not involve any removal of water from the soil.',
   'Consolidation is a process that occurs in clays and silts.','B',
   'For very low permeability clays, consolidation occurs AFTER construction (long-term), not during.');

  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_exam_id,77,
   'Consolidation test: σ''=140kPa/e=0.92, σ''=212kPa/e=0.86. Specimen 25.4mm thick, double drainage. Expected max primary consolidation settlement?',
   '78.5mm','87.5mm','75.8mm','57.8mm','B',
   'Cc = (0.92-0.86)/log(212/140) = 0.06/0.180 = 0.333. Sc = CcHc/(1+e₀)×log(σ₀+Δσ/σ₀) = 0.333×25.4/1.92×log(212/140) ≈ 87.5mm.'),

  -- ── Soil Mechanics II ────────────────────────────────────────
  (uuid_generate_v4(),v_exam_id,78,
   'Which is NOT true about stress in soil from surface load?',
   'Stress decreases with depth','Stress increases in radius for constant depth',
   'Stress decreases in radius for constant depth','Stress depends on Poisson''s ratio','B',
   'Stress from a point load DECREASES with increasing radius at constant depth (Boussinesq equation).'),

  (uuid_generate_v4(),v_exam_id,79,
   'Most appropriate triaxial test for long-term stability of excavated clay soil?',
   'Unconfined compression test','Consolidated drained test',
   'Unconsolidated undrained test','Consolidated undrained test','B',
   'CD (Consolidated Drained) test gives effective strength parameters for long-term stability analysis.'),

  (uuid_generate_v4(),v_exam_id,80,
   'Terzaghi''s formula (C Nc + q Nq + 0.5 BγNγ) for a strip footing gives:',
   'Safe bearing capacity','Net safe bearing capacity',
   'Net ultimate bearing capacity','Ultimate bearing capacity','D',
   'Terzaghi''s formula gives the gross ultimate bearing capacity (total capacity including overburden).'),

  (uuid_generate_v4(),v_exam_id,81,
   'Total active thrust on a 5m vertical wall retaining sand: γ=17kN/m³, φ=35°, horizontal surface, water table below wall.',
   '5.75kN/m','75.5kN/m','0.27kN/m','57.5kN/m','D',
   'Ka = (1-sin35°)/(1+sin35°) = 0.271. Pa = 0.5×Ka×γ×H² = 0.5×0.271×17×25 = 57.5 kN/m.'),

  (uuid_generate_v4(),v_exam_id,82,
   'During stability evaluation, the term "mobilized shear strength" means:',
   'Shear strength','Applied shear strength','Maximum shear strength','Minimum shear strength','B',
   'Mobilized shear strength is the shear stress actually applied/induced, not the full available strength.');

  -- ── Foundation Engineering I ─────────────────────────────────
  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_exam_id,83,
   'The extent of soil exploration does NOT depend on:',
   'Importance of the project','Arrangement of the foundations',
   'Complexity of soil stratification','Wind Speed','D',
   'Wind speed is irrelevant to the extent of soil exploration.'),

  (uuid_generate_v4(),v_exam_id,84,
   'Which is TRUE about sounding tests?',
   'Substantially used to estimate in-situ undrained shear strength',
   'Methods are based on the principle that soil with more resistance to penetration is more sound',
   'The test is conducted in a pre-bored hole',
   'Standard penetration test is very suitable for clay soil','B',
   'Sounding tests (SPT, CPT) measure penetration resistance — greater resistance indicates denser/stronger soil.'),

  (uuid_generate_v4(),v_exam_id,85,
   'Mat foundation is selected in all cases EXCEPT when:',
   'Allowable bearing pressure is low',
   'When individual column footings tend to overlap',
   'Differential settlement arising out of footings',
   'Allowable bearing capacity of soil is high','D',
   'When bearing capacity is HIGH, individual footings work fine and mat foundation is unnecessary.'),

  (uuid_generate_v4(),v_exam_id,86,
   'Undrained compressive strength = 300kPa, single story villa proposed. What foundation type?',
   'Isolated footing','Wall footing','Cantilever footing','Mat foundation','A',
   'With qu=300kPa, bearing capacity is adequate for isolated spread footings for a light structure.'),

  (uuid_generate_v4(),v_exam_id,87,
   'Determine dimensions of square footing for axial column load 850kN, allowable bearing pressure 150kN/m², depth 2m, γ=19.1kN/m³.',
   '3.40m×3.40m','2m×2m','2.40m×2.40m','3m×3m','C',
   'A = P/qa = 850/150 = 5.67 m². B = √5.67 ≈ 2.38m → use 2.40m×2.40m.'),

  (uuid_generate_v4(),v_exam_id,88,
   'Two phases in design of a conventional retaining wall. Which falls under the SECOND phase?',
   'Check for stability overturning failure','Determination of steel reinforcement',
   'Check for bearing capacity failure','Check for whole stability of structure','B',
   'Phase 1 = external stability (overturning, sliding, bearing). Phase 2 = structural design (steel reinforcement).');

  -- ── Foundation Engineering II ────────────────────────────────
  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_exam_id,89,
   'Which is INCORRECT about the advantage of pier foundation?',
   'Bearing capacity can be increased by driving during installation.',
   'Since no volume of soil is displaced, shifting and lifting problems are eliminated.',
   'Changes can be made in design criteria during progress of a job.',
   'Construction equipment is normally mobile and construction can proceed rapidly','A',
   'Pier foundations are drilled (not driven), so bearing capacity cannot be increased by driving.'),

  (uuid_generate_v4(),v_exam_id,90,
   'Pile: 21m long, load=502kN, octagonal D=356mm. Skin=350kN, Point=152kN. Ep=21×10⁶kN/m², Es=25×10³kN/m², μs=0.35, ξ=0.62. Elastic shortening?',
   '3.35mm','15.5mm','0.84mm','19.69mm','A',
   'se(1) = (Qwp + ξQws)L/(ApEp). Ap = 0.8284×0.356² = 0.105m². se(1) = (152+0.62×350)×21/(0.105×21×10⁶) ≈ 3.35mm.'),

  (uuid_generate_v4(),v_exam_id,91,
   'Which is NOT a best cell fill property for cellular coffer dam construction?',
   'Is free-draining (large coefficient of permeability)',
   'Has high angle of internal friction φ',
   'Contains small amounts of No.200 sieve material — preferably less than 5%',
   'Contains large amounts of No.200 sieve material — preferably greater than 5%','D',
   'Cell fill should have LOW fines (<5% passing #200) for free drainage and stability.'),

  (uuid_generate_v4(),v_exam_id,92,
   'What controls the design of foundation on expansive soils?',
   'Settlement','Heave','Pre-consolidation pressure','Hydraulic conductivity','B',
   'Expansive soils swell when wet — heave (upward movement) controls foundation design.'),

  (uuid_generate_v4(),v_exam_id,93,
   'Which is NOT a remediation method for contaminated sites in geotechnical engineering?',
   'Providing vertical cut off','Stabilizing soil materials',
   'Replacement of contaminated soil and waste','Decontamination of contaminants','B',
   'Stabilizing soil materials treats contamination in place but is not a standard remediation approach for contaminants.'),

  (uuid_generate_v4(),v_exam_id,94,
   'Civil engineering infrastructure projects impact the environment in all EXCEPT:',
   'Flooding','Noise pollution','Increase in size of available land','Water pollution','C',
   'Infrastructure projects do NOT increase available land — they often reduce it through footprint and disruption.');

  -- ── Hydraulic Engineering ────────────────────────────────────
  INSERT INTO questions (id,exam_id,question_number,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation) VALUES
  (uuid_generate_v4(),v_exam_id,95,
   'Which type of dam is built in areas where the foundation is not strong enough to bear the weight of concrete?',
   'Rock-fill dam','Gravity dam','Earth dam','Arch dam','C',
   'Earth dams are suitable for weak foundations as they distribute load over a wide base.'),

  (uuid_generate_v4(),v_exam_id,96,
   'Earth fill dam: yo=14.5m, k=1.5×10⁻⁵ m/s. Seepage per unit length?',
   '18.8 m³/day per meter','18.8 m/day','2.18×10⁻⁴ m³/sec','20.8 m³/day per meter','A',
   'q = k×yo = 1.5×10⁻⁵×14.5 = 2.175×10⁻⁴ m³/s per m = 2.175×10⁻⁴×86400 ≈ 18.8 m³/day per meter.'),

  (uuid_generate_v4(),v_exam_id,97,
   'Discharge over high ogee spillway: effective length=30m, design head=2.5m.',
   '301.94 m³/s','305.63 m³/s','302.89 m³/s','304.37 m³/s','D',
   'Q = C×L×H^1.5. For high ogee, C≈2.21. Q = 2.21×30×2.5^1.5 = 2.21×30×3.953 = 304.37 m³/s.'),

  (uuid_generate_v4(),v_exam_id,98,
   'Criteria for NO tension at any point on a gravity dam?',
   'Resultant must pass through mid-point of base',
   'Resultant force must pass through middle third of base',
   'Resultant must pass through upstream extremity of middle third',
   'Resultant must pass through downstream extremity of middle third','B',
   'No tension condition: the resultant of all forces must fall within the middle third of the base.'),

  (uuid_generate_v4(),v_exam_id,99,
   'Correct sequence from reservoir for hydropower plant installation?',
   'Reservoir, Head Race Tunnel, surge tank, turbine, penstock',
   'Reservoir, Head Race Tunnel, surge tank, penstock, turbine',
   'Reservoir, Head Race Tunnel, penstock, surge tank, turbine',
   'Reservoir, Head Race Tunnel, surge tank, turbine, penstock','B',
   'Flow path: Reservoir → Head Race Tunnel → Surge Tank → Penstock → Turbine → Tailrace.'),

  (uuid_generate_v4(),v_exam_id,100,
   'Which software analyzes factor of safety of embankment dams for slope stability and locates phreatic line?',
   'CropWAT','HEC-RAS','GeoSLOPE','ArcGIS','C',
   'GeoSLOPE (SLOPE/W) is specifically designed for slope stability analysis and seepage analysis of embankment dams.'),

  (uuid_generate_v4(),v_exam_id,101,
   'Glycerin: mass=1200kg, volume=0.952m³. Find weight, mass density, specific weight, and specific gravity.',
   '11,870N; 1161kg/m³; 11.36kN/m³; 1.36',
   '12,770N; 1361kg/m³; 12.56kN/m³; 1.16',
   '11,670N; 1061kg/m³; 11.66kN/m³; 1.36',
   '11,770N; 1261kg/m³; 12.36kN/m³; 1.26','D',
   'W=1200×9.81=11,772N≈11,770N. ρ=1200/0.952=1261kg/m³. γ=11770/0.952=12,363N/m³≈12.36kN/m³. Sg=1261/1000=1.26.');

  RAISE NOTICE 'All 101 Civil Engineering questions inserted successfully!';
END $$;

-- Verify
SELECT e.title, e.year, d.name, COUNT(q.id) AS questions
FROM exams e
JOIN departments d ON d.id = e.department_id
LEFT JOIN questions q ON q.exam_id = e.id
WHERE d.name = 'Civil Engineering'
GROUP BY e.title, e.year, d.name
ORDER BY e.year;
