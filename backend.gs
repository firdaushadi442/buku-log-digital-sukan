// KONFIGURASI UTAMA
var ID_SHEET = "1lHkUq-Rrb7IQK30rrSjf3sBJfiNfD4kk0FK1h7qZs24"; // ID Sheet Baru
var ID_DRIVE = "1AiItXwWwfzjKphY7ZHtVaIsm2B3os1j-"; // ID Folder Drive Baru

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
// FUNGSI UTAMA
// ------------------------------------------------------------------


// HELPER: Sheet Access
function openSheet(ss, name) {
  var s = ss.getSheetByName(name);
  if (!s) throw "Sheet " + name + " missing. Run setupDatabase() first.";
  return s;
}

// HELPER: Convert Sheet Data to Object Array
function sheetToObj(sheet) {
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var res = [];
  for(var i=1; i<data.length; i++) {
    var obj = {};
    for(var j=0; j<headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    res.push(obj);
  }
  return res;
}

// ------------------------------------------------------------------
// FUNGSI UTAMA (UPDATED FOR RELATIONAL SCHEMA)
// ------------------------------------------------------------------

function registerUser(ss, data) {
  var sheet = openSheet(ss, "USERS");
  var users = sheet.getDataRange().getValues();
  
  // Auto-Admin Check
  var ADMIN_EMAILS = ["g-59129199@moe-dl.edu.my", "g-24129206@moe-dl.edu.my"];
  if (ADMIN_EMAILS.indexOf(data.email) > -1) {
      data.role = 'admin';
  }
  
  // Check Duplicate
  for (var i = 1; i < users.length; i++) {
    if (users[i][1] === data.email) return { status: 'error', message: 'Emel sudah didaftarkan.' };
  }

  // Append new user
  // Shema: TIMESTAMP, EMAIL, NAMA, IC_PASS, KELAS, ROLE, CLUB, TEACHER_EMAIL, DOB, PHONE, ADDRESS, GUARDIAN, IMAGE_URL, VISI, MISI, MOTO, LOGO, FLAG, SONG
  sheet.appendRow([
    new Date(), 
    data.email, 
    data.name, 
    "'"+data.ic, 
    data.form, 
    data.role, 
    data.club, 
    "", "", "", "", "", "", "", "", "", "", "", "" // Empty profile fields
  ]);

  return { status: 'success', message: 'Pendaftaran berjaya.' };
}

function loginUser(ss, data, skipPassCheck) {
  var sheet = openSheet(ss, "USERS");
  var users = sheet.getDataRange().getValues();
  var userRow = null;

  // 1. Find User in USERS Sheet
  for (var i = 1; i < users.length; i++) {
    if (users[i][1] === data.email) {
      if (skipPassCheck) { 
        userRow = users[i]; break; 
      }
      var storedIC = String(users[i][3]).replace(/'/g, "");
      if (storedIC === data.ic) {
        userRow = users[i]; break;
      }
    }
  }

  if (!userRow) return { status: 'error', message: 'Rekod tidak dijumpai atau IC salah.' };

  var email = userRow[1];
  
  // Auto-Admin Override during Login
  var ADMIN_EMAILS = ["g-59129199@moe-dl.edu.my", "g-24129206@moe-dl.edu.my"];
  var userRole = userRow[5];
  if (ADMIN_EMAILS.indexOf(email) > -1) {
      userRole = 'admin';
  }

  // Enforce Club Check: If student tries to login to wrong club
  if (data.club && userRow[5] === 'murid' && userRow[6] !== data.club) {
      return { status: 'error', message: 'Harap maaf, akaun anda didaftarkan di bawah unit: ' + userRow[6] + '. Sila kembali dan pilih unit yang betul.' };
  }
  
  // 2. Fetch Relational Data
  var logsArr = getLogsByEmail(ss, email);
  var skillsObj = getSkillsByEmail(ss, email); 
  var achArr = getAchievementsByEmail(ss, email);
  var schedArr = getScheduleByEmail(ss, email);
  var metaObj = getMetaByEmail(ss, email);

  // 3. Construct "Profile" Object (Frontend expects this structure)
  var profile = {
    // Basic Info from USERS table
    studentName: userRow[2],
    ic: String(userRow[3]).replace(/'/g, ""),
    form: userRow[4],
    teacher: userRow[7] || "",
    dob: userRow[8] ? new Date(userRow[8]).toISOString() : "",
    phone: userRow[9] || "",
    address: userRow[10] || "",
    guardian: userRow[11] || "",
    profileImage: userRow[12] || "",
    
    // Custom Content from USERS table
    customVisi: userRow[13] || "",
    customMisi: userRow[14] || "",
    customMoto: userRow[15] || "",
    customLogo: userRow[16] || "",
    customFlag: userRow[17] || "",
    customSong: userRow[18] || "",
    
    // Joined Data
    skills: skillsObj,
    achievements: achArr,
    schedule: schedArr,
    
    // Meta (Org Chart etc)
    ...metaObj
  };
  
  // Add Teacher Review Note (Usually attached to specific logs or metadata)
  // Check if any log has a global comment attached? Actually the previous JSON had 'teacherComment' globally.
  // In relational, we can put standard teacher comment in USER_META or appended to USERS.
  // Let's use USER_META for 'teacherComment' and 'studentSummary'.
  profile.teacherComment = metaObj.teacherComment || "";
  profile.studentSummary = metaObj.studentSummary || "";

  return { 
    status: 'success', 
    data: {
      email: email,
      name: userRow[2],
      ic: String(userRow[3]).replace(/'/g, ""),
      form: userRow[4],
      role: userRole,
      club: userRow[6],
      profile: profile, // Constructed Object
      logs: logsArr     // Array of Log Objects
    }
  };
}

function saveData(ss, data) {
  var email = data.email;
  var sUsers = openSheet(ss, "USERS");
  var uData = sUsers.getDataRange().getValues();
  var rowIndex = -1;

  for(var i=1; i<uData.length; i++) {
    if(uData[i][1] === email) { rowIndex=i+1; break; }
  }

  if(rowIndex === -1) return { status: 'error', message: 'User not found' };

  var p = data.profile;

  // 1. Update USERS Table (Columns 3, 5, 8-19)
  // Mapping: NAMA(3), KELAS(5), TEACHER(8), DOB(9), PHONE(10)...
  if(p.studentName) sUsers.getRange(rowIndex, 3).setValue(p.studentName);
  if(p.form) sUsers.getRange(rowIndex, 5).setValue(p.form);
  if(p.teacher) sUsers.getRange(rowIndex, 8).setValue(p.teacher);
  if(p.dob) sUsers.getRange(rowIndex, 9).setValue(p.dob); // Date format handled by sheets usually
  if(p.phone) sUsers.getRange(rowIndex, 10).setValue(p.phone);
  if(p.address) sUsers.getRange(rowIndex, 11).setValue(p.address);
  if(p.guardian) sUsers.getRange(rowIndex, 12).setValue(p.guardian);
  if(p.profileImage) sUsers.getRange(rowIndex, 13).setValue(p.profileImage);
  
  if(p.customVisi) sUsers.getRange(rowIndex, 14).setValue(p.customVisi);
  if(p.customMisi) sUsers.getRange(rowIndex, 15).setValue(p.customMisi);
  if(p.customMoto) sUsers.getRange(rowIndex, 16).setValue(p.customMoto);
  if(p.customLogo) sUsers.getRange(rowIndex, 17).setValue(p.customLogo);
  if(p.customFlag) sUsers.getRange(rowIndex, 18).setValue(p.customFlag);
  if(p.customSong) sUsers.getRange(rowIndex, 19).setValue(p.customSong);

  // 2. Sync Logs (Delete all & Rewrite? Or Upsert? For simplicity in specific user context: Upsert)
  // BETTER: Filter out old, write new.
  // Actually "sumbat data" avoidance suggests managing rows individually.
  // But data.logs comes as a full array from frontend.
  // Strategy: Get all existing log IDs for this user, Update matches, Insert new, Delete missing?
  // Simplest for now: Delete all logs for this user -> Rewrite all. (Safe for data integrity if frontend sends all)
  updateRelationalData(ss, "LOGS", email, data.logs, 
    ["LOG_ID", "EMAIL", "DATE", "TIME", "PLACE", "TYPE", "OBJECTIVE", "CONTENT", "REFLECTION", "IMG1", "IMG2", "ATTENDANCE", "TEACHER_NOTE", "TEACHER_SIG"], 
    (item) => [item.id, email, item.date, item.time, item.place, item.type, item.objective, item.content, item.reflection, item.img1, item.img2, item.attendance, item.teacherNote||"", item.teacherSignature||""]
  );

  // 3. Sync Achievements
  updateRelationalData(ss, "ACHIEVEMENTS", email, p.achievements || [], 
    ["ID", "EMAIL", "NAME", "LEVEL", "RESULT"],
    (item) => [item.id, email, item.name, item.level, item.result]
  );

  // 4. Sync Schedule
  updateRelationalData(ss, "SCHEDULE", email, p.schedule || [], 
    ["ID", "EMAIL", "DATE", "ACTIVITY", "PLACE"],
    (item) => [item.id, email, item.date, item.activity, item.place]
  );
  
  // 5. Sync Skills (Key-Value)
  // Frontend sends { "Skill1": true, "Skill2": false }
  // Transform to array
  var skillsArr = [];
  if(p.skills) {
      Object.keys(p.skills).forEach(k => {
          skillsArr.push({ name: k, status: p.skills[k] ? "TRUE" : "FALSE" });
      });
  }
  updateRelationalData(ss, "SKILLS", email, skillsArr,
     ["EMAIL", "SKILL_NAME", "STATUS"],
     (item) => [email, item.name, item.status]
  );
  
  // 6. Sync Meta (Summary, TeacherComment, Org Roles)
  var metaArr = [];
  if(p.studentSummary) metaArr.push({k: 'studentSummary', v: p.studentSummary});
  if(p.teacherComment) metaArr.push({k: 'teacherComment', v: p.teacherComment});
  // Add Org Roles if present in profile object
  ['principal', 'teacherAdvisor', 'chairman', 'secretary', 'treasurer', 'committee'].forEach(role => {
      if(p[role]) metaArr.push({k: role, v: p[role]});
  });
  
  updateRelationalData(ss, "USER_META", email, metaArr,
      ["EMAIL", "KEY", "VALUE"],
      (item) => [email, item.k, item.v]
  );

  return { status: 'success' };
}

// GENERIC: Delete existing rows for Email, then Append new ones (Full Sync)
// Warning: This is inefficient for huge datasets but fine for this scale and ensures data consistency with frontend.
function updateRelationalData(ss, sheetName, email, dataItems, headersStrArr, mapFn) {
  var sheet = openSheet(ss, sheetName);
  var data = sheet.getDataRange().getValues();
  
  // Find rows to delete (reverse order to avoid index shift issues)
  // Actually, deleteRows is slow. 
  // Better: Read all, filter OUT this user's data, result + new data -> Write All.
  // Wait, if sheet is huge, Write All is safer?
  // Let's go with: Filter In Memory -> Write.
  
  var keepRows = [];
  // Keep Header
  keepRows.push(data[0]); 
  
  for(var i=1; i<data.length; i++) {
     // Assuming Email is always at index 1 for most sheets, except SKILLS (0), USER_META (0)
     // Let's standardise helper via column name? 
     // Hardcode based on schema:
     var emailIdx = 1;
     if (sheetName === "SKILLS" || sheetName === "USER_META" || sheetName === "TEACHERS") emailIdx = 0;
     
     if (data[i][emailIdx] !== email) {
       keepRows.push(data[i]);
     }
  }
  
  // Add New Data
  dataItems.forEach(item => {
    keepRows.push(mapFn(item));
  });
  
  // Clear and Write
  if(keepRows.length > 0) {
      sheet.clearContents();
      sheet.getRange(1, 1, keepRows.length, keepRows[0].length).setValues(keepRows);
  } else {
      sheet.clearContents(); 
      // Should preserve header if empty? Logic above preserves header in keepRows[0]
  }
}


// --- READ HELPERS ---

function getLogsByEmail(ss, email) {
  var sheet = ss.getSheetByName("LOGS");
  if(!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var res = [];
  for(var i=1; i<data.length; i++) {
    if(data[i][1] === email) {
      res.push({
        id: data[i][0],
        date: formatDate(data[i][2]), // Helper to ensure string
        time: data[i][3],
        place: data[i][4],
        type: data[i][5],
        objective: data[i][6],
        content: data[i][7],
        reflection: data[i][8],
        img1: data[i][9],
        img2: data[i][10],
        attendance: data[i][11],
        teacherNote: data[i][12],
        teacherSignature: data[i][13]
      });
    }
  }
  return res;
}

function getSkillsByEmail(ss, email) {
  var sheet = ss.getSheetByName("SKILLS");
  if(!sheet) return {};
  var data = sheet.getDataRange().getValues();
  var res = {};
  for(var i=1; i<data.length; i++) {
    if(data[i][0] === email) {
       res[data[i][1]] = (data[i][2] === "TRUE" || data[i][2] === true);
    }
  }
  return res;
}

function getAchievementsByEmail(ss, email) {
  var sheet = ss.getSheetByName("ACHIEVEMENTS");
  if(!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var res = [];
  for(var i=1; i<data.length; i++) {
    if(data[i][1] === email) {
      res.push({id: data[i][0], name: data[i][2], level: data[i][3], result: data[i][4]});
    }
  }
  return res;
}

function getScheduleByEmail(ss, email) {
  var sheet = ss.getSheetByName("SCHEDULE");
  if(!sheet) return [];
  var data = sheet.getDataRange().getValues();
  var res = [];
  for(var i=1; i<data.length; i++) {
    if(data[i][1] === email) {
      res.push({ id: data[i][0], date: data[i][2], activity: data[i][3], place: data[i][4] });
    }
  }
  return res;
}

function getMetaByEmail(ss, email) {
  var sheet = ss.getSheetByName("USER_META");
  if(!sheet) return {};
  var data = sheet.getDataRange().getValues();
  var res = {};
  for(var i=1; i<data.length; i++) {
    if(data[i][0] === email) {
      res[data[i][1]] = data[i][2]; // Key-Value Store
    }
  }
  return res;
}

function formatDate(dateVal) {
  if (!dateVal) return "";
  if (dateVal instanceof Date) return dateVal.toISOString().split('T')[0];
  return String(dateVal);
}

// ------------------------------------------------------------------
// FUNGSI GURU (UPDATED)
// ------------------------------------------------------------------

function getTeacherStudents(ss, data) {
    var sheet = openSheet(ss, "USERS");
    var users = sheet.getDataRange().getValues();
    var students = [];

    // 1. Get Teacher's Club
    var teacherClub = "";
    for(var t=1; t<users.length; t++) {
        if (users[t][1] === data.email && users[t][5] === 'guru') {
            teacherClub = users[t][6]; break;
        }
    }

    // 2. Filter Students
    for (var i = 1; i < users.length; i++) {
        if (users[i][5] === 'murid' && (!teacherClub || users[i][6] === teacherClub)) {
            var email = users[i][1];
            
            // Lite Fetch (Don't fetch all logs content, just count)
            var logs = getLogsByEmail(ss, email); // Inefficient loop, but robust
            
            // Completeness Calc
            var completeness = calculateCompleteness(users[i]); // Pass Row
            var isReviewed = logs.some(l => !!l.teacherSignature);

            students.push({
                name: users[i][2],
                email: email,
                ic: String(users[i][3]).replace(/'/g, ""),
                form: users[i][4],
                club: users[i][6],
                teacher: users[i][7] || "",
                logCount: logs.length,
                completeness: completeness,
                isReviewed: isReviewed
            });
        }
    }
    
    // Sort
    students.sort(function(a, b) {
        if (a.form < b.form) return -1;
        if (a.form > b.form) return 1;
        return a.name.localeCompare(b.name);
    });

    return { status: 'success', data: students };
}

function calculateCompleteness(row) {
    // USERS ROW indices: NAMA(2), IC(3), DOB(8), PHONE(9), ADDRESS(10), GUARDIAN(11), IMAGE(12)
    var completion = 0;
    var total = 7;
    if(row[2]) completion++;
    if(row[3]) completion++;
    if(row[8]) completion++;
    if(row[9]) completion++;
    if(row[10]) completion++;
    if(row[11]) completion++;
    if(row[12]) completion++;
    return Math.round((completion / total) * 100);
}

function saveLogReview(ss, data) {
    var sheet = openSheet(ss, "LOGS");
    var logs = sheet.getDataRange().getValues();
    
    for(var i=1; i<logs.length; i++) {
        // ID is Col 0
        if (String(logs[i][0]) === String(data.logId)) {
            sheet.getRange(i+1, 13).setValue(data.teacherNote); // 13 = Col M (Teacher Note)
            sheet.getRange(i+1, 14).setValue(data.teacherSignature); // 14 = Col N (Sig)
            return { status: 'success' };
        }
    }
    return { status: 'error', message: 'Log ID not found' };
}

function getTeacherProfile(ss, data) {
    var sTeachers = openSheet(ss, "TEACHERS");
    var tRows = sTeachers.getDataRange().getValues();
    
    var sUsers = openSheet(ss, "USERS");
    var uRows = sUsers.getDataRange().getValues();
    
    // Find in TEACHERS
    var tRow = null;
    for(var i=1; i<tRows.length; i++) {
        if (tRows[i][0] === data.email) { tRow = tRows[i]; break; }
    }
    
    // Find in USERS (for Address, IC, DOB, Phone fallback)
    var uRow = null;
    for(var i=1; i<uRows.length; i++) {
        if (uRows[i][1] === data.email) { uRow = uRows[i]; break; }
    }

    if (tRow || uRow) {
        var p = {
            email: data.email,
            name: (tRow && tRow[1]) || (uRow && uRow[2]) || "",
            rankKRS: (tRow && tRow[2]) || "",
            positionKRS: (tRow && tRow[3]) || "",
            phone: (tRow && tRow[4]) || (uRow && uRow[9]) || "",
            school: (tRow && tRow[5]) || "",
            experience: (tRow && tRow[6]) || "",
            profileImage: (tRow && tRow[7]) || (uRow && uRow[12]) || "",
            // Expanded fields from USERS
            ic: (uRow && String(uRow[3]).replace(/'/g, "")) || "",
            dob: (uRow && formatDate(uRow[8])) || "", // Col 9 is DOB
            address: (uRow && uRow[10]) || "",       // Col 11 is Address
            // Meta-like fields for extra teacher info if needed, or just defaults
            districtState: "", highestEdu: "", option: "", basicCourse: "", advCourse: "", courseDetails: "", heldPositions: "", contributions: ""
        };
        
        // Fetch USER_META for the remaining extra fields if they exist there
        var meta = getMetaByEmail(ss, data.email);
        Object.assign(p, meta);

        return { status: 'success', data: p };
    }
    
    return { status: 'success', data: {} };
}

function saveTeacherProfile(ss, data) {
    var sheet = openSheet(ss, "TEACHERS");
    var rows = sheet.getDataRange().getValues();
    var rowIndex = -1;
    
    for(var i=1; i<rows.length; i++) {
        if (rows[i][0] === data.email) { rowIndex = i + 1; break; }
    }
    
    var d = data;
    if (rowIndex === -1) {
        sheet.appendRow([d.email, d.name, d.rankKRS, d.positionKRS, d.phone, d.school, d.experience, d.profileImage]);
    } else {
        // Update Columns in TEACHERS
        sheet.getRange(rowIndex, 2).setValue(d.name);
        sheet.getRange(rowIndex, 3).setValue(d.rankKRS);
        sheet.getRange(rowIndex, 4).setValue(d.positionKRS);
        sheet.getRange(rowIndex, 5).setValue(d.phone);
        sheet.getRange(rowIndex, 6).setValue(d.school);
        sheet.getRange(rowIndex, 7).setValue(d.experience);
        sheet.getRange(rowIndex, 8).setValue(d.profileImage);
    }
    
    // Update USERS (Name, IC, Phone, Address, DOB, Image)
    var sUsers = openSheet(ss, "USERS");
    var uRows = sUsers.getDataRange().getValues();
    for(var j=1; j<uRows.length; j++) {
        if (uRows[j][1] === d.email) {
            var r = j+1;
            if(d.name) sUsers.getRange(r, 3).setValue(d.name);
            if(d.ic) sUsers.getRange(r, 4).setValue("'" + d.ic);
            if(d.dob) sUsers.getRange(r, 9).setValue(d.dob);
            if(d.phone) sUsers.getRange(r, 10).setValue(d.phone);
            if(d.address) sUsers.getRange(r, 11).setValue(d.address);
            if(d.profileImage) sUsers.getRange(r, 13).setValue(d.profileImage);
            break;
        }
    }
    
    // Save Extra Fields to USER_META
    // fields: districtState, highestEdu, option, basicCourse, advCourse, courseDetails, heldPositions, contributions
    var extraFields = ['districtState', 'highestEdu', 'option', 'basicCourse', 'advCourse', 'courseDetails', 'heldPositions', 'contributions'];
    var metaArr = [];
    extraFields.forEach(k => {
        if(d[k]) metaArr.push({k: k, v: d[k]});
    });
    
    // Upsert Metadata
    if(metaArr.length > 0) {
        var sMeta = openSheet(ss, "USER_META");
        var mRows = sMeta.getDataRange().getValues();
        metaArr.forEach(m => {
             var found = false;
             for(var k=1; k<mRows.length; k++) {
                 if(mRows[k][0] === d.email && mRows[k][1] === m.k) {
                     sMeta.getRange(k+1, 3).setValue(m.v);
                     found = true; break;
                 }
             }
             if(!found) sMeta.appendRow([d.email, m.k, m.v]);
        });
    }
    
    return { status: 'success' };
}

function getTeacherList(ss) {
    var sheet = openSheet(ss, "USERS");
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

function saveTeacherReview(ss, data) {
    // This function originally acted on student profile. 
    // Now it updates User Meta for 'teacherComment' and 'teacherSignature' (Global Review)
    var email = data.email;
    var metaArr = [
       {k: 'teacherComment', v: data.teacherComment},
       {k: 'teacherSignature', v: data.teacherSignature}
    ];
    // Update USER_META safely (similar to updateRelationalData but preserving other keys)
    // Actually, updateRelationalData logic we wrote REPLACES all data for that user in that sheet.
    // For USER_META this is destructive if we only send partial updates.
    // We need a specific Upsert for Meta.
    
    var sheet = openSheet(ss, "USER_META");
    var rows = sheet.getDataRange().getValues();
    
    metaArr.forEach(m => {
       var found = false;
       for(var i=1; i<rows.length; i++) {
           if(rows[i][0] === email && rows[i][1] === m.k) {
               sheet.getRange(i+1, 3).setValue(m.v);
               found = true;
               break;
           }
       }
       if(!found) {
           sheet.appendRow([email, m.k, m.v]);
       }
    });

    return { status: 'success' };
}

function getAdminData(ss) {
    var sUsers = openSheet(ss, "USERS");
    var users = sUsers.getDataRange().getValues();
    
    var students = [];
    var teachers = [];
    
    // Pre-fetch all logs/teachers for optimization? 
    // For now iterate. 
    
    for (var i = 1; i < users.length; i++) {
        var email = users[i][1];
        var role = users[i][5];
        
        if (role === 'murid') {
            var logs = getLogsByEmail(ss, email);
            var reviewed = logs.some(l => !!l.teacherSignature); 
            students.push({
                name: users[i][2],
                email: email,
                ic: String(users[i][3]).replace(/'/g, ""),
                form: users[i][4],
                club: users[i][6],
                teacher: users[i][7] || "",
                logCount: logs.length,
                completeness: calculateCompleteness(users[i]),
                isReviewed: reviewed
            });
        } else if (role === 'guru' || role === 'admin') {
             // For teachers, get extra info from TEACHERS sheet
             // TODO: Optimize this N+1 query
             var tProfile = getTeacherProfile(ss, {email: email}).data; 
             teachers.push({
                 name: users[i][2],
                 email: email,
                 role: role,
                 club: users[i][6],
                 rank: tProfile.rankKRS || "",
                 school: tProfile.school || "",
                 profileCompleteness: 80 // Dummy stat for now
             });
        }
    }
    
    return { status: 'success', data: { students: students, teachers: teachers } };
}
