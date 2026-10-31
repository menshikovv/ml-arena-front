# Обращения из форм: контракт для backend

Это требования к реализации, а не подтверждение работающих серверных ручек.
Frontend подключён к контракту ниже. Backend в этой задаче не изменялся.
Без этих API формы показывают ошибку, а не фиктивную успешную отправку.

## Объём

Три формы должны попадать в единую очередь админки «Обращения»:

| Форма | Endpoint | kind в админке |
|---|---|---|
| Поддержка /support | POST /api/v1/support/requests | support |
| Сотрудничество /companies | POST /api/v1/cooperation/leads | cooperation |
| «Провести соревнование» /competitions | POST /api/v1/cooperation/leads | competition_request |

Регистрация, вход, отправки CSV, модерация соревнований/метрик/достижений,
жалобы и заявки на участие остаются в собственных рабочих процессах.
Это не сообщения в очередь обращений. Почтовые ссылки сами по себе также
не создают запись: для входящей почты нужна отдельная интеграция.

## Общие требования

- HTTPS, JSON; Authorization: Bearer <access_token> на всех перечисленных ручках.
  Сейчас формы доступны только после входа. user_id брать из токена, не из тела.
- Для отдельного frontend-origin разрешить в CORS заголовки Authorization,
  Content-Type, X-Request-ID, Idempotency-Key, методы GET/POST/PATCH/OPTIONS
  и credentials только для доверенных origins, не для wildcard.
- Создание сохраняет обращение в БД; успешный ответ только после commit.
- Создание принимает обязательный Idempotency-Key (UUID). Один ключ + пользователь
  + endpoint + идентичное тело возвращают ту же квитанцию без второй записи.
  Хранить ключи минимум 24 часа. Другой payload с тем же ключом: 409
  inquiry_idempotency_conflict. Параллельные запросы также не создают дубликаты.
- Frontend повторяет ключ при повторной отправке неизменённой формы и меняет
  его при изменении payload или после успешной отправки. В localStorage формы не сохраняются.
- Rate limiting на создание по пользователю/IP, лимит длины тела, серверная
  валидация, запрет неизвестных полей. Не доверять клиентским consent/source.
- Персональные данные и тексты доступны только разрешённым сотрудникам.
  Не помещать содержимое форм, email, заметки и токены в технические логи.
- Не отправлять HTML из обращений как доверенный markup.

Успешное создание: 201 (при повторе допустим 200):

```json
{
  "data": {
    "id": "UUID",
    "status": "new",
    "created_at": "2026-10-31T12:00:00Z"
  },
  "meta": { "request_id": "..." }
}
```

Все три поля data обязательны: без квитанции frontend не показывает успех.
Приватные заметки/внутреннюю историю в квитанции не возвращать.

## 1. Поддержка

POST /api/v1/support/requests:

```json
{
  "category": "technical",
  "subject": "Не открывается рейтинг",
  "message": "После перехода на страницу появляется ошибка загрузки.",
  "reply_email": "person@example.com",
  "consent_privacy": true,
  "consent_document_version": "2026-08-14",
  "source": {
    "landing_path": "/support",
    "referrer": null,
    "utm_source": null,
    "utm_medium": null,
    "utm_campaign": null
  }
}
```

category: account_profile | technical | founder_season | privacy_legal | security.
subject: 5–120 символов после trim; message: 20–4000; reply_email: валидный email
до 254 символов. consent_privacy строго true. Версию согласия проверять по
актуальному документу, время получения фиксировать сервером.

## 2. Компании и запрос соревнования

POST /api/v1/cooperation/leads:

```json
{
  "request_type": "cooperation",
  "name": "Алексей",
  "company": "Пример",
  "email": "person@example.com",
  "role": "ML Lead",
  "goal": "Провести ML-соревнование",
  "comment": "Нужно обсудить соревнование по ранжированию.",
  "consent_privacy": true,
  "consent_marketing": false,
  "consent_document_version": "2026-08-14",
  "source": {
    "landing_path": "/companies",
    "referrer": null,
    "utm_source": null,
    "utm_medium": null,
    "utm_campaign": null
  }
}
```

- request_type: cooperation | competition_request; сервер сопоставляет с kind.
- name: 2–80; company: 2–160; email до 254; role: null либо до 120.
- Для cooperation goal принимает текущие значения формы:
  «Найти ML-специалистов», «Провести ML-соревнование»,
  «Проверить прикладную задачу»,
  «Развивать бренд работодателя среди ML-специалистов», «Другое».
- Для competition_request goal равен "competition", role: null,
  comment обязателен, 20–2000 символов. Для cooperation comment: null либо до 2000.
- consent_marketing отдельный bool, false не препятствует отправке.
- Согласие на обработку обязательно, как у поддержки.
- source: landing_path до 2000, referrer null либо http(s) URL до 2000,
  UTM nullable до 200 каждый. Это недоверенные аналитические метаданные,
  не основание для авторизации. Frontend не передаёт query/hash referrer.

## 3. Общая очередь администратора

Добавить права inquiries.read и inquiries.manage, выдачу их в GET /api/v1/admin/me
и назначение нужным ролям. inquiries.manage не заменяет inquiries.read.
Проверки обязательны на сервере, включая доступ к конкретной записи.

GET /api/v1/admin/inquiries?kind=support&status=new&q=рейтинг&limit=20&offset=0

- inquiries.read; kind/status/q необязательны, отсутствующий фильтр означает все.
- q: до 200 символов, поиск по теме, имени, компании и email; limit 1–100,
  offset >= 0. Стабильная сортировка created_at DESC, id DESC.
- Обязательный ответ: data массив, meta.total для выбранных фильтров.

```json
{
  "data": [{
    "id": "UUID",
    "kind": "support",
    "status": "new",
    "subject": "Не открывается рейтинг",
    "name": null,
    "company": null,
    "email": "person@example.com",
    "created_at": "2026-10-31T12:00:00Z"
  }],
  "meta": { "total": 1, "limit": 20, "offset": 0, "has_more": false, "request_id": "..." }
}
```

Для company-заявок subject сервер формирует из цели/типа обращения, чтобы список
не содержал безымянных строк; message = comment, email = email.
Для поддержки email = reply_email, message = message.

GET /api/v1/admin/inquiries/{id}: inquiries.read, data полный объект:

```json
{
  "data": {
    "id": "UUID",
    "kind": "support",
    "status": "new",
    "subject": "Не открывается рейтинг",
    "message": "После перехода на страницу появляется ошибка загрузки.",
    "email": "person@example.com",
    "name": null,
    "company": null,
    "role": null,
    "category": "technical",
    "goal": null,
    "user_id": "USER_UUID",
    "source": { "landing_path": "/support", "referrer": null, "utm_source": null, "utm_medium": null, "utm_campaign": null },
    "consent_privacy": true,
    "consent_marketing": false,
    "consent_document_version": "2026-08-14",
    "internal_note": null,
    "version": 1,
    "created_at": "2026-10-31T12:00:00Z",
    "updated_at": "2026-10-31T12:00:00Z",
    "history": []
  },
  "meta": { "request_id": "..." }
}
```

## 4. Обработка

PATCH /api/v1/admin/inquiries/{id}: inquiries.read + inquiries.manage.

```json
{ "status": "in_progress", "internal_note": "Связались с пользователем", "version": 1 }
```

- Статусы: new, in_progress, resolved, rejected. Разрешить смену между ними,
  включая повторное открытие. Не менять исходный текст/контакты этим endpoint.
- internal_note: null либо до 4000 после trim. Это заметка для сотрудников,
  НЕ отправка ответа пользователю. Email-ответы/переписка в текущий frontend не входят.
- version обязательна. Проверить её атомарно при UPDATE; при несовпадении
  409 inquiry_version_conflict без потери чужих изменений.
- При изменении увеличить version; ответ 200, data тот же полный объект, что GET.
- Атомарно записывать событие обработки и audit с actor, id, временем, статусами.
  history: [{ id, actor_user_id, actor_name, from_status, to_status, note, created_at }].
  Заметки истории остаются приватными, аудит не должен раскрывать их посторонним ролям.
- Для удаления/анонимизации и сроков хранения персональных данных нужна отдельная
  серверная политика; в текущем frontend кнопки удаления нет.

## Ошибки и приёмка

Стандартный envelope:

```json
{ "error": { "code": "inquiry_version_conflict", "message": "Обращение изменено", "request_id": "..." } }
```

401 сессия; 403 права; 404 запись отсутствует; 409 конфликт версии/идемпотентности;
422 валидация (можно field_errors); 429 ограничение частоты с Retry-After;
5xx ошибка сервера, без ложного успешного ответа.

Обязательные интеграционные проверки:
1. Все три формы создают ровно одну запись и видны с правильным kind в очереди.
2. Пустые/слишком длинные поля, неверный email, отсутствие согласия отклоняются.
3. Повтор и параллельный повтор Idempotency-Key не создают дубликаты.
4. Обычный пользователь не читает очередь, детали, заметки и историю; read-only
   сотрудник не меняет статус. Поддельные user_id/права из тела не принимаются.
5. Поиск, тип, статус, общее число и пагинация согласованы.
6. PATCH сохраняет статус/заметку и историю; конкурирующая версия получает 409.
7. Ошибка БД не возвращает 201; уведомление сотрудникам (если нужно) отправляется
   через outbox после сохранения и не теряет обращение при недоступной почте.

Задачу можно считать закрытой end-to-end после серверной реализации, миграции,
выдачи прав сотрудникам и проверки на стенде без тестовых перехватов API.
