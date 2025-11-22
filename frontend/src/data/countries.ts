// Country data for programmatic SEO pages
export interface CountryData {
  name: string;
  slug: string;
  continent: string;
  population: string;
  languages: string[];
  timezone: string;
  popular: boolean;
  description: string;
  keywords: string[];
}

export const countries: CountryData[] = [
  // Asia - High Priority
  {
    name: 'India',
    slug: 'india',
    continent: 'Asia',
    population: '1.4 billion',
    languages: ['Hindi', 'English', 'Bengali', 'Tamil'],
    timezone: 'IST (UTC+5:30)',
    popular: true,
    description: 'Connect with millions of Indians for random video chat. Popular among students from IIT, NIT, and other universities.',
    keywords: ['random video chat india', 'omegle alternative india', 'video chat india', 'talk to strangers india']
  },
  {
    name: 'Philippines',
    slug: 'philippines',
    continent: 'Asia',
    population: '115 million',
    languages: ['Filipino', 'English'],
    timezone: 'PHT (UTC+8)',
    popular: true,
    description: 'Meet friendly Filipinos through free video chat. Known for warm hospitality and English proficiency.',
    keywords: ['random video chat philippines', 'omegle alternative philippines', 'video chat philippines']
  },
  {
    name: 'Indonesia',
    slug: 'indonesia',
    continent: 'Asia',
    population: '277 million',
    languages: ['Indonesian', 'Javanese'],
    timezone: 'WIB (UTC+7)',
    popular: true,
    description: 'Chat with Indonesians from Jakarta, Bali, Surabaya and beyond. Largest Muslim-majority country.',
    keywords: ['random video chat indonesia', 'omegle alternative indonesia', 'video chat indonesia']
  },
  {
    name: 'Pakistan',
    slug: 'pakistan',
    continent: 'Asia',
    population: '235 million',
    languages: ['Urdu', 'English', 'Punjabi'],
    timezone: 'PKT (UTC+5)',
    popular: true,
    description: 'Connect with Pakistanis for random stranger chat. Growing tech community in Karachi, Lahore, Islamabad.',
    keywords: ['random video chat pakistan', 'omegle alternative pakistan', 'video chat pakistan']
  },
  {
    name: 'Bangladesh',
    slug: 'bangladesh',
    continent: 'Asia',
    population: '170 million',
    languages: ['Bengali', 'English'],
    timezone: 'BST (UTC+6)',
    popular: true,
    description: 'Meet Bangladeshis from Dhaka, Chittagong, and beyond. Young, tech-savvy population.',
    keywords: ['random video chat bangladesh', 'omegle alternative bangladesh', 'video chat bangladesh']
  },
  {
    name: 'Vietnam',
    slug: 'vietnam',
    continent: 'Asia',
    population: '98 million',
    languages: ['Vietnamese', 'English'],
    timezone: 'ICT (UTC+7)',
    popular: true,
    description: 'Chat with Vietnamese from Ho Chi Minh City, Hanoi, Da Nang. Rapidly growing digital community.',
    keywords: ['random video chat vietnam', 'omegle alternative vietnam', 'video chat vietnam']
  },
  {
    name: 'Thailand',
    slug: 'thailand',
    continent: 'Asia',
    population: '71 million',
    languages: ['Thai', 'English'],
    timezone: 'ICT (UTC+7)',
    popular: true,
    description: 'Meet friendly Thais for random video chat. Popular travel destination with warm culture.',
    keywords: ['random video chat thailand', 'omegle alternative thailand', 'video chat thailand']
  },
  {
    name: 'Japan',
    slug: 'japan',
    continent: 'Asia',
    population: '125 million',
    languages: ['Japanese', 'English'],
    timezone: 'JST (UTC+9)',
    popular: false,
    description: 'Connect with Japanese for language exchange and cultural chat. Tech-savvy population.',
    keywords: ['random video chat japan', 'omegle alternative japan', 'video chat japan']
  },
  {
    name: 'South Korea',
    slug: 'south-korea',
    continent: 'Asia',
    population: '52 million',
    languages: ['Korean', 'English'],
    timezone: 'KST (UTC+9)',
    popular: false,
    description: 'Chat with South Koreans from Seoul, Busan, Incheon. K-pop and tech hub.',
    keywords: ['random video chat south korea', 'omegle alternative korea', 'video chat korea']
  },
  {
    name: 'Malaysia',
    slug: 'malaysia',
    continent: 'Asia',
    population: '33 million',
    languages: ['Malay', 'English', 'Chinese'],
    timezone: 'MYT (UTC+8)',
    popular: false,
    description: 'Meet Malaysians from Kuala Lumpur, Penang, Johor. Multicultural society.',
    keywords: ['random video chat malaysia', 'omegle alternative malaysia', 'video chat malaysia']
  },

  // North America - High Priority
  {
    name: 'United States',
    slug: 'usa',
    continent: 'North America',
    population: '335 million',
    languages: ['English', 'Spanish'],
    timezone: 'EST/PST (UTC-5 to -8)',
    popular: true,
    description: 'Connect with Americans from NYC, LA, Chicago, Houston. Largest English-speaking market.',
    keywords: ['random video chat usa', 'omegle alternative usa', 'video chat america', 'talk to strangers usa']
  },
  {
    name: 'Canada',
    slug: 'canada',
    continent: 'North America',
    population: '39 million',
    languages: ['English', 'French'],
    timezone: 'EST/PST (UTC-5 to -8)',
    popular: true,
    description: 'Meet Canadians from Toronto, Vancouver, Montreal. Friendly and diverse population.',
    keywords: ['random video chat canada', 'omegle alternative canada', 'video chat canada']
  },
  {
    name: 'Mexico',
    slug: 'mexico',
    continent: 'North America',
    population: '128 million',
    languages: ['Spanish', 'English'],
    timezone: 'CST (UTC-6)',
    popular: true,
    description: 'Chat with Mexicans from Mexico City, Guadalajara, Monterrey. Rich culture and warm people.',
    keywords: ['random video chat mexico', 'omegle alternative mexico', 'video chat mexico']
  },

  // Europe - High Priority
  {
    name: 'United Kingdom',
    slug: 'uk',
    continent: 'Europe',
    population: '68 million',
    languages: ['English'],
    timezone: 'GMT (UTC+0)',
    popular: true,
    description: 'Connect with Brits from London, Manchester, Birmingham. Major English-speaking hub.',
    keywords: ['random video chat uk', 'omegle alternative uk', 'video chat uk', 'talk to strangers uk']
  },
  {
    name: 'Germany',
    slug: 'germany',
    continent: 'Europe',
    population: '84 million',
    languages: ['German', 'English'],
    timezone: 'CET (UTC+1)',
    popular: true,
    description: 'Meet Germans from Berlin, Munich, Hamburg. Tech-savvy and educated population.',
    keywords: ['random video chat germany', 'omegle alternative germany', 'video chat germany']
  },
  {
    name: 'France',
    slug: 'france',
    continent: 'Europe',
    population: '68 million',
    languages: ['French', 'English'],
    timezone: 'CET (UTC+1)',
    popular: true,
    description: 'Chat with French from Paris, Lyon, Marseille. Romance language and culture.',
    keywords: ['random video chat france', 'omegle alternative france', 'video chat france']
  },
  {
    name: 'Italy',
    slug: 'italy',
    continent: 'Europe',
    population: '59 million',
    languages: ['Italian', 'English'],
    timezone: 'CET (UTC+1)',
    popular: false,
    description: 'Connect with Italians from Rome, Milan, Naples. Rich history and passionate culture.',
    keywords: ['random video chat italy', 'omegle alternative italy', 'video chat italy']
  },
  {
    name: 'Spain',
    slug: 'spain',
    continent: 'Europe',
    population: '47 million',
    languages: ['Spanish', 'English'],
    timezone: 'CET (UTC+1)',
    popular: true,
    description: 'Meet Spaniards from Madrid, Barcelona, Valencia. Vibrant culture and nightlife.',
    keywords: ['random video chat spain', 'omegle alternative spain', 'video chat spain']
  },
  {
    name: 'Poland',
    slug: 'poland',
    continent: 'Europe',
    population: '38 million',
    languages: ['Polish', 'English'],
    timezone: 'CET (UTC+1)',
    popular: false,
    description: 'Chat with Poles from Warsaw, Krakow, Wroclaw. Growing tech community.',
    keywords: ['random video chat poland', 'omegle alternative poland', 'video chat poland']
  },
  {
    name: 'Netherlands',
    slug: 'netherlands',
    continent: 'Europe',
    population: '18 million',
    languages: ['Dutch', 'English'],
    timezone: 'CET (UTC+1)',
    popular: false,
    description: 'Connect with Dutch from Amsterdam, Rotterdam, The Hague. Excellent English speakers.',
    keywords: ['random video chat netherlands', 'omegle alternative netherlands', 'video chat netherlands']
  },

  // South America
  {
    name: 'Brazil',
    slug: 'brazil',
    continent: 'South America',
    population: '215 million',
    languages: ['Portuguese', 'English'],
    timezone: 'BRT (UTC-3)',
    popular: true,
    description: 'Meet Brazilians from São Paulo, Rio, Brasília. Largest South American country.',
    keywords: ['random video chat brazil', 'omegle alternative brazil', 'video chat brazil']
  },
  {
    name: 'Argentina',
    slug: 'argentina',
    continent: 'South America',
    population: '46 million',
    languages: ['Spanish', 'English'],
    timezone: 'ART (UTC-3)',
    popular: false,
    description: 'Chat with Argentinians from Buenos Aires, Córdoba, Rosario. Passionate culture.',
    keywords: ['random video chat argentina', 'omegle alternative argentina', 'video chat argentina']
  },
  {
    name: 'Colombia',
    slug: 'colombia',
    continent: 'South America',
    population: '52 million',
    languages: ['Spanish', 'English'],
    timezone: 'COT (UTC-5)',
    popular: true,
    description: 'Connect with Colombians from Bogotá, Medellín, Cali. Warm and friendly people.',
    keywords: ['random video chat colombia', 'omegle alternative colombia', 'video chat colombia']
  },

  // Middle East & Africa
  {
    name: 'Turkey',
    slug: 'turkey',
    continent: 'Europe/Asia',
    population: '85 million',
    languages: ['Turkish', 'English'],
    timezone: 'TRT (UTC+3)',
    popular: true,
    description: 'Meet Turks from Istanbul, Ankara, Izmir. Bridge between Europe and Asia.',
    keywords: ['random video chat turkey', 'omegle alternative turkey', 'video chat turkey']
  },
  {
    name: 'Egypt',
    slug: 'egypt',
    continent: 'Africa',
    population: '105 million',
    languages: ['Arabic', 'English'],
    timezone: 'EET (UTC+2)',
    popular: false,
    description: 'Chat with Egyptians from Cairo, Alexandria, Giza. Ancient civilization meets modern tech.',
    keywords: ['random video chat egypt', 'omegle alternative egypt', 'video chat egypt']
  },
  {
    name: 'South Africa',
    slug: 'south-africa',
    continent: 'Africa',
    population: '60 million',
    languages: ['English', 'Afrikaans', 'Zulu'],
    timezone: 'SAST (UTC+2)',
    popular: false,
    description: 'Connect with South Africans from Johannesburg, Cape Town, Durban. Diverse nation.',
    keywords: ['random video chat south africa', 'omegle alternative south africa', 'video chat south africa']
  },

  // Oceania
  {
    name: 'Australia',
    slug: 'australia',
    continent: 'Oceania',
    population: '26 million',
    languages: ['English'],
    timezone: 'AEST (UTC+10)',
    popular: true,
    description: 'Meet Aussies from Sydney, Melbourne, Brisbane. Laid-back English speakers.',
    keywords: ['random video chat australia', 'omegle alternative australia', 'video chat australia']
  },
  {
    name: 'New Zealand',
    slug: 'new-zealand',
    continent: 'Oceania',
    population: '5 million',
    languages: ['English', 'Maori'],
    timezone: 'NZST (UTC+12)',
    popular: false,
    description: 'Chat with Kiwis from Auckland, Wellington, Christchurch. Scenic beauty and friendly people.',
    keywords: ['random video chat new zealand', 'omegle alternative new zealand', 'video chat new zealand']
  },

  // Additional High-Traffic Countries
  {
    name: 'Saudi Arabia',
    slug: 'saudi-arabia',
    continent: 'Middle East',
    population: '36 million',
    languages: ['Arabic', 'English'],
    timezone: 'AST (UTC+3)',
    popular: false,
    description: 'Connect with Saudis from Riyadh, Jeddah, Mecca. Growing digital adoption.',
    keywords: ['random video chat saudi arabia', 'omegle alternative saudi', 'video chat saudi']
  },
  {
    name: 'United Arab Emirates',
    slug: 'uae',
    continent: 'Middle East',
    population: '10 million',
    languages: ['Arabic', 'English'],
    timezone: 'GST (UTC+4)',
    popular: false,
    description: 'Meet UAE residents from Dubai, Abu Dhabi, Sharjah. International business hub.',
    keywords: ['random video chat uae', 'omegle alternative uae', 'video chat dubai']
  },
  {
    name: 'Nigeria',
    slug: 'nigeria',
    continent: 'Africa',
    population: '223 million',
    languages: ['English', 'Yoruba', 'Igbo', 'Hausa'],
    timezone: 'WAT (UTC+1)',
    popular: false,
    description: 'Chat with Nigerians from Lagos, Abuja, Port Harcourt. Largest African population.',
    keywords: ['random video chat nigeria', 'omegle alternative nigeria', 'video chat nigeria']
  },
  {
    name: 'Russia',
    slug: 'russia',
    continent: 'Europe/Asia',
    population: '144 million',
    languages: ['Russian', 'English'],
    timezone: 'MSK (UTC+3)',
    popular: false,
    description: 'Connect with Russians from Moscow, St. Petersburg, Novosibirsk. Largest country by area.',
    keywords: ['random video chat russia', 'omegle alternative russia', 'video chat russia']
  },
  {
    name: 'Ukraine',
    slug: 'ukraine',
    continent: 'Europe',
    population: '38 million',
    languages: ['Ukrainian', 'Russian', 'English'],
    timezone: 'EET (UTC+2)',
    popular: false,
    description: 'Meet Ukrainians from Kyiv, Kharkiv, Odesa. Growing tech community.',
    keywords: ['random video chat ukraine', 'omegle alternative ukraine', 'video chat ukraine']
  },
  {
    name: 'Singapore',
    slug: 'singapore',
    continent: 'Asia',
    population: '6 million',
    languages: ['English', 'Mandarin', 'Malay', 'Tamil'],
    timezone: 'SGT (UTC+8)',
    popular: false,
    description: 'Chat with Singaporeans. Tech hub of Southeast Asia with multilingual population.',
    keywords: ['random video chat singapore', 'omegle alternative singapore', 'video chat singapore']
  },
  {
    name: 'Hong Kong',
    slug: 'hong-kong',
    continent: 'Asia',
    population: '7.5 million',
    languages: ['Cantonese', 'English', 'Mandarin'],
    timezone: 'HKT (UTC+8)',
    popular: false,
    description: 'Connect with Hong Kongers. International financial center with East-West blend.',
    keywords: ['random video chat hong kong', 'omegle alternative hong kong', 'video chat hong kong']
  },
  {
    name: 'Sweden',
    slug: 'sweden',
    continent: 'Europe',
    population: '10 million',
    languages: ['Swedish', 'English'],
    timezone: 'CET (UTC+1)',
    popular: false,
    description: 'Meet Swedes from Stockholm, Gothenburg, Malmö. High English proficiency.',
    keywords: ['random video chat sweden', 'omegle alternative sweden', 'video chat sweden']
  },
  {
    name: 'Norway',
    slug: 'norway',
    continent: 'Europe',
    population: '5.5 million',
    languages: ['Norwegian', 'English'],
    timezone: 'CET (UTC+1)',
    popular: false,
    description: 'Chat with Norwegians from Oslo, Bergen, Trondheim. High quality of life.',
    keywords: ['random video chat norway', 'omegle alternative norway', 'video chat norway']
  },
  {
    name: 'Denmark',
    slug: 'denmark',
    continent: 'Europe',
    population: '6 million',
    languages: ['Danish', 'English'],
    timezone: 'CET (UTC+1)',
    popular: false,
    description: 'Connect with Danes from Copenhagen, Aarhus, Odense. Excellent English speakers.',
    keywords: ['random video chat denmark', 'omegle alternative denmark', 'video chat denmark']
  },
  {
    name: 'Finland',
    slug: 'finland',
    continent: 'Europe',
    population: '5.5 million',
    languages: ['Finnish', 'Swedish', 'English'],
    timezone: 'EET (UTC+2)',
    popular: false,
    description: 'Meet Finns from Helsinki, Espoo, Tampere. Tech-savvy Nordic country.',
    keywords: ['random video chat finland', 'omegle alternative finland', 'video chat finland']
  },
  {
    name: 'Austria',
    slug: 'austria',
    continent: 'Europe',
    population: '9 million',
    languages: ['German', 'English'],
    timezone: 'CET (UTC+1)',
    popular: false,
    description: 'Chat with Austrians from Vienna, Salzburg, Innsbruck. Alpine culture.',
    keywords: ['random video chat austria', 'omegle alternative austria', 'video chat austria']
  },
  {
    name: 'Belgium',
    slug: 'belgium',
    continent: 'Europe',
    population: '12 million',
    languages: ['Dutch', 'French', 'German', 'English'],
    timezone: 'CET (UTC+1)',
    popular: false,
    description: 'Connect with Belgians from Brussels, Antwerp, Ghent. Multilingual EU hub.',
    keywords: ['random video chat belgium', 'omegle alternative belgium', 'video chat belgium']
  },
  {
    name: 'Switzerland',
    slug: 'switzerland',
    continent: 'Europe',
    population: '9 million',
    languages: ['German', 'French', 'Italian', 'English'],
    timezone: 'CET (UTC+1)',
    popular: false,
    description: 'Meet Swiss from Zurich, Geneva, Basel. Multilingual and international.',
    keywords: ['random video chat switzerland', 'omegle alternative switzerland', 'video chat switzerland']
  },
  {
    name: 'Ireland',
    slug: 'ireland',
    continent: 'Europe',
    population: '5 million',
    languages: ['English', 'Irish'],
    timezone: 'GMT (UTC+0)',
    popular: false,
    description: 'Chat with Irish from Dublin, Cork, Galway. Friendly English speakers.',
    keywords: ['random video chat ireland', 'omegle alternative ireland', 'video chat ireland']
  },
  {
    name: 'Portugal',
    slug: 'portugal',
    continent: 'Europe',
    population: '10 million',
    languages: ['Portuguese', 'English'],
    timezone: 'WET (UTC+0)',
    popular: false,
    description: 'Connect with Portuguese from Lisbon, Porto, Faro. Warm Mediterranean culture.',
    keywords: ['random video chat portugal', 'omegle alternative portugal', 'video chat portugal']
  },
  {
    name: 'Greece',
    slug: 'greece',
    continent: 'Europe',
    population: '10 million',
    languages: ['Greek', 'English'],
    timezone: 'EET (UTC+2)',
    popular: false,
    description: 'Meet Greeks from Athens, Thessaloniki, Patras. Ancient heritage.',
    keywords: ['random video chat greece', 'omegle alternative greece', 'video chat greece']
  },
  {
    name: 'Czech Republic',
    slug: 'czech-republic',
    continent: 'Europe',
    population: '11 million',
    languages: ['Czech', 'English'],
    timezone: 'CET (UTC+1)',
    popular: false,
    description: 'Chat with Czechs from Prague, Brno, Ostrava. Central European gem.',
    keywords: ['random video chat czech', 'omegle alternative czech', 'video chat prague']
  },
  {
    name: 'Romania',
    slug: 'romania',
    continent: 'Europe',
    population: '19 million',
    languages: ['Romanian', 'English'],
    timezone: 'EET (UTC+2)',
    popular: false,
    description: 'Connect with Romanians from Bucharest, Cluj-Napoca, Timișoara. Growing tech scene.',
    keywords: ['random video chat romania', 'omegle alternative romania', 'video chat romania']
  },
  {
    name: 'Chile',
    slug: 'chile',
    continent: 'South America',
    population: '20 million',
    languages: ['Spanish', 'English'],
    timezone: 'CLT (UTC-3/-4)',
    popular: false,
    description: 'Meet Chileans from Santiago, Valparaíso, Concepción. Long Pacific coast.',
    keywords: ['random video chat chile', 'omegle alternative chile', 'video chat chile']
  },
  {
    name: 'Peru',
    slug: 'peru',
    continent: 'South America',
    population: '34 million',
    languages: ['Spanish', 'Quechua', 'English'],
    timezone: 'PET (UTC-5)',
    popular: false,
    description: 'Chat with Peruvians from Lima, Cusco, Arequipa. Ancient Inca heritage.',
    keywords: ['random video chat peru', 'omegle alternative peru', 'video chat peru']
  },
  {
    name: 'Venezuela',
    slug: 'venezuela',
    continent: 'South America',
    population: '28 million',
    languages: ['Spanish', 'English'],
    timezone: 'VET (UTC-4)',
    popular: false,
    description: 'Connect with Venezuelans from Caracas, Maracaibo, Valencia. Caribbean culture.',
    keywords: ['random video chat venezuela', 'omegle alternative venezuela', 'video chat venezuela']
  },
  
  // Additional Countries (51-100)
  {
    name: 'Nepal',
    slug: 'nepal',
    continent: 'Asia',
    population: '30 million',
    languages: ['Nepali', 'English', 'Hindi'],
    timezone: 'NPT (UTC+5:45)',
    popular: true,
    description: 'Meet friendly Nepalese from Kathmandu, Pokhara, Lalitpur. Home of Mount Everest.',
    keywords: ['random video chat nepal', 'omegle alternative nepal', 'video chat nepal', 'talk to strangers nepal']
  },
  {
    name: 'Sri Lanka',
    slug: 'sri-lanka',
    continent: 'Asia',
    population: '22 million',
    languages: ['Sinhala', 'Tamil', 'English'],
    timezone: 'SLST (UTC+5:30)',
    popular: true,
    description: 'Connect with Sri Lankans from Colombo, Kandy, Galle. Beautiful island nation.',
    keywords: ['random video chat sri lanka', 'omegle alternative sri lanka', 'video chat sri lanka']
  },
  {
    name: 'Qatar',
    slug: 'qatar',
    continent: 'Middle East',
    population: '3 million',
    languages: ['Arabic', 'English'],
    timezone: 'AST (UTC+3)',
    popular: false,
    description: 'Chat with people in Qatar from Doha, Al Wakrah. Modern Gulf state.',
    keywords: ['random video chat qatar', 'omegle alternative qatar', 'video chat qatar']
  },
  {
    name: 'Kuwait',
    slug: 'kuwait',
    continent: 'Middle East',
    population: '4.5 million',
    languages: ['Arabic', 'English'],
    timezone: 'AST (UTC+3)',
    popular: false,
    description: 'Meet Kuwaitis from Kuwait City, Hawalli, Salmiya. Persian Gulf culture.',
    keywords: ['random video chat kuwait', 'omegle alternative kuwait', 'video chat kuwait']
  },
  {
    name: 'Iran',
    slug: 'iran',
    continent: 'Middle East',
    population: '88 million',
    languages: ['Persian', 'English', 'Arabic'],
    timezone: 'IRST (UTC+3:30)',
    popular: false,
    description: 'Connect with Iranians from Tehran, Isfahan, Shiraz. Ancient Persian civilization.',
    keywords: ['random video chat iran', 'omegle alternative iran', 'video chat iran']
  },
  {
    name: 'Israel',
    slug: 'israel',
    continent: 'Middle East',
    population: '9 million',
    languages: ['Hebrew', 'Arabic', 'English'],
    timezone: 'IST (UTC+2)',
    popular: false,
    description: 'Chat with Israelis from Tel Aviv, Jerusalem, Haifa. Tech hub of Middle East.',
    keywords: ['random video chat israel', 'omegle alternative israel', 'video chat israel']
  },
  {
    name: 'Kenya',
    slug: 'kenya',
    continent: 'Africa',
    population: '55 million',
    languages: ['Swahili', 'English'],
    timezone: 'EAT (UTC+3)',
    popular: true,
    description: 'Meet Kenyans from Nairobi, Mombasa, Kisumu. Safari capital of Africa.',
    keywords: ['random video chat kenya', 'omegle alternative kenya', 'video chat kenya']
  },
  {
    name: 'Morocco',
    slug: 'morocco',
    continent: 'Africa',
    population: '37 million',
    languages: ['Arabic', 'French', 'English'],
    timezone: 'WET (UTC+0/+1)',
    popular: false,
    description: 'Connect with Moroccans from Casablanca, Marrakech, Fes. North African culture.',
    keywords: ['random video chat morocco', 'omegle alternative morocco', 'video chat morocco']
  },
  {
    name: 'Algeria',
    slug: 'algeria',
    continent: 'Africa',
    population: '45 million',
    languages: ['Arabic', 'French', 'English'],
    timezone: 'CET (UTC+1)',
    popular: false,
    description: 'Chat with Algerians from Algiers, Oran, Constantine. Largest African country.',
    keywords: ['random video chat algeria', 'omegle alternative algeria', 'video chat algeria']
  },
  {
    name: 'Tunisia',
    slug: 'tunisia',
    continent: 'Africa',
    population: '12 million',
    languages: ['Arabic', 'French', 'English'],
    timezone: 'CET (UTC+1)',
    popular: false,
    description: 'Meet Tunisians from Tunis, Sfax, Sousse. Mediterranean charm.',
    keywords: ['random video chat tunisia', 'omegle alternative tunisia', 'video chat tunisia']
  },
  {
    name: 'Ethiopia',
    slug: 'ethiopia',
    continent: 'Africa',
    population: '120 million',
    languages: ['Amharic', 'Oromo', 'English'],
    timezone: 'EAT (UTC+3)',
    popular: false,
    description: 'Connect with Ethiopians from Addis Ababa, Dire Dawa. Ancient African civilization.',
    keywords: ['random video chat ethiopia', 'omegle alternative ethiopia', 'video chat ethiopia']
  },
  {
    name: 'Ghana',
    slug: 'ghana',
    continent: 'Africa',
    population: '32 million',
    languages: ['English', 'Twi', 'Ga'],
    timezone: 'GMT (UTC+0)',
    popular: false,
    description: 'Chat with Ghanaians from Accra, Kumasi, Tamale. West African hospitality.',
    keywords: ['random video chat ghana', 'omegle alternative ghana', 'video chat ghana']
  },
  {
    name: 'Uganda',
    slug: 'uganda',
    continent: 'Africa',
    population: '48 million',
    languages: ['English', 'Swahili', 'Luganda'],
    timezone: 'EAT (UTC+3)',
    popular: false,
    description: 'Meet Ugandans from Kampala, Entebbe, Gulu. Pearl of Africa.',
    keywords: ['random video chat uganda', 'omegle alternative uganda', 'video chat uganda']
  },
  {
    name: 'Tanzania',
    slug: 'tanzania',
    continent: 'Africa',
    population: '62 million',
    languages: ['Swahili', 'English'],
    timezone: 'EAT (UTC+3)',
    popular: false,
    description: 'Connect with Tanzanians from Dar es Salaam, Dodoma, Arusha. Serengeti plains.',
    keywords: ['random video chat tanzania', 'omegle alternative tanzania', 'video chat tanzania']
  },
  {
    name: 'Zambia',
    slug: 'zambia',
    continent: 'Africa',
    population: '19 million',
    languages: ['English', 'Bemba', 'Nyanja'],
    timezone: 'CAT (UTC+2)',
    popular: false,
    description: 'Chat with Zambians from Lusaka, Kitwe, Ndola. Victoria Falls region.',
    keywords: ['random video chat zambia', 'omegle alternative zambia', 'video chat zambia']
  },
  {
    name: 'Zimbabwe',
    slug: 'zimbabwe',
    continent: 'Africa',
    population: '15 million',
    languages: ['English', 'Shona', 'Ndebele'],
    timezone: 'CAT (UTC+2)',
    popular: false,
    description: 'Meet Zimbabweans from Harare, Bulawayo, Mutare. Ancient Great Zimbabwe ruins.',
    keywords: ['random video chat zimbabwe', 'omegle alternative zimbabwe', 'video chat zimbabwe']
  },
  {
    name: 'China',
    slug: 'china',
    continent: 'Asia',
    population: '1.4 billion',
    languages: ['Mandarin', 'Cantonese', 'English'],
    timezone: 'CST (UTC+8)',
    popular: true,
    description: 'Connect with Chinese from Beijing, Shanghai, Guangzhou. Ancient and modern fusion.',
    keywords: ['random video chat china', 'omegle alternative china', 'video chat china']
  },
  {
    name: 'Taiwan',
    slug: 'taiwan',
    continent: 'Asia',
    population: '24 million',
    languages: ['Mandarin', 'Taiwanese', 'English'],
    timezone: 'CST (UTC+8)',
    popular: false,
    description: 'Chat with Taiwanese from Taipei, Kaohsiung, Taichung. Tech innovation hub.',
    keywords: ['random video chat taiwan', 'omegle alternative taiwan', 'video chat taiwan']
  },
  {
    name: 'New Zealand',
    slug: 'new-zealand',
    continent: 'Oceania',
    population: '5 million',
    languages: ['English', 'Māori'],
    timezone: 'NZST (UTC+12/+13)',
    popular: true,
    description: 'Meet Kiwis from Auckland, Wellington, Christchurch. Stunning natural beauty.',
    keywords: ['random video chat new zealand', 'omegle alternative new zealand', 'video chat nz']
  },
  {
    name: 'Ireland',
    slug: 'ireland',
    continent: 'Europe',
    population: '5 million',
    languages: ['English', 'Irish'],
    timezone: 'GMT (UTC+0/+1)',
    popular: true,
    description: 'Connect with Irish from Dublin, Cork, Galway. Emerald Isle charm.',
    keywords: ['random video chat ireland', 'omegle alternative ireland', 'video chat ireland']
  },
  {
    name: 'Scotland',
    slug: 'scotland',
    continent: 'Europe',
    population: '5.5 million',
    languages: ['English', 'Scots', 'Scottish Gaelic'],
    timezone: 'GMT (UTC+0/+1)',
    popular: false,
    description: 'Chat with Scots from Edinburgh, Glasgow, Aberdeen. Highland culture.',
    keywords: ['random video chat scotland', 'omegle alternative scotland', 'video chat scotland']
  },
  {
    name: 'Wales',
    slug: 'wales',
    continent: 'Europe',
    population: '3 million',
    languages: ['English', 'Welsh'],
    timezone: 'GMT (UTC+0/+1)',
    popular: false,
    description: 'Meet Welsh from Cardiff, Swansea, Newport. Celtic heritage.',
    keywords: ['random video chat wales', 'omegle alternative wales', 'video chat wales']
  },
  {
    name: 'Iceland',
    slug: 'iceland',
    continent: 'Europe',
    population: '380,000',
    languages: ['Icelandic', 'English'],
    timezone: 'GMT (UTC+0)',
    popular: false,
    description: 'Connect with Icelanders from Reykjavik. Land of fire and ice.',
    keywords: ['random video chat iceland', 'omegle alternative iceland', 'video chat iceland']
  },
  {
    name: 'Croatia',
    slug: 'croatia',
    continent: 'Europe',
    population: '4 million',
    languages: ['Croatian', 'English'],
    timezone: 'CET (UTC+1/+2)',
    popular: false,
    description: 'Chat with Croatians from Zagreb, Split, Dubrovnik. Adriatic coastline.',
    keywords: ['random video chat croatia', 'omegle alternative croatia', 'video chat croatia']
  },
  {
    name: 'Serbia',
    slug: 'serbia',
    continent: 'Europe',
    population: '7 million',
    languages: ['Serbian', 'English'],
    timezone: 'CET (UTC+1/+2)',
    popular: false,
    description: 'Meet Serbians from Belgrade, Novi Sad, Niš. Balkan hospitality.',
    keywords: ['random video chat serbia', 'omegle alternative serbia', 'video chat serbia']
  },
  {
    name: 'Bulgaria',
    slug: 'bulgaria',
    continent: 'Europe',
    population: '7 million',
    languages: ['Bulgarian', 'English'],
    timezone: 'EET (UTC+2/+3)',
    popular: false,
    description: 'Connect with Bulgarians from Sofia, Plovdiv, Varna. Black Sea coast.',
    keywords: ['random video chat bulgaria', 'omegle alternative bulgaria', 'video chat bulgaria']
  },
  {
    name: 'Slovenia',
    slug: 'slovenia',
    continent: 'Europe',
    population: '2 million',
    languages: ['Slovenian', 'English'],
    timezone: 'CET (UTC+1/+2)',
    popular: false,
    description: 'Chat with Slovenians from Ljubljana, Maribor, Celje. Alpine beauty.',
    keywords: ['random video chat slovenia', 'omegle alternative slovenia', 'video chat slovenia']
  },
  {
    name: 'Slovakia',
    slug: 'slovakia',
    continent: 'Europe',
    population: '5.5 million',
    languages: ['Slovak', 'English'],
    timezone: 'CET (UTC+1/+2)',
    popular: false,
    description: 'Meet Slovaks from Bratislava, Košice, Prešov. Carpathian mountains.',
    keywords: ['random video chat slovakia', 'omegle alternative slovakia', 'video chat slovakia']
  },
  {
    name: 'Belarus',
    slug: 'belarus',
    continent: 'Europe',
    population: '9 million',
    languages: ['Belarusian', 'Russian', 'English'],
    timezone: 'MSK (UTC+3)',
    popular: false,
    description: 'Connect with Belarusians from Minsk, Gomel, Vitebsk. Eastern European culture.',
    keywords: ['random video chat belarus', 'omegle alternative belarus', 'video chat belarus']
  },
  {
    name: 'Kazakhstan',
    slug: 'kazakhstan',
    continent: 'Asia',
    population: '19 million',
    languages: ['Kazakh', 'Russian', 'English'],
    timezone: 'ALMT (UTC+5/+6)',
    popular: false,
    description: 'Chat with Kazakhs from Almaty, Nur-Sultan, Shymkent. Central Asian steppe.',
    keywords: ['random video chat kazakhstan', 'omegle alternative kazakhstan', 'video chat kazakhstan']
  },
  {
    name: 'Armenia',
    slug: 'armenia',
    continent: 'Asia',
    population: '3 million',
    languages: ['Armenian', 'Russian', 'English'],
    timezone: 'AMT (UTC+4)',
    popular: false,
    description: 'Meet Armenians from Yerevan, Gyumri, Vanadzor. Ancient Christian nation.',
    keywords: ['random video chat armenia', 'omegle alternative armenia', 'video chat armenia']
  },
  {
    name: 'Georgia',
    slug: 'georgia',
    continent: 'Asia',
    population: '4 million',
    languages: ['Georgian', 'English', 'Russian'],
    timezone: 'GET (UTC+4)',
    popular: false,
    description: 'Connect with Georgians from Tbilisi, Batumi, Kutaisi. Caucasus hospitality.',
    keywords: ['random video chat georgia', 'omegle alternative georgia', 'video chat georgia']
  },
  {
    name: 'Azerbaijan',
    slug: 'azerbaijan',
    continent: 'Asia',
    population: '10 million',
    languages: ['Azerbaijani', 'Russian', 'English'],
    timezone: 'AZT (UTC+4)',
    popular: false,
    description: 'Chat with Azerbaijanis from Baku, Ganja, Sumqayit. Land of fire.',
    keywords: ['random video chat azerbaijan', 'omegle alternative azerbaijan', 'video chat azerbaijan']
  },
  {
    name: 'Afghanistan',
    slug: 'afghanistan',
    continent: 'Asia',
    population: '40 million',
    languages: ['Dari', 'Pashto', 'English'],
    timezone: 'AFT (UTC+4:30)',
    popular: false,
    description: 'Meet Afghans from Kabul, Herat, Kandahar. Ancient Silk Road.',
    keywords: ['random video chat afghanistan', 'omegle alternative afghanistan', 'video chat afghanistan']
  },
  {
    name: 'Cambodia',
    slug: 'cambodia',
    continent: 'Asia',
    population: '17 million',
    languages: ['Khmer', 'English'],
    timezone: 'ICT (UTC+7)',
    popular: false,
    description: 'Connect with Cambodians from Phnom Penh, Siem Reap. Angkor Wat heritage.',
    keywords: ['random video chat cambodia', 'omegle alternative cambodia', 'video chat cambodia']
  },
  {
    name: 'Laos',
    slug: 'laos',
    continent: 'Asia',
    population: '7 million',
    languages: ['Lao', 'English'],
    timezone: 'ICT (UTC+7)',
    popular: false,
    description: 'Chat with Laotians from Vientiane, Luang Prabang. Mekong River culture.',
    keywords: ['random video chat laos', 'omegle alternative laos', 'video chat laos']
  },
  {
    name: 'Myanmar',
    slug: 'myanmar',
    continent: 'Asia',
    population: '55 million',
    languages: ['Burmese', 'English'],
    timezone: 'MMT (UTC+6:30)',
    popular: false,
    description: 'Meet people from Myanmar (Burma) - Yangon, Mandalay. Golden pagodas.',
    keywords: ['random video chat myanmar', 'omegle alternative myanmar', 'video chat burma']
  },
  {
    name: 'Maldives',
    slug: 'maldives',
    continent: 'Asia',
    population: '500,000',
    languages: ['Dhivehi', 'English'],
    timezone: 'MVT (UTC+5)',
    popular: false,
    description: 'Connect with Maldivians from Malé. Tropical island paradise.',
    keywords: ['random video chat maldives', 'omegle alternative maldives', 'video chat maldives']
  },
  {
    name: 'Fiji',
    slug: 'fiji',
    continent: 'Oceania',
    population: '900,000',
    languages: ['English', 'Fijian', 'Hindi'],
    timezone: 'FJT (UTC+12/+13)',
    popular: false,
    description: 'Chat with Fijians from Suva, Nadi, Lautoka. Pacific island charm.',
    keywords: ['random video chat fiji', 'omegle alternative fiji', 'video chat fiji']
  },
  {
    name: 'Papua New Guinea',
    slug: 'papua-new-guinea',
    continent: 'Oceania',
    population: '9 million',
    languages: ['English', 'Tok Pisin', 'Hiri Motu'],
    timezone: 'PGT (UTC+10)',
    popular: false,
    description: 'Meet Papua New Guineans from Port Moresby, Lae. Cultural diversity.',
    keywords: ['random video chat papua new guinea', 'omegle alternative png', 'video chat png']
  },
  {
    name: 'Lebanon',
    slug: 'lebanon',
    continent: 'Middle East',
    population: '7 million',
    languages: ['Arabic', 'French', 'English'],
    timezone: 'EET (UTC+2/+3)',
    popular: false,
    description: 'Connect with Lebanese from Beirut, Tripoli, Sidon. Mediterranean heritage.',
    keywords: ['random video chat lebanon', 'omegle alternative lebanon', 'video chat lebanon']
  },
  {
    name: 'Jordan',
    slug: 'jordan',
    continent: 'Middle East',
    population: '11 million',
    languages: ['Arabic', 'English'],
    timezone: 'EET (UTC+2/+3)',
    popular: false,
    description: 'Chat with Jordanians from Amman, Petra, Aqaba. Ancient Nabatean kingdom.',
    keywords: ['random video chat jordan', 'omegle alternative jordan', 'video chat jordan']
  },
  {
    name: 'Iraq',
    slug: 'iraq',
    continent: 'Middle East',
    population: '42 million',
    languages: ['Arabic', 'Kurdish', 'English'],
    timezone: 'AST (UTC+3)',
    popular: false,
    description: 'Meet Iraqis from Baghdad, Basra, Erbil. Mesopotamian cradle of civilization.',
    keywords: ['random video chat iraq', 'omegle alternative iraq', 'video chat iraq']
  },
  {
    name: 'Cyprus',
    slug: 'cyprus',
    continent: 'Europe',
    population: '1.2 million',
    languages: ['Greek', 'Turkish', 'English'],
    timezone: 'EET (UTC+2/+3)',
    popular: false,
    description: 'Connect with Cypriots from Nicosia, Limassol, Larnaca. Mediterranean island.',
    keywords: ['random video chat cyprus', 'omegle alternative cyprus', 'video chat cyprus']
  },
  {
    name: 'Bolivia',
    slug: 'bolivia',
    continent: 'South America',
    population: '12 million',
    languages: ['Spanish', 'Quechua', 'Aymara'],
    timezone: 'BOT (UTC-4)',
    popular: false,
    description: 'Chat with Bolivians from La Paz, Santa Cruz, Cochabamba. Andean highlands.',
    keywords: ['random video chat bolivia', 'omegle alternative bolivia', 'video chat bolivia']
  },
  {
    name: 'Paraguay',
    slug: 'paraguay',
    continent: 'South America',
    population: '7 million',
    languages: ['Spanish', 'Guaraní'],
    timezone: 'PYT (UTC-3/-4)',
    popular: false,
    description: 'Meet Paraguayans from Asunción, Ciudad del Este. Bilingual Guaraní culture.',
    keywords: ['random video chat paraguay', 'omegle alternative paraguay', 'video chat paraguay']
  },
  {
    name: 'Uruguay',
    slug: 'uruguay',
    continent: 'South America',
    population: '3.5 million',
    languages: ['Spanish', 'English'],
    timezone: 'UYT (UTC-3)',
    popular: false,
    description: 'Connect with Uruguayans from Montevideo, Punta del Este. Progressive South America.',
    keywords: ['random video chat uruguay', 'omegle alternative uruguay', 'video chat uruguay']
  },
  {
    name: 'Panama',
    slug: 'panama',
    continent: 'Central America',
    population: '4 million',
    languages: ['Spanish', 'English'],
    timezone: 'EST (UTC-5)',
    popular: false,
    description: 'Chat with Panamanians from Panama City, Colón. Famous canal.',
    keywords: ['random video chat panama', 'omegle alternative panama', 'video chat panama']
  },
  {
    name: 'Costa Rica',
    slug: 'costa-rica',
    continent: 'Central America',
    population: '5 million',
    languages: ['Spanish', 'English'],
    timezone: 'CST (UTC-6)',
    popular: false,
    description: 'Meet Costa Ricans from San José, Limón, Puntarenas. Pura Vida lifestyle.',
    keywords: ['random video chat costa rica', 'omegle alternative costa rica', 'video chat costa rica']
  },
  {
    name: 'Dominican Republic',
    slug: 'dominican-republic',
    continent: 'Caribbean',
    population: '11 million',
    languages: ['Spanish', 'English'],
    timezone: 'AST (UTC-4)',
    popular: false,
    description: 'Connect with Dominicans from Santo Domingo, Santiago, Punta Cana. Caribbean rhythms.',
    keywords: ['random video chat dominican republic', 'omegle alternative dominican republic', 'video chat dr']
  },
  {
    name: 'Jamaica',
    slug: 'jamaica',
    continent: 'Caribbean',
    population: '3 million',
    languages: ['English', 'Jamaican Patois'],
    timezone: 'EST (UTC-5)',
    popular: false,
    description: 'Chat with Jamaicans from Kingston, Montego Bay. Reggae birthplace.',
    keywords: ['random video chat jamaica', 'omegle alternative jamaica', 'video chat jamaica']
  },
  {
    name: 'Hungary',
    slug: 'hungary',
    continent: 'Europe',
    population: '10 million',
    languages: ['Hungarian', 'English'],
    timezone: 'CET (UTC+1/+2)',
    popular: false,
    description: 'Meet Hungarians from Budapest, Debrecen, Szeged. Central European culture.',
    keywords: ['random video chat hungary', 'omegle alternative hungary', 'video chat hungary']
  }
];

// Get popular countries for featured sections
export const getPopularCountries = () => countries.filter(c => c.popular);

// Get countries by continent
export const getCountriesByContinent = (continent: string) => 
  countries.filter(c => c.continent === continent);

// Get country by slug
export const getCountryBySlug = (slug: string) => 
  countries.find(c => c.slug === slug);

// Get all country slugs for routing
export const getAllCountrySlugs = () => countries.map(c => c.slug);
