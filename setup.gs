
// --- KONFIGURASI ---
const TARGET_SHEET_ID = '1lHkUq-Rrb7IQK30rrSjf3sBJfiNfD4kk0FK1h7qZs24';

// --- FUNGSI UTAMA: SETUP STRUKTUR SHEET (RELATIONAL) ---
function setupDatabase() {
  const ss = SpreadsheetApp.openById(TARGET_SHEET_ID);
  
  // 1. USERS: Maklumat Peribadi Utama
  var sheetUsers = ss.getSheetByName("USERS");
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet("USERS");
    sheetUsers.appendRow([
      "TIMESTAMP", "EMAIL", "NAMA", "IC_PASS", "KELAS", "ROLE", "CLUB", 
      "TEACHER_EMAIL", "DOB", "PHONE", "ADDRESS", "GUARDIAN", "IMAGE_URL",
      "CUSTOM_VISI", "CUSTOM_MISI", "CUSTOM_MOTO", "CUSTOM_LOGO", "CUSTOM_FLAG", "CUSTOM_SONG"
    ]);
    sheetUsers.setFrozenRows(1);
    sheetUsers.getRange("A1:S1").setFontWeight("bold").setBackground("#e6f4ea");
  }

  // 2. LOGS: Laporan Mingguan
  var sheetLogs = ss.getSheetByName("LOGS");
  if (!sheetLogs) {
    sheetLogs = ss.insertSheet("LOGS");
    sheetLogs.appendRow([
      "LOG_ID", "EMAIL", "DATE", "TIME", "PLACE", "TYPE", 
      "OBJECTIVE", "CONTENT", "REFLECTION", "IMG1", "IMG2", 
      "ATTENDANCE", "TEACHER_NOTE", "TEACHER_SIG"
    ]);
    sheetLogs.setFrozenRows(1);
    sheetLogs.getRange("A1:N1").setFontWeight("bold").setBackground("#fff2cc");
  }

  // 3. SKILLS: Kemahiran
  var sheetSkills = ss.getSheetByName("SKILLS");
  if (!sheetSkills) {
    sheetSkills = ss.insertSheet("SKILLS");
    sheetSkills.appendRow(["EMAIL", "SKILL_NAME", "STATUS"]); // Status: "TRUE"/"FALSE"
    sheetSkills.setFrozenRows(1);
  }

  // 4. ACHIEVEMENTS: Pencapaian
  var sheetAch = ss.getSheetByName("ACHIEVEMENTS");
  if (!sheetAch) {
    sheetAch = ss.insertSheet("ACHIEVEMENTS");
    sheetAch.appendRow(["ID", "EMAIL", "NAME", "LEVEL", "RESULT"]);
    sheetAch.setFrozenRows(1);
  }

  // 5. SCHEDULE: Perancangan Aktiviti
  var sheetSched = ss.getSheetByName("SCHEDULE");
  if (!sheetSched) {
    sheetSched = ss.insertSheet("SCHEDULE");
    sheetSched.appendRow(["ID", "EMAIL", "DATE", "ACTIVITY", "PLACE"]);
    sheetSched.setFrozenRows(1);
  }
  
  // 6. TEACHERS: Profil Guru (Detailed)
  // Note: Basic login info for teachers is also in USERS (Role='guru')
  var sheetTeachers = ss.getSheetByName("TEACHERS");
  if (!sheetTeachers) {
    sheetTeachers = ss.insertSheet("TEACHERS");
    sheetTeachers.appendRow(["EMAIL", "NAME", "RANK", "POSITION", "PHONE", "SCHOOL", "EXPERIENCE", "PROFILE_IMAGE"]);
    sheetTeachers.setFrozenRows(1);
  }
  
  // 7. ORG_COMMITTEE: Carta Organisasi (Optional, can be columns in USERS but usually it's a list)
  // For simplicity, we'll keep principal, chairmam etc in USERS columns or a generic META table?
  // Let's add columns to USERS for single-value org roles?
  // Actually, let's keep it simple: USERS table handles the "Biodata" + "Org" single fields.
  // We need distinct columns for Org roles in USERS? Or generic JSON for that small part? 
  // User asked to avoid JSON columns. Let's add them to USERS or a separate ORG sheet.
  // Adding to USERS for now as they are 1-to-1 with student profile.
  // We will append them if needed, but for now let's assume they are stored in extended columns or handled via 'META' sheet if really strict.
  // Let's add a META sheet for miscellaneous Key-Value pairs per user
  var sheetMeta = ss.getSheetByName("USER_META");
  if (!sheetMeta) {
    sheetMeta = ss.insertSheet("USER_META");
    sheetMeta.appendRow(["EMAIL", "KEY", "VALUE"]); // e.g. "student1@..", "principal", "Pn Hjh..."
    sheetMeta.setFrozenRows(1);
  }

  Logger.log("Database initialized with Relational Schema.");
}

// --- FUNGSI TAMBAHAN: DATA DUMMY ---
function dataDummy() {
  const ss = SpreadsheetApp.openById(TARGET_SHEET_ID);
  setupDatabase(); // Ensure sheets exist

  const clubs = ["Badminton", "Bola Tampar", "Bola Jaring", "Olahraga/Permainan Dalaman"];
  const classes = ["1 Arif", "2 Arif", "3 Arif", "4 Arif", "5 Arif"];

  // Clear for fresh start (optional)
  // ss.getSheetByName("USERS").deleteRows(2, ss.getSheetByName("USERS").getLastRow() - 1);
  
  // 1. Create Teachers
  const sUsers = ss.getSheetByName("USERS");
  const sTeachers = ss.getSheetByName("TEACHERS");
  
  clubs.forEach((club, i) => {
    const tEmail = `guru${i+1}@moe-dl.edu.my`;
    const tName = `Cikgu ${club.split(' ')[1]}`;
    
    // USERS Entry
    sUsers.appendRow([
      new Date(), tEmail, tName, "'123456", "-", "guru", club, 
      "", "", "", "", "", "", 
      "", "", "", "", "", ""
    ]);
    
    // TEACHERS Entry
    sTeachers.appendRow([
      tEmail, tName, "Guru Penasihat", "Ketua Guru", "012345678"+i, "SMA Ulu Jempol", "5 Tahun", ""
    ]);
    
    // 2. Create Students (2 per club)
    for(let k=0; k<2; k++) {
      const sEmail = `student${i+1}_${k+1}@moe-dl.edu.my`;
      const sName = `Pelajar ${club.split(' ')[1]} ${k+1}`;
      const sIc = `1101010${i}0${k}00`;
      
      // USERS Entry
      sUsers.appendRow([
        new Date(), sEmail, sName, `'${sIc}`, classes[k%5], "murid", club,
        tEmail, "2011-01-01", "011-1234567"+k, "Alamat " + sName, "Bapa "+sName, "",
        "Visi Custom", "Misi Custom", "Moto Custom", "", "", "Lagu Custom..."
      ]);
      
      // LOGS (1 log for first student)
      if (k === 0) {
        ss.getSheetByName("LOGS").appendRow([
          Date.now(), sEmail, "2024-01-15", "14:00", "Kelas", "Perjumpaan 1", 
          "Objektif 1", "Aktiviti 1", "Refleksi 1", "", "", "HADIR", "", ""
        ]);
      }
      
      // SKILLS
      ["Komunikasi", "Kepimpinan"].forEach(skill => {
        ss.getSheetByName("SKILLS").appendRow([sEmail, skill, "TRUE"]);
      });

      // ACHIEVEMENTS
      if (k === 0) { // Only first student gets achievements initially
         ss.getSheetByName("ACHIEVEMENTS").appendRow([Date.now(), sEmail, "Pertandingan Puisi", "Daerah", "Naib Johan"]);
      }

      // SCHEDULE
      ss.getSheetByName("SCHEDULE").appendRow([Date.now(), sEmail, "2024-02-01", "Perjumpaan Mingguan 2", "Dewan Sekolah"]);
      ss.getSheetByName("SCHEDULE").appendRow([Date.now()+1, sEmail, "2024-03-01", "Perjumpaan Mingguan 3", "Padang Sekolah"]);
      
      // USER META (Org Chart)
      ss.getSheetByName("USER_META").appendRow([sEmail, "principal", "Tuan Pengetua"]);
    }
  });

  // Admin
  sUsers.appendRow([new Date(), "admin@moe-dl.edu.my", "Admin", "'admin123", "-", "admin", "", "", "", "", "", "", "", "","","","","",""]);
}
