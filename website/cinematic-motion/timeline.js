/**
 * LifeQR Cinematic Motion Engine — Master Motion Timeline (After Effects Grade)
 * Supports 3 Languages: Indian English (en_in), Simple Kannada (kn), Simple Hindi (hi)
 * Design & Motion DNA:
 * - Completely dark cinematic environment with subtle emerald tint & illuminated floor reflection
 * - Dynamic kinetic letter fragmentation, 3D card perspective rotation, physical tap shockwaves,
 * - Tactical 360° phosphor radar with live target tracking, and Hospital ER allergy safety interlocks.
 */

const MULTILINGUAL_PLATES = [
  {
    id: 'hook',
    time: { start: 0.0, end: 9.5 },
    en_in: {
      title: "THE EMERGENCY PROBLEM",
      subtitle: "01 / CRITICAL SECONDS",
      script: "In an emergency, every second counts. When a patient cannot speak, doctors lose up to 10 critical minutes searching for blood group and emergency contacts.",
      heading1: "IN AN ACCIDENT,",
      heading2: "SECONDS DECIDE LIFE OR DEATH.",
      badge: "THE CRITICAL TIME // EMERGENCY CARE",
      stats: [
        { num: "8 - 10 MIN", label: "Wasted searching for blood group & family", color: "#ff3344" },
        { num: "70% VICTIMS", label: "Cannot speak due to trauma or shock", color: "#f59e0b" },
        { num: "1 SECOND", label: "Time LifeQR takes to reveal vital info", color: "#00f0ff" }
      ]
    },
    kn: {
      title: "ತುರ್ತು ಪರಿಸ್ಥಿತಿಯ ಸಮಸ್ಯೆ",
      subtitle: "01 / ಅಮೂಲ್ಯ ಸಮಯ",
      script: "ರೋಡ್‌ನಲ್ಲಿ ಅಪಘಾತವಾದಾಗ ಪ್ರತಿಯೊಂದು ಸೆಕೆಂಡ್ ಬಹಳ ಮುಖ್ಯ. ವ್ಯಕ್ತಿ ಪ್ರಜ್ಞೆ ತಪ್ಪಿದ್ದಾಗ, ಅವರ ಬ್ಲಡ್ ಗ್ರೂಪ್ ಮತ್ತು ಮನೆಯವರ ನಂಬರ್ ಹುಡುಕಲು ಹತ್ತಾರು ನಿಮಿಷ ವ್ಯರ್ಥವಾಗುತ್ತದೆ.",
      heading1: "ಅಪಘಾತವಾದಾಗ,",
      heading2: "ಪ್ರತಿಯೊಂದು ಸೆಕೆಂಡ್ ಜೀವ ಉಳಿಸುತ್ತದೆ.",
      badge: "ತುರ್ತು ಪರಿಸ್ಥಿತಿ // ಜೀವ ಉಳಿಸುವ ಕ್ಷಣಗಳು",
      stats: [
        { num: "8 - 10 ನಿಮಿಷ", label: "ಬ್ಲಡ್ ಗ್ರೂಪ್ ಮತ್ತು ಫೋನ್ ನಂಬರ್ ಹುಡುಕಲು ವ್ಯರ್ಥ", color: "#ff3344" },
        { num: "70% ಜನ", label: "ಅಪಘಾತದ ಆಘಾತದಲ್ಲಿ ಮಾತನಾಡಲು ಸಾಧ್ಯವಾಗಲ್ಲ", color: "#f59e0b" },
        { num: "1 ಸೆಕೆಂಡ್", label: "ಲೈಫ್ ಕ್ಯೂಆರ್ ಮಾಹಿತಿ ನೀಡುವ ಸಮಯ", color: "#00f0ff" }
      ]
    },
    hi: {
      title: "इमरजेंसी की समस्या",
      subtitle: "01 / कीमती समय",
      script: "सड़क पर हादसे के वक्त हर एक सेकंड कीमती होता है। जब मरीज बोल नहीं पाता, तो उसका ब्लड ग्रुप और परिवार का फोन नंबर ढूँढने में 10 मिनट बर्बाद हो जाते हैं।",
      heading1: "दुर्घटना के समय,",
      heading2: "हर एक सेकंड जीवन बचाता है।",
      badge: "इमरजेंसी केयर // कीमती समय",
      stats: [
        { num: "8 - 10 मिनट", label: "ब्लड ग्रुप और परिवार का नंबर ढूँढने में बर्बाद", color: "#ff3344" },
        { num: "70% मरीज", label: "चोट के कारण बात नहीं कर पाते", color: "#f59e0b" },
        { num: "1 सेकंड", label: "LifeQR में पूरी जानकारी खुलने का समय", color: "#00f0ff" }
      ]
    }
  },
  {
    id: 'platform',
    time: { start: 9.5, end: 20.0 },
    en_in: {
      title: "MEET LIFEQR",
      subtitle: "02 / THE SIMPLE SOLUTION",
      script: "LifeQR is the simple solution. One smart emergency card. Just tap it to any smartphone, and your medical details open instantly without any app or password.",
      heading1: "MEET LIFEQR",
      heading2: "ONE CARD. TOTAL PROTECTION.",
      badge: "HOW IT WORKS // SIMPLE 4 STEPS",
      steps: [
        { title: "Smart Card in Pocket", desc: "Keep it in your wallet or phone back", color: "#00f0ff" },
        { title: "Touch to Any Phone", desc: "No app to install. No password needed", color: "#E11D2E" },
        { title: "Ambulance Alert", desc: "Nearest crew alerted on live GPS radar", color: "#f59e0b" },
        { title: "Hospital Ready", desc: "Doctors prepare the emergency bed in advance", color: "#10B981" }
      ]
    },
    kn: {
      title: "ಲೈಫ್ ಕ್ಯೂಆರ್ ಪರಿಚಯ",
      subtitle: "02 / ಸರಳ ಪರಿಹಾರ",
      script: "ಇದಕ್ಕೆ ಪರಿಹಾರ ಲೈಫ್ ಕ್ಯೂಆರ್. ಒಂದು ಪುಟ್ಟ ಸ್ಮಾರ್ಟ್ ಕಾರ್ಡ್. ಯಾವುದೇ ಫೋನ್‌ಗೆ ಮುಟ್ಟಿಸಿದರೆ ಸಾಕು, ನಿಮ್ಮ ಸಂಪೂರ್ಣ ಮೆಡಿಕಲ್ ಮಾಹಿತಿ ತಕ್ಷಣ ಓಪನ್ ಆಗುತ್ತೆ.",
      heading1: "ಲೈಫ್ ಕ್ಯೂಆರ್",
      heading2: "ಒಂದೇ ಕಾರ್ಡ್. ಸಂಪೂರ್ಣ ರಕ್ಷಣೆ.",
      badge: "ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ? // 4 ಹಂತಗಳು",
      steps: [
        { title: "ಜೇಬಿನಲ್ಲಿ ಸ್ಮಾರ್ಟ್ ಕಾರ್ಡ್", desc: "ಯಾವಾಗಲೂ ನಿಮ್ಮ ವಾಲೆಟ್‌ನಲ್ಲಿ ಇಟ್ಟುಕೊಳ್ಳಿ", color: "#00f0ff" },
        { title: "ಫೋನ್‌ಗೆ ಮುಟ್ಟಿಸಿ", desc: "ಯಾವುದೇ ಆಪ್ ಬೇಡ, ಪಾಸ್‌ವರ್ಡ್ ಬೇಕಿಲ್ಲ", color: "#E11D2E" },
        { title: "ಆಂಬ್ಯುಲೆನ್ಸ್ ಅಲರ್ಟ್", desc: "ಲೈವ್ ಮ್ಯಾಪ್‌ನಲ್ಲಿ ಸಮೀಪದ ಸಿಬ್ಬಂದಿಗೆ ಮಾಹಿತಿ", color: "#f59e0b" },
        { title: "ಆಸ್ಪತ್ರೆ ಸಿದ್ಧತೆ", desc: "ತಲುಪುವಷ್ಟರಲ್ಲಿ ಬೆಡ್ ಮತ್ತು ಡಾಕ್ಟರ್ ಸಿದ್ಧ", color: "#10B981" }
      ]
    },
    hi: {
      title: "LifeQR का परिचय",
      subtitle: "02 / आसान समाधान",
      script: "इसका आसान समाधान है LifeQR. एक स्मार्ट मेडिकल कार्ड. किसी भी फोन पर बस कार्ड छुवाएं, बिना किसी ऐप या पासवर्ड के आपकी मेडिकल जानकारी खुल जाती है।",
      heading1: "LIFEQR सिस्टम",
      heading2: "एक कार्ड. पूरी सुरक्षा.",
      badge: "यह कैसे काम करता है? // आसान 4 चरण",
      steps: [
        { title: "जेब में स्मार्ट कार्ड", desc: "हमेशा पर्स या फोन के साथ रखें", color: "#00f0ff" },
        { title: "फोन से टच करें", desc: "ना कोई ऐप चाहिए, ना कोई पासवर्ड", color: "#E11D2E" },
        { title: "एम्बुलेंस अलर्ट", desc: "नजदीकी एम्बुलेंस को लाइव मैप पर अलर्ट", color: "#f59e0b" },
        { title: "अस्पताल तैयार", desc: "पहुँचने से पहले इमरजेंसी बेड तैयार", color: "#10B981" }
      ]
    }
  },
  {
    id: 'hardware',
    time: { start: 20.0, end: 32.0 },
    en_in: {
      title: "THE SMART NFC CARD",
      subtitle: "03 / LIFELINE IN YOUR WALLET",
      script: "It looks just like a normal debit card, with an embedded smart chip. It needs zero battery, zero charging, and lasts for over 50 years.",
      heading1: "THE LIFEQR SMART CARD",
      heading2: "NO BATTERY. WORKS FOR 50+ YEARS.",
      badge: "SIMPLE HARDWARE // ZERO CHARGING",
      cardTitle: "LifeQR",
      cardSub: "SMART EMERGENCY PASS",
      patientName: "RAHUL SHARMA",
      bloodLabel: "BLOOD: O+",
      iceLabel: "ICE: +91 98765 43211",
      features: [
        { title: "NO BATTERY NEEDED", desc: "Powers up instantly using the phone's touch" },
        { title: "WORKS ON ANY PHONE", desc: "Works on iPhone and all Android smartphones" },
        { title: "100% WATERPROOF", desc: "Tough medical plastic that never degrades" },
        { title: "STORED IN CHIP", desc: "Blood group and emergency numbers saved inside" }
      ]
    },
    kn: {
      title: "ಸ್ಮಾರ್ಟ್ ಎನ್‌ಎಫ್‌ಸಿ ಕಾರ್ಡ್",
      subtitle: "03 / ಜೇಬಿನಲ್ಲಿ ಜೀವ ರಕ್ಷಕ",
      script: "ಇದು ಎಟಿಎಂ ಕಾರ್ಡ್ ಥರಾನೇ ಇರುತ್ತೆ. ಒಳಗಡೆ ಒಂದು ಚಿಪ್ ಇರುತ್ತೆ. ಇದಕ್ಕೆ ಬ್ಯಾಟರಿ ಬೇಡ, ಚಾರ್ಜಿಂಗ್ ಬೇಕಿಲ್ಲ, 50 ವರ್ಷ ಸುಲಭವಾಗಿ ಬಾಳಿಕೆ ಬರುತ್ತೆ.",
      heading1: "ಲೈಫ್ ಕ್ಯೂಆರ್ ಸ್ಮಾರ್ಟ್ ಕಾರ್ಡ್",
      heading2: "ಬ್ಯಾಟರಿ ಬೇಡ. 50 ವರ್ಷ ಬಾಳಿಕೆ.",
      badge: "ಸರಳ ತಂತ್ರಜ್ಞಾನ // ಚಾರ್ಜಿಂಗ್ ಬೇಕಿಲ್ಲ",
      cardTitle: "ಲೈಫ್ ಕ್ಯೂಆರ್",
      cardSub: "ತುರ್ತು ಮೆಡಿಕಲ್ ಕಾರ್ಡ್",
      patientName: "ರಾಹುಲ್ ಶರ್ಮಾ",
      bloodLabel: "ರಕ್ತ: O+",
      iceLabel: "ಮನೆ: +91 98765 43211",
      features: [
        { title: "ಬ್ಯಾಟರಿ ಬೇಕಿಲ್ಲ", desc: "ಫೋನ್ ಸ್ಪರ್ಶಿಸಿದಾಗ ತಕ್ಷಣ ಕೆಲಸ ಮಾಡುತ್ತದೆ" },
        { title: "ಎಲ್ಲಾ ಫೋನ್‌ಗಳಲ್ಲೂ ಸಪೋರ್ಟ್", desc: "ಐಫೋನ್ ಮತ್ತು ಆಂಡ್ರಾಯ್ಡ್ ಎರಡರಲ್ಲೂ ಕೆಲಸ ಮಾಡುತ್ತೆ" },
        { title: "100% ವಾಟರ್‌ಪ್ರೂಫ್", desc: "ನೀರು, ಮಳೆಗೆ ಯಾವುದೇ ತೊಂದರೆ ಆಗಲ್ಲ" },
        { title: "ಚಿಪ್‌ನಲ್ಲೇ ಮಾಹಿತಿ ಸೇವ್", desc: "ರಕ್ತದ ಗ್ರೂಪ್ ಮತ್ತು ಫೋನ್ ನಂಬರ್ ಕಾರ್ಡ್‌ನಲ್ಲೇ ಇರುತ್ತೆ" }
      ]
    },
    hi: {
      title: "स्मार्ट NFC कार्ड",
      subtitle: "03 / जेब में जीवन रक्षक",
      script: "यह साधारण एटीएम कार्ड जैसा दिखता है, लेकिन अंदर स्मार्ट चिप है। ना कोई बैटरी चाहिए, ना कोई चार्जिंग, 50 साल से भी ज्यादा चलता है।",
      heading1: "LIFEQR स्मार्ट कार्ड",
      heading2: "बैटरी की जरूरत नहीं. 50 साल की लाइफ.",
      badge: "आसान तकनीक // कभी चार्ज नहीं करना",
      cardTitle: "LifeQR",
      cardSub: "इमरजेंसी मेडिकल कार्ड",
      patientName: "राहुल शर्मा",
      bloodLabel: "ब्लड: O+",
      iceLabel: "परिवार: +91 98765 43211",
      features: [
        { title: "बैटरी की जरूरत नहीं", desc: "फोन के टच होते ही अपने आप काम करता है" },
        { title: "हर फोन पर काम करता है", desc: "iPhone और सभी Android फोन पर चलता है" },
        { title: "100% वाटरप्रूफ", desc: "मजबूत कार्ड, पानी या बारिश में कभी खराब नहीं होता" },
        { title: "चिप में डेटा सुरक्षित", desc: "ब्लड ग्रुप और इमरजेंसी नंबर सीधे कार्ड में सुरक्षित" }
      ]
    }
  },
  {
    id: 'tap_physics',
    time: { start: 32.0, end: 44.0 },
    en_in: {
      title: "JUST TOUCH TO ANY PHONE",
      subtitle: "04 / HOW TO USE",
      script: "Super simple to use. Just touch the card to the back of any phone. No app download needed, no password. Opens in less than one second.",
      heading1: "JUST ONE TOUCH.",
      heading2: "NO APP. NO PASSWORD.",
      badge: "UNIVERSAL COMPATIBILITY // 1-SECOND OPEN",
      cardTitle: "LifeQR Smart Card",
      cardPrompt: "TOUCH PHONE HERE",
      bannerTitle: "LifeQR Emergency Pass",
      patientVitals: "Rahul Sharma • Blood: O+",
      allergyVitals: "Allergy Alert: Penicillin",
      openBtnText: "✓ VIEW EMERGENCY DETAILS",
      touchPrompt: "TOUCH CARD TO PHONE",
      benefit1Num: "0.8 SECONDS",
      benefit1Label: "Instant Touch-to-Screen Response",
      benefit2Num: "100% NO APPS",
      benefit2Label: "Works natively on iPhone & Android"
    },
    kn: {
      title: "ಫೋನ್‌ಗೆ ಮುಟ್ಟಿಸಿದರೆ ಸಾಕು",
      subtitle: "04 / ಬಳಸುವ ಸರಳ ವಿಧಾನ",
      script: "ಬಳಸೋದು ತುಂಬಾ ಈಸಿ. ಕಾರ್ಡ್ ಅನ್ನು ಫೋನ್ ಹಿಂದ್ಗಡೆ ಮುಟ್ಟಿಸಿ. ಯಾವುದೇ ಆಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಬೇಕಿಲ್ಲ, ಪಾಸ್‌ವರ್ಡ್ ಬೇಕಿಲ್ಲ, ಕೇವಲ 1 ಸೆಕೆಂಡ್‌ನಲ್ಲಿ ಡೀಟೇಲ್ಸ್ ಬಂದುಬಿಡುತ್ತೆ.",
      heading1: "ಒಂದೇ ಸ್ಪರ್ಶ.",
      heading2: "ಯಾವುದೇ ಆಪ್ ಬೇಡ. ಪಾಸ್‌ವರ್ಡ್ ಬೇಡ.",
      badge: "ಎಲ್ಲಾ ಮೊಬೈಲ್‌ಗಳಲ್ಲೂ ಲಭ್ಯ // 1 ಸೆಕೆಂಡ್ ಸಾಕು",
      cardTitle: "ಲೈಫ್ ಕ್ಯೂಆರ್ ಕಾರ್ಡ್",
      cardPrompt: "ಇಲ್ಲಿ ಫೋನ್ ಮುಟ್ಟಿಸಿ",
      bannerTitle: "ಲೈಫ್ ಕ್ಯೂಆರ್ ತುರ್ತು ಮಾಹಿತಿ",
      patientVitals: "ರಾಹುಲ್ ಶರ್ಮಾ • ರಕ್ತ: O+",
      allergyVitals: "ಅಲರ್ಜಿ ಎಚ್ಚರಿಕೆ: ಪೆನಿಸಿಲಿನ್ ಬೇಡ",
      openBtnText: "✓ ವಿವರ ನೋಡಲು ಮುಟ್ಟಿಸಿ",
      touchPrompt: "ಫೋನ್ ಕಾರ್ಡ್‌ಗೆ ಮುಟ್ಟಿಸಿ",
      benefit1Num: "0.8 ಸೆಕೆಂಡ್",
      benefit1Label: "ಸ್ಪರ್ಶಿಸಿದ ತಕ್ಷಣ ಸ್ಕ್ರೀನ್ ಮೇಲೆ ಮಾಹಿತಿ",
      benefit2Num: "ಆಪ್ ಬೇಕಿಲ್ಲ",
      benefit2Label: "ಐಫೋನ್ ಮತ್ತು ಆಂಡ್ರಾಯ್ಡ್ ಎರಡರಲ್ಲೂ ಕೆಲಸ"
    },
    hi: {
      title: "बस फोन से टच करें",
      subtitle: "04 / इस्तेमाल का आसान तरीका",
      script: "इस्तेमाल करना बहुत आसान है। बस फोन के पीछे कार्ड टच करें। कोई ऐप नहीं चाहिए, कोई पासवर्ड नहीं चाहिए, 1 सेकंड में पूरी डिटेल सामने।",
      heading1: "सिर्फ़ एक टच.",
      heading2: "बिना ऐप. बिना पासवर्ड.",
      badge: "सभी स्मार्टफोन पर सपोर्ट // 1 सेकंड में ओपन",
      cardTitle: "LifeQR स्मार्ट कार्ड",
      cardPrompt: "यहाँ फोन टच करें",
      bannerTitle: "LifeQR इमरजेंसी पास",
      patientVitals: "राहुल शर्मा • ब्लड ग्रुप: O+",
      allergyVitals: "एलर्जी अलर्ट: पेनिसिलिन न दें",
      openBtnText: "✓ पूरी डिटेल देखें",
      touchPrompt: "फोन कार्ड से टच करें",
      benefit1Num: "0.8 सेकंड",
      benefit1Label: "टच करते ही स्क्रीन पर जानकारी",
      benefit2Num: "ऐप की जरूरत नहीं",
      benefit2Label: "iPhone और Android दोनों पर चलता है"
    }
  },
  {
    id: 'dual_tier',
    time: { start: 44.0, end: 56.0 },
    en_in: {
      title: "WORKS WITH ZERO INTERNET",
      subtitle: "05 / OFFLINE PROTECTION",
      script: "No internet or mobile signal? No problem at all. Your blood group, critical allergies, and emergency phone numbers are stored directly inside the card.",
      heading1: "NO INTERNET? NO PROBLEM.",
      heading2: "CRITICAL VITALS WORK 100% OFFLINE.",
      badge: "COMPLETE SIGNAL PROTECTION",
      leftTitle: "100% OFFLINE // NO INTERNET NEEDED",
      leftFields: [
        { l: "BLOOD GROUP", v: "O POSITIVE (O+)", c: "#ff3344" },
        { l: "SEVERE ALLERGIES", v: "PENICILLIN & PEANUTS (CRITICAL)", c: "#ff3344" },
        { l: "DAILY MEDICINES", v: "ASTHMA INHALER (ALBUTEROL)", c: "#00f0ff" },
        { l: "FAMILY CONTACT", v: "PRIYA SHARMA (+91 98765 43211)", c: "#10B981" }
      ],
      rightTitle: "WITH INTERNET // FULL HOSPITAL RECORD",
      rightFields: [
        { l: "FAMILY DOCTOR", v: "DR. AMIT SHARMA (VERIFIED)", c: "#ffffff" },
        { l: "MEDICAL HISTORY", v: "MANIPAL HOSPITAL (CARDIOLOGY)", c: "#ffffff" },
        { l: "LIVE AMBULANCE SOS", v: "NEAREST CREW DISPATCHED IN 3 MIN", c: "#00f0ff" },
        { l: "INSTANT FAMILY SMS", v: "LIVE MAP LINK SENT TO FAMILY", c: "#10B981" }
      ]
    },
    kn: {
      title: "ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದಿದ್ದರೂ ಕೆಲಸ ಮಾಡುತ್ತೆ",
      subtitle: "05 / ಆಫ್‌ಲೈನ್ ರಕ್ಷಣೆ",
      script: "ನೆಟ್‌ವರ್ಕ್ ಅಥವಾ ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದಿದ್ದರೂ ಚಿಂತೆ ಇಲ್ಲ. ರಕ್ತದ ಗುಂಪು, ಅಲರ್ಜಿ ಮತ್ತು ಮನೆಯವರ ಫೋನ್ ನಂಬರ್ ಕಾರ್ಡ್‌ನಲ್ಲೇ ಸೇವ್ ಆಗಿರುತ್ತೆ, ಆಫ್‌ಲೈನ್‌ನಲ್ಲೂ ಕಾಣಿಸುತ್ತೆ.",
      heading1: "ಇಂಟರ್ನೆಟ್ ಇಲ್ಲವೇ? ಚಿಂತೆ ಬೇಡ.",
      heading2: "ಆಫ್‌ಲೈನ್‌ನಲ್ಲೂ ಸಂಪೂರ್ಣ ಮಾಹಿತಿ ಲಭ್ಯ.",
      badge: "ನೆಟ್‌ವರ್ಕ್ ಇಲ್ಲದಿದ್ದರೂ ಸಂಪೂರ್ಣ ರಕ್ಷಣೆ",
      leftTitle: "100% ಆಫ್‌ಲೈನ್ // ಇಂಟರ್ನೆಟ್ ಬೇಕಿಲ್ಲ",
      leftFields: [
        { l: "ರಕ್ತದ ಗುಂಪು", v: "O ಪಾಸಿಟಿವ್ (O+)", c: "#ff3344" },
        { l: "ಖತರ್ನಾಕ್ ಅಲರ್ಜಿ", v: "ಪೆನಿಸಿಲಿನ್ ಮತ್ತು ಕಡಲೆಕಾಯಿ ಅಲರ್ಜಿ", c: "#ff3344" },
        { l: "ದೈನಂದಿನ ಔಷಧಿ", v: "ಅಸ್ತಮಾ ಇನ್‌ಹೇಲರ್", c: "#00f0ff" },
        { l: "ಮನೆಯವರ ಫೋನ್ ನಂಬರ್", v: "ಪ್ರಿಯಾ ಶರ್ಮಾ (+91 98765 43211)", c: "#10B981" }
      ],
      rightTitle: "ಇಂಟರ್ನೆಟ್ ಇದ್ದಾಗ // ಪೂರ್ಣ ಆಸ್ಪತ್ರೆ ದಾಖಲೆ",
      rightFields: [
        { l: "ಕುಟುಂಬದ ವೈದ್ಯರು", v: "ಡಾ. ಅಮಿತ್ ಶರ್ಮಾ (ಪರಿಶೀಲಿಸಲಾಗಿದೆ)", c: "#ffffff" },
        { l: "ಚಿಕಿತ್ಸಾ ಇತಿಹಾಸ", v: "ಮಣಿಪಾಲ್ ಆಸ್ಪತ್ರೆ (ಹೃದಯ ರೋಗ)", c: "#ffffff" },
        { l: "ಲೈವ್ ಆಂಬ್ಯುಲೆನ್ಸ್ ಎಸ್ಒಎಸ್", v: "3 ನಿಮಿಷದಲ್ಲಿ ಸಮೀಪದ ಆಂಬ್ಯುಲೆನ್ಸ್ ರವಾನೆ", c: "#00f0ff" },
        { l: "ಕುಟುಂಬಕ್ಕೆ ತಕ್ಷಣದ SMS", v: "ಮನೆಯವರಿಗೆ ಲೈವ್ ಲೊಕೇಶನ್ ಮೆಸೇಜ್", c: "#10B981" }
      ]
    },
    hi: {
      title: "बिना इंटरनेट के भी काम करता है",
      subtitle: "05 / ऑफलाइन सुरक्षा",
      script: "अगर मोबाइल नेटवर्क या इंटरनेट नहीं है, तब भी फिक्र मत कीजिए। ब्लड ग्रुप, दवाइयों की एलर्जी और परिवार का नंबर सीधे कार्ड में सुरक्षित रहता है।",
      heading1: "इंटरनेट नहीं है? कोई बात नहीं.",
      heading2: "ऑफलाइन में भी तुरंत मिलेगी पूरी डिटेल.",
      badge: "जीरो नेटवर्क पर भी 100% काम",
      leftTitle: "100% ऑफलाइन // बिना इंटरनेट के",
      leftFields: [
        { l: "ब्लड ग्रुप", v: "O पॉजिटिव (O+)", c: "#ff3344" },
        { l: "खतरनाक एलर्जी", v: "पेनिसिलिन और मूंगफली से गंभीर एलर्जी", c: "#ff3344" },
        { l: "रोज की दवाइयाँ", v: "अस्थमा इन्हेलर", c: "#00f0ff" },
        { l: "परिवार का नंबर", v: "प्रिया शर्मा (+91 98765 43211)", c: "#10B981" }
      ],
      rightTitle: "इंटरनेट होने पर // पूरा मेडिकल रिकॉर्ड",
      rightFields: [
        { l: "फैमिली डॉक्टर", v: "डॉ. अमित शर्मा (सत्यापित)", c: "#ffffff" },
        { l: "अस्पताल का इतिहास", v: "मणिपाल अस्पताल (कार्डियोलॉजी)", c: "#ffffff" },
        { l: "लाइव एम्बुलेंस SOS", v: "3 मिनट में नजदीकी एम्बुलेंस रवाना", c: "#00f0ff" },
        { l: "परिवार को तुरंत SMS", v: "परिवार को लाइव लोकेशन मैसेज", c: "#10B981" }
      ]
    }
  },
  {
    id: 'portal_app',
    time: { start: 56.0, end: 68.0 },
    en_in: {
      title: "UPDATE IN 2 MINUTES ONLINE",
      subtitle: "06 / SIMPLE PATIENT PORTAL",
      script: "From your phone or computer, update your medical details and emergency contacts online in just two minutes.",
      heading1: "EASY ONLINE SETUP",
      heading2: "MANAGE YOUR HEALTH IN 2 MINUTES.",
      badge: "PATIENT DASHBOARD & APP",
      steps: [
        { num: "01", title: "Fill Medical Details", desc: "Enter your blood group, severe allergies, and family phone numbers online." },
        { num: "02", title: "Touch Card to Phone", desc: "Touch your physical LifeQR card to your phone to save your data inside the chip." },
        { num: "03", title: "Keep in Wallet", desc: "Keep the card in your pocket or phone case. Total protection 24/7." }
      ]
    },
    kn: {
      title: "ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ 2 ನಿಮಿಷದಲ್ಲಿ ಸೆಟಪ್",
      subtitle: "06 / ಸರಳ ಪೋರ್ಟಲ್ ಮತ್ತು ಆಪ್",
      script: "ನಿಮ್ಮ ಫೋನ್ ಅಥವಾ ವೆಬ್‌ಸೈಟ್ ಮೂಲಕ ಕೇವಲ ಎರಡು ನಿಮಿಷದಲ್ಲಿ ನಿಮ್ಮ ಮೆಡಿಕಲ್ ಮಾಹಿತಿ, ಎಮರ್ಜೆನ್ಸಿ ಕಾಂಟ್ಯಾಕ್ಟ್‌ಗಳನ್ನು ಅಪ್‌ಡೇಟ್ ಮಾಡಿಕೊಳ್ಳಬಹುದು.",
      heading1: "ಸುಲಭ ವೆಬ್‌ಸೈಟ್ ಸೆಟಪ್",
      heading2: "2 ನಿಮಿಷದಲ್ಲಿ ನಿಮ್ಮ ಆರೋಗ್ಯ ಮಾಹಿತಿ ರೆಡಿ.",
      badge: "ಪೇಷೆಂಟ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮತ್ತು ಆಪ್",
      steps: [
        { num: "01", title: "ಮಾಹಿತಿ ನಮೂದಿಸಿ", desc: "ಬ್ಲಡ್ ಗ್ರೂಪ್, ಅಲರ್ಜಿ ಮತ್ತು ಮನೆಯವರ ಫೋನ್ ನಂಬರ್ ಸುಲಭವಾಗಿ ಬರೆಯಿರಿ." },
        { num: "02", title: "ಫೋನ್‌ಗೆ ಕಾರ್ಡ್ ಮುಟ್ಟಿಸಿ", desc: "ಕಾರ್ಡ್ ಸ್ಪರ್ಶಿಸಿದ ತಕ್ಷಣ ಮಾಹಿತಿ ಚಿಪ್‌ನಲ್ಲಿ ಸೇವ್ ಆಗುತ್ತದೆ." },
        { num: "03", title: "ಜೇಬಿನಲ್ಲಿಟ್ಟುಕೊಳ್ಳಿ", desc: "ಕಾರ್ಡ್ ಅನ್ನು ವಾಲೆಟ್ ಅಥವಾ ಫೋನ್ ಕವರ್‌ನಲ್ಲಿಡಿ. 24 ಗಂಟೆ ರಕ್ಷಣೆ." }
      ]
    },
    hi: {
      title: "वेबसाइट पर 2 मिनट में सेटअप",
      subtitle: "06 / आसान पोर्टल और ऐप",
      script: "हमारी वेबसाइट या फोन से सिर्फ 2 मिनट में अपने मेडिकल रिकॉर्ड और इमरजेंसी नंबर आसानी से सेट और अपडेट कर सकते हैं।",
      heading1: "आसान ऑनलाइन सेटअप",
      heading2: "सिर्फ़ 2 मिनट में पूरी प्रोफाइल तैयार.",
      badge: "पेशेंट डैशबोर्ड और मोबाइल ऐप",
      steps: [
        { num: "01", title: "जानकारी भरें", desc: "ब्लड ग्रुप, एलर्जी और परिवार का फोन नंबर ऑनलाइन दर्ज करें।" },
        { num: "02", title: "फोन से कार्ड छुवाएं", desc: "कार्ड टच करते ही जानकारी चिप में सुरक्षित सेव हो जाती है।" },
        { num: "03", title: "पर्स में रखें", desc: "कार्ड को पर्स या फोन कवर में रखें. 24 घंटे सुरक्षा." }
      ]
    }
  },
  {
    id: 'ems_radar',
    time: { start: 68.0, end: 80.0 },
    en_in: {
      title: "LIVE AMBULANCE RADAR",
      subtitle: "07 / RAPID RESCUE",
      script: "In an accident, 1-tap SOS alerts the nearest ambulance on a live radar map so help arrives without any delay.",
      heading1: "LIVE AMBULANCE RADAR",
      heading2: "NEAREST CREW REACHES IN MINUTES.",
      badge: "LIVE GPS DISPATCH WITHIN 3 KM",
      unitLabel: "AMB-UNIT-07",
      distanceUnit: "KM",
      sheetTitle: "EMERGENCY SOS DISPATCH ALERT",
      items: [
        { l: "PATIENT NAME", v: "RAHUL SHARMA", alert: false },
        { l: "BLOOD GROUP", v: "O POSITIVE (O+)", alert: false },
        { l: "SEVERE ALLERGY ALERT", v: "PENICILLIN (DO NOT GIVE)", alert: true },
        { l: "DISTANCE & ETA", v: "1.4 KM AWAY // 3.5 MINUTES", alert: false }
      ],
      deployBtnText: "✓ DISPATCH AMBULANCE IMMEDIATELY"
    },
    kn: {
      title: "ಲೈವ್ ಆಂಬ್ಯುಲೆನ್ಸ್ ರೇಡಾರ್",
      subtitle: "07 / ತುರ್ತು ರಕ್ಷಣೆ",
      script: "ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ 1 ಟ್ಯಾಪ್ ಸಾಕು - ಹತ್ತಿರದ ಆಂಬ್ಯುಲೆನ್ಸ್‌ಗೆ ಲೈವ್ ಮ್ಯಾಪ್‌ನಲ್ಲಿ ಅಲರ್ಟ್ ಹೋಗುತ್ತೆ. ಡ್ರೈವರ್ ತಕ್ಷಣ ನಿಮ್ಮ ಲೊಕೇಶನ್‌ಗೆ ಹೊರಡುತ್ತಾರೆ.",
      heading1: "ಲೈವ್ ಆಂಬ್ಯುಲೆನ್ಸ್ ರೇಡಾರ್",
      heading2: "ಸಮೀಪದ ಆಂಬ್ಯುಲೆನ್ಸ್ ತಕ್ಷಣ ಸ್ಥಳಕ್ಕೆ ಬರುತ್ತೆ.",
      badge: "3 ಕಿಮೀ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಲೈವ್ ಜಿಪಿಎಸ್ ಅಲರ್ಟ್",
      unitLabel: "ಆಂಬ್ಯುಲೆನ್ಸ್-07",
      distanceUnit: "ಕಿ.ಮೀ",
      sheetTitle: "ತುರ್ತು SOS ರಕ್ಷಣಾ ಸಂದೇಶ",
      items: [
        { l: "ರೋಗಿಯ ಹೆಸರು", v: "ರಾಹುಲ್ ಶರ್ಮಾ", alert: false },
        { l: "ರಕ್ತದ ಗುಂಪು", v: "O ಪಾಸಿಟಿವ್ (O+)", alert: false },
        { l: "ಖತರ್ನಾಕ್ ಅಲರ್ಜಿ", v: "ಪೆನಿಸಿಲಿನ್ (ಕೊಡಬಾರದು)", alert: true },
        { l: "ದೂರ ಮತ್ತು ತಲುಪುವ ಸಮಯ", v: "1.4 ಕಿಮೀ ದೂರ // 3.5 ನಿಮಿಷ", alert: false }
      ],
      deployBtnText: "✓ ತಕ್ಷಣ ಆಂಬ್ಯುಲೆನ್ಸ್ ಕಳುಹಿಸಿ"
    },
    hi: {
      title: "लाइव एम्बुलेंस रडार",
      subtitle: "07 / तुरंत मदद",
      script: "इमरजेंसी में सिर्फ 1 टैप से नजदीकी एम्बुलेंस को लाइव मैप पर अलर्ट जाता है, और ड्राइवर तुरंत आपकी लोकेशन पर पहुँचने के लिए निकलता है।",
      heading1: "लाइव एम्बुलेंस रडार",
      heading2: "कुछ ही मिनटों में एम्बुलेंस आपके पास.",
      badge: "3 किमी के दायरे में लाइव जीपीएस अलर्ट",
      unitLabel: "एम्बुलेंस यूनिट-07",
      distanceUnit: "किमी",
      sheetTitle: "इमरजेंसी SOS रेस्क्यू अलर्ट",
      items: [
        { l: "मरीज का नाम", v: "राहुल शर्मा", alert: false },
        { l: "ब्लड ग्रुप", v: "O पॉजिटिव (O+)", alert: false },
        { l: "गंभीर एलर्जी चेतावनी", v: "पेनिसिलिन (दवा न दें)", alert: true },
        { l: "दूरी और पहुँचने का समय", v: "1.4 किमी दूर // 3.5 मिनट", alert: false }
      ],
      deployBtnText: "✓ तुरंत एम्बुलेंस रवाना करें"
    }
  },
  {
    id: 'hospital_er',
    time: { start: 80.0, end: 89.0 },
    en_in: {
      title: "HOSPITAL BED READY IN ADVANCE",
      subtitle: "08 / HOSPITAL EMERGENCY ROOM",
      script: "Before the patient even arrives, the emergency room prepares the trauma bed and doctors already know which medicines are safe to give.",
      heading1: "HOSPITAL READY IN ADVANCE",
      heading2: "ZERO DELAY AT EMERGENCY GATE.",
      badge: "DOCTOR VERIFICATION // TRAUMA ER",
      leftTitle: "EMERGENCY TRAUMA BED RESERVED",
      erInfo: [
        { l: "PATIENT STATUS", v: "ON THE WAY // ARRIVING IN 3 MIN" },
        { l: "EMERGENCY DOCTOR", v: "DR. AMIT SHARMA (ON DUTY)" },
        { l: "BLOOD UNIT PREPARED", v: "O+ BLOOD BAG READY AT BED" }
      ],
      rightTitle: "SAFE MEDICINE VERIFICATION",
      meds: [
        { m: "PENICILLIN DRUGS", s: "BLOCKED: SEVERE LETHAL ALLERGY", c: "#ff3344" },
        { m: "SAFE ALTERNATIVE MEDICINE", s: "SAFE & APPROVED FOR PATIENT", c: "#10B981" },
        { m: "ASTHMA NEBULIZER", s: "INHALER MEDICINE READY AT BED", c: "#10B981" }
      ]
    },
    kn: {
      title: "ಆಸ್ಪತ್ರೆ ತಲುಪುವ ಮೊದಲೇ ಬೆಡ್ ರೆಡಿ",
      subtitle: "08 / ಆಸ್ಪತ್ರೆಯ ತುರ್ತು ವಿಭಾಗ",
      script: "ಆಸ್ಪತ್ರೆಗೆ ತಲುಪುವ ಮೊದಲೇ ತುರ್ತು ವಾರ್ಡ್‌ನಲ್ಲಿ ಬೆಡ್ ರೆಡಿ ಇರುತ್ತೆ, ರಕ್ತ ಸಿದ್ಧವಾಗಿರುತ್ತೆ. ಡಾಕ್ಟರ್‌ಗೆ ಯಾವ ಔಷಧಿ ಕೊಡಬೇಕು ಅಂತ ಮೊದಲೇ ಗೊತ್ತಿರುತ್ತೆ.",
      heading1: "ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಮೊದಲೇ ಸಿದ್ಧತೆ",
      heading2: "ಗೇಟ್ ತಲುಪಿದ ತಕ್ಷಣ ಚಿಕಿತ್ಸೆ ಪ್ರಾರಂಭ.",
      badge: "ವೈದ್ಯರ ಪರಿಶೀಲನೆ // ತುರ್ತು ವಿಭಾಗ",
      leftTitle: "ತುರ್ತು ಚಿಕಿತ್ಸಾ ಬೆಡ್ ಸಿದ್ಧವಾಗಿದೆ",
      erInfo: [
        { l: "ರೋಗಿಯ ಸ್ಥಿತಿ", v: "ಆಂಬ್ಯುಲೆನ್ಸ್‌ನಲ್ಲಿದ್ದಾರೆ // 3 ನಿಮಿಷದಲ್ಲಿ ಆಗಮನ" },
        { l: "ಹಾಜರಿರುವ ವೈದ್ಯರು", v: "ಡಾ. ಅಮಿತ್ ಶರ್ಮಾ (ಸಿದ್ಧವಾಗಿದ್ದಾರೆ)" },
        { l: "ರಕ್ತದ ಯುನಿಟ್ ಸಿದ್ಧ", v: "O+ ರಕ್ತದ ಬ್ಯಾಗ್ ಬೆಡ್ ಬಳಿ ಸಿದ್ಧ" }
      ],
      rightTitle: "ಸುರಕ್ಷಿತ ಔಷಧಿ ಪರಿಶೀಲನೆ",
      meds: [
        { m: "ಪೆನಿಸಿಲಿನ್ ಔಷಧಿ", s: "ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ: ಜೀವಕ್ಕೆ ಅಪಾಯಕಾರಿ ಅಲರ್ಜಿ", c: "#ff3344" },
        { m: "ಸುರಕ್ಷಿತ ಬದಲಿ ಔಷಧಿ", s: "ರೋಗಿಗೆ ಸುರಕ್ಷಿತ ಮತ್ತು ಅನುಮೋದಿತ", c: "#10B981" },
        { m: "ಅಸ್ತಮಾ ಇನ್‌ಹೇಲರ್", s: "ಬೆಡ್ ಬಳಿ ಇನ್‌ಹೇಲರ್ ಸಿದ್ಧ", c: "#10B981" }
      ]
    },
    hi: {
      title: "अस्पताल पहुँचने से पहले बेड तैयार",
      subtitle: "08 / हॉस्पिटल इमरजेंसी रूम",
      script: "मरीज के अस्पताल पहुँचने से पहले ही इमरजेंसी वार्ड में बेड तैयार रहता है और डॉक्टर को पता होता है कि कौन सी दवा देना सुरक्षित है।",
      heading1: "अस्पताल में पहले से तैयारी",
      heading2: "पहुँचते ही बिना देरी इलाज शुरू.",
      badge: "डॉक्टर द्वारा सत्यापन // इमरजेंसी वार्ड",
      leftTitle: "इमरजेंसी ट्रॉमा बेड तैयार",
      erInfo: [
        { l: "मरीज की स्थिति", v: "एम्बुलेंस में हैं // 3 मिनट में आगमन" },
        { l: "इमरजेंसी डॉक्टर", v: "डॉ. अमित शर्मा (ड्यूटी पर तैयार)" },
        { l: "ब्लड यूनिट तैयार", v: "O+ ब्लड बैग बेड पर तैयार रखा है" }
      ],
      rightTitle: "सुरक्षित दवा की जांच",
      meds: [
        { m: "पेनिसिलिन दवाइयाँ", s: "रोकी गईं: जानलेवा गंभीर एलर्जी", c: "#ff3344" },
        { m: "सुरक्षित वैकल्पिक दवा", s: "मरीज के लिए पूरी तरह सुरक्षित", c: "#10B981" },
        { m: "अस्थमा इन्हेलर", s: "बेड पर इन्हेलर तैयार रखा गया", c: "#10B981" }
      ]
    }
  },
  {
    id: 'finale',
    time: { start: 89.0, end: 98.0 },
    en_in: {
      title: "ONE TAP. INSTANT HELP. LIVES SAVED.",
      subtitle: "09 / PROTECT YOUR FAMILY",
      script: "LifeQR. One Tap. Instant Help. Lives Saved. Protect your family today at lifeqr.com.",
      line1: "ONE TAP.",
      line2: "INSTANT HELP.",
      line3: "LIVES SAVED.",
      sub: "LIFEQR EMERGENCY MEDICAL IDENTITY SYSTEM",
      badges: [
        { title: "NFC SMART CARDS", desc: "NO BATTERY // WORKS 50 YRS", color: "#00f0ff" },
        { title: "LIVE AMBULANCE RADAR", desc: "NEAREST DISPATCH IN 3 KM", color: "#E11D2E" },
        { title: "HOSPITAL ER READY", desc: "BED & ALLERGIES PRE-CHECKED", color: "#10B981" }
      ],
      url: "WWW.LIFEQR.COM // PROTECT YOUR FAMILY TODAY"
    },
    kn: {
      title: "ಒಂದೇ ಟ್ಯಾಪ್. ತಕ್ಷಣದ ಸಹಾಯ. ಜೀವ ರಕ್ಷಣೆ.",
      subtitle: "09 / ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ರಕ್ಷಣೆ",
      script: "ಲೈಫ್ ಕ್ಯೂಆರ್. ಒಂದೇ ಟ್ಯಾಪ್. ತಕ್ಷಣದ ಸಹಾಯ. ಜೀವ ರಕ್ಷಣೆ. ಇಂದು ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ರಕ್ಷಣೆ ನೀಡಿ - lifeqr.com.",
      line1: "ಒಂದೇ ಟ್ಯಾಪ್.",
      line2: "ತಕ್ಷಣದ ಸಹಾಯ.",
      line3: "ಜೀವ ರಕ್ಷಣೆ.",
      sub: "ಲೈಫ್ ಕ್ಯೂಆರ್ ತುರ್ತು ವೈದ್ಯಕೀಯ ಗುರುತು ವ್ಯವಸ್ಥೆ",
      badges: [
        { title: "ಸ್ಮಾರ್ಟ್ ಎನ್‌ಎಫ್‌ಸಿ ಕಾರ್ಡ್", desc: "ಬ್ಯಾಟರಿ ಬೇಕಿಲ್ಲ // 50 ವರ್ಷ ಬಾಳಿಕೆ", color: "#00f0ff" },
        { title: "ಲೈವ್ ಆಂಬ್ಯುಲೆನ್ಸ್ ರೇಡಾರ್", desc: "3 ಕಿಮೀ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ತಕ್ಷಣ ರವಾನೆ", color: "#E11D2E" },
        { title: "ಆಸ್ಪತ್ರೆ ಸಿದ್ಧತೆ", desc: "ಬೆಡ್ ಮತ್ತು ಅಲರ್ಜಿ ಮುಂಚಿತ ತಪಾಸಣೆ", color: "#10B981" }
      ],
      url: "WWW.LIFEQR.COM // ಇಂದು ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ರಕ್ಷಣೆ ನೀಡಿ"
    },
    hi: {
      title: "एक टैप. तुरंत मदद. जीवन सुरक्षा.",
      subtitle: "09 / परिवार की सुरक्षा",
      script: "LifeQR. सिर्फ एक टैप. तुरंत मदद. जीवन सुरक्षा. आज ही अपने और अपने परिवार को सुरक्षित करें - lifeqr.com.",
      line1: "एक टैप.",
      line2: "तुरंत मदद.",
      line3: "जीवन सुरक्षा.",
      sub: "LIFEQR इमरजेंसी मेडिकल आइडेंटिटी सिस्टम",
      badges: [
        { title: "स्मार्ट NFC कार्ड", desc: "बैटरी की जरूरत नहीं // 50 साल लाइफ", color: "#00f0ff" },
        { title: "लाइव एम्बुलेंस रडार", desc: "3 किमी के दायरे में तुरंत मदद", color: "#E11D2E" },
        { title: "अस्पताल पहले से तैयार", desc: "बेड और एलर्जी की पहले से जांच", color: "#10B981" }
      ],
      url: "WWW.LIFEQR.COM // आज ही अपने परिवार को सुरक्षित करें"
    }
  }
];

// Motion easing functions
const Easing = {
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeOutBack: (t, s = 1.7) => {
    t = t - 1;
    return t * t * ((s + 1) * t + s) + 1;
  }
};

class MotionSceneTimeline {
  constructor(audio) {
    this.audio = audio;
    this.platesData = MULTILINGUAL_PLATES;
    this.currentLanguage = 'en_in';
    this.totalDuration = 98.0;
    this.currentPlateIndex = -1;
    this.kinetic = window.KineticTypography ? new window.KineticTypography() : null;
    this.particles = this.createParticles(90);
    this.lastSfxTime = -1;
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
    if (this.audio) {
      this.audio.setLanguage(lang);
    }
  }

  getPlates() {
    return this.platesData.map(p => {
      const langData = p[this.currentLanguage] || p.en_in;
      return {
        id: p.id,
        start: p.time.start,
        end: p.time.end,
        title: langData.title,
        subtitle: langData.subtitle,
        script: langData.script,
        raw: langData
      };
    });
  }

  get plates() {
    return this.getPlates();
  }

  createParticles(count) {
    const pts = [];
    for (let i = 0; i < count; i++) {
      pts.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        vx: (Math.random() - 0.5) * 0.9,
        vy: (Math.random() - 0.5) * 0.9,
        size: Math.random() * 2.8 + 0.8,
        alpha: Math.random() * 0.7 + 0.2,
        color: Math.random() > 0.6 ? '#E11D2E' : (Math.random() > 0.4 ? '#00f0ff' : '#10B981')
      });
    }
    return pts;
  }

  getPlateAt(time) {
    const currentList = this.getPlates();
    const idx = currentList.findIndex(p => time >= p.start && time < p.end);
    return idx !== -1 ? { plate: currentList[idx], index: idx } : { plate: currentList[currentList.length - 1], index: currentList.length - 1 };
  }

  // Draw dark cinematic environment with subtle green atmosphere & floor reflection
  drawBackground(ctx, t, plateId) {
    const bgGrad = ctx.createRadialGradient(960, 520, 80, 960, 520, 1150);
    if (plateId === 'hook') {
      bgGrad.addColorStop(0, '#0d0407');
      bgGrad.addColorStop(0.5, '#050203');
      bgGrad.addColorStop(1, '#020101');
    } else if (plateId === 'ems_radar') {
      bgGrad.addColorStop(0, '#031018');
      bgGrad.addColorStop(0.5, '#02080d');
      bgGrad.addColorStop(1, '#010305');
    } else {
      bgGrad.addColorStop(0, '#040f0b'); // Subtle emerald atmosphere
      bgGrad.addColorStop(0.6, '#020805');
      bgGrad.addColorStop(1, '#010302');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1920, 1080);

    // Subtle grid
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.04)';
    const gridSize = 48;
    for (let x = 0; x <= 1920; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1080); ctx.stroke();
    }
    for (let y = 0; y <= 1080; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1920, y); ctx.stroke();
    }
    ctx.restore();

    // Thin horizontal floor reflection at lower-third (Reference PDF)
    const floorY = 885;
    ctx.save();
    const floorGrad = ctx.createLinearGradient(0, floorY - 30, 0, floorY + 40);
    floorGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    floorGrad.addColorStop(0.35, 'rgba(16, 185, 129, 0.16)');
    floorGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.28)');
    floorGrad.addColorStop(0.65, 'rgba(16, 185, 129, 0.10)');
    floorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = floorGrad;
    ctx.fillRect(120, floorY - 30, 1680, 70);

    // Glowing laser floor line
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(180, floorY);
    ctx.lineTo(1740, floorY);
    ctx.stroke();
    ctx.restore();

    // Floating micro-particles
    ctx.save();
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = 1920;
      if (p.x > 1920) p.x = 0;
      if (p.y < 0) p.y = 1080;
      if (p.y > 1080) p.y = 0;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha * 0.45;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.restore();
  }

  // Kinetic Typography Helper: Accurately computes alignment and animates letter fragmentation
  drawKineticTitle(ctx, text, x, y, font, primaryColor, ghostColor = 'rgba(16, 185, 129, 0.28)', offset = 6, animProgress = null) {
    const p = animProgress !== null ? animProgress : 1.0;

    if (this.kinetic && p < 0.98) {
      const match = font.match(/(\d+)px/);
      const fontSize = match ? parseInt(match[1], 10) : 72;

      ctx.save();
      ctx.font = font;
      const totalWidth = ctx.measureText(text).width;
      const centerX = x + totalWidth / 2;
      ctx.restore();

      this.kinetic.drawAssembledWord(ctx, text, centerX, y, p, {
        fontSize,
        color: primaryColor,
        ghostColor,
        ghostOffset: offset
      });
      return;
    }

    ctx.save();
    ctx.font = font;
    ctx.textBaseline = 'middle';

    // Ghost/Outline Layer
    if (ghostColor) {
      ctx.strokeStyle = ghostColor;
      ctx.lineWidth = 2.5;
      ctx.strokeText(text, x + offset, y + Math.floor(offset * 0.7));
    }

    // Foreground text with restrained glow
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 14;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Horizontal Slit Graphic Reveal (Transition element from reference PDF)
  drawSlitReveal(ctx, y, progress, color = '#10B981') {
    if (progress <= 0 || progress >= 1) return;
    ctx.save();
    const w = 1920 * Math.sin(progress * Math.PI);
    const x = (1920 - w) / 2;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, 3);
    ctx.restore();
  }

  // Technical HUD Overlay
  drawHudOverlay(ctx, f, plate) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, 1840, 1000);

    const bSize = 24;
    ctx.strokeStyle = '#E11D2E';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(36, 36 + bSize); ctx.lineTo(36, 36); ctx.lineTo(36 + bSize, 36); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1884 - bSize, 36); ctx.lineTo(1884, 36); ctx.lineTo(1884, 36 + bSize); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(36, 1044 - bSize); ctx.lineTo(36, 1044); ctx.lineTo(36 + bSize, 1044); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1884 - bSize, 1044); ctx.lineTo(1884, 1044); ctx.lineTo(1884, 1044 - bSize); ctx.stroke();

    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#E11D2E';
    ctx.fillText('REC ● 60.0 FPS', 60, 68);

    const cM = Math.floor(f.t / 60).toString().padStart(2, '0');
    const cS = (f.t % 60).toFixed(2).padStart(5, '0');
    const tM = Math.floor(this.totalDuration / 60).toString().padStart(2, '0');
    const tS = (this.totalDuration % 60).toFixed(2).padStart(5, '0');
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`TC ${cM}:${cS} / ${tM}:${tS}`, 1590, 68);

    // Progress line
    const progress = Math.min(1, Math.max(0, f.t / this.totalDuration));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(40, 1038, 1840, 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(40, 1038, 1840 * progress, 2);

    ctx.restore();
  }

  // Subtitle / Karaoke voice bar
  drawSubtitles(ctx, f, plate) {
    ctx.save();
    const words = plate.script.split(' ');
    const activeWordIdx = Math.floor((f.lt / (plate.end - plate.start)) * words.length);

    const boxY = 925;
    const boxH = 64;
    const boxW = 1520;
    const boxX = (1920 - boxW) / 2;

    ctx.fillStyle = 'rgba(6, 9, 15, 0.92)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#E11D2E';
    const tag = this.currentLanguage === 'kn' ? 'VOICE // ಸರಳ ಕನ್ನಡ ವಿವರಣೆ' : (this.currentLanguage === 'hi' ? 'VOICE // आसान हिंदी बातचीत' : 'VOICE // SIMPLE TALK (INDIA)');
    ctx.fillText(tag, boxX + 24, boxY + 20);

    ctx.font = '600 20px "Archivo", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.textBaseline = 'middle';
    let curX = boxX + 24;
    const textY = boxY + 44;

    words.forEach((w, i) => {
      const isCurrent = i === activeWordIdx;
      const isPast = i < activeWordIdx;
      if (isCurrent) {
        ctx.fillStyle = '#00f0ff';
        const wWidth = ctx.measureText(w + ' ').width;
        ctx.fillRect(curX, textY + 12, wWidth - 4, 2);
      } else if (isPast) {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      }
      ctx.fillText(w + ' ', curX, textY);
      curX += ctx.measureText(w + ' ').width;
    });

    ctx.restore();
  }

  render(f, ctx) {
    const { plate, index } = this.getPlateAt(f.t);
    f.lt = f.t - plate.start;
    f.p = Math.min(1, Math.max(0, f.lt / (plate.end - plate.start)));

    if (this.lastPlayedIndex !== index && (!f.seeked || f.triggerAudio)) {
      this.lastPlayedIndex = index;
      this.currentPlateIndex = index;
      this.onPlateEnter(plate, index);
    } else if (this.currentPlateIndex !== index) {
      this.currentPlateIndex = index;
    }

    this.drawBackground(ctx, f.t, plate.id);

    // After Effects Camera Dolly & Dynamic Parallax
    ctx.save();
    // Dynamic punch-in at plate start
    const entryPunch = Math.max(0, 1 - f.lt * 2.5) * 0.08;
    const camScale = 1.0 + f.p * 0.045 + entryPunch;
    const camPanX = Math.sin(f.lt * 0.4) * 10;
    const camPanY = Math.cos(f.lt * 0.3) * 6;
    ctx.translate(960 + camPanX, 540 + camPanY);
    ctx.scale(camScale, camScale);
    ctx.translate(-960, -540);

    switch (plate.id) {
      case 'hook':
        this.renderPlateHook(ctx, f, plate);
        break;
      case 'platform':
        this.renderPlatePlatform(ctx, f, plate);
        break;
      case 'hardware':
        this.renderPlateHardware(ctx, f, plate);
        break;
      case 'tap_physics':
        this.renderPlateTapPhysics(ctx, f, plate);
        break;
      case 'dual_tier':
        this.renderPlateDualTier(ctx, f, plate);
        break;
      case 'portal_app':
        this.renderPlatePortalApp(ctx, f, plate);
        break;
      case 'ems_radar':
        this.renderPlateEmsRadar(ctx, f, plate);
        break;
      case 'hospital_er':
        this.renderPlateHospitalEr(ctx, f, plate);
        break;
      case 'finale':
        this.renderPlateFinale(ctx, f, plate);
        break;
    }
    ctx.restore();

    // Subtle anamorphic vignette
    ctx.save();
    const vignGrad = ctx.createRadialGradient(960, 540, 600, 960, 540, 1100);
    vignGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = vignGrad;
    ctx.fillRect(0, 0, 1920, 1080);
    ctx.restore();

    this.drawHudOverlay(ctx, f, plate);
    this.drawSubtitles(ctx, f, plate);
  }

  onPlateEnter(plate, index) {
    if (this.audio) {
      this.audio.playImpact(1.0);
      this.audio.playWhoosh(1.0);
      this.audio.playSceneNarration(index, this.currentLanguage, plate.script);
    }
  }

  // -------------------------------------------------------------
  // PLATE 1: HOOK (Accident Crisis — Kinetic Slam & ECG Shock)
  // -------------------------------------------------------------
  renderPlateHook(ctx, f, plate) {
    const lt = f.lt;
    const raw = plate.raw;

    if (this.audio && Math.floor(lt * 1.5) !== this.lastSfxTime) {
      this.lastSfxTime = Math.floor(lt * 1.5);
      this.audio.playHeartbeat(1.1);
    }

    ctx.save();
    const p1 = Math.min(1.0, Math.max(0.0, lt / 1.1));
    const p2 = Math.min(1.0, Math.max(0.0, (lt - 0.25) / 1.1));
    const fontH1 = '900 84px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';

    // Kinetic typography letter fragmentation
    this.drawKineticTitle(ctx, raw.heading1, 140, 260, fontH1, '#ffffff', 'rgba(16, 185, 129, 0.35)', 6, p1);
    this.drawKineticTitle(ctx, raw.heading2, 140, 365, fontH1, '#E11D2E', 'rgba(225, 29, 46, 0.4)', 6, p2);

    // Sliding reveal bar
    this.drawSlitReveal(ctx, 395, Math.min(1.0, lt / 0.8), '#00f0ff');

    // Alert badge
    const badgeSlide = Easing.easeOutBack(Math.min(1.0, Math.max(0.0, (lt - 0.5) / 0.8)));
    ctx.save();
    ctx.translate(140, 420 + (1 - badgeSlide) * 30);
    ctx.fillStyle = 'rgba(225, 29, 46, 0.2)';
    ctx.strokeStyle = '#E11D2E';
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, 540, 44);
    ctx.strokeRect(0, 0, 540, 44);
    ctx.font = '700 16px "JetBrains Mono", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#ff5566';
    ctx.textBaseline = 'middle';
    ctx.fillText(raw.badge, 18, 22);
    ctx.restore();

    // High-def Pulsing ECG Waveform with moving scan head
    const ecgY = 600;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 16;
    ctx.beginPath();

    const ecgStart = 140;
    const ecgWidth = 1640;
    let headX = 0, headY = ecgY;

    for (let x = 0; x < ecgWidth; x += 4) {
      const realX = ecgStart + x;
      const wavePos = (x - f.t * 360) % 360;
      let yOffset = 0;
      if (wavePos > 120 && wavePos < 140) yOffset = -25;
      else if (wavePos >= 140 && wavePos < 165) yOffset = 95;
      else if (wavePos >= 165 && wavePos < 195) yOffset = -150;
      else if (wavePos >= 195 && wavePos < 220) yOffset = 50;
      else if (wavePos >= 220 && wavePos < 270) yOffset = -22 * Math.sin((wavePos - 220) * 0.06);

      if (x === 0) ctx.moveTo(realX, ecgY + yOffset);
      else ctx.lineTo(realX, ecgY + yOffset);

      if (x > ecgWidth - 30) {
        headX = realX;
        headY = ecgY + yOffset;
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Glowing scan head
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(headX, headY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 3 Spring-Loaded Stat Cards
    raw.stats.forEach((st, idx) => {
      const cardDelay = 1.0 + idx * 0.25;
      const cardProg = Easing.easeOutBack(Math.min(1.0, Math.max(0.0, (lt - cardDelay) / 0.8)));
      if (cardProg <= 0.01) return;

      const bx = 140 + idx * 560;
      const by = 710 + (1 - cardProg) * 80;

      ctx.save();
      ctx.translate(bx, by);
      ctx.fillStyle = '#111520';
      ctx.strokeStyle = '#273144';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(0, 0, 520, 140, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = st.color;
      ctx.fillRect(0, 0, 8, 140);

      ctx.font = '900 44px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(st.num, 28, 65);

      ctx.font = '600 17px "Archivo", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(st.label, 28, 110);
      ctx.restore();
    });

    ctx.restore();
  }

  // -------------------------------------------------------------
  // PLATE 2: PLATFORM (4-Step Connected Workflow)
  // -------------------------------------------------------------
  renderPlatePlatform(ctx, f, plate) {
    const lt = f.lt;
    const raw = plate.raw;
    ctx.save();

    const p1 = Math.min(1.0, Math.max(0.0, lt / 1.1));
    const fontP1 = '900 72px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    this.drawKineticTitle(ctx, raw.heading1, 140, 180, fontP1, '#ffffff', 'rgba(16, 185, 129, 0.3)', 6, p1);

    ctx.font = '700 24px "JetBrains Mono", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#E11D2E';
    ctx.fillText(raw.heading2, 140, 235);

    // 4 Bento Cards with travelling laser pulses
    const cards = raw.steps;
    cards.forEach((c, idx) => {
      const cardDelay = 0.5 + idx * 0.2;
      const cardProg = Easing.easeOutBack(Math.min(1.0, Math.max(0.0, (lt - cardDelay) / 0.7)));
      if (cardProg <= 0.01) return;

      const cx = 140 + (idx % 2) * 830;
      const cy = 290 + Math.floor(idx / 2) * 280 + (1 - cardProg) * 60;
      const cardW = 790;
      const cardH = 240;

      ctx.fillStyle = '#111520';
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(cx, cy, cardW, cardH, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = c.color;
      ctx.fillRect(cx, cy, 10, cardH);

      ctx.font = '900 18px "JetBrains Mono", monospace';
      ctx.fillText(`STEP 0${idx + 1}`, cx + 36, cy + 50);

      ctx.font = '900 34px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(c.title, cx + 36, cy + 105);

      ctx.font = '600 20px "Archivo", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(c.desc, cx + 36, cy + 155);

      // Rotating energetic step beacon
      const beaconX = cx + cardW - 65;
      const beaconY = cy + 60;
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(beaconX, beaconY, 18 + Math.sin(lt * 4 + idx) * 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(beaconX, beaconY, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  // -------------------------------------------------------------
  // PLATE 3: HARDWARE (True 3D Rotating NFC Smart Card)
  // -------------------------------------------------------------
  renderPlateHardware(ctx, f, plate) {
    const lt = f.lt;
    const raw = plate.raw;
    ctx.save();

    const p1 = Math.min(1.0, Math.max(0.0, lt / 1.1));
    const fontH3 = '900 68px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    this.drawKineticTitle(ctx, raw.heading1, 140, 180, fontH3, '#ffffff', 'rgba(16, 185, 129, 0.3)', 6, p1);

    ctx.font = '700 22px "JetBrains Mono", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#E11D2E';
    ctx.fillText(raw.heading2, 140, 225);

    // Dynamic 3D Rotating Smart Card
    const cardCenterX = 560;
    const cardCenterY = 560;
    const cardW = 560;
    const cardH = 350;

    // 3D rotation angles with periodic flip
    const entranceSpin = Math.max(0, 1 - lt / 1.5) * Math.PI * 2;
    const rotY = Math.sin(lt * 1.4) * 0.35 + entranceSpin;
    const rotX = Math.cos(lt * 1.0) * 0.12;
    const cosY = Math.cos(rotY);

    ctx.save();
    ctx.translate(cardCenterX, cardCenterY);
    ctx.transform(cosY, rotX, 0, 1, 0, 0);

    // Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.beginPath();
    ctx.roundRect(-cardW / 2 + 25, -cardH / 2 + 35, cardW, cardH, 20);
    ctx.fill();

    // Brushed Obsidian Body
    const cardGrad = ctx.createLinearGradient(-cardW / 2, -cardH / 2, cardW / 2, cardH / 2);
    cardGrad.addColorStop(0, '#1c212c');
    cardGrad.addColorStop(0.5, '#0e1117');
    cardGrad.addColorStop(1, '#161a23');
    ctx.fillStyle = cardGrad;
    ctx.beginPath();
    ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 20);
    ctx.fill();

    // Golden Rim
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Microchip
    const chipX = -180, chipY = -40, chipW = 85, chipH = 70;
    const goldGrad = ctx.createLinearGradient(chipX, chipY, chipX + chipW, chipY + chipH);
    goldGrad.addColorStop(0, '#fef08a');
    goldGrad.addColorStop(0.5, '#eab308');
    goldGrad.addColorStop(1, '#ca8a04');
    ctx.fillStyle = goldGrad;
    ctx.beginPath();
    ctx.roundRect(chipX, chipY, chipW, chipH, 8);
    ctx.fill();
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Copper induction loop traces
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.25)';
    ctx.lineWidth = 1.5;
    for (let l = 1; l <= 4; l++) {
      ctx.strokeRect(-cardW / 2 + l * 8, -cardH / 2 + l * 8, cardW - l * 16, cardH - l * 16);
    }

    // Specular highlight sweeping across card
    const sheenPos = ((lt * 0.5) % 2.0) - 0.5;
    const sheenX = -cardW / 2 + sheenPos * cardW * 1.5;
    const sheenGrad = ctx.createLinearGradient(sheenX, -cardH / 2, sheenX + 120, cardH / 2);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
    sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.22)');
    sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = sheenGrad;
    ctx.beginPath();
    ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 20);
    ctx.fill();

    // Card Details
    ctx.font = '900 32px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(raw.cardTitle || 'LifeQR', -cardW / 2 + 45, -cardH / 2 + 65);

    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#E11D2E';
    ctx.fillText(raw.cardSub || 'SMART EMERGENCY PASS', -cardW / 2 + 45, -cardH / 2 + 92);

    ctx.font = '900 24px "Archivo", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(raw.patientName || 'RAHUL SHARMA', -cardW / 2 + 45, 80);

    ctx.fillStyle = '#E11D2E';
    ctx.fillRect(-cardW / 2 + 45, 100, 140, 32);
    ctx.font = '900 15px "Archivo Black", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(raw.bloodLabel || 'BLOOD: O+', -cardW / 2 + 55, 122);

    ctx.font = '700 14px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(raw.iceLabel || 'ICE: +91 98765 43211', -cardW / 2 + 200, 122);
    ctx.restore();

    // Right Side: 4 Feature Cards with Staggered Slide
    const specX = 960;
    raw.features.forEach((feat, idx) => {
      const featDelay = 0.6 + idx * 0.2;
      const featProg = Easing.easeOutBack(Math.min(1.0, Math.max(0.0, (lt - featDelay) / 0.7)));
      if (featProg <= 0.01) return;

      const fy = 290 + idx * 135;
      const fx = specX + (1 - featProg) * 80;

      ctx.fillStyle = '#111520';
      ctx.strokeStyle = '#273144';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(fx, fy, 820, 115, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(fx, fy, 8, 115);

      ctx.font = '900 22px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(feat.title, fx + 32, fy + 44);

      ctx.font = '600 16px "Archivo", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(feat.desc, fx + 32, fy + 82);
    });

    ctx.restore();
  }

  // -------------------------------------------------------------
  // PLATE 4: TAP PROTOCOL (Physical Touch & Shockwave Ripple)
  // -------------------------------------------------------------
  renderPlateTapPhysics(ctx, f, plate) {
    const lt = f.lt;
    const raw = plate.raw;
    ctx.save();

    const p1 = Math.min(1.0, Math.max(0.0, lt / 1.1));
    const fontH4 = '900 68px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    this.drawKineticTitle(ctx, raw.heading1, 140, 180, fontH4, '#ffffff', 'rgba(16, 185, 129, 0.3)', 6, p1);

    ctx.font = '700 22px "JetBrains Mono", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#E11D2E';
    ctx.fillText(raw.heading2, 140, 225);

    // Tap Animation Timing
    const tapCycle = lt % 4.0;
    const isContact = tapCycle >= 1.6 && tapCycle <= 2.8;

    if (isContact && Math.floor(lt * 2) !== this.lastSfxTime) {
      this.lastSfxTime = Math.floor(lt * 2);
      if (this.audio) this.audio.playNfcTap();
    }

    const cardCenterX = 960;
    const cardCenterY = 660;

    // Contactless Expanding Shockwaves
    if (isContact) {
      const shockwaveAge = tapCycle - 1.6;
      ctx.save();
      for (let r = 1; r <= 3; r++) {
        const ringRadius = shockwaveAge * 280 + r * 40;
        const ringAlpha = Math.max(0, 1 - ringRadius / 400);
        ctx.strokeStyle = `rgba(0, 240, 255, ${ringAlpha})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(cardCenterX, cardCenterY - 100, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Modern Smartphone Chassis swooping down
    const phoneY = isContact ? 440 : 360 + Math.sin(tapCycle * 2) * 45;
    ctx.save();
    ctx.translate(cardCenterX, phoneY);

    ctx.fillStyle = '#0a0d14';
    ctx.beginPath();
    ctx.roundRect(-150, -220, 300, 420, 34);
    ctx.fill();
    ctx.strokeStyle = isContact ? '#00f0ff' : '#334155';
    ctx.lineWidth = isContact ? 4 : 3;
    ctx.stroke();

    ctx.fillStyle = isContact ? '#0f172a' : '#111827';
    ctx.beginPath();
    ctx.roundRect(-136, -206, 272, 392, 26);
    ctx.fill();

    // Dynamic Island
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(-40, -195, 80, 24, 12);
    ctx.fill();

    if (isContact) {
      // Verified Emergency Pass Banner sliding into screen
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-120, -150, 240, 125, 12);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 14px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#00f0ff';
      ctx.textAlign = 'center';
      ctx.fillText(raw.bannerTitle || 'LifeQR Emergency Pass', 0, -125);

      ctx.font = '600 12px "Archivo", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(raw.patientVitals || 'Rahul Sharma • Blood: O+', 0, -98);
      ctx.fillText(raw.allergyVitals || 'Allergies: Penicillin', 0, -78);

      ctx.fillStyle = '#10B981';
      ctx.fillRect(-90, -58, 180, 26);
      ctx.font = '900 11px "Archivo Black", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(raw.openBtnText || '✓ VIEW DETAILS', 0, -41);
      ctx.textAlign = 'start';
    } else {
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.fillText(raw.touchPrompt || 'TOUCH CARD TO PHONE', 0, -40);
      ctx.textAlign = 'start';
    }
    ctx.restore();

    // Bottom Benefit Cards
    ctx.fillStyle = '#141824';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.fillRect(140, 780, 520, 110);
    ctx.strokeRect(140, 780, 520, 110);
    ctx.font = '900 36px "Archivo Black", sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(raw.benefit1Num || '0.8 SECONDS', 170, 835);
    ctx.font = '600 16px "Archivo", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(raw.benefit1Label || 'Instant Touch-to-Screen Response', 170, 865);

    ctx.fillRect(1260, 780, 520, 110);
    ctx.strokeRect(1260, 780, 520, 110);
    ctx.font = '900 36px "Archivo Black", sans-serif';
    ctx.fillStyle = '#10B981';
    ctx.fillText(raw.benefit2Num || '100% NO APPS', 1290, 835);
    ctx.font = '600 16px "Archivo", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(raw.benefit2Label || 'Works natively on iPhone & Android', 1290, 865);

    ctx.restore();
  }

  // -------------------------------------------------------------
  // PLATE 5: DUAL TIER (Offline vs Online Split-Screen Scanner)
  // -------------------------------------------------------------
  renderPlateDualTier(ctx, f, plate) {
    const lt = f.lt;
    const raw = plate.raw;
    ctx.save();

    const p1 = Math.min(1.0, Math.max(0.0, lt / 1.1));
    const fontH5 = '900 68px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    this.drawKineticTitle(ctx, raw.heading1, 140, 180, fontH5, '#ffffff', 'rgba(16, 185, 129, 0.3)', 6, p1);

    ctx.font = '700 22px "JetBrains Mono", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#E11D2E';
    ctx.fillText(raw.heading2, 140, 225);

    const boxW = 780, boxH = 580;
    const leftX = 140, rightX = 1000, boxY = 280;

    // LEFT: OFFLINE SAFETY NET
    ctx.fillStyle = '#10141f';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(leftX, boxY, boxW, boxH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.fillRect(leftX, boxY, boxW, 60);
    ctx.font = '900 22px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(raw.leftTitle || '100% OFFLINE // NO INTERNET NEEDED', leftX + 28, boxY + 40);

    raw.leftFields.forEach((fld, idx) => {
      const fy = boxY + 90 + idx * 115;
      ctx.fillStyle = '#161c28';
      ctx.fillRect(leftX + 24, fy, boxW - 48, 95);
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(fld.l, leftX + 44, fy + 32);
      ctx.font = '900 23px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = fld.c;
      ctx.fillText(fld.v, leftX + 44, fy + 70);
    });

    // RIGHT: ONLINE CLOUD
    ctx.fillStyle = '#10141f';
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(rightX, boxY, boxW, boxH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.fillRect(rightX, boxY, boxW, 60);
    ctx.font = '900 22px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#10B981';
    ctx.fillText(raw.rightTitle || 'WITH INTERNET // FULL MEDICAL RECORD', rightX + 28, boxY + 40);

    raw.rightFields.forEach((fld, idx) => {
      const fy = boxY + 90 + idx * 115;
      ctx.fillStyle = '#161c28';
      ctx.fillRect(rightX + 24, fy, boxW - 48, 95);
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(fld.l, rightX + 44, fy + 32);
      ctx.font = '900 23px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = fld.c;
      ctx.fillText(fld.v, rightX + 44, fy + 70);
    });

    // Vertical Laser Scanning Bar sweeping between panels
    const laserY = boxY + 70 + ((lt * 120) % (boxH - 90));
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftX + 20, laserY);
    ctx.lineTo(rightX + boxW - 20, laserY);
    ctx.stroke();

    ctx.restore();
  }

  // -------------------------------------------------------------
  // PLATE 6: PATIENT PORTAL (Interactive Web App Setup)
  // -------------------------------------------------------------
  renderPlatePortalApp(ctx, f, plate) {
    const lt = f.lt;
    const raw = plate.raw;
    ctx.save();

    const p1 = Math.min(1.0, Math.max(0.0, lt / 1.1));
    this.drawKineticTitle(ctx, raw.heading1, 140, 180, '900 68px "Archivo Black", sans-serif', '#ffffff', 'rgba(16, 185, 129, 0.3)', 6, p1);

    ctx.font = '700 22px "JetBrains Mono", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#E11D2E';
    ctx.fillText(raw.heading2, 140, 225);

    raw.steps.forEach((st, idx) => {
      const stepDelay = 0.5 + idx * 0.25;
      const stepProg = Easing.easeOutBack(Math.min(1.0, Math.max(0.0, (lt - stepDelay) / 0.7)));
      if (stepProg <= 0.01) return;

      const sx = 140 + idx * 560;
      const sy = 320 + (1 - stepProg) * 60;

      ctx.fillStyle = '#111520';
      ctx.strokeStyle = '#273144';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(sx, sy, 520, 480, 14);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 64px "Archivo Black", sans-serif';
      ctx.fillStyle = '#E11D2E';
      ctx.fillText(st.num, sx + 40, sy + 90);

      ctx.font = '900 30px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(st.title, sx + 40, sy + 155);

      ctx.font = '600 20px "Archivo", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(st.desc, sx + 40, sy + 215, 440);
    });

    ctx.restore();
  }

  // -------------------------------------------------------------
  // PLATE 7: EMS RADAR (Tactical 360° Sweep & Live Siren)
  // -------------------------------------------------------------
  renderPlateEmsRadar(ctx, f, plate) {
    const lt = f.lt;
    const raw = plate.raw;
    ctx.save();

    if (Math.floor(lt) === 1 && Math.floor(lt) !== this.lastSfxTime) {
      this.lastSfxTime = Math.floor(lt);
      if (this.audio) this.audio.playSiren();
    }

    const p1 = Math.min(1.0, Math.max(0.0, lt / 1.1));
    this.drawKineticTitle(ctx, raw.heading1, 140, 180, '900 68px "Archivo Black", sans-serif', '#ffffff', 'rgba(16, 185, 129, 0.3)', 6, p1);

    ctx.font = '700 22px "JetBrains Mono", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#E11D2E';
    ctx.fillText(raw.heading2, 140, 225);

    // Tactical Radar Screen
    const radarCenterX = 560, radarCenterY = 570, radarRadius = 240;

    ctx.beginPath();
    ctx.arc(radarCenterX, radarCenterY, radarRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#061017';
    ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Concentric Range Rings
    const distUnit = raw.distanceUnit || "KM";
    [0.33, 0.66, 1.0].forEach((ratio, idx) => {
      ctx.beginPath();
      ctx.arc(radarCenterX, radarCenterY, radarRadius * ratio, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
      ctx.fillText(`${idx + 1} ${distUnit}`, radarCenterX + radarRadius * ratio - 45, radarCenterY - 8);
    });

    // 360° Rotating Radar Sweep Beam
    const sweepAngle = lt * 3.2;
    const sweepGrad = ctx.createConicGradient(sweepAngle, radarCenterX, radarCenterY);
    sweepGrad.addColorStop(0, 'rgba(0, 240, 255, 0.45)');
    sweepGrad.addColorStop(0.18, 'rgba(0, 240, 255, 0.0)');
    sweepGrad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');
    ctx.fillStyle = sweepGrad;
    ctx.beginPath();
    ctx.arc(radarCenterX, radarCenterY, radarRadius, 0, Math.PI * 2);
    ctx.fill();

    // Ambulance unit
    ctx.beginPath();
    ctx.arc(radarCenterX, radarCenterY, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fill();
    ctx.font = '800 13px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(raw.unitLabel || 'AMB-UNIT-07', radarCenterX + 18, radarCenterY + 4);

    // Victim SOS marker with expanding ripple pulses
    const victimX = radarCenterX + 115, victimY = radarCenterY - 95;
    const pulseSize = (lt * 35) % 45;
    ctx.beginPath();
    ctx.arc(victimX, victimY, pulseSize, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(225, 29, 46, ${1 - pulseSize / 45})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(victimX, victimY, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#E11D2E';
    ctx.fill();

    // Trajectory Line
    ctx.beginPath();
    ctx.moveTo(radarCenterX, radarCenterY);
    ctx.lineTo(victimX, victimY);
    ctx.strokeStyle = '#ff3344';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = -lt * 40;
    ctx.stroke();
    ctx.setLineDash([]);

    // Right Dispatch Alert Sheet
    const sheetX = 960, sheetY = 280, sheetW = 820, sheetH = 580;
    ctx.fillStyle = '#111520';
    ctx.strokeStyle = '#E11D2E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(sheetX, sheetY, sheetW, sheetH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#E11D2E';
    ctx.fillRect(sheetX, sheetY, sheetW, 60);

    ctx.font = '900 24px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(raw.sheetTitle || 'EMERGENCY SOS ALERT DETECTED', sheetX + 28, sheetY + 40);

    raw.items.forEach((it, idx) => {
      const iy = sheetY + 95 + idx * 82;
      ctx.fillStyle = '#161c28';
      ctx.fillRect(sheetX + 24, iy, sheetW - 48, 68);

      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(it.l, sheetX + 44, iy + 24);

      ctx.font = '900 22px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = it.alert ? '#ff3344' : '#ffffff';
      ctx.fillText(it.v, sheetX + 44, iy + 52);
    });

    ctx.fillStyle = '#10B981';
    ctx.fillRect(sheetX + 24, sheetY + 470, sheetW - 48, 75);
    ctx.font = '900 23px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(raw.deployBtnText || '✓ ACCEPT DISPATCH & DEPLOY AMBULANCE', sheetX + sheetW / 2, sheetY + 517);
    ctx.textAlign = 'start';

    ctx.restore();
  }

  // -------------------------------------------------------------
  // PLATE 8: HOSPITAL ER (Bedside Telemetry & Allergy Interlock)
  // -------------------------------------------------------------
  renderPlateHospitalEr(ctx, f, plate) {
    const lt = f.lt;
    const raw = plate.raw;
    ctx.save();

    const p1 = Math.min(1.0, Math.max(0.0, lt / 1.1));
    this.drawKineticTitle(ctx, raw.heading1, 140, 180, '900 68px "Archivo Black", sans-serif', '#ffffff', 'rgba(16, 185, 129, 0.3)', 6, p1);

    ctx.font = '700 22px "JetBrains Mono", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#E11D2E';
    ctx.fillText(raw.heading2, 140, 225);

    const cardW = 780, cardH = 580;
    const leftX = 140, rightX = 1000, topY = 280;

    // LEFT: TRAUMA BAY
    ctx.fillStyle = '#10141f';
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(leftX, topY, cardW, cardH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.fillRect(leftX, topY, cardW, 60);

    ctx.font = '900 22px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#10B981';
    ctx.fillText(raw.leftTitle || 'EMERGENCY TRAUMA BED RESERVED', leftX + 28, topY + 40);

    raw.erInfo.forEach((ei, idx) => {
      const ey = topY + 90 + idx * 105;
      ctx.fillStyle = '#161c28';
      ctx.fillRect(leftX + 24, ey, cardW - 48, 85);

      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(ei.l, leftX + 44, ey + 28);

      ctx.font = '900 22px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(ei.v, leftX + 44, ey + 62);
    });

    // RIGHT: ALLERGY SAFETY LOCKOUT
    ctx.fillStyle = '#10141f';
    ctx.strokeStyle = '#E11D2E';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(rightX, topY, cardW, cardH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(225, 29, 46, 0.2)';
    ctx.fillRect(rightX, topY, cardW, 60);

    ctx.font = '900 22px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    ctx.fillStyle = '#ff5566';
    ctx.fillText(raw.rightTitle || 'SAFE MEDICINE VERIFICATION', rightX + 28, topY + 40);

    raw.meds.forEach((m, idx) => {
      const my = topY + 90 + idx * 105;
      ctx.fillStyle = '#161c28';
      ctx.fillRect(rightX + 24, my, cardW - 48, 85);

      ctx.font = '900 22px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = m.c;
      ctx.fillText(m.m, rightX + 44, my + 34);

      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(m.s, rightX + 44, my + 64);
    });

    // Flashing red warning banner at lt > 1.8s
    if (lt > 1.8) {
      const flashAlpha = 0.5 + Math.sin(lt * 10) * 0.4;
      ctx.fillStyle = `rgba(239, 68, 68, ${flashAlpha * 0.25})`;
      ctx.fillRect(rightX + 24, topY + 420, cardW - 48, 120);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(rightX + 24, topY + 420, cardW - 48, 120);

      ctx.font = '900 18px "Archivo Black", sans-serif';
      ctx.fillStyle = '#ff4455';
      ctx.textAlign = 'center';
      ctx.fillText('🚨 ALLERGY INTERLOCK ACTIVE: PENICILLIN BLOCKED', rightX + cardW / 2, topY + 465);
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.fillStyle = '#10B981';
      ctx.fillText('✓ SAFE ALTERNATIVE PRE-APPROVED AT BEDSIDE', rightX + cardW / 2, topY + 505);
      ctx.textAlign = 'start';
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // PLATE 9: FINALE (Kinetic Slam Typography Hero)
  // -------------------------------------------------------------
  renderPlateFinale(ctx, f, plate) {
    const lt = f.lt;
    const raw = plate.raw;
    ctx.save();

    // 3 Kinetic Slam Headlines
    const p1 = Math.min(1.0, Math.max(0.0, lt / 0.8));
    const p2 = Math.min(1.0, Math.max(0.0, (lt - 1.2) / 0.8));
    const p3 = Math.min(1.0, Math.max(0.0, (lt - 2.4) / 0.8));

    const slamFont = '900 96px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
    this.drawKineticTitle(ctx, raw.line1, 140, 240, slamFont, '#ffffff', 'rgba(16, 185, 129, 0.4)', 8, p1);
    this.drawKineticTitle(ctx, raw.line2, 140, 360, slamFont, '#E11D2E', 'rgba(225, 29, 46, 0.45)', 8, p2);
    this.drawKineticTitle(ctx, raw.line3, 140, 480, slamFont, '#00f0ff', 'rgba(0, 240, 255, 0.45)', 8, p3);

    // 3 Footer badges
    raw.badges.forEach((bg, idx) => {
      const badgeProg = Easing.easeOutBack(Math.min(1.0, Math.max(0.0, (lt - (3.0 + idx * 0.25)) / 0.7)));
      if (badgeProg <= 0.01) return;

      const bx = 140 + idx * 560;
      const by = 620 + (1 - badgeProg) * 60;

      ctx.fillStyle = '#111520';
      ctx.strokeStyle = bg.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(bx, by, 520, 130, 12);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 24px "Archivo Black", "Noto Sans Kannada", "Noto Sans Devanagari", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(bg.title, bx + 30, by + 50);

      ctx.font = '700 15px "JetBrains Mono", monospace';
      ctx.fillStyle = bg.color;
      ctx.fillText(bg.desc, bx + 30, by + 90);
    });

    // Official CTA link
    if (lt > 4.0) {
      const ctaAlpha = Math.min(1.0, (lt - 4.0) / 0.8);
      ctx.globalAlpha = ctaAlpha;
      ctx.fillStyle = '#00f0ff';
      ctx.font = '900 28px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(raw.url || 'WWW.LIFEQR.COM // PROTECT YOUR FAMILY TODAY', 960, 830);
      ctx.textAlign = 'start';
    }

    ctx.restore();
  }
}

window.MotionSceneTimeline = MotionSceneTimeline;
