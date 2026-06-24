export type Language = "en" | "am" | "om";

export const translations: Record<string, Record<Language, string>> = {
  // Landing
  welcome: {
    en: "Welcome to Exit Exam Ethiopia",
    am: "እንኳን ወደ Exit Exam Ethiopia መጡ",
    om: "Baga gara Exit Exam Ethiopia dhuftan",
  },
  tagline: {
    en: "Prepare, Practice, Pass.",
    am: "ተዘጋጁ፣ ይለማመዱ፣ ያልፉ።",
    om: "Qophaa'i, Shaakali, Darbi.",
  },
  description: {
    en: "Ethiopia's premier Exit Exam preparation platform. Practice with real exam questions, track your progress, and ace your university exit exam.",
    am: "የኢትዮጵያ ዋና የመውጫ ፈተና ዝግጅት መድረክ። በእውነተኛ ፈተና ጥያቄዎች ይለማመዱ፣ እድገትዎን ይከታተሉ፣ የዩኒቨርሲቲ መውጫ ፈተናዎን ያልፉ።",
    om: "Diriirsa qophii qormaata ba'umsaa Itoophiyaa. Gaaffii qormaataa dhugaa irratti shaakali, guddinakee hordofi, qormaata ba'umsaa yuunivarsiitii kee darbi.",
  },
  getStarted: {
    en: "Get Started Free",
    am: "በነጻ ይጀምሩ",
    om: "Bilisaan Jalqabi",
  },
  // Auth
  signIn: { en: "Sign In", am: "ግባ", om: "Seeni" },
  signUp: { en: "Sign Up", am: "ይመዝገቡ", om: "Galmeessi" },
  fullName: { en: "Full Name", am: "ሙሉ ስም", om: "Maqaa Guutuu" },
  email: { en: "Email", am: "ኢሜይል", om: "Imeelii" },
  password: { en: "Password", am: "የይለፍ ቃል", om: "Jecha Darbii" },
  createAccount: {
    en: "Create Account",
    am: "መለያ ፍጠር",
    om: "Herrega Uumi",
  },
  rememberMe: { en: "Remember me", am: "አስታውሰኝ", om: "Na yaadadhu" },
  // Nav
  home: { en: "Home", am: "መነሻ", om: "Mana" },
  department: { en: "Department", am: "ክፍል", om: "Kutaa" },
  exam: { en: "Exam", am: "ፈተና", om: "Qormaata" },
  settings: { en: "Settings", am: "ቅንብሮች", om: "Qindaa'ina" },
  // Home
  welcomeUser: { en: "Welcome back", am: "እንኳን ደህና ተመለሱ", om: "Baga deebittan" },
  progress: { en: "Progress", am: "እድገት", om: "Guddinni" },
  availableDepts: {
    en: "Available Departments",
    am: "ያሉ ክፍሎች",
    om: "Kutaaleen Jiran",
  },
  latestExams: { en: "Latest Exams", am: "የቅርብ ጊዜ ፈተናዎች", om: "Qormaataalee Haaraa" },
  // Department / Exam
  locked: { en: "Locked", am: "ተቆልፏል", om: "Cufame" },
  unlocked: { en: "Unlocked", am: "ተከፍቷል", om: "Banameera" },
  free: { en: "Free", am: "ነጻ", om: "Bilisaa" },
  payToUnlock: {
    en: "Pay to Unlock",
    am: "ለመክፈት ክፈሉ",
    om: "Kafali Banamsiisi",
  },
  // Payment
  paymentInfo: {
    en: "Payment Information",
    am: "የክፍያ መረጃ",
    om: "Odeeffannoo Kafaltii",
  },
  price: { en: "Price", am: "ዋጋ", om: "Gatii" },
  uploadScreenshot: {
    en: "Upload Payment Screenshot",
    am: "የክፍያ ቅጽበታዊ ገጽ ይጫኑ",
    om: "Suuraa Kafaltii Fe'i",
  },
  // Exam
  question: { en: "Question", am: "ጥያቄ", om: "Gaaffii" },
  previous: { en: "Previous", am: "ቀዳሚ", om: "Duraa" },
  next: { en: "Next", am: "ቀጣይ", om: "Itti aanaa" },
  submit: { en: "Submit", am: "አስገባ", om: "Galchi" },
  score: { en: "Score", am: "ውጤት", om: "Qabxii" },
  correct: { en: "Correct", am: "ትክክል", om: "Sirrii" },
  wrong: { en: "Wrong", am: "ስህተት", om: "Dogoggoraa" },
  explanation: { en: "Explanation", am: "ማብራሪያ", om: "Ibsa" },
  // Settings
  language: { en: "Language", am: "ቋንቋ", om: "Afaan" },
  logout: { en: "Logout", am: "ውጣ", om: "Ba'i" },
  profile: { en: "Profile", am: "ፕሮፋይል", om: "Profaayilii" },
  examHistory: { en: "Exam History", am: "የፈተና ታሪክ", om: "Seenaa Qormaataa" },
  // Admin
  dashboard: { en: "Dashboard", am: "ዳሽቦርድ", om: "Daashboordii" },
  users: { en: "Users", am: "ተጠቃሚዎች", om: "Fayyadamtoota" },
  departments: { en: "Departments", am: "ክፍሎች", om: "Kutaalee" },
  exams: { en: "Exams", am: "ፈተናዎች", om: "Qormaataalee" },
  payments: { en: "Payments", am: "ክፍያዎች", om: "Kafaltiileen" },
  approve: { en: "Approve", am: "አጽድቅ", om: "Mirkaneessi" },
  reject: { en: "Reject", am: "ውድቅ አድርግ", om: "Didi" },
};

export function t(key: string, lang: Language = "en"): string {
  return translations[key]?.[lang] || translations[key]?.en || key;
}
