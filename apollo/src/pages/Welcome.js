import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  TextArea,
  TextInput
} from '@patternfly/react-core';
import { ArrowRightIcon, CheckIcon, GlobeIcon, MicrophoneIcon } from '@patternfly/react-icons';
import RedHatLogo from '../assets/logos/logo-red-hat.svg';

// Import avatar assets for assistant avatar selection
import AssistantApollo from '../assets/assistants/assistant-apollo.svg';
import AssistantWaves from '../assets/assistants/assistant-waves.svg';
import AssistantLava from '../assets/assistants/assistant-lava.svg';
import AssistantPlasma from '../assets/assistants/assistant-plasma.svg';
import AssistantAurora from '../assets/assistants/assistant-aurora.svg';
import AssistantNebula from '../assets/assistants/assistant-nebula.svg';
import AssistantPulse from '../assets/assistants/assistant-pulse.svg';
import AssistantFirefly from '../assets/assistants/assistant-firefly.svg';
import AssistantCrystal from '../assets/assistants/assistant-crystal.svg';
import LogoAI from '../assets/logos/logo-ai.svg';

// Available assistant avatars
const assistantAvatars = [
  { id: 'apollo', name: 'Apollo', src: AssistantApollo, category: 'assistant' },
  { id: 'waves', name: 'Waves', src: AssistantWaves, category: 'assistant' },
  { id: 'lava', name: 'Lava', src: AssistantLava, category: 'assistant' },
  { id: 'plasma', name: 'Plasma', src: AssistantPlasma, category: 'assistant' },
  { id: 'aurora', name: 'Aurora', src: AssistantAurora, category: 'assistant' },
  { id: 'nebula', name: 'Nebula', src: AssistantNebula, category: 'assistant' },
  { id: 'pulse', name: 'Pulse', src: AssistantPulse, category: 'assistant' },
  { id: 'firefly', name: 'Firefly', src: AssistantFirefly, category: 'assistant' },
  { id: 'crystal', name: 'Crystal', src: AssistantCrystal, category: 'assistant' },
  { id: 'ai', name: 'AI', src: LogoAI, category: 'assistant' },
];

// Task suggestions for the second step
const taskSuggestions = [
  { id: 'review-designs', label: 'Review design specs', color: '#EC4899' },
  { id: 'write-code', label: 'Write code', color: '#3B82F6' },
  { id: 'attend-meetings', label: 'Attend meetings', color: '#8B5CF6' },
  { id: 'read-docs', label: 'Read documentation', color: '#10B981' },
  { id: 'check-emails', label: 'Check emails', color: '#F59E0B' },
  { id: 'plan-sprints', label: 'Plan sprints', color: '#6366F1' },
  { id: 'create-reports', label: 'Create reports', color: '#14B8A6' },
  { id: 'debug-issues', label: 'Debug issues', color: '#EF4444' },
  { id: 'collaborate', label: 'Collaborate with team', color: '#A855F7' }
];

// Globe emojis: Americas → Asia → Africa/Europe
const globeEmojis = ['🌎', '🌏', '🌍'];

// Multilingual cycling text — each entry is synced by index
// Map language codes to greeting indices — used to lock greeting when user picks a language
const greetingLanguageMap = {
  'en': 0, 'ar': 1, 'fr': 2, 'zh': 3, 'es': 4, 'hi': 5,
  'it': 6, 'ja': 7, 'pt': 8, 'ko': 9, 'de': 10, 'ru': 11,
  'tr': 12, 'th': 13, 'sv': 14, 'he': 15, 'vi': 16, 'el': 17,
  'sw': 18, 'pl': 19, 'ta': 20, 'et': 21, 'am': 22, 'mi': 23,
  'ka': 24, 'haw': 25, 'hy': 26, 'fj': 27, 'no': 28, 'nb': 28, 'nn': 28,
  'fil': 29, 'ro': 30, 'lv': 31, 'zu': 32, 'fa': 33, 'lb': 34,
  'sm': 35, 'cs': 36, 'yo': 37, 'to': 38, 'eo': 39, 'ga': 40,
  'eu': 41, 'km': 42, 'lo': 43, 'mn': 44, 'or': 45, 'hu': 46,
  'mt': 47, 'sq': 48, 'si': 49,
};

// Hello in many languages — ordered to alternate scripts for visual variety
const greetings = [
  'Hello',           // English
  'مرحبًا',          // Arabic
  'Bonjour',         // French
  '你好',            // Chinese
  'Hola',            // Spanish
  'नमस्ते',          // Hindi
  'Ciao',            // Italian
  'こんにちは',       // Japanese
  'Olá',             // Portuguese
  '안녕하세요',       // Korean
  'Hallo',           // German
  'Привет',          // Russian
  'Merhaba',         // Turkish
  'สวัสดี',          // Thai
  'Hej',             // Swedish
  'שלום',            // Hebrew
  'Xin chào',        // Vietnamese
  'Γεια σας',        // Greek
  'Habari',          // Swahili
  'Cześć',           // Polish
  'வணக்கம்',         // Tamil
  'Tere',            // Estonian
  'ሰላም',            // Amharic
  'Kia ora',         // Māori
  'გამარჯობა',       // Georgian
  'Aloha',           // Hawaiian
  'Բարև',            // Armenian
  'Bula',            // Fijian
  'Hei',             // Norwegian
  'Kamusta',         // Filipino
  'Salut',           // Romanian
  'Sveiki',          // Latvian
  'Sawubona',        // Zulu
  'سلام',            // Persian
  'Moien',           // Luxembourgish
  'Talofa',          // Samoan
  'Ahoj',            // Czech
  'Bawo ni',         // Yoruba
  'Mālō e lelei',   // Tongan
  'Saluton',         // Esperanto
  'Dia dhuit',       // Irish
  'Kaixo',           // Basque
  'ជំរាបសួរ',        // Khmer
  'ສະບາຍດີ',         // Lao
  'Сайн уу',        // Mongolian
  'ନମସ୍କାର',        // Odia
  'Szia',            // Hungarian
  'Bonġu',           // Maltese
  'Përshëndetje',    // Albanian
  'ආයුබෝවන්',       // Sinhala
];

// "Welcome to Apollo" in many languages — synced with greetings by index
const welcomeMessages = [
  'Welcome to Apollo',             // English
  'مرحبًا بك في أبولو',            // Arabic
  'Bienvenue sur Apollo',          // French
  '欢迎使用 Apollo',                // Chinese
  'Bienvenido a Apollo',           // Spanish
  'Apollo में आपका स्वागत है',      // Hindi
  'Benvenuto su Apollo',           // Italian
  'Apollo へようこそ',              // Japanese
  'Bem-vindo ao Apollo',           // Portuguese
  'Apollo에 오신 것을 환영합니다',    // Korean
  'Willkommen bei Apollo',         // German
  'Добро пожаловать в Apollo',     // Russian
  'Apollo\'ya hoş geldiniz',       // Turkish
  'ยินดีต้อนรับสู่ Apollo',         // Thai
  'Välkommen till Apollo',         // Swedish
  'ברוכים הבאים ל-Apollo',         // Hebrew
  'Chào mừng đến với Apollo',      // Vietnamese
  'Καλώς ήρθατε στο Apollo',       // Greek
  'Karibu Apollo',                 // Swahili
  'Witamy w Apollo',               // Polish
  'Apollo-க்கு வரவேற்கிறோம்',      // Tamil
  'Tere tulemast Apollo\'sse',     // Estonian
  'እንኳን ወደ Apollo በደህና መጡ',      // Amharic
  'Nau mai ki Apollo',             // Māori
  'კეთილი იყოს თქვენი მობრძანება', // Georgian
  'E komo mai iā Apollo',          // Hawaiian
  'Բարի գալուստ Apollo',           // Armenian
  'Bula vinaka ki Apollo',         // Fijian
  'Velkommen til Apollo',          // Norwegian
  'Maligayang pagdating sa Apollo',// Filipino
  'Bine ați venit la Apollo',      // Romanian
  'Laipni lūdzam Apollo',          // Latvian
  'Siyakwamukela ku-Apollo',       // Zulu
  'به Apollo خوش آمدید',           // Persian
  'Wëllkomm bei Apollo',           // Luxembourgish
  'Afio mai i le Apollo',          // Samoan
  'Vítejte v Apollo',              // Czech
  'Ẹ ku àbọ̀ sí Apollo',           // Yoruba
  'Talitali fiefia ki he Apollo',  // Tongan
  'Bonvenon al Apollo',            // Esperanto
  'Fáilte go Apollo',              // Irish
  'Ongi etorri Apollo-ra',         // Basque
  'សូមស្វាគមន៍មកកាន់ Apollo',     // Khmer
  'ຍິນດີຕ້ອນຮັບສູ່ Apollo',       // Lao
  'Apollo-д тавтай морил',         // Mongolian
  'Apollo କୁ ସ୍ୱାଗତ',              // Odia
  'Üdvözöljük az Apollo-ban',      // Hungarian
  'Merħba fl-Apollo',              // Maltese
  'Mirësevini në Apollo',          // Albanian
  'Apollo වෙත සාදරයෙන් පිළිගනිමු', // Sinhala
];

// "What language do you speak?" in many languages — synced with greetings by index
const languageQuestions = [
  'What language do you speak?',        // English
  'ما هي اللغة التي تتحدثها؟',          // Arabic
  'Quelle langue parlez-vous ?',        // French
  '你说什么语言？',                       // Chinese
  '¿Qué idioma hablas?',               // Spanish
  'आप कौन सी भाषा बोलते हैं?',          // Hindi
  'Che lingua parli?',                  // Italian
  '何語を話しますか？',                   // Japanese
  'Que idioma você fala?',              // Portuguese
  '어떤 언어를 사용하시나요?',             // Korean
  'Welche Sprache sprechen Sie?',       // German
  'На каком языке вы говорите?',         // Russian
  'Hangi dili konuşuyorsunuz?',         // Turkish
  'คุณพูดภาษาอะไร?',                    // Thai
  'Vilket språk talar du?',            // Swedish
  'באיזו שפה אתה מדבר?',               // Hebrew
  'Bạn nói ngôn ngữ nào?',             // Vietnamese
  'Ποια γλώσσα μιλάτε;',               // Greek
  'Unazungumza lugha gani?',            // Swahili
  'Jakim językiem mówisz?',             // Polish
  'நீங்கள் என்ன மொழி பேசுகிறீர்கள்?',   // Tamil
  'Mis keelt sa räägid?',               // Estonian
  'ምን ቋንቋ ይናገራሉ?',                    // Amharic
  'He aha tō reo?',                     // Māori
  'რა ენაზე საუბრობთ?',                 // Georgian
  'He aha kou ʻōlelo?',                 // Hawaiian
  'What language do you speak?',        // Armenian (fallback)
  'O kila na vosa vaka?',              // Fijian
  'Hvilket språk snakker du?',         // Norwegian
  'Anong wika ang sinasalita mo?',      // Filipino
  'Ce limbă vorbiți?',                  // Romanian
  'Kādā valodā jūs runājat?',          // Latvian
  'Ukhuluma luphi ulimi?',             // Zulu
  'شما چه زبانی صحبت می‌کنید؟',        // Persian
  'Wat Sprooch schwätzt Dir?',          // Luxembourgish
  'O le ā lau gagana?',                // Samoan
  'Jakým jazykem mluvíte?',            // Czech
  'Èdè wo ni ẹ ń sọ?',                // Yoruba
  'Ko e hā ho lea?',                   // Tongan
  'Kiun lingvon vi parolas?',           // Esperanto
  'Cén teanga a labhraíonn tú?',       // Irish
  'Zein hizkuntza hitz egiten duzu?',   // Basque
  'តើអ្នកនិយាយភាសាអ្វី?',             // Khmer
  'ເຈົ້າເວົ້າພາສາຫຍັງ?',               // Lao
  'Та ямар хэлээр ярьдаг вэ?',          // Mongolian
  'ଆପଣ କେଉଁ ଭାଷା କୁହନ୍ତି?',           // Odia
  'Milyen nyelven beszélsz?',           // Hungarian
  'Liema lingwa titkellem?',            // Maltese
  'Çfarë gjuhe flisni?',               // Albanian
  'ඔබ කුමන භාෂාවෙන් කතා කරනවාද?',    // Sinhala
];

// "Choose your preferred language" in many languages — synced with greetings by index
const languageSubtitles = [
  'Choose your preferred language',          // English
  'اختر لغتك المفضلة',                       // Arabic
  'Choisissez votre langue préférée',        // French
  '选择您的首选语言',                           // Chinese
  'Elige tu idioma preferido',               // Spanish
  'अपनी पसंदीदा भाषा चुनें',                 // Hindi
  'Scegli la tua lingua preferita',          // Italian
  'ご希望の言語を選択してください',               // Japanese
  'Escolha seu idioma preferido',            // Portuguese
  '선호하는 언어를 선택하세요',                  // Korean
  'Wählen Sie Ihre bevorzugte Sprache',      // German
  'Выберите предпочитаемый язык',             // Russian
  'Tercih ettiğiniz dili seçin',             // Turkish
  'เลือกภาษาที่คุณต้องการ',                   // Thai
  'Välj ditt föredragna språk',              // Swedish
  'בחר את השפה המועדפת עליך',                // Hebrew
  'Chọn ngôn ngữ ưa thích của bạn',         // Vietnamese
  'Επιλέξτε τη γλώσσα που προτιμάτε',        // Greek
  'Chagua lugha unayoipendelea',             // Swahili
  'Wybierz preferowany język',               // Polish
  'உங்கள் விருப்ப மொழியைத் தேர்ந்தெடுக்கவும்', // Tamil
  'Valige oma eelistatud keel',              // Estonian
  'የሚፈልጉትን ቋንቋ ይምረጡ',                     // Amharic
  'Kōwhiria tō reo',                        // Māori
  'აირჩიეთ სასურველი ენა',                    // Georgian
  'E koho i kou ʻōlelo makemake',            // Hawaiian
  'Choose your preferred language',          // Armenian (fallback)
  'Digitaka na nomu vosa',                   // Fijian
  'Velg ditt foretrukne språk',              // Norwegian
  'Piliin ang iyong gustong wika',           // Filipino
  'Alegeți limba preferată',                 // Romanian
  'Izvēlieties vēlamo valodu',              // Latvian
  'Khetha ulimi oluthandayo',               // Zulu
  'زبان مورد نظر خود را انتخاب کنید',       // Persian
  'Wielt Är bevorzugt Sprooch',              // Luxembourgish
  'Filifili lau gagana',                     // Samoan
  'Vyberte si preferovaný jazyk',            // Czech
  'Yan èdè tí ẹ fẹ́ráàn',                   // Yoruba
  'Fili ho lea',                             // Tongan
  'Elektu vian preferatan lingvon',          // Esperanto
  'Roghnaigh do theanga roghnaithe',         // Irish
  'Aukeratu zure hizkuntza hobetsia',        // Basque
  'ជ្រើសរើសភាសាដែលអ្នកចូលចិត្ត',          // Khmer
  'ເລືອກພາສາທີ່ທ່ານຕ້ອງການ',                // Lao
  'Өөрийн хүссэн хэлийг сонгоно уу',         // Mongolian
  'ଆପଣଙ୍କ ପସନ୍ଦର ଭାଷା ବାଛନ୍ତୁ',            // Odia
  'Válaszd ki a kívánt nyelvet',             // Hungarian
  'Agħżel il-lingwa ppreferuta tiegħek',     // Maltese
  'Zgjidhni gjuhën tuaj të preferuar',       // Albanian
  'ඔබේ කැමති භාෂාව තෝරන්න',                // Sinhala
];

// World languages for the language selection typeahead — comprehensive list
const worldLanguages = [
  { code: 'ab', name: 'Abkhazian', nativeName: 'Аԥсуа' },
  { code: 'ace', name: 'Acehnese', nativeName: 'Basa Acèh' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
  { code: 'ak', name: 'Akan', nativeName: 'Akan' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'ar-EG', name: 'Arabic (Egyptian)', nativeName: 'العربية المصرية' },
  { code: 'ar-MA', name: 'Arabic (Moroccan)', nativeName: 'الدارجة المغربية' },
  { code: 'an', name: 'Aragonese', nativeName: 'Aragonés' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'ast', name: 'Asturian', nativeName: 'Asturianu' },
  { code: 'av', name: 'Avaric', nativeName: 'Авар' },
  { code: 'ay', name: 'Aymara', nativeName: 'Aymar aru' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan' },
  { code: 'bm', name: 'Bambara', nativeName: 'Bamanankan' },
  { code: 'ba', name: 'Bashkir', nativeName: 'Башҡорт' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'bho', name: 'Bhojpuri', nativeName: 'भोजपुरी' },
  { code: 'bi', name: 'Bislama', nativeName: 'Bislama' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski' },
  { code: 'br', name: 'Breton', nativeName: 'Brezhoneg' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català' },
  { code: 'ceb', name: 'Cebuano', nativeName: 'Sinugbuanon' },
  { code: 'ch', name: 'Chamorro', nativeName: 'Chamoru' },
  { code: 'ce', name: 'Chechen', nativeName: 'Нохчийн' },
  { code: 'ny', name: 'Chichewa', nativeName: 'Chichewa' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  { code: 'zh-yue', name: 'Chinese (Cantonese)', nativeName: '粵語' },
  { code: 'cv', name: 'Chuvash', nativeName: 'Чӑваш' },
  { code: 'kw', name: 'Cornish', nativeName: 'Kernewek' },
  { code: 'co', name: 'Corsican', nativeName: 'Corsu' },
  { code: 'cr', name: 'Cree', nativeName: 'ᓀᐦᐃᔭᐍᐏᐣ' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'dv', name: 'Dhivehi', nativeName: 'ދިވެހި' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'dz', name: 'Dzongkha', nativeName: 'རྫོང་ཁ' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'en-US', name: 'English (American)', nativeName: 'American English' },
  { code: 'en-GB', name: 'English (British)', nativeName: 'British English' },
  { code: 'en-AU', name: 'English (Australian)', nativeName: 'Australian English' },
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
  { code: 'ee', name: 'Ewe', nativeName: 'Eʋegbe' },
  { code: 'fo', name: 'Faroese', nativeName: 'Føroyskt' },
  { code: 'fj', name: 'Fijian', nativeName: 'Vakaviti' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'fr-CA', name: 'French (Canadian)', nativeName: 'Français canadien' },
  { code: 'ff', name: 'Fula', nativeName: 'Fulfulde' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego' },
  { code: 'lg', name: 'Ganda', nativeName: 'Luganda' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'de-AT', name: 'German (Austrian)', nativeName: 'Österreichisches Deutsch' },
  { code: 'de-CH', name: 'German (Swiss)', nativeName: 'Schweizerdeutsch' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'gn', name: 'Guarani', nativeName: 'Avañeʼẽ' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'hz', name: 'Herero', nativeName: 'Otjiherero' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ho', name: 'Hiri Motu', nativeName: 'Hiri Motu' },
  { code: 'hmn', name: 'Hmong', nativeName: 'Hmoob' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo' },
  { code: 'ilo', name: 'Ilocano', nativeName: 'Ilokano' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ia', name: 'Interlingua', nativeName: 'Interlingua' },
  { code: 'iu', name: 'Inuktitut', nativeName: 'ᐃᓄᒃᑎᑐᑦ' },
  { code: 'ik', name: 'Inupiaq', nativeName: 'Iñupiaq' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'jv', name: 'Javanese', nativeName: 'Basa Jawa' },
  { code: 'kl', name: 'Kalaallisut', nativeName: 'Kalaallisut' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'kr', name: 'Kanuri', nativeName: 'Kanuri' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'कश्मीरी' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша' },
  { code: 'km', name: 'Khmer', nativeName: 'ភាសាខ្មែរ' },
  { code: 'ki', name: 'Kikuyu', nativeName: 'Gĩkũyũ' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda' },
  { code: 'rn', name: 'Kirundi', nativeName: 'Ikirundi' },
  { code: 'kv', name: 'Komi', nativeName: 'Коми' },
  { code: 'kg', name: 'Kongo', nativeName: 'Kikongo' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî' },
  { code: 'ckb', name: 'Kurdish (Sorani)', nativeName: 'سۆرانی' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ' },
  { code: 'la', name: 'Latin', nativeName: 'Latina' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
  { code: 'li', name: 'Limburgish', nativeName: 'Limburgs' },
  { code: 'ln', name: 'Lingala', nativeName: 'Lingála' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },
  { code: 'lu', name: 'Luba-Katanga', nativeName: 'Kiluba' },
  { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली' },
  { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti' },
  { code: 'gv', name: 'Manx', nativeName: 'Gaelg' },
  { code: 'mi', name: 'Māori', nativeName: 'Te Reo Māori' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'mh', name: 'Marshallese', nativeName: 'Kajin M̧ajeļ' },
  { code: 'mni', name: 'Meitei', nativeName: 'ꯃꯤꯇꯩꯂꯣꯟ' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол' },
  { code: 'na', name: 'Nauru', nativeName: 'Dorerin Naoero' },
  { code: 'nv', name: 'Navajo', nativeName: 'Diné bizaad' },
  { code: 'nd', name: 'Northern Ndebele', nativeName: 'IsiNdebele' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'nb', name: 'Norwegian (Bokmål)', nativeName: 'Norsk Bokmål' },
  { code: 'nn', name: 'Norwegian (Nynorsk)', nativeName: 'Nynorsk' },
  { code: 'oc', name: 'Occitan', nativeName: 'Occitan' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo' },
  { code: 'os', name: 'Ossetian', nativeName: 'Ирон' },
  { code: 'pi', name: 'Pali', nativeName: 'Pāli' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'pt-BR', name: 'Portuguese (Brazilian)', nativeName: 'Português brasileiro' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'qu', name: 'Quechua', nativeName: 'Runa Simi' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'rm', name: 'Romansh', nativeName: 'Rumantsch' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'se', name: 'Sami (Northern)', nativeName: 'Davvisámegiella' },
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Sāmoa' },
  { code: 'sg', name: 'Sango', nativeName: 'Sängö' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्' },
  { code: 'sc', name: 'Sardinian', nativeName: 'Sardu' },
  { code: 'gd', name: 'Scottish Gaelic', nativeName: 'Gàidhlig' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
  { code: 'sn', name: 'Shona', nativeName: 'ChiShona' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali' },
  { code: 'st', name: 'Southern Sotho', nativeName: 'Sesotho' },
  { code: 'nr', name: 'Southern Ndebele', nativeName: 'IsiNdebele' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'es-MX', name: 'Spanish (Mexican)', nativeName: 'Español mexicano' },
  { code: 'es-AR', name: 'Spanish (Argentine)', nativeName: 'Español rioplatense' },
  { code: 'su', name: 'Sundanese', nativeName: 'Basa Sunda' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'ss', name: 'Swati', nativeName: 'SiSwati' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog' },
  { code: 'ty', name: 'Tahitian', nativeName: 'Reo Tahiti' },
  { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'tt', name: 'Tatar', nativeName: 'Татарча' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'bo', name: 'Tibetan', nativeName: 'བོད་སྐད' },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ' },
  { code: 'to', name: 'Tongan', nativeName: 'Lea Fakatonga' },
  { code: 'ts', name: 'Tsonga', nativeName: 'Xitsonga' },
  { code: 'tn', name: 'Tswana', nativeName: 'Setswana' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'tk', name: 'Turkmen', nativeName: 'Türkmen' },
  { code: 'tw', name: 'Twi', nativeName: 'Twi' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'ug', name: 'Uyghur', nativeName: 'ئۇيغۇرچە' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbekcha' },
  { code: 've', name: 'Venda', nativeName: 'Tshivenḓa' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'vo', name: 'Volapük', nativeName: 'Volapük' },
  { code: 'wa', name: 'Walloon', nativeName: 'Walon' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg' },
  { code: 'fy', name: 'Western Frisian', nativeName: 'Frysk' },
  { code: 'wo', name: 'Wolof', nativeName: 'Wolof' },
  { code: 'xh', name: 'Xhosa', nativeName: 'IsiXhosa' },
  { code: 'yi', name: 'Yiddish', nativeName: 'ייִדיש' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá' },
  { code: 'za', name: 'Zhuang', nativeName: 'Vahcuengh' },
  { code: 'zu', name: 'Zulu', nativeName: 'IsiZulu' },
];

// Rainbow orb colors with their fade cycle durations
const orbConfigs = [
  { color: 'red', cycleDuration: 12000 },
  { color: 'orange', cycleDuration: 14000 },
  { color: 'yellow', cycleDuration: 16000 },
  { color: 'green', cycleDuration: 13000 },
  { color: 'blue', cycleDuration: 15000 },
  { color: 'indigo', cycleDuration: 11000 },
  { color: 'violet', cycleDuration: 17000 },
];

// Max opacity for orbs
const ORB_MAX_OPACITY = 0.25;

// Minimum distance between orb centers (in percentage points)
const MIN_ORB_DISTANCE = 25;

// Calculate distance between two positions
const getDistance = (pos1, pos2) => {
  const dx = pos1.left - pos2.left;
  const dy = pos1.top - pos2.top;
  return Math.sqrt(dx * dx + dy * dy);
};

// Generate a random position that's spread out from other orbs
const generateSpreadPosition = (otherOrbs, excludeIndex = -1) => {
  const maxAttempts = 50;
  let bestPosition = null;
  let bestMinDistance = 0;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = {
      top: Math.random() * 60 + 10,  // 10-70%
      left: Math.random() * 60 + 10, // 10-70%
    };
    
    // Calculate minimum distance to any other visible orb
    let minDistance = Infinity;
    for (let i = 0; i < otherOrbs.length; i++) {
      if (i === excludeIndex) continue;
      // Only consider orbs that are visible (opacity > 0.1)
      if (otherOrbs[i].opacity > 0.1) {
        const dist = getDistance(candidate, otherOrbs[i]);
        minDistance = Math.min(minDistance, dist);
      }
    }
    
    // If this position is far enough from all others, use it
    if (minDistance >= MIN_ORB_DISTANCE) {
      return candidate;
    }
    
    // Track the best position found so far
    if (minDistance > bestMinDistance) {
      bestMinDistance = minDistance;
      bestPosition = candidate;
    }
  }
  
  // Return the best position found (even if not ideal)
  return bestPosition || { top: Math.random() * 60 + 10, left: Math.random() * 60 + 10 };
};

// Generate initial spread-out positions for all orbs
const generateInitialPositions = () => {
  const positions = [];
  for (let i = 0; i < orbConfigs.length; i++) {
    const pos = generateSpreadPosition(positions.map(p => ({ ...p, opacity: 1 })));
    positions.push(pos);
  }
  return positions;
};

const Welcome = () => {
  const navigate = useNavigate();
  
  // Animation states
  const [showLogo, setShowLogo] = useState(false);
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  
  // Orb positions and animation states - each orb has its own position and opacity
  const [orbs, setOrbs] = useState(() => {
    const initialPositions = generateInitialPositions();
    return orbConfigs.map((config, index) => ({
      ...config,
      ...initialPositions[index],
      opacity: 0,
      fadingIn: true,
      // Stagger initial start times
      startDelay: index * 400,
    }));
  });

  // Handle orb fade animations
  useEffect(() => {
    const intervals = orbs.map((orb, index) => {
      const halfCycle = orb.cycleDuration / 2;
      let timeoutId;
      
      // Start with staggered delay
      timeoutId = setTimeout(() => {
        // Start fading in
        setOrbs(prev => prev.map((o, i) => 
          i === index ? { ...o, opacity: ORB_MAX_OPACITY, fadingIn: true } : o
        ));
        
        // Set up the recurring cycle
        const intervalId = setInterval(() => {
          setOrbs(prev => prev.map((o, i) => {
            if (i !== index) return o;
            
            if (o.fadingIn) {
              // Was fading in, now start fading out
              return { ...o, opacity: 0, fadingIn: false };
            } else {
              // Was fading out, move to new position (spread from others) and fade in
              const newPosition = generateSpreadPosition(prev, i);
              return { 
                ...o, 
                ...newPosition,
                opacity: ORB_MAX_OPACITY, 
                fadingIn: true 
              };
            }
          }));
        }, halfCycle);
        
        return intervalId;
      }, orb.startDelay);
      
      return timeoutId;
    });

    return () => intervals.forEach(id => clearTimeout(id));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Globe rotation state - tracks crossfade progress (0 to 1)
  const [currentGlobeIndex, setCurrentGlobeIndex] = useState(0);
  const [crossfadeProgress, setCrossfadeProgress] = useState(0);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Use the same localStorage key as AppMasthead for theme consistency
    const stored = localStorage.getItem('pf-base-theme');
    return stored === 'dark';
  });
  
  // Assistant naming state (step 0)
  const [assistantName, setAssistantName] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState('apollo');
  
  // Language selection state (step 0)
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [languageSearch, setLanguageSearch] = useState('');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const languageDropdownRef = useRef(null);

  // Greeting cycling animation state
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [greetingFading, setGreetingFading] = useState(false);
  const [greetingCycling, setGreetingCycling] = useState(false);
  const greetingLockedRef = useRef(false);
  
  // Task description state (step 3)
  const [taskDescription, setTaskDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  
  // Animate intro sequence
  useEffect(() => {
    const timers = [];
    timers.push(setTimeout(() => setShowLogo(true), 150));
    timers.push(setTimeout(() => setShowTitle(true), 600));
    timers.push(setTimeout(() => setShowSubtitle(true), 1000));
    timers.push(setTimeout(() => setShowWizard(true), 1500));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Greeting cycling is now synced with the globe animation below

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(e.target)) {
        setShowLanguageDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered languages for typeahead
  const filteredLanguages = useMemo(() => {
    const search = languageSearch.toLowerCase().trim();
    const filtered = worldLanguages.filter(lang => {
      if (!search) return true;
      return lang.name.toLowerCase().includes(search) ||
             lang.nativeName.toLowerCase().includes(search);
    });
    return filtered;
  }, [languageSearch]);

  // Globe rotation + greeting cycling — synced together
  useEffect(() => {
    const transitionDuration = 600; // Duration of crossfade in ms
    const holdDuration = 5000; // How long to hold each globe/greeting before transitioning
    
    let animationFrame;
    let startTime;
    let isTransitioning = false;
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      
      if (!isTransitioning) {
        // Holding phase - wait before starting next transition
        if (elapsed >= holdDuration) {
          if (greetingLockedRef.current) {
            // Language selected — stop cycling, just reset timer
            startTime = timestamp;
          } else {
            isTransitioning = true;
            startTime = timestamp;
            // Start greeting fade out in sync with globe crossfade
            setGreetingFading(true);
          }
        }
      } else {
        // Transitioning phase - animate crossfade
        const progress = Math.min(elapsed / transitionDuration, 1);
        setCrossfadeProgress(progress);
        
        if (progress >= 1) {
          // Transition complete - move to next globe AND next greeting
          setCurrentGlobeIndex(prev => (prev + 1) % globeEmojis.length);
          setGreetingIndex(prev => (prev + 1) % greetings.length);
          setGreetingFading(false);
          setCrossfadeProgress(0);
          isTransitioning = false;
          startTime = timestamp;
        }
      }
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    // Start cycling after intro animations complete
    const startDelay = setTimeout(() => {
      setGreetingCycling(true);
      animationFrame = requestAnimationFrame(animate);
    }, 2500);
    
    return () => {
      clearTimeout(startDelay);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  // Apply theme changes - use the same localStorage key as AppMasthead
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDarkMode) {
      htmlElement.classList.add('pf-v6-theme-dark');
      localStorage.setItem('pf-base-theme', 'dark');
    } else {
      htmlElement.classList.remove('pf-v6-theme-dark');
      localStorage.setItem('pf-base-theme', 'light');
    }
  }, [isDarkMode]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    // Simulate SSO sign-in - in production this would redirect to Red Hat SSO
    // For now, we'll simulate a brief loading state
    setTimeout(() => {
      setIsSignedIn(true);
      setIsSigningIn(false);
      localStorage.setItem('apollo-signed-in', 'true');
    }, 1500);
  };

  const handleComplete = () => {
    // Save user preferences
    if (selectedLanguage) {
      localStorage.setItem('apollo-user-language', selectedLanguage.code);
      localStorage.setItem('apollo-user-language-name', selectedLanguage.name);
    }
    localStorage.setItem('apollo-assistant-name', assistantName);
    localStorage.setItem('apollo-assistant-avatar', selectedAvatarId);
    localStorage.setItem('apollo-user-tasks', taskDescription);
    localStorage.setItem('apollo-onboarding-complete', 'true');
    navigate('/dashboard');
  };

  const canProceed = () => {
    if (currentStep === 0) return selectedLanguage !== null;
    if (currentStep === 1) return taskDescription.trim().length > 0;
    if (currentStep === 2) return isSignedIn;
    if (currentStep === 3) return assistantName.trim().length > 0;
    return true;
  };

  const handleTaskClick = useCallback((task) => {
    const taskLabel = task.label.toLowerCase();
    
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(task.id)) {
        // Deselect: remove from selected and remove label from description
        newSet.delete(task.id);
        setTaskDescription(prevDesc => {
          // Remove the task label from the description
          // Handle both ", label" and "label, " and standalone "label"
          let newDesc = prevDesc
            .replace(new RegExp(`,\\s*${taskLabel}`, 'gi'), '')
            .replace(new RegExp(`${taskLabel}\\s*,\\s*`, 'gi'), '')
            .replace(new RegExp(`^${taskLabel}$`, 'gi'), '');
          // Clean up any trailing/leading commas and extra spaces
          newDesc = newDesc.replace(/^,\s*/, '').replace(/,\s*$/, '').trim();
          return newDesc;
        });
      } else {
        // Select: add to selected and add label to description
        newSet.add(task.id);
        setTaskDescription(prevDesc => {
          const separator = prevDesc.trim() ? ', ' : '';
          return prevDesc + separator + taskLabel;
        });
      }
      return newSet;
    });
  }, []);

  const handleMicrophoneClick = useCallback(() => {
    setIsRecording(prev => !prev);
  }, []);

  const handleLanguageSelect = useCallback((lang) => {
    setSelectedLanguage(lang);
    setLanguageSearch(lang.name);
    setShowLanguageDropdown(false);

    // Lock the greeting rotation to the chosen language
    greetingLockedRef.current = true;
    const baseCode = lang.code.split('-')[0];
    const matchedIndex = greetingLanguageMap[baseCode];
    setGreetingFading(true);
    // Brief fade-out, then swap to the matched greeting
    setTimeout(() => {
      setGreetingIndex(matchedIndex !== undefined ? matchedIndex : 0);
      setGreetingFading(false);
    }, 350);
  }, []);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="welcome-step" key="step-lang">
            <h2 className="welcome-step-title">Choose your language</h2>

            <div className="welcome-language-search-wrapper" ref={languageDropdownRef}>
              <div className="welcome-language-input-container">
                <span className="welcome-language-globe-icon">
                  <GlobeIcon />
                </span>
                <TextInput
                  value={languageSearch}
                  onChange={(e, val) => {
                    setLanguageSearch(val);
                    setShowLanguageDropdown(true);
                    if (selectedLanguage && val !== selectedLanguage.name) {
                      setSelectedLanguage(null);
                    }
                  }}
                  onFocus={() => setShowLanguageDropdown(true)}
                  placeholder="Type to search for a language..."
                  aria-label="Search languages"
                  className="welcome-language-input"
                />
                {selectedLanguage && (
                  <span className="welcome-language-check">✓</span>
                )}
              </div>

              {showLanguageDropdown && !selectedLanguage && (
                <div className="welcome-language-dropdown">
                  {filteredLanguages.length > 0 ? (
                    filteredLanguages.map(lang => (
                      <button
                        key={lang.code}
                        className="welcome-language-item"
                        onClick={() => handleLanguageSelect(lang)}
                      >
                        <span className="welcome-language-name">{lang.name}</span>
                        <span className="welcome-language-native">{lang.nativeName}</span>
                      </button>
                    ))
                  ) : (
                    <div className="welcome-language-empty">No languages found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="welcome-step" key="step-space">
            <h2 className="welcome-step-title">Describe your typical day</h2>
            <p className="welcome-step-description">What tools you use, what tasks you do, what things you need.</p>
            
            {/* Task description input with microphone */}
            <div className="welcome-task-input-wrapper">
              <TextArea
                value={taskDescription}
                onChange={(e, val) => setTaskDescription(val)}
                placeholder="Write here..."
                aria-label="Describe your tasks"
                className="welcome-task-input"
                rows={3}
                resizeOrientation="vertical"
              />
              <button
                className={`welcome-mic-button ${isRecording ? 'recording' : ''}`}
                onClick={handleMicrophoneClick}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isRecording ? (
                  <div className="welcome-waveform">
                    <span className="wave-bar"></span>
                    <span className="wave-bar"></span>
                    <span className="wave-bar"></span>
                    <span className="wave-bar"></span>
                    <span className="wave-bar"></span>
                  </div>
                ) : (
                  <MicrophoneIcon />
                )}
              </button>
            </div>
            
            {/* Task suggestions */}
            <h3 className="welcome-tasks-heading">Or select some tasks</h3>
            <div className="welcome-task-chips">
              {taskSuggestions.map(task => (
                <button
                  key={task.id}
                  className={`welcome-task-chip ${selectedTaskIds.has(task.id) ? 'selected' : ''}`}
                  style={{ '--task-color': task.color }}
                  onClick={() => handleTaskClick(task)}
                >
                  {task.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="welcome-step" key="step-sso">
            <h2 className="welcome-step-title">Let's get started</h2>
            <p className="welcome-step-description">Sign in to connect to your data</p>
            <div className="welcome-sso-wrapper">
              {isSignedIn ? (
                <div className="welcome-signed-in">
                  <div className="welcome-signed-in-icon">✓</div>
                  <span className="welcome-signed-in-text">Signed in with Red Hat SSO</span>
                </div>
              ) : (
                <button
                  className="welcome-sso-button"
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                >
                  {isSigningIn ? (
                    <>
                      <span className="welcome-sso-spinner"></span>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <img src={RedHatLogo} alt="Red Hat" className="welcome-sso-logo" />
                      Sign in with Red Hat SSO
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="welcome-step" key="step-assistant">
            <h2 className="welcome-step-title">Name your assistant</h2>
            <p className="welcome-step-description">Give your AI assistant a name and choose an avatar</p>
            
            {/* Assistant name input */}
            <div className="welcome-name-input-wrapper">
              <TextInput
                value={assistantName}
                onChange={(e, val) => setAssistantName(val)}
                placeholder="Enter a name for your assistant"
                aria-label="Assistant name"
                className="welcome-name-input"
              />
            </div>
            
            {/* Avatar selection - horizontal scrollable */}
            <h3 className="welcome-avatar-heading">Choose an avatar</h3>
            <div className="welcome-avatar-scroller">
              <div className="welcome-avatar-track">
                {assistantAvatars.map(avatar => (
                  <button
                    key={avatar.id}
                    className={`welcome-avatar-option ${selectedAvatarId === avatar.id ? 'selected' : ''}`}
                    onClick={() => setSelectedAvatarId(avatar.id)}
                    aria-label={`Select ${avatar.name} avatar`}
                    title={avatar.name}
                  >
                    <object 
                      type="image/svg+xml" 
                      data={avatar.src}
                      className="welcome-avatar-svg"
                      aria-hidden="true"
                      style={{ pointerEvents: 'none' }}
                    >
                      <img src={avatar.src} alt="" />
                    </object>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="welcome-step" key="step-theme">
            <h2 className="welcome-step-title">Choose your style</h2>
            <p className="welcome-step-description">Select your preferred theme</p>
            
            <div className="welcome-theme-selector">
              <button
                className={`welcome-theme-option ${!isDarkMode ? 'active' : ''}`}
                onClick={() => setIsDarkMode(false)}
              >
                <div className="welcome-theme-preview light">
                  <div className="preview-sidebar"></div>
                  <div className="preview-content">
                    <div className="preview-line"></div>
                    <div className="preview-line short"></div>
                  </div>
                </div>
                <span className="welcome-theme-label">Light</span>
                <span className="welcome-theme-icon">☀️</span>
              </button>
              
              <button
                className={`welcome-theme-option ${isDarkMode ? 'active' : ''}`}
                onClick={() => setIsDarkMode(true)}
              >
                <div className="welcome-theme-preview dark">
                  <div className="preview-sidebar"></div>
                  <div className="preview-content">
                    <div className="preview-line"></div>
                    <div className="preview-line short"></div>
                  </div>
                </div>
                <span className="welcome-theme-label">Dark</span>
                <span className="welcome-theme-icon">🌙</span>
              </button>
            </div>
            
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="welcome-container">
      {/* Animated background */}
      <div className="welcome-bg">
        <div className="welcome-bg-gradient"></div>
        {orbs.map((orb) => (
          <div
            key={orb.color}
            className={`welcome-bg-orb orb-${orb.color}`}
            style={{
              top: `${orb.top}%`,
              left: `${orb.left}%`,
              opacity: orb.opacity,
              transition: `opacity ${orb.cycleDuration / 2}ms ease-in-out`,
            }}
          />
        ))}
      </div>
      
      {/* Content */}
      <div className="welcome-content">
        {/* Logo section - top third */}
        <div className="welcome-hero">
          <div className={`welcome-logo ${showLogo ? 'visible' : ''}`}>
            <div className="welcome-globe-container">
              <span 
                className="welcome-globe"
                style={{ opacity: 1 - crossfadeProgress }}
              >
                {globeEmojis[currentGlobeIndex]}
              </span>
              <span 
                className="welcome-globe welcome-globe-next"
                style={{ opacity: crossfadeProgress }}
              >
                {globeEmojis[(currentGlobeIndex + 1) % globeEmojis.length]}
              </span>
            </div>
          </div>
          <h1 className={`welcome-title ${showTitle ? 'visible' : ''} ${greetingCycling ? 'cycling' : ''} ${greetingFading ? 'greeting-out' : ''}`}>
            {greetings[greetingIndex]}
          </h1>
          <p className={`welcome-subtitle ${showSubtitle ? 'visible' : ''} ${greetingCycling ? 'cycling' : ''} ${greetingFading ? 'greeting-out' : ''}`}>
            {welcomeMessages[greetingIndex]}
          </p>
        </div>
        
        {/* Wizard section */}
        <div className={`welcome-wizard ${showWizard ? 'visible' : ''}`}>
          {/* Step indicators */}
          <div className="welcome-steps-indicator">
            {[0, 1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`welcome-step-dot ${step === currentStep ? 'active' : ''} ${step < currentStep ? 'completed' : ''}`}
                onClick={() => step < currentStep && setCurrentStep(step)}
              />
            ))}
          </div>
          
          {/* Step content */}
          <div className="welcome-step-container">
            {renderStep()}
          </div>
          
          {/* Navigation */}
          <div className="welcome-nav">
            {currentStep > 0 && (
              <Button
                variant="link"
                onClick={() => setCurrentStep(prev => prev - 1)}
              >
                Back
              </Button>
            )}
            <div style={{ flex: 1 }} />
            {currentStep < 4 ? (
              <Button
                variant="primary"
                isDisabled={!canProceed()}
                onClick={() => setCurrentStep(prev => prev + 1)}
                icon={<ArrowRightIcon />}
                iconPosition="end"
                className="welcome-next-btn"
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleComplete}
                icon={<CheckIcon />}
                iconPosition="end"
                className="welcome-complete-btn"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
