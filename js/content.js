// Content bank. All scenarios are invented for practice — no real customer, client or company data.
// Two tracks: "desk" (service desk / support roles) and "student" (college & school learners).

window.CONTENT = {
  typing: {
    desk: [
      { id: "dt1", title: "Password reset note", text: "User unable to log in to the VPN after a password change. Cleared cached credentials, confirmed the new password works on the portal, and asked the user to reconnect. Issue resolved." },
      { id: "dt2", title: "Printer escalation", text: "Floor 3 printer HP-LJ-304 shows error 49.4C02 and will not print. Power cycle did not help. Escalating to the onsite hardware team with priority P3." },
      { id: "dt3", title: "Email to customer", text: "Hi Emma, thank you for your patience. We have reset your mailbox permissions and you should now see the shared calendar. Please reply to this email if the issue returns." },
      { id: "dt4", title: "Outlook crash ticket", text: "Outlook closes within 10 seconds of opening on Windows 11. Started Outlook in safe mode without issues, so a faulty add-in is likely. Disabled the PDF add-in and Outlook is now stable." },
      { id: "dt5", title: "Chat reply", text: "I understand how frustrating this is. Could you please tell me the exact error message you see and the time it first appeared? That will help me find the cause quickly." },
      { id: "dt6", title: "Laptop handover", text: "New laptop SN 5CG1284XYZ assigned to Rahul Mehta. Installed Teams, Office 365, Zoom and the antivirus agent. Asset register updated and user signed the handover form." }
    ],
    student: [
      { id: "st1", title: "Study note", text: "Photosynthesis converts light energy into chemical energy. Plants take in carbon dioxide and water, and with the help of sunlight they produce glucose and release oxygen." },
      { id: "st2", title: "Email to a professor", text: "Dear Professor Rao, I was unable to attend Monday's lecture due to a medical appointment. Could you please share the slides, and let me know if the assignment deadline is still Friday?" },
      { id: "st3", title: "Internship application", text: "I am a second-year computer science student with a strong interest in data analysis. I have completed projects in Python and SQL and would welcome the chance to learn from your team." },
      { id: "st4", title: "History summary", text: "The Indian Constitution came into effect on 26 January 1950. It is the longest written constitution in the world and guarantees fundamental rights to every citizen." },
      { id: "st5", title: "Lab report line", text: "The solution was heated to 80 degrees Celsius for 15 minutes, then cooled to room temperature. The final mass of the crystals was 4.2 grams, giving a yield of 84 percent." }
    ]
  },

  // Listen & Type: hear one sentence, type exactly what you heard.
  dictation: {
    desk: [
      { id: "dd1", text: "My laptop keeps disconnecting from the Wi-Fi every ten minutes." },
      { id: "dd2", text: "I've been locked out of my account after three failed attempts." },
      { id: "dd3", text: "The shared drive is showing access denied since this morning." },
      { id: "dd4", text: "Can you reset my multi-factor authentication? I've changed my phone." },
      { id: "dd5", text: "Teams won't let me share my screen during meetings anymore." },
      { id: "dd6", text: "The invoice system throws error four zero three when I try to approve." },
      { id: "dd7", text: "My second monitor is flickering and the display goes black randomly." },
      { id: "dd8", text: "I need admin rights to install the new version of the accounting software." }
    ],
    student: [
      { id: "sd1", text: "Please submit your assignment on the portal before midnight on Friday." },
      { id: "sd2", text: "The mid-term examination will be held in hall number four." },
      { id: "sd3", text: "Mitochondria are known as the powerhouse of the cell." },
      { id: "sd4", text: "Read chapters six and seven before next week's tutorial." },
      { id: "sd5", text: "The library will remain closed on Saturday for maintenance work." },
      { id: "sd6", text: "Interviews for the summer internship start on the fifteenth of March." }
    ]
  },

  // Listen & Capture: hear a longer message, then fill in the key facts.
  // Each fact lists accepted answers; a field scores if any accepted term appears (case-insensitive).
  capture: {
    desk: [
      {
        id: "dc1", title: "VPN failure",
        script: "Hi, yeah, this is Mark from the finance team. So, since about nine this morning I can't connect to the VPN from home. It says error eight hundred and nine. I've already restarted the laptop twice and tried my phone hotspot as well, same thing. It's quite urgent because I've got the month-end report due by two o'clock today.",
        facts: [
          { label: "Caller name", accept: ["mark"] },
          { label: "Team / department", accept: ["finance"] },
          { label: "Issue", accept: ["vpn"] },
          { label: "Error code", accept: ["809", "eight hundred and nine", "eight zero nine"] },
          { label: "Steps already tried", accept: ["restart", "rebooted", "hotspot"] },
          { label: "Deadline / urgency", accept: ["2", "two", "14:00", "month-end", "month end"] }
        ]
      },
      {
        id: "dc2", title: "Outlook calendar",
        script: "Hello there, it's Sarah Collins calling from the Melbourne office. Look, my Outlook calendar isn't syncing with my phone. Meetings I accept on the desktop just don't show up on my iPhone. It started after the update yesterday. I've removed and re-added the account on the phone but no luck.",
        facts: [
          { label: "Caller name", accept: ["sarah", "collins"] },
          { label: "Location", accept: ["melbourne"] },
          { label: "Application", accept: ["outlook", "calendar"] },
          { label: "Device", accept: ["iphone", "phone", "mobile"] },
          { label: "When it started", accept: ["update", "yesterday"] },
          { label: "Steps already tried", accept: ["removed", "re-added", "readded", "re added"] }
        ]
      },
      {
        id: "dc3", title: "Printer jam",
        script: "Morning. This is Liam on the second floor, near the kitchen. The big colour printer, the one labelled P two zero five, keeps jamming on tray two. We've got a client presentation at eleven and need about forty copies. Can someone come up, or is there another printer we can use?",
        facts: [
          { label: "Caller name", accept: ["liam"] },
          { label: "Location", accept: ["second floor", "2nd floor", "floor 2", "kitchen"] },
          { label: "Printer ID", accept: ["p205", "p 205", "p-205", "p two zero five"] },
          { label: "Problem", accept: ["jam"] },
          { label: "Tray", accept: ["tray 2", "tray two", "tray2"] },
          { label: "Urgency", accept: ["11", "eleven", "client", "presentation", "40", "forty"] }
        ]
      },
      {
        id: "dc4", title: "New starter access",
        script: "Hi, I'm calling about a new joiner, Priya Nair, who starts on Monday in the HR team. She'll need a laptop, an email account, and access to the payroll system. Her manager is David Brown. Could you confirm everything will be ready by Monday at nine?",
        facts: [
          { label: "New joiner name", accept: ["priya", "nair"] },
          { label: "Start date", accept: ["monday"] },
          { label: "Team", accept: ["hr", "human resources"] },
          { label: "Items needed", accept: ["laptop", "email", "payroll"] },
          { label: "Manager", accept: ["david", "brown"] }
        ]
      },
      {
        id: "dc5", title: "Slow system",
        script: "Hiya, it's Fiona. Everything's running really slow on my desktop since lunchtime, Excel takes ages to open and the browser keeps freezing. I've closed all my other programs. My asset tag is D F seven seven four two. I'm in the Dublin office if that helps.",
        facts: [
          { label: "Caller name", accept: ["fiona"] },
          { label: "Symptom", accept: ["slow", "freez"] },
          { label: "When it started", accept: ["lunch"] },
          { label: "Apps affected", accept: ["excel", "browser"] },
          { label: "Asset tag", accept: ["df7742", "df 7742", "df-7742", "d f seven seven four two"] },
          { label: "Location", accept: ["dublin"] }
        ]
      }
    ],
    student: [
      {
        id: "sc1", title: "Class announcement",
        script: "Good morning everyone. A quick announcement. The guest lecture on artificial intelligence has moved from Wednesday to Thursday, same time, three in the afternoon, but the venue is now the seminar hall on the first floor. Attendance is compulsory for third-year students, and please bring your ID cards.",
        facts: [
          { label: "Event", accept: ["guest lecture", "lecture", "artificial intelligence", "ai"] },
          { label: "New day", accept: ["thursday"] },
          { label: "Time", accept: ["3", "three", "15:00"] },
          { label: "Venue", accept: ["seminar hall", "seminar"] },
          { label: "Who must attend", accept: ["third", "3rd"] },
          { label: "What to bring", accept: ["id"] }
        ]
      },
      {
        id: "sc2", title: "Interview instructions",
        script: "Hello, this is Anna from the recruitment team. Thank you for applying for the graduate trainee role. Your online interview is scheduled for the twentieth of November at ten thirty in the morning You'll receive a Teams link by email. Please keep your resume and a government ID ready, and test your camera beforehand.",
        facts: [
          { label: "Caller name", accept: ["anna"] },
          { label: "Role", accept: ["graduate trainee", "trainee"] },
          { label: "Date", accept: ["20", "twentieth", "november"] },
          { label: "Time", accept: ["10:30", "10.30", "ten thirty"] },
          { label: "Platform", accept: ["teams"] },
          { label: "What to keep ready", accept: ["resume", "id", "camera"] }
        ]
      },
      {
        id: "sc3", title: "Project briefing",
        script: "Right, for your group project, each team of four will research one renewable energy source, solar, wind, or hydro. You'll submit a ten-page report and give a fifteen-minute presentation. The report is due on the fifth of December, and presentations will be the week after.",
        facts: [
          { label: "Team size", accept: ["4", "four"] },
          { label: "Topic", accept: ["renewable", "solar", "wind", "hydro"] },
          { label: "Report length", accept: ["10", "ten"] },
          { label: "Presentation length", accept: ["15", "fifteen"] },
          { label: "Due date", accept: ["5", "fifth", "december"] }
        ]
      }
    ]
  }
};

// Accent labels for speech voices, keyed by BCP-47 language tag.
window.ACCENTS = {
  "en-US": "American", "en-GB": "British", "en-AU": "Australian", "en-IE": "Irish",
  "en-NZ": "New Zealand", "en-CA": "Canadian", "en-ZA": "South African",
  "en-IN": "Indian", "en-PH": "Filipino", "en-SG": "Singaporean", "en-NG": "Nigerian",
  "en-KE": "Kenyan", "en-HK": "Hong Kong", "en-SCOTLAND": "Scottish"
};
