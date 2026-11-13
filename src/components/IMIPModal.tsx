import React, { useRef, useState, useEffect } from 'react';
import {
  Printer,
  X,
  Download,
  Loader2,
  CheckCircle2,
  Maximize2,
  Minimize2,
  FileText,
  Edit3,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import type { Learner, GradeData } from '../types';
import { computeLearnerStats } from '../services/googleSheets';
import { exportElementToA4PDF } from '../utils/pdfExport';

interface IMIPModalProps {
  learner: Learner;
  gradeData: GradeData;
  onClose: () => void;
  autoDownload?: boolean;
}

interface DomainPlan {
  identifiedGaps: string;
  targetSkills: string;
  tutorNotes: string;
}

export const IMIPModal: React.FC<IMIPModalProps> = ({
  learner,
  gradeData,
  onClose
}) => {
  const stats = computeLearnerStats(learner, gradeData);
  const printableRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isFullSize, setIsFullSize] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showScoresReference, setShowScoresReference] = useState(false);

  const cleanLearnerName = learner.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const pdfFileName = `IMIP_${cleanLearnerName}_Grade_${gradeData.grade}_A4_Landscape.pdf`;

  // Generate domain-specific intervention details accurately calibrated per Grade Level (Grades 1 to 6)
  const generateDefaultPlan = (): Record<string, DomainPlan> => {
    const pct = stats.percentage;
    const isNeedsIntervention = pct < 75;
    const isProgressing = pct >= 75 && pct < 90;
    const grade = gradeData.grade;

    // Grade-level specific curriculum definitions for DepEd Elementary Mathematics
    if (grade === '1') {
      if (isNeedsIntervention) {
        return {
          'Number and Algebra': {
            identifiedGaps:
              learner.remarks ||
              'Difficulty in recognizing numbers up to 100, place value (tens and ones), and basic single-digit addition/subtraction facts within 20.',
            targetSkills:
              'Counting and writing numbers to 100, composing/decomposing numbers into tens and ones, basic fact fluency without fingers, repeating patterns.',
            tutorNotes:
              `Administered ${stats.completedCount} worksheets (${stats.totalScore}/${stats.totalItems} pts, ${pct.toFixed(1)}%). Use ten-frames, counters, and number cards. Next session: Composing tens and ones.`
          },
          'Measurement and Geometry': {
            identifiedGaps:
              'Struggles to compare lengths using non-standard units (paper clips, hand spans); difficulty distinguishing between square and rectangle.',
            targetSkills:
              'Comparing length (longer/shorter), mass (heavier/lighter), recognizing 2D shapes (circle, triangle, square, rectangle), telling time to the hour.',
            tutorNotes:
              'Engage in physical sorting of shape cutouts and comparing classroom objects directly. Next session: Reading analogue clock on the hour.'
          },
          'Data and Probability': {
            identifiedGaps:
              'Challenges in sorting classroom objects by color/shape and counting items represented in simple non-scaled pictographs.',
            targetSkills:
              'Organizing concrete objects into tally charts and reading pictographs with 1-to-1 item correspondence.',
            tutorNotes:
              'Hands-on counting of colored tokens and making concrete pictographs. Next session: Answering "which has more/less" from pictographs.'
          }
        };
      } else if (isProgressing) {
        return {
          'Number and Algebra': {
            identifiedGaps:
              learner.remarks ||
              'Occasional hesitation when solving 1-step word problems involving subtraction within 20 and identifying missing terms in patterns.',
            targetSkills:
              'Fluent addition and subtraction within 50, translating verbal situations into number sentences, continuing 2-attribute patterns.',
            tutorNotes:
              `Satisfactory performance (${pct.toFixed(1)}%). Reinforce mental math strategies like "making ten" and "doubles plus one". Next session: 1-step addition word problems.`
          },
          'Measurement and Geometry': {
            identifiedGaps:
              'Needs reinforcement when reading half-hour time on analogue clocks and ordering three objects by length.',
            targetSkills:
              'Reading time to the half-hour (e.g., 2:30), comparing lengths of 3 objects from shortest to longest, identifying 2D shape sides and corners.',
            tutorNotes:
              'Practice with manipulative mini-clocks. Next session: Telling time to half-hour.'
          },
          'Data and Probability': {
            identifiedGaps:
              'Needs guidance in summarizing table data and determining basic likelihood (more likely vs. less likely).',
            targetSkills:
              'Constructing simple pictographs from tally charts and describing outcomes using "more likely" or "less likely".',
            tutorNotes:
              'Interactive classroom poll (favorite fruit/color) converted into tally tables. Next session: Making learner-led pictographs.'
          }
        };
      } else {
        return {
          'Number and Algebra': {
            identifiedGaps:
              'Demonstrates solid mastery of Grade 1 number concepts. Ready for 2-digit addition with regrouping exploration.',
            targetSkills:
              'Mental addition/subtraction within 100, solving non-routine arithmetic puzzles, peer buddy mentoring.',
            tutorNotes:
              `High mastery rating (${pct.toFixed(1)}%). Provide advanced pattern challenges and 2-step word problems. Role: ARAL Peer Buddy.`
          },
          'Measurement and Geometry': {
            identifiedGaps:
              'Shows clear understanding of Grade 1 measurement. Ready for standard metric unit introduction (centimeters).',
            targetSkills:
              'Estimating lengths, creating composite figures from 2D shapes, reading analogue clock to the hour and half-hour.',
            tutorNotes:
              'Encourage creative tangram puzzle designs and practical time-telling activities.'
          },
          'Data and Probability': {
            identifiedGaps:
              'Accurate in reading pictographs. Ready for reading simple vertical bar representations.',
            targetSkills:
              'Formulating questions from given pictographs and independently recording survey data.',
            tutorNotes:
              'Lead learner in compiling class attendance charts and summarizing data findings.'
          }
        };
      }
    }

    if (grade === '2') {
      if (isNeedsIntervention) {
        return {
          'Number and Algebra': {
            identifiedGaps:
              learner.remarks ||
              'Difficulty with 3-digit place value (hundreds, tens, ones), addition/subtraction with regrouping, and skip counting by 2s, 5s, 10s.',
            targetSkills:
              'Mastery of adding/subtracting 2- to 3-digit numbers with regrouping, writing numbers in expanded form, skip counting as repeated addition.',
            tutorNotes:
              `Score: ${stats.totalScore}/${stats.totalItems} (${pct.toFixed(1)}%). Use base-10 flats, rods, and units for regrouping. Next session: Subtraction with regrouping across tens.`
          },
          'Measurement and Geometry': {
            identifiedGaps:
              'Confusion in reading analogue clocks to 5-minute intervals and measuring lengths accurately using a ruler in centimeters.',
            targetSkills:
              'Reading clock to 5 minutes, measuring in meters (m) and centimeters (cm), identifying vertices and edges of 3D solids (cube, prism, sphere).',
            tutorNotes:
              'Practice ruler alignment from 0 cm mark. Next session: Telling time in 5-minute increments.'
          },
          'Data and Probability': {
            identifiedGaps:
              'Difficulty understanding pictographs where 1 symbol represents 2 or more units (scaled pictographs).',
            targetSkills:
              'Interpreting scaled pictographs (scales of 2, 5, 10), reading simple horizontal and vertical bar graphs.',
            tutorNotes:
              'Highlight the legend/key on every pictograph before answering questions. Next session: Scaled pictographs.'
          }
        };
      } else if (isProgressing) {
        return {
          'Number and Algebra': {
            identifiedGaps:
              learner.remarks ||
              'Occasional errors in 3-digit subtraction with zero in the tens place; emerging understanding of basic multiplication arrays.',
            targetSkills:
              'Fluency in 3-digit regrouping, basic multiplication facts for 2, 3, 4, 5, and 10, division as sharing equally.',
            tutorNotes:
              `Progressing (${pct.toFixed(1)}%). Emphasize array models for multiplication facts. Next session: Word problems involving 2, 3, 5, 10 times tables.`
          },
          'Measurement and Geometry': {
            identifiedGaps:
              'Inconsistent conversion between meters and centimeters; needs practice determining mass in grams and kilograms.',
            targetSkills:
              'Converting m to cm and vice versa, comparing mass using balance scales, identifying flat and curved surfaces of 3D solids.',
            tutorNotes:
              'Hands-on weighing of classroom objects. Next session: Meter to centimeter conversions.'
          },
          'Data and Probability': {
            identifiedGaps:
              'Needs practice in answering 2-step comparative questions from bar graph data.',
            targetSkills:
              'Constructing simple bar graphs and finding "how many more/less" between categories.',
            tutorNotes:
              'Guide comparison subtraction using bar graph heights. Next session: 2-step bar graph questions.'
          }
        };
      } else {
        return {
          'Number and Algebra': {
            identifiedGaps:
              'Mastered Grade 2 arithmetic. Ready for multi-digit multiplication and 2-step routine word problems.',
            targetSkills:
              'Fluency in multiplication tables up to 10, solving multi-step word problems involving money and operations.',
            tutorNotes:
              `Mastery (${pct.toFixed(1)}%). Assign mental math speed drills and introductory fraction concepts (halves, thirds, fourths).`
          },
          'Measurement and Geometry': {
            identifiedGaps:
              'Exhibits full understanding of 2D/3D shapes and metric measurement. Ready for introductory perimeter concepts.',
            targetSkills:
              'Estimating and measuring mass and capacity, exploring perimeter of simple shapes using toothpicks/rulers.',
            tutorNotes:
              'Introduce perimeter as distance around flat shapes.'
          },
          'Data and Probability': {
            identifiedGaps:
              'Accurately reads scaled pictographs and bar graphs. Ready for creating learner-designed survey charts.',
            targetSkills:
              'Formulating questions, collecting data, choosing appropriate scales (2, 5, 10), and drawing bar graphs.',
            tutorNotes:
              'Learner leads small group data collection activity.'
          }
        };
      }
    }

    if (grade === '3') {
      if (isNeedsIntervention) {
        return {
          'Number and Algebra': {
            identifiedGaps:
              learner.remarks ||
              'Difficulty with 4-digit addition/subtraction, multiplication tables (6 to 9), and long division with remainders.',
            targetSkills:
              'Adding/subtracting numbers up to 10,000 with regrouping, multiplication facts (1-10), dividing 2-digit by 1-digit numbers, identifying proper fractions.',
            tutorNotes:
              `Administered ${stats.completedCount} worksheets (${pct.toFixed(1)}%). Use array cards and times-table charts. Next session: Multiplication tables 6, 7, 8, 9.`
          },
          'Measurement and Geometry': {
            identifiedGaps:
              'Confusion in computing perimeter of polygons and finding area using square centimeter grid units.',
            targetSkills:
              'Calculating perimeter of triangles, squares, and rectangles; finding area of plane figures by counting square units; line symmetry.',
            tutorNotes:
              'Grid paper exercises to clearly separate perimeter (border) from area (surface). Next session: Area of rectangles using square units.'
          },
          'Data and Probability': {
            identifiedGaps:
              'Struggles with interpreting vertical/horizontal bar graphs with intervals greater than 5.',
            targetSkills:
              'Reading, interpreting, and constructing single bar graphs; predicting outcomes of simple random events (coin toss).',
            tutorNotes:
              'Practice reading intermediate axis markings between numbered intervals. Next session: Bar graph interpretation.'
          }
        };
      } else if (isProgressing) {
        return {
          'Number and Algebra': {
            identifiedGaps:
              learner.remarks ||
              'Occasional slips in dividing 3-digit numbers with zero in the quotient; comparing dissimilar fractions.',
            targetSkills:
              'Multiplication of 2- to 3-digit by 1-digit numbers, division with and without remainders, equivalent fractions using models.',
            tutorNotes:
              `Progressing well (${pct.toFixed(1)}%). Reinforce long division algorithm steps: Divide, Multiply, Subtract, Bring down. Next session: Division with remainders.`
          },
          'Measurement and Geometry': {
            identifiedGaps:
              'Needs reinforcement when converting between liters and milliliters, and applying perimeter formulas.',
            targetSkills:
              'Applying perimeter formulas for rectangles ($2l + 2w$) and squares ($4s$); unit conversion (L to mL, kg to g).',
            tutorNotes:
              'Real-life measuring cups and perimeter string demonstrations. Next session: Perimeter formula applications.'
          },
          'Data and Probability': {
            identifiedGaps:
              'Needs practice in solving 2-step word problems based on bar graph data.',
            targetSkills:
              'Organizing data into frequency tables, drawing scaled bar graphs, identifying equally likely outcomes.',
            tutorNotes:
              'Coin and dice experiments recording trials into tables. Next session: Simple probability tally charts.'
          }
        };
      } else {
        return {
          'Number and Algebra': {
            identifiedGaps:
              'Mastered Grade 3 operations. Ready for Grade 4 factors, multiples, and operations on dissimilar fractions.',
            targetSkills:
              'Solving non-routine multi-step word problems involving all four operations; finding equivalent fractions.',
            tutorNotes:
              `High achievement (${pct.toFixed(1)}%). Assign enrichment word problems and fractions on a number line.`
          },
          'Measurement and Geometry': {
            identifiedGaps:
              'Clear grasp of perimeter and grid area. Ready for area formula derivation ($A = l \\times w$).',
            targetSkills:
              'Deriving and applying area formulas for rectangles and squares; exploring line and rotational symmetry.',
            tutorNotes:
              'Area and perimeter floor tiling challenges.'
          },
          'Data and Probability': {
            identifiedGaps:
              'Proficient in graph analysis. Ready for double bar graph interpretation.',
            targetSkills:
              'Formulating survey hypotheses, compiling two-category tables, and predicting probability ratios.',
            tutorNotes:
              'Guide learner in preparing class attendance and score trend analysis.'
          }
        };
      }
    }

    if (grade === '4') {
      if (isNeedsIntervention) {
        return {
          'Number and Algebra': {
            identifiedGaps:
              learner.remarks ||
              'Difficulty with long multiplication (2-digit by 2-digit), long division with 2-digit divisors, finding GCF/LCM, and adding dissimilar fractions.',
            targetSkills:
              'Multiplication and division of multi-digit whole numbers, prime factorization, GCF/LCM using continuous division, adding/subtracting similar fractions.',
            tutorNotes:
              `Score: ${stats.totalScore}/${stats.totalItems} (${pct.toFixed(1)}%). Step-by-step ladder/continuous division practice for GCF/LCM. Next session: Adding dissimilar fractions.`
          },
          'Measurement and Geometry': {
            identifiedGaps:
              'Confusion in measuring and drawing angles using a protractor; finding area of triangles and parallelograms.',
            targetSkills:
              'Classifying angles (acute, right, obtuse), measuring angles with a protractor, calculating perimeter of polygons and area of triangles ($A = \\frac{1}{2}bh$).',
            tutorNotes:
              'Hands-on protractor practice aligning vertex and base line. Next session: Area of triangles.'
          },
          'Data and Probability': {
            identifiedGaps:
              'Difficulty interpreting double bar graphs and determining simple experimental probability.',
            targetSkills:
              'Reading and constructing double vertical/horizontal bar graphs, listing outcomes of simple experiments.',
            tutorNotes:
              'Color-code bars when comparing two sets of data. Next session: Double bar graph comparative questions.'
          }
        };
      } else if (isProgressing) {
        return {
          'Number and Algebra': {
            identifiedGaps:
              learner.remarks ||
              'Occasional mistakes when simplifying improper fractions to mixed numbers and rounding decimals to tenths/hundredths.',
            targetSkills:
              'Adding and subtracting dissimilar fractions and mixed forms, place value and rounding of decimals through hundredths.',
            tutorNotes:
              `Progressing (${pct.toFixed(1)}%). Emphasize finding the Least Common Denominator (LCD). Next session: Dissimilar fraction subtraction.`
          },
          'Measurement and Geometry': {
            identifiedGaps:
              'Needs practice in solving word problems involving perimeter of complex polygons and area of parallelograms.',
            targetSkills:
              'Solving routine and non-routine area problems for triangles and quadrilaterals, identifying parallel and perpendicular lines.',
            tutorNotes:
              'Draw and label heights and bases clearly in geometric figures. Next session: Parallelogram area word problems.'
          },
          'Data and Probability': {
            identifiedGaps:
              'Needs practice in predicting outcomes based on experimental probability results.',
            targetSkills:
              'Constructing double bar graphs from real-world data; expressing probability using terms from impossible to certain.',
            tutorNotes:
              'Conduct spinner simulations and compare predicted vs. actual tallies. Next session: Probability scale analysis.'
          }
        };
      } else {
        return {
          'Number and Algebra': {
            identifiedGaps:
              'Mastered Grade 4 fractions and whole numbers. Ready for Grade 5 Order of Operations (PEMDAS) and decimals.',
            targetSkills:
              'Multiplying fractions by whole numbers, solving complex fraction word problems, comparing decimals.',
            tutorNotes:
              `Mastery tier (${pct.toFixed(1)}%). Provide challenging math olympiad fraction and decimal puzzle tasks.`
          },
          'Measurement and Geometry': {
            identifiedGaps:
              'Strong geometric reasoning. Ready for volume of rectangular prisms and surface area exploration.',
            targetSkills:
              'Calculating area of composite figures composed of triangles and rectangles; classifying quadrilaterals (trapezoids, rhombi).',
            tutorNotes:
              'Composite figure perimeter and area challenges.'
          },
          'Data and Probability': {
            identifiedGaps:
              'Accurate in reading double bar graphs. Ready for line graph interpretation.',
            targetSkills:
              'Analyzing double bar graphs and inferring cause-and-effect relationships from data.',
            tutorNotes:
              'Learner leads school attendance and quarterly achievement graph presentation.'
          }
        };
      }
    }

    if (grade === '5') {
      if (isNeedsIntervention) {
        return {
          'Number and Algebra': {
            identifiedGaps:
              learner.remarks ||
              'Struggles with divisibility rules (2, 3, 4, 5, 6, 8, 9, 10, 11, 12), Order of Operations (PEMDAS/GEMDAS), and multiplying/dividing fractions and decimals.',
            targetSkills:
              'Applying divisibility rules, evaluating expressions with parentheses using GEMDAS, multiplying fractions by fractions and mixed numbers.',
            tutorNotes:
              `Current performance: ${pct.toFixed(1)}%. Use GEMDAS checklist cards (Grouping, Exponents, Multiply/Divide, Add/Subtract). Next session: GEMDAS with brackets.`
          },
          'Measurement and Geometry': {
            identifiedGaps:
              'Difficulty calculating circumference and area of circles; finding volume of rectangular prisms ($V = l \\times w \\times h$).',
            targetSkills:
              'Applying circle formulas ($C = 2\\pi r$, $A = \\pi r^2$ using $\\pi \\approx 3.14$), computing volume of rectangular prisms in cubic units ($cm^3, m^3$).',
            tutorNotes:
              'Demonstrate circle formulas with circular lids and string. Next session: Rectangular prism volume word problems.'
          },
          'Data and Probability': {
            identifiedGaps:
              'Challenges in reading line graphs showing change over time and interpreting circle graphs (pie charts).',
            targetSkills:
              'Reading and constructing single/double line graphs, calculating simple experimental probability as a fraction.',
            tutorNotes:
              'Trace coordinate points along time axes. Next session: Interpreting line graph trend lines.'
          }
        };
      } else if (isProgressing) {
        return {
          'Number and Algebra': {
            identifiedGaps:
              learner.remarks ||
              'Occasional errors in multi-step word problems involving ratios and proportions; dividing decimals by decimals.',
            targetSkills:
              'Solving direct and partitive proportion problems, multiplying and dividing decimals up to 2 decimal places, percentage concepts.',
            tutorNotes:
              `Progressing (${pct.toFixed(1)}%). Use bar models for ratio and proportion problems. Next session: Direct proportion word problems.`
          },
          'Measurement and Geometry': {
            identifiedGaps:
              'Needs practice in solving word problems involving area of circles and converting cubic centimeters to cubic meters.',
            targetSkills:
              'Solving real-world problems on circle area and volume of prisms, temperature reading and conversion in Celsius.',
            tutorNotes:
              'Emphasize radius vs. diameter distinction ($r = d/2$). Next session: Circle area word problems.'
          },
          'Data and Probability': {
            identifiedGaps:
              'Needs reinforcement when comparing experimental probability with theoretical expectations.',
            targetSkills:
              'Constructing line graphs from time-series data, calculating probability of simple events as fractions and percentages.',
            tutorNotes:
              'Coin toss and dice simulations tracking cumulative results. Next session: Probability fraction representation.'
          }
        };
      } else {
        return {
          'Number and Algebra': {
            identifiedGaps:
              'Solid mastery of Grade 5 arithmetic. Ready for Grade 6 integers and algebraic equations.',
            targetSkills:
              'Solving non-routine proportion, percent, and GEMDAS problems; simplifying complex expressions.',
            tutorNotes:
              `Mastery (${pct.toFixed(1)}%). Assign advanced problem solving involving speed, distance, time, and financial literacy.`
          },
          'Measurement and Geometry': {
            identifiedGaps:
              'Accurate in circle and volume calculations. Ready for surface area of 3D solids and cylinders.',
            targetSkills:
              'Calculating surface area of prisms and cylinders; solving composite volume challenges.',
            tutorNotes:
              'Design 3D packaging boxes maximizing volume.'
          },
          'Data and Probability': {
            identifiedGaps:
              'Proficient in line graph and pie graph analysis. Ready for statistical mean and trend prediction.',
            targetSkills:
              'Analyzing complex double line graphs, computing experimental probability from large sample sets.',
            tutorNotes:
              'Lead school energy/attendance tracking project with line graph reports.'
          }
        };
      }
    }

    // Default Grade 6
    if (isNeedsIntervention) {
      return {
        'Number and Algebra': {
          identifiedGaps:
            learner.remarks ||
            'Difficulty with integer operations (positive and negative numbers), percentage problems (finding Percentage, Rate, Base), and solving proportions.',
          targetSkills:
            'Adding, subtracting, multiplying, and dividing integers; solving percentage, rate, and base problems; writing basic algebraic expressions.',
          tutorNotes:
            `Administered ${stats.completedCount} worksheets (${pct.toFixed(1)}%). Use integer number lines with directional counters and the P-R-B triangle formula wheel. Next session: Integer subtraction and percentage rate problems.`
        },
        'Measurement and Geometry': {
          identifiedGaps:
            'Confusion in computing surface area of solid figures (cylinder, cone, pyramid, sphere) and volume of cylinders ($V = \\pi r^2 h$).',
          targetSkills:
            'Calculating surface area of prisms, cylinders, and pyramids; finding volume of cylinders, cones, and spheres; spatial visualization of 3D nets.',
          tutorNotes:
            'Unfold 3D nets on paper to calculate the sum of all face areas. Next session: Surface area of cylinders.'
        },
        'Data and Probability': {
          identifiedGaps:
            'Struggles in reading pie graphs with percentage sectors and calculating theoretical probability using sample spaces.',
          targetSkills:
            'Constructing and interpreting pie graphs; determining outcomes using tree diagrams; calculating theoretical probability ($P(E) = n(E)/n(S)$).',
          tutorNotes:
            'Calculate slice values from total quantity ($Quantity = Percent \\times Total$). Next session: Tree diagrams for probability.'
        }
      };
    } else if (isProgressing) {
      return {
        'Number and Algebra': {
          identifiedGaps:
            learner.remarks ||
            'Occasional slips in multi-step word problems involving discount, sales tax, commission, and combined integer operations.',
          targetSkills:
            'Fluency in GEMDAS with integers, solving practical financial math problems (discounts, interest, markups), solving 1-step linear equations.',
          tutorNotes:
            `Progressing well (${pct.toFixed(1)}%). Reinforce real-world shopping and banking scenarios. Next session: Discount and interest calculation.`
        },
        'Measurement and Geometry': {
          identifiedGaps:
            'Needs practice in calculating volume of cones, pyramids, and spheres and distinguishing surface area from volume.',
          targetSkills:
            'Applying volume formulas for pyramids and cones ($V = \\frac{1}{3}Bh$), surface area of composite solids, reading water and electric meters.',
          tutorNotes:
            'Emphasize the one-third relationship between cylinder and cone volume. Next session: Pyramid volume word problems.'
        },
        'Data and Probability': {
          identifiedGaps:
            'Needs reinforcement in calculating theoretical probability for compound events (e.g. tossing two coins or rolling two dice).',
          targetSkills:
            'Listing systematic sample spaces using tables and tree diagrams; finding probability of compound events.',
            tutorNotes:
              'Tabulate 36 outcomes of rolling two dice. Next session: Compound event probability.'
        }
      };
    } else {
      return {
        'Number and Algebra': {
          identifiedGaps:
            'Mastered Grade 6 curriculum. Ready for Grade 7 Junior High School algebra and rational numbers.',
          targetSkills:
            'Solving multi-step algebraic equations, non-routine math olympiad challenges, financial interest modeling.',
          tutorNotes:
            `High mastery (${pct.toFixed(1)}%). Provide advanced high-school preparatory algebra problems. Role: Grade 6 ARAL Lead Peer Tutor.`
        },
        'Measurement and Geometry': {
          identifiedGaps:
            'Exhibits full competency in solid geometry. Ready for coordinate geometry and angle theorems.',
          targetSkills:
            'Solving complex surface area and volume problems for composite architectural models; spatial transformation.',
          tutorNotes:
            'Architecture and engineering packaging design challenge.'
        },
        'Data and Probability': {
          identifiedGaps:
            'Accurate in all statistical representations and probability calculations. Ready for standard deviation and mean/median/mode analysis.',
          targetSkills:
            'Analyzing statistical distributions, comparing theoretical vs. experimental outcomes over 100+ trials.',
          tutorNotes:
            'Learner leads school-wide ARAL Math data synthesis and graphical summary presentation.'
        }
      };
    }
  };

  const [domainPlans, setDomainPlans] = useState<Record<string, DomainPlan>>(generateDefaultPlan);

  // Update plan field helper
  const handleUpdatePlan = (domain: string, field: keyof DomainPlan, value: string) => {
    setDomainPlans(prev => ({
      ...prev,
      [domain]: {
        ...prev[domain],
        [field]: value
      }
    }));
  };

  // Reset to auto-generated plan
  const handleResetPlan = () => {
    setDomainPlans(generateDefaultPlan());
  };

  // Download PDF file handler
  const handleDownloadPDF = async () => {
    if (!printableRef.current || isGeneratingPDF) return;
    try {
      setIsGeneratingPDF(true);
      await exportElementToA4PDF(printableRef.current, pdfFileName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Browser Print handler
  const handlePrint = () => {
    window.print();
  };

  const domains = ['Number and Algebra', 'Measurement and Geometry', 'Data and Probability'];

  const getDescriptorBadgeClass = (status: string) => {
    switch (status) {
      case 'Highly Proficient':
        return 'bg-emerald-100 text-emerald-900 border-emerald-500';
      case 'Proficient':
        return 'bg-sky-100 text-sky-900 border-sky-500';
      case 'Nearly Proficient':
        return 'bg-amber-100 text-amber-900 border-amber-500';
      case 'Low Proficient':
        return 'bg-orange-100 text-orange-900 border-orange-500';
      case 'Not Proficient':
        return 'bg-rose-100 text-rose-900 border-rose-500';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-400';
    }
  };

  return (
    <div className="imip-modal-backdrop fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 flex flex-col items-center justify-start p-0 sm:p-3 backdrop-blur-xs">
      <div
        className={`relative w-full bg-slate-100 ${
          isFullSize ? 'max-w-[98vw] min-h-screen' : 'max-w-6xl my-2 rounded-2xl'
        } shadow-2xl border border-slate-300 flex flex-col print-container transition-all`}
      >
        {/* Sticky Modal Top Bar (Always in view while scrolling, hidden in print) */}
        <div className="sticky top-0 z-40 bg-gradient-to-r from-sky-700 via-sky-600 to-emerald-700 px-4 py-2.5 text-white shadow-md flex flex-wrap items-center justify-between gap-2.5 no-print">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm sm:text-base font-display">
                  Individual Mathematics Intervention Plan (IMIP) Report
                </span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                  Official DepEd Template • A4 Landscape
                </span>
              </div>
              <p className="text-[11px] text-sky-100">
                Learner: <strong className="text-white">{learner.name}</strong> • Grade {gradeData.grade} - {learner.section || 'General'} • S.Y. 2026-2027
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isGeneratingPDF && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-lg text-xs font-bold text-amber-200 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating A4 PDF...</span>
              </div>
            )}

            {downloadSuccess && !isGeneratingPDF && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PDF Downloaded!</span>
              </div>
            )}

            {/* Edit / View Mode Toggle */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isEditing
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title="Edit gaps, competencies, and tutor notes directly"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Done Editing' : 'Edit Notes'}</span>
            </button>

            {/* Toggle Worksheet Scores Reference Panel */}
            <button
              onClick={() => setShowScoresReference(!showScoresReference)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="View student's raw worksheet scores for reference"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Scores Reference ({stats.percentage.toFixed(1)}%)</span>
            </button>

            {/* DOWNLOAD PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-md transition-all cursor-pointer text-xs"
              title="Download official IMIP report as an A4 PDF file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD PDF</span>
            </button>

            {/* PRINT Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl shadow-md transition-all cursor-pointer text-xs"
              title="Print official IMIP document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT</span>
            </button>

            {/* Full Size View Toggle */}
            <button
              onClick={() => setIsFullSize(!isFullSize)}
              className="p-1.5 bg-white/15 hover:bg-white/25 rounded-xl transition-colors cursor-pointer text-white"
              title={isFullSize ? 'Standard Size View' : 'Full Size View'}
            >
              {isFullSize ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white"
              title="Close IMIP View"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optional Collapsible Worksheet Scores Reference Drawer */}
        {showScoresReference && (
          <div className="bg-sky-50 border-b border-sky-200 p-4 text-xs no-print">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-black text-sky-900 uppercase">
                  Learner Scores Quick Reference ({learner.name})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-200 text-sky-800">
                  Total Score: {stats.totalScore} / {stats.totalItems} ({stats.percentage.toFixed(1)}%) • Status: {stats.status}
                </span>
              </div>
              <button
                onClick={handleResetPlan}
                className="flex items-center gap-1 text-[11px] text-sky-700 hover:underline cursor-pointer font-bold"
                title="Reset domain entries to match these score metrics"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Auto-fill Plan from Scores</span>
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5 max-h-36 overflow-y-auto p-1 bg-white rounded-lg border border-sky-200">
              {Array.from({ length: gradeData.totalWorksheets }).map((_, i) => {
                const w = i + 1;
                const sc = learner.scores[w];
                const cfg = gradeData.worksheetConfigs.find(c => c.number === w);
                const max = sc?.totalItems || cfg?.defaultTotalItems || 25;
                const score = sc ? sc.score : null;
                return (
                  <div key={w} className="p-1 text-center bg-slate-50 border border-slate-200 rounded text-[10px]">
                    <div className="font-bold text-slate-600">WS {w}</div>
                    <div className="font-mono font-bold text-slate-900">
                      {score !== null ? `${score}/${max}` : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Document Viewport - A4 Landscape Full View (Auto-flows to Page 2 if content exceeds 1 page) */}
        <div className="w-full flex-1 p-2 sm:p-5 lg:p-6 flex justify-center bg-slate-200/60 overflow-x-auto print:p-0 print:bg-white print:block">
          {/* Official Printable Sheet - A4 Landscape (297mm x 210mm) */}
          <div
            ref={printableRef}
            className="w-full max-w-[1060px] bg-white text-slate-950 shadow-xl border border-slate-300 p-6 sm:p-8 rounded-xl print:p-0 print:m-0 print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none"
            style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          >
            {/* OFFICIAL HEADER (Exact 5 Lines with School Logo on Left as requested) */}
            <div data-pdf-keep="true" className="imip-keep-together relative flex items-center justify-center mb-4">
              {/* School Logo */}
              <div className="absolute left-0 top-0">
                <img
                  src="/assets/aistudio/Untitled_design__2__40f193e5.png"
                  alt="Manuel L. Quezon Elementary School Logo"
                  className="w-16 h-16 sm:w-[70px] sm:h-[70px] object-contain"
                />
              </div>

              {/* Exact 5-Line Header */}
              <div className="text-center w-full px-16 sm:px-24">
                <div className="text-xs sm:text-[13px] text-slate-700 tracking-wide font-normal leading-snug">
                  Republic of the Philippines
                </div>
                <div className="text-xs sm:text-[13px] text-slate-700 tracking-wide font-normal leading-snug">
                  National Capital Region
                </div>
                <div className="text-xs sm:text-[13px] text-slate-700 tracking-wide font-normal leading-snug">
                  Schools Division Office of Caloocan City
                </div>
                <h1 className="text-sm sm:text-[15px] font-bold text-slate-900 tracking-wider uppercase mt-0.5 leading-snug">
                  MANUEL L. QUEZON ELEMENTARY SCHOOL
                </h1>
                <h2 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight mt-1.5">
                  INDIVIDUAL MATHEMATICS INTERVENTION PLAN (IMIP)
                </h2>
              </div>
            </div>

            {/* LEARNER & TEACHER INFORMATION SECTION */}
            <div data-pdf-keep="true" className="imip-keep-together mb-3.5 space-y-2 text-xs font-sans">
              {/* Row 1: Learner's Name & Grade Level & Section */}
              <div className="flex flex-col sm:flex-row items-baseline gap-3 sm:gap-8">
                <div className="flex-1 flex items-baseline gap-2 w-full">
                  <span className="font-bold text-slate-900 shrink-0">Learner's Name:</span>
                  <div className="flex-1 border-b border-slate-900 pb-0.5 px-2 font-bold text-slate-900 text-xs sm:text-sm">
                    {learner.name}
                  </div>
                </div>
                <div className="w-full sm:w-5/12 flex items-baseline gap-2">
                  <span className="font-bold text-slate-900 shrink-0">Grade Level & Section:</span>
                  <div className="flex-1 border-b border-slate-900 pb-0.5 px-2 font-bold text-slate-900 text-xs sm:text-sm">
                    Grade {gradeData.grade} - {learner.section || 'General'}
                  </div>
                </div>
              </div>

              {/* Row 2: Tutor's / Teacher's Name & School Year */}
              <div className="flex flex-col sm:flex-row items-baseline gap-3 sm:gap-8">
                <div className="flex-1 flex items-baseline gap-2 w-full">
                  <span className="font-bold text-slate-900 shrink-0">Tutor's / Teacher's Name:</span>
                  <div className="flex-1 border-b border-slate-900 pb-0.5 px-2 font-bold text-slate-900 text-xs sm:text-sm">
                    {learner.aralTeacher || gradeData.teacherName || 'ARAL Math Teacher'}
                  </div>
                </div>
                <div className="w-full sm:w-5/12 flex items-baseline gap-2">
                  <span className="font-bold text-slate-900 shrink-0">School Year:</span>
                  <div className="flex-1 border-b border-slate-900 pb-0.5 px-2 font-bold text-slate-900 text-xs sm:text-sm">
                    2026 - 2027
                  </div>
                </div>
              </div>
            </div>

            {/* LEARNER OVERALL SCORE & PROFICIENCY DESCRIPTOR SUMMARY */}
            <div
              data-pdf-keep="true"
              className="imip-keep-together mb-4 border border-slate-900 bg-slate-50/70 px-3.5 py-2 grid grid-cols-2 sm:grid-cols-4 gap-3 items-center text-xs"
            >
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-600">Worksheets Answered</div>
                <div className="font-bold text-slate-900 text-sm">
                  {stats.completedCount} / {gradeData.totalWorksheets} WS
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-600">Total Score</div>
                <div className="font-bold text-slate-900 text-sm">
                  {stats.totalScore} / {stats.totalItems} pts
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-600">Total Percentage</div>
                <div className="font-black text-slate-950 text-sm">
                  {stats.completedCount > 0 ? `${stats.percentage.toFixed(1)}%` : '0.0%'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                  Proficiency Descriptor
                </div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded border font-black text-[11px] uppercase tracking-wide ${getDescriptorBadgeClass(
                    stats.status
                  )}`}
                >
                  {stats.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* MAIN IMIP INTERVENTION TABLE (Official 4-column structure) */}
            <div className="mb-4 border border-slate-900">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-900 font-bold text-slate-900 text-xs bg-slate-100/70">
                    <th className="p-2.5 border-r border-slate-900 text-center w-[18%] font-bold">
                      Domain
                    </th>
                    <th className="p-2.5 border-r border-slate-900 text-center w-[27%] font-bold">
                      Identified Gaps
                    </th>
                    <th className="p-2.5 border-r border-slate-900 text-center w-[28%] font-bold">
                      Target Skills / Competencies
                    </th>
                    <th className="p-2.5 text-center w-[27%] font-bold">
                      <div>Tutor Notes / Observations</div>
                      <div className="text-[10px] font-normal italic text-slate-600">
                        (Include observable remarks and next session's target)
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {domains.map((domain, index) => {
                    const plan = domainPlans[domain] || {
                      identifiedGaps: '',
                      targetSkills: '',
                      tutorNotes: ''
                    };
                    const isLast = index === domains.length - 1;

                    return (
                      <tr key={domain} className={`${!isLast ? 'border-b border-slate-900' : ''} align-top`}>
                        {/* Column 1: Domain */}
                        <td className="p-2.5 border-r border-slate-900 font-bold text-slate-900 text-xs bg-slate-50/40 print:bg-transparent">
                          {domain}
                        </td>

                        {/* Column 2: Identified Gaps */}
                        <td className="p-2.5 border-r border-slate-900 text-slate-800 text-[11px] leading-snug">
                          {isEditing ? (
                            <textarea
                              rows={3}
                              value={plan.identifiedGaps}
                              onChange={e => handleUpdatePlan(domain, 'identifiedGaps', e.target.value)}
                              className="w-full p-1.5 text-xs border border-sky-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                            />
                          ) : (
                            <div className="whitespace-pre-line">{plan.identifiedGaps}</div>
                          )}
                        </td>

                        {/* Column 3: Target Skills / Competencies */}
                        <td className="p-2.5 border-r border-slate-900 text-slate-800 text-[11px] leading-snug">
                          {isEditing ? (
                            <textarea
                              rows={3}
                              value={plan.targetSkills}
                              onChange={e => handleUpdatePlan(domain, 'targetSkills', e.target.value)}
                              className="w-full p-1.5 text-xs border border-sky-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                            />
                          ) : (
                            <div className="whitespace-pre-line">{plan.targetSkills}</div>
                          )}
                        </td>

                        {/* Column 4: Tutor Notes / Observations */}
                        <td className="p-2.5 text-slate-800 text-[11px] leading-snug">
                          {isEditing ? (
                            <textarea
                              rows={3}
                              value={plan.tutorNotes}
                              onChange={e => handleUpdatePlan(domain, 'tutorNotes', e.target.value)}
                              className="w-full p-1.5 text-xs border border-sky-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
                            />
                          ) : (
                            <div className="whitespace-pre-line">{plan.tutorNotes}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* SIGNATURES SECTION (Kept together so signatures never split across pages) */}
            <div data-pdf-keep="true" className="imip-keep-together grid grid-cols-2 gap-12 text-xs sm:text-sm font-sans mt-6 pt-2">
              {/* Left Column: Prepared by */}
              <div>
                <div className="font-bold text-slate-900 mb-7">Prepared by:</div>
                <div className="w-full max-w-[340px]">
                  <div className="border-b border-slate-900 pb-1 text-center font-bold text-slate-900 text-xs sm:text-sm uppercase">
                    {learner.aralTeacher || gradeData.teacherName || 'ARAL Math Teacher'}
                  </div>
                  <div className="text-center text-[10px] sm:text-xs text-slate-600 mt-1 italic font-medium">
                    Teacher / Tutor Signature over Printed Name
                  </div>
                </div>
              </div>

              {/* Right Column: Noted by */}
              <div>
                <div className="font-bold text-slate-900 mb-7">Noted by:</div>
                <div className="w-full max-w-[340px]">
                  <div className="border-b border-slate-900 pb-1 text-center font-bold text-slate-900 text-xs sm:text-sm uppercase">
                    {gradeData.schoolHead || 'Principal IV'}
                  </div>
                  <div className="text-center text-[10px] sm:text-xs text-slate-600 mt-1 italic font-medium">
                    School Head / Principal Signature over Printed Name
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
