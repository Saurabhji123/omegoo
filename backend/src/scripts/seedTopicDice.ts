// Seed Topic Dice Prompts - 50+ Conversation Starters

import { ServiceFactory } from '../services/serviceFactory';

const DatabaseService = ServiceFactory.DatabaseService;

const topicDicePrompts = [
  // FUN CATEGORY (15 prompts)
  {
    id: 'fun-001',
    promptEn: "What's your favorite pizza topping?",
    category: 'fun' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Cuál es tu ingrediente favorito para pizza?',
      fr: 'Quel est votre garniture de pizza préférée?',
      de: 'Was ist dein Lieblings-Pizzabelag?',
      hi: 'आपकी पसंदीदा पिज्जा टॉपिंग क्या है?',
      ar: 'ما هي الإضافة المفضلة لديك للبيتزا؟',
      zh: '你最喜欢的披萨配料是什么？',
      ja: 'お気に入りのピザのトッピングは何ですか？'
    },
    tags: ['food', 'preferences', 'icebreaker'],
    active: true
  },
  {
    id: 'fun-002',
    promptEn: "If you could have any superpower, what would it be?",
    category: 'fun' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: 'Si pudieras tener algún superpoder, ¿cuál sería?',
      fr: 'Si vous pouviez avoir un super-pouvoir, lequel serait-ce?',
      de: 'Wenn du eine Superkraft haben könntest, welche wäre es?',
      hi: 'यदि आपके पास कोई महाशक्ति हो सकती है, तो वह क्या होगी?',
      zh: '如果你可以拥有任何超能力，你会选择什么？',
      ja: 'もし超能力を持てるとしたら、何がいいですか？'
    },
    tags: ['imagination', 'fun', 'hypothetical'],
    active: true
  },
  {
    id: 'fun-003',
    promptEn: "What's the most interesting place you've ever visited?",
    category: 'fun' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Cuál es el lugar más interesante que has visitado?',
      fr: 'Quel est l\'endroit le plus intéressant que vous ayez jamais visité?',
      de: 'Was ist der interessanteste Ort, den du je besucht hast?',
      hi: 'आपने अब तक की सबसे दिलचस्प जगह कौन सी देखी है?',
      zh: '你去过的最有趣的地方是哪里？',
      ja: '今まで訪れた中で最も興味深い場所はどこですか？'
    },
    tags: ['travel', 'experiences', 'stories'],
    active: true
  },
  {
    id: 'fun-004',
    promptEn: "Do you prefer cats or dogs?",
    category: 'fun' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Prefieres gatos o perros?',
      fr: 'Préférez-vous les chats ou les chiens?',
      de: 'Bevorzugst du Katzen oder Hunde?',
      hi: 'क्या आप बिल्लियों या कुत्तों को पसंद करते हैं?',
      zh: '你更喜欢猫还是狗？',
      ja: '猫と犬、どちらが好きですか？'
    },
    tags: ['pets', 'preferences', 'animals'],
    active: true
  },
  {
    id: 'fun-005',
    promptEn: "What's your favorite movie genre?",
    category: 'fun' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Cuál es tu género de película favorito?',
      fr: 'Quel est votre genre de film préféré?',
      de: 'Was ist dein Lieblings-Filmgenre?',
      hi: 'आपकी पसंदीदा फिल्म शैली क्या है?',
      zh: '你最喜欢什么类型的电影？',
      ja: '好きな映画のジャンルは何ですか？'
    },
    tags: ['entertainment', 'movies', 'preferences'],
    active: true
  },
  {
    id: 'fun-006',
    promptEn: "If you could learn any skill instantly, what would it be?",
    category: 'fun' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: 'Si pudieras aprender cualquier habilidad al instante, ¿cuál sería?',
      fr: 'Si vous pouviez apprendre une compétence instantanément, laquelle serait-ce?',
      de: 'Wenn du sofort eine Fähigkeit lernen könntest, welche wäre es?',
      hi: 'यदि आप तुरंत कोई कौशल सीख सकते हैं, तो वह क्या होगा?',
      zh: '如果你能立即学会任何技能，你会选择什么？',
      ja: '瞬時に何かスキルを習得できるとしたら、何を選びますか？'
    },
    tags: ['skills', 'aspirations', 'hypothetical'],
    active: true
  },
  {
    id: 'fun-007',
    promptEn: "What's your favorite season of the year?",
    category: 'fun' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Cuál es tu estación del año favorita?',
      fr: 'Quelle est votre saison préférée de l\'année?',
      de: 'Was ist deine Lieblingsjahreszeit?',
      hi: 'साल का आपका पसंदीदा मौसम कौन सा है?',
      zh: '你最喜欢一年中的哪个季节？',
      ja: '好きな季節は何ですか？'
    },
    tags: ['weather', 'preferences', 'nature'],
    active: true
  },
  {
    id: 'fun-008',
    promptEn: "Do you prefer morning or night?",
    category: 'fun' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Prefieres la mañana o la noche?',
      fr: 'Préférez-vous le matin ou la nuit?',
      de: 'Bevorzugst du den Morgen oder die Nacht?',
      hi: 'क्या आप सुबह या रात को पसंद करते हैं?',
      zh: '你更喜欢早晨还是夜晚？',
      ja: '朝と夜、どちらが好きですか？'
    },
    tags: ['lifestyle', 'preferences', 'routine'],
    active: true
  },
  {
    id: 'fun-009',
    promptEn: "What's the best concert or live show you've been to?",
    category: 'fun' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Cuál es el mejor concierto o show en vivo al que has ido?',
      fr: 'Quel est le meilleur concert ou spectacle auquel vous avez assisté?',
      de: 'Was ist das beste Konzert oder die beste Live-Show, die du besucht hast?',
      hi: 'आपने अब तक का सबसे अच्छा संगीत कार्यक्रम कौन सा देखा है?',
      zh: '你看过的最好的音乐会是哪场？',
      ja: '今まで行った中で最高のコンサートは何ですか？'
    },
    tags: ['music', 'entertainment', 'experiences'],
    active: true
  },
  {
    id: 'fun-010',
    promptEn: "If you could time travel, would you go to the past or future?",
    category: 'fun' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: 'Si pudieras viajar en el tiempo, ¿irías al pasado o al futuro?',
      fr: 'Si vous pouviez voyager dans le temps, iriez-vous dans le passé ou le futur?',
      de: 'Wenn du durch die Zeit reisen könntest, würdest du in die Vergangenheit oder Zukunft gehen?',
      hi: 'यदि आप समय यात्रा कर सकते हैं, तो क्या आप अतीत या भविष्य में जाएंगे?',
      zh: '如果你能时间旅行，你会去过去还是未来？',
      ja: 'タイムトラベルできるなら、過去と未来どちらに行きますか？'
    },
    tags: ['hypothetical', 'time', 'imagination'],
    active: true
  },
  {
    id: 'fun-011',
    promptEn: "What's your favorite hobby?",
    category: 'fun' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Cuál es tu pasatiempo favorito?',
      fr: 'Quel est votre passe-temps préféré?',
      de: 'Was ist dein Lieblingshobby?',
      hi: 'आपका पसंदीदा शौक क्या है?',
      zh: '你最喜欢的爱好是什么？',
      ja: '好きな趣味は何ですか？'
    },
    tags: ['hobbies', 'interests', 'activities'],
    active: true
  },
  {
    id: 'fun-012',
    promptEn: "Beach vacation or mountain getaway?",
    category: 'fun' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Vacaciones en la playa o escapada a la montaña?',
      fr: 'Vacances à la plage ou escapade en montagne?',
      de: 'Strandurlaub oder Bergausflug?',
      hi: 'समुद्र तट की छुट्टी या पहाड़ों की यात्रा?',
      zh: '海滩度假还是山区度假？',
      ja: 'ビーチバケーションか山の隠れ家、どちらがいいですか？'
    },
    tags: ['travel', 'vacation', 'preferences'],
    active: true
  },
  {
    id: 'fun-013',
    promptEn: "What's your go-to karaoke song?",
    category: 'fun' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Cuál es tu canción favorita para karaoke?',
      fr: 'Quelle est votre chanson préférée pour le karaoké?',
      de: 'Was ist dein Lieblings-Karaoke-Song?',
      hi: 'आपका पसंदीदा कराओके गाना कौन सा है?',
      zh: '你最喜欢唱的卡拉OK歌曲是什么？',
      ja: 'カラオケの十八番は何ですか？'
    },
    tags: ['music', 'entertainment', 'fun'],
    active: true
  },
  {
    id: 'fun-014',
    promptEn: "Coffee or tea person?",
    category: 'fun' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Eres de café o té?',
      fr: 'Plutôt café ou thé?',
      de: 'Kaffee- oder Tee-Person?',
      hi: 'कॉफी या चाय?',
      zh: '你喜欢咖啡还是茶？',
      ja: 'コーヒー派？紅茶派？'
    },
    tags: ['beverages', 'preferences', 'lifestyle'],
    active: true
  },
  {
    id: 'fun-015',
    promptEn: "What's the weirdest food you've ever tried?",
    category: 'fun' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Cuál es la comida más rara que has probado?',
      fr: 'Quel est l\'aliment le plus étrange que vous ayez essayé?',
      de: 'Was ist das seltsamste Essen, das du je probiert hast?',
      hi: 'आपने अब तक का सबसे अजीब खाना क्या खाया है?',
      zh: '你吃过的最奇怪的食物是什么？',
      ja: '今まで食べた中で一番変わった食べ物は何ですか？'
    },
    tags: ['food', 'experiences', 'stories'],
    active: true
  },

  // SAFE CATEGORY (15 prompts)
  {
    id: 'safe-001',
    promptEn: "What do you do for fun?",
    category: 'safe' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Qué haces para divertirte?',
      fr: 'Que faites-vous pour vous amuser?',
      de: 'Was machst du zum Spaß?',
      hi: 'आप मनोरंजन के लिए क्या करते हैं?',
      zh: '你平时做什么消遣？',
      ja: '楽しみのために何をしますか？'
    },
    tags: ['hobbies', 'activities', 'safe'],
    active: true
  },
  {
    id: 'safe-002',
    promptEn: "Where are you from?",
    category: 'safe' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿De dónde eres?',
      fr: 'D\'où venez-vous?',
      de: 'Woher kommst du?',
      hi: 'आप कहाँ से हैं?',
      zh: '你来自哪里？',
      ja: 'どこから来ましたか？'
    },
    tags: ['location', 'background', 'icebreaker'],
    active: true
  },
  {
    id: 'safe-003',
    promptEn: "What kind of music do you like?",
    category: 'safe' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Qué tipo de música te gusta?',
      fr: 'Quel genre de musique aimez-vous?',
      de: 'Welche Art von Musik magst du?',
      hi: 'आपको किस प्रकार का संगीत पसंद है?',
      zh: '你喜欢什么类型的音乐？',
      ja: 'どんな音楽が好きですか？'
    },
    tags: ['music', 'preferences', 'interests'],
    active: true
  },
  {
    id: 'safe-004',
    promptEn: "Do you have any pets?",
    category: 'safe' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Tienes mascotas?',
      fr: 'Avez-vous des animaux de compagnie?',
      de: 'Hast du Haustiere?',
      hi: 'क्या आपके पास कोई पालतू जानवर है?',
      zh: '你有宠物吗？',
      ja: 'ペットは飼っていますか？'
    },
    tags: ['pets', 'animals', 'personal'],
    active: true
  },
  {
    id: 'safe-005',
    promptEn: "What's your favorite book or movie?",
    category: 'safe' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Cuál es tu libro o película favorita?',
      fr: 'Quel est votre livre ou film préféré?',
      de: 'Was ist dein Lieblingsbuch oder Lieblingsfilm?',
      hi: 'आपकी पसंदीदा किताब या फिल्म कौन सी है?',
      zh: '你最喜欢的书或电影是什么？',
      ja: '好きな本や映画は何ですか？'
    },
    tags: ['entertainment', 'preferences', 'culture'],
    active: true
  },
  {
    id: 'safe-006',
    promptEn: "What's something you're really good at?",
    category: 'safe' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿En qué eres realmente bueno?',
      fr: 'Dans quoi êtes-vous vraiment bon?',
      de: 'Worin bist du wirklich gut?',
      hi: 'आप किस चीज़ में वाकई अच्छे हैं?',
      zh: '你擅长什么？',
      ja: '何が本当に得意ですか？'
    },
    tags: ['skills', 'talents', 'positive'],
    active: true
  },
  {
    id: 'safe-007',
    promptEn: "Do you play any sports?",
    category: 'safe' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Practicas algún deporte?',
      fr: 'Pratiquez-vous un sport?',
      de: 'Machst du Sport?',
      hi: 'क्या आप कोई खेल खेलते हैं?',
      zh: '你做什么运动？',
      ja: 'スポーツはしますか？'
    },
    tags: ['sports', 'activities', 'fitness'],
    active: true
  },
  {
    id: 'safe-008',
    promptEn: "What's your favorite food?",
    category: 'safe' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Cuál es tu comida favorita?',
      fr: 'Quel est votre plat préféré?',
      de: 'Was ist dein Lieblingsessen?',
      hi: 'आपका पसंदीदा खाना क्या है?',
      zh: '你最喜欢的食物是什么？',
      ja: '好きな食べ物は何ですか？'
    },
    tags: ['food', 'preferences', 'cuisine'],
    active: true
  },
  {
    id: 'safe-009',
    promptEn: "Are you a student or working?",
    category: 'safe' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Eres estudiante o trabajas?',
      fr: 'Êtes-vous étudiant ou travaillez-vous?',
      de: 'Bist du Student oder arbeitest du?',
      hi: 'क्या आप छात्र हैं या काम करते हैं?',
      zh: '你是学生还是工作？',
      ja: '学生ですか、働いていますか？'
    },
    tags: ['occupation', 'life', 'general'],
    active: true
  },
  {
    id: 'safe-010',
    promptEn: "What's the best advice you've ever received?",
    category: 'safe' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Cuál es el mejor consejo que has recibido?',
      fr: 'Quel est le meilleur conseil que vous ayez reçu?',
      de: 'Was ist der beste Rat, den du je erhalten hast?',
      hi: 'आपको मिली सबसे अच्छी सलाह क्या है?',
      zh: '你收到过的最好的建议是什么？',
      ja: '今までもらった最高のアドバイスは何ですか？'
    },
    tags: ['wisdom', 'advice', 'life-lessons'],
    active: true
  },
  {
    id: 'safe-011',
    promptEn: "How's your day going?",
    category: 'safe' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Cómo va tu día?',
      fr: 'Comment se passe votre journée?',
      de: 'Wie läuft dein Tag?',
      hi: 'आपका दिन कैसा जा रहा है?',
      zh: '你今天过得怎么样？',
      ja: '今日はどうですか？'
    },
    tags: ['greeting', 'wellbeing', 'casual'],
    active: true
  },
  {
    id: 'safe-012',
    promptEn: "What languages do you speak?",
    category: 'safe' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Qué idiomas hablas?',
      fr: 'Quelles langues parlez-vous?',
      de: 'Welche Sprachen sprichst du?',
      hi: 'आप कौन सी भाषाएँ बोलते हैं?',
      zh: '你会说什么语言？',
      ja: '何語を話しますか？'
    },
    tags: ['language', 'culture', 'skills'],
    active: true
  },
  {
    id: 'safe-013',
    promptEn: "Do you like cooking?",
    category: 'safe' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Te gusta cocinar?',
      fr: 'Aimez-vous cuisiner?',
      de: 'Kochst du gerne?',
      hi: 'क्या आपको खाना बनाना पसंद है?',
      zh: '你喜欢做饭吗？',
      ja: '料理は好きですか？'
    },
    tags: ['cooking', 'hobbies', 'food'],
    active: true
  },
  {
    id: 'safe-014',
    promptEn: "What's your favorite way to relax?",
    category: 'safe' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Cuál es tu forma favorita de relajarte?',
      fr: 'Quelle est votre façon préférée de vous détendre?',
      de: 'Was ist deine Lieblingsart, dich zu entspannen?',
      hi: 'आराम करने का आपका पसंदीदा तरीका क्या है?',
      zh: '你最喜欢的放松方式是什么？',
      ja: '好きなリラックス方法は何ですか？'
    },
    tags: ['relaxation', 'self-care', 'lifestyle'],
    active: true
  },
  {
    id: 'safe-015',
    promptEn: "Are you a morning person or a night owl?",
    category: 'safe' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Eres madrugador o noctámbulo?',
      fr: 'Êtes-vous du matin ou du soir?',
      de: 'Bist du ein Morgenmensch oder eine Nachteule?',
      hi: 'क्या आप सुबह के व्यक्ति हैं या रात के उल्लू?',
      zh: '你是早起的人还是夜猫子？',
      ja: '朝型人間ですか、夜型人間ですか？'
    },
    tags: ['lifestyle', 'routine', 'personality'],
    active: true
  },

  // DEEP CATEGORY (12 prompts)
  {
    id: 'deep-001',
    promptEn: "What's a dream you've always had?",
    category: 'deep' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Cuál es un sueño que siempre has tenido?',
      fr: 'Quel est un rêve que vous avez toujours eu?',
      de: 'Was ist ein Traum, den du immer hattest?',
      hi: 'आपका हमेशा से क्या सपना रहा है?',
      zh: '你一直以来的梦想是什么？',
      ja: 'ずっと持っている夢は何ですか？'
    },
    tags: ['dreams', 'aspirations', 'personal'],
    active: true
  },
  {
    id: 'deep-002',
    promptEn: "What's something you're grateful for today?",
    category: 'deep' as const,
    maturityRating: 'G' as const,
    localizedVariants: {
      es: '¿Por qué estás agradecido hoy?',
      fr: 'Pour quoi êtes-vous reconnaissant aujourd\'hui?',
      de: 'Wofür bist du heute dankbar?',
      hi: 'आज आप किस बात के लिए आभारी हैं?',
      zh: '你今天感激什么？',
      ja: '今日感謝していることは何ですか？'
    },
    tags: ['gratitude', 'positive', 'reflection'],
    active: true
  },
  {
    id: 'deep-003',
    promptEn: "If you could change one thing about the world, what would it be?",
    category: 'deep' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: 'Si pudieras cambiar una cosa del mundo, ¿qué sería?',
      fr: 'Si vous pouviez changer une chose dans le monde, que serait-ce?',
      de: 'Wenn du eine Sache auf der Welt ändern könntest, was wäre es?',
      hi: 'यदि आप दुनिया में एक चीज़ बदल सकते हैं, तो वह क्या होगी?',
      zh: '如果你能改变世界上的一件事，你会选择什么？',
      ja: '世界を一つ変えられるとしたら、何を変えますか？'
    },
    tags: ['philosophy', 'world', 'values'],
    active: true
  },
  {
    id: 'deep-004',
    promptEn: "What's the most important lesson life has taught you?",
    category: 'deep' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Cuál es la lección más importante que te ha enseñado la vida?',
      fr: 'Quelle est la leçon la plus importante que la vie vous a enseignée?',
      de: 'Was ist die wichtigste Lektion, die dir das Leben beigebracht hat?',
      hi: 'जीवन ने आपको सबसे महत्वपूर्ण सबक क्या सिखाया है?',
      zh: '生活教给你的最重要的一课是什么？',
      ja: '人生があなたに教えてくれた最も重要な教訓は何ですか？'
    },
    tags: ['life-lessons', 'wisdom', 'growth'],
    active: true
  },
  {
    id: 'deep-005',
    promptEn: "What makes you feel truly alive?",
    category: 'deep' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Qué te hace sentir realmente vivo?',
      fr: 'Qu\'est-ce qui vous fait vous sentir vraiment vivant?',
      de: 'Was lässt dich dich wirklich lebendig fühlen?',
      hi: 'क्या आपको वास्तव में जीवित महसूस कराता है?',
      zh: '什么让你感到真正的活着？',
      ja: '本当に生きていると感じるのはどんな時ですか？'
    },
    tags: ['passion', 'feelings', 'purpose'],
    active: true
  },
  {
    id: 'deep-006',
    promptEn: "Who has had the biggest impact on your life?",
    category: 'deep' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Quién ha tenido el mayor impacto en tu vida?',
      fr: 'Qui a eu le plus grand impact sur votre vie?',
      de: 'Wer hatte den größten Einfluss auf dein Leben?',
      hi: 'आपके जीवन पर सबसे बड़ा प्रभाव किसका रहा है?',
      zh: '谁对你的生活影响最大？',
      ja: 'あなたの人生に最も大きな影響を与えたのは誰ですか？'
    },
    tags: ['influence', 'relationships', 'personal'],
    active: true
  },
  {
    id: 'deep-007',
    promptEn: "What's your biggest fear?",
    category: 'deep' as const,
    maturityRating: 'PG-13' as const,
    localizedVariants: {
      es: '¿Cuál es tu mayor miedo?',
      fr: 'Quelle est votre plus grande peur?',
      de: 'Was ist deine größte Angst?',
      hi: 'आपका सबसे बड़ा डर क्या है?',
      zh: '你最大的恐惧是什么？',
      ja: '一番の恐怖は何ですか？'
    },
    tags: ['fears', 'vulnerability', 'personal'],
    active: true
  },
  {
    id: 'deep-008',
    promptEn: "Where do you see yourself in 5 years?",
    category: 'deep' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Dónde te ves en 5 años?',
      fr: 'Où vous voyez-vous dans 5 ans?',
      de: 'Wo siehst du dich in 5 Jahren?',
      hi: '5 साल में आप खुद को कहाँ देखते हैं?',
      zh: '你觉得5年后你会在哪里？',
      ja: '5年後、自分はどうなっていると思いますか？'
    },
    tags: ['future', 'goals', 'planning'],
    active: true
  },
  {
    id: 'deep-009',
    promptEn: "What's something you wish you were better at?",
    category: 'deep' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿En qué desearías ser mejor?',
      fr: 'Dans quoi aimeriez-vous être meilleur?',
      de: 'Worin wünschtest du dir, besser zu sein?',
      hi: 'आप किस चीज़ में बेहतर होना चाहते हैं?',
      zh: '你希望自己在什么方面更好？',
      ja: '何がもっと上手になりたいですか？'
    },
    tags: ['improvement', 'goals', 'self-reflection'],
    active: true
  },
  {
    id: 'deep-010',
    promptEn: "What's your definition of success?",
    category: 'deep' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Cuál es tu definición de éxito?',
      fr: 'Quelle est votre définition du succès?',
      de: 'Was ist deine Definition von Erfolg?',
      hi: 'सफलता की आपकी परिभाषा क्या है?',
      zh: '你对成功的定义是什么？',
      ja: 'あなたにとって成功とは何ですか？'
    },
    tags: ['success', 'values', 'philosophy'],
    active: true
  },
  {
    id: 'deep-011',
    promptEn: "What's a challenge you've overcome that you're proud of?",
    category: 'deep' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Cuál es un desafío que has superado del que estás orgulloso?',
      fr: 'Quel défi avez-vous surmonté dont vous êtes fier?',
      de: 'Welche Herausforderung hast du gemeistert, auf die du stolz bist?',
      hi: 'आपने कौन सी चुनौती पार की है जिस पर आपको गर्व है?',
      zh: '你克服了什么挑战让你感到自豪？',
      ja: '誇りに思っている克服した困難は何ですか？'
    },
    tags: ['achievement', 'pride', 'growth'],
    active: true
  },
  {
    id: 'deep-012',
    promptEn: "What does happiness mean to you?",
    category: 'deep' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Qué significa la felicidad para ti?',
      fr: 'Que signifie le bonheur pour vous?',
      de: 'Was bedeutet Glück für dich?',
      hi: 'आपके लिए खुशी का क्या मतलब है?',
      zh: '幸福对你来说意味着什么？',
      ja: 'あなたにとって幸せとは何ですか？'
    },
    tags: ['happiness', 'philosophy', 'values'],
    active: true
  },

  // FLIRTY CATEGORY (10 prompts)
  {
    id: 'flirty-001',
    promptEn: "What's your idea of a perfect evening?",
    category: 'flirty' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Cuál es tu idea de una noche perfecta?',
      fr: 'Quelle est votre idée d\'une soirée parfaite?',
      de: 'Was ist deine Vorstellung von einem perfekten Abend?',
      hi: 'एक आदर्श शाम के बारे में आपका क्या विचार है?',
      zh: '你理想中的完美夜晚是什么样的？',
      ja: '完璧な夜とはどんな感じですか？'
    },
    tags: ['romance', 'dating', 'preferences'],
    active: true
  },
  {
    id: 'flirty-002',
    promptEn: "What's the first thing you notice about someone?",
    category: 'flirty' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Qué es lo primero que notas en alguien?',
      fr: 'Quelle est la première chose que vous remarquez chez quelqu\'un?',
      de: 'Was fällt dir als erstes an jemandem auf?',
      hi: 'किसी के बारे में आप सबसे पहले क्या नोटिस करते हैं?',
      zh: '你第一眼注意到别人什么？',
      ja: '人を見て最初に気づくことは何ですか？'
    },
    tags: ['attraction', 'first-impressions', 'personality'],
    active: true
  },
  {
    id: 'flirty-003',
    promptEn: "Do you believe in love at first sight?",
    category: 'flirty' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Crees en el amor a primera vista?',
      fr: 'Croyez-vous au coup de foudre?',
      de: 'Glaubst du an Liebe auf den ersten Blick?',
      hi: 'क्या आप पहली नज़र में प्यार में विश्वास करते हैं?',
      zh: '你相信一见钟情吗？',
      ja: '一目惚れを信じますか？'
    },
    tags: ['love', 'romance', 'beliefs'],
    active: true
  },
  {
    id: 'flirty-004',
    promptEn: "What's your idea of a perfect date?",
    category: 'flirty' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Cuál es tu idea de una cita perfecta?',
      fr: 'Quelle est votre idée d\'un rendez-vous parfait?',
      de: 'Was ist deine Vorstellung von einem perfekten Date?',
      hi: 'एक आदर्श डेट के बारे में आपका क्या विचार है?',
      zh: '你理想中的完美约会是什么样的？',
      ja: '完璧なデートとはどんな感じですか？'
    },
    tags: ['dating', 'romance', 'preferences'],
    active: true
  },
  {
    id: 'flirty-005',
    promptEn: "What's your biggest turn-on in a person?",
    category: 'flirty' as const,
    maturityRating: 'PG-13' as const,
    localizedVariants: {
      es: '¿Qué es lo que más te atrae de una persona?',
      fr: 'Qu\'est-ce qui vous attire le plus chez quelqu\'un?',
      de: 'Was findest du an einer Person am anziehendsten?',
      hi: 'किसी व्यक्ति में आपको सबसे ज्यादा क्या आकर्षित करता है?',
      zh: '一个人最吸引你的是什么？',
      ja: '人の何に最も惹かれますか？'
    },
    tags: ['attraction', 'personality', 'preferences'],
    active: true
  },
  {
    id: 'flirty-006',
    promptEn: "Are you more of a romantic or adventurous person?",
    category: 'flirty' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Eres más romántico o aventurero?',
      fr: 'Êtes-vous plutôt romantique ou aventureux?',
      de: 'Bist du eher romantisch oder abenteuerlustig?',
      hi: 'क्या आप अधिक रोमांटिक हैं या साहसी?',
      zh: '你更浪漫还是更冒险？',
      ja: 'ロマンチックなタイプ？冒険好きなタイプ？'
    },
    tags: ['personality', 'dating', 'preferences'],
    active: true
  },
  {
    id: 'flirty-007',
    promptEn: "What's your love language?",
    category: 'flirty' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Cuál es tu lenguaje del amor?',
      fr: 'Quel est votre langage de l\'amour?',
      de: 'Was ist deine Liebessprache?',
      hi: 'आपकी प्यार की भाषा क्या है?',
      zh: '你的爱情语言是什么？',
      ja: 'あなたの愛の言語は何ですか？'
    },
    tags: ['love', 'relationships', 'communication'],
    active: true
  },
  {
    id: 'flirty-008',
    promptEn: "Do you prefer staying in or going out?",
    category: 'flirty' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Prefieres quedarte en casa o salir?',
      fr: 'Préférez-vous rester à la maison ou sortir?',
      de: 'Bleibst du lieber zu Hause oder gehst du lieber aus?',
      hi: 'क्या आप घर में रहना पसंद करते हैं या बाहर जाना?',
      zh: '你喜欢待在家里还是出去玩？',
      ja: '家にいるのと外出するのどちらが好きですか？'
    },
    tags: ['lifestyle', 'dating', 'preferences'],
    active: true
  },
  {
    id: 'flirty-009',
    promptEn: "What's your type?",
    category: 'flirty' as const,
    maturityRating: 'PG-13' as const,
    localizedVariants: {
      es: '¿Cuál es tu tipo?',
      fr: 'Quel est votre type?',
      de: 'Was ist dein Typ?',
      hi: 'आपकी पसंद क्या है?',
      zh: '你喜欢什么类型的人？',
      ja: 'あなたのタイプは何ですか？'
    },
    tags: ['attraction', 'preferences', 'dating'],
    active: true
  },
  {
    id: 'flirty-010',
    promptEn: "What's the most romantic thing someone has done for you?",
    category: 'flirty' as const,
    maturityRating: 'PG' as const,
    localizedVariants: {
      es: '¿Qué es lo más romántico que alguien ha hecho por ti?',
      fr: 'Quelle est la chose la plus romantique que quelqu\'un ait fait pour vous?',
      de: 'Was ist das Romantischste, das jemand für dich getan hat?',
      hi: 'किसी ने आपके लिए सबसे रोमांटिक काम क्या किया है?',
      zh: '有人为你做过的最浪漫的事是什么？',
      ja: '今まで誰かにしてもらった一番ロマンチックなことは何ですか？'
    },
    tags: ['romance', 'experiences', 'relationships'],
    active: true
  }
];

async function seedTopicDicePrompts() {
  try {
    console.log('🎲 Starting Topic Dice seed script...');
    
    // Initialize database
    await (DatabaseService as any).initialize();
    console.log('✅ Database connected');

    let successCount = 0;
    let errorCount = 0;

    for (const prompt of topicDicePrompts) {
      try {
        await DatabaseService.createTopicDicePrompt({
          ...prompt,
          createdAt: new Date()
        });
        successCount++;
        console.log(`✅ Created prompt: ${prompt.id} (${prompt.category})`);
      } catch (error: any) {
        // Check if it's a duplicate key error
        if (error.code === 11000 || error.message?.includes('duplicate')) {
          console.log(`⚠️ Prompt ${prompt.id} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating prompt ${prompt.id}:`, error.message);
          errorCount++;
        }
      }
    }

    console.log('\n📊 Seed Summary:');
    console.log(`✅ Successfully created: ${successCount} prompts`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Total prompts in database: ${topicDicePrompts.length}`);
    
    // Display category breakdown
    const categoryCount: Record<string, number> = {};
    topicDicePrompts.forEach(p => {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    });
    
    console.log('\n📁 Category Breakdown:');
    Object.entries(categoryCount).forEach(([category, count]) => {
      const emoji = category === 'fun' ? '🎉' : category === 'safe' ? '😊' : category === 'deep' ? '🤔' : '😉';
      console.log(`  ${emoji} ${category}: ${count} prompts`);
    });

    console.log('\n✅ Topic Dice seed completed!');
    
    // Close database connection
    await (DatabaseService as any).disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  }
}

// Run seed if called directly
if (require.main === module) {
  seedTopicDicePrompts();
}

export { seedTopicDicePrompts, topicDicePrompts };
