import type { SchoolData, GradeLevel, GradeData, Learner } from '../types';

export interface SyncResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  error?: string;
}

export function computeLearnerStats(learner: Learner, gradeData: GradeData) {
  let totalScore = 0;
  let totalItems = 0;
  let completedCount = 0;

  for (let wsNum = 1; wsNum <= gradeData.totalWorksheets; wsNum++) {
    const entry = learner.scores[wsNum];
    if (entry && typeof entry.score === 'number' && entry.totalItems > 0) {
      totalScore += entry.score;
      totalItems += entry.totalItems;
      completedCount++;
    }
  }

  const percentage = totalItems > 0 ? (totalScore / totalItems) * 100 : 0;
  let status: 'Mastery' | 'Progressing' | 'Needs Intervention' | 'No Data' = 'No Data';

  if (completedCount > 0) {
    if (percentage >= 85) status = 'Mastery';
    else if (percentage >= 75) status = 'Progressing';
    else status = 'Needs Intervention';
  }

  return { totalScore, totalItems, percentage, completedCount, status };
}

/**
 * Creates a brand new Google Spreadsheet for MLQES ARAL Math
 */
export async function createARALSpreadsheet(
  accessToken: string,
  schoolData: SchoolData
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const grades: GradeLevel[] = ['1', '2', '3', '4', '5', '6'];

  const sheetsConfig = [
    {
      properties: {
        title: 'School Overview',
        index: 0,
        gridProperties: { rowCount: 100, columnCount: 30 }
      }
    },
    ...grades.map((g, idx) => ({
      properties: {
        title: `Grade ${g}`,
        index: idx + 1,
        gridProperties: { rowCount: 150, columnCount: 80 }
      }
    }))
  ];

  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: 'MLQES ARAL MATH MONITORING S.Y. 2026-2027 - Manuel L. Quezon Elementary School'
      },
      sheets: sheetsConfig
    })
  });

  if (!createRes.ok) {
    const errData = await createRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to create Google Spreadsheet (${createRes.status})`);
  }

  const data = await createRes.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Now populate with all initial data
  await syncAllDataToSpreadsheet(accessToken, spreadsheetId, schoolData);

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Syncs school data into the given Google Sheet with automatic grid resizing and tab provisioning
 */
export async function syncAllDataToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  schoolData: SchoolData
): Promise<void> {
  const grades: GradeLevel[] = ['1', '2', '3', '4', '5', '6'];

  // Check existing spreadsheet metadata
  try {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (metaRes.ok) {
      const meta = await metaRes.json();
      const existingSheets = (meta.sheets || []).map((s: any) => ({
        id: s.properties?.sheetId,
        title: s.properties?.title,
        cols: s.properties?.gridProperties?.columnCount || 26
      }));

      const requests: any[] = [];

      // Ensure School Overview exists
      if (!existingSheets.some((s: any) => s.title === 'School Overview')) {
        requests.push({
          addSheet: {
            properties: {
              title: 'School Overview',
              gridProperties: { rowCount: 100, columnCount: 30 }
            }
          }
        });
      }

      // Ensure each Grade sheet exists and has sufficient columns
      for (const g of grades) {
        const expectedTitle = `Grade ${g}`;
        const found = existingSheets.find((s: any) => s.title === expectedTitle);
        if (!found) {
          requests.push({
            addSheet: {
              properties: {
                title: expectedTitle,
                gridProperties: { rowCount: 150, columnCount: 80 }
              }
            }
          });
        } else if (found.cols < 80) {
          requests.push({
            updateSheetProperties: {
              properties: {
                sheetId: found.id,
                gridProperties: { columnCount: 80 }
              },
              fields: 'gridProperties.columnCount'
            }
          });
        }
      }

      if (requests.length > 0) {
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests })
        });
      }
    }
  } catch (err) {
    console.warn('Metadata verification warning (continuing sync):', err);
  }

  // 1. Prepare Overview Rows
  const overviewRows: (string | number)[][] = [
    ['DEPARTMENT OF EDUCATION - DIVISION OFFICE OF CALOOCAN CITY'],
    ['MANUEL L. QUEZON ELEMENTARY SCHOOL'],
    ['ARAL MATH MONITORING CONSOLIDATED REPORT - S.Y. 2026-2027'],
    ['Last Synchronized:', new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })],
    [],
    [
      'Grade Level',
      'Teacher / Focal',
      'Total Worksheets',
      'Enrolled Learners',
      'Male',
      'Female',
      'Average Score %',
      'Mastery (>=85%)',
      'Progressing (75-84%)',
      'Needs Intervention (<75%)'
    ]
  ];

  for (const g of grades) {
    const gData = schoolData[g];
    let totalLearners = gData.learners.length;
    let maleCount = gData.learners.filter(l => l.gender === 'Male').length;
    let femaleCount = gData.learners.filter(l => l.gender === 'Female').length;
    let sumPercentage = 0;
    let validCount = 0;
    let mastery = 0;
    let progressing = 0;
    let intervention = 0;

    gData.learners.forEach(l => {
      const stats = computeLearnerStats(l, gData);
      if (stats.completedCount > 0) {
        sumPercentage += stats.percentage;
        validCount++;
        if (stats.status === 'Mastery') mastery++;
        else if (stats.status === 'Progressing') progressing++;
        else if (stats.status === 'Needs Intervention') intervention++;
      }
    });

    const avg = validCount > 0 ? (sumPercentage / validCount).toFixed(2) + '%' : '0.00%';

    overviewRows.push([
      `Grade ${g}`,
      gData.teacherName || 'ARAL Math Teacher',
      gData.totalWorksheets,
      totalLearners,
      maleCount,
      femaleCount,
      avg,
      mastery,
      progressing,
      intervention
    ]);
  }

  // 2. Prepare Grade Data for each grade sheet
  const dataPayload: { range: string; majorDimension: string; values: (string | number)[][] }[] = [
    {
      range: `'School Overview'!A1`,
      majorDimension: 'ROWS',
      values: overviewRows
    }
  ];

  for (const g of grades) {
    const gData = schoolData[g];
    const totalWs = gData.totalWorksheets;

    // Header row 1: Metadata
    const titleRow = [`MLQES ARAL MATH MONITORING - GRADE ${g} (S.Y. 2026-2027)`];
    const teacherRow = [
      `Teacher: ${gData.teacherName || 'Assigned Teacher'}`,
      '',
      `School Head: ${gData.schoolHead || 'School Principal'}`,
      '',
      `Default Section: ${gData.sectionDefault || ''}`
    ];
    const blankRow: string[] = [];

    // Table Column Headers: No, LRN, Full Name, Gender, Section, WS 1 ... WS N, Total Score, Total Items, Overall Percentage, Status, Remarks
    const colHeaders: string[] = ['No.', 'LRN', 'Learner Name', 'Gender', 'Section'];
    for (let w = 1; w <= totalWs; w++) {
      const config = gData.worksheetConfigs.find(c => c.number === w);
      const defItems = config?.defaultTotalItems || 30;
      colHeaders.push(`WS ${w} (/${defItems})`);
    }
    colHeaders.push('Total Score', 'Total Items', 'Overall %', 'Status', 'Remarks');

    const learnerRows: (string | number)[][] = [titleRow, teacherRow, blankRow, colHeaders];

    gData.learners.forEach((l, index) => {
      const stats = computeLearnerStats(l, gData);
      const row: (string | number)[] = [
        index + 1,
        l.lrn || '',
        l.name,
        l.gender,
        l.section || gData.sectionDefault || ''
      ];

      for (let w = 1; w <= totalWs; w++) {
        const sc = l.scores[w];
        if (sc && typeof sc.score === 'number') {
          row.push(`${sc.score}/${sc.totalItems}`);
        } else {
          row.push('-');
        }
      }

      row.push(
        stats.totalScore,
        stats.totalItems,
        stats.completedCount > 0 ? Number(stats.percentage.toFixed(2)) : 0,
        stats.status,
        l.remarks || ''
      );

      learnerRows.push(row);
    });

    dataPayload.push({
      range: `'Grade ${g}'!A1`,
      majorDimension: 'ROWS',
      values: learnerRows
    });
  }

  // Send batch update to Google Sheets
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: dataPayload
      })
    }
  );

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to update Google Sheet (${updateRes.status})`);
  }
}

/**
 * Export Grade data or School data as a downloadable CSV file
 */
export function exportToCSV(filename: string, rows: (string | number)[][]) {
  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' +
    rows.map(e => e.map(item => `"${String(item).replace(/"/g, '""')}"`).join(',')).join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
