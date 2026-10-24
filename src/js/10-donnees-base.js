
// ── DATA ───────────────────────────────────────────────────────────────────

// STATUS_CFG defined below with INITIAL_DB

const CYCLE_COLORS = {
  "PPG":        { color: "#FF4455", bg: "rgba(255,68,85,0.12)",   label: "Preparation Physique Generale" },
  "PPS 1":      { color: "#FF7A00", bg: "rgba(255,122,0,0.12)",   label: "Preparation Physique Specifique 1" },
  "PPS 2":      { color: "#FFA420", bg: "rgba(255,164,32,0.12)",  label: "Preparation Physique Specifique 2" },
  "PREVENTION": { color: "#38BDF8", bg: "rgba(56,189,248,0.12)",  label: "Prevention blessures" },
  "COMPETITION":{ color: "#4CAF50", bg: "rgba(76,175,80,0.12)",   label: "Competition" },
  "REPRISE":    { color: "#7C6FFF", bg: "rgba(124,111,255,0.12)", label: "Reprise" },
  "REPOS":      { color: "#38BDF8", bg: "rgba(56,189,248,0.12)",  label: "Repos" },
  "REHABILITATION": { color: "#EC4899", bg: "rgba(236,72,153,0.12)", label: "Réhabilitation" },
  "DECHARGE":   { color: "#4CAF50", bg: "rgba(76,175,80,0.12)",   label: "Décharge" },
  "AUTONOMIE":  { color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.04)", label: "Travail autonome" },
};
const QUALITES = [
  { id:"aerob",   label:"Aerobie",    icon:"heart", color:"#38BDF8" },
  { id:"force",   label:"Force",      icon:"fire",  color:"#FF4455" },
  { id:"posture", label:"Posture",    icon:"body",  color:"#7C6FFF" },
  { id:"vitesse", label:"Vitesse",    icon:"bolt",  color:"#FFA420" },
];
const CHARGE_COLORS = ["rgba(255,255,255,0.07)","#38BDF8","#4CAF50","#FFA420","#FF7A00","#FF4455"];

const SAISON = [
  { sem:"S1",  dates:"14-20 juil.",   mois:"JUILLET",   cycle:"AUTONOMIE",   match:null,               aerob:0,force:0,posture:0,vitesse:0,charge:0  },
  { sem:"S2",  dates:"21-27 juil.",   mois:"JUILLET",   cycle:"AUTONOMIE",   match:null,               aerob:0,force:0,posture:0,vitesse:0,charge:0  },
  { sem:"S3",  dates:"28 juil-3 aout",mois:"JUILLET",   cycle:"PPG",         match:null,               aerob:3,force:3,posture:2,vitesse:1,charge:55 },
  { sem:"S4",  dates:"4-10 aout",     mois:"AOUT",      cycle:"PPG",         match:"Reprise",          aerob:4,force:4,posture:3,vitesse:2,charge:70 },
  { sem:"S5",  dates:"11-17 aout",    mois:"AOUT",      cycle:"PPG",         match:null,               aerob:4,force:4,posture:3,vitesse:2,charge:75 },
  { sem:"S6",  dates:"18-24 aout",    mois:"AOUT",      cycle:"PPG",         match:null,               aerob:5,force:5,posture:3,vitesse:3,charge:85 },
  { sem:"S7",  dates:"25-31 aout",    mois:"AOUT",      cycle:"PPS 1",       match:"CDF + J1",         aerob:4,force:4,posture:3,vitesse:3,charge:80 },
  { sem:"S8",  dates:"1-7 sept.",     mois:"SEPTEMBRE", cycle:"PPS 1",       match:"J2",               aerob:3,force:4,posture:3,vitesse:4,charge:75 },
  { sem:"S9",  dates:"8-14 sept.",    mois:"SEPTEMBRE", cycle:"PPS 1",       match:"J3",               aerob:3,force:4,posture:3,vitesse:4,charge:75 },
  { sem:"S10", dates:"15-21 sept.",   mois:"SEPTEMBRE", cycle:"PPS 1",       match:"J4",               aerob:3,force:3,posture:3,vitesse:4,charge:72 },
  { sem:"S11", dates:"22-28 sept.",   mois:"SEPTEMBRE", cycle:"PPS 1",       match:"J5",               aerob:3,force:3,posture:3,vitesse:4,charge:70 },
  { sem:"S12", dates:"29 sept-5 oct.",mois:"SEPTEMBRE", cycle:"PPS 2",       match:"J6",               aerob:2,force:3,posture:3,vitesse:4,charge:68 },
  { sem:"S13", dates:"6-12 oct.",     mois:"OCTOBRE",   cycle:"PPS 2",       match:"J7",               aerob:2,force:3,posture:3,vitesse:4,charge:68 },
  { sem:"S14", dates:"13-19 oct.",    mois:"OCTOBRE",   cycle:"PPS 2",       match:"J8",               aerob:2,force:3,posture:3,vitesse:4,charge:68 },
  { sem:"S15", dates:"20-26 oct.",    mois:"OCTOBRE",   cycle:"PPS 2",       match:"J9",               aerob:2,force:3,posture:2,vitesse:4,charge:65 },
  { sem:"S16", dates:"27 oct-2 nov.", mois:"OCTOBRE",   cycle:"PREVENTION",  match:"Sem. Intern.",     aerob:1,force:2,posture:3,vitesse:2,charge:45 },
  { sem:"S17", dates:"4-10 nov.",     mois:"NOVEMBRE",  cycle:"PPS 2",       match:"J10",              aerob:2,force:3,posture:3,vitesse:4,charge:68 },
  { sem:"S18", dates:"11-17 nov.",    mois:"NOVEMBRE",  cycle:"PPS 2",       match:"J11",              aerob:2,force:3,posture:3,vitesse:4,charge:68 },
  { sem:"S19", dates:"18-24 nov.",    mois:"NOVEMBRE",  cycle:"PPS 2",       match:"J12",              aerob:2,force:3,posture:3,vitesse:4,charge:68 },
  { sem:"S20", dates:"25-30 nov.",    mois:"NOVEMBRE",  cycle:"PREVENTION",  match:"J13",              aerob:1,force:2,posture:3,vitesse:2,charge:50 },
  { sem:"S21", dates:"1-8 dec.",      mois:"DECEMBRE",  cycle:"PPS 2",       match:"J14",              aerob:2,force:3,posture:3,vitesse:4,charge:68 },
  { sem:"S22", dates:"9-15 dec.",     mois:"DECEMBRE",  cycle:"PPS 2",       match:"J15",              aerob:2,force:3,posture:3,vitesse:4,charge:68 },
  { sem:"S23", dates:"16-22 dec.",    mois:"DECEMBRE",  cycle:"PREVENTION",  match:null,               aerob:1,force:2,posture:3,vitesse:1,charge:40 },
  { sem:"S24", dates:"23-31 dec.",    mois:"DECEMBRE",  cycle:"AUTONOMIE",   match:null,               aerob:0,force:0,posture:0,vitesse:0,charge:0  },
  { sem:"S25", dates:"13-19 jan.",    mois:"JANVIER",   cycle:"PPG",         match:null,               aerob:4,force:4,posture:3,vitesse:2,charge:75 },
  { sem:"S26", dates:"20-26 jan.",    mois:"JANVIER",   cycle:"PPG",         match:null,               aerob:5,force:5,posture:3,vitesse:2,charge:85 },
  { sem:"S27", dates:"27-31 jan.",    mois:"JANVIER",   cycle:"PPS 1",       match:null,               aerob:4,force:4,posture:3,vitesse:3,charge:78 },
  { sem:"S28", dates:"1-9 fev.",      mois:"FEVRIER",   cycle:"PPS 1",       match:"Reprise",          aerob:3,force:4,posture:3,vitesse:4,charge:73 },
  { sem:"S29", dates:"10-16 fev.",    mois:"FEVRIER",   cycle:"PPS 1",       match:null,               aerob:3,force:4,posture:3,vitesse:4,charge:72 },
  { sem:"S30", dates:"17-23 fev.",    mois:"FEVRIER",   cycle:"PREVENTION",  match:null,               aerob:1,force:2,posture:3,vitesse:1,charge:45 },
  { sem:"S31", dates:"24-28 fev.",    mois:"FEVRIER",   cycle:"PPS 2",       match:null,               aerob:2,force:3,posture:3,vitesse:4,charge:68 },
  { sem:"S32", dates:"1-9 mars",      mois:"MARS",      cycle:"PPS 2",       match:"Tests",            aerob:2,force:3,posture:3,vitesse:4,charge:68 },
  { sem:"S33", dates:"10-16 mars",    mois:"MARS",      cycle:"PPS 2",       match:null,               aerob:2,force:3,posture:3,vitesse:4,charge:68 },
  { sem:"S34", dates:"17-23 mars",    mois:"MARS",      cycle:"PPS 2",       match:null,               aerob:2,force:3,posture:2,vitesse:4,charge:65 },
  { sem:"S35", dates:"24-31 mars",    mois:"MARS",      cycle:"COMPETITION", match:null,               aerob:2,force:2,posture:2,vitesse:3,charge:60 },
  { sem:"S36", dates:"1-6 avr.",      mois:"AVRIL",     cycle:"COMPETITION", match:null,               aerob:2,force:2,posture:2,vitesse:3,charge:60 },
  { sem:"S37", dates:"7-13 avr.",     mois:"AVRIL",     cycle:"COMPETITION", match:null,               aerob:2,force:2,posture:2,vitesse:3,charge:60 },
  { sem:"S38", dates:"14-20 avr.",    mois:"AVRIL",     cycle:"COMPETITION", match:null,               aerob:2,force:2,posture:2,vitesse:3,charge:60 },
  { sem:"S39", dates:"21-27 avr.",    mois:"AVRIL",     cycle:"COMPETITION", match:null,               aerob:2,force:2,posture:2,vitesse:3,charge:60 },
  { sem:"S40", dates:"28 avr-4 mai",  mois:"AVRIL",     cycle:"COMPETITION", match:null,               aerob:2,force:2,posture:2,vitesse:3,charge:60 },
  { sem:"S41", dates:"5-11 mai",      mois:"MAI",       cycle:"COMPETITION", match:null,               aerob:2,force:2,posture:2,vitesse:3,charge:58 },
  { sem:"S42", dates:"12-18 mai",     mois:"MAI",       cycle:"COMPETITION", match:null,               aerob:2,force:2,posture:2,vitesse:3,charge:58 },
  { sem:"S43", dates:"19-25 mai",     mois:"MAI",       cycle:"COMPETITION", match:null,               aerob:2,force:2,posture:2,vitesse:3,charge:55 },
  { sem:"S44", dates:"26-31 mai",     mois:"MAI",       cycle:"COMPETITION", match:null,               aerob:1,force:1,posture:1,vitesse:2,charge:45 },
];


const STATUS_CFG = {
  "ok":        { color:"#4CAF50", label:"Disponible" },
  "blesse":    { color:"#FF4455", label:"Blessé" },
  "surveille": { color:"#FF7A00", label:"Surveillance" },
  "repos":     { color:"#FFB800", label:"Repos" },
};

const INITIAL_DB = {
  playersPerso: [],
  clubs: [{
    id:"usm", name:"Union Sud Mayenne", city:"Mayenne", division:"Nationale 1",
    saison:"2026-2027",
    coach:{ id:"coach-usm", name:"Leo", email:"leo.chabanis@gmail.com" },
    roster:[]
  }],
  playerProfiles: [
    { id:"p-rizzi",     clubId:"usm", name:"Maxence Rizzi", email:"maxence@player.fr",      pos:"Gardien",    num:1,  age:30, poids:82, taille:185,           status:"ok",       stress:2, motivation:4, focus:4, confiance:4, stats:{sessions:12,absences:1, chargeWeek:65,wellness:4}, blessures:[], nutrition:"competition", notes:"" },
    { id:"p-gaillard",  clubId:"usm", name:"Tristan Gaillard", email:"tristan@player.fr",   pos:"Gardien",    num:16, age:23, poids:78, taille:182,         status:"ok",       stress:2, motivation:4, focus:3, confiance:3, stats:{sessions:10,absences:2, chargeWeek:60,wellness:3}, blessures:[], nutrition:"competition", notes:"" },
    { id:"p-robin",     clubId:"usm", name:"Bastien Robin", email:"bastien@player.fr",      pos:"Ailier",     num:7,  age:21, poids:74, taille:178,            status:"ok",       stress:2, motivation:4, focus:4, confiance:3, stats:{sessions:11,absences:1, chargeWeek:70,wellness:4}, blessures:[], nutrition:"competition", notes:"" },
    { id:"p-douiri",    clubId:"usm", name:"Mounir Douiri", email:"mounir@player.fr",      pos:"Ailier",     num:11, age:31, poids:76, taille:176,           status:"ok",       stress:2, motivation:4, focus:4, confiance:4, stats:{sessions:9, absences:3, chargeWeek:55,wellness:3}, blessures:[], nutrition:"competition", notes:"" },
    { id:"p-zorcer",    clubId:"usm", name:"Noam Zorzer Pepi", email:"noam@player.fr",   pos:"Ailier",     num:22, age:19, poids:70, taille:174,           status:"ok",       stress:2, motivation:5, focus:3, confiance:3, stats:{sessions:12,absences:0, chargeWeek:72,wellness:4}, blessures:[], nutrition:"competition", notes:"" },
    { id:"p-blot-tim",  clubId:"usm", name:"Timothée Blottière", email:"timothee@player.fr", pos:"Ailier",     num:10, age:26, poids:85, taille:184,status:"ok",       stress:2, motivation:4, focus:4, confiance:4, stats:{sessions:11,absences:1, chargeWeek:68,wellness:4}, blessures:[], nutrition:"competition", notes:"" },
    { id:"p-blot-leo",  clubId:"usm", name:"Léo Blottière", email:"leo.blottiere@player.fr",      pos:"Arrière",    num:8,  age:24, poids:83, taille:183,     status:"ok",   stress:3, motivation:3, focus:3, confiance:3, stats:{sessions:4, absences:8, chargeWeek:20,wellness:2},
      blessures:[{ zone:"Pied", type:"Fracture de fatigue", dateDebut:"2025-10-01", statut:"en cours", protocole:"Décharge + suivi imagerie + reprise progressive", etapes:["Décharge & repos","Marche sans douleur","Course légère","Intensité progressive","Reprise complète"], etapeActuelle:1 }], nutrition:"blessure", notes:"Courage Léo, la reprise approche !" },
    { id:"p-blot-ant",  clubId:"usm", name:"Antonin Blottière", email:"antonin@player.fr",  pos:"Arrière",    num:9,  age:22, poids:80, taille:181, status:"ok",stress:2, motivation:4, focus:4, confiance:3, stats:{sessions:8, absences:4, chargeWeek:45,wellness:3},
      blessures:[{ zone:"Tendon Achille", type:"Tendinopathie", dateDebut:"2025-09-01", statut:"surveillance", protocole:"Surveillance charge + excentriques", etapes:null, etapeActuelle:0 }], nutrition:"competition", notes:"" },
    { id:"p-faure",     clubId:"usm", name:"Jules Faure", email:"jules@player.fr",        pos:"Arrière",    num:19, age:18, poids:70, taille:175,            status:"ok",       stress:2, motivation:5, focus:3, confiance:3, stats:{sessions:12,absences:0, chargeWeek:75,wellness:5}, blessures:[], nutrition:"competition", notes:"" },
    { id:"p-joseph",    clubId:"usm", name:"Sulyvan Joseph", email:"sulyvan@player.fr",     pos:"Arrière",    num:23, age:18, poids:72, taille:178,           status:"ok",       stress:2, motivation:5, focus:3, confiance:3, stats:{sessions:11,absences:1, chargeWeek:70,wellness:4}, blessures:[], nutrition:"competition", notes:"" },
    { id:"p-robichon",  clubId:"usm", name:"Noé Robichon", email:"noe@player.fr",       pos:"Arrière",    num:14, age:20, poids:79, taille:180,         status:"blesse",       stress:2, motivation:4, focus:3, confiance:3, stats:{sessions:10,absences:2, chargeWeek:62,wellness:3}, blessures:[], nutrition:"competition", notes:"" },
    { id:"p-inocencio", clubId:"usm", name:"Marius Inocencio", email:"marius@player.fr",   pos:"Arrière",    num:17, age:22, poids:81, taille:182,        status:"ok",       stress:2, motivation:4, focus:4, confiance:3, stats:{sessions:12,absences:0, chargeWeek:78,wellness:4}, blessures:[], nutrition:"competition", notes:"" },
    { id:"p-miojecvic", clubId:"usm", name:"Luka Miojecvic", email:"luka@player.fr",     pos:"Arrière",    num:18, age:22, poids:83, taille:183,        status:"ok",       stress:2, motivation:4, focus:4, confiance:4, stats:{sessions:11,absences:1, chargeWeek:65,wellness:4}, blessures:[], nutrition:"competition", notes:"" },
    { id:"p-koutele",   clubId:"usm", name:"Rohann Koutélé", email:"rohann@player.fr",     pos:"Arrière",    num:6,  age:27, poids:86, taille:185,          status:"ok",       stress:2, motivation:4, focus:4, confiance:4, stats:{sessions:10,absences:2, chargeWeek:60,wellness:3}, blessures:[], nutrition:"competition", notes:"" },
    { id:"p-cosnard",   clubId:"usm", name:"Jarod Cosnard", email:"jarod@player.fr",      pos:"Pivot",      num:5,  age:25, poids:95, taille:190,          status:"ok",       stress:2, motivation:4, focus:3, confiance:4, stats:{sessions:12,absences:0, chargeWeek:80,wellness:4}, blessures:[], nutrition:"competition", notes:"" },
    { id:"p-madi",      clubId:"usm", name:"Mathis Madi", email:"mathis@player.fr", email:"mathis@player.fr",        pos:"Pivot",      num:13, age:23, poids:92, taille:188,             status:"ok",       stress:2, motivation:4, focus:3, confiance:3, stats:{sessions:11,absences:1, chargeWeek:72,wellness:3}, blessures:[], nutrition:"competition", notes:"" },
    { id:"p-gilot",     clubId:"usm", name:"Pierre-Matiss Gilot", email:"pierre@player.fr", email:"pierre-matiss@player.fr",pos:"Pivot",      num:21, age:19, poids:90, taille:187,            status:"ok",       stress:2, motivation:5, focus:3, confiance:3, stats:{sessions:12,absences:0, chargeWeek:75,wellness:5}, blessures:[], nutrition:"competition", notes:"" },
  ]
};
