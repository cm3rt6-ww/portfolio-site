/* Замените примеры своими данными. Пустые поля email, telegram, url и image можно оставить пустыми. */
window.PORTFOLIO_CONTENT = {
  name: 'Идрис',
  heroIntro: 'Привет, я Идрис. Здесь собраны мои идеи, проекты и истории, которыми хочется поделиться.',
  aboutLead: 'У каждой работы есть история. Здесь можно рассказать свою.',
  aboutText: 'Поделитесь тем, чем вы занимаетесь, что вас вдохновляет и какие проекты вам особенно интересны. Несколько искренних слов помогут людям узнать вас лучше.',

  /* Ссылку url и путь к изображению image можно указать позднее.
     Для реальных проектов измените placeholder на false. */
  projects: [
    { title: 'Проект 01', category: 'Видеопроект', description: 'Посмотрите видео проекта.', url: '', image: '', video: 'assets/project-01.mp4', placeholder: false },
    { title: 'Проект 02', category: 'Ваш проект', description: 'Расскажите, какая идея стоит за этим проектом.', url: '', image: '', placeholder: true },
    { title: 'Проект 03', category: 'Ваш проект', description: 'Здесь может быть ещё одна ваша работа.', url: '', image: '', placeholder: true }
  ],

  /* Добавляйте только настоящие отзывы, например:
     { text: 'Текст отзыва', author: 'Имя автора', detail: 'Название проекта' } */
  reviews: [],

  /* Примеры формата: 'hello@example.com' и 'https://t.me/username'. */
  email: '',
  telegram: 'https://t.me/Idriscode'
};
