// KONFIGURASI UTAMA
var ID_SHEET = "1MCPc2H-DCU9PrKuJNONk0VgGlr0IeFnokYiLdAA5nzw"; // ID Sheet Baru
var ID_DRIVE = "1LEOE0y_B3qPCZPZi_PFFUintgW5CCgUj"; // ID Folder Drive Baru

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var data = payload.data;
    var result = {};

    var ss = SpreadsheetApp.openById(ID_SHEET);

    if (action === 'register') {
      result = registerUser(ss, data);
    } 
    else if (action === 'login') {
      result = loginUser(ss, data);
    }
    else if (action === 'saveData') {
      result = saveData(ss, data);
    }
    else if (action === 'uploadImage') {
      result = uploadImage(data);
    }
    else if (action === 'getTeacherStudents') {
        result = getTeacherStudents(ss, data);
    }
    else if (action === 'saveLogReview') {
        result = saveLogReview(ss, data);
    }
    else if (action === 'saveTeacherReview') {
        result = saveTeacherReview(ss, data);
    }
    else if (action === 'getTeacherProfile') {
        result = getTeacherProfile(ss, data);
    }
    else if (action === 'saveTeacherProfile') {
        result = saveTeacherProfile(ss, data);
    }
    else if (action === 'getTeacherList') {
        result = getTeacherList(ss);
    }
    else if (action === 'getStudentData') {
      // Re-use login merely to fetch data
      result = loginUser(ss, {email: data.email, ic: null}, true); 
    }
    else if (action === 'getAdminData') {
      result = getAdminData(ss);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ------------------------------------------------------------------
// FUNGSI UTAMA
// ------------------------------------------------------------------

function registerUser(ss, data) {
  var sheet = ss.getSheetByName("AHLL_DAFTAR");
  if (!sheet) return { status: 'error', message: 'Sheet AHLL_DAFTAR tiada' };

  // Cek duplikasi email
  var users = sheet.getDataRange().getValues();
  for (var i = 1; i < users.length; i++) {
    if (users[i][1] === data.email) {
      return { status: 'error', message: 'Emel sudah didaftarkan.' };
    }
  }

  var timestamp = new Date();
  
  // Format Data: [Timestamp, Email, Name, IC, Form, Role, Club, ProfileData(JSON), Logs(JSON)]
  // Now including 'Club' column
  sheet.appendRow([
    timestamp, 
    data.email, 
    data.name, 
    "'"+data.ic, // Force string for IC
    data.form, 
    data.role, 
    data.club, // New Field
    JSON.stringify({}), // Profile Empty
    JSON.stringify([])  // Logs Empty
  ]);

  return { status: 'success', message: 'Pendaftaran berjaya.' };
}

function loginUser(ss, data, skipPassCheck) {
  var sheet = ss.getSheetByName("AHLL_DAFTAR");
  var users = sheet.getDataRange().getValues();
  var user = null;
  var rowIndex = -1;

  for (var i = 1; i < users.length; i++) {
    if (users[i][1] === data.email) {
      // Jika skipPassCheck (utk guru view student), abaikan IC
      // Jika role guru, data.ic act as password (simplified)
      // Jika murid, check IC
      if (skipPassCheck) {
         user = users[i]; rowIndex = i; break;
      }
      
      var storedIC = String(users[i][3]).replace(/'/g, "");
      if (storedIC === data.ic) {
        user = users[i]; rowIndex = i; break;
      }
    }
  }

  if (!user) return { status: 'error', message: 'Rekod tidak dijumpai atau IC salah.' };

  // Parse JSON data
  var profile = {};
  var logs = [];
  try { profile = JSON.parse(user[7] || "{}"); } catch(e){}
  try { logs = JSON.parse(user[8] || "[]"); } catch(e){}

  return { 
    status: 'success', 
    data: {
      email: user[1],
      name: user[2],
      ic: String(user[3]).replace(/'/g, ""),
      form: user[4],
      role: user[5],
      club: user[6], // Return club info
      profile: profile,
      logs: logs
    }
  };
}

function saveData(ss, data) {
  var sheet = ss.getSheetByName("AHLL_DAFTAR");
  var users = sheet.getDataRange().getValues();
  
  for (var i = 1; i < users.length; i++) {
    if (users[i][1] === data.email) {
      // Update Name field in col 2 (Index 2 in 0-based is Col C)
      if (data.profile && data.profile.studentName) {
          sheet.getRange(i + 1, 3).setValue(data.profile.studentName);
      }
      
      // Update form if changed
       if (data.profile && data.profile.form) {
          sheet.getRange(i + 1, 5).setValue(data.profile.form);
      }

      // Col 8 = Profile JSON
      sheet.getRange(i + 1, 8).setValue(JSON.stringify(data.profile));
      // Col 9 = Logs JSON
      sheet.getRange(i + 1, 9).setValue(JSON.stringify(data.logs));
      
      return { status: 'success' };
    }
  }
  return { status: 'error', message: 'User not found' };
}

function uploadImage(data) {
  try {
    var folder = DriveApp.getFolderById(ID_DRIVE);
    var blob = Utilities.newBlob(Utilities.base64Decode(data.base64), data.mimeType, data.filename);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return { status: 'success', url: "https://lh3.googleusercontent.com/d/" + file.getId() };
  } catch(e) {
    return { status: 'error', message: e.toString() };
  }
}

// ------------------------------------------------------------------
// FUNGSI GURU
// ------------------------------------------------------------------

function getTeacherStudents(ss, data) {
    var sheet = ss.getSheetByName("AHLL_DAFTAR");
    var users = sheet.getDataRange().getValues();
    var students = [];

    // First, find the teacher's club from their profile
    var teacherClub = "";
    for(var t=1; t<users.length; t++) {
        if (users[t][1] === data.email && users[t][5] === 'guru') {
            teacherClub = users[t][6]; // Get teacher's club
            break;
        }
    }

    // Now find students, filtered by teacher's club
    for (var i = 1; i < users.length; i++) {
        // Must be murid, AND match teacher's club OR if teacher has no club assigned yet (generic admin view maybe?)
        // Enforcing club match strictness
        if (users[i][5] === 'murid' && (!teacherClub || users[i][6] === teacherClub)) {
            var profile = {};
            try { profile = JSON.parse(users[i][7] || "{}"); } catch(e){}
            var logs = [];
            try { logs = JSON.parse(users[i][8] || "[]"); } catch(e){}

            // Calculate stats
            var logCount = logs.length;
            var completeness = calculateCompleteness(profile);

            // Check if profiled teacher maps to this teacher (redundant if using club filter, but good for direct assignments)
            // But main filter is Club. 
            var assignedTeacher = profile.teacher || "";
            
            // Check review status
            var isReviewed = logs.some(l => !!l.teacherSignature);

            students.push({
                name: users[i][2],
                email: users[i][1],
                ic: String(users[i][3]).replace(/'/g, ""),
                form: users[i][4],
                club: users[i][6],
                teacher: assignedTeacher,
                logCount: logCount,
                completeness: completeness,
                isReviewed: isReviewed
            });
        }
    }

    // Sort: 1. Class (Asc), 2. Name (Asc)
    students.sort(function(a, b) {
        if (a.form < b.form) return -1;
        if (a.form > b.form) return 1;
        return a.name.localeCompare(b.name);
    });

    return { status: 'success', data: students };
}

function calculateCompleteness(p) {
    var fields = ['studentName', 'ic', 'dob', 'address', 'phone', 'guardian', 'profileImage'];
    var filled = fields.filter(f => !!p[f]).length;
    return Math.round((filled / fields.length) * 100);
}

function saveLogReview(ss, data) {
    var sheet = ss.getSheetByName("AHLL_DAFTAR");
    var users = sheet.getDataRange().getValues();
    
    for (var i = 1; i < users.length; i++) {
        if (users[i][1] === data.email) {
            var currentLogs = [];
            try { currentLogs = JSON.parse(users[i][8] || "[]"); } catch(e){}
            
            var foundIndex = -1;
            for(var k=0; k<currentLogs.length; k++) {
                if (currentLogs[k].id === data.logId) {
                    foundIndex = k;
                    break;
                }
            }

            if (foundIndex !== -1) {
                currentLogs[foundIndex].teacherNote = data.teacherNote;
                currentLogs[foundIndex].teacherSignature = data.teacherSignature;
                
                sheet.getRange(i + 1, 9).setValue(JSON.stringify(currentLogs));
                return { status: 'success' };
            }
            return { status: 'error', message: 'Log ID not found' };
        }
    }
    return { status: 'error', message: 'User not found' };
}

function getTeacherProfile(ss, data) {
    var sheet = ss.getSheetByName("GURU_PROFIL");
    if (!sheet) return { status: 'success', data: {} }; // Return empty if sheet not exists

    var rows = sheet.getDataRange().getValues();
    for(var i=1; i<rows.length; i++) {
        if (rows[i][0] === data.email) {
            var profile = {};
            try { profile = JSON.parse(rows[i][1]); } catch(e){}
            return { status: 'success', data: profile };
        }
    }
    return { status: 'success', data: {} };
}

function saveTeacherProfile(ss, data) {
    var sheet = ss.getSheetByName("GURU_PROFIL");
    if (!sheet) {
        sheet = ss.insertSheet("GURU_PROFIL");
        sheet.appendRow(["Email", "ProfileData"]);
    }
    
    var rows = sheet.getDataRange().getValues();
    var rowIndex = -1;
    
    for(var i=1; i<rows.length; i++) {
        if (rows[i][0] === data.data.email) {
            rowIndex = i + 1;
            break;
        }
    }

    if (rowIndex === -1) {
        sheet.appendRow([data.data.email, JSON.stringify(data.data)]);
    } else {
        sheet.getRange(rowIndex, 2).setValue(JSON.stringify(data.data));
    }

    // Also update main Name in AHLL_DAFTAR if changed
    var mainSheet = ss.getSheetByName("AHLL_DAFTAR");
    var mainRows = mainSheet.getDataRange().getValues();
    for(var j=1; j<mainRows.length; j++) {
        if (mainRows[j][1] === data.data.email) {
            if (data.data.name) mainSheet.getRange(j+1, 3).setValue(data.data.name);
            break;
        }
    }

    return { status: 'success' };
}

function getTeacherList(ss) {
    var sheet = ss.getSheetByName("AHLL_DAFTAR");
    var data = sheet.getDataRange().getValues();
    var teachers = [];
    
    for(var i=1; i<data.length; i++) {
        if (data[i][5] === 'guru') {
            teachers.push({
               name: data[i][2],
               email: data[i][1],
               club: data[i][6]
            });
        }
    }
    return { status: 'success', data: teachers };
}

function getAdminData(ss) {
    var sheet = ss.getSheetByName("AHLL_DAFTAR");
    var data = sheet.getDataRange().getValues();
    // Get Teacher Profiles too for completeness stat
    var tSheet = ss.getSheetByName("GURU_PROFIL");
    var tData = tSheet ? tSheet.getDataRange().getValues() : [];
    var tMap = {};
    for(var t=1; t<tData.length; t++) {
        try { tMap[tData[t][0]] = JSON.parse(tData[t][1]); } catch(e){}
    }

    var students = [];
    var teachers = [];

    for (var i = 1; i < data.length; i++) {
        // Parse Profile
        var profile = {};
        try { profile = JSON.parse(data[i][7] || "{}"); } catch(e){}
        
        if (data[i][5] === 'murid') {
             var logs = [];
             try { logs = JSON.parse(data[i][8] || "[]"); } catch(e){}
             var isReviewed = logs.some(l => !!l.teacherSignature);

             students.push({
                name: data[i][2],
                email: data[i][1],
                ic: String(data[i][3]).replace(/'/g, ""),
                form: data[i][4],
                club: data[i][6], // Include Club
                teacher: profile.teacher || "",
                logCount: logs.length,
                completeness: calculateCompleteness(profile),
                isReviewed: isReviewed
             });
        } else if (data[i][5] === 'guru' || data[i][5] === 'admin') {
             var tProf = tMap[data[i][1]] || {};
             // Calc teacher profile completeness
             var tFields = ['name', 'ic', 'phone', 'school', 'rankKRS'];
             var tFilled = tFields.filter(f => !!tProf[f] || !!data[i][(f==='name'?2:100)]).length; // simple check
             var tComplete = Math.round((tFilled / tFields.length) * 100);

             teachers.push({
                 name: data[i][2],
                 email: data[i][1],
                 role: data[i][5],
                 club: data[i][6],
                 rank: tProf.rankKRS || "",
                 school: tProf.school || "",
                 profileCompleteness: tComplete
             });
        }
    }
    
    return { status: 'success', data: { students: students, teachers: teachers } };
}

function saveTeacherReview(ss, data) {
    var sheet = ss.getSheetByName("AHLL_DAFTAR");
    var users = sheet.getDataRange().getValues();
    
    for (var i = 1; i < users.length; i++) {
        if (users[i][1] === data.email) {
            var profile = {};
            try { profile = JSON.parse(users[i][7] || "{}"); } catch(e){}
            
            profile.teacherComment = data.teacherComment;
            profile.teacherSignature = data.teacherSignature;
            
            sheet.getRange(i + 1, 8).setValue(JSON.stringify(profile));
            return { status: 'success' };
        }
    }
    return { status: 'error', message: 'User not found' };
}
