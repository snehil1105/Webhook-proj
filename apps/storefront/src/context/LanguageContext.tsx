import React, { createContext, useContext, useState } from 'react';

export type LanguageCode = 'EN' | 'HI' | 'TA' | 'TE' | 'KN' | 'ML' | 'BN' | 'MR';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const languageOptions: LanguageOption[] = [
  { code: 'EN', name: 'English', nativeName: 'English' },
  { code: 'HI', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'TA', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'TE', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'KN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ML', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'BN', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'MR', name: 'Marathi', nativeName: 'मराठी' },
];

export const translations: Record<LanguageCode, Record<string, string>> = {
  EN: {},
  HI: {
    // Header
    "Deliver to": "वितरण स्थान",
    "Search for products, brands and more": "उत्पादों, ब्रांडों और अन्य चीज़ों की खोज करें",
    "Account & Lists": "खाता और सूचियाँ",
    "Returns & Orders": "ऑर्डर और वापसी",
    "Cart": "कार्ट",
    "All": "सभी",
    "TODAY'S DEALS": "आज के ऑफर्स",
    "ELECTRONICS": "इलेक्ट्रॉनिक्स",
    "CLOTHES": "कपड़े",
    "BEST SELLERS": "सर्वोत्तम विक्रेता",
    "Customer Service": "ग्राहक सेवा",
    "Your Orders": "आपके ऑर्डर",
    "Your Addresses": "आपके पते",
    "Sign Out": "साइन आउट",
    "Sign In": "साइन इन",
    
    // Home Page
    "Electronics": "इलेक्ट्रॉनिक्स",
    "For You": "आपके लिए",
    
    // Catalog Page
    "Shop Collection": "संग्रह",
    "Browse all premium offerings crafted with care.": "देखभाल के साथ तैयार किए गए सभी प्रीमियम उत्पादों को ब्राउज़ करें।",
    "All Offerings": "सभी उत्पाद",
    "Filter Catalog": "कैटलॉग फ़िल्टर करें",
    "Search items...": "सामान खोजें...",
    "Categories": "श्रेणियाँ",
    "All Categories": "सभी श्रेणियाँ",
    "Max Price": "अधिकतम मूल्य",
    "In Stock Only": "केवल स्टॉक में",
    "Sort By": "क्रमबद्ध करें",
    "Default": "डिफ़ॉल्ट",
    "Price: Low to High": "मूल्य: कम से अधिक",
    "Price: High to Low": "मूल्य: अधिक से कम",
    "Add to Bag": "कार्ट में जोड़ें",
    "Out of Stock": "स्टॉक में नहीं",

    // Product Detail
    "Buy Now": "अभी खरीदें",
    "Return Policy": "वापसी नीति",
    "No Return": "कोई वापसी नहीं",
    "7 Days Return": "7 दिन की वापसी",
    "Free Delivery": "मुफ़्त वितरण",
    
    // Cart Page
    "Shopping Cart": "शॉपिंग कार्ट",
    "Subtotal": "उप-योग",
    "Proceed to Checkout": "चेकआउट के लिए आगे बढ़ें",
    
    // Checkout Page
    "Secure Checkout": "सुरक्षित चेकआउट",
    "Select Shipping Address": "वितरण पता चुनें",
    "Payment Method": "भुगतान का प्रकार",
    "Place Order": "ऑर्डर दें",
    "Order Summary": "ऑर्डर सारांश",
    "Discount": "छूट",
    "Total": "कुल",
    "Cash on Delivery": "नकद भुगतान (COD)",
    "Online Card / UPI": "ऑनलाइन कार्ड / UPI",

    // Order History / Detail
    "Order History": "ऑर्डर इतिहास",
    "Buy Again": "फिर से खरीदें",
    "Not Yet Shipped": "अभी शिप नहीं हुआ",
    "Orders": "ऑर्डर",
    "Order Detail": "ऑर्डर विवरण",
    "Placed on": "ऑर्डर दिनांक",
    "Status": "स्थिति",
    "Shipped": "शिप किया गया",
    "Delivered": "वितरित",
    "Pending": "लंबित",
    "Cancelled": "रद्द",
    "Cancel Order": "ऑर्डर रद्द करें"
  },
  TA: {
    // Header
    "Deliver to": "டெலிவரி செய்ய",
    "Search for products, brands and more": "தயாரிப்புகள், பிராண்டுகள் மற்றும் பலவற்றைத் தேடுங்கள்",
    "Account & Lists": "கணக்கு & பட்டியல்கள்",
    "Returns & Orders": "ஆர்டர்கள் மற்றும் திரும்புதல்",
    "Cart": "கார்ட்",
    "All": "அனைத்தும்",
    "TODAY'S DEALS": "இன்றைய சலுகைகள்",
    "ELECTRONICS": "மின்னணுவியல்",
    "CLOTHES": "ஆடைகள்",
    "BEST SELLERS": "அதிகம் விற்பனையாகும்",
    "Customer Service": "வாடிக்கையாளர் சேவை",
    "Your Orders": "உங்கள் ஆர்டர்கள்",
    "Your Addresses": "உங்கள் முகவரிகள்",
    "Sign Out": "வெளியேறவும்",
    "Sign In": "உள்நுழையவும்",
    
    // Home Page
    "Electronics": "மின்னணுவியல்",
    "For You": "உங்களுக்காக",
    
    // Catalog Page
    "Shop Collection": "சேகரிப்புகள்",
    "Browse all premium offerings crafted with care.": "கவனத்துடன் வடிவமைக்கப்பட்ட அனைத்து பிரீமியம் தயாரிப்புகளையும் ஆராயுங்கள்.",
    "All Offerings": "அனைத்து தயாரிப்புகள்",
    "Filter Catalog": "வடிகட்டி",
    "Search items...": "தேடவும்...",
    "Categories": "வகைகள்",
    "All Categories": "அனைத்து பிரிவுகள்",
    "Max Price": "அதிகபட்ச விலை",
    "In Stock Only": "இருப்பில் உள்ளவை மட்டும்",
    "Sort By": "வரிசைப்படுத்துக",
    "Default": "இயல்புநிலை",
    "Price: Low to High": "விலை: குறைந்ததிலிருந்து அதிகம்",
    "Price: High to Low": "விலை: அதிகத்திலிருந்து குறைவு",
    "Add to Bag": "பையில் சேர்க்கவும்",
    "Out of Stock": "இருப்பில் இல்லை",

    // Product Detail
    "Buy Now": "இப்போது வாங்கவும்",
    "Return Policy": "திரும்பப் பெறும் கொள்கை",
    "No Return": "திரும்பப் பெற முடியாது",
    "7 Days Return": "7 நாட்கள் திரும்பப் பெறலாம்",
    "Free Delivery": "இலவச டெலிவரி",
    
    // Cart Page
    "Shopping Cart": "வணிகக் கூடை",
    "Subtotal": "துணைத் தொகை",
    "Proceed to Checkout": "வாங்கச் செல்லவும்",
    
    // Checkout Page
    "Secure Checkout": "பாதுகாப்பான செக்அவுட்",
    "Select Shipping Address": "டெலிவரி முகவரியைத் தேர்ந்தெடுக்கவும்",
    "Payment Method": "பணம் செலுத்தும் முறை",
    "Place Order": "ஆர்டர் செய்யவும்",
    "Order Summary": "ஆர்டர் சுருக்கம்",
    "Discount": "தள்ளுபடி",
    "Total": "மொத்தம்",
    "Cash on Delivery": "டெலிவரியின் போது பணம் (COD)",
    "Online Card / UPI": "ஆன்லைன் கார்டு / UPI",

    // Order History / Detail
    "Order History": "ஆர்டர் வரலாறு",
    "Buy Again": "மீண்டும் வாங்க",
    "Not Yet Shipped": "இன்னும் அனுப்பப்படவில்லை",
    "Orders": "ஆர்டர்கள்",
    "Order Detail": "ஆர்டர் விவரங்கள்",
    "Placed on": "ஆர்டர் செய்த நாள்",
    "Status": "நிலை",
    "Shipped": "அனுப்பப்பட்டது",
    "Delivered": "டெலிவரி செய்யப்பட்டது",
    "Pending": "நிலுவையில் உள்ளது",
    "Cancelled": "ரத்து செய்யப்பட்டது",
    "Cancel Order": "ஆர்டரை ரத்துசெய்"
  },
  TE: {
    "Deliver to": "ఇక్కడ డెలివరీ చేయండి",
    "Search for products, brands and more": "ఉత్పత్తులు, బ్రాండ్‌లు మరియు మరిన్నింటిని శోధించండి",
    "Account & Lists": "ఖాతా & జాబితాలు",
    "Returns & Orders": "ఆర్డర్‌లు మరియు రిటర్న్స్",
    "Cart": "కార్ట్",
    "All": "అన్నీ",
    "TODAY'S DEALS": "నేటి ఆఫర్లు",
    "ELECTRONICS": "ఎలక్ట్రానిక్స్",
    "CLOTHES": "దుస్తులు",
    "BEST SELLERS": "బెస్ట్ సెల్లర్స్",
    "Customer Service": "కస్టమర్ సర్వీస్",
    "Your Orders": "నా ఆర్డర్‌లు",
    "Your Addresses": "నా చిరునామాలు",
    "Sign Out": "లాగ్ అవుట్",
    "Sign In": "లాగిన్",
    
    "Electronics": "ఎలక్ట్రానిక్స్",
    "For You": "మీ కోసమే",
    
    "Shop Collection": "సేకరణలు",
    "Browse all premium offerings crafted with care.": "జాగ్రత్తగా రూపొందించబడిన అన్ని ప్రీమియం ఉత్పత్తులను బ్రౌజ్ చేయండి.",
    "All Offerings": "అన్ని ఉత్పత్తులు",
    "Filter Catalog": "ఫిల్టర్",
    "Search items...": "శోధించండి...",
    "Categories": "వర్గాలు",
    "All Categories": "అన్ని వర్గాలు",
    "Max Price": "గరిష్ట ధర",
    "In Stock Only": "స్టాక్ లో ఉన్నవి మాత్రమే",
    "Sort By": "క్రమబద్ధీకరించు",
    "Default": "డిఫాల్ట్",
    "Price: Low to High": "ధర: తక్కువ నుండి ఎక్కువ",
    "Price: High to Low": "ధర: ఎక్కువ నుండి తక్కువ",
    "Add to Bag": "కార్ట్‌లో చేర్చండి",
    "Out of Stock": "స్టాక్ లేదు",

    "Buy Now": "ఇప్పుడే కొనండి",
    "Return Policy": "తిరిగి ఇచ్చే విధానం",
    "No Return": "తిరిగి ఇవ్వడం లేదు",
    "7 Days Return": "7 రోజుల రీటర్న్",
    "Free Delivery": "ఉచిత డెలివరీ",
    
    "Shopping Cart": "షాపింగ్ కార్ట్",
    "Subtotal": "ఉపమొత్తం",
    "Proceed to Checkout": "చెక్అవుట్ చేయండి",
    
    "Secure Checkout": "సురక్షిత చెక్అవుట్",
    "Select Shipping Address": "డెలివరీ చిరునామాను ఎంచుకోండి",
    "Payment Method": "చెల్లింపు పద్ధతి",
    "Place Order": "ఆర్డర్ చేయండి",
    "Order Summary": "ఆర్డర్ సారాంశం",
    "Discount": "తగ్గింపు",
    "Total": "మొత్తం",
    "Cash on Delivery": "క్యాష్ ఆన్ డెలివరీ (COD)",
    "Online Card / UPI": "ఆన్‌లైన్ కార్డ్ / UPI",

    "Order History": "ఆర్డర్ హిస్టరీ",
    "Buy Again": "మళ్లీ కొనండి",
    "Not Yet Shipped": "ఇంకా రవాణా చేయబడలేదు",
    "Orders": "ఆర్డర్‌లు",
    "Order Detail": "ఆర్డర్ వివరాలు",
    "Placed on": "ఆర్డర్ చేసిన తేదీ",
    "Status": "స్థితి",
    "Shipped": "రవాణా చేయబడింది",
    "Delivered": "డెలివరీ చేయబడింది",
    "Pending": "పెండింగ్",
    "Cancelled": "రద్దు చేయబడింది",
    "Cancel Order": "ఆర్డర్ రద్దు చేయి"
  },
  KN: {
    "Deliver to": "ಇಲ್ಲಿಗೆ ತಲುಪಿಸಿ",
    "Search for products, brands and more": "ಉತ್ಪನ್ನಗಳು, ಬ್ರಾಂಡ್‌ಗಳು ಮತ್ತು ಹೆಚ್ಚಿನದನ್ನು ಹುಡುಕಿ",
    "Account & Lists": "ಖಾತೆ ಮತ್ತು ಪಟ್ಟಿಗಳು",
    "Returns & Orders": "ಆರ್ಡರ್‌ಗಳು ಮತ್ತು ರಿಟರ್ನ್ಸ್",
    "Cart": "ಕಾರ್ಟ್",
    "All": "ಎಲ್ಲವೂ",
    "TODAY'S DEALS": "ಇಂದಿನ ಕೊಡುಗೆಗಳು",
    "ELECTRONICS": "ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್",
    "CLOTHES": "ಬಟ್ಟೆಗಳು",
    "BEST SELLERS": "ಅತ್ಯುತ್ತಮ ಮಾರಾಟ",
    "Customer Service": "ಗ್ರಾಹಕ ಸೇವೆ",
    "Your Orders": "ನಿಮ್ಮ ಆರ್ಡರ್‌ಗಳು",
    "Your Addresses": "ನಿಮ್ಮ ವಿಳಾಸಗಳು",
    "Sign Out": "ಲಾಗ್ ಔಟ್",
    "Sign In": "ಲಾಗ್ ಇನ್",
    
    "Electronics": "ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್",
    "For You": "ನಿಮಗಾಗಿ",
    
    "Shop Collection": "ಸಂಗ್ರಹಣೆಗಳು",
    "Browse all premium offerings crafted with care.": "ವಿಶೇಷವಾಗಿ ಸಿದ್ಧಪಡಿಸಲಾದ ಪ್ರೀಮಿಯಂ ಉತ್ಪನ್ನಗಳನ್ನು ನೋಡಿ.",
    "All Offerings": "ಎಲ್ಲಾ ಉತ್ಪನ್ನಗಳು",
    "Filter Catalog": "ಫಿಲ್ಟರ್ ಮಾಡಿ",
    "Search items...": "ಹುಡುಕಿ...",
    "Categories": "ವರ್ಗಗಳು",
    "All Categories": "ಎಲ್ಲಾ ವರ್ಗಗಳು",
    "Max Price": "ಗರಿಷ್ಠ ಬೆಲೆ",
    "In Stock Only": "ದಾಸ್ತಾನಿನಲ್ಲಿರುವ ಉತ್ಪನ್ನಗಳು ಮಾತ್ರ",
    "Sort By": "ವಿಂಗಡಿಸು",
    "Default": "ಪೂರ್ವನಿಯೋಜಿತ",
    "Price: Low to High": "ಬೆಲೆ: ಕಡಿಮೆಯಿಂದ ಹೆಚ್ಚು",
    "Price: High to Low": "ಬೆಲೆ: ಹೆಚ್ಚಿನದರಿಂದ ಕಡಿಮೆ",
    "Add to Bag": "ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ",
    "Out of Stock": "ದಾಸ್ತಾನಿನಲ್ಲಿಲ್ಲ",

    "Buy Now": "ಈಗಲೇ ಖರೀದಿಸಿ",
    "Return Policy": "ರಿಟರ್ನ್ ಪಾಲಿಸಿ",
    "No Return": "ರಿಟರ್ನ್ ಇಲ್ಲ",
    "7 Days Return": "7 ದಿನಗಳ ರಿಟರ್ನ್",
    "Free Delivery": "ಉಚಿತ ವಿತರಣೆ",
    
    "Shopping Cart": "ಖರೀದಿ ಕಾರ್ಟ್",
    "Subtotal": "ಉಪಮೊತ್ತ",
    "Proceed to Checkout": "ಖರೀದಿಗೆ ಮುಂದುವರಿಯಿರಿ",
    
    "Secure Checkout": "ಸುರಕ್ಷಿತ ಚೆಕ್‌ಔಟ್",
    "Select Shipping Address": "ವಿಳಾಸವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "Payment Method": "ಪಾವತಿ ವಿಧಾನ",
    "Place Order": "ಆರ್ಡರ್ ಮಾಡಿ",
    "Order Summary": "ಆರ್เดರ್ ಸಾರಾಂಶ",
    "Discount": "ರಿಯಾಯಿತಿ",
    "Total": "ಒಟ್ಟು",
    "Cash on Delivery": "ನಗದು ಪಾವತಿ (COD)",
    "Online Card / UPI": "ಆನ್‌ಲೈನ್ ಕಾರ್ಡ್ / UPI",

    "Order History": "ಆರ್ಡರ್ ಇತಿಹಾಸ",
    "Buy Again": "ಮತ್ತೆ ಖರೀದಿಸಿ",
    "Not Yet Shipped": "ಇನ್ನೂ ರವಾನೆಯಾಗಿಲ್ಲ",
    "Orders": "ಆರ್ಡರ್‌ಗಳು",
    "Order Detail": "ಆರ್ಡರ್ ವಿವರಗಳು",
    "Placed on": "ಆರ್ಡರ್ ಮಾಡಿದ ದಿನಾಂಕ",
    "Status": "ಸ್ಥಿತಿ",
    "Shipped": "ರವಾನಿಸಲಾಗಿದೆ",
    "Delivered": "ತಲುಪಿಸಲಾಗಿದೆ",
    "Pending": "ಬಾಕಿ ಉಳಿದಿದೆ",
    "Cancelled": "ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ",
    "Cancel Order": "ಆರ್ಡರ್ ರದ್ದುಗೊಳಿಸಿ"
  },
  ML: {
    "Deliver to": "ഡെലിവറി ചെയ്യേണ്ട സ്ഥലം",
    "Search for products, brands and more": "ഉൽപ്പന്നങ്ങളും ബ്രാൻഡുകളും മറ്റും തിരയുക",
    "Account & Lists": "അക്കൗണ്ടും ലിസ്റ്റുകളും",
    "Returns & Orders": "ഓർഡറുകളും തിരിച്ചുനൽകലും",
    "Cart": "കാർട്ട്",
    "All": "എല്ലാം",
    "TODAY'S DEALS": "ഇന്നത്തെ ഓഫറുകൾ",
    "ELECTRONICS": "ഇലക്ട്രോണിക്സ്",
    "CLOTHES": "വസ്ത്രങ്ങൾ",
    "BEST SELLERS": "ബെസ്റ്റ് സെല്ലറുകൾ",
    "Customer Service": "കസ്റ്റമർ സർവീസ്",
    "Your Orders": "നിങ്ങളുടെ ഓർഡറുകൾ",
    "Your Addresses": "നിങ്ങളുടെ വിലാസങ്ങൾ",
    "Sign Out": "സൈൻ ഔട്ട്",
    "Sign In": "സൈൻ ഇൻ",
    
    "Electronics": "ഇലക്ട്രോണിക്സ്",
    "For You": "നിങ്ങൾക്കായി",
    
    "Shop Collection": "ശേഖരങ്ങൾ",
    "Browse all premium offerings crafted with care.": "ശ്രദ്ധയോടെ തയ്യാറാക്കിയ പ്രീമിയം ഉൽപ്പന്നങ്ങൾ കാണുക.",
    "All Offerings": "എല്ലാ ഉൽപ്പന്നങ്ങളും",
    "Filter Catalog": "ഫിൽട്ടർ ചെയ്യുക",
    "Search items...": "തിരയുക...",
    "Categories": "വിഭാഗങ്ങൾ",
    "All Categories": "എല്ലാ വിഭാഗങ്ങളും",
    "Max Price": "പരമാവധി വില",
    "In Stock Only": "സ്റ്റോക്കിലുള്ളവ മാത്രം",
    "Sort By": "ക്രമീകരിക്കുക",
    "Default": "ഡിഫോൾട്ട്",
    "Price: Low to High": "വില: കുറഞ്ഞതു മുതൽ ഉയർന്നത് വരെ",
    "Price: High to Low": "വില: ഉയർന്നതു മുതൽ കുറഞ്ഞത് വരെ",
    "Add to Bag": "കാർട്ടിലേക്ക് ചേർക്കുക",
    "Out of Stock": "സ്റ്റോക്കില്ല",

    "Buy Now": "ഇപ്പോൾ വാങ്ങുക",
    "Return Policy": "തിരിച്ചുനൽകൽ നയം",
    "No Return": "തിരിച്ചുനൽകാനാകില്ല",
    "7 Days Return": "7 ദിവസത്തെ റിട്ടേൺ",
    "Free Delivery": "സൗജന്യ ഡെലിവറി",
    
    "Shopping Cart": "ഷോപ്പിംഗ് കാർട്ട്",
    "Subtotal": "സബ്‌ടോട്ടൽ",
    "Proceed to Checkout": "ചെക്ക്ഔട്ടിലേക്ക് പോകുക",
    
    "Secure Checkout": "സുരക്ഷിത ചെക്ക്ഔട്ട്",
    "Select Shipping Address": "വിലാസം തിരഞ്ഞെടുക്കുക",
    "Payment Method": "പേയ്‌മെന്റ് രീതി",
    "Place Order": "ഓർഡർ ചെയ്യുക",
    "Order Summary": "ഓർഡർ സംഗ്രഹം",
    "Discount": "ഡിസ്‌കൗണ്ട്",
    "Total": "ആകെ തുക",
    "Cash on Delivery": "ക്യാഷ് ഓൺ ഡെലിവറി (COD)",
    "Online Card / UPI": "ഓൺലൈൻ കാർഡ് / UPI",

    "Order History": "ഓർഡർ ചരിത്രം",
    "Buy Again": "വീണ്ടും വാങ്ങുക",
    "Not Yet Shipped": "ഇതുവരെ അയച്ചിട്ടില്ല",
    "Orders": "ഓർഡറുകൾ",
    "Order Detail": "ഓർഡർ വിശദാംശങ്ങൾ",
    "Placed on": "ഓർഡർ ചെയ്ത തീയതി",
    "Status": "നില",
    "Shipped": "അയച്ചു",
    "Delivered": "ഡെലിവറി ചെയ്തു",
    "Pending": "തീർപ്പുകൽപ്പിക്കാത്തത്",
    "Cancelled": "റദ്ദാക്കി",
    "Cancel Order": "ഓർഡർ റദ്ദാക്കുക"
  },
  BN: {
    // Header
    "Deliver to": "পৌঁছে দিন",
    "Search for products, brands and more": "পণ্য, ব্র্যান্ড এবং আরও অনেক কিছু খুঁজুন",
    "Account & Lists": "অ্যাকৌন্ট ও তালিকা",
    "Returns & Orders": "অর্ডার ও ফেরত",
    "Cart": "কার্ট",
    "All": "সমস্ত",
    "TODAY'S DEALS": "আজকের অফার",
    "ELECTRONICS": "ইলেকট্রনিক্স",
    "CLOTHES": "পোশাক",
    "BEST SELLERS": "সেরা বিক্রেতা",
    "Customer Service": "গ্রাহক পরিষেবা",
    "Your Orders": "আপনার অর্ডারসমূহ",
    "Your Addresses": "আপনার ঠিকানা",
    "Sign Out": "সাইন আউট",
    "Sign In": "সাইন ইন",
    
    // Home Page
    "Electronics": "ইলেকট্রনিক্স",
    "For You": "আপনার জন্য",
    
    // Catalog Page
    "Shop Collection": "সংগ্রহশালা",
    "Browse all premium offerings crafted with care.": "যত্নের সাথে তৈরি সমস্ত প্রিমিয়াম অফার ব্রাউজ করুন।",
    "All Offerings": "সমস্ত পণ্য",
    "Filter Catalog": "ক্যাটালগ ফিল্টার",
    "Search items...": "পণ্য খুঁজুন...",
    "Categories": "বিভাগসমূহ",
    "All Categories": "সমস্ত বিভাগ",
    "Max Price": "সর্বোচ্চ মূল্য",
    "In Stock Only": "কেবলমাত্র স্টকে আছে",
    "Sort By": "সাজান",
    "Default": "ডিফল্ট",
    "Price: Low to High": "মূল্য: কম থেকে বেশি",
    "Price: High to Low": "মূল্য: বেশি থেকে কম",
    "Add to Bag": "ব্যাগে যোগ করুন",
    "Out of Stock": "স্টকে নেই",

    // Product Detail
    "Buy Now": "এখনই কিনুন",
    "Return Policy": "ফেরত নীতি",
    "No Return": "কোন ফেরত নেই",
    "7 Days Return": "৭ দিন ফেরত যোগ্য",
    "Free Delivery": "বিনামূল্যে বিতরণ",
    
    // Cart Page
    "Shopping Cart": "শপিং কার্ট",
    "Subtotal": "উপমোট",
    "Proceed to Checkout": "চেকআউটে যান",
    
    // Checkout Page
    "Secure Checkout": "নিরাপদ চেকআউট",
    "Select Shipping Address": "ঠিকানা নির্বাচন করুন",
    "Payment Method": "পেমেন্ট পদ্ধতি",
    "Place Order": "অর্ডার সম্পন্ন করুন",
    "Order Summary": "অর্ডারের বিবরণ",
    "Discount": "ছাড়",
    "Total": "মোট",
    "Cash on Delivery": "ক্যাশ অন ডেলিভারি (COD)",
    "Online Card / UPI": "অনলাইন কার্ড / UPI",

    // Order History / Detail
    "Order History": "অর্ডারের ইতিহাস",
    "Buy Again": "আবার কিনুন",
    "Not Yet Shipped": "এখনও পাঠানো হয়নি",
    "Orders": "অর্ডারসমূহ",
    "Order Detail": "অর্ডারের তথ্য",
    "Placed on": "অর্ডার করার তারিখ",
    "Status": "অবস্থা",
    "Shipped": "পাঠানো হয়েছে",
    "Delivered": "বিতরণ করা হয়েছে",
    "Pending": "বকেয়া",
    "Cancelled": "বাতিল",
    "Cancel Order": "অর্ডার বাতিল করুন"
  },
  MR: {
    // Header
    "Deliver to": "येथे वितरित करा",
    "Search for products, brands and more": "उत्पादने, ब्रँड आणि बरेच काही शोधा",
    "Account & Lists": "खाते आणि सूची",
    "Returns & Orders": "ऑर्डर आणि परतावा",
    "Cart": "कार्ट",
    "All": "सर्व",
    "TODAY'S DEALS": "आजच्या डील्स",
    "ELECTRONICS": "इलेक्ट्रॉनिक्स",
    "CLOTHES": "कपडे",
    "BEST SELLERS": "बेंट सेलर",
    "Customer Service": "ग्राहक सेवा",
    "Your Orders": "तुमच्या ऑर्डर्स",
    "Your Addresses": "तुमचे पत्ते",
    "Sign Out": "साइन आउट",
    "Sign In": "साइन इन",
    
    // Home Page
    "Electronics": "इलेक्ट्रॉनिक्स",
    "For You": "तुमच्यासाठी",
    
    // Catalog Page
    "Shop Collection": "संग्रह खरेदी करा",
    "Browse all premium offerings crafted with care.": "काळजीपूर्वक तयार केलेली सर्व प्रीमियम उत्पादने पहा.",
    "All Offerings": "सर्व उत्पादने",
    "Filter Catalog": "कॅटलॉग फिल्टर करा",
    "Search items...": "वस्तू शोधा...",
    "Categories": "वर्ग",
    "All Categories": "सर्व वर्ग",
    "Max Price": "कमाल किंमत",
    "In Stock Only": "फक्त स्टॉकमध्ये",
    "Sort By": "क्रमवारी लावा",
    "Default": "डीफॉल्ट",
    "Price: Low to High": "किंमत: कमी ते जास्त",
    "Price: High to Low": "किंमत: जास्त ते कमी",
    "Add to Bag": "कार्टमध्ये जोडा",
    "Out of Stock": "स्टॉकमध्ये नाही",

    // Product Detail
    "Buy Now": "आता खरेदी करा",
    "Return Policy": "परतावा धोरण",
    "No Return": "परतावा नाही",
    "7 Days Return": "७ दिवसांचा परतावा",
    "Free Delivery": "मोफत वितरण",
    
    // Cart Page
    "Shopping Cart": "शॉपिंग कार्ट",
    "Subtotal": "उप-एकूण",
    "Proceed to Checkout": "खरेदीसाठी पुढे जा",
    
    // Checkout Page
    "Secure Checkout": "सुरक्षित चेकआउट",
    "Select Shipping Address": "पत्ता निवडा",
    "Payment Method": "पेमेंट पद्धत",
    "Place Order": "ऑर्डर द्या",
    "Order Summary": "ऑर्डरचा गोषवारा",
    "Discount": "सवलत",
    "Total": "एकूण",
    "Cash on Delivery": "कॅश ऑन डिलिव्हरी (COD)",
    "Online Card / UPI": "ऑनलाइन कार्ड / UPI",

    // Order History / Detail
    "Order History": "ऑर्डरचा इतिहास",
    "Buy Again": "पुन्हा खरेदी करा",
    "Not Yet Shipped": "अद्याप पाठवले नाही",
    "Orders": "ऑर्डर",
    "Order Detail": "ऑर्डर तपशील",
    "Placed on": "ऑर्डरची तारीख",
    "Status": "स्थिती",
    "Shipped": "पाठवले",
    "Delivered": "वितरित केले",
    "Pending": "प्रलंबित",
    "Cancelled": "रद्द केले",
    "Cancel Order": "ऑर्डर रद्द करा"
  }
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    return (localStorage.getItem('customer_storefront_lang') as LanguageCode) || 'EN';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('customer_storefront_lang', lang);
  };

  const t = (key: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
