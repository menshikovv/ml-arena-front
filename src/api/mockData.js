const PROFILES = [
  { id: "p1", user_name: "AI_Ninja", full_name: "Артем Соколов", rating: 1580, avatar_url: null, bio: "Магистр ИИ, 5 лет в ML. Победитель 12 турниров.", city: "Москва", university: "МГУ им. Ломоносова", company: "Yandex", github_url: "#", kaggle_url: "#", visible_to_employers: true, skill_nlp: 92, skill_cv: 78, skill_tabular: 85, skill_regression: 80, skill_classification: 88, skill_time_series: 70, duels_won: 47, duels_lost: 12, competitions_won: 12, competitions_participated: 28, rating_history: [{ date: "2025-01", rating: 1200 }, { date: "2025-02", rating: 1280 }, { date: "2025-03", rating: 1350 }, { date: "2025-04", rating: 1420 }, { date: "2025-05", rating: 1500 }, { date: "2025-06", rating: 1580 }] },
  { id: "p2", user_name: "DataWizard", full_name: "Елена Воробьева", rating: 1520, avatar_url: null, bio: "PhD Computer Science. Специалист по NLP.", city: "Санкт-Петербург", university: "СПбГУ", company: "Tinkoff", github_url: "#", kaggle_url: "#", visible_to_employers: true, skill_nlp: 95, skill_cv: 60, skill_tabular: 75, skill_regression: 65, skill_classification: 82, skill_time_series: 55, duels_won: 38, duels_lost: 10, competitions_won: 8, competitions_participated: 20, rating_history: [{ date: "2025-01", rating: 1150 }, { date: "2025-02", rating: 1220 }, { date: "2025-03", rating: 1300 }, { date: "2025-04", rating: 1400 }, { date: "2025-05", rating: 1480 }, { date: "2025-06", rating: 1520 }] },
  { id: "p3", user_name: "TensorLord", full_name: "Дмитрий Волков", rating: 1480, avatar_url: null, bio: "Research Engineer @ Sber AI. Люблю CV.", city: "Казань", university: "КФУ", company: "Sber", github_url: "#", kaggle_url: "#", visible_to_employers: true, skill_nlp: 50, skill_cv: 96, skill_tabular: 70, skill_regression: 60, skill_classification: 78, skill_time_series: 60, duels_won: 35, duels_lost: 14, competitions_won: 6, competitions_participated: 18, rating_history: [{ date: "2025-01", rating: 1100 }, { date: "2025-02", rating: 1180 }, { date: "2025-03", rating: 1260 }, { date: "2025-04", rating: 1340 }, { date: "2025-05", rating: 1420 }, { date: "2025-06", rating: 1480 }] },
  { id: "p4", user_name: "NeuralFox", full_name: "Анна Кузнецова", rating: 1420, avatar_url: null, bio: "ML Engineer. Kaggle Grandmaster.", city: "Новосибирск", university: "НГУ", company: null, github_url: "#", kaggle_url: "#", visible_to_employers: true, skill_nlp: 75, skill_cv: 82, skill_tabular: 88, skill_regression: 80, skill_classification: 90, skill_time_series: 72, duels_won: 30, duels_lost: 10, competitions_won: 5, competitions_participated: 15, rating_history: [{ date: "2025-01", rating: 1050 }, { date: "2025-02", rating: 1120 }, { date: "2025-03", rating: 1200 }, { date: "2025-04", rating: 1280 }, { date: "2025-05", rating: 1360 }, { date: "2025-06", rating: 1420 }] },
  { id: "p5", user_name: "ML_Glider", full_name: "Иван Морозов", rating: 1380, avatar_url: null, bio: "Студент, увлекаюсь ML и математикой.", city: "Екатеринбург", university: "УрФУ", company: null, github_url: "#", kaggle_url: null, visible_to_employers: true, skill_nlp: 45, skill_cv: 55, skill_tabular: 92, skill_regression: 88, skill_classification: 70, skill_time_series: 80, duels_won: 25, duels_lost: 15, competitions_won: 3, competitions_participated: 10, rating_history: [{ date: "2025-01", rating: 1000 }, { date: "2025-02", rating: 1060 }, { date: "2025-03", rating: 1140 }, { date: "2025-04", rating: 1220 }, { date: "2025-05", rating: 1300 }, { date: "2025-06", rating: 1380 }] },
  { id: "p6", user_name: "DeepSeeker", full_name: "Ольга Павлова", rating: 1340, avatar_url: null, bio: "Backend → ML. 3 года в Data Science.", city: "Москва", university: "ВШЭ", company: "Ozon", github_url: "#", kaggle_url: "#", visible_to_employers: true, skill_nlp: 68, skill_cv: 45, skill_tabular: 80, skill_regression: 75, skill_classification: 72, skill_time_series: 90, duels_won: 22, duels_lost: 12, competitions_won: 2, competitions_participated: 8, rating_history: [{ date: "2025-01", rating: 980 }, { date: "2025-02", rating: 1040 }, { date: "2025-03", rating: 1120 }, { date: "2025-04", rating: 1200 }, { date: "2025-05", rating: 1280 }, { date: "2025-06", rating: 1340 }] },
  { id: "p7", user_name: "GradientHero", full_name: "Сергей Титов", rating: 1280, avatar_url: null, bio: "Люблю соревнования и open source.", city: "Томск", university: "ТГУ", company: null, github_url: "#", kaggle_url: null, visible_to_employers: false, skill_nlp: 60, skill_cv: 50, skill_tabular: 70, skill_regression: 65, skill_classification: 68, skill_time_series: 55, duels_won: 18, duels_lost: 14, competitions_won: 1, competitions_participated: 6, rating_history: [{ date: "2025-01", rating: 900 }, { date: "2025-02", rating: 980 }, { date: "2025-03", rating: 1050 }, { date: "2025-04", rating: 1120 }, { date: "2025-05", rating: 1200 }, { date: "2025-06", rating: 1280 }] },
  { id: "p8", user_name: "LossMin", full_name: "Мария Белова", rating: 1250, avatar_url: null, bio: "Аналитик данных → ML Engineer.", city: "Нижний Новгород", university: "ННГУ", company: "Huawei", github_url: "#", kaggle_url: "#", visible_to_employers: true, skill_nlp: 55, skill_cv: 40, skill_tabular: 85, skill_regression: 90, skill_classification: 65, skill_time_series: 78, duels_won: 15, duels_lost: 10, competitions_won: 1, competitions_participated: 5, rating_history: [{ date: "2025-01", rating: 880 }, { date: "2025-02", rating: 950 }, { date: "2025-03", rating: 1020 }, { date: "2025-04", rating: 1100 }, { date: "2025-05", rating: 1180 }, { date: "2025-06", rating: 1250 }] },
  { id: "p9", user_name: "BinaryBrain", full_name: "Алексей Федоров", rating: 1200, avatar_url: null, bio: "Учусь на ML-инженера. Участник Opensource.", city: "Ростов-на-Дону", university: "ЮФУ", company: null, github_url: "#", kaggle_url: null, visible_to_employers: true, skill_nlp: 35, skill_cv: 30, skill_tabular: 72, skill_regression: 68, skill_classification: 75, skill_time_series: 45, duels_won: 12, duels_lost: 12, competitions_won: 0, competitions_participated: 4, rating_history: [{ date: "2025-01", rating: 850 }, { date: "2025-02", rating: 920 }, { date: "2025-03", rating: 980 }, { date: "2025-04", rating: 1050 }, { date: "2025-05", rating: 1130 }, { date: "2025-06", rating: 1200 }] },
  { id: "p10", user_name: "DataRacer", full_name: "Екатерина Смирнова", rating: 1150, avatar_url: null, bio: "Data Scientist. Нравится NLP.", city: "Самара", university: "СамГУ", company: "VK", github_url: "#", kaggle_url: "#", visible_to_employers: true, skill_nlp: 80, skill_cv: 25, skill_tabular: 60, skill_regression: 55, skill_classification: 62, skill_time_series: 40, duels_won: 10, duels_lost: 8, competitions_won: 0, competitions_participated: 3, rating_history: [{ date: "2025-01", rating: 800 }, { date: "2025-02", rating: 870 }, { date: "2025-03", rating: 950 }, { date: "2025-04", rating: 1020 }, { date: "2025-05", rating: 1080 }, { date: "2025-06", rating: 1150 }] },
  { id: "p11", user_name: "ML_Nomad", full_name: "Павел Григорьев", rating: 1100, avatar_url: null, bio: "Путешествую и учу нейросети.", city: "Краснодар", university: "КубГУ", company: null, github_url: "#", kaggle_url: null, visible_to_employers: false, skill_nlp: 42, skill_cv: 58, skill_tabular: 50, skill_regression: 45, skill_classification: 55, skill_time_series: 35, duels_won: 8, duels_lost: 10, competitions_won: 0, competitions_participated: 2, rating_history: [{ date: "2025-01", rating: 780 }, { date: "2025-02", rating: 840 }, { date: "2025-03", rating: 920 }, { date: "2025-04", rating: 980 }, { date: "2025-05", rating: 1050 }, { date: "2025-06", rating: 1100 }] },
  { id: "p12", user_name: "TensorPilot", full_name: "Дарья Козлова", rating: 1080, avatar_url: null, bio: "Начинающий ML-практик.", city: "Воронеж", university: "ВГУ", company: null, github_url: null, kaggle_url: null, visible_to_employers: true, skill_nlp: 30, skill_cv: 35, skill_tabular: 65, skill_regression: 60, skill_classification: 50, skill_time_series: 40, duels_won: 6, duels_lost: 8, competitions_won: 0, competitions_participated: 1, rating_history: [{ date: "2025-01", rating: 750 }, { date: "2025-02", rating: 810 }, { date: "2025-03", rating: 880 }, { date: "2025-04", rating: 950 }, { date: "2025-05", rating: 1020 }, { date: "2025-06", rating: 1080 }] },
  { id: "p13", user_name: "AI_Glider", full_name: "Максим Андреев", rating: 1180, avatar_url: null, bio: "CV Engineer. Kaggle Expert.", city: "Москва", university: "МФТИ", company: "Wildberries", github_url: "#", kaggle_url: "#", visible_to_employers: true, skill_nlp: 40, skill_cv: 88, skill_tabular: 55, skill_regression: 50, skill_classification: 70, skill_time_series: 35, duels_won: 14, duels_lost: 9, competitions_won: 1, competitions_participated: 6, rating_history: [{ date: "2025-01", rating: 860 }, { date: "2025-02", rating: 930 }, { date: "2025-03", rating: 1000 }, { date: "2025-04", rating: 1060 }, { date: "2025-05", rating: 1120 }, { date: "2025-06", rating: 1180 }] },
  { id: "p14", user_name: "EpochRunner", full_name: "Наталья Захарова", rating: 1320, avatar_url: null, bio: "Staff ML Engineer. Специалист по Time Series.", city: "Москва", university: "МГУ", company: "T-Bank", github_url: "#", kaggle_url: "#", visible_to_employers: true, skill_nlp: 62, skill_cv: 48, skill_tabular: 82, skill_regression: 85, skill_classification: 76, skill_time_series: 94, duels_won: 28, duels_lost: 11, competitions_won: 4, competitions_participated: 14, rating_history: [{ date: "2025-01", rating: 1000 }, { date: "2025-02", rating: 1080 }, { date: "2025-03", rating: 1150 }, { date: "2025-04", rating: 1220 }, { date: "2025-05", rating: 1280 }, { date: "2025-06", rating: 1320 }] },
  { id: "p15", user_name: "KernelMaster", full_name: "Владимир Крылов", rating: 1260, avatar_url: null, bio: "ML Researcher. Люблю kernel методы.", city: "Казань", university: "КФУ", company: "Yandex", github_url: "#", kaggle_url: null, visible_to_employers: true, skill_nlp: 58, skill_cv: 62, skill_tabular: 88, skill_regression: 92, skill_classification: 80, skill_time_series: 68, duels_won: 20, duels_lost: 13, competitions_won: 2, competitions_participated: 9, rating_history: [{ date: "2025-01", rating: 920 }, { date: "2025-02", rating: 980 }, { date: "2025-03", rating: 1050 }, { date: "2025-04", rating: 1120 }, { date: "2025-05", rating: 1200 }, { date: "2025-06", rating: 1260 }] },
];

const COMPETITIONS = [
  { id: "c1", title: "Предсказание цен на недвижимость", description: "Датасет содержит 15 000 записей о продажах квартир в Москве. Задача — предсказать цену (в рублях) по характеристикам: площадь, этаж, район, год постройки, удалённость от метро, наличие парковки и др. Бейзлайн: линейная регрессия (RMSE ~ 2.5).", task_type: "regression", metric: "rmse", prize_fund: 150000, deadline: "2026-08-15", status: "active", participants_count: 47, company_name: "T-Bank", max_submits_free: 3, max_submits_pro: 10, data_url: "#", test_data_url: "#", rules: "Запрещено использовать данные из тестового набора. Разрешены ансамбли. Лимит 3 сабмита в день для Free.", banner_color: "#06B6D4", is_private: false },
  { id: "c2", title: "Классификация тональности отзывов", description: "5000 отзывов на русском языке с метками: позитив, негатив, нейтрально. Необходимо построить классификатор. Метрика — F1 (weighted).", task_type: "nlp", metric: "f1", prize_fund: 200000, deadline: "2026-09-01", status: "active", participants_count: 83, company_name: "Ozon", max_submits_free: 5, max_submits_pro: 15, data_url: "#", test_data_url: "#", rules: "Внешние предобученные модели разрешены. Fine-tuning допустим.", banner_color: "#EC4899", is_private: false },
  { id: "c3", title: "Детекция аномалий в транзакциях", description: "Синтетические данные банковских транзакций (100k записей). Класс дисбаланс ~ 1:100. Метрика — ROC-AUC.", task_type: "classification", metric: "roc_auc", prize_fund: 300000, deadline: "2026-07-20", status: "active", participants_count: 112, company_name: "T-Bank", max_submits_free: 5, max_submits_pro: 15, data_url: "#", test_data_url: "#", rules: "Разрешён undersampling/oversampling. Запрещено использовать future data.", banner_color: "#7C3AED", is_private: false },
  { id: "c4", title: "Сегментация изображений товаров", description: "Датасет из 10 000 изображений товаров на белом фоне. Задача — сегментация маски товара. Метрика — Dice.", task_type: "cv", metric: "f1", prize_fund: 250000, deadline: "2026-08-30", status: "active", participants_count: 35, company_name: "Wildberries", max_submits_free: 2, max_submits_pro: 8, data_url: "#", test_data_url: "#", rules: "Только открытые предобученные модели. Размер модели ≤ 500MB.", banner_color: "#F59E0B", is_private: false },
  { id: "c5", title: "Прогноз временного ряда — спрос на такси", description: "Почасовые данные за 2 года. Предсказать количество заказов такси на следующий час. Метрика — MAE.", task_type: "tabular", metric: "mae", prize_fund: 100000, deadline: "2026-10-01", status: "draft", participants_count: 0, company_name: "Yandex", max_submits_free: 5, max_submits_pro: 12, data_url: "#", test_data_url: "#", rules: "Стандартные правила.", banner_color: "#10B981", is_private: false },
  { id: "c6", title: "Распознавание рукописных цифр (МNIST-style)", description: "Датасет из 70 000 изображений 28×28. Классическая задача — 10 классов.", task_type: "cv", metric: "accuracy", prize_fund: 50000, deadline: "2026-06-15", status: "completed", participants_count: 205, company_name: "ML Арена", max_submits_free: 10, max_submits_pro: 20, data_url: "#", test_data_url: "#", rules: "Без использования внешних данных.", banner_color: "#F59E0B", is_private: false },
  { id: "c7", title: "RL: Управление маятником", description: "Среда OpenAI Gym. Задача — удержать маятник в вертикальном положении. Метрика — средняя награда за эпизод.", task_type: "regression", metric: "mse", prize_fund: 80000, deadline: "2026-05-01", status: "completed", participants_count: 28, company_name: "Sber", max_submits_free: 3, max_submits_pro: 10, data_url: "#", test_data_url: "#", rules: "Алгоритм on-policy. Бюджет шагов: 100k.", banner_color: "#06B6D4", is_private: false },
  { id: "c8", title: "Предсказание оттока клиентов телекома", description: "Данные о клиентах телеком-компании: 20 признаков, бинарная цель (ушел/остался). Метрика — ROC-AUC.", task_type: "tabular", metric: "roc_auc", prize_fund: 0, deadline: "2026-11-01", status: "active", participants_count: 56, company_name: "VK", max_submits_free: 5, max_submits_pro: 15, data_url: "#", test_data_url: "#", rules: "Стандартные правила.", banner_color: "#10B981", is_private: false },
  { id: "c9", title: "NER для медицинских текстов", description: "Извлечение сущностей: болезнь, лекарство, дозировка, процедура. Русскоязычные тексты. Метрика — F1.", task_type: "nlp", metric: "f1", prize_fund: 180000, deadline: "2026-09-15", status: "active", participants_count: 41, company_name: "Yandex", max_submits_free: 3, max_submits_pro: 10, data_url: "#", test_data_url: "#", rules: "Только BERT-based модели. Запрещён ChatGPT/GPT-4.", banner_color: "#EC4899", is_private: false },
  { id: "c10", title: "Приватный турнир: CV для беспилотников", description: "Закрытый турнир для команды Sber AI. Детекция пешеходов и знаков.", task_type: "cv", metric: "accuracy", prize_fund: 500000, deadline: "2026-12-31", status: "active", participants_count: 12, company_name: "Sber", max_submits_free: 0, max_submits_pro: 20, data_url: "#", test_data_url: "#", rules: "Только по приглашениям.", banner_color: "#F59E0B", is_private: true },
];

const SUBMISSIONS = [
  { id: "s1", competition_id: "c1", user_name: "AI_Ninja", user_avatar: null, file_url: "#", score: 1.82, status: "evaluated", attempt_number: 3, created_date: "2026-06-10" },
  { id: "s2", competition_id: "c1", user_name: "DataWizard", user_avatar: null, file_url: "#", score: 1.95, status: "evaluated", attempt_number: 2, created_date: "2026-06-09" },
  { id: "s3", competition_id: "c1", user_name: "TensorLord", user_avatar: null, file_url: "#", score: 2.01, status: "evaluated", attempt_number: 5, created_date: "2026-06-08" },
  { id: "s4", competition_id: "c1", user_name: "NeuralFox", user_avatar: null, file_url: "#", score: 2.15, status: "evaluated", attempt_number: 1, created_date: "2026-06-07" },
  { id: "s5", competition_id: "c1", user_name: "ML_Glider", user_avatar: null, file_url: "#", score: 2.22, status: "evaluated", attempt_number: 4, created_date: "2026-06-06" },
  { id: "s6", competition_id: "c1", user_name: "EpochRunner", user_avatar: null, file_url: "#", score: 2.31, status: "evaluated", attempt_number: 2, created_date: "2026-06-05" },
  { id: "s7", competition_id: "c1", user_name: "KernelMaster", user_avatar: null, file_url: "#", score: 2.45, status: "evaluated", attempt_number: 6, created_date: "2026-06-04" },
  { id: "s8", competition_id: "c1", user_name: "DeepSeeker", user_avatar: null, file_url: "#", score: 2.50, status: "evaluated", attempt_number: 1, created_date: "2026-06-03" },
  { id: "s9", competition_id: "c2", user_name: "DataWizard", user_avatar: null, file_url: "#", score: 0.924, status: "evaluated", attempt_number: 3, created_date: "2026-06-12" },
  { id: "s10", competition_id: "c2", user_name: "AI_Ninja", user_avatar: null, file_url: "#", score: 0.911, status: "evaluated", attempt_number: 2, created_date: "2026-06-11" },
  { id: "s11", competition_id: "c2", user_name: "DataRacer", user_avatar: null, file_url: "#", score: 0.895, status: "evaluated", attempt_number: 5, created_date: "2026-06-10" },
  { id: "s12", competition_id: "c3", user_name: "TensorLord", user_avatar: null, file_url: "#", score: 0.978, status: "evaluated", attempt_number: 4, created_date: "2026-06-14" },
  { id: "s13", competition_id: "c3", user_name: "NeuralFox", user_avatar: null, file_url: "#", score: 0.965, status: "evaluated", attempt_number: 3, created_date: "2026-06-13" },
  { id: "s14", competition_id: "c3", user_name: "BinaryBrain", user_avatar: null, file_url: "#", score: 0.942, status: "evaluated", attempt_number: 6, created_date: "2026-06-12" },
  { id: "s15", competition_id: "c6", user_name: "AI_Ninja", user_avatar: null, file_url: "#", score: 0.996, status: "evaluated", attempt_number: 8, created_date: "2026-04-10" },
  { id: "s16", competition_id: "c6", user_name: "TensorLord", user_avatar: null, file_url: "#", score: 0.994, status: "evaluated", attempt_number: 6, created_date: "2026-04-09" },
  { id: "s17", competition_id: "c6", user_name: "NeuralFox", user_avatar: null, file_url: "#", score: 0.991, status: "evaluated", attempt_number: 5, created_date: "2026-04-08" },
  { id: "s18", competition_id: "c6", user_name: "GradientHero", user_avatar: null, file_url: "#", score: 0.987, status: "evaluated", attempt_number: 10, created_date: "2026-04-07" },
  { id: "s19", competition_id: "c6", user_name: "LossMin", user_avatar: null, file_url: "#", score: 0.985, status: "evaluated", attempt_number: 4, created_date: "2026-04-06" },
  { id: "s20", competition_id: "c8", user_name: "EpochRunner", user_avatar: null, file_url: "#", score: 0.912, status: "evaluated", attempt_number: 2, created_date: "2026-06-15" },
];

const DISCUSSIONS = [
  { id: "d1", competition_id: "c1", title: "Бейзлайн и препроцессинг", content: "Ребята, кто какой препроцессинг делал? Я удалил выбросы по цене > 3 сигм и сделал log-трансформацию. RMSE упал с 3.1 до 2.8.", author_name: "ML_Glider", author_avatar: null, comments_count: 8, created_date: "2026-06-01" },
  { id: "d2", competition_id: "c1", title: "Какие признаки самые важные?", content: "Сделал feature importance через RandomForest. Топ-3: общая площадь, этаж, расстояние до метро. Кто какие фичи добавлял?", author_name: "NeuralFox", author_avatar: null, comments_count: 12, created_date: "2026-05-28" },
  { id: "d3", competition_id: "c2", title: "Предобработка текста", content: "Кто как чистит текст? Я удаляю стоп-слова, привожу к нижнему регистру, лемматизирую через pymorphy2.", author_name: "DataWizard", author_avatar: null, comments_count: 6, created_date: "2026-06-05" },
  { id: "d4", competition_id: "c3", title: "Как бороться с дисбалансом?", content: "Дисбаланс 1:100 — пробовал SMOTE, но качество на валидации нестабильное. Кто что использует?", author_name: "TensorLord", author_avatar: null, comments_count: 15, created_date: "2026-06-02" },
  { id: "d5", competition_id: "c4", title: "Аугментации для товаров", content: "Какие аугментации работают для сегментации товаров? Я пробовал random flip, rotation, brightness.", author_name: "AI_Glider", author_avatar: null, comments_count: 4, created_date: "2026-06-08" },
  { id: "d6", competition_id: "c6", title: "Какая архитектура лучше?", content: "Простые CNN vs ResNet? На таком маленьком датасете CNN даёт 0.99, а ResNet 0.993 — стоит ли овчинка выделки?", author_name: "GradientHero", author_avatar: null, comments_count: 9, created_date: "2026-03-15" },
  { id: "d7", competition_id: "c9", title: "NER для лекарств", content: "Коллеги, кто какие модели пробовал? RuBERT даёт F1 ~ 0.88, но хочется выше 0.92.", author_name: "DataWizard", author_avatar: null, comments_count: 7, created_date: "2026-06-10" },
  { id: "d8", competition_id: "c8", title: "Feature engineering для оттока", content: "Сделал features: частота транзакций, средний чек, дней с последнего обращения. ROC-AUC 0.89 на локальной валидации.", author_name: "EpochRunner", author_avatar: null, comments_count: 5, created_date: "2026-06-12" },
];

const DUELS = [
  { id: "du1", player1_name: "Ты", player1_rating: 1000, player1_avatar: null, player1_score: 0.92, player1_file_url: "#", player1_submitted_at: "2026-06-15T10:00:00Z", player2_name: "AI_Ninja", player2_rating: 1580, player2_avatar: null, player2_score: 0.95, player2_file_url: "#", player2_submitted_at: "2026-06-15T10:30:00Z", status: "completed", winner_name: "AI_Ninja", rating_change: 8, task_title: "Классификация тональности", task_description: "Определи тональность отзыва (позитив/негатив). Метрика — Accuracy.", task_type: "nlp", metric: "accuracy", started_at: "2026-06-15T09:00:00Z", duration_minutes: 60, dataset_url: "#" },
  { id: "du2", player1_name: "Ты", player1_rating: 1000, player1_avatar: null, player1_score: 0.88, player1_file_url: "#", player1_submitted_at: "2026-06-14T14:00:00Z", player2_name: "DataWizard", player2_rating: 1520, player2_avatar: null, player2_score: 0.91, player2_file_url: "#", player2_submitted_at: "2026-06-14T14:20:00Z", status: "completed", winner_name: "DataWizard", rating_change: 5, task_title: "Регрессия цен", task_description: "Предскажи цены на дома по 12 признакам. Метрика — RMSE.", task_type: "regression", metric: "rmse", started_at: "2026-06-14T13:00:00Z", duration_minutes: 60, dataset_url: "#" },
  { id: "du3", player1_name: "Ты", player1_rating: 1000, player1_avatar: null, player1_score: 0.79, player1_file_url: "#", player1_submitted_at: "2026-06-13T11:00:00Z", player2_name: "NeuralFox", player2_rating: 1420, player2_avatar: null, player2_score: 0.72, player2_file_url: "#", player2_submitted_at: "2026-06-13T11:45:00Z", status: "completed", winner_name: "Ты", rating_change: 20, task_title: "Детекция мошенничества", task_description: "Бинарная классификация транзакций. Метрика — ROC-AUC.", task_type: "classification", metric: "roc_auc", started_at: "2026-06-13T10:00:00Z", duration_minutes: 60, dataset_url: "#" },
  { id: "du4", player1_name: "Ты", player1_rating: 1000, player1_avatar: null, player1_score: null, player1_file_url: null, player1_submitted_at: null, player2_name: "TensorLord", player2_rating: 1480, player2_avatar: null, player2_score: null, player2_file_url: null, player2_submitted_at: null, status: "active", winner_name: null, rating_change: 0, task_title: "Сегментация изображений", task_description: "Выдели маску объекта на изображении. Метрика — Dice (F1).", task_type: "cv", metric: "f1", started_at: new Date().toISOString(), duration_minutes: 60, dataset_url: "#" },
  { id: "du5", player1_name: "Ты", player1_rating: 1000, player1_avatar: null, player1_score: 0.85, player1_file_url: "#", player1_submitted_at: "2026-06-10T16:00:00Z", player2_name: "ML_Glider", player2_rating: 1180, player2_avatar: null, player2_score: 0.82, player2_file_url: "#", player2_submitted_at: "2026-06-10T16:30:00Z", status: "completed", winner_name: "Ты", rating_change: 15, task_title: "Прогноз временного ряда", task_description: "Предскажи следующий шаг временного ряда. Метрика — MAE.", task_type: "tabular", metric: "mae", started_at: "2026-06-10T15:00:00Z", duration_minutes: 60, dataset_url: "#" },
  { id: "du6", player1_name: "AI_Ninja", player1_rating: 1580, player1_avatar: null, player1_score: 0.94, player1_file_url: "#", player1_submitted_at: "2026-06-12T12:00:00Z", player2_name: "TensorLord", player2_rating: 1480, player2_avatar: null, player2_score: 0.91, player2_file_url: "#", player2_submitted_at: "2026-06-12T12:15:00Z", status: "completed", winner_name: "AI_Ninja", rating_change: 12, task_title: "CV: Классификация изображений", task_description: "Определи класс объекта на изображении. 10 классов.", task_type: "cv", metric: "accuracy", started_at: "2026-06-12T11:00:00Z", duration_minutes: 60, dataset_url: "#" },
  { id: "du7", player1_name: "DataWizard", player1_rating: 1520, player1_avatar: null, player1_score: 0.88, player1_file_url: "#", player1_submitted_at: "2026-06-11T09:00:00Z", player2_name: "NeuralFox", player2_rating: 1420, player2_avatar: null, player2_score: 0.90, player2_file_url: "#", player2_submitted_at: "2026-06-11T09:25:00Z", status: "completed", winner_name: "NeuralFox", rating_change: 18, task_title: "NLP: Определение языка", task_description: "Определи язык текста (русский/английский/казахский).", task_type: "nlp", metric: "accuracy", started_at: "2026-06-11T08:00:00Z", duration_minutes: 60, dataset_url: "#" },
];

const BADGES_DATA = [
  { id: "b1", user_name: "AI_Ninja", name: "Первая победа", description: "Одержал первую победу в турнире", color: "#FFD700", created_date: "2025-03-01" },
  { id: "b2", user_name: "AI_Ninja", name: "Гладиатор недели", description: "Самая высокая активность за неделю", color: "#7C3AED", created_date: "2025-06-01" },
  { id: "b3", user_name: "AI_Ninja", name: "10 дуэлей", description: "Провёл 10 дуэлей", color: "#06B6D4", created_date: "2025-05-15" },
  { id: "b4", user_name: "AI_Ninja", name: "Чемпион", description: "Занял 1 место в турнире", color: "#FF4444", created_date: "2025-04-20" },
  { id: "b5", user_name: "DataWizard", name: "Первая победа", description: "Одержал первую победу в турнире", color: "#FFD700", created_date: "2025-04-10" },
  { id: "b6", user_name: "DataWizard", name: "10 дуэлей", description: "Провёл 10 дуэлей", color: "#06B6D4", created_date: "2025-05-20" },
  { id: "b7", user_name: "TensorLord", name: "Первая победа", description: "Одержал первую победу в турнире", color: "#FFD700", created_date: "2025-03-15" },
  { id: "b8", user_name: "TensorLord", name: "Гладиатор недели", description: "Самая высокая активность за неделю", color: "#7C3AED", created_date: "2025-06-10" },
  { id: "b9", user_name: "NeuralFox", name: "Первая победа", description: "Одержал первую победу в турнире", color: "#FFD700", created_date: "2025-04-25" },
  { id: "b10", user_name: "NeuralFox", name: "Чемпион", description: "Занял 1 место в турнире", color: "#FF4444", created_date: "2025-06-05" },
  { id: "b11", user_name: "ML_Glider", name: "Первая победа", description: "Одержал первую победу в турнире", color: "#FFD700", created_date: "2025-05-30" },
  { id: "b12", user_name: "EpochRunner", name: "Первая победа", description: "Одержал первую победу в турнире", color: "#FFD700", created_date: "2025-05-10" },
  { id: "b13", user_name: "EpochRunner", name: "10 дуэлей", description: "Провёл 10 дуэлей", color: "#06B6D4", created_date: "2025-06-08" },
  { id: "b14", user_name: "KernelMaster", name: "Первая победа", description: "Одержал первую победу в турнире", color: "#FFD700", created_date: "2025-06-01" },
];

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

// In-memory stores
let store = {
  profiles: [...PROFILES],
  competitions: [...COMPETITIONS],
  submissions: [...SUBMISSIONS],
  discussions: [...DISCUSSIONS],
  duels: [...DUELS],
  badges: [...BADGES_DATA],
  jobInvites: [],
};

export const mockEntities = {
  MLProfile: {
    async get(id) {
      await delay(150);
      const profileId = id === "me" ? store.profiles[0]?.id : id;
      const p = store.profiles.find((x) => x.id === profileId);
      if (!p) throw new Error("Profile not found");
      return clone(p);
    },
    async list(sort, limit) {
      await delay(200);
      let arr = [...store.profiles];
      if (sort) {
        const dir = sort.startsWith("-") ? -1 : 1;
        const key = sort.replace(/^-/, "");
        arr.sort((a, b) => dir * ((a[key] || 0) > (b[key] || 0) ? 1 : -1));
      }
      if (limit) arr = arr.slice(0, limit);
      return clone(arr);
    },
    async filter(filters, sort, limit) {
      await delay(200);
      let arr = [...store.profiles];
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          arr = arr.filter((p) => p[k] === v);
        });
      }
      if (sort) {
        const dir = sort.startsWith("-") ? -1 : 1;
        const key = sort.replace(/^-/, "");
        arr.sort((a, b) => dir * ((a[key] || 0) > (b[key] || 0) ? 1 : -1));
      }
      if (limit) arr = arr.slice(0, limit);
      return clone(arr);
    },
  },
  Badge: {
    async filter(filters, sort, limit) {
      await delay(150);
      let arr = [...store.badges];
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          arr = arr.filter((b) => b[k] === v);
        });
      }
      if (sort) {
        const dir = sort.startsWith("-") ? -1 : 1;
        const key = sort.replace(/^-/, "");
        arr.sort((a, b) => dir * ((a[key] || "") > (b[key] || "") ? 1 : -1));
      }
      if (limit) arr = arr.slice(0, limit);
      return clone(arr);
    },
  },
  Competition: {
    async get(id) {
      await delay(150);
      const c = store.competitions.find((x) => x.id === id);
      if (!c) throw new Error("Competition not found");
      return clone(c);
    },
    async list(sort, limit) {
      await delay(200);
      let arr = [...store.competitions];
      if (sort) {
        const dir = sort.startsWith("-") ? -1 : 1;
        const key = sort.replace(/^-/, "");
        arr.sort((a, b) => dir * ((a[key] || "") > (b[key] || "") ? 1 : -1));
      }
      if (limit) arr = arr.slice(0, limit);
      return clone(arr);
    },
    async filter(filters, sort, limit) {
      await delay(200);
      let arr = [...store.competitions];
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          arr = arr.filter((c) => c[k] === v);
        });
      }
      if (sort) {
        const dir = sort.startsWith("-") ? -1 : 1;
        const key = sort.replace(/^-/, "");
        arr.sort((a, b) => dir * ((a[key] || "") > (b[key] || "") ? 1 : -1));
      }
      if (limit) arr = arr.slice(0, limit);
      return clone(arr);
    },
    async create(data) {
      await delay(200);
      const entry = { id: "c" + generateId(), ...data, created_date: new Date().toISOString() };
      store.competitions.unshift(entry);
      return clone(entry);
    },
    async delete(id) {
      await delay(150);
      store.competitions = store.competitions.filter((c) => c.id !== id);
      return { success: true };
    },
  },
  Submission: {
    async filter(filters, sort, limit) {
      await delay(150);
      let arr = [...store.submissions];
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          arr = arr.filter((s) => s[k] === v);
        });
      }
      if (sort) {
        const dir = sort.startsWith("-") ? -1 : 1;
        const key = sort.replace(/^-/, "");
        arr.sort((a, b) => dir * ((a[key] || 0) > (b[key] || 0) ? 1 : -1));
      }
      if (limit) arr = arr.slice(0, limit);
      return clone(arr);
    },
    async create(data) {
      await delay(200);
      const entry = { id: "s" + generateId(), ...data, created_date: new Date().toISOString() };
      store.submissions.unshift(entry);
      return clone(entry);
    },
  },
  Discussion: {
    async filter(filters, sort, limit) {
      await delay(150);
      let arr = [...store.discussions];
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          arr = arr.filter((d) => d[k] === v);
        });
      }
      if (sort) {
        const dir = sort.startsWith("-") ? -1 : 1;
        const key = sort.replace(/^-/, "");
        arr.sort((a, b) => dir * ((a[key] || "") > (b[key] || "") ? 1 : -1));
      }
      if (limit) arr = arr.slice(0, limit);
      return clone(arr);
    },
    async create(data) {
      await delay(200);
      const entry = { id: "d" + generateId(), ...data, created_date: new Date().toISOString(), comments_count: 0 };
      store.discussions.unshift(entry);
      return clone(entry);
    },
  },
  Duel: {
    async get(id) {
      await delay(150);
      const d = store.duels.find((x) => x.id === id);
      if (!d) throw new Error("Duel not found");
      return clone(d);
    },
    async list(sort, limit) {
      await delay(200);
      let arr = [...store.duels];
      if (sort) {
        const dir = sort.startsWith("-") ? -1 : 1;
        const key = sort.replace(/^-/, "");
        arr.sort((a, b) => dir * ((a[key] || "") > (b[key] || "") ? 1 : -1));
      }
      if (limit) arr = arr.slice(0, limit);
      return clone(arr);
    },
    async create(data) {
      await delay(200);
      const entry = { id: "du" + generateId(), created_date: new Date().toISOString(), ...data };
      store.duels.unshift(entry);
      return clone(entry);
    },
    async update(id, data) {
      await delay(150);
      const idx = store.duels.findIndex((d) => d.id === id);
      if (idx === -1) throw new Error("Duel not found");
      store.duels[idx] = { ...store.duels[idx], ...data };
      if (store.duels[idx].player1_file_url && store.duels[idx].player2_file_url) {
        const p1score = store.duels[idx].player1_score || 0;
        const p2score = store.duels[idx].player2_score || 0;
        const higher = ["accuracy", "roc_auc", "f1"].includes(store.duels[idx].metric);
        store.duels[idx].status = "completed";
        if (p1score === p2score) {
          const p1time = new Date(store.duels[idx].player1_submitted_at).getTime();
          const p2time = new Date(store.duels[idx].player2_submitted_at).getTime();
          store.duels[idx].winner_name = p1time <= p2time
            ? store.duels[idx].player1_name
            : store.duels[idx].player2_name;
        } else {
          store.duels[idx].winner_name = higher
            ? (p1score > p2score ? store.duels[idx].player1_name : store.duels[idx].player2_name)
            : (p1score < p2score ? store.duels[idx].player1_name : store.duels[idx].player2_name);
        }
        store.duels[idx].rating_change = Math.floor(Math.random() * 20) + 5;
      }
      return clone(store.duels[idx]);
    },
  },
  JobInvite: {
    async create(data) {
      await delay(150);
      const entry = { id: "ji" + generateId(), ...data, created_date: new Date().toISOString() };
      store.jobInvites.push(entry);
      return clone(entry);
    },
  },
};

export const mockCore = {
  UploadFile: async ({ file }) => {
    await delay(300);
    return { file_url: "#mock-upload-" + file?.name?.replace(/\.[^.]+$/, "") || "file" };
  },
  SendEmail: async ({ to, subject, body }) => {
    await delay(200);
    return { success: true };
  },
};

export const mockAuth = {
  me: async () => {
    await delay(100);
    return { id: "mock-user", email: "user@example.com", role: "user" };
  },
};
