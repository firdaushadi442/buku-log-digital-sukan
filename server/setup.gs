function SetupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Sheet Ahli Daftar
  var sheet = ss.getSheetByName("AHLL_DAFTAR");
  if (!sheet) {
    sheet = ss.insertSheet("AHLL_DAFTAR");
    // Header includes CLUB at col 7
    sheet.appendRow(["TIMESTAMP", "EMAIL", "NAMA", "IC_PASS", "KELAS", "ROLE", "CLUB", "PROFILE_JSON", "LOGS_JSON"]);
    sheet.setFrozenRows(1);
  } else {
     // Ensure header is correct using check
     var h = sheet.getRange("A1:I1").getValues()[0];
     if (h.length < 9 || h[6] !== "CLUB") {
        // insert column G if missing or wrong
        // This is a naive migration, user better run on fresh sheet or adjust manual
        Logger.log("Sila pastikan kolum G adalah CLUB");
     }
  }

  // 2. Sheet Guru Profil
  var sheetGuru = ss.getSheetByName("GURU_PROFIL");
  if (!sheetGuru) {
    sheetGuru = ss.insertSheet("GURU_PROFIL");
    sheetGuru.appendRow(["EMAIL", "DATA_JSON"]);
  }
}

function dataDummy() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("AHLL_DAFTAR");
  if(!sheet) return;

  var clubs = ["Badminton", "Bola Tampar", "Bola Jaring", "Olahraga/Permainan Dalaman"];
  var classes = ["1 Arif", "2 Arif", "3 Arif", "4 Arif", "5 Arif"];
  
  // 1. Create Dummy Teachers (1 per club)
  for(var c=0; c<clubs.length; c++) {
      var email = "guru" + (c+1) + "@moe-dl.edu.my";
      sheet.appendRow([
          new Date(),
          email,
          "Cikgu " + clubs[c].split(' ')[1],
          "'123456", // Password
          "-",
          "guru",
          clubs[c],
          JSON.stringify({
              name: "Cikgu " + clubs[c].split(' ')[1],
              email: email,
              rankKRS: "Guru Penasihat",
              positionKRS: "Ketua Guru Penasihat",
              phone: "0123456789",
              school: "SMA Ulu Jempol",
              experience: "5 Tahun mengajar"
          }),
          "[]"
      ]);
  }

  // 2. Create Dummy Students (3 per club)
  for(var c=0; c<clubs.length; c++) {
      for (var s=0; s<3; s++) {
          var sName = "Pelajar " + clubs[c].split(' ')[1] + " " + (s+1);
          var sEmail = "student" + (c+1) + "_" + (s+1) + "@moe-dl.edu.my";
          var sClass = classes[Math.floor(Math.random()*classes.length)];
          
          var dummyProfile = {
              studentName: sName,
              ic: "11111111000" + s,
              form: sClass,
              phone: "0199999999",
              teacher: "guru" + (c+1) + "@moe-dl.edu.my", // Link to correct teacher
              address: "No 123 Jalan " + clubs[c],
              guardian: "Bapa " + sName
          };

          // Dummy Logs
          var dummyLogs = [];
          if (s % 2 === 0) { // Some students have logs
             dummyLogs.push({
                 id: Date.now(),
                 date: "2024-01-10",
                 time: "14:00",
                 place: "Dewan Sekolah",
                 type: "Mesyuarat Agung",
                 objective: "Melantik AJK",
                 content: "Pelantikan AJK bagi sesi 2024 dijalankan dengan lancar.",
                 reflection: "Saya dilantik sebagai AJK Kebersihan.",
                 attendance: "HADIR"
             });
          }

          sheet.appendRow([
              new Date(),
              sEmail,
              sName,
              dummyProfile.ic,
              sClass,
              "murid",
              clubs[c],
              JSON.stringify(dummyProfile),
              JSON.stringify(dummyLogs)
          ]);
      }
  }
}
